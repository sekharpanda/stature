"use client";

import { useEffect, useState } from "react";

import { stature, statureWhatsAppHref } from "@/config/stature";
import {
  readStatureEnquiry,
  type StatureEnquiryDraft,
} from "@/features/marketing/stature-home/enquiry-stash";

export const LEAD_INTERESTS = [
  "Buy a home",
  "New launch",
  "Home loan",
  "Site visit",
  "Developer / marketing",
] as const;

function matchInterest(value?: string) {
  if (!value) return LEAD_INTERESTS[0];
  const found = LEAD_INTERESTS.find(
    (item) => item.toLowerCase() === value.toLowerCase(),
  );
  if (found) return found;
  if (value === "Buy") return "Buy a home";
  return LEAD_INTERESTS[0];
}

function adsMeta() {
  if (typeof window === "undefined") return {};
  const q = new URLSearchParams(window.location.search);
  return {
    utm_source: q.get("utm_source") || "",
    utm_medium: q.get("utm_medium") || "",
    utm_campaign: q.get("utm_campaign") || "",
    utm_content: q.get("utm_content") || "",
    gclid: q.get("gclid") || "",
    fbclid: q.get("fbclid") || "",
    page: window.location.href,
  };
}

function buildBody(data: {
  name: string;
  phone: string;
  email: string;
  interest: string;
  message: string;
}) {
  return [
    `Name: ${data.name}`,
    `Phone: ${data.phone}`,
    data.email ? `Email: ${data.email}` : "",
    `Interest: ${data.interest}`,
    data.message ? `Message: ${data.message}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function StatureLeadForm({
  variant = "light",
  source = "website",
  onSent,
}: {
  variant?: "light" | "dark";
  source?: string;
  onSent?: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState<string>(LEAD_INTERESTS[0]);
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function apply(draft: StatureEnquiryDraft | null) {
      if (!draft) return;
      if (draft.interest) setInterest(matchInterest(draft.interest));
      if (draft.note) setMessage(draft.note);
    }
    apply(readStatureEnquiry());
    function onStash() {
      apply(readStatureEnquiry());
    }
    window.addEventListener("stature-enquiry", onStash);
    return () => window.removeEventListener("stature-enquiry", onStash);
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!consent) {
      setError("Please accept the privacy policy to continue.");
      return;
    }
    setBusy(true);
    const payload = {
      name,
      phone,
      email,
      interest,
      message,
      source,
      consent: true,
      ...adsMeta(),
    };

    try {
      const res = await fetch("/api/stature-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        onSent?.();
        window.location.assign("/thank-you");
        return;
      }
    } catch {
      // Fall through to mailto if Hostinger SMTP is not set yet.
    }

    const body = buildBody(payload);
    window.location.href = `mailto:${stature.email}?subject=${encodeURIComponent(
      `Enquiry — ${interest}`,
    )}&body=${encodeURIComponent(body)}`;
    setSent(true);
    onSent?.();
    setBusy(false);
  }

  const waPreview = statureWhatsAppHref(
    [
      `Hi Stature, I would like to enquire.`,
      `Name: ${name || "(not filled)"}`,
      `Phone: ${phone || "(not filled)"}`,
      `Interest: ${interest}`,
      message ? `Note: ${message}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  );

  const dark = variant === "dark";

  return (
    <form
      className={dark ? "hp-split-form space-y-3" : "stature-lead-form space-y-3"}
      onSubmit={onSubmit}
    >
      <label className="block text-[13px]">
        Name
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 h-11 w-full rounded-[3px] border px-3 text-sm"
          placeholder="Your name"
          autoComplete="name"
        />
      </label>
      <label className="block text-[13px]">
        Phone
        <input
          required
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 h-11 w-full rounded-[3px] border px-3 text-sm"
          placeholder="+91"
          autoComplete="tel"
        />
      </label>
      <label className="block text-[13px]">
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 h-11 w-full rounded-[3px] border px-3 text-sm"
          placeholder="you@email.com"
          autoComplete="email"
        />
      </label>
      <label className="block text-[13px]">
        I am looking for
        <select
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          className="mt-1 h-11 w-full rounded-[3px] border px-3 text-sm"
        >
          {LEAD_INTERESTS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-[13px]">
        Anything else? <span className="font-normal opacity-70">(optional)</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          className="mt-1 min-h-[72px] w-full resize-y rounded-[3px] border px-3 py-2 text-sm"
          placeholder="Budget, bedrooms, preferred area…"
        />
      </label>
      <label className="flex items-start gap-2 text-[12px] leading-snug">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          required
        />
        <span>
          I agree to the{" "}
          <a href="/privacy" className="underline underline-offset-2">
            Privacy Policy
          </a>
          {", "}
          <a href="/terms" className="underline underline-offset-2">
            Terms
          </a>
          {" and "}
          <a href="/disclaimer" className="underline underline-offset-2">
            advertising disclaimer
          </a>
          , and to be contacted by phone, WhatsApp or email.
        </span>
      </label>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {sent ? (
        <p className={dark ? "text-sm text-white/90" : "text-sm text-slate"}>
          Thank you. We will call you back on working days. If nothing arrives,
          write to {stature.email} or WhatsApp us.
        </p>
      ) : null}
      <div className="stature-form-actions">
        <button type="submit" className="hp-split-submit h-11" disabled={busy}>
          {busy ? "Sending…" : "Request callback"}
        </button>
        <a
          className={dark ? "stature-wa-link" : "stature-wa-link stature-wa-link--light"}
          href={waPreview}
          target="_blank"
          rel="noreferrer"
        >
          WhatsApp instead
        </a>
      </div>
    </form>
  );
}
