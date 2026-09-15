import { Suspense } from "react";

import { PublicSiteFooter } from "@/features/marketing/public-site-footer";
import { PublicSiteHeader } from "@/features/marketing/public-site-header";
import { AnalyticsTracker } from "@/features/marketing/analytics-tracker";
import { SiteLeadCaptureProvider } from "@/features/leads/components/site-lead-capture-modal";
import {
  getPublicSiteContext,
  type PublicSiteContext,
} from "@/services/site-chrome.service";

export { PublicSiteHeader } from "@/features/marketing/public-site-header";
export { PublicSiteFooter } from "@/features/marketing/public-site-footer";

function SiteFrame({
  children,
  propertyId,
  site,
}: {
  children: React.ReactNode;
  propertyId?: string;
  site?: PublicSiteContext;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-mist text-ink">
      <a
        href="#main-content"
        className="absolute left-4 top-4 z-[100] -translate-y-[180%] bg-red px-4 py-2 text-sm font-semibold text-white transition focus:translate-y-0 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-ink"
      >
        Skip to content
      </a>
      <PublicSiteHeader
        nav={site?.chrome.nav}
        brandName={site?.name}
        headerCtaLabel={site?.chrome.headerCtaLabel}
      />
      <main id="main-content" tabIndex={-1} className="flex-1 bg-white outline-none">
        {children}
      </main>
      <PublicSiteFooter
        chrome={site?.chrome}
        name={site?.legalName}
        phone={site?.phone}
        email={site?.email}
        address={site?.address}
      />
      <SiteLeadCaptureProvider />
      <Suspense fallback={null}>
        <AnalyticsTracker propertyId={propertyId} />
      </Suspense>
    </div>
  );
}

/** Instant chrome for loading/404 — uses built-in defaults, no DB. */
export function PublicSiteShellInstant({
  children,
  propertyId,
}: {
  children: React.ReactNode;
  propertyId?: string;
}) {
  return <SiteFrame propertyId={propertyId}>{children}</SiteFrame>;
}

export async function PublicSiteShell({
  children,
  propertyId,
}: {
  children: React.ReactNode;
  propertyId?: string;
}) {
  const site = await getPublicSiteContext();
  return (
    <SiteFrame propertyId={propertyId} site={site}>
      {children}
    </SiteFrame>
  );
}
