import type { ReactNode } from "react";

import type { LandingCampaignConfig } from "@/types/landing-campaign";
import {
  CampaignLeadForm,
  CampaignLeadProvider,
  LeadCta,
} from "@/features/marketing/campaign-lead-capture";
import { CampaignTrackingScripts } from "@/features/marketing/campaign-tracking-scripts";
import { landingPagePath } from "@/lib/landing-page-url";

function BrandMark({ config }: { config: LandingCampaignConfig }) {
  if (config.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={config.logoUrl}
        alt={config.brandName}
        className="h-10 w-auto max-w-[200px] object-contain"
      />
    );
  }
  return (
    <div>
      <p className="font-display text-xl leading-none text-white">
        {config.brandName}
      </p>
      {config.brandTagline ? (
        <p className="mt-1 text-[10px] tracking-[0.22em] text-white/70 uppercase">
          {config.brandTagline}
        </p>
      ) : null}
    </div>
  );
}

export function AdsBlockLandingView({
  title,
  slug,
  config,
  preview,
  children,
}: {
  title: string;
  slug: string;
  config: LandingCampaignConfig;
  preview?: boolean;
  children: ReactNode;
}) {
  const heroImage =
    config.hero.imageUrl?.trim() ||
    "https://images.unsplash.com/photo-1512453979798-5ea8333bcea1?auto=format&fit=crop&w=2400&q=85";
  const bullets = (config.hero.bullets || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const wa = config.whatsapp.replace(/[^\d]/g, "");

  return (
    <CampaignLeadProvider
      config={config}
      campaignSlug={slug}
      campaignTitle={title}
      preview={preview}
    >
      <div className="min-h-screen bg-white text-ink antialiased">
        {!preview ? (
          <CampaignTrackingScripts tracking={config.tracking} />
        ) : null}
        {preview ? (
          <div className="sticky top-0 z-[70] bg-[#C4A47C] px-4 py-2 text-center text-xs font-semibold text-[#002117]">
            Preview — publish to go live at {landingPagePath(slug)}
          </div>
        ) : null}

        <header className="relative isolate min-h-[88svh] overflow-hidden text-white">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 bg-black/45" />
          <div className="relative z-10 mx-auto flex min-h-[88svh] max-w-[1180px] flex-col px-5 py-6 md:px-8">
            <div className="flex items-start justify-between gap-4">
              <BrandMark config={config} />
              <LeadCta
                intent="enquire"
                solidWhiteText
                className="!px-5 !py-2.5"
              >
                Enquire now
              </LeadCta>
            </div>

            <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                {config.hero.eyebrow ? (
                  <p className="text-xs font-semibold tracking-[0.22em] text-[#C4A47C] uppercase">
                    {config.hero.eyebrow}
                  </p>
                ) : null}
                <h1 className="mt-4 font-display text-4xl leading-tight md:text-5xl">
                  {config.hero.headline || title}
                </h1>
                {config.hero.subheadline ? (
                  <p className="mt-4 text-base text-white/85">
                    {config.hero.subheadline}
                  </p>
                ) : null}
                {bullets.length ? (
                  <ul className="mt-8 grid gap-2 sm:grid-cols-2">
                    {bullets.map((item) => (
                      <li key={item} className="text-sm text-white/90">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <div
                id="enquire"
                className="w-full rounded-[4px] bg-white p-6 text-ink shadow-2xl md:p-7"
              >
                <h2 className="font-display text-2xl">
                  {config.hero.formTitle || "Download brochure & price"}
                </h2>
                <p className="mt-2 text-sm text-slate">
                  {config.hero.formSubtitle ||
                    "Official brochure, floor plans and launch pricing."}
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

        {config.stats.length ? (
          <section className="border-b border-line bg-ink text-white">
            <div className="mx-auto grid max-w-[1180px] grid-cols-2 gap-6 px-6 py-10 md:grid-cols-4">
              {config.stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="font-display text-2xl text-[#C4A47C]">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[10px] tracking-[0.18em] text-white/60 uppercase">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="border-b border-line bg-mist">
          <div className="mx-auto max-w-[1180px] px-6 py-14">{children}</div>
        </div>

        <footer className="bg-ink px-6 py-10 text-white">
          <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-white/70">
              {config.brandName} · {config.address}
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              {config.phone ? (
                <a href={`tel:${config.phone}`} className="hover:text-[#C4A47C]">
                  {config.phone}
                </a>
              ) : null}
              {wa ? (
                <a
                  href={`https://wa.me/${wa}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#C4A47C]"
                >
                  WhatsApp
                </a>
              ) : null}
            </div>
          </div>
        </footer>
      </div>
    </CampaignLeadProvider>
  );
}
