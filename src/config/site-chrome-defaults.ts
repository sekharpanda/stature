export type SiteNavItem = {
  label: string;
  href: string;
  /** Opens the lead modal instead of navigating. */
  kind?: "link" | "lead";
};

export type SiteFooterLink = {
  label: string;
  href: string;
  kind?: "link" | "lead";
};

export type SiteFooterColumn = {
  title: string;
  links: SiteFooterLink[];
};

export type SiteHourSlot = {
  days: string;
  time: string;
};

export type SiteRedirect = {
  from: string;
  to: string;
};

export type SiteChrome = {
  headerCtaLabel: string;
  headerCtaLeadSource: string;
  nav: SiteNavItem[];
  footerTagline: string;
  footerColumns: SiteFooterColumn[];
  social: {
    instagram: string;
    linkedin: string;
    facebook: string;
  };
  hours: SiteHourSlot[];
  timezoneLabel: string;
  redirects: SiteRedirect[];
};

export const RESERVED_PUBLIC_SLUGS = [
  "admin",
  "api",
  "login",
  "register",
  "forgot-password",
  "reset-password",
  "access-pending",
  "properties",
  "blog",
  "blogs",
  "about",
  "about-us",
  "contact",
  "privacy",
  "terms",
  "our-team",
  "developers",
  "areas",
  "market-insights",
  "insights",
  "buy",
  "off-plan",
  "campaigns",
  "dubai-projects",
  "preview",
  "media",
  "forms",
  "sitemap.xml",
  "robots.txt",
] as const;

export const DEFAULT_SITE_CHROME: SiteChrome = {
  headerCtaLabel: "List your property",
  headerCtaLeadSource: "list_property",
  nav: [
    { label: "Off-Plan", href: "/properties?completion=off-plan" },
    { label: "Buy", href: "/properties" },
    { label: "Enquire to rent", href: "/contact?intent=rent", kind: "lead" },
    { label: "Areas", href: "/areas" },
    { label: "Developers", href: "/developers" },
    { label: "Our Team", href: "/our-team" },
    { label: "Insights", href: "/market-insights" },
  ],
  footerTagline:
    "Dubai real estate brokerage for off-plan, ready sales, rentals and property management. RERA registered, based in Barsha Heights.",
  footerColumns: [
    {
      title: "Company",
      links: [
        { label: "About us", href: "/about" },
        { label: "Our team", href: "/our-team" },
        { label: "Insights", href: "/market-insights" },
        { label: "Blog", href: "/blog" },
        { label: "Contact", href: "/contact", kind: "lead" },
      ],
    },
    {
      title: "Services",
      links: [
        { label: "Off-plan", href: "/properties?completion=off-plan" },
        { label: "Buy", href: "/properties" },
        { label: "Areas", href: "/areas" },
        { label: "Developers", href: "/developers" },
        { label: "List your property", href: "/contact", kind: "lead" },
      ],
    },
  ],
  social: {
    instagram: "https://www.instagram.com/prowinproperties/",
    linkedin: "https://www.linkedin.com/company/prowin-properties/",
    facebook: "https://www.facebook.com/prowinproperties",
  },
  hours: [
    { days: "Monday – Friday", time: "9:00 – 18:00" },
    { days: "Saturday", time: "10:00 – 16:00" },
    { days: "Sunday", time: "Closed" },
  ],
  timezoneLabel: "Gulf Standard Time (GMT+4)",
  redirects: [],
};
