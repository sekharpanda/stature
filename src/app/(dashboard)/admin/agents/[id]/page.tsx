import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, MessageCircle, Phone } from "lucide-react";
import type { Prisma } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AgentEditor } from "@/features/admin/components/agents/agent-editor";
import { AgentListingAssignment } from "@/features/admin/components/agents/agent-listing-assignment";
import { AgentRowActions } from "@/features/admin/components/agents/agent-row-actions";
import { prisma } from "@/lib/db";
import { organizationRepository } from "@/repositories/organization.repository";
import { agentService } from "@/services/agent.service";

export const metadata = {
  title: "Agent",
  robots: { index: false, follow: false },
};

function money(value: Prisma.Decimal | null, currency: string) {
  if (!value) return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const compact =
    amount >= 1_000_000
      ? `${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}M`
      : amount >= 1_000
        ? `${Math.round(amount / 1_000)}K`
        : String(Math.round(amount));
  return `${currency} ${compact}`;
}

export default async function AdminAgentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const lpRaw = Array.isArray(sp.lp) ? sp.lp[0] : sp.lp;
  const listingsPage = Math.max(1, Number(lpRaw ?? "1") || 1);

  const org = await organizationRepository.getDefault();
  if (!org) {
    return <p className="text-muted-foreground">Organization not seeded.</p>;
  }

  const agent = await agentService
    .get(org.id, id)
    .catch(() => null);
  if (!agent) notFound();

  const [listings, breakdown, roster, users] = await Promise.all([
    agentService.listListings(org.id, agent.id, {
      page: listingsPage,
      pageSize: 10,
    }),
    agentService.listingBreakdown(org.id, agent.id),
    agentService.listForOrdering(org.id),
    prisma.user.findMany({
      where: { deletedAt: null, OR: [{ organizationId: org.id }, { organizationId: null }] },
      orderBy: { name: "asc" },
      take: 200,
      select: { id: true, name: true, email: true },
    }),
  ]);

  const wa = agent.whatsapp?.replace(/\D/g, "") || "";
  const published = breakdown.PUBLISHED ?? 0;
  const drafts = breakdown.DRAFT ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {agent.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={agent.photoUrl}
              alt={agent.name}
              className="size-16 rounded-full border object-cover"
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
              {agent.name.slice(0, 1)}
            </div>
          )}
          <div>
            <p className="eyebrow">Team</p>
            <h1 className="mt-1 font-display text-3xl md:text-4xl">
              {agent.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{agent.title || "Property Consultant"}</span>
              <Badge variant={agent.isActive ? "secondary" : "outline"}>
                {agent.isActive ? "Active" : "Inactive"}
              </Badge>
              {agent.isFeatured ? (
                <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">
                  Featured
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/our-team/${agent.slug}`} target="_blank">
              <ExternalLink className="mr-1.5 size-3.5" />
              Public profile
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/agents">All agents</Link>
          </Button>
          <AgentRowActions
            agent={{
              id: agent.id,
              name: agent.name,
              isActive: agent.isActive,
              isFeatured: agent.isFeatured,
              listingCount: agent._count.properties,
            }}
            otherAgents={roster
              .filter((option) => option.id !== agent.id)
              .map((option) => ({ id: option.id, name: option.name }))}
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <AgentEditor
          organizationId={org.id}
          mode="edit"
          agentId={agent.id}
          users={users}
          initial={{
            name: agent.name,
            slug: agent.slug,
            title: agent.title ?? "",
            email: agent.email ?? "",
            phone: agent.phone ?? "",
            whatsapp: agent.whatsapp ?? "",
            bio: agent.bio ?? "",
            photoUrl: agent.photoUrl ?? "",
            photoMediaId: agent.photoMediaId ?? null,
            specialties: agent.specialties.join(", "),
            languages: agent.languages.join(", "),
            serviceAreas: agent.serviceAreas.join(", "),
            reraNumber: agent.reraNumber ?? "",
            yearsExperience:
              agent.yearsExperience == null ? "" : String(agent.yearsExperience),
            isActive: agent.isActive,
            isFeatured: agent.isFeatured,
            sortOrder: String(agent.sortOrder),
            metaTitle: agent.metaTitle ?? "",
            metaDescription: agent.metaDescription ?? "",
            userId: agent.userId ?? "",
          }}
        />

        <div className="space-y-6">
          <Card className="card-elevated border-border/80">
            <CardHeader>
              <CardTitle className="font-display text-xl">At a glance</CardTitle>
              <CardDescription>Portfolio and contact shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg border px-2 py-3">
                  <p className="font-display text-2xl tabular-nums">
                    {agent._count.properties}
                  </p>
                  <p className="text-xs text-muted-foreground">Listings</p>
                </div>
                <div className="rounded-lg border px-2 py-3">
                  <p className="font-display text-2xl tabular-nums">
                    {published}
                  </p>
                  <p className="text-xs text-muted-foreground">Published</p>
                </div>
                <div className="rounded-lg border px-2 py-3">
                  <p className="font-display text-2xl tabular-nums">{drafts}</p>
                  <p className="text-xs text-muted-foreground">Drafts</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {agent.phone ? (
                  <Button asChild variant="outline" size="sm">
                    <a href={`tel:${agent.phone.replace(/\s/g, "")}`}>
                      <Phone className="mr-1.5 size-3.5" />
                      Call
                    </a>
                  </Button>
                ) : null}
                {wa ? (
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={`https://wa.me/${wa}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle className="mr-1.5 size-3.5" />
                      WhatsApp
                    </a>
                  </Button>
                ) : null}
              </div>

              <dl className="space-y-2">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Linked login</dt>
                  <dd className="text-right font-medium">
                    {agent.user ? agent.user.name || agent.user.email : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">RERA / BRN</dt>
                  <dd className="text-right font-medium">
                    {agent.reraNumber || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Added</dt>
                  <dd className="text-right font-medium">
                    {agent.createdAt.toLocaleDateString()}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Last updated</dt>
                  <dd className="text-right font-medium">
                    {agent.updatedAt.toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <AgentListingAssignment
            organizationId={org.id}
            agentId={agent.id}
            agentName={agent.name}
            total={listings.total}
            page={listings.page}
            pageCount={listings.pageCount}
            assigned={listings.items.map((listing) => ({
              id: listing.id,
              name: listing.name,
              status: listing.status,
              location: listing.area?.name ?? listing.city?.name ?? null,
              price: money(listing.minPrice, listing.currency),
            }))}
          />
        </div>
      </div>
    </div>
  );
}
