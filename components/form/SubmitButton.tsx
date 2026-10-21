'use client';

import { useFormStatus } from 'react-dom';

/** Must be rendered inside the `<form>`: `useFormStatus` only reports the status of a parent form. */
export function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
    >
      {pending ? 'Calculating...' : 'Calculate Risk & Schedule'}
    </button>
  );
}
