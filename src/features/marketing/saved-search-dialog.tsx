"use client";

import { useEffect, useState } from "react";
import { BellRing, Check, X } from "lucide-react";

import { saveSearchAction } from "@/actions/saved-searches";
import { cn } from "@/lib/utils";

export function SavedSearchDialog({
  open,
  onOpenChange,
  query,
  summary,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: Record<string, string | undefined>;
  summary: string;
}) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open) {
      setStatus("idle");
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const cleanQuery = Object.fromEntries(
    Object.entries(query).filter(([, value]) => Boolean(value)),
  ) as Record<string, string>;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="saved-search-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      <div className="w-full max-w-md rounded-[16px] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <BellRing className="size-5 text-red" aria-hidden="true" />
            <h2
              id="saved-search-title"
              className="text-lg font-semibold text-ink"
            >
              Get alerts for this search
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="rounded-full p-1.5 text-slate transition hover:bg-[#f3f4f6]"
          >
            <X className="size-4" />
          </button>
        </div>

        {status === "done" ? (
          <div className="mt-6 flex flex-col items-center gap-3 py-6 text-center">
            <span className="inline-flex size-11 items-center justify-center rounded-full bg-[#e8f6ed]">
              <Check className="size-5 text-[#1a8a45]" aria-hidden="true" />
            </span>
            <p className="text-sm text-ink" role="status">
              Saved. We&apos;ll email you when new listings match.
            </p>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="mt-2 rounded-[3px] border border-line px-5 py-2.5 text-sm font-medium text-ink transition hover:border-red hover:text-red"
            >
              Done
            </button>
          </div>
        ) : (
          <form
            className="mt-5 space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setStatus("saving");
              setError(null);

              const result = await saveSearchAction({
                email,
                name: summary,
                query: cleanQuery,
                website,
              });

              if (!result.ok) {
                setError(result.error);
                setStatus("idle");
                return;
              }
              setStatus("done");
              setEmail("");
            }}
          >
            <p className="rounded-[3px] bg-mist px-3 py-2.5 text-sm text-slate">
              {summary}
            </p>

            <div className="space-y-2">
              <label
                htmlFor="saved-search-email"
                className="text-sm font-medium text-ink"
              >
                Email address
              </label>
              <input
                id="saved-search-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="h-11 w-full rounded-[3px] border border-line px-3 text-sm text-ink outline-none focus-visible:border-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-red"
              />
            </div>

            <div aria-hidden="true" className="hidden">
              <label htmlFor="saved-search-website">Website</label>
              <input
                id="saved-search-website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
              />
            </div>

            {error ? (
              <p role="alert" className="text-sm text-red">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={status === "saving"}
              className={cn(
                "h-11 w-full rounded-[3px] bg-red text-sm font-semibold text-white transition hover:bg-red-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red",
                status === "saving" && "opacity-70",
              )}
            >
              {status === "saving" ? "Saving…" : "Create alert"}
            </button>

            <p className="text-xs text-slate">
              We&apos;ll only email you about matching listings. Unsubscribe any
              time.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
