import type { Metadata } from "next";
import Link from "next/link";

import { brand } from "@/config/brand";
import { AgentAvatar } from "@/features/marketing/agent-avatar";
import { PageHero } from "@/features/marketing/page-hero";
import { LeadModalCta } from "@/features/leads/components/site-lead-capture-modal";
import { PageBuilderSection } from "@/features/marketing/page-builder-section";
import { PublicSiteShell } from "@/features/marketing/public-site-shell";
import { buildManagedPageMetadata } from "@/lib/managed-page-metadata";
import { publicPageLoadError } from "@/lib/errors";
import { organizationRepository } from "@/repositories/organization.repository";
import { agentService } from "@/services/agent.service";
import { pageContentService } from "@/services/page-content.service";

export async function generateMetadata(): Promise<Metadata> {
  return buildManagedPageMetadata("our-team", {
    title: "Our team",
    description:
      "Meet the RERA-certified Prowin Properties consultants helping buyers, sellers and investors across Dubai.",
  });
}

function waHref(phone: string | null | undefined, name: string) {
  const digits = (phone || brand.whatsapp).replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(
    `Hi ${name}, I'd like to enquire about Dubai property.`,
  )}`;
}

export default async function OurTeamPage() {
  const org = await organizationRepository.getDefault();
  let content;
  let agents: Awaited<ReturnType<typeof agentService.listPublicRoster>> = [];
  let loadError: string | null = null;
  try {
    const [pageContent, roster] = await Promise.all([
      pageContentService.get("our-team", org?.id),
      agentService.listPublicRoster(),
    ]);
    content = pageContent;
    agents = roster;
  } catch (error) {
    loadError = publicPageLoadError(
      error,
      "The team directory is temporarily unavailable. Please try again.",
    );
    console.error("[our-team] load failed:", error);
    const { DEFAULT_PAGE_CONTENT } = await import(
      "@/config/page-content-defaults"
    );
    content = DEFAULT_PAGE_CONTENT["our-team"];
  }

  return (
    <PublicSiteShell>
      <main>
        <PageHero
          eyebrow={content.eyebrow}
          title={content.title}
          description={content.lede}
        />

        <section className="bg-mist">
          <div className="mx-auto max-w-[1180px] px-6 py-14 md:py-16">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {loadError ? (
                <p className="col-span-full text-center text-sm text-slate">
                  {loadError}
                </p>
              ) : agents.length === 0 ? (
                <p className="col-span-full text-center text-sm text-slate">
                  Consultants will appear here once they are added in Admin →
                  Agents.
                </p>
              ) : null}
              {agents.map((agent) => (
                <article
                  key={agent.id}
                  id={agent.slug}
                  className="flex scroll-mt-24 flex-col border border-line bg-white p-5 text-center transition hover:border-red/40"
                >
                  <Link
                    href={`/our-team/${agent.slug}`}
                    className="mx-auto aspect-square w-full overflow-hidden bg-[#eceae6]"
                    aria-label={`View ${agent.name}'s profile`}
                  >
                    <AgentAvatar name={agent.name} photoUrl={agent.photoUrl} />
                  </Link>
                  <h2 className="mt-4 font-display text-xl">
                    <Link
                      href={`/our-team/${agent.slug}`}
                      className="transition hover:text-red"
                    >
                      {agent.name}
                    </Link>
                  </h2>
                  <p className="mt-1 text-sm text-slate">
                    {agent.title || "Property Consultant"}
                  </p>
                  {agent.languages.length > 0 ? (
                    <p className="mt-2 text-xs tracking-wide text-[#b08948]">
                      {agent.languages.join(" · ")}
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-col gap-1.5 pt-1">
                    <Link
                      href={`/our-team/${agent.slug}`}
                      className="text-sm font-semibold text-ink transition hover:text-red"
                    >
                      View profile →
                    </Link>
                    <a
                      href={waHref(agent.whatsapp, agent.name)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-red hover:text-red-dark"
                    >
                      WhatsApp →
                    </a>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-14 border border-line bg-white px-6 py-10 text-center md:px-10">
              <h2 className="font-display text-2xl md:text-3xl">
                Looking for a specific community?
              </h2>
              <p className="mx-auto mt-3 max-w-[48ch] text-sm text-slate">
                Tell us what you need and we’ll connect you with the right
                consultant for off-plan, ready sales or leasing.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <LeadModalCta
                  leadSource="team_cta"
                  campaign="our-team"
                  className="inline-flex items-center bg-red px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-dark"
                >
                  Contact the team
                </LeadModalCta>
                <Link
                  href="/properties"
                  className="inline-flex items-center border border-ink px-5 py-3 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white"
                >
                  Browse properties
                </Link>
              </div>
            </div>
          </div>
        </section>
        <PageBuilderSection blocks={content.blocks} />
      </main>
    </PublicSiteShell>
  );
}
