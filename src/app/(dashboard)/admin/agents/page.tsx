import Link from "next/link";
import { Building2, Star, UserCheck, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AgentFilterBar } from "@/features/admin/components/agents/agent-filter-bar";
import { AgentOrderPanel } from "@/features/admin/components/agents/agent-order-panel";
import { AgentRowActions } from "@/features/admin/components/agents/agent-row-actions";
import { EmptyState } from "@/features/admin/components/shared/empty-state";
import { KpiCard } from "@/features/admin/components/shared/kpi-card";
import { organizationRepository } from "@/repositories/organization.repository";
import { agentService } from "@/services/agent.service";
import {
  AGENT_SORT_OPTIONS,
  AGENT_STATUS_FILTERS,
  type AgentSortOption,
  type AgentStatusFilter,
} from "@/schemas/agent.schema";

export const metadata = {
  title: "Agents",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildHref(params: {
  q?: string;
  status: AgentStatusFilter;
  sort: AgentSortOption;
  page?: number;
}) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.status !== "all") search.set("status", params.status);
  if (params.sort !== "order") search.set("sort", params.sort);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const query = search.toString();
  return query ? `/admin/agents?${query}` : "/admin/agents";
}

export default async function AdminAgentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const org = await organizationRepository.getDefault();
  if (!org) {
    return <p className="text-muted-foreground">Organization not seeded.</p>;
  }

  const sp = await searchParams;
  const q = first(sp.q)?.trim() || undefined;
  const statusRaw = first(sp.status) as AgentStatusFilter | undefined;
  const sortRaw = first(sp.sort) as AgentSortOption | undefined;
  const status =
    statusRaw && AGENT_STATUS_FILTERS.includes(statusRaw) ? statusRaw : "all";
  const sort = sortRaw && AGENT_SORT_OPTIONS.includes(sortRaw) ? sortRaw : "order";
  const page = Math.max(1, Number(first(sp.page) ?? "1") || 1);

  const [result, summary, roster] = await Promise.all([
    agentService.list({
      organizationId: org.id,
      q,
      status,
      sort,
      page,
      pageSize: 20,
    }),
    agentService.summary(org.id),
    agentService.listForOrdering(org.id),
  ]);

  const rosterOptions = roster.map((agent) => ({
    id: agent.id,
    name: agent.name,
  }));
  const hasFilters = Boolean(q) || status !== "all";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Team</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">Agents</h1>
          <p className="mt-2 text-muted-foreground">
            Manage consultant profiles, photos, visibility and the listings they
            handle.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/our-team" target="_blank">
              View public team
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/agents/new">Add agent</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Agents" value={summary.total} icon={Users} tone="primary" />
        <KpiCard
          label="Active"
          value={summary.active}
          hint="Visible on the website"
          icon={UserCheck}
          tone="success"
        />
        <KpiCard
          label="Featured"
          value={summary.featured}
          hint="Lead the team roster"
          icon={Star}
          tone="gold"
        />
        <KpiCard
          label="Unassigned listings"
          value={summary.unassignedListings}
          hint="No agent on the property"
          icon={Building2}
          tone={summary.unassignedListings > 0 ? "warning" : "default"}
        />
      </div>

      <Card className="card-elevated border-border/80">
        <CardHeader className="gap-4">
          <div>
            <CardTitle className="font-display text-xl">All agents</CardTitle>
            <CardDescription>
              {result.total} profile{result.total === 1 ? "" : "s"}
              {hasFilters ? " matching your filters" : ""}.
            </CardDescription>
          </div>
          <AgentFilterBar q={q ?? ""} status={status} sort={sort} />
        </CardHeader>
        <CardContent className="space-y-4">
          {result.items.length === 0 ? (
            hasFilters ? (
              <EmptyState
                icon={Users}
                title="No agents match"
                description="Try a different search term or clear the filters."
                className="py-12"
                actionLabel="Clear filters"
                actionHref="/admin/agents"
              />
            ) : (
              <EmptyState
                icon={Users}
                title="No agents yet"
                description="Add your first consultant to show them on the website and assign listings."
                className="py-12"
                actionLabel="Add agent"
                actionHref="/admin/agents/new"
              />
            )
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Agent</th>
                    <th className="px-4 py-3 font-medium">Contact</th>
                    <th className="px-4 py-3 font-medium">Listings</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Order</th>
                    <th className="px-4 py-3 font-medium sr-only">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((agent) => (
                    <tr key={agent.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/agents/${agent.id}`}
                          className="flex items-center gap-3 hover:underline"
                        >
                          {agent.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={agent.photoUrl}
                              alt=""
                              className="size-9 rounded-full border object-cover"
                            />
                          ) : (
                            <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                              {agent.name.slice(0, 1)}
                            </span>
                          )}
                          <span>
                            <span className="block font-medium">
                              {agent.name}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {agent.title || "Property Consultant"}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div>{agent.phone || "—"}</div>
                        <div className="text-xs">{agent.email || ""}</div>
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {agent._count.properties}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <Badge
                            variant={agent.isActive ? "secondary" : "outline"}
                          >
                            {agent.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {agent.isFeatured ? (
                            <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">
                              Featured
                            </Badge>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {agent.sortOrder}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <AgentRowActions
                          agent={{
                            id: agent.id,
                            name: agent.name,
                            isActive: agent.isActive,
                            isFeatured: agent.isFeatured,
                            listingCount: agent._count.properties,
                          }}
                          otherAgents={rosterOptions.filter(
                            (option) => option.id !== agent.id,
                          )}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result.pageCount > 1 ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Page {result.page} of {result.pageCount}
              </p>
              <div className="flex gap-2">
                {result.page > 1 ? (
                  <Button asChild variant="outline" size="sm">
                    <Link
                      href={buildHref({ q, status, sort, page: result.page - 1 })}
                    >
                      Previous
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                )}
                {result.page < result.pageCount ? (
                  <Button asChild variant="outline" size="sm">
                    <Link
                      href={buildHref({ q, status, sort, page: result.page + 1 })}
                    >
                      Next
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    Next
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <AgentOrderPanel organizationId={org.id} agents={roster} />
    </div>
  );
}
