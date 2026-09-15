import Link from "next/link";
import { Inbox, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/features/admin/components/shared/empty-state";
import { RetryCrmButton } from "@/features/admin/components/retry-crm-button";
import { organizationRepository } from "@/repositories/organization.repository";
import { leadRepository } from "@/repositories/lead.repository";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Leads",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const STATUS_FILTERS = [
  { key: undefined, label: "All", href: "/admin/leads" },
  { key: "NEW", label: "New", href: "/admin/leads?status=new" },
  { key: "FOLLOW_UP", label: "Follow ups", href: "/admin/leads?status=follow_up" },
  {
    key: "MEETING_SCHEDULED",
    label: "Meetings",
    href: "/admin/leads?status=meeting",
  },
  { key: "CLOSED", label: "Closed", href: "/admin/leads?status=closed" },
  { key: "CONTACTED", label: "Contacted", href: "/admin/leads?status=contacted" },
  { key: "LOST", label: "Lost", href: "/admin/leads?status=lost" },
] as const;

function mapStatusParam(raw?: string) {
  const value = raw?.toLowerCase();
  switch (value) {
    case "new":
      return "NEW" as const;
    case "contacted":
      return "CONTACTED" as const;
    case "follow_up":
      return "FOLLOW_UP" as const;
    case "meeting":
      return "MEETING_SCHEDULED" as const;
    case "site_visit":
      return "SITE_VISIT" as const;
    case "closed":
      return "CLOSED" as const;
    case "lost":
      return "LOST" as const;
    default:
      return undefined;
  }
}

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const status = mapStatusParam(first(sp.status));
  const q = first(sp.q)?.trim() || undefined;

  const org = await organizationRepository.getDefault();
  if (!org) {
    return <p className="text-muted-foreground">Organization not seeded.</p>;
  }

  const leads = await leadRepository.listByOrganization(org.id, {
    take: 150,
    status,
    q,
  });

  const title =
    STATUS_FILTERS.find((item) => item.key === status)?.label ?? "All leads";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Revenue · CRM</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">Leads</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Website database is the source of truth. LeadRat sync runs async with
            automatic and manual retry.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-lg">
          <Link href="/admin/leads/crm-sync">Open CRM sync</Link>
        </Button>
      </div>

      <Card className="card-elevated border-border/80">
        <CardHeader className="gap-4 space-y-0 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="font-display text-xl">{title}</CardTitle>
            <CardDescription>
              {leads.length.toLocaleString()} lead
              {leads.length === 1 ? "" : "s"} in this view
            </CardDescription>
          </div>
          <form className="flex gap-2" action="/admin/leads">
            {status ? (
              <input
                type="hidden"
                name="status"
                value={first(sp.status) ?? ""}
              />
            ) : null}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="q"
                defaultValue={q ?? ""}
                placeholder="Search name, email, phone…"
                className="h-9 w-64 rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <Button type="submit" variant="secondary" className="rounded-lg">
              Search
            </Button>
          </form>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((chip) => (
              <Link
                key={chip.label}
                href={q ? `${chip.href}${chip.href.includes("?") ? "&" : "?"}q=${encodeURIComponent(q)}` : chip.href}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition",
                  chip.key === status
                    ? "border-primary bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {chip.label}
              </Link>
            ))}
          </div>

          {leads.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No leads in this view"
              description="Public forms and API submissions will appear here."
              className="py-12"
            />
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead className="border-b bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Contact</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Assignee</th>
                    <th className="px-4 py-3 font-medium">CRM</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="px-4 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/leads/${lead.id}`}
                          className="font-medium hover:text-primary"
                        >
                          {lead.name}
                        </Link>
                        {lead.property ? (
                          <p className="text-xs text-muted-foreground">
                            {lead.property.name}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div>{lead.email ?? "—"}</div>
                        <div>{lead.phone ?? lead.whatsapp ?? "—"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">{lead.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {lead.assignedTo?.name ?? "Unassigned"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            lead.crmSyncStatus === "SYNCED"
                              ? "default"
                              : lead.crmSyncStatus === "FAILED"
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {lead.crmSyncStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {lead.createdAt.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {lead.crmSyncStatus !== "SYNCED" ? (
                          <RetryCrmButton leadId={lead.id} />
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
