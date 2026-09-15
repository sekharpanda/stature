import type { Metadata } from "next";

import { LeadCaptureForm } from "@/features/leads/components/lead-capture-form";
import { PageBuilderSection } from "@/features/marketing/page-builder-section";
import { PublicFaqs } from "@/features/marketing/public-faqs";
import { PublicSiteShell } from "@/features/marketing/public-site-shell";
import { brand } from "@/config/brand";
import { DEFAULT_PAGE_CONTENT } from "@/config/page-content-defaults";
import { DEFAULT_SITE_CHROME } from "@/config/site-chrome-defaults";
import { buildManagedPageMetadata } from "@/lib/managed-page-metadata";
import { prisma } from "@/lib/db";
import { publicPageLoadError } from "@/lib/errors";
import { organizationRepository } from "@/repositories/organization.repository";
import { pageContentService } from "@/services/page-content.service";
import {
  getPublicSiteContext,
  type PublicSiteContext,
} from "@/services/site-chrome.service";

export async function generateMetadata(): Promise<Metadata> {
  return buildManagedPageMetadata("contact", {
    title: "Contact",
    description:
      "Enquire with Prowin Properties — request a callback, WhatsApp our team, or visit us in Barsha Heights, Dubai.",
  });
}

export default async function ContactPage() {
  let content = DEFAULT_PAGE_CONTENT.contact;
  let site: PublicSiteContext = {
    organizationId: null as string | null,
    name: brand.name,
    legalName: brand.legalName,
    phone: brand.phone,
    whatsapp: brand.whatsapp,
    email: brand.email,
    address: brand.address,
    chrome: DEFAULT_SITE_CHROME,
  };
  let faqs: Awaited<ReturnType<typeof prisma.faq.findMany>> = [];
  let loadError: string | null = null;

  try {
    const [pageContent, siteContext] = await Promise.all([
      pageContentService.get("contact"),
      getPublicSiteContext(),
    ]);
    content = pageContent;
    site = siteContext;
    const org = await organizationRepository.getDefault();
    faqs = org
      ? await prisma.faq.findMany({
          where: {
            organizationId: org.id,
            deletedAt: null,
            OR: [{ entityType: null }, { entityType: "general" }, { entityType: "contact" }],
          },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
          take: 20,
        })
      : [];
  } catch (error) {
    loadError = publicPageLoadError(
      error,
      "This page is temporarily unavailable. Please try again.",
    );
    console.error("[contact] load failed:", error);
  }

  const mapQuery = encodeURIComponent(`${site.name}, ${site.address}`);
  const mapEmbedSrc = `https://www.google.com/maps?q=${mapQuery}&output=embed`;
  const mapDirectionsHref = `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`;

  return (
    <PublicSiteShell>
      <main>
        <section className="border-b border-line bg-white">
          <div className="mx-auto grid max-w-[1180px] gap-12 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold tracking-[0.22em] text-red uppercase">
                {content.eyebrow}
              </p>
              <h1 className="mt-4 max-w-[14ch] font-display text-4xl md:text-6xl">
                {content.title}
              </h1>
              <p className="mt-5 max-w-[48ch] text-base text-slate md:text-lg">
                {content.lede}
              </p>

              <div className="mt-10 space-y-5 border-t border-line pt-8 text-sm">
                <div>
                  <p className="text-xs font-semibold tracking-[0.16em] text-slate uppercase">
                    Phone
                  </p>
                  <a
                    href={`tel:${site.phone}`}
                    className="mt-1 block text-lg font-medium text-ink hover:text-red"
                  >
                    {site.phone}
                  </a>
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-[0.16em] text-slate uppercase">
                    Email
                  </p>
                  <a
                    href={`mailto:${site.email}`}
                    className="mt-1 block text-lg font-medium text-ink hover:text-red"
                  >
                    {site.email}
                  </a>
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-[0.16em] text-slate uppercase">
                    Office
                  </p>
                  <p className="mt-1 max-w-[36ch] text-base text-ink">
                    {site.address}
                  </p>
                </div>
                <a
                  href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center bg-red px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-dark"
                >
                  Chat on WhatsApp
                </a>
              </div>
            </div>

            <div className="rounded-[3px] border border-line bg-mist p-6 md:p-8">
              <h2 className="font-display text-2xl">Request a callback</h2>
              <p className="mt-2 text-sm text-slate">
                We’ll save your enquiry and get back to you shortly.
              </p>
              <div className="mt-6">
                <LeadCaptureForm leadSource="contact" />
              </div>
            </div>
          </div>
        </section>

        <PublicFaqs
          faqs={faqs.map((f) => ({
            id: f.id,
            question: f.question,
            answer: f.answer,
          }))}
          title="Common questions before you enquire"
        />
        {loadError ? (
          <p className="px-6 pb-6 text-center text-sm text-slate">{loadError}</p>
        ) : null}

        <section className="bg-mist">
          <div className="mx-auto max-w-[1180px] px-6 py-14 md:py-16">
            <h2 className="font-display text-2xl md:text-3xl">Find the office</h2>
            <p className="mt-2 max-w-[52ch] text-sm text-slate">
              {site.address}
            </p>
            <div className="mt-6 overflow-hidden border border-line bg-white">
              <iframe
                title={`Map showing the ${site.name} office`}
                src={mapEmbedSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[360px] w-full border-0 md:h-[420px]"
              />
            </div>
            <a
              href={mapDirectionsHref}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center text-sm font-semibold text-red underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
            >
              Get directions →
            </a>
          </div>
        </section>
        <PageBuilderSection blocks={content.blocks} />
      </main>
    </PublicSiteShell>
  );
}
