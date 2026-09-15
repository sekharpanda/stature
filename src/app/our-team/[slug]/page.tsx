import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { brand } from "@/config/brand";
import { LeadModalCta } from "@/features/leads/components/site-lead-capture-modal";
import { AgentAvatar } from "@/features/marketing/agent-avatar";
import { PublicPropertyCard } from "@/features/marketing/public-property-card";
import { PublicSiteShell } from "@/features/marketing/public-site-shell";
import { buildPageMetadata, siteUrl } from "@/lib/seo";
import { agentService } from "@/services/agent.service";
import { propertyService } from "@/services/property.service";

type Params = Promise<{ slug: string }>;

const LISTINGS_ON_PROFILE = 9;

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

function waHref(phone: string | null | undefined, name: string) {
  const digits = (phone || brand.whatsapp).replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(
    `Hi ${firstName(name)}, I'd like to enquire about Dubai property.`,
  )}`;
}

function profileDescription(agent: {
  name: string;
  title: string | null;
  bio: string | null;
  serviceAreas: string[];
}) {
  if (agent.bio) return agent.bio.slice(0, 300);
  const role = agent.title || "Property Consultant";
  const areas =
    agent.serviceAreas.length > 0
      ? ` Specialising in ${agent.serviceAreas.slice(0, 4).join(", ")}.`
      : "";
  return `${agent.name} is a ${role.toLowerCase()} at ${brand.name}, helping buyers, sellers and investors across Dubai.${areas}`;
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const agent = await agentService.getPublicProfile(slug);
  if (!agent) return { title: "Consultant", robots: { index: false, follow: false } };

  // The root layout appends "| Prowin Properties" to every title.
  return buildPageMetadata({
    title: agent.metaTitle || `${agent.name} — ${agent.title || "Property Consultant"}`,
    description: agent.metaDescription || profileDescription(agent),
    path: `/our-team/${agent.slug}`,
    image: agent.photoUrl ?? undefined,
  });
}

export default async function AgentProfilePage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const agent = await agentService.getPublicProfile(slug);
  if (!agent) notFound();

  const listings = await propertyService.listPublished({
    organizationId: agent.organizationId,
    agentId: agent.id,
    pageSize: LISTINGS_ON_PROFILE,
    sort: "newest",
  });

  const role = agent.title || "Property Consultant";
  const facts = [
    agent.reraNumber ? { label: "RERA", value: agent.reraNumber } : null,
    agent.yearsExperience
      ? {
          label: "Experience",
          value: `${agent.yearsExperience} year${agent.yearsExperience === 1 ? "" : "s"}`,
        }
      : null,
    listings.total > 0
      ? { label: "Live listings", value: String(listings.total) }
      : null,
    agent.languages.length > 0
      ? { label: "Languages", value: agent.languages.join(", ") }
      : null,
  ].filter((fact): fact is { label: string; value: string } => fact !== null);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: agent.name,
    jobTitle: role,
    url: `${siteUrl}/our-team/${agent.slug}`,
    ...(agent.photoUrl ? { image: agent.photoUrl } : {}),
    ...(agent.bio ? { description: agent.bio } : {}),
    ...(agent.email ? { email: agent.email } : {}),
    ...(agent.phone ? { telephone: agent.phone } : {}),
    ...(agent.languages.length > 0 ? { knowsLanguage: agent.languages } : {}),
    ...(agent.serviceAreas.length > 0
      ? { areaServed: agent.serviceAreas.map((area) => ({ "@type": "Place", name: area })) }
      : {}),
    worksFor: {
      "@type": "RealEstateAgent",
      name: brand.name,
      url: siteUrl,
      telephone: brand.phone,
    },
  };

  return (
    <PublicSiteShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        <section className="border-b border-line bg-white">
          <div className="mx-auto max-w-[1180px] px-6 py-10 md:py-14">
            <Link
              href="/our-team"
              className="text-xs font-semibold tracking-[0.18em] text-slate uppercase transition hover:text-red"
            >
              ← Our team
            </Link>

            <div className="mt-8 grid gap-10 md:grid-cols-[300px_1fr] md:items-start">
              <div className="aspect-square w-full max-w-[300px] overflow-hidden bg-[#eceae6]">
                <AgentAvatar name={agent.name} photoUrl={agent.photoUrl} />
              </div>

              <div>
                <p className="text-xs font-semibold tracking-[0.22em] text-red uppercase">
                  {role}
                </p>
                <h1 className="mt-3 font-display text-4xl md:text-5xl">
                  {agent.name}
                </h1>

                {agent.bio ? (
                  <p className="mt-5 max-w-[62ch] leading-relaxed text-slate">
                    {agent.bio}
                  </p>
                ) : (
                  <p className="mt-5 max-w-[62ch] leading-relaxed text-slate">
                    {profileDescription(agent)}
                  </p>
                )}

                {agent.specialties.length > 0 ? (
                  <ul className="mt-6 flex flex-wrap gap-2">
                    {agent.specialties.map((specialty) => (
                      <li
                        key={specialty}
                        className="border border-line px-3 py-1.5 text-xs tracking-wide text-ink"
                      >
                        {specialty}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {facts.length > 0 ? (
                  <dl className="mt-8 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                    {facts.map((fact) => (
                      <div key={fact.label}>
                        <dt className="text-xs tracking-[0.16em] text-slate uppercase">
                          {fact.label}
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-ink">
                          {fact.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : null}

                {agent.serviceAreas.length > 0 ? (
                  <p className="mt-6 text-sm text-slate">
                    <span className="font-semibold text-ink">Areas covered:</span>{" "}
                    {agent.serviceAreas.join(" · ")}
                  </p>
                ) : null}

                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href={waHref(agent.whatsapp, agent.name)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center bg-red px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-dark"
                  >
                    WhatsApp {firstName(agent.name)}
                  </a>
                  {agent.phone ? (
                    <a
                      href={`tel:${agent.phone.replace(/\s/g, "")}`}
                      className="inline-flex items-center border border-ink px-5 py-3 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white"
                    >
                      Call {agent.phone}
                    </a>
                  ) : null}
                  {agent.email ? (
                    <a
                      href={`mailto:${agent.email}`}
                      className="inline-flex items-center border border-line px-5 py-3 text-sm font-semibold text-ink transition hover:border-ink"
                    >
                      Email
                    </a>
                  ) : null}
                  <LeadModalCta
                    leadSource="agent_profile"
                    campaign={agent.slug}
                    className="inline-flex items-center border border-line px-5 py-3 text-sm font-semibold text-ink transition hover:border-ink"
                  >
                    Request a call back
                  </LeadModalCta>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-mist">
          <div className="mx-auto max-w-[1180px] px-6 py-14 md:py-16">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.22em] text-red uppercase">
                  Portfolio
                </p>
                <h2 className="mt-3 font-display text-3xl md:text-4xl">
                  {listings.total > 0
                    ? `${firstName(agent.name)}’s listings`
                    : `Working with ${firstName(agent.name)}`}
                </h2>
              </div>
              {listings.total > LISTINGS_ON_PROFILE ? (
                <Link
                  href="/properties"
                  className="text-sm font-semibold text-red transition hover:text-red-dark"
                >
                  Browse all properties →
                </Link>
              ) : null}
            </div>

            {listings.items.length > 0 ? (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {listings.items.map((property) => (
                  <PublicPropertyCard key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <div className="mt-8 border border-line bg-white px-6 py-10 text-center md:px-10">
                <p className="mx-auto max-w-[52ch] text-sm text-slate">
                  {firstName(agent.name)} doesn’t have listings published on the
                  site right now, but works across our full Dubai inventory —
                  including off-plan launches that never reach the portals.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <LeadModalCta
                    leadSource="agent_profile_empty"
                    campaign={agent.slug}
                    className="inline-flex items-center bg-red px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-dark"
                  >
                    Tell {firstName(agent.name)} what you need
                  </LeadModalCta>
                  <Link
                    href="/properties"
                    className="inline-flex items-center border border-ink px-5 py-3 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white"
                  >
                    Browse properties
                  </Link>
                </div>
              </div>
            )}

            <div className="mt-14 border border-line bg-white px-6 py-10 text-center md:px-10">
              <h2 className="font-display text-2xl md:text-3xl">
                Prefer a different specialist?
              </h2>
              <p className="mx-auto mt-3 max-w-[48ch] text-sm text-slate">
                Every community has a consultant who closes there every week.
                Meet the rest of the team and pick yours.
              </p>
              <Link
                href="/our-team"
                className="mt-6 inline-flex items-center border border-ink px-5 py-3 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white"
              >
                View the whole team
              </Link>
            </div>
          </div>
        </section>
      </main>
    </PublicSiteShell>
  );
}
