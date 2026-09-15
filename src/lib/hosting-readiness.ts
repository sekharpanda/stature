import { brand } from "@/config/brand";

const CANONICAL_ORIGINS = [
  "https://www.prowinproperties.com",
  "https://prowinproperties.com",
] as const;

export function normalizeOrigin(value?: string | null) {
  return value?.trim().replace(/\/$/, "") ?? "";
}

/**
 * Origins Better Auth will accept once the site runs on the original
 * domain, the current Vercel host, and local development at the same time.
 */
export function getAuthTrustedOrigins() {
  const origins = new Set<string>();
  const add = (value?: string | null) => {
    const origin = normalizeOrigin(value);
    if (origin) origins.add(origin);
  };

  add(process.env.BETTER_AUTH_URL);
  add(process.env.NEXT_PUBLIC_APP_URL);
  add("http://localhost:3000");
  add("https://prowin-property-next-js.vercel.app");
  for (const origin of CANONICAL_ORIGINS) add(origin);
  for (const extra of (process.env.AUTH_TRUSTED_ORIGINS ?? "").split(",")) {
    add(extra);
  }

  return [...origins];
}

export function isEmailConfigured() {
  const smtp =
    Boolean(process.env.SMTP_USER?.trim()) &&
    Boolean(process.env.SMTP_PASS?.trim());
  const resend = Boolean(process.env.RESEND_API_KEY?.trim());
  return smtp || resend;
}

export function isBlobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export function getHostingReadiness() {
  const appUrl = normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL);
  const authUrl = normalizeOrigin(process.env.BETTER_AUTH_URL);
  const canonical = normalizeOrigin(brand.domain);
  const smtpUser = Boolean(process.env.SMTP_USER?.trim());
  const smtpPass = Boolean(process.env.SMTP_PASS?.trim());
  const resend = Boolean(process.env.RESEND_API_KEY?.trim());
  const emailFrom = Boolean(process.env.EMAIL_FROM?.trim());
  const maps = Boolean(
    process.env.GOOGLE_PLACES_API_KEY?.trim() ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim(),
  );
  const placeId = Boolean(process.env.GOOGLE_PLACE_ID?.trim());
  const cron = Boolean(process.env.CRON_SECRET?.trim());
  const authSecret = Boolean(process.env.BETTER_AUTH_SECRET?.trim());
  const onCanonical =
    appUrl === "https://www.prowinproperties.com" ||
    appUrl === "https://prowinproperties.com";

  return {
    appUrl: appUrl || "(not set)",
    authUrl: authUrl || "(not set)",
    canonical,
    onCanonical,
    urlsMatch: Boolean(appUrl && authUrl && appUrl === authUrl),
    emailConfigured: isEmailConfigured(),
    smtpUser,
    smtpPass,
    resend,
    emailFrom,
    blobConfigured: isBlobConfigured(),
    maps,
    placeId,
    cron,
    authSecret,
    hostedOnVercel: Boolean(process.env.VERCEL),
  };
}
