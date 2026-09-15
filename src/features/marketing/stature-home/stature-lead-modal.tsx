"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { StatureLeadForm } from "@/features/marketing/stature-home/stature-lead-form";

type LeadContextValue = {
  openLead: (source?: string) => void;
  closeLead: () => void;
};

const LeadContext = createContext<LeadContextValue | null>(null);

export function useStatureLead() {
  const ctx = useContext(LeadContext);
  if (!ctx) {
    return {
      openLead: () => {},
      closeLead: () => {},
    };
  }
  return ctx;
}

function shouldAutoOpenFromAds() {
  if (typeof window === "undefined") return false;
  if (sessionStorage.getItem("stature-lead-auto") === "1") return false;
  const q = new URLSearchParams(window.location.search);
  const source = (q.get("utm_source") || "").toLowerCase();
  return Boolean(
    q.get("lead") === "1" ||
      q.get("fbclid") ||
      q.get("gclid") ||
      source.includes("facebook") ||
      source === "fb" ||
      source.includes("google") ||
      source.includes("ig") ||
      source.includes("instagram"),
  );
}

export function StatureLeadProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState("website");
  const titleId = useId();

  const openLead = useCallback((nextSource = "website") => {
    setSource(nextSource);
    setOpen(true);
  }, []);

  const closeLead = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!shouldAutoOpenFromAds()) return;
    sessionStorage.setItem("stature-lead-auto", "1");
    setSource("ads");
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const value = useMemo(() => ({ openLead, closeLead }), [openLead, closeLead]);

  return (
    <LeadContext.Provider value={value}>
      {children}
      {open ? (
        <div className="stature-lead-overlay" role="presentation">
          <button
            type="button"
            className="stature-lead-backdrop"
            aria-label="Close enquiry form"
            onClick={closeLead}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="stature-lead-dialog"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="hp-eyebrow">Enquire</p>
                <h2 id={titleId}>Tell us what you need</h2>
                <p className="mt-2 text-sm text-slate">
                  One form for site visits, new launches and ad enquiries. We
                  call back on working days.
                </p>
              </div>
              <button
                type="button"
                className="stature-lead-close"
                onClick={closeLead}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <StatureLeadForm variant="light" source={source} />
          </div>
        </div>
      ) : null}
    </LeadContext.Provider>
  );
}

export function StatureLeadCta({
  children,
  source = "cta",
  className,
  onClick,
}: {
  children: ReactNode;
  source?: string;
  className?: string;
  onClick?: () => void;
}) {
  const { openLead } = useStatureLead();
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        onClick?.();
        openLead(source);
      }}
    >
      {children}
    </button>
  );
}
