import type { AssessmentError } from '@/types/loan';

/*
 * Failure model for `assessCredit`:
 * - Service failures resolve as values: `{ ok: false, error: AssessmentError }`.
 * - Cancellation rejects with the signal's reason (an `AbortError`, a `TimeoutError` from
 *   `AbortSignal.timeout`, or the custom `Error` passed to `abort()`; see `lib/utils/abort.ts`),
 *   so callers can tell "cancelled" apart from "failed".
 */

export function serviceUnavailableError(): AssessmentError {
  return {
    kind: 'service_unavailable',
    message: 'The credit assessment service is temporarily unavailable. Please try again.',
  };
}

export function isAbortError(error: unknown): error is DOMException {
  return (
    error instanceof DOMException && (error.name === 'AbortError' || error.name === 'TimeoutError')
  );
}
