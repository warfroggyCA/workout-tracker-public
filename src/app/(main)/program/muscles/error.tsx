"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Muscle coverage is unavailable</h1>
      <p className="my-4">
        Your Program could not be loaded. Try again when your connection is
        available.
      </p>
      <button className="min-h-11 rounded-md border px-4" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
