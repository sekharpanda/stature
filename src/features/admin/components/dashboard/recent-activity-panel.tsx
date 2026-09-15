import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  Building2,
  Database,
  FileText,
  Inbox,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/features/admin/components/shared/empty-state";

type RecentPayload = Awaited<
  ReturnType<typeof import("@/services/dashboard.service").getRecentActivity>
>;

function StatusBadge({ value }: { value: string }) {
  const tone =
    value.includes("FAIL") || value === "DRAFT"
      ? "destructive"
      : value.includes("SYNC") || value === "PUBLISHED" || value === "CLOSED"
        ? "default"
        : "secondary";

  return (
    <Badge variant={tone} className="font-medium tracking-wide uppercase">
      {value.replaceAll("_", " ").toLowerCase()}
    </Badge>
  );
}

export function RecentActivityPanel({ data }: { data: RecentPayload }) {
  return (
    <Card className="card-elevated border-border/80">
      <CardHeader>
        <CardTitle className="font-display text-xl">Recent activity</CardTitle>
        <CardDescription>
          Live feed across leads, inventory, CRM sync and content.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="leads">
          <TabsList className="mb-4 grid h-auto w-full grid-cols-2 gap-1 md:grid-cols-5">
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="crm">CRM Sync</TabsTrigger>
            <TabsTrigger value="blog">Blog</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="space-y-2">
            {data.leads.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No leads yet"
                description="New enquiries will land here instantly."
                actionLabel="Open leads"
                actionHref="/admin/leads"
                className="py-8"
              />
            ) : (
              data.leads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/admin/leads/${lead.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{lead.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {lead.email ?? "No email"} ·{" "}
                      {formatDistanceToNow(lead.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StatusBadge value={lead.status} />
                    <span className="text-[10px] text-muted-foreground uppercase">
                      {lead.crmSyncStatus}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </TabsContent>

          <TabsContent value="properties" className="space-y-2">
            {data.properties.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No properties yet"
                description="Create a manual listing or import from LeadRat."
                actionLabel="Add property"
                actionHref="/admin/properties/new"
                className="py-8"
              />
            ) : (
              data.properties.map((property) => (
                <Link
                  key={property.id}
                  href={`/admin/properties/${property.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {property.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {property.source} ·{" "}
                      {formatDistanceToNow(property.createdAt, {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <StatusBadge value={property.status} />
                </Link>
              ))
            )}
          </TabsContent>

          <TabsContent value="crm" className="space-y-2">
            {data.syncLogs.length === 0 ? (
              <EmptyState
                icon={Database}
                title="No CRM sync logs"
                description="LeadRat push attempts will appear here."
                actionLabel="Open CRM sync"
                actionHref="/admin/leads/crm-sync"
                className="py-8"
              />
            ) : (
              data.syncLogs.map((log) => (
                <Link
                  key={log.id}
                  href={`/admin/leads/${log.lead.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {log.lead.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {log.error ?? "Sync attempt"} ·{" "}
                      {formatDistanceToNow(log.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                  <StatusBadge value={log.status} />
                </Link>
              ))
            )}
          </TabsContent>

          <TabsContent value="blog" className="space-y-2">
            {data.blogs.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No blog posts"
                description="Draft and publish articles from the blog module."
                actionLabel="Create blog"
                actionHref="/admin/blog/new"
                className="py-8"
              />
            ) : (
              data.blogs.map((post) => (
                <Link
                  key={post.id}
                  href={`/admin/blog/${post.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{post.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Updated{" "}
                      {formatDistanceToNow(post.updatedAt, { addSuffix: true })}
                    </p>
                  </div>
                  <StatusBadge value={post.workflowState} />
                </Link>
              ))
            )}
          </TabsContent>

          <TabsContent value="system" className="space-y-2">
            {data.activity.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No system events"
                description="Audit events will stream here as the team works."
                className="py-8"
              />
            ) : (
              data.activity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.action}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.user?.name ?? "System"} ·{" "}
                      {item.entityType ?? "event"} ·{" "}
                      {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
