"use client";

import { useEffect } from "react";
import Link from "next/link";

import type { LandingCampaignConfig } from "@/types/landing-campaign";
import { safeThankYouRedirectUrl } from "@/types/landing-campaign";
import { CampaignTrackingScripts } from "@/features/marketing/campaign-tracking-scripts";

export function CampaignThankYouView({
  slug,
  config,
}: {
  slug: string;
  config: LandingCampaignConfig;
}) {
  const lead = config.leadForm;
  const seconds = Number(lead.thankYouRedirectSeconds) || 0;
  const redirectUrl = safeThankYouRedirectUrl(
    lead.thankYouRedirectUrl,
    typeof window === "undefined" ? undefined : window.location.origin,
  );

  useEffect(() => {
    const url = safeThankYouRedirectUrl(
      lead.thankYouRedirectUrl,
      window.location.origin,
    );
    if (!url || seconds <= 0) return;
    const t = window.setTimeout(() => {
      window.location.href = url;
    }, seconds * 1000);
    return () => window.clearTimeout(t);
  }, [lead.thankYouRedirectUrl, seconds]);

  const wa = config.whatsapp.replace(/[^\d]/g, "");

  return (
    <div className="min-h-screen bg-[#F5F1E9] text-[#0A2E20]">
      <CampaignTrackingScripts tracking={config.tracking} />
      <div className="mx-auto grid max-w-5xl gap-0 overflow-hidden rounded-sm bg-white shadow-xl md:grid-cols-2">
        <div className="relative min-h-[280px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              lead.thankYouImageUrl ||
              config.overview.imageUrl ||
              config.hero.imageUrl
            }
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-0 bg-[#0A2E20]/35" />
        </div>
        <div className="flex flex-col justify-center px-8 py-12 md:px-12">
          {config.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={config.logoUrl}
              alt={config.brandName}
              className="mb-4 h-10 w-auto max-w-[180px] object-contain"
            />
          ) : (
            <p className="text-xs tracking-[0.2em] text-[#C4A47C] uppercase">
              {config.brandName}
            </p>
          )}
          <h1 className="mt-3 font-display text-3xl leading-tight md:text-4xl">
            {lead.thankYouTitle}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-[#0A2E20]/80 md:text-base">
            {lead.thankYouMessage}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {wa ? (
              <a
                href={`https://wa.me/${wa}`}
                className="rounded-sm bg-[#C4A47C] px-5 py-3 text-xs font-semibold tracking-[0.14em] text-[#0A2E20] uppercase"
              >
                WhatsApp us
              </a>
            ) : null}
            <Link
              href={`/dubai-projects/${slug}`}
              className="rounded-sm border border-[#0A2E20]/30 px-5 py-3 text-xs font-semibold tracking-[0.14em] uppercase"
            >
              Back to campaign
            </Link>
          </div>
          {redirectUrl && seconds > 0 ? (
            <p className="mt-6 text-xs text-[#0A2E20]/60">
              Redirecting in {seconds}s…
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
