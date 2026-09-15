import { brand } from "@/config/brand";

/** Visual page-builder blocks (Elementor-style sections + live widgets). */
export type PageBlockType =
  | "text"
  | "columns"
  | "cta"
  | "stats"
  | "image"
  | "spacer"
  | "listings"
  | "map"
  | "team"
  | "faqs"
  | "testimonials"
  | "blog"
  | "form"
  | "areas"
  | "developers"
  | "split";

export const WIDGET_BLOCK_TYPES: PageBlockType[] = [
  "listings",
  "map",
  "team",
  "faqs",
  "testimonials",
  "blog",
  "form",
  "areas",
  "developers",
];

export function isWidgetBlock(type: PageBlockType) {
  return WIDGET_BLOCK_TYPES.includes(type);
}

export type PageBlock = {
  id: string;
  type: PageBlockType;
  title?: string;
  body?: string;
  /** columns / stats items */
  items?: { title?: string; body?: string; value?: string; label?: string }[];
  buttonLabel?: string;
  buttonHref?: string;
  imageUrl?: string;
  alt?: string;
  /** spacer height in px */
  height?: number;
  /** listings / map search text */
  query?: string;
  /** listings / map inventory filter */
  completion?: "all" | "off-plan" | "ready";
  /** listings / map / team / faqs / testimonials / blog count */
  limit?: number;
  /** listings card layout */
  layout?: "grid" | "list";
  /** listings / map — featured inventory only */
  featuredOnly?: boolean;
  /** Visual shell */
  bg?: "none" | "white" | "mist" | "ink";
  padY?: "sm" | "md" | "lg";
  align?: "left" | "center";
  width?: "wide" | "narrow";
  /** split block — photo side */
  imageSide?: "left" | "right";
};

export type StaticPageContent = {
  eyebrow: string;
  title: string;
  lede: string;
  metaTitle?: string;
  metaDescription?: string;
  /** Visual builder blocks */
  blocks: PageBlock[];
  /**
   * Legacy simple sections — migrated to `text` blocks on load.
   * @deprecated
   */
  sections?: { title: string; body: string }[];
};

export const STATIC_PAGE_KEYS = [
  "about",
  "contact",
  "privacy",
  "terms",
  "our-team",
  "developers",
  "areas",
  "market-insights",
  "blog",
] as const;

export type StaticPageKey = (typeof STATIC_PAGE_KEYS)[number];

export const STATIC_PAGE_META: Record<
  StaticPageKey,
  { label: string; href: string; description: string }
> = {
  about: {
    label: "About",
    href: "/about",
    description: "Company story and value props",
  },
  contact: {
    label: "Contact",
    href: "/contact",
    description: "Contact hero and intro copy",
  },
  privacy: {
    label: "Privacy policy",
    href: "/privacy",
    description: "Legal privacy sections",
  },
  terms: {
    label: "Terms of use",
    href: "/terms",
    description: "Website terms sections",
  },
  "our-team": {
    label: "Our team",
    href: "/our-team",
    description: "Team page hero (agents managed separately)",
  },
  developers: {
    label: "Developers",
    href: "/developers",
    description: "Developers page hero",
  },
  areas: {
    label: "Areas",
    href: "/areas",
    description: "Areas page hero",
  },
  "market-insights": {
    label: "Market insights",
    href: "/market-insights",
    description: "Insights hero and focus blocks",
  },
  blog: {
    label: "Blog",
    href: "/blog",
    description: "Blog index hero",
  },
};

export const BLOCK_PALETTE: {
  type: PageBlockType;
  label: string;
  description: string;
}[] = [
  {
    type: "text",
    label: "Text section",
    description: "Heading + paragraph",
  },
  {
    type: "columns",
    label: "Columns",
    description: "2–3 feature cards in a row",
  },
  {
    type: "cta",
    label: "Call to action",
    description: "Headline, copy and button",
  },
  {
    type: "stats",
    label: "Stats row",
    description: "Numbers with labels",
  },
  {
    type: "image",
    label: "Image",
    description: "Full-width photo or banner",
  },
  {
    type: "spacer",
    label: "Spacer",
    description: "Vertical breathing room",
  },
  {
    type: "listings",
    label: "Listings grid",
    description: "Live published properties",
  },
  {
    type: "map",
    label: "Property map",
    description: "Map of listings with coordinates",
  },
  {
    type: "team",
    label: "Team",
    description: "Active consultants from Agents",
  },
  {
    type: "faqs",
    label: "FAQs",
    description: "Published FAQ entries",
  },
  {
    type: "testimonials",
    label: "Testimonials",
    description: "Client reviews from Admin",
  },
  {
    type: "blog",
    label: "Blog posts",
    description: "Latest published articles",
  },
  {
    type: "form",
    label: "Lead form",
    description: "Enquiry / callback form",
  },
  {
    type: "areas",
    label: "Communities",
    description: "Live areas with inventory",
  },
  {
    type: "developers",
    label: "Developers",
    description: "Published developers",
  },
  {
    type: "split",
    label: "Image + text",
    description: "Photo beside a story or CTA",
  },
];

export function createBlockId() {
  return `blk_${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyBlock(type: PageBlockType): PageBlock {
  const id = createBlockId();
  switch (type) {
    case "text":
      return { id, type, title: "New section", body: "Add your copy here." };
    case "columns":
      return {
        id,
        type,
        title: "Highlights",
        items: [
          { title: "Column one", body: "Short supporting text." },
          { title: "Column two", body: "Short supporting text." },
          { title: "Column three", body: "Short supporting text." },
        ],
      };
    case "cta":
      return {
        id,
        type,
        title: "Ready to talk?",
        body: "Share what you’re looking for and a consultant will follow up.",
        buttonLabel: "Contact us",
        buttonHref: "/contact",
      };
    case "stats":
      return {
        id,
        type,
        title: "At a glance",
        items: [
          { value: "4.6★", label: "Client rating" },
          { value: "1,200+", label: "Live listings" },
          { value: "50+", label: "Developers" },
        ],
      };
    case "image":
      return {
        id,
        type,
        title: "",
        imageUrl: "",
        alt: "",
      };
    case "spacer":
      return { id, type, height: 48 };
    case "listings":
      return {
        id,
        type,
        title: "Featured listings",
        body: "Published inventory from the live catalogue.",
        query: "",
        completion: "all",
        limit: 6,
        layout: "grid",
        featuredOnly: false,
        buttonLabel: "View all properties",
        buttonHref: "/properties",
      };
    case "map":
      return {
        id,
        type,
        title: "Explore on the map",
        body: "Listings with map coordinates.",
        query: "",
        completion: "all",
        limit: 80,
        featuredOnly: false,
      };
    case "team":
      return {
        id,
        type,
        title: "Meet the team",
        limit: 8,
        buttonLabel: "View all agents",
        buttonHref: "/our-team",
      };
    case "faqs":
      return {
        id,
        type,
        title: "Frequently asked questions",
        limit: 8,
      };
    case "testimonials":
      return {
        id,
        type,
        title: "What clients say",
        limit: 6,
      };
    case "blog":
      return {
        id,
        type,
        title: "Latest articles",
        limit: 3,
        buttonLabel: "Read the journal",
        buttonHref: "/blog",
      };
    case "form":
      return {
        id,
        type,
        title: "Request a callback",
        body: "Share a few details and a consultant will follow up.",
      };
    case "areas":
      return {
        id,
        type,
        title: "Explore by community",
        limit: 8,
        buttonLabel: "All areas",
        buttonHref: "/areas",
      };
    case "developers":
      return {
        id,
        type,
        title: "Developers we work with",
        limit: 8,
        buttonLabel: "All developers",
        buttonHref: "/developers",
      };
    case "split":
      return {
        id,
        type,
        title: "A clearer way to buy in Dubai",
        body: "Tell us your budget and preferred communities — a consultant will follow up.",
        imageUrl: "/images/hero-dubai-skyline.png",
        imageSide: "left",
        buttonLabel: "Talk to us",
        buttonHref: "/contact",
        alt: "",
      };
  }
}

/** Convert legacy sections[] into text blocks; ensure blocks array exists. */
export function normalizePageContent(
  content: Partial<StaticPageContent> & {
    eyebrow?: string;
    title?: string;
    lede?: string;
  },
  defaults: StaticPageContent,
): StaticPageContent {
  const merged: StaticPageContent = {
    eyebrow: content.eyebrow ?? defaults.eyebrow,
    title: content.title ?? defaults.title,
    lede: content.lede ?? defaults.lede,
    metaTitle: content.metaTitle ?? defaults.metaTitle ?? "",
    metaDescription: content.metaDescription ?? defaults.metaDescription ?? "",
    blocks: [],
  };

  if (content.blocks && Array.isArray(content.blocks) && content.blocks.length) {
    merged.blocks = content.blocks.map((b) => ({
      ...b,
      id: b.id || createBlockId(),
    }));
  } else if (content.sections && content.sections.length) {
    merged.blocks = content.sections.map((s) => ({
      id: createBlockId(),
      type: "text" as const,
      title: s.title,
      body: s.body,
    }));
  } else {
    merged.blocks = defaults.blocks.map((b) => ({
      ...b,
      id: b.id || createBlockId(),
    }));
  }

  return merged;
}

function textBlocks(
  sections: { title: string; body: string }[],
): PageBlock[] {
  return sections.map((s) => ({
    id: createBlockId(),
    type: "text" as const,
    title: s.title,
    body: s.body,
  }));
}

export const DEFAULT_ABOUT_CONTENT: StaticPageContent = {
  eyebrow: "About us",
  title: "Built around clarity, access, and Dubai opportunity",
  lede: "Prowin Properties helps investors and end-users navigate Dubai’s off-plan and ready market — with curated inventory, grounded advice, and a team that stays reachable from first enquiry to handover.",
  blocks: [
    {
      id: "about_cols",
      type: "columns",
      title: "How we work",
      items: [
        {
          title: "Investor-first curation",
          body: "We prioritise projects with clear payment plans, credible developers, and locations that hold long-term demand.",
        },
        {
          title: "Direct conversations",
          body: "Speak with consultants who know the stock — not a ticket queue. Phone, WhatsApp, or a callback when it suits you.",
        },
        {
          title: "From browse to book",
          body: "Explore published inventory online, then move into guided shortlists, site visits, and paperwork support.",
        },
      ],
    },
    {
      id: "about_cta",
      type: "cta",
      title: "Talk to the team",
      body: "Tell us your budget, timeline and preferred communities.",
      buttonLabel: "Contact us",
      buttonHref: "/contact",
    },
  ],
};

export const DEFAULT_CONTACT_CONTENT: StaticPageContent = {
  eyebrow: "Contact",
  title: "Tell us what you’re looking for",
  lede: "Share a few details and a consultant will follow up. Prefer a direct line? Call or WhatsApp anytime.",
  blocks: [],
};

export const DEFAULT_PRIVACY_CONTENT: StaticPageContent = {
  eyebrow: "Legal",
  title: "Privacy policy",
  lede: "How we handle personal information you share with us.",
  blocks: textBlocks([
    {
      title: "Who we are",
      body: `${brand.name} (“we”, “us”) is a Dubai real estate brokerage based at ${brand.address}. You can reach us at ${brand.email} or ${brand.phone}.`,
    },
    {
      title: "Information we collect",
      body: "When you enquire, save a search, or contact us, we may collect your name, email address, phone number, preferred property criteria, and any message you send. Server logs may also record technical data such as IP address and browser type.",
    },
    {
      title: "How we use it",
      body: "We use your details to respond to enquiries, match you with suitable properties, send saved-search alerts you have requested, and improve our website. We do not sell your personal information.",
    },
    {
      title: "Sharing",
      body: "We may share enquiry details with our agents and, where needed to fulfil your request, with developers or trusted service providers under confidentiality obligations. We may also disclose information when required by UAE law or a regulator such as RERA.",
    },
    {
      title: "Retention",
      body: "We keep enquiry and alert records for as long as needed to provide the service and meet legal or regulatory requirements, then delete or anonymise them.",
    },
    {
      title: "Your choices",
      body: "You can ask us to correct or delete your personal information, or stop marketing and alert emails, by writing to us at the contact details above.",
    },
    {
      title: "Updates",
      body: "We may update this policy from time to time. The version published on this page is the one that applies.",
    },
  ]),
};

export const DEFAULT_TERMS_CONTENT: StaticPageContent = {
  eyebrow: "Legal",
  title: "Terms of use",
  lede: "Please read these terms before using the site or contacting our team.",
  blocks: textBlocks([
    {
      title: "Using this website",
      body: `This website is operated by ${brand.name}. By browsing or submitting an enquiry you agree to these terms. Content is provided for general information about Dubai property and our services.`,
    },
    {
      title: "Listings and prices",
      body: "Property details, prices, payment plans and availability are supplied by developers and third-party feeds and may change without notice. Nothing on this site is an offer, valuation or financial advice. Always verify particulars before committing.",
    },
    {
      title: "Enquiries",
      body: "When you request a callback or save a search, you ask us to contact you about matching properties. You confirm the contact details you provide are accurate.",
    },
    {
      title: "Intellectual property",
      body: "Text, branding and layout on this site belong to us or our licensors. You may not copy or republish them without permission, except for personal, non-commercial use.",
    },
    {
      title: "Liability",
      body: "To the fullest extent permitted by UAE law, we are not liable for losses arising from reliance on website content, temporary unavailability, or decisions made on the basis of third-party listing data.",
    },
    {
      title: "Governing law",
      body: "These terms are governed by the laws of the United Arab Emirates as applied in the Emirate of Dubai. Disputes are subject to the courts of Dubai.",
    },
  ]),
};

export const DEFAULT_OUR_TEAM_CONTENT: StaticPageContent = {
  eyebrow: "Our people",
  title: "Meet the team behind the move",
  lede: "RERA-certified specialists who know their communities inside out. Find your consultant and speak to them directly.",
  blocks: [],
};

export const DEFAULT_DEVELOPERS_CONTENT: StaticPageContent = {
  eyebrow: "Developers",
  title: "Dubai developers we work with",
  lede: "Explore projects by developer. Pinned partners appear first on property listings.",
  blocks: [],
};

export const DEFAULT_AREAS_CONTENT: StaticPageContent = {
  eyebrow: "Areas",
  title: "Dubai communities we know best",
  lede: "Browse neighbourhoods with live inventory — from established hubs to emerging corridors.",
  blocks: [],
};

export const DEFAULT_MARKET_INSIGHTS_CONTENT: StaticPageContent = {
  eyebrow: "Market desk",
  title: "Dubai property insights",
  lede: "Benchmarks, area notes and off-plan context from the Prowin desk — written for buyers and investors.",
  blocks: [
    {
      id: "insights_cols",
      type: "columns",
      title: "What we track for clients",
      items: [
        {
          title: "Off-plan payment plans",
          body: "How developers structure 60/40, 50/50 and 1% monthly plans — and what to check before you commit.",
        },
        {
          title: "Area price trends",
          body: "Where end-user demand is strongest across JVC, Business Bay, Dubai South and emerging communities.",
        },
        {
          title: "Yields & handover risk",
          body: "Typical rental yields by product type, and how to read construction progress before buying.",
        },
      ],
    },
  ],
};

export const DEFAULT_BLOG_CONTENT: StaticPageContent = {
  eyebrow: "Journal",
  title: "Guides & market notes",
  lede: "Off-plan explainers, area deep-dives and updates from the Prowin Properties team.",
  blocks: [],
};

export const DEFAULT_PAGE_CONTENT: Record<StaticPageKey, StaticPageContent> = {
  about: DEFAULT_ABOUT_CONTENT,
  contact: DEFAULT_CONTACT_CONTENT,
  privacy: DEFAULT_PRIVACY_CONTENT,
  terms: DEFAULT_TERMS_CONTENT,
  "our-team": DEFAULT_OUR_TEAM_CONTENT,
  developers: DEFAULT_DEVELOPERS_CONTENT,
  areas: DEFAULT_AREAS_CONTENT,
  "market-insights": DEFAULT_MARKET_INSIGHTS_CONTENT,
  blog: DEFAULT_BLOG_CONTENT,
};
