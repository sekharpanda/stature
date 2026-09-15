import Link from "next/link";
import { BadgeCheck, CircleAlert, Clock3, Database } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/features/admin/components/shared/empty-state";
import { KpiCard } from "@/features/admin/components/shared/kpi-card";
import { RetryCrmButton } from "@/features/admin/components/retry-crm-button";
import { organizationRepository } from "@/repositories/organization.repository";
import { leadRepository } from "@/repositories/lead.repository";
import { getDashboardMetrics } from "@/services/dashboard.service";
import { prisma } from "@/lib/db";

export const metadata = {
  title: "CRM Sync",
  robots: { index: false, follow: false },
};

export default async function CrmSyncPage() {
  const org = await organizationRepository.getDefault();
  if (!org) {
    return <p className="text-muted-foreground">Organization not seeded.</p>;
  }

  const [metrics, pending, logs] = await Promise.all([
    getDashboardMetrics(org.id),
    leadRepository.listPendingCrmSync(org.id, 50),
    prisma.crmSyncLog.findMany({
      where: { deletedAt: null, lead: { organizationId: org.id } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { lead: { select: { id: true, name: true } } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">CRM</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">LeadRat sync</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Neon PostgreSQL remains the source of truth. Every lead is stored
          locally first, then pushed to LeadRat with automatic and manual retry.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Pending sync"
          value={metrics.leads.crmPending}
          icon={Clock3}
          tone="warning"
          href="/admin/leads/crm-sync"
        />
        <KpiCard
          label="Failed sync"
          value={metrics.leads.crmFailed}
          icon={CircleAlert}
          tone="danger"
          href="/admin/leads/crm-sync"
        />
        <KpiCard
          label="Successfully synced"
          value={metrics.leads.crmSynced}
          icon={BadgeCheck}
          tone="success"
        />
        <KpiCard
          label="Total leads"
          value={metrics.leads.total}
          icon={Database}
          tone="primary"
          href="/admin/leads"
        />
      </div>

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">Queue</CardTitle>
          <CardDescription>
            Pending and failed pushes ready for retry.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <EmptyState
              icon={BadgeCheck}
              title="Queue is clear"
              description="No pending or failed LeadRat synchronizations."
              className="py-10"
            />
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Lead</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Retries</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="px-4 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {pending.map((lead) => (
                    <tr key={lead.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/leads/${lead.id}`}
                          className="font-medium hover:text-primary"
                        >
                          {lead.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {lead.email ?? lead.phone ?? "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            lead.crmSyncStatus === "FAILED"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {lead.crmSyncStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {lead.crmRetryCount}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {lead.createdAt.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <RetryCrmButton leadId={lead.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">Sync history</CardTitle>
          <CardDescription>Latest CRM activity logs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {logs.length === 0 ? (
            <EmptyState
              icon={Database}
              title="No sync logs yet"
              description="Attempts appear here after lead capture."
              className="py-10"
            />
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {log.lead.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {log.error ?? "OK"} · attempt {log.attempt} ·{" "}
                    {log.createdAt.toLocaleString()}
                  </p>
                </div>
                <Badge
                  variant={
                    log.status === "FAILED"
                      ? "destructive"
                      : log.status === "SYNCED"
                        ? "default"
                        : "outline"
                  }
                >
                  {log.status}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
