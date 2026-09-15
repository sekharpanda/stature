/**
 * HelloLeads CRM — website integration (create lead).
 *
 * Keys live in env only. Copy them from HelloLeads web app:
 * Settings → Web Form Integration → Website Integration
 * (API key + list key for the list that should receive site / ads enquiries).
 */

export type HelloLeadInput = {
  name: string;
  phone: string;
  email?: string;
  interest?: string;
  message?: string;
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;
  page?: string;
};

export type HelloLeadResult =
  | { ok: true; skipped?: false }
  | { ok: false; skipped: true; reason: "not_configured" }
  | { ok: false; skipped?: false; reason: string };

const DEFAULT_URL =
  "https://app.helloleads.io/index.php/source/api/addlead";

function env(name: string) {
  return (process.env[name] || "").trim();
}

export function helloLeadsConfigured() {
  return Boolean(
    (env("HELLOLEADS_API_KEY") || env("HELLOLEADS_PRIVATE_KEY")) &&
      env("HELLOLEADS_LIST_KEY"),
  );
}

function splitName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  const first_name = (parts[0] || "Enquiry").slice(0, 50);
  const last_name = parts.slice(1).join(" ").slice(0, 80);
  return { first_name, last_name };
}

function digitsPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return { mobile: digits.slice(2), mobile_code: "+91" };
  }
  if (digits.length === 10) {
    return { mobile: digits, mobile_code: "+91" };
  }
  return { mobile: digits.slice(0, 30), mobile_code: "+91" };
}

function notesFrom(input: HelloLeadInput) {
  return [
    input.message,
    input.interest ? `Interest: ${input.interest}` : "",
    input.source ? `Source: ${input.source}` : "",
    input.page ? `Page: ${input.page}` : "",
    input.utm_source ? `utm_source: ${input.utm_source}` : "",
    input.utm_medium ? `utm_medium: ${input.utm_medium}` : "",
    input.utm_campaign ? `utm_campaign: ${input.utm_campaign}` : "",
    input.utm_content ? `utm_content: ${input.utm_content}` : "",
    input.gclid ? `gclid: ${input.gclid}` : "",
    input.fbclid ? `fbclid: ${input.fbclid}` : "",
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 2000);
}

function looksSuccessful(status: number, body: string) {
  if (status < 200 || status >= 300) return false;
  const trimmed = body.trim();
  if (!trimmed) return true;
  try {
    const json = JSON.parse(trimmed) as Record<string, unknown>;
    const statusText = String(
      json.status ?? json.Status ?? json.result ?? json.message ?? "",
    ).toLowerCase();
    if (
      statusText.includes("fail") ||
      statusText.includes("error") ||
      statusText.includes("invalid") ||
      json.error ||
      json.Error
    ) {
      return false;
    }
    if (
      json.success === true ||
      json.successful === true ||
      statusText.includes("success") ||
      statusText.includes("ok") ||
      statusText.includes("added") ||
      statusText.includes("created")
    ) {
      return true;
    }
  } catch {
    const lower = trimmed.toLowerCase();
    if (
      lower.includes("fail") ||
      lower.includes("invalid") ||
      lower.includes("unauthor")
    ) {
      return false;
    }
  }
  return true;
}

export async function pushHelloLead(
  input: HelloLeadInput,
): Promise<HelloLeadResult> {
  const enabled = env("HELLOLEADS_ENABLED").toLowerCase() !== "false";
  const apiKey = env("HELLOLEADS_API_KEY") || env("HELLOLEADS_PRIVATE_KEY");
  const listKey = env("HELLOLEADS_LIST_KEY");
  const url = env("HELLOLEADS_API_URL") || DEFAULT_URL;

  if (!enabled || !apiKey || !listKey) {
    return { ok: false, skipped: true, reason: "not_configured" };
  }

  const { first_name, last_name } = splitName(input.name);
  const { mobile, mobile_code } = digitsPhone(input.phone);
  const email = (input.email || "").trim().slice(0, 100);

  if (!email && !mobile) {
    return { ok: false, reason: "email_or_mobile_required" };
  }

  const payload = {
    list_key: listKey,
    first_name,
    last_name,
    email: email || undefined,
    mobile: mobile || undefined,
    mobile_code,
    phone: mobile || undefined,
    city: "Bengaluru",
    country: "India",
    interests: (input.interest || "").slice(0, 450),
    tags: ["website", input.source, input.utm_source]
      .filter(Boolean)
      .join(",")
      .slice(0, 450),
    notes: notesFrom(input),
    website: env("NEXT_PUBLIC_APP_URL") || "https://staturegroup.in",
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const body = await res.text();
    if (!looksSuccessful(res.status, body)) {
      return {
        ok: false,
        reason: `helloleads_${res.status}`,
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: "helloleads_network" };
  }
}
