import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_LATENCY_MS, LATENCY_JITTER_MS, assessCredit } from '@/lib/credit/assess-credit';
import { isAbortError } from '@/lib/credit/errors';
import { scoreApplication } from '@/lib/credit/scoring';
import { personalApplication } from '@/tests/unit/fixtures/loan-applications';

const now = () => new Date('2026-10-09T12:00:00Z');

describe('assessCredit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves with the scored assessment after the configured latency', async () => {
    const application = personalApplication();
    const onSettled = vi.fn();
    const promise = assessCredit(application, { latencyMs: 500, random: () => 0.5, now });
    void promise.then(onSettled);

    await vi.advanceTimersByTimeAsync(499);
    expect(onSettled).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);

    const result = await promise;
    if (!result.ok) {
      throw new Error('expected a successful assessment');
    }
    const { score, level, factors } = scoreApplication(application, { referenceYear: 2026 });
    expect(result.assessment).toMatchObject({ score, level, factors });
    expect(result.assessment.recommendation).toContain('Illustratively');
  });

  it('derives the default latency from the injected random source', async () => {
    const onSettled = vi.fn();
    void assessCredit(personalApplication(), { random: () => 0.5, now }).then(onSettled);

    const latency = DEFAULT_LATENCY_MS + LATENCY_JITTER_MS / 2;
    await vi.advanceTimersByTimeAsync(latency - 1);
    expect(onSettled).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it('is deterministic under injection', async () => {
    const run = () =>
      assessCredit(personalApplication(), { latencyMs: 10, random: () => 0.3, now });
    const first = run();
    const second = run();
    await vi.advanceTimersByTimeAsync(10);
    expect(await first).toEqual(await second);
  });

  it('resolves a service_unavailable failure when the random draw is under the failure rate', async () => {
    const promise = assessCredit(personalApplication(), {
      latencyMs: 10,
      random: () => 0.1,
      failureRate: 0.2,
      now,
    });
    await vi.advanceTimersByTimeAsync(10);
    expect(await promise).toMatchObject({ ok: false, error: { kind: 'service_unavailable' } });
  });

  it('rejects immediately with an AbortError when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    const random = vi.fn(() => 0.5);

    const error: unknown = await assessCredit(personalApplication(), {
      signal: controller.signal,
      latencyMs: 1_000,
      random,
    }).catch((reason: unknown) => reason);

    expect(isAbortError(error)).toBe(true);
    expect(random).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rejects promptly when aborted mid-delay and clears the timer', async () => {
    const controller = new AbortController();
    const promise = assessCredit(personalApplication(), {
      signal: controller.signal,
      latencyMs: 1_000,
      random: () => 0.5,
    });
    const settled = promise.catch((reason: unknown) => reason);

    await vi.advanceTimersByTimeAsync(100);
    controller.abort();

    expect(isAbortError(await settled)).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('preserves a custom abort reason', async () => {
    const controller = new AbortController();
    const reason = new Error('superseded by a newer submission');
    const promise = assessCredit(personalApplication(), {
      signal: controller.signal,
      latencyMs: 1_000,
      random: () => 0.5,
    });
    const settled = promise.catch((error: unknown) => error);

    controller.abort(reason);
    expect(await settled).toBe(reason);
  });
});
