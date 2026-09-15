import type { ReactNode } from "react";
import {
  linesToList,
  parseChartBars,
  parsePipeTable,
  youtubeEmbedUrl,
  type LandingCampaignConfig,
} from "@/types/landing-campaign";
import {
  CampaignLeadForm,
  CampaignLeadProvider,
  LeadCta,
} from "@/features/marketing/campaign-lead-capture";
import { CampaignTrackingScripts } from "@/features/marketing/campaign-tracking-scripts";

/** Exact Embassy Knowledge Park–style palette */
const GREEN = "#002117";
const GREEN_MID = "#0A2F24";
const GOLD = "#B7945D";
const GOLD_DEEP = "#9A7A4A";
const CREAM = "#F5E6D3";
const CREAM_SOFT = "#FAF3EA";
const INK = "#1C2B24";

const FALLBACK_HERO =
  "https://images.unsplash.com/photo-1512453979798-5ea8333bcea1?auto=format&fit=crop&w=2400&q=85";

const jumpNav = [
  { id: "overview", label: "Overview" },
  { id: "investment", label: "Investment" },
  { id: "location", label: "Location" },
  { id: "plans", label: "Plans" },
  { id: "amenities", label: "Amenities" },
  { id: "gallery", label: "Gallery" },
  { id: "enquire", label: "Contact" },
];

function BrandMark({
  config,
  light = false,
  size = "md",
}: {
  config: LandingCampaignConfig;
  light?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const h = size === "lg" ? "h-12" : size === "sm" ? "h-8" : "h-[42px]";
  if (config.logoUrl) {
    return (
      <span className="inline-flex items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={config.logoUrl}
          alt={config.brandName}
          className={`${h} w-auto max-w-[240px] object-contain`}
        />
      </span>
    );
  }
  return (
    <div className={light ? "text-white" : "text-[#002117]"}>
      <p
        className={`font-display leading-none tracking-[0.01em] ${
          size === "lg" ? "text-2xl" : "text-[1.35rem] md:text-[1.65rem]"
        }`}
      >
        {config.brandName}
      </p>
      {config.brandTagline ? (
        <p
          className={`mt-1.5 text-[9px] font-semibold tracking-[0.28em] uppercase md:text-[10px] ${
            light ? "text-white/75" : "text-[#002117]/55"
          }`}
        >
          {config.brandTagline}
        </p>
      ) : null}
    </div>
  );
}

function DiamondIcon() {
  return (
    <svg
      viewBox="0 0 12 12"
      className="mt-1.5 size-3 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      aria-hidden
    >
      <path d="M6 1.2 10.8 6 6 10.8 1.2 6 6 1.2Z" />
    </svg>
  );
}

function Eyebrow({
  children,
  light = false,
}: {
  children: ReactNode;
  light?: boolean;
}) {
  return (
    <p
      className={`text-[11px] font-semibold tracking-[0.32em] uppercase ${
        light ? "text-[#C4A484]" : "text-[#A8895E]"
      }`}
    >
      {children}
    </p>
  );
}

function GoldBtn({
  href,
  children,
  outline = false,
  className = "",
}: {
  href: string;
  children: ReactNode;
  outline?: boolean;
  className?: string;
}) {
  if (outline) {
    return (
      <a
        href={href}
        className={`inline-flex items-center justify-center rounded-[3px] border border-white/85 px-7 py-3.5 text-[11px] font-bold tracking-[0.2em] text-white uppercase transition hover:bg-white/10 ${className}`}
      >
        {children}
      </a>
    );
  }
  return (
    <a
      href={href}
      className={`inline-flex items-center justify-center rounded-[3px] bg-[#C4A484] px-7 py-3.5 text-[11px] font-bold tracking-[0.2em] text-[#002117] uppercase transition hover:brightness-105 ${className}`}
    >
      {children}
    </a>
  );
}

function BarChart({ title, barsRaw }: { title: string; barsRaw: string }) {
  const bars = parseChartBars(barsRaw);
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <div className="rounded-[3px] border border-white/10 bg-black/20 p-6 backdrop-blur-sm md:p-8">
      <h3 className="font-display text-lg text-white md:text-xl">{title}</h3>
      <div className="mt-10 flex h-52 items-end justify-between gap-2.5 md:gap-4">
        {bars.map((bar) => (
          <div
            key={bar.label}
            className="flex min-w-0 flex-1 flex-col items-center gap-2"
          >
            <span className="text-[10px] tabular-nums text-white/55">
              {bar.value}
            </span>
            <div className="flex h-40 w-full items-end justify-center">
              <div
                className="w-full max-w-[52px] rounded-t-[2px]"
                style={{
                  height: `${Math.max(10, (bar.value / max) * 100)}%`,
                  background: `linear-gradient(180deg, ${GOLD} 0%, ${GOLD_DEEP} 100%)`,
                  boxShadow: `0 0 24px ${GOLD}33`,
                }}
              />
            </div>
            <span className="truncate text-[10px] tracking-[0.12em] text-white/70 uppercase">
              {bar.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineIcon({ i }: { i: number }) {
  const icons = [
    <path key="a" d="M4 18V8l8-4 8 4v10H4zm5-2h6v-5H9v5z" />,
    <path key="b" d="M4 16c3.5-7 12.5-7 16 0M8 10a4 4 0 018 0" />,
    <path key="c" d="M12 3v18M6 9h12M7 15h10" />,
    <path key="d" d="M5 19l7-14 7 14H5zm7-5v5" />,
    <path key="e" d="M4 12h16M12 4v16M7 7l10 10M17 7L7 17" />,
    <path key="f" d="M6 6h12v12H6zM9 9h6v6H9z" />,
    <path key="g" d="M12 4l2.5 5.5L20 11l-4 4.2L17.5 21 12 18l-5.5 3L8 15.2 4 11l5.5-1.5L12 4z" />,
    <path key="h" d="M4 19V9l8-5 8 5v10" />,
  ];
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-7"
      fill="none"
      stroke={GOLD}
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {icons[i % icons.length]}
    </svg>
  );
}

export function CampaignLandingView({
  title,
  slug,
  config,
  preview = false,
}: {
  title: string;
  slug: string;
  config: LandingCampaignConfig;
  preview?: boolean;
}) {
  const bullets = linesToList(config.hero.bullets);
  const locationPoints = linesToList(config.location.points);
  const nearby = linesToList(config.location.nearby);
  const overviewParas = linesToList(config.overview.body);
  const amenities = config.amenities
    .split(/[,|\n]/)
    .map((a) => a.trim())
    .filter(Boolean);
  const gallery =
    config.media.galleryUrls?.length > 0
      ? config.media.galleryUrls
      : config.media.galleryImageUrl
        ? [config.media.galleryImageUrl]
        : [];
  const yt = config.media.youtubeUrl
    ? youtubeEmbedUrl(config.media.youtubeUrl)
    : "";
  const wa = config.whatsapp.replace(/[^\d]/g, "");
  const heroImage = config.hero.imageUrl?.trim() || FALLBACK_HERO;
  const table = parsePipeTable(
    config.investment.tableHeaders,
    config.investment.tableRows,
  );

  return (
    <CampaignLeadProvider
      config={config}
      campaignSlug={slug}
      campaignTitle={title}
      preview={preview}
    >
    <div
      className="campaign-landing min-h-screen antialiased"
      style={{ backgroundColor: CREAM_SOFT, color: INK }}
    >
      <style>{`
        .campaign-landing { font-feature-settings: "kern", "liga"; }
        .campaign-landing details summary::-webkit-details-marker { display: none; }
        @keyframes campaign-rise {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .campaign-rise { animation: campaign-rise 0.8s ease-out both; }
        .campaign-rise-delay { animation-delay: 0.15s; }
        .campaign-rise-delay-2 { animation-delay: 0.28s; }
      `}</style>

      {!preview ? (
        <CampaignTrackingScripts tracking={config.tracking} />
      ) : null}
      {preview ? (
        <div
          className="sticky top-0 z-[70] px-4 py-2 text-center text-xs font-semibold tracking-wide text-[#002117]"
          style={{ backgroundColor: GOLD }}
        >
          Preview mode — publish to make this live at /dubai-projects/…
        </div>
      ) : null}

      {/* ── 1. HERO ───────────────────────────────────────── */}
      <header className="relative isolate min-h-[100svh] overflow-hidden text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${heroImage})`,
            transform: "scale(1.03)",
          }}
        />
        {/* Soft dark wash so photo stays visible but type reads clearly */}
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25" />

        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1180px] flex-col px-5 pb-12 pt-6 md:px-8 lg:pb-16">
          {/* Top bar — logo left, Enquire Now right */}
          <div className="flex items-start justify-between gap-4">
            <BrandMark config={config} light />
            <LeadCta
              intent="enquire"
              solidWhiteText
              className="!px-5 !py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
            >
              Enquire now
            </LeadCta>
          </div>

          <div className="grid flex-1 items-center gap-10 pt-10 pb-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12 lg:pt-14">
            {/* Left copy */}
            <div className="campaign-rise max-w-2xl">
              {config.hero.eyebrow ? (
                <p className="text-[11px] font-semibold tracking-[0.28em] text-[#B7945D] uppercase md:text-[12px]">
                  {config.hero.eyebrow}
                </p>
              ) : null}

              <h1 className="mt-4 font-display text-[2.45rem] leading-[1.08] text-balance md:text-[3.25rem] lg:text-[3.55rem]">
                {config.hero.headline || title}
              </h1>

              {config.hero.subheadline ? (
                <p className="mt-4 text-[15px] font-medium tracking-wide text-white/85 md:text-base">
                  {config.hero.subheadline}
                </p>
              ) : null}

              {bullets.length ? (
                <ul className="campaign-rise campaign-rise-delay mt-8 grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
                  {bullets.map((b) => (
                    <li
                      key={b}
                      className="flex items-start gap-2.5 text-[13.5px] leading-snug text-white/92 md:text-[14.5px]"
                    >
                      <span className="text-[#B7945D]">
                        <DiamondIcon />
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="campaign-rise campaign-rise-delay-2 mt-9 flex flex-wrap gap-3">
                <LeadCta intent="brochure" solidWhiteText>
                  {config.hero.primaryCta.label}
                </LeadCta>
                <GoldBtn
                  href={config.hero.secondaryCta.href || "#investment"}
                  outline
                  className="!border-[#B7945D]"
                >
                  {config.hero.secondaryCta.label}
                </GoldBtn>
              </div>
            </div>

            {/* Right floating form */}
            <div
              id="enquire"
              className="campaign-rise campaign-rise-delay w-full max-w-md justify-self-end rounded-[2px] bg-white p-6 text-[#1C2B24] shadow-[0_28px_80px_rgba(0,0,0,0.4)] md:p-7 lg:max-w-none"
            >
              <h2 className="font-display text-[1.65rem] leading-tight text-[#1C2B24] md:text-[1.85rem]">
                {config.hero.formTitle || "Download Brochure & Price"}
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-[#1C2B24]/60">
                {config.hero.formSubtitle ||
                  "Official brochure, floor plans & Phase 1 launch pricing — instantly"}
              </p>
              <CampaignLeadForm
                config={config}
                campaignSlug={slug}
                campaignTitle={title}
                preview={preview}
                intent="brochure"
                variant="hero"
              />
            </div>
          </div>
        </div>
      </header>

      {/* ── 2. QUICK HIGHLIGHTS BAR (exact reference) ─────── */}
      <section
        className="border-y border-white/5 py-7 text-white md:py-9"
        style={{ backgroundColor: GREEN }}
      >
        <div className="mx-auto grid max-w-[1120px] grid-cols-2 gap-6 px-5 md:grid-cols-4 md:gap-4 md:px-8">
          {config.stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p
                className="font-display text-2xl md:text-3xl"
                style={{ color: GOLD }}
              >
                {stat.value}
              </p>
              <p className="mt-1.5 text-[10px] tracking-[0.22em] text-white/60 uppercase">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Sticky jump links ─────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 border-b border-white/5 text-white"
        style={{ backgroundColor: GREEN_MID }}
      >
        <div className="mx-auto flex max-w-[1120px] gap-0 overflow-x-auto px-2 md:justify-center">
          {jumpNav.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="shrink-0 px-4 py-3.5 text-[10px] tracking-[0.22em] text-white/70 uppercase transition hover:text-[#C4A484] md:px-5"
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      {/* ── 3. PROJECT OVERVIEW ───────────────────────────── */}
      <section
        id="overview"
        className="scroll-mt-16 py-20 md:py-28"
        style={{ backgroundColor: CREAM }}
      >
        <div className="mx-auto grid max-w-[1120px] items-center gap-12 px-5 md:grid-cols-2 md:gap-16 md:px-8">
          <div>
            <Eyebrow>{config.overview.eyebrow || "The project"}</Eyebrow>
            <h2 className="mt-4 font-display text-[2rem] leading-[1.18] md:text-[2.55rem]">
              {config.overview.title}
            </h2>
            <div className="mt-6 space-y-4 text-[15px] leading-[1.85] text-[#1C2B24]/75">
              {overviewParas.map((p) => (
                <p key={p.slice(0, 48)}>{p}</p>
              ))}
            </div>
            <GoldBtn href="#plans" className="mt-9 !text-[#002117]">
              {config.overview.ctaLabel || "Know more"}
            </GoldBtn>
          </div>
          <div className="overflow-hidden rounded-[3px] shadow-[0_24px_60px_rgba(0,33,23,0.14)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                config.overview.imageUrl ||
                "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=85"
              }
              alt="Project overview"
              className="aspect-[5/4] w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── 4. INVESTMENT & GROWTH (dark) ─────────────────── */}
      <section
        id="investment"
        className="scroll-mt-16 relative overflow-hidden py-20 text-white md:py-28"
        style={{ backgroundColor: GREEN }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `radial-gradient(ellipse at 20% 0%, ${GOLD} 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, ${GOLD} 0%, transparent 45%)`,
          }}
        />
        <div className="relative mx-auto max-w-[1120px] px-5 md:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow light>Investment growth</Eyebrow>
            <h2 className="mt-4 font-display text-[2rem] leading-tight md:text-[2.55rem]">
              {config.investment.title}
            </h2>
          </div>

          <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {config.stats.map((stat, i) => (
              <div key={`inv-${stat.label}`} className="text-center">
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full border border-[#C4A484]/40">
                  <LineIcon i={i} />
                </div>
                <p className="font-display text-4xl" style={{ color: GOLD }}>
                  {stat.value}
                </p>
                <p className="mt-2 text-[11px] tracking-[0.18em] text-white/55 uppercase">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-16 grid gap-6 lg:grid-cols-2">
            {config.investment.charts.slice(0, 2).map((chart) => (
              <BarChart
                key={chart.title}
                title={chart.title}
                barsRaw={chart.bars}
              />
            ))}
          </div>

          {table.headers.length ? (
            <div className="mt-12 overflow-x-auto rounded-[3px] border border-white/10">
              <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-[#C4A484]/12">
                    {table.headers.map((h) => (
                      <th
                        key={h}
                        className="px-5 py-4 text-[11px] font-semibold tracking-[0.18em] uppercase"
                        style={{ color: GOLD }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, ri) => (
                    <tr key={ri} className="border-t border-white/10">
                      {row.map((cell, ci) => (
                        <td
                          key={`${ri}-${ci}`}
                          className={`px-5 py-4 ${
                            ci === 0
                              ? "font-medium text-white"
                              : "text-[#C4A484]"
                          }`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </section>

      {/* ── 5. LOCATION ADVANTAGES (cream timeline) ───────── */}
      <section
        id="location"
        className="scroll-mt-16 py-20 md:py-28"
        style={{ backgroundColor: CREAM }}
      >
        <div className="mx-auto max-w-[800px] px-5 text-center md:px-8">
          <Eyebrow>Location advantages</Eyebrow>
          <h2 className="mt-4 font-display text-[2rem] leading-tight md:text-[2.55rem]">
            {config.location.title}
          </h2>
        </div>
        <div className="mx-auto mt-14 max-w-[720px] px-5 md:px-8">
          <ol className="relative space-y-0">
            <div
              className="absolute top-3 bottom-3 left-[19px] w-px md:left-1/2 md:-translate-x-px"
              style={{ backgroundColor: `${GOLD}55` }}
            />
            {locationPoints.map((point, i) => (
              <li
                key={point}
                className={`relative flex gap-5 py-5 md:items-center md:gap-0 ${
                  i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                <div
                  className={`flex flex-1 ${i % 2 === 0 ? "md:justify-end md:pr-12 md:text-right" : "md:justify-start md:pl-12 md:text-left"}`}
                >
                  <div>
                    <p className="font-display text-lg md:text-xl">{point}</p>
                  </div>
                </div>
                <span
                  className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 bg-[#F5E6D3] text-xs font-bold md:absolute md:left-1/2 md:-translate-x-1/2"
                  style={{ borderColor: GOLD, color: GOLD_DEEP }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="hidden flex-1 md:block" />
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── 6. CHOOSE YOUR SPACE (pricing cards) ──────────── */}
      <section
        id="plans"
        className="scroll-mt-16 bg-white py-20 md:py-28"
      >
        <div className="mx-auto max-w-[1120px] px-5 md:px-8">
          <div className="text-center">
            <Eyebrow>Floor plans</Eyebrow>
            <h2 className="mt-4 font-display text-[2rem] md:text-[2.55rem]">
              Choose your space
            </h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {config.pricing.map((plan, i) => (
              <article
                key={plan.name}
                className="flex flex-col items-center rounded-[3px] border border-[#002117]/08 px-8 py-12 text-center shadow-[0_12px_40px_rgba(0,33,23,0.06)]"
                style={{ backgroundColor: CREAM_SOFT }}
              >
                <div
                  className="mb-6 flex size-20 items-center justify-center rounded-[3px] bg-white shadow-sm"
                  style={{ color: GOLD_DEEP }}
                >
                  <svg
                    viewBox="0 0 64 64"
                    className="size-12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    aria-hidden
                  >
                    <rect x="8" y="14" width="48" height="36" />
                    <path d="M8 32h48M32 14v36M18 14v10M46 40v10" />
                    {i > 0 ? <path d="M20 40h12v10H20z" /> : null}
                  </svg>
                </div>
                <h3 className="font-display text-3xl">{plan.name}</h3>
                <p className="mt-2 text-sm tracking-wide text-[#002117]/55">
                  {plan.size}
                </p>
                <p
                  className="mt-6 font-display text-2xl"
                  style={{ color: GOLD_DEEP }}
                >
                  {plan.price}
                </p>
                <LeadCta intent="price" className="mt-8">
                  {plan.ctaLabel || "View price"}
                </LeadCta>
              </article>
            ))}
          </div>

          {config.floorPlans.length > 2 ? (
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {config.floorPlans.map((plan) => (
                <div
                  key={plan.name}
                  className="rounded-[3px] border border-[#002117]/08 bg-white px-5 py-6 text-center"
                >
                  <p className="font-display text-lg">{plan.name}</p>
                  <p className="mt-1 text-xs text-[#002117]/50">{plan.size}</p>
                  <p
                    className="mt-3 text-sm font-semibold"
                    style={{ color: GOLD_DEEP }}
                  >
                    {plan.price}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* ── 7. STRATEGIC HUB / MAP (dark) ─────────────────── */}
      <section
        className="py-20 text-white md:py-28"
        style={{ backgroundColor: GREEN }}
      >
        <div className="mx-auto max-w-[1120px] px-5 md:px-8">
          <div className="text-center">
            <Eyebrow light>Strategic connectivity</Eyebrow>
            <h2 className="mt-4 font-display text-[2rem] md:text-[2.55rem]">
              A hub connected to every opportunity
            </h2>
          </div>
          <div className="mt-12 overflow-hidden rounded-[3px] border border-white/10 bg-black/25 shadow-2xl">
            {config.location.mapEmbedUrl ? (
              <iframe
                title="Project map"
                src={config.location.mapEmbedUrl}
                className="aspect-[16/9] w-full border-0 md:aspect-[21/9]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="flex aspect-[16/9] items-center justify-center text-sm text-white/60">
                Add a Google Maps embed URL in the campaign builder
              </div>
            )}
          </div>
          {config.location.googleMapsUrl ? (
            <div className="mt-4 text-center">
              <a
                href={config.location.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm tracking-wide text-[#C4A484] underline underline-offset-4"
              >
                Open in Google Maps
              </a>
            </div>
          ) : null}
          {nearby.length ? (
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {nearby.map((item, i) => (
                <div
                  key={item}
                  className="rounded-[3px] border border-white/10 bg-white/[0.04] px-5 py-6"
                >
                  <LineIcon i={i + 2} />
                  <p className="mt-3 text-sm leading-snug text-white/85">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* ── 8. AMENITY FEATURE CARDS ──────────────────────── */}
      <section
        id="amenities"
        className="scroll-mt-16 py-20 md:py-28"
        style={{ backgroundColor: CREAM }}
      >
        <div className="mx-auto max-w-[1120px] px-5 md:px-8">
          <div className="text-center">
            <Eyebrow>Lifestyle</Eyebrow>
            <h2 className="mt-4 font-display text-[2rem] md:text-[2.55rem]">
              Designed for elevated living
            </h2>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {config.highlights.map((h, i) => (
              <article
                key={h.title}
                className="rounded-[3px] bg-white p-8 shadow-[0_10px_36px_rgba(0,33,23,0.06)]"
              >
                <LineIcon i={i} />
                <h3 className="mt-5 font-display text-xl">{h.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#002117]/65">
                  {linesToList(h.points).join(" ") || h.points}
                </p>
              </article>
            ))}
          </div>

          {/* ── 9. Extra amenity icon grid ── */}
          {amenities.length ? (
            <div className="mt-16">
              <p className="text-center text-sm tracking-[0.2em] text-[#002117]/45 uppercase">
                {amenities.length}+ amenities
              </p>
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {amenities.map((a, i) => (
                  <div
                    key={a}
                    className="flex flex-col items-center gap-3 rounded-[3px] border border-[#002117]/06 bg-white/70 px-3 py-6 text-center text-[13px]"
                  >
                    <LineIcon i={i} />
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* ── 10. GALLERY (expanded) ────────────────────────── */}
      <section id="gallery" className="scroll-mt-16 bg-white py-20 md:py-28">
        <div className="mx-auto max-w-[1120px] px-5 md:px-8">
          <div className="text-center">
            <Eyebrow>Gallery</Eyebrow>
            <h2 className="mt-4 font-display text-[2rem] md:text-[2.55rem]">
              {config.media.galleryTitle || "Glimpse of the lifestyle"}
            </h2>
          </div>

          {gallery.length >= 2 ? (
            <div className="mt-14 grid gap-4 md:grid-cols-2">
              {gallery.slice(0, 2).map((url, i) => (
                <a
                  key={url + i}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative aspect-[16/10] overflow-hidden rounded-[3px] shadow-lg"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Featured ${i + 1}`}
                    className="size-full object-cover transition duration-700 group-hover:scale-[1.04]"
                  />
                </a>
              ))}
            </div>
          ) : null}

          {gallery.length > 2 ? (
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {gallery.slice(2).map((url, i) => (
                <a
                  key={url + i}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className={`group relative overflow-hidden rounded-[3px] shadow-md ${
                    i === 0 ? "md:col-span-2 md:aspect-[16/9]" : "aspect-[4/3]"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Gallery ${i + 3}`}
                    className="size-full object-cover transition duration-700 group-hover:scale-105"
                  />
                </a>
              ))}
            </div>
          ) : gallery.length === 1 ? (
            <div className="mt-14 overflow-hidden rounded-[3px] shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gallery[0]}
                alt="Gallery"
                className="aspect-[21/9] w-full object-cover"
              />
            </div>
          ) : null}

          <div className="mt-8 text-center">
            <LeadCta intent="brochure">Request full brochure</LeadCta>
          </div>

          <div
            className="mt-12 overflow-hidden rounded-[3px] shadow-xl"
            style={{ backgroundColor: GREEN }}
          >
            {yt ? (
              <iframe
                title="Project video"
                src={yt}
                className="aspect-video w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="flex aspect-video items-center justify-center text-sm text-white/60">
                Add a YouTube URL in the campaign builder
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 11. SECONDARY CTA ─────────────────────────────── */}
      <section className="relative overflow-hidden py-28 text-white md:py-36">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${config.finalCta.backgroundImageUrl || heroImage})`,
          }}
        />
        <div className="absolute inset-0 bg-[#00150f]/78" />
        <div className="relative z-10 mx-auto max-w-3xl px-5 text-center md:px-8">
          <h2 className="font-display text-3xl leading-tight md:text-5xl">
            {config.finalCta.headline}
          </h2>
          <LeadCta
            intent="site-visit"
            className="mt-10 shadow-lg"
          >
            {config.finalCta.buttonLabel}
          </LeadCta>
        </div>
      </section>

      {/* ── 12. FAQ ───────────────────────────────────────── */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-[760px] px-5 md:px-8">
          <div className="text-center">
            <Eyebrow>FAQs</Eyebrow>
            <h2 className="mt-4 font-display text-[2rem] md:text-[2.55rem]">
              Project details & answers
            </h2>
          </div>
          <div className="mt-12">
            {config.faqs.map((faq) => (
              <details
                key={faq.question}
                className="group border-b border-[#002117]/12"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-6 font-display text-lg md:text-xl">
                  {faq.question}
                  <span
                    className="text-xl transition group-open:rotate-45"
                    style={{ color: GOLD_DEEP }}
                  >
                    +
                  </span>
                </summary>
                <p className="pb-6 text-[15px] leading-relaxed text-[#002117]/7">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── 13. FOOTER ────────────────────────────────────── */}
      <footer className="py-14 text-white/60" style={{ backgroundColor: GREEN }}>
        <div className="mx-auto grid max-w-[1120px] gap-10 px-5 md:grid-cols-[1.4fr_1fr_1fr] md:px-8">
          <div>
            <BrandMark config={config} light size="lg" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed">
              {config.address || "Dubai, United Arab Emirates"}
            </p>
          </div>
          <div className="text-sm">
            <p
              className="text-[11px] tracking-[0.2em] uppercase"
              style={{ color: GOLD }}
            >
              Contact
            </p>
            <a
              href={`tel:${config.phone.replace(/\s/g, "")}`}
              className="mt-3 block text-white"
            >
              {config.phone}
            </a>
            {wa ? (
              <a
                href={`https://wa.me/${wa}`}
                className="mt-2 inline-block text-white underline underline-offset-4"
              >
                WhatsApp
              </a>
            ) : null}
          </div>
          <div className="text-sm">
            <p
              className="text-[11px] tracking-[0.2em] uppercase"
              style={{ color: GOLD }}
            >
              Explore
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {jumpNav.slice(0, 5).map((n) => (
                <a key={n.id} href={`#${n.id}`} className="hover:text-white">
                  {n.label}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="mx-auto mt-12 max-w-[1120px] border-t border-white/10 px-5 pt-6 text-[11px] leading-relaxed text-white/35 md:px-8">
          <p>
            © {new Date().getFullYear()} {config.brandName}. All rights
            reserved. Information on this page is indicative and subject to
            change. Prices, payment plans and availability may vary. Please
            verify all details with our sales consultants before making a
            purchase decision. {title}.
          </p>
        </div>
      </footer>

      {wa ? (
        <div className="fixed right-5 bottom-5 z-50 flex flex-col gap-3">
          <a
            href={`https://wa.me/${wa}`}
            className="flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_28px_rgba(37,211,102,0.5)] transition hover:scale-105"
            aria-label="WhatsApp"
          >
            <svg viewBox="0 0 24 24" className="size-7 fill-current" aria-hidden>
              <path d="M20.5 3.5A11 11 0 0 0 3.4 17.7L2 22l4.4-1.3A11 11 0 1 0 20.5 3.5zm-8.5 17a9 9 0 0 1-4.6-1.3l-.3-.2-2.6.8.8-2.5-.2-.3A9 9 0 1 1 12 20.5zm5-6.7c-.3-.1-1.6-.8-1.8-.9s-.4-.1-.6.1-.7.9-.8 1-.3.2-.6.1a7.3 7.3 0 0 1-2.1-1.3 8 8 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.5.1-.3a.7.7 0 0 0 0-.6c0-.2-.6-1.4-.8-1.9s-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 2.9 2.9 0 0 0-.9 2.2 5 5 0 0 0 1.1 2.6 11.4 11.4 0 0 0 4.4 3.9 15 15 0 0 0 1.5.5 3.5 3.5 0 0 0 1.6.1 2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .2-1.2c-.1-.1-.3-.2-.6-.3z" />
            </svg>
          </a>
          <a
            href={`tel:${config.phone.replace(/\s/g, "")}`}
            className="flex size-14 items-center justify-center rounded-full bg-[#B7945D] text-white shadow-[0_8px_28px_rgba(183,148,93,0.45)] transition hover:scale-105"
            aria-label="Call us"
          >
            <svg viewBox="0 0 24 24" className="size-6 fill-current" aria-hidden>
              <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.3 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1L6.6 10.8z" />
            </svg>
          </a>
        </div>
      ) : (
        <a
          href={`tel:${config.phone.replace(/\s/g, "")}`}
          className="fixed right-5 bottom-5 z-50 flex size-14 items-center justify-center rounded-full bg-[#B7945D] text-white shadow-[0_8px_28px_rgba(183,148,93,0.45)] transition hover:scale-105"
          aria-label="Call us"
        >
          <svg viewBox="0 0 24 24" className="size-6 fill-current" aria-hidden>
            <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.3 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1L6.6 10.8z" />
          </svg>
        </a>
      )}
    </div>
    </CampaignLeadProvider>
  );
}
