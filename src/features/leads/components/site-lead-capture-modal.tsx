"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useState,
  type ComponentPropsWithoutRef,
} from "react";
import { Check, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { brand } from "@/config/brand";
import { LeadCaptureForm } from "@/features/leads/components/lead-capture-form";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "prowin-lead-popup";
const DELAY_MS = 12_000;
const OPEN_EVENT = "prowin:open-lead-modal";

export type OpenLeadOptions = {
  leadSource?: string;
  campaign?: string;
  propertyId?: string;
};

function alreadyAutoShown(): boolean {
  try {
    return Boolean(sessionStorage.getItem(STORAGE_KEY));
  } catch {
    return false;
  }
}

function markAutoShown() {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // ignore
  }
}

/** Open the sitewide lead modal from any CTA. */
export function dispatchOpenLeadModal(options?: OpenLeadOptions) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(OPEN_EVENT, { detail: options ?? {} }),
  );
}

export function useSiteLead() {
  return {
    openLeadModal: (options?: OpenLeadOptions) =>
      dispatchOpenLeadModal(options),
  };
}

/**
 * Drop-in CTA that opens the sitewide lead modal instead of navigating.
 */
export function LeadModalCta({
  children,
  className,
  leadSource = "cta",
  campaign,
  propertyId,
  onClick,
  ...props
}: ComponentPropsWithoutRef<"button"> & OpenLeadOptions) {
  return (
    <button
      type="button"
      className={className}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        dispatchOpenLeadModal({ leadSource, campaign, propertyId });
      }}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Sitewide lead modal host — mount once in PublicSiteShell.
 * Does not wrap page content (avoids RSC hydration issues).
 */
export function SiteLeadCaptureProvider() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [options, setOptions] = useState<OpenLeadOptions>({
    leadSource: "site_popup",
    campaign: "timed-12s",
  });

  const openLeadModal = useCallback((next?: OpenLeadOptions) => {
    setOptions({
      leadSource: next?.leadSource ?? "cta",
      campaign: next?.campaign,
      propertyId: next?.propertyId,
    });
    setSubmitted(false);
    setOpen(true);
  }, []);

  useEffect(() => {
    function onEvent(e: Event) {
      const detail = (e as CustomEvent<OpenLeadOptions>).detail;
      openLeadModal(detail);
    }
    window.addEventListener(OPEN_EVENT, onEvent);
    return () => window.removeEventListener(OPEN_EVENT, onEvent);
  }, [openLeadModal]);

  useEffect(() => {
    if (alreadyAutoShown()) return;
    const timer = window.setTimeout(() => {
      markAutoShown();
      openLeadModal({ leadSource: "site_popup", campaign: "timed-12s" });
    }, DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [openLeadModal]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) markAutoShown();
        setOpen(next);
        if (!next) {
          window.setTimeout(() => setSubmitted(false), 300);
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-h-[92vh] overflow-y-auto border-0 bg-transparent p-0 shadow-none sm:max-w-[820px]"
      >
        <div className="overflow-hidden rounded-[4px] bg-white shadow-[0_32px_90px_rgba(20,20,20,0.35)]">
          <div className="grid md:grid-cols-[0.9fr_1.1fr]">
            <div className="relative hidden min-h-[480px] md:block">
              <Image
                src="/images/hero-dubai-skyline.png"
                alt=""
                fill
                className="object-cover"
                sizes="400px"
                priority={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/75 to-ink/30" />
              <div className="relative z-10 flex h-full flex-col justify-between p-8 text-white">
                <Image
                  src={brand.logoOnDark}
                  alt={brand.name}
                  width={240}
                  height={100}
                  quality={100}
                  sizes="200px"
                  style={{ width: "auto", height: 67 }}
                  className="h-[67px] w-auto object-contain object-left brightness-0 invert"
                />
                <div>
                  <p className="font-display text-[1.75rem] leading-tight tracking-[-0.01em]">
                    Your Dubai property search, guided.
                  </p>
                  <ul className="mt-5 space-y-2.5 text-sm text-white/85">
                    {[
                      "Off-plan & ready homes curated for you",
                      "Clear budgets and payment-plan advice",
                      "Callback within working hours",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <Check
                          className="mt-0.5 size-4 shrink-0 text-gold"
                          strokeWidth={2}
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="relative px-5 py-6 sm:px-7 sm:py-8">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute top-3.5 right-3.5 flex size-9 items-center justify-center rounded-[3px] border border-line text-slate transition hover:border-ink/25 hover:bg-mist hover:text-ink"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>

              {submitted ? (
                <div className="flex min-h-[320px] flex-col justify-center pr-8">
                  <DialogTitle className="font-display text-[1.65rem] leading-tight text-ink">
                    Thank you
                  </DialogTitle>
                  <DialogDescription className="mt-2 text-sm leading-relaxed text-slate">
                    We have your details. A Prowin consultant will call you back
                    during working hours.
                  </DialogDescription>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="mt-6 h-11 w-full rounded-[3px] bg-red text-[15px] font-semibold text-white transition hover:bg-red-dark"
                  >
                    Continue browsing
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-[11px] font-semibold tracking-[0.18em] text-red uppercase">
                    Free consultation
                  </p>
                  <DialogTitle className="mt-2 pr-10 font-display text-[1.65rem] leading-tight text-ink">
                    Looking to buy in Dubai?
                  </DialogTitle>
                  <DialogDescription className="mt-2 text-sm leading-relaxed text-slate">
                    Tell us what you need — we&apos;ll match the right homes and
                    call you back.
                  </DialogDescription>

                  <div className="mt-5">
                    <LeadCaptureForm
                      leadSource={options.leadSource ?? "site_popup"}
                      campaign={options.campaign}
                      propertyId={options.propertyId}
                      className="space-y-3"
                      onSuccess={() => {
                        markAutoShown();
                        setSubmitted(true);
                      }}
                    />
                  </div>

                  <p className="mt-3 text-center text-[11px] text-slate/80">
                    RERA registered · No spam · Working-hours reply
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function leadModalCtaClassName(...parts: Array<string | undefined>) {
  return cn(...parts);
}
