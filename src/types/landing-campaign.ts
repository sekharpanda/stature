import {
  createEmptyBlock,
  type PageBlock,
} from "@/config/page-content-defaults";

/** Campaign blueprint stored on LandingPage.schemaJson */

export type LandingCta = {
  label: string;
  href: string;
};

export type LandingLeadFormConfig = {
  /** External CRM / webhook endpoint. Leave empty to use Prowin internal capture. */
  apiUrl: string;
  /** API key / bearer token sent with the request */
  apiKey: string;
  /** Header name for the key (default Authorization or X-Api-Key) */
  apiKeyHeader: "Authorization" | "X-Api-Key" | "X-API-KEY" | "api-key";
  /** HTTP method */
  method: "POST" | "PUT";
  /** Extra JSON headers as key:value lines */
  extraHeaders: string;
  thankYouTitle: string;
  thankYouMessage: string;
  thankYouImageUrl: string;
  /** Optional absolute/relative redirect after thank-you delay (seconds) */
  thankYouRedirectUrl: string;
  thankYouRedirectSeconds: number;
  /** Submit button label on the hero form */
  submitLabel: string;
};

export type LandingTrackingConfig = {
  /** Full Google tag / gtag.js snippet for <head> */
  googleAdsHeadCode: string;
  /** Optional noscript / body snippet */
  googleAdsBodyCode: string;
  /** Conversion ID e.g. AW-123456789 */
  conversionId: string;
  /** Conversion label for form submit event */
  conversionLabel: string;
  /** Any other head scripts (Meta pixel, etc.) */
  customHeadCode: string;
  /** Any other body scripts */
  customBodyCode: string;
};

export type LandingChart = {
  title: string;
  /** Lines: "2020:45" or "Q1|62" */
  bars: string;
};

export type LandingCampaignConfig = {
  brandName: string;
  /** Small line under brand when no logo e.g. BY PROWIN | DUBAI */
  brandTagline: string;
  /** Project / developer logo shown in header & footer */
  logoUrl: string;
  phone: string;
  whatsapp: string;
  seoKeywords: string;
  address: string;
  hero: {
    /** Gold uppercase tag e.g. PHASE 1 · LAUNCHING SOON */
    eyebrow: string;
    headline: string;
    /** Location / sub line under headline */
    subheadline: string;
    /** Feature bullets — shown as 2-column diamond grid */
    bullets: string;
    imageUrl: string;
    primaryCta: LandingCta;
    secondaryCta: LandingCta;
    formTitle: string;
    formSubtitle: string;
    formSubmitLabel: string;
  };
  overview: {
    eyebrow: string;
    title: string;
    body: string;
    imageUrl: string;
    ctaLabel: string;
  };
  stats: Array<{ label: string; value: string }>;
  investment: {
    title: string;
    charts: LandingChart[];
    /** Pipe-separated headers e.g. Metric|Dubai|Abu Dhabi */
    tableHeaders: string;
    /** One row per line, cells pipe-separated */
    tableRows: string;
  };
  location: {
    title: string;
    points: string;
    mapEmbedUrl: string;
    googleMapsUrl: string;
    nearby: string;
  };
  pricing: Array<{
    name: string;
    size: string;
    price: string;
    ctaLabel: string;
  }>;
  floorPlans: Array<{
    name: string;
    size: string;
    price: string;
  }>;
  /** Why invest / advantages — title + short description */
  highlights: Array<{ title: string; points: string }>;
  amenities: string;
  media: {
    /** @deprecated use galleryUrls */
    galleryImageUrl: string;
    galleryUrls: string[];
    galleryTitle: string;
    youtubeUrl: string;
  };
  finalCta: {
    headline: string;
    buttonLabel: string;
    backgroundImageUrl: string;
  };
  faqs: Array<{ question: string; answer: string }>;
  leadForm: LandingLeadFormConfig;
  tracking: LandingTrackingConfig;
  /** WordPress-style page builder blocks (listings, map, form, etc.). */
  blocks?: PageBlock[];
};

export const DEFAULT_LEAD_FORM: LandingLeadFormConfig = {
  apiUrl: "",
  apiKey: "",
  apiKeyHeader: "X-Api-Key",
  method: "POST",
  extraHeaders: "",
  thankYouTitle: "Thank you — we received your request",
  thankYouMessage:
    "A Prowin Properties consultant will call you shortly. You can also WhatsApp us anytime for a private viewing.",
  thankYouImageUrl:
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80",
  thankYouRedirectUrl: "",
  thankYouRedirectSeconds: 0,
  submitLabel: "Get brochure & pricing →",
};

export const DEFAULT_TRACKING: LandingTrackingConfig = {
  googleAdsHeadCode: "",
  googleAdsBodyCode: "",
  conversionId: "",
  conversionLabel: "",
  customHeadCode: "",
  customBodyCode: "",
};

export const DEFAULT_LANDING_CAMPAIGN: LandingCampaignConfig = {
  brandName: "Prowin Properties",
  brandTagline: "BY PROWIN | DUBAI",
  logoUrl: "",
  phone: "+971 4 000 0000",
  whatsapp: "+971500000000",
  address: "Business Bay, Dubai, United Arab Emirates",
  seoKeywords:
    "Dubai off plan, Business Bay apartments, Dubai property investment",
  hero: {
    eyebrow: "Phase 1 · Launching soon",
    headline: "Own Your Address in the Heart of Dubai",
    subheadline: "Business Bay · Canal Front · Downtown Dubai",
    bullets:
      "Prime Business Bay location\nFlexible 60/40 payment plan\n1, 2 & 3 bedroom residences\n70% open lifestyle spaces\nRERA registered developer\nHandover Q4 2028",
    imageUrl:
      "https://images.unsplash.com/photo-1512453979798-5ea8333bcea1?auto=format&fit=crop&w=2400&q=85",
    primaryCta: {
      label: "Get brochure & Phase 1 pricing",
      href: "#enquire",
    },
    secondaryCta: { label: "See the market data", href: "#investment" },
    formTitle: "Download Brochure & Price",
    formSubtitle:
      "Official brochure, floor plans & Phase 1 launch pricing — instantly",
    formSubmitLabel: "Get brochure & pricing →",
  },
  overview: {
    eyebrow: "The project",
    title: "A home that gives more to life — and for life",
    body: "Designed for discerning investors and end-users, this community blends resort-style amenities with exceptional connectivity to Downtown Dubai, DIFC and Dubai International Airport.\n\nSpacious layouts, premium finishes and a landmark tower presence redefine waterfront living in Business Bay — built for long-term capital appreciation and lifestyle living.",
    imageUrl:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=85",
    ctaLabel: "Know more",
  },
  stats: [
    { label: "Starting price", value: "AED 990K" },
    { label: "Payment plan", value: "60/40" },
    { label: "Expected yield", value: "6–7%" },
    { label: "Handover", value: "Q4 2028" },
  ],
  investment: {
    title: "Why Dubai remains a global investment destination",
    charts: [
      {
        title: "Business Bay price growth (AED / sq ft)",
        bars: "2020:980\n2021:1120\n2022:1280\n2023:1450\n2024:1620",
      },
      {
        title: "Rental yields trend (%)",
        bars: "2020:5.2\n2021:5.6\n2022:6.1\n2023:6.4\n2024:6.8",
      },
    ],
    tableHeaders: "Metric|Business Bay|Downtown|Marina",
    tableRows:
      "Avg sale price / sq ft|AED 1,620|AED 2,100|AED 1,780\nGross rental yield|6.5%|5.2%|5.8%\n5-yr appreciation|+65%|+48%|+52%\nOccupancy|94%|91%|93%",
  },
  location: {
    title: "Connected to everything that matters",
    points:
      "8 mins to Downtown Dubai\n12 mins to Dubai International Airport\n5 mins to Dubai Canal\n10 mins to DIFC",
    mapEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3610.178!2d55.26!3d25.18!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjXCsDEwJzQ4LjAiTiA1NcKwMTUnMzYuMCJF!5e0!3m2!1sen!2sae!4v1",
    googleMapsUrl: "https://maps.google.com/?q=Business+Bay+Dubai",
    nearby:
      "Healthcare — City Hospital 6 mins\nEducation — International schools nearby\nShopping — Dubai Mall 10 mins\nLeisure — Dubai Opera & Canal Walk",
  },
  pricing: [
    {
      name: "1 Bedroom",
      size: "750 – 900 sq ft",
      price: "From AED 990,000",
      ctaLabel: "Get quote",
    },
    {
      name: "2 Bedroom",
      size: "1,100 – 1,350 sq ft",
      price: "From AED 1.65M",
      ctaLabel: "Get quote",
    },
  ],
  floorPlans: [
    { name: "1 BR Classic", size: "780 sq ft", price: "AED 990K" },
    { name: "1 BR Premium", size: "860 sq ft", price: "AED 1.12M" },
    { name: "2 BR Classic", size: "1,150 sq ft", price: "AED 1.65M" },
    { name: "2 BR Corner", size: "1,280 sq ft", price: "AED 1.85M" },
    { name: "3 BR Family", size: "1,650 sq ft", price: "AED 2.45M" },
    { name: "Penthouse", size: "2,400 sq ft", price: "On request" },
  ],
  highlights: [
    {
      title: "Capital appreciation",
      points:
        "Business Bay has delivered strong 5-year price growth backed by limited waterfront inventory and metro connectivity.",
    },
    {
      title: "Rental demand",
      points:
        "High occupancy from professionals working in DIFC, Downtown and Media City — ideal for investors seeking yield.",
    },
    {
      title: "Lifestyle living",
      points:
        "Resort amenities, canal views and walkable retail create end-user appeal that protects long-term value.",
    },
    {
      title: "Transparent ownership",
      points:
        "RERA-registered developer, escrow protection and freehold title for international buyers.",
    },
  ],
  amenities:
    "Swimming Pool, Gym, Kids Play Area, Concierge, Parking, Retail Plaza, Co-working, BBQ Deck, Yoga Deck, Jogging Track",
  media: {
    galleryImageUrl:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80",
    galleryUrls: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600047509807-ba8b95dda9a9?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=80",
    ],
    galleryTitle: "Glimpse of the lifestyle",
    youtubeUrl: "",
  },
  finalCta: {
    headline: "Experience modern luxury in Business Bay",
    buttonLabel: "Book a site visit",
    backgroundImageUrl:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80",
  },
  faqs: [
    {
      question: "Is the project RERA registered?",
      answer:
        "Yes. The development is registered with Dubai Land Department / RERA and escrow protected.",
    },
    {
      question: "What payment plans are available?",
      answer:
        "A flexible 60/40 plan during construction and on handover, with options for post-handover plans on select units.",
    },
    {
      question: "Can NRIs and internationals purchase?",
      answer:
        "Yes. Freehold ownership is available for foreign nationals in designated Dubai areas including Business Bay.",
    },
    {
      question: "How do I book a site visit?",
      answer:
        "Submit the enquire form or WhatsApp us — our Dubai consultants typically respond within minutes to schedule a private viewing.",
    },
  ],
  leadForm: DEFAULT_LEAD_FORM,
  tracking: DEFAULT_TRACKING,
  blocks: [],
};

export function defaultLandingBlocks(): PageBlock[] {
  const listings = createEmptyBlock("listings");
  const map = createEmptyBlock("map");
  const form = createEmptyBlock("form");
  const cta = createEmptyBlock("cta");
  return [
    {
      ...listings,
      title: "Available units",
      body: "Live inventory matched to this launch.",
      limit: 6,
      featuredOnly: false,
      buttonLabel: "Browse all properties",
      buttonHref: "/properties",
    },
    {
      ...map,
      title: "See it on the map",
      limit: 80,
    },
    {
      ...form,
      title: "Request brochure & pricing",
      body: "A consultant will call you with Phase details and a payment plan.",
    },
    {
      ...cta,
      title: "Ready to register interest?",
      body: "Share your budget and preferred bedroom type — we reply during working hours.",
      buttonLabel: "Enquire now",
      buttonHref: "#enquire",
    },
  ];
}

export function usesLandingBlocks(config: LandingCampaignConfig) {
  return Array.isArray(config.blocks) && config.blocks.length > 0;
}

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function stringFields<T extends Record<string, unknown>>(
  obj: T,
  keys: Array<keyof T>,
  fallback: T,
): T {
  const next = { ...obj };
  for (const key of keys) {
    next[key] = asText(next[key], asText(fallback[key], "")) as T[keyof T];
  }
  return next;
}

export function parseCampaignConfig(raw: unknown): LandingCampaignConfig {
  if (!raw || typeof raw !== "object") {
    return structuredClone(DEFAULT_LANDING_CAMPAIGN);
  }
  const base = structuredClone(DEFAULT_LANDING_CAMPAIGN);
  const input = raw as Partial<LandingCampaignConfig> & {
    media?: Partial<LandingCampaignConfig["media"]> & {
      galleryUrls?: string[];
      galleryImageUrl?: string;
    };
  };

  const galleryUrls =
    input.media?.galleryUrls?.filter(Boolean) ??
    (input.media?.galleryImageUrl
      ? [input.media.galleryImageUrl]
      : base.media.galleryUrls);

  const hero = stringFields(
    { ...base.hero, ...(input.hero ?? {}) },
    [
      "eyebrow",
      "headline",
      "subheadline",
      "bullets",
      "imageUrl",
      "formTitle",
      "formSubtitle",
      "formSubmitLabel",
    ],
    base.hero,
  );
  const overview = stringFields(
    { ...base.overview, ...(input.overview ?? {}) },
    ["eyebrow", "title", "body", "imageUrl", "ctaLabel"],
    base.overview,
  );

  return {
    ...base,
    ...input,
    logoUrl: asText(input.logoUrl, base.logoUrl),
    brandName: asText(input.brandName, base.brandName),
    brandTagline: asText(input.brandTagline, base.brandTagline),
    address: asText(input.address, base.address),
    seoKeywords: asText(input.seoKeywords, base.seoKeywords),
    hero: {
      ...hero,
      primaryCta: { ...base.hero.primaryCta, ...(input.hero?.primaryCta ?? {}) },
      secondaryCta: {
        ...base.hero.secondaryCta,
        ...(input.hero?.secondaryCta ?? {}),
      },
    },
    overview,
    investment: {
      ...base.investment,
      ...(input.investment ?? {}),
      title: asText(input.investment?.title, base.investment.title),
      tableHeaders: asText(
        input.investment?.tableHeaders,
        base.investment.tableHeaders,
      ),
      tableRows: asText(input.investment?.tableRows, base.investment.tableRows),
      charts:
        input.investment?.charts?.length
          ? input.investment.charts
          : base.investment.charts,
    },
    location: stringFields(
      { ...base.location, ...(input.location ?? {}) },
      ["title", "points", "mapEmbedUrl", "googleMapsUrl", "nearby"],
      base.location,
    ),
    media: {
      ...base.media,
      ...(input.media ?? {}),
      galleryUrls,
      galleryTitle: asText(
        input.media?.galleryTitle,
        base.media.galleryTitle,
      ),
      youtubeUrl: asText(input.media?.youtubeUrl, ""),
      galleryImageUrl:
        galleryUrls[0] ??
        asText(input.media?.galleryImageUrl, base.media.galleryImageUrl),
    },
    finalCta: stringFields(
      { ...base.finalCta, ...(input.finalCta ?? {}) },
      ["headline", "buttonLabel", "backgroundImageUrl"],
      base.finalCta,
    ),
    leadForm: {
      ...base.leadForm,
      ...(input.leadForm ?? {}),
      apiUrl: asText(input.leadForm?.apiUrl, ""),
      apiKey: asText(input.leadForm?.apiKey, ""),
      extraHeaders: asText(input.leadForm?.extraHeaders, ""),
      thankYouTitle: asText(
        input.leadForm?.thankYouTitle,
        base.leadForm.thankYouTitle,
      ),
      thankYouMessage: asText(
        input.leadForm?.thankYouMessage,
        base.leadForm.thankYouMessage,
      ),
      thankYouImageUrl: asText(input.leadForm?.thankYouImageUrl, ""),
      thankYouRedirectUrl: asText(input.leadForm?.thankYouRedirectUrl, ""),
      submitLabel: asText(
        input.leadForm?.submitLabel,
        base.leadForm.submitLabel,
      ),
    },
    tracking: { ...base.tracking, ...(input.tracking ?? {}) },
    stats: input.stats?.length ? input.stats : base.stats,
    pricing: input.pricing?.length ? input.pricing : base.pricing,
    floorPlans: input.floorPlans?.length ? input.floorPlans : base.floorPlans,
    highlights: input.highlights?.length ? input.highlights : base.highlights,
    faqs: input.faqs?.length ? input.faqs : base.faqs,
    amenities: asText(input.amenities, base.amenities),
    blocks: Array.isArray(input.blocks) ? input.blocks : [],
  };
}

/** Strip CRM secrets before sending campaign config to the browser. */
export function toPublicCampaignConfig(
  config: LandingCampaignConfig,
): LandingCampaignConfig {
  return {
    ...config,
    leadForm: {
      ...config.leadForm,
      apiUrl: "",
      apiKey: "",
      extraHeaders: "",
    },
  };
}

export function safeThankYouRedirectUrl(
  raw: string | undefined,
  origin?: string,
) {
  const value = raw?.trim();
  if (!value) return undefined;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const url = new URL(value);
    if (origin && url.origin === origin) return url.toString();
  } catch {
    return undefined;
  }
  return undefined;
}

export function linesToList(value: string) {
  return value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export function parseChartBars(raw: string) {
  return linesToList(raw).map((line) => {
    const sep = line.includes("|") ? "|" : line.includes(":") ? ":" : null;
    if (!sep) return { label: line, value: 0 };
    const [label, valueRaw] = line.split(sep);
    return {
      label: (label ?? "").trim(),
      value: Number(String(valueRaw ?? "").replace(/[^\d.]/g, "")) || 0,
    };
  });
}

export function parsePipeTable(headersRaw: string, rowsRaw: string) {
  const headers = headersRaw
    .split("|")
    .map((h) => h.trim())
    .filter(Boolean);
  const rows = linesToList(rowsRaw).map((line) =>
    line.split("|").map((c) => c.trim()),
  );
  return { headers, rows };
}

export function youtubeEmbedUrl(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${u.pathname.replace("/", "")}`;
    }
    const id = u.searchParams.get("v");
    if (id) return `https://www.youtube.com/embed/${id}`;
    if (u.pathname.includes("/embed/")) return url;
  } catch {
    // ignore
  }
  return url;
}

export function parseExtraHeaders(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const idx = trimmed.indexOf(":");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (key) out[key] = value;
  }
  return out;
}
