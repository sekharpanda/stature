"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-[1180px] flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-xs font-semibold tracking-[0.28em] text-red uppercase">
        Something went wrong
      </p>
      <h1 className="mt-4 font-display text-3xl leading-tight tracking-[-0.02em] text-ink md:text-4xl">
        We hit a problem loading this page
      </h1>
      <p className="mt-4 max-w-lg text-base text-slate">
        This is usually temporary. Try again, and if it keeps happening please
        get in touch and we&apos;ll help directly.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-[3px] bg-red px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-[3px] border border-ink px-6 py-3 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
        >
          Back to homepage
        </Link>
      </div>

      {error.digest ? (
        <p className="mt-8 text-xs text-slate">Reference: {error.digest}</p>
      ) : null}
    </main>
  );
}
