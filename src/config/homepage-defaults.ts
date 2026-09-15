/**
 * Default homepage copy — matches design-reference/prowin-homepage (3).html
 * Editable via Admin → Homepage Builder (WebsiteSetting key: homepage.content)
 */

import type { PageBlock } from "@/config/page-content-defaults";

export type HomepageSectionKey =
  | "trust"
  | "paths"
  | "featured"
  | "sellSplit"
  | "areas"
  | "team"
  | "insight"
  | "seoLinks"
  | "modules";

export type HomepageVisibility = Record<HomepageSectionKey, boolean>;

export const DEFAULT_HOMEPAGE_VISIBILITY: HomepageVisibility = {
  trust: true,
  paths: true,
  featured: true,
  sellSplit: true,
  areas: true,
  team: true,
  insight: true,
  seoLinks: true,
  modules: false,
};

export const HOMEPAGE_SECTION_KEYS: HomepageSectionKey[] = [
  "trust",
  "paths",
  "featured",
  "sellSplit",
  "areas",
  "team",
  "insight",
  "seoLinks",
  "modules",
];

export const DEFAULT_HOMEPAGE_LAYOUT: HomepageSectionKey[] = [
  ...HOMEPAGE_SECTION_KEYS,
];

export const HOMEPAGE_SECTION_LABELS: Record<HomepageSectionKey, string> = {
  trust: "Trust strip",
  paths: "Start here",
  featured: "Featured projects",
  sellSplit: "Sell / lease",
  areas: "Communities",
  team: "Team",
  insight: "Market insights",
  seoLinks: "Popular searches",
  modules: "Custom widgets",
};

export type HomepageContent = {
  seo?: {
    title: string;
    description: string;
  };
  visibility?: HomepageVisibility;
  /** Section order on the homepage. Missing keys stay off the page. */
  layout?: HomepageSectionKey[];
  hero: {
    eyebrow: string;
    title: string;
    lede: string;
    imageUrl: string;
    searchPlaceholder: string;
  };
  trust: { label: string; value: string; href?: string }[];
  paths: {
    eyebrow: string;
    title: string;
    items: { n: string; title: string; body: string; href: string; cta: string }[];
  };
  featured: {
    eyebrow: string;
    title: string;
    description: string;
    viewAllHref: string;
    viewAllLabel: string;
    /** How many featured cards to show (1–12). */
    limit?: number;
  };
  /** Extra PageBuilder widgets placed via the Custom widgets section. */
  blocks?: PageBlock[];
  sellSplit: {
    eyebrow: string;
    title: string;
    body: string;
    ctaLabel: string;
    ctaHref: string;
    formTitle: string;
    formNote: string;
  };
  areas: {
    eyebrow: string;
    title: string;
    description: string;
    viewAllHref: string;
    items: { name: string; subtitle: string; href: string }[];
  };
  team: {
    eyebrow: string;
    title: string;
    description: string;
    viewAllHref: string;
  };
  insight: {
    eyebrow: string;
    title: string;
    body: string;
    ctaLabel: string;
    ctaHref: string;
    stats: { value: string; label: string }[];
  };
  seoLinks: {
    eyebrow: string;
    title: string;
    columns: { heading: string; links: { label: string; href: string }[] }[];
  };
};

export function resolveHomepageLayout(
  content: Pick<HomepageContent, "layout" | "visibility">,
): HomepageSectionKey[] {
  const raw = Array.isArray(content.layout) ? content.layout : [];
  const seen = new Set<HomepageSectionKey>();
  const ordered: HomepageSectionKey[] = [];
  for (const key of raw) {
    if (!HOMEPAGE_SECTION_KEYS.includes(key) || seen.has(key)) continue;
    seen.add(key);
    ordered.push(key);
  }
  const source = ordered.length ? ordered : DEFAULT_HOMEPAGE_LAYOUT;
  return source.filter(
    (key) => content.visibility?.[key] ?? DEFAULT_HOMEPAGE_VISIBILITY[key],
  );
}

export const DEFAULT_HOMEPAGE_CONTENT: HomepageContent = {
  seo: {
    title: "Off-Plan & Ready Property in Dubai",
    description:
      "Buy, sell, rent and invest in Dubai property with Prowin Properties. Off-plan launches, ready homes and expert agents across JVC, Business Bay, Dubai South and more. RERA-registered.",
  },
  visibility: DEFAULT_HOMEPAGE_VISIBILITY,
  layout: DEFAULT_HOMEPAGE_LAYOUT,
  hero: {
    eyebrow: "Dubai Real Estate · RERA Registered",
    title: "Find your place in the city of gold.",
    lede: "",
    imageUrl: "/images/hero-dubai-skyline.png",
    searchPlaceholder: "Community, building or developer…",
  },
  trust: [
    {
      value: "4.6★",
      label: "384 Google reviews",
      href: "https://search.google.com/local/reviews?placeid=ChIJoUA4EYhCXz4RPOcagqtT180",
    },
    { value: "1,200+", label: "Live listings" },
    { value: "50+", label: "Developers" },
    { value: "11", label: "Core communities" },
  ],
  paths: {
    eyebrow: "Start here",
    title: "Whatever your move, one team.",
    items: [
      {
        n: "01",
        title: "Off-Plan",
        body: "New launches with flexible payment plans.",
        href: "/properties?completion=off-plan",
        cta: "Explore →",
      },
      {
        n: "02",
        title: "Buy",
        body: "Ready apartments, villas and townhouses.",
        href: "/properties",
        cta: "Browse →",
      },
      {
        n: "03",
        title: "Rent",
        body: "Homes across Dubai’s prime areas.",
        href: "/contact",
        cta: "Find →",
      },
      {
        n: "04",
        title: "Sell & Lease",
        body: "Get a free valuation from our team.",
        href: "/contact",
        cta: "List →",
      },
    ],
  },
  featured: {
    eyebrow: "Latest launches",
    title: "Featured off-plan projects",
    description:
      "Hand-picked developments from Dubai’s leading developers, with starting prices and payment plans.",
    viewAllHref: "/properties",
    viewAllLabel: "View all projects →",
    limit: 3,
  },
  blocks: [],
  sellSplit: {
    eyebrow: "Sell or lease with us",
    title: "Every home has a buyer. We know where to find yours.",
    body: "Thousands of active buyers and tenants, professional marketing, and a dedicated agent from listing to keys. Start with a free, no-obligation valuation.",
    ctaLabel: "List your property",
    ctaHref: "/contact",
    formTitle: "Get a call back within the hour",
    formNote: "RERA registered · No spam · We reply during working hours.",
  },
  areas: {
    eyebrow: "Where we sell",
    title: "Explore Dubai by community",
    description: "Deep local expertise across the communities where Prowin closes most.",
    viewAllHref: "/areas",
    items: [
      { name: "JVC", subtitle: "Apartments & villas", href: "/properties?q=JVC" },
      { name: "Business Bay", subtitle: "Apartments", href: "/properties?q=Business+Bay" },
      { name: "Arjan", subtitle: "Apartments", href: "/properties?q=Arjan" },
      { name: "Dubai South", subtitle: "Off-plan", href: "/properties?q=Dubai+South" },
      { name: "Silicon Oasis", subtitle: "Apartments", href: "/properties?q=Silicon+Oasis" },
      { name: "Sports City", subtitle: "Apartments", href: "/properties?q=Sports+City" },
      { name: "Liwan", subtitle: "Apartments", href: "/properties?q=Liwan" },
      { name: "Damac Hills", subtitle: "Villas", href: "/properties?q=Damac+Hills" },
      { name: "The Valley", subtitle: "Townhouses", href: "/properties?q=The+Valley" },
      { name: "Jebel Ali", subtitle: "Villas", href: "/properties?q=Jebel+Ali" },
      { name: "Warsan", subtitle: "Apartments", href: "/properties?q=Warsan" },
      { name: "DLRC", subtitle: "Off-plan", href: "/properties?q=DLRC" },
    ],
  },
  team: {
    eyebrow: "Our people",
    title: "Meet the team behind the move",
    description:
      "RERA-certified specialists who know their communities inside out. Find your consultant and speak to them directly.",
    viewAllHref: "/our-team",
  },
  insight: {
    eyebrow: "Market insights",
    title: "Know the market before you move",
    body: "Quarterly Dubai transaction data, area price trends and off-plan payment benchmarks — straight from the Prowin desk.",
    ctaLabel: "Read insights",
    ctaHref: "/market-insights",
    stats: [
      { value: "AED 15B+", label: "Tracked transactions" },
      { value: "11", label: "Communities covered" },
      { value: "4–8%", label: "Typical yields" },
    ],
  },
  seoLinks: {
    eyebrow: "Explore Dubai property",
    title: "Popular searches",
    columns: [
      {
        heading: "Buy by type",
        links: [
          { label: "Apartments for sale in Dubai", href: "/properties?type=Apartment" },
          { label: "Villas for sale in Dubai", href: "/properties?type=Villa" },
          { label: "Townhouses for sale in Dubai", href: "/properties?type=Townhouse" },
          { label: "Penthouses for sale in Dubai", href: "/properties?type=Penthouse" },
        ],
      },
      {
        heading: "Off-plan by area",
        links: [
          { label: "Off-plan in JVC", href: "/properties?q=JVC" },
          { label: "Off-plan in Business Bay", href: "/properties?q=Business+Bay" },
          { label: "Off-plan in Dubai South", href: "/properties?q=Dubai+South" },
          { label: "Off-plan in Arjan", href: "/properties?q=Arjan" },
        ],
      },
      {
        heading: "By developer",
        links: [
          { label: "Emaar projects", href: "/properties?q=Emaar" },
          { label: "Damac projects", href: "/properties?q=Damac" },
          { label: "Sobha projects", href: "/properties?q=Sobha" },
          { label: "Imtiaz projects", href: "/properties?q=Imtiaz" },
        ],
      },
      {
        heading: "Company",
        links: [
          { label: "About us", href: "/about" },
          { label: "Blog & insights", href: "/blog" },
          { label: "Contact", href: "/contact" },
          { label: "Browse properties", href: "/properties" },
        ],
      },
    ],
  },
};