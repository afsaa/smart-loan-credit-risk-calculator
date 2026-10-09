/**
 * The error to reject/throw with when `signal` has aborted. `Error` reasons (including the default
 * `AbortError` and `AbortSignal.timeout`'s `TimeoutError` `DOMException`s) are returned unchanged;
 * any other custom reason is wrapped in an `AbortError` whose message is the stringified reason.
 */
export function abortReason(signal: AbortSignal): Error {
  const reason: unknown = signal.reason;
  return reason instanceof Error ? reason : new DOMException(String(reason), 'AbortError');
}

export function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    throw abortReason(signal);
  }
}
