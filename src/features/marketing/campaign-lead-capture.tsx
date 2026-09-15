"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Phone, ShieldCheck, Clock3, X } from "lucide-react";

import { captureLeadAction } from "@/actions/leads";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LandingCampaignConfig } from "@/types/landing-campaign";
import { landingThankYouPath } from "@/lib/landing-page-url";
import { cn } from "@/lib/utils";

export type LeadIntent =
  | "enquire"
  | "brochure"
  | "site-visit"
  | "price"
  | "callback";

type LeadContextValue = {
  openLead: (intent?: LeadIntent) => void;
};

const LeadContext = createContext<LeadContextValue | null>(null);

export function useCampaignLead() {
  const ctx = useContext(LeadContext);
  if (!ctx) {
    throw new Error("useCampaignLead must be used within CampaignLeadProvider");
  }
  return ctx;
}

const INTENT_COPY: Record<
  LeadIntent,
  { title: string; subtitle: string; submit: string; badge: string }
> = {
  enquire: {
    title: "Enquire now",
    subtitle: "Share your details — a Dubai consultant will call you shortly.",
    submit: "Submit enquiry",
    badge: "Instant callback",
  },
  brochure: {
    title: "Download Brochure & Price",
    subtitle:
      "Official brochure, floor plans & Phase 1 launch pricing — instantly",
    submit: "Get brochure & pricing →",
    badge: "Phase 1 pricing",
  },
  "site-visit": {
    title: "Book a site visit",
    subtitle: "Schedule a private viewing with our sales specialist.",
    submit: "Book site visit",
    badge: "Private viewing",
  },
  price: {
    title: "Request price details",
    subtitle: "Get unit-wise pricing and the latest payment plan options.",
    submit: "Get price list",
    badge: "Latest pricing",
  },
  callback: {
    title: "Request a callback",
    subtitle: "Our consultants typically respond within minutes.",
    submit: "Request callback",
    badge: "Priority callback",
  },
};

const COUNTRY_CODES = [
  { code: "+971", label: "UAE (+971)" },
  { code: "+91", label: "India (+91)" },
  { code: "+966", label: "KSA (+966)" },
  { code: "+974", label: "Qatar (+974)" },
  { code: "+965", label: "Kuwait (+965)" },
  { code: "+968", label: "Oman (+968)" },
  { code: "+44", label: "UK (+44)" },
  { code: "+1", label: "US (+1)" },
];

const LOOKING_FOR = [
  { value: "1br", label: "1 Bedroom apartment" },
  { value: "2br", label: "2 Bedroom apartment" },
  { value: "3br", label: "3 Bedroom apartment" },
  { value: "villa", label: "Villa / townhouse" },
  { value: "investment", label: "Investment opportunity" },
  { value: "undecided", label: "Still exploring" },
];

const CONNECT_OPTIONS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "call", label: "Phone call" },
  { value: "email", label: "Email" },
];

const fieldClass =
  "h-12 w-full rounded-[2px] border border-[#002117]/12 bg-[#F7F1E8] px-3.5 text-sm text-[#002117] outline-none transition placeholder:text-[#002117]/40 focus:border-[#B7945D] focus:ring-2 focus:ring-[#B7945D]/20";

async function submitLead({
  config,
  campaignSlug,
  campaignTitle,
  preview,
  values,
  intent,
}: {
  config: LandingCampaignConfig;
  campaignSlug: string;
  campaignTitle: string;
  preview?: boolean;
  intent: LeadIntent;
  values: {
    name: string;
    email: string;
    countryCode: string;
    phone: string;
    unit: string;
    connect?: string;
  };
}) {
  if (preview) throw new Error("Preview mode — form submit is disabled.");

  const phone = `${values.countryCode}${values.phone.replace(/\s/g, "")}`;
  const payload = {
    name: values.name,
    email: values.email || null,
    phone,
    interest: values.unit,
    source: "landing_campaign",
    landingPage: campaignSlug,
    campaign: campaignTitle,
    message: `Landing: ${campaignTitle} (${campaignSlug}) · Intent: ${intent}${
      values.connect ? ` · Connect: ${values.connect}` : ""
    }`,
  };

  const result = await captureLeadAction({
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    notes: payload.message,
    leadSource: payload.source,
    landingPage: payload.landingPage,
    campaign: campaignTitle,
    metadata: {
      interest: payload.interest,
      intent,
      connect: values.connect,
    },
  });
  if (!result.ok) throw new Error(result.error);

  const { conversionId, conversionLabel } = config.tracking;
  if (
    conversionId &&
    conversionLabel &&
    typeof window !== "undefined" &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof (window as any).gtag === "function"
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).gtag("event", "conversion", {
      send_to: `${conversionId}/${conversionLabel}`,
    });
  }
}

function LeadFields({
  config,
  campaignSlug,
  campaignTitle,
  preview,
  intent,
  variant = "default",
  onSuccess,
}: {
  config: LandingCampaignConfig;
  campaignSlug: string;
  campaignTitle: string;
  preview?: boolean;
  intent: LeadIntent;
  variant?: "default" | "hero";
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = INTENT_COPY[intent];
  const isHero = variant === "hero";
  const submitLabel = isHero
    ? config.hero.formSubmitLabel || copy.submit
    : copy.submit;
  const wa = config.whatsapp.replace(/[^\d]/g, "");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      await submitLead({
        config,
        campaignSlug,
        campaignTitle,
        preview,
        intent,
        values: {
          name: String(form.get("name") ?? "").trim(),
          email: String(form.get("email") ?? "").trim(),
          countryCode: String(form.get("countryCode") ?? "+971").trim(),
          phone: String(form.get("phone") ?? "").trim(),
          unit: String(form.get("unit") ?? "").trim(),
          connect: String(form.get("connect") ?? "").trim() || undefined,
        },
      });
      onSuccess?.();
      router.push(landingThankYouPath(campaignSlug));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
      setLoading(false);
    }
  }

  return (
    <form className={cn("space-y-3", isHero ? "mt-5" : "mt-6")} onSubmit={onSubmit}>
      <input
        className={fieldClass}
        placeholder="Full Name*"
        name="name"
        required
        minLength={2}
        autoComplete="name"
      />
      <div className="grid grid-cols-[118px_1fr] gap-2">
        <select
          className={fieldClass}
          name="countryCode"
          defaultValue="+971"
          aria-label="Country code"
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code === "+971"
                ? "AE +971"
                : c.code === "+91"
                  ? "IN +91"
                  : c.code}
            </option>
          ))}
        </select>
        <input
          className={fieldClass}
          placeholder="Phone number*"
          name="phone"
          required
          inputMode="tel"
          autoComplete="tel-national"
        />
      </div>
      <input
        className={fieldClass}
        placeholder="Email Address*"
        type="email"
        name="email"
        required
        autoComplete="email"
      />
      <select
        className={cn(fieldClass, "text-[#002117]/70")}
        name="unit"
        defaultValue=""
        required
      >
        <option value="" disabled>
          I&apos;m looking for...
        </option>
        {LOOKING_FOR.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {isHero ? (
        <select
          className={cn(fieldClass, "text-[#002117]/70")}
          name="connect"
          defaultValue="whatsapp"
        >
          <option value="" disabled>
            Preferred way to connect...
          </option>
          {CONNECT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-[2px] bg-[#B7945D] text-[11px] font-bold tracking-[0.14em] text-white uppercase shadow-[0_12px_28px_rgba(183,148,93,0.4)] transition hover:brightness-110 disabled:opacity-60"
      >
        {loading ? "Sending…" : submitLabel}
      </button>
      {isHero ? (
        <div className="space-y-2.5 pt-1 text-[11px] leading-relaxed text-[#002117]/55">
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[#B7945D]" />
            <span>100% confidential. Direct developer channel — No spam</span>
          </p>
          {wa ? (
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-[#128C7E] transition hover:underline"
            >
              <svg viewBox="0 0 24 24" className="size-3.5 fill-current" aria-hidden>
                <path d="M20.5 3.5A11 11 0 0 0 3.4 17.7L2 22l4.4-1.3A11 11 0 1 0 20.5 3.5zm-8.5 17a9 9 0 0 1-4.6-1.3l-.3-.2-2.6.8.8-2.5-.2-.3A9 9 0 1 1 12 20.5z" />
              </svg>
              Prefer WhatsApp? Chat with our NRI desk
            </a>
          ) : null}
        </div>
      ) : (
        <p className="text-center text-[11px] leading-relaxed text-[#002117]/45">
          By submitting, you agree to be contacted about this project. No spam.
        </p>
      )}
    </form>
  );
}

function TrustRow() {
  return (
    <div className="mt-5 grid grid-cols-3 gap-2 border-t border-[#002117]/08 pt-4">
      {[
        { icon: Clock3, label: "Reply in mins" },
        { icon: ShieldCheck, label: "RERA safe" },
        { icon: Phone, label: "WhatsApp ready" },
      ].map(({ icon: Icon, label }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-1 text-center text-[10px] tracking-wide text-[#002117]/55 uppercase"
        >
          <Icon className="size-3.5 text-[#A8895E]" strokeWidth={1.75} />
          {label}
        </div>
      ))}
    </div>
  );
}

/** Compact hero / inline form card */
export function CampaignLeadForm({
  config,
  campaignSlug,
  campaignTitle,
  preview,
  intent = "brochure",
  variant = "hero",
}: {
  config: LandingCampaignConfig;
  campaignSlug: string;
  campaignTitle: string;
  preview?: boolean;
  intent?: LeadIntent;
  variant?: "default" | "hero";
}) {
  return (
    <LeadFields
      config={config}
      campaignSlug={campaignSlug}
      campaignTitle={campaignTitle}
      preview={preview}
      intent={intent}
      variant={variant}
    />
  );
}

function LeadModal({
  open,
  onOpenChange,
  intent,
  config,
  campaignSlug,
  campaignTitle,
  preview,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  intent: LeadIntent;
  config: LandingCampaignConfig;
  campaignSlug: string;
  campaignTitle: string;
  preview?: boolean;
}) {
  const copy = INTENT_COPY[intent];
  const image =
    config.overview.imageUrl ||
    config.hero.imageUrl ||
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[92vh] overflow-y-auto border-0 bg-transparent p-0 shadow-none sm:max-w-[860px]"
      >
        <div className="overflow-hidden rounded-[4px] bg-white shadow-[0_40px_100px_rgba(0,0,0,0.45)]">
          <div className="grid md:grid-cols-[0.95fr_1.05fr]">
            <div className="relative hidden min-h-[420px] md:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt=""
                className="absolute inset-0 size-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#00150f] via-[#002117]/75 to-[#002117]/35" />
              <div className="relative z-10 flex h-full flex-col justify-end p-8 text-white">
                <span className="inline-flex w-fit rounded-[3px] bg-[#C4A484] px-3 py-1 text-[10px] font-bold tracking-[0.18em] text-[#002117] uppercase">
                  {copy.badge}
                </span>
                <p className="mt-4 font-display text-3xl leading-tight">
                  {config.brandName}
                </p>
                <ul className="mt-5 space-y-2.5 text-sm text-white/85">
                  {[
                    "Flexible payment plans",
                    "Prime Dubai location",
                    "Consultant reply in minutes",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-[#C4A484]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="relative px-6 py-7 md:px-8 md:py-9">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full border border-[#002117]/10 text-[#002117]/55 transition hover:bg-[#FAF3EA] hover:text-[#002117]"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>

              <DialogTitle className="font-display text-[1.85rem] leading-tight text-[#002117]">
                {copy.title}
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm leading-relaxed text-[#002117]/60">
                {copy.subtitle}
              </DialogDescription>

              <LeadFields
                config={config}
                campaignSlug={campaignSlug}
                campaignTitle={campaignTitle}
                preview={preview}
                intent={intent}
                onSuccess={() => onOpenChange(false)}
              />
              <TrustRow />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CampaignLeadProvider({
  children,
  config,
  campaignSlug,
  campaignTitle,
  preview,
}: {
  children: ReactNode;
  config: LandingCampaignConfig;
  campaignSlug: string;
  campaignTitle: string;
  preview?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [intent, setIntent] = useState<LeadIntent>("enquire");

  const openLead = useCallback((next: LeadIntent = "enquire") => {
    setIntent(next);
    setOpen(true);
  }, []);

  // Timed popup — once per session, after visitor browses ~12s
  useEffect(() => {
    if (preview) return;
    const key = `lead-popup:${campaignSlug}`;
    try {
      if (sessionStorage.getItem(key)) return;
    } catch {
      // ignore
    }
    const t = window.setTimeout(() => {
      setIntent("brochure");
      setOpen(true);
      try {
        sessionStorage.setItem(key, "1");
      } catch {
        // ignore
      }
    }, 12000);
    return () => window.clearTimeout(t);
  }, [campaignSlug, preview]);

  // Exit-intent (desktop)
  useEffect(() => {
    if (preview) return;
    const key = `lead-exit:${campaignSlug}`;
    const onLeave = (e: MouseEvent) => {
      if (e.clientY > 8) return;
      try {
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, "1");
      } catch {
        return;
      }
      setIntent("callback");
      setOpen(true);
    };
    document.addEventListener("mouseout", onLeave);
    return () => document.removeEventListener("mouseout", onLeave);
  }, [campaignSlug, preview]);

  const value = useMemo(() => ({ openLead }), [openLead]);

  return (
    <LeadContext.Provider value={value}>
      {children}
      <LeadModal
        open={open}
        onOpenChange={setOpen}
        intent={intent}
        config={config}
        campaignSlug={campaignSlug}
        campaignTitle={campaignTitle}
        preview={preview}
      />
    </LeadContext.Provider>
  );
}

export function LeadCta({
  intent = "enquire",
  children,
  outline = false,
  className,
  dark = false,
  solidWhiteText = false,
}: {
  intent?: LeadIntent;
  children: ReactNode;
  outline?: boolean;
  className?: string;
  /** Dark outline for use on light backgrounds */
  dark?: boolean;
  /** Gold fill with white label (reference Enquire / Get Brochure) */
  solidWhiteText?: boolean;
}) {
  const { openLead } = useCampaignLead();
  if (outline) {
    return (
      <button
        type="button"
        onClick={() => openLead(intent)}
        className={cn(
          "inline-flex items-center justify-center rounded-[2px] border px-6 py-3.5 text-[11px] font-bold tracking-[0.16em] uppercase transition",
          dark
            ? "border-[#002117]/35 text-[#002117] hover:bg-[#002117]/5"
            : "border-[#B7945D] text-white hover:bg-[#B7945D]/15",
          className,
        )}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={() => openLead(intent)}
      className={cn(
        "inline-flex items-center justify-center rounded-[2px] bg-[#B7945D] px-6 py-3.5 text-[11px] font-bold tracking-[0.16em] uppercase transition hover:brightness-110",
        solidWhiteText ? "text-white" : "text-[#002117]",
        className,
      )}
    >
      {children}
    </button>
  );
}
