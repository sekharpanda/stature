import Link from "next/link";

import { LeadModalCta } from "@/features/leads/components/site-lead-capture-modal";
import { PublicSiteShellInstant } from "@/features/marketing/public-site-shell";

const SUGGESTIONS = [
  { href: "/properties", label: "Browse all properties" },
  { href: "/areas", label: "Explore Dubai by community" },
  { href: "/market-insights", label: "Read market insights" },
] as const;

export default function NotFound() {
  return (
    <PublicSiteShellInstant>
      <main className="mx-auto flex max-w-[1180px] flex-col items-center px-6 py-24 text-center md:py-32">
        <p className="text-xs font-semibold tracking-[0.28em] text-red uppercase">
          Error 404
        </p>
        <h1 className="mt-4 font-display text-4xl leading-tight tracking-[-0.02em] text-ink md:text-5xl">
          We couldn&apos;t find that page
        </h1>
        <p className="mt-4 max-w-xl text-base text-slate">
          The link may be out of date, or the property may no longer be listed.
          Here are a few places to pick up where you left off.
        </p>

        <div className="mt-10 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
          {SUGGESTIONS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-[3px] border border-line px-5 py-4 text-sm font-medium text-ink transition hover:border-red hover:text-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
            >
              {item.label}
            </Link>
          ))}
          <LeadModalCta
            leadSource="not_found_cta"
            campaign="404"
            className="rounded-[3px] border border-line px-5 py-4 text-sm font-medium text-ink transition hover:border-red hover:text-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
          >
            Talk to our team
          </LeadModalCta>
        </div>

        <Link
          href="/"
          className="mt-10 inline-flex items-center rounded-[3px] bg-red px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
        >
          Back to homepage
        </Link>
      </main>
    </PublicSiteShellInstant>
  );
}
