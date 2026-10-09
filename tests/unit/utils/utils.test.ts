import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { abortReason, throwIfAborted } from '@/lib/utils/abort';
import { assertNever } from '@/lib/utils/assert-never';
import { formatCurrency, formatPercent } from '@/lib/utils/format';
import { sleep } from '@/lib/utils/sleep';

describe('assertNever', () => {
  it('throws when an unexpected value reaches it at runtime', () => {
    expect(() => {
      Reflect.apply(assertNever, undefined, ['boat']);
    }).toThrow('Unexpected value: "boat"');
  });
});

describe('format', () => {
  it('formats USD with cents', () => {
    expect(formatCurrency(1580.1667)).toBe('$1,580.17');
    expect(formatCurrency(5_000_000)).toBe('$5,000,000.00');
  });

  it('formats ratios as percentages', () => {
    expect(formatPercent(0.065)).toBe('6.5%');
    expect(formatPercent(0.8)).toBe('80%');
  });
});

describe('abortReason / throwIfAborted', () => {
  it('returns Error reasons unchanged', () => {
    const controller = new AbortController();
    const reason = new Error('custom');
    controller.abort(reason);
    expect(abortReason(controller.signal)).toBe(reason);
  });

  it('defaults to an AbortError DOMException', () => {
    const controller = new AbortController();
    controller.abort();
    expect(abortReason(controller.signal)).toMatchObject({ name: 'AbortError' });
  });

  it('wraps non-Error reasons in an AbortError carrying the reason as message', () => {
    const controller = new AbortController();
    controller.abort('user cancelled');
    expect(abortReason(controller.signal)).toMatchObject({
      name: 'AbortError',
      message: 'user cancelled',
    });
  });

  it('throws only when aborted', () => {
    const controller = new AbortController();
    expect(() => {
      throwIfAborted(undefined);
      throwIfAborted(controller.signal);
    }).not.toThrow();
    controller.abort();
    expect(() => {
      throwIfAborted(controller.signal);
    }).toThrow(DOMException);
  });
});

describe('sleep', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves after the delay', async () => {
    const onResolve = vi.fn();
    const promise = sleep(1_000).then(onResolve);
    await vi.advanceTimersByTimeAsync(999);
    expect(onResolve).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await promise;
    expect(onResolve).toHaveBeenCalledOnce();
  });

  it('rejects immediately when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(sleep(1_000, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rejects on abort mid-delay and clears its timer', async () => {
    const controller = new AbortController();
    const promise = sleep(1_000, controller.signal);
    await vi.advanceTimersByTimeAsync(100);
    controller.abort();
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    expect(vi.getTimerCount()).toBe(0);
  });
});
