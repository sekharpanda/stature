/**
 * Design tokens — Prowin Properties brand guideline
 * Source: Prowin Properties Guideline (primary logo, favicon, colour variations)
 *
 * Palette:
 *   Brand red / burgundy — primary wordmark on light surfaces
 *   Champagne gold — logo on red/black; accent metal
 *   Black / white — B&W lockups and footer
 *
 * Type: Quiche Display (headings) · Proxima Nova (body)
 * Web substitutes: Fraunces · Plus Jakarta Sans
 */

export const brand = {
  name: "Prowin Properties",
  legalName: "Prowin Properties",
  phone: "+971585808989",
  whatsapp: "+971585808989",
  email: "discover@prowinproperties.com",
  address: "1004-1005, Icon Tower, Barsha Heights (Tecom), Dubai, UAE",
  hours: [
    { days: "Monday – Friday", time: "9:00 – 18:00" },
    { days: "Saturday", time: "10:00 – 16:00" },
    { days: "Sunday", time: "Closed" },
  ],
  timezone: "Gulf Standard Time (GMT+4)",
  rating: 4.6,
  /** Fallback when Google Places API is unavailable */
  reviewCount: 384,
  domain: "https://www.prowinproperties.com",
  /** Official stacked wordmark (red on transparent) */
  logo: "/brand/prowin-logo.png",
  /** Same asset works on dark surfaces (transparent background) */
  logoOnDark: "/brand/prowin-logo.png",
} as const;

export const colors = {
  /** Brand burgundy from primary logo on white */
  red: "#A01919",
  redDark: "#7d1313",
  ink: "#141414",
  slate: "#4a4a4a",
  line: "#e7e7e7",
  bg: "#ffffff",
  mist: "#faf9f8",
  /** Champagne / antique gold from logo metal treatments */
  gold: "#C4A574",
  goldDeep: "#9A7B45",
  sky: "#e7eef5",
} as const;

export const layout = {
  maxWidth: "1180px",
  /** Editorial chrome — buttons, inputs, header CTAs */
  radius: "3px",
  /** Soft panels — property cards, filter bar */
  radiusCard: "20px",
  headerHeight: "88px",
} as const;

export const social = {
  instagram: "https://www.instagram.com/prowinproperties/",
  linkedin: "https://www.linkedin.com/company/prowin-properties/",
  facebook: "https://www.facebook.com/prowinproperties",
} as const;

export const typography = {
  display: "var(--font-display)",
  sans: "var(--font-sans)",
} as const;
