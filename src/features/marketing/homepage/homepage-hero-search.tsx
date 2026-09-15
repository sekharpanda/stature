"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useSiteLead } from "@/features/leads/components/site-lead-capture-modal";

export function HomepageHeroSearch({
  placeholder,
}: {
  placeholder: string;
}) {
  const router = useRouter();
  const { openLeadModal } = useSiteLead();
  const [tab, setTab] = useState<"Off-Plan" | "Buy" | "Rent">("Off-Plan");
  const [q, setQ] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (tab === "Rent") {
      // No rent inventory yet — capture intent as a lead.
      openLeadModal({ leadSource: "hero_rent", campaign: "homepage-hero" });
      return;
    }
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (tab === "Off-Plan") params.set("completion", "off-plan");
    router.push(`/properties?${params.toString()}`);
  }

  return (
    <form className="hp-search" role="search" onSubmit={onSubmit}>
      <div className="hp-tabs" role="tablist">
        {(["Off-Plan", "Buy", "Rent"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            className={`hp-tab${tab === t ? " on" : ""}`}
            onClick={() => setTab(t)}
            aria-label={t === "Rent" ? "Enquire to rent" : t}
          >
            {t === "Rent" ? "To rent" : t}
          </button>
        ))}
      </div>
      <label className="hp-search-field">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#8a8a8a"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={
            tab === "Rent"
              ? "Community or budget for your rental enquiry…"
              : placeholder
          }
          aria-label={tab === "Rent" ? "Rental enquiry details" : "Search location"}
          disabled={tab === "Rent"}
        />
      </label>
      <button type="submit" className="hp-go">
        {tab === "Rent" ? "Enquire" : "Search"}
      </button>
    </form>
  );
}

export function HomepageReveal({
  children,
  className = "",
  /** Immediate fade (hero) vs scroll-triggered (sections) */
  mode = "mount",
  delayMs = 0,
}: {
  children: React.ReactNode;
  className?: string;
  mode?: "mount" | "scroll";
  delayMs?: number;
}) {
  const [hydrated, setHydrated] = useState(false);
  const [inView, setInView] = useState(false);
  const [node, setNode] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return;
    }

    if (mode === "mount") {
      const t = window.setTimeout(() => setInView(true), 60 + delayMs);
      return () => window.clearTimeout(t);
    }

    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.16, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hydrated, mode, delayMs, node]);

  // SSR and the first client paint stay visible; only hide once JS is ready
  // to drive the reveal, so a failed/slow bundle never blanks the page.
  const pending = hydrated && !inView;

  return (
    <div
      ref={setNode}
      className={`hp-reveal${pending ? " hp-reveal--pending" : ""}${inView ? " in" : ""} ${className}`.trim()}
      style={delayMs && mode === "scroll" ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
