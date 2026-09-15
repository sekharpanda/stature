"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { captureLeadAction } from "@/actions/leads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type LeadCaptureFormProps = {
  propertyId?: string;
  leadSource?: string;
  campaign?: string;
  className?: string;
  /** Styles for dark homepage callback panel */
  variant?: "default" | "homepage-dark";
  onSuccess?: () => void;
};

const COUNTRY_CODES = [
  { code: "+971", label: "AE +971", dial: "+971" },
  { code: "+91", label: "IN +91", dial: "+91" },
  { code: "+44", label: "UK +44", dial: "+44" },
  { code: "+1", label: "US +1", dial: "+1" },
  { code: "+966", label: "SA +966", dial: "+966" },
  { code: "+974", label: "QA +974", dial: "+974" },
  { code: "+965", label: "KW +965", dial: "+965" },
  { code: "+968", label: "OM +968", dial: "+968" },
  { code: "+973", label: "BH +973", dial: "+973" },
  { code: "+92", label: "PK +92", dial: "+92" },
  { code: "+880", label: "BD +880", dial: "+880" },
  { code: "+86", label: "CN +86", dial: "+86" },
  { code: "+7", label: "RU +7", dial: "+7" },
  { code: "+33", label: "FR +33", dial: "+33" },
  { code: "+49", label: "DE +49", dial: "+49" },
] as const;

const INTEREST_OPTIONS = [
  { value: "off-plan", label: "Off-plan" },
  { value: "ready", label: "Ready to move" },
  { value: "investment", label: "Investment" },
  { value: "unsure", label: "Not sure yet" },
] as const;

const BUDGET_OPTIONS = [
  { value: "", label: "Select budget" },
  { value: "under-1m", label: "Under AED 1M" },
  { value: "1-2m", label: "AED 1M – 2M" },
  { value: "2-5m", label: "AED 2M – 5M" },
  { value: "5-10m", label: "AED 5M – 10M" },
  { value: "10m-plus", label: "AED 10M+" },
] as const;

const TIMELINE_OPTIONS = [
  { value: "", label: "Select timeline" },
  { value: "asap", label: "As soon as possible" },
  { value: "1-3m", label: "1 – 3 months" },
  { value: "3-6m", label: "3 – 6 months" },
  { value: "6m-plus", label: "6+ months" },
  { value: "browsing", label: "Just browsing" },
] as const;

/** Popular Dubai communities for multi-select preference. */
const DUBAI_AREAS = [
  "Al Barsha",
  "Al Furjan",
  "Arabian Ranches",
  "Arabian Ranches 2",
  "Arjan",
  "Barsha Heights (Tecom)",
  "Bluewaters Island",
  "Business Bay",
  "City Walk",
  "Damac Hills",
  "Damac Hills 2",
  "DIFC",
  "Discovery Gardens",
  "Downtown Dubai",
  "Dubai Creek Harbour",
  "Dubai Harbour",
  "Dubai Hills Estate",
  "Dubai Investment Park (DIP)",
  "Dubai Islands",
  "Dubai Marina",
  "Dubai South",
  "Dubailand",
  "Emaar Beachfront",
  "Expo City",
  "International City",
  "Jebel Ali",
  "Jumeirah",
  "Jumeirah Beach Residence (JBR)",
  "Jumeirah Lake Towers (JLT)",
  "Jumeirah Village Circle (JVC)",
  "Jumeirah Village Triangle (JVT)",
  "Liwan",
  "MBR City",
  "Meydan",
  "Motor City",
  "Mudon",
  "Palm Jumeirah",
  "Port De La Mer",
  "Remraam",
  "Silicon Oasis",
  "Sobha Hartland",
  "Sports City",
  "The Lakes",
  "The Meadows",
  "The Springs",
  "The Valley",
  "Tilal Al Ghaf",
  "Town Square",
  "Villanova",
] as const;

function buildNotes(input: {
  message: string;
  interest: string;
  budget: string;
  areas: string[];
  timeline: string;
}) {
  const lines = [
    input.interest
      ? `Looking for: ${INTEREST_OPTIONS.find((o) => o.value === input.interest)?.label ?? input.interest}`
      : null,
    input.budget
      ? `Budget: ${BUDGET_OPTIONS.find((o) => o.value === input.budget)?.label ?? input.budget}`
      : null,
    input.areas.length
      ? `Preferred areas: ${input.areas.join(", ")}`
      : null,
    input.timeline
      ? `Timeline: ${TIMELINE_OPTIONS.find((o) => o.value === input.timeline)?.label ?? input.timeline}`
      : null,
    input.message ? `Message: ${input.message}` : null,
  ].filter(Boolean);
  return lines.length ? lines.join("\n") : null;
}

/**
 * Reusable public lead capture form.
 * Persists to Neon first; CRM sync is async via lead service.
 */
export function LeadCaptureForm({
  propertyId,
  leadSource = "website",
  campaign,
  className,
  variant = "default",
  onSuccess,
}: LeadCaptureFormProps) {
  const id = useId();
  const dark = variant === "homepage-dark";
  const areaMenuRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+971");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState<string>("off-plan");
  const [budget, setBudget] = useState("");
  const [areas, setAreas] = useState<string[]>([]);
  const [areaOpen, setAreaOpen] = useState(false);
  const [timeline, setTimeline] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const fieldClass = dark
    ? "h-11 border-white/20 bg-white/[0.07] text-white placeholder:text-white/45 focus-visible:border-white/50 focus-visible:ring-red/40"
    : "";
  const selectClass = cn(
    "flex h-11 w-full rounded-md border bg-transparent px-3 text-sm outline-none transition",
    dark
      ? "border-white/20 bg-white/[0.07] text-white focus-visible:border-white/50 focus-visible:ring-2 focus-visible:ring-red/40"
      : "border-input focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  );
  const labelClass = dark ? "text-white/70" : undefined;

  useEffect(() => {
    if (!areaOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (!areaMenuRef.current?.contains(e.target as Node)) {
        setAreaOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAreaOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [areaOpen]);

  function toggleArea(name: string) {
    setAreas((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name],
    );
  }

  function resetForm() {
    setName("");
    setEmail("");
    setCountryCode("+971");
    setPhone("");
    setInterest("off-plan");
    setBudget("");
    setAreas([]);
    setAreaOpen(false);
    setTimeline("");
    setMessage("");
  }

  const areaSummary =
    areas.length === 0
      ? "Select preferred areas"
      : areas.length <= 2
        ? areas.join(", ")
        : `${areas.slice(0, 2).join(", ")} +${areas.length - 2} more`;

  return (
    <form
      className={cn(
        className ?? "space-y-4",
        dark && "hp-split-form hp-split-form--dark space-y-3.5",
      )}
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        const phoneDigits = phone.replace(/\D/g, "");
        if (!phoneDigits) {
          setError("Please enter a phone number so we can call you back.");
          return;
        }
        const fullPhone = `${countryCode}${phoneDigits}`;

        setLoading(true);

        const notes = buildNotes({
          message,
          interest,
          budget,
          areas,
          timeline,
        });

        const result = await captureLeadAction({
          name,
          email: email || null,
          phone: fullPhone,
          propertyId: propertyId ?? null,
          leadSource,
          campaign: campaign ?? null,
          landingPage:
            typeof window !== "undefined" ? window.location.href : null,
          referrer:
            typeof document !== "undefined" ? document.referrer || null : null,
          notes,
          metadata: {
            message: message || null,
            interest: interest || null,
            budget: budget || null,
            preferredAreas: areas,
            timeline: timeline || null,
            countryCode,
          },
        });

        setLoading(false);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setSuccess(true);
        resetForm();
        onSuccess?.();
      }}
    >
      <div className="space-y-2">
        <Label htmlFor={`${id}-name`} className={labelClass}>
          Full name
        </Label>
        <Input
          id={`${id}-name`}
          autoComplete="name"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={fieldClass}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${id}-email`} className={labelClass}>
          Email
        </Label>
        <Input
          id={`${id}-email`}
          type="email"
          autoComplete="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={fieldClass}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${id}-phone`} className={labelClass}>
          Phone
        </Label>
        <div className="flex gap-2">
          <label className="sr-only" htmlFor={`${id}-cc`}>
            Country code
          </label>
          <select
            id={`${id}-cc`}
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className={cn(selectClass, "w-[7.25rem] shrink-0")}
          >
            {COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.dial}>
                {c.label}
              </option>
            ))}
          </select>
          <Input
            id={`${id}-phone`}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="50 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className={cn(fieldClass, "min-w-0 flex-1")}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor={`${id}-interest`} className={labelClass}>
            What are you looking to buy?
          </Label>
          <select
            id={`${id}-interest`}
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            className={selectClass}
          >
            {INTEREST_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${id}-budget`} className={labelClass}>
            Budget
          </Label>
          <select
            id={`${id}-budget`}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className={selectClass}
          >
            {BUDGET_OPTIONS.map((o) => (
              <option key={o.value || "any"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${id}-timeline`} className={labelClass}>
            When do you want to buy?
          </Label>
          <select
            id={`${id}-timeline`}
            value={timeline}
            onChange={(e) => setTimeline(e.target.value)}
            className={selectClass}
          >
            {TIMELINE_OPTIONS.map((o) => (
              <option key={o.value || "any"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="relative space-y-2" ref={areaMenuRef}>
          <Label id={`${id}-area-label`} className={labelClass}>
            Preferred area
          </Label>
          <button
            type="button"
            id={`${id}-area`}
            aria-haspopup="listbox"
            aria-expanded={areaOpen}
            aria-labelledby={`${id}-area-label`}
            onClick={() => setAreaOpen((v) => !v)}
            className={cn(
              selectClass,
              "items-center justify-between gap-2 text-left",
              areas.length === 0 &&
                (dark ? "text-white/45" : "text-muted-foreground"),
            )}
          >
            <span className="truncate">{areaSummary}</span>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 opacity-60 transition",
                areaOpen && "rotate-180",
              )}
            />
          </button>
          {areaOpen ? (
            <div
              role="listbox"
              aria-multiselectable="true"
              aria-labelledby={`${id}-area-label`}
              className={cn(
                "absolute left-0 right-0 z-30 mt-1 max-h-56 overflow-y-auto rounded-md border shadow-lg",
                dark
                  ? "border-white/20 bg-[#1a1a1a] text-white"
                  : "border-line bg-white text-ink",
              )}
            >
              {DUBAI_AREAS.map((areaName) => {
                const checked = areas.includes(areaName);
                return (
                  <label
                    key={areaName}
                    className={cn(
                      "flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm transition",
                      dark ? "hover:bg-white/8" : "hover:bg-mist",
                      checked && (dark ? "bg-red/20" : "bg-red/5"),
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleArea(areaName)}
                      className="size-4 shrink-0 accent-[var(--red)]"
                    />
                    <span>{areaName}</span>
                  </label>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${id}-message`} className={labelClass}>
          Anything else? <span className="font-normal opacity-70">(optional)</span>
        </Label>
        <Textarea
          id={`${id}-message`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          placeholder="Bedrooms, payment plan preference, handover year…"
          className={cn(fieldClass, "min-h-[72px] resize-y")}
        />
      </div>

      <div role="status" aria-live="polite">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {success ? (
          <p className={cn("text-sm", dark ? "text-white/90" : "text-ink")}>
            Thank you. Our team will contact you shortly.
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        className={
          dark
            ? "hp-split-submit mt-1 h-11 w-full rounded-[3px] text-[15px] font-semibold"
            : "h-11 w-full rounded-[3px]"
        }
        disabled={loading}
      >
        {loading ? "Sending…" : "Request callback"}
      </Button>
    </form>
  );
}
