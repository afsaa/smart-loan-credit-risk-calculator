export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="mx-auto w-full max-w-4xl animate-pulse p-4">
      <span className="sr-only">Loading the calculator...</span>
      <div className="mx-auto mb-12 h-10 w-2/3 rounded bg-gray-200" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="h-96 rounded-lg bg-gray-200" />
        <div className="h-48 rounded-lg bg-gray-200" />
      </div>
    </div>
  );
}
