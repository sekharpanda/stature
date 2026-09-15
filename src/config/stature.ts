/**
 * Stature Properties — public one-page site.
 * Static copy for now. The later Prowin-like build can replace this with CMS data.
 */

export const stature = {
  name: "Stature",
  legalName: "Stature Properties Private Limited",
  tagline:
    "Bengaluru sales, marketing, RERA and home-loan support — one desk, since 2025.",
  phone: "+91 70936 39252",
  phoneHref: "tel:+917093639252",
  whatsapp: "+917093639252",
  email: "support@staturegroup.in",
  address:
    "#512, Shanti Nilaya, Banaswadi, Kalyan Nagar II Block, Bangalore 560043",
  city: "Bengaluru",
  foundedYear: 2025,
  domain: "https://staturegroup.in",
  logo: "/brand/stature-logo.png",
  linkedin: "https://www.linkedin.com/company/stature-group",
} as const;

export const statureNav = [
  { label: "Home", href: "/#top" },
  { label: "Services", href: "/#services" },
  { label: "Projects", href: "/#projects" },
  { label: "Areas", href: "/#areas" },
  { label: "About", href: "/#about" },
  { label: "Contact", href: "/#contact" },
] as const;

export const statureLegalNav = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Disclaimer", href: "/disclaimer" },
  { label: "Cookies", href: "/cookies" },
] as const;

export function statureWhatsAppHref(text?: string) {
  const digits = stature.whatsapp.replace(/\D/g, "");
  if (!digits) return "#contact";
  const base = `https://wa.me/${digits}`;
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}

export const statureContent = {
  seo: {
    title: "Stature Properties | Homes in Bengaluru",
    description:
      "Stature Properties Private Limited is a Bengaluru real-estate marketing and sales desk started in 2025. New launches, ready homes, RERA guidance and home-loan support.",
  },
  hero: {
    eyebrow: "Bengaluru · Est. 2025",
    title: "Find your place in Bengaluru.",
    lede: "A young local team for new launches, ready homes, and the paperwork that sits between a brochure and the keys.",
    imageUrl: "/images/hero-bengaluru.jpg",
    searchPlaceholder: "Whitefield, 3 BHK, budget…",
  },
  heroTabs: ["Buy", "New launch", "Home loan"] as const,
  trust: [
    { value: "2025", label: "Founded in Bengaluru" },
    { value: "1 yr", label: "On the ground" },
    { value: "RERA", label: "Compliance support" },
    { value: "Loans", label: "Bank facilitation" },
  ],
  paths: {
    eyebrow: "Start here",
    title: "Whatever your move, one team.",
    items: [
      {
        n: "01",
        title: "New launches",
        body: "Early looks at apartments and villas still opening in the city’s growth corridors.",
        href: "#projects",
        cta: "See projects →",
      },
      {
        n: "02",
        title: "Buy a home",
        body: "A shortlist that matches how you live — commute, schools, and a plan you can actually pay.",
        href: "#contact",
        cta: "Talk to us →",
      },
      {
        n: "03",
        title: "Home loans",
        body: "We sit with you through eligibility, banks and the documents nobody enjoys chasing.",
        href: "#contact",
        cta: "Get help →",
      },
      {
        n: "04",
        title: "RERA & marketing",
        body: "Karnataka RERA guidance and a local sales desk for developers who need serious buyer conversations.",
        href: "#contact",
        cta: "Partner →",
      },
    ],
  },
  featured: {
    eyebrow: "On our desk",
    title: "Homes we are placing in Bengaluru",
    description:
      "A small, current set — not a catalogue. Ask for plans, a site walk, or what is actually available this month.",
  },
  projects: [
    {
      id: "brigade-belvedere",
      name: "Brigade Belvedere",
      location: "Budigere Cross",
      priceLabel: "₹96 L",
      planLabel: "1.5–3 BHK",
      handoverLabel: "New launch",
      tag: "New launch",
      coverUrl: "/images/project-east.jpg",
    },
    {
      id: "natures-nest-nps",
      name: "Natures Nest",
      location: "Kanamangala, East Bengaluru",
      priceLabel: "On request",
      planLabel: "2–4 BHK",
      handoverLabel: "NPS · 2031",
      tag: "New launch",
      coverUrl: "/images/project-natures-nest.jpg",
    },
    {
      id: "ruchira-the-rise",
      name: "Ruchira The Rise",
      location: "Old Madras Road",
      priceLabel: "₹1.73 Cr",
      planLabel: "2–4 BHK",
      handoverLabel: "Handover 2031",
      tag: "High-rise",
      coverUrl: "/images/project-ruchira-rise.jpg",
    },
  ],
  enquire: {
    eyebrow: "Work with us",
    title: "Tell us what you need. We will take it from there.",
    body: "Buying, a first site visit, or a project that needs a local sales desk — leave your number and we call you back.",
    ctaLabel: "WhatsApp us",
    formTitle: "Request a callback",
    formNote:
      "Bengaluru based · We reply on working days · Email or WhatsApp, no spam lists.",
  },
  areas: {
    eyebrow: "Where we work",
    title: "Bengaluru, corridor by corridor",
    description:
      "We stay close to the stretches buyers actually commute — east, north and the airport belt.",
    items: [
      { name: "Whitefield", subtitle: "IT east" },
      { name: "Budigere Cross", subtitle: "East growth" },
      { name: "Old Madras Road", subtitle: "East" },
      { name: "Yelahanka", subtitle: "North" },
      { name: "Kanamangala", subtitle: "East" },
      { name: "Devanahalli", subtitle: "Airport belt" },
      { name: "Hebbal", subtitle: "North" },
      { name: "Banaswadi", subtitle: "Our desk" },
      { name: "Kalyan Nagar", subtitle: "North-east" },
      { name: "Sarjapur Road", subtitle: "South-east" },
      { name: "Electronic City", subtitle: "South" },
      { name: "Indiranagar", subtitle: "Central east" },
    ],
  },
  about: {
    eyebrow: "About Stature",
    title: "One year in. Still small enough to pick up the phone.",
    body: "Stature Properties Private Limited opened in Bengaluru in 2025. We are a compact marketing and sales desk: help you choose a home, walk the site, and stay until the loan and handover are not a mystery.",
    stats: [
      { value: "2025", label: "Started here" },
      { value: "BLR", label: "Bengaluru HQ" },
      { value: "One desk", label: "Buy · launch · finance" },
    ],
    ctaLabel: "Start a conversation",
  },
} as const;
