import type { AssessmentResult, LoanApplication, RiskLevel } from '@/types/loan';
import { throwIfAborted } from '@/lib/utils/abort';
import { sleep } from '@/lib/utils/sleep';
import { serviceUnavailableError } from '@/lib/credit/errors';
import { scoreApplication } from '@/lib/credit/scoring';

export const DEFAULT_LATENCY_MS = 1_200;
export const LATENCY_JITTER_MS = 600;

export interface AssessCreditOptions {
  signal?: AbortSignal;
  /** Fixed simulated latency; defaults to `DEFAULT_LATENCY_MS` plus up to `LATENCY_JITTER_MS`. */
  latencyMs?: number;
  /** Source of randomness in [0, 1); inject for deterministic tests. */
  random?: () => number;
  /** Probability in [0, 1] of a simulated `service_unavailable` failure. Defaults to 0. */
  failureRate?: number;
  /** Clock used for time-dependent factors (vehicle age). */
  now?: () => Date;
}

const RECOMMENDATIONS = {
  low: 'Strong application. Illustratively, this profile would likely qualify for the best rate tier.',
  medium:
    'Moderate risk. Illustratively, reducing existing debt or increasing the down payment could improve the terms offered.',
  high: 'Elevated risk. Illustratively, consider a smaller loan amount, a co-signer, or improving your credit score before applying.',
} as const satisfies Record<RiskLevel, string>;

/**
 * Mock, illustrative credit assessment with simulated latency. Resolves with an
 * `AssessmentResult`; rejects with `signal.reason` if `signal` aborts (see `errors.ts`).
 */
export async function assessCredit(
  application: LoanApplication,
  options: AssessCreditOptions = {},
): Promise<AssessmentResult> {
  const { signal, random = Math.random, failureRate = 0, now = () => new Date() } = options;
  throwIfAborted(signal);

  const latencyMs =
    options.latencyMs ?? DEFAULT_LATENCY_MS + Math.round(random() * LATENCY_JITTER_MS);
  await sleep(latencyMs, signal);
  throwIfAborted(signal);

  if (random() < failureRate) {
    return { ok: false, error: serviceUnavailableError() };
  }

  const { score, level, factors } = scoreApplication(application, {
    referenceYear: now().getFullYear(),
  });
  return {
    ok: true,
    assessment: { score, level, factors, recommendation: RECOMMENDATIONS[level] },
  };
}
