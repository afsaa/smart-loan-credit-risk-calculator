'use client';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div role="alert" className="mx-auto max-w-xl p-8 text-center">
      <h2 className="mb-2 text-2xl font-semibold text-gray-900">Something went wrong</h2>
      <p className="mb-6 text-gray-600">
        The calculator could not finish your request. Please try again.
      </p>
      {error.digest !== undefined && (
        <p className="mb-6 text-xs text-gray-500">Reference: {error.digest}</p>
      )}
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  );
}
