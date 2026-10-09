import { abortReason } from '@/lib/utils/abort';

/**
 * Resolves after `ms` milliseconds. If `signal` aborts first, the timer is cleared and the promise
 * rejects with the abort reason (see `abortReason`).
 */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (!signal) {
      setTimeout(resolve, ms);
      return;
    }
    if (signal.aborted) {
      reject(abortReason(signal));
      return;
    }

    const onAbort = (): void => {
      clearTimeout(timer);
      reject(abortReason(signal));
    };

    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    signal.addEventListener('abort', onAbort, { once: true });
  });
}
