import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CsvDownloadButton } from "@/features/admin/components/shared/csv-download-button";
import { organizationRepository } from "@/repositories/organization.repository";
import { getDashboardMetrics } from "@/services/dashboard.service";

export const metadata = {
  title: "Reports",
  robots: { index: false, follow: false },
};

export default async function AdminReportsPage() {
  const org = await organizationRepository.getDefault();
  if (!org) return <p className="text-muted-foreground">Organization not seeded.</p>;

  const metrics = await getDashboardMetrics(org.id);

  const inventoryRows = [
    { metric: "Total", count: metrics.properties.total },
    { metric: "Draft", count: metrics.properties.draft },
    { metric: "Published", count: metrics.properties.published },
    { metric: "Manual", count: metrics.properties.manual },
    { metric: "LeadRat", count: metrics.properties.leadrat },
    { metric: "Featured", count: metrics.properties.featured },
  ];

  const funnelRows = [
    { stage: "New", count: metrics.leads.new },
    { stage: "Follow-up", count: metrics.leads.followUp },
    { stage: "Meeting scheduled", count: metrics.leads.meeting },
    { stage: "Closed", count: metrics.leads.closed },
    { stage: "Total", count: metrics.leads.total },
    { stage: "CRM pending", count: metrics.leads.crmPending },
    { stage: "CRM failed", count: metrics.leads.crmFailed },
    { stage: "CRM synced", count: metrics.leads.crmSynced },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Insights</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">Reports</h1>
        <p className="mt-2 text-muted-foreground">
          Inventory publish status and lead funnel snapshots with CSV export.
        </p>
      </div>

      <Card className="card-elevated border-border/80">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="font-display text-xl">
              Inventory publish report
            </CardTitle>
            <CardDescription>
              Draft vs published and source mix for current inventory.
            </CardDescription>
          </div>
          <CsvDownloadButton
            filename="inventory-publish-report.csv"
            columns={[
              { key: "metric", label: "Metric" },
              { key: "count", label: "Count" },
            ]}
            rows={inventoryRows}
          />
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Metric</th>
                  <th className="px-4 py-3 font-medium">Count</th>
                </tr>
              </thead>
              <tbody>
                {inventoryRows.map((row) => (
                  <tr key={row.metric} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{row.metric}</td>
                    <td className="px-4 py-3">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="card-elevated border-border/80">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="font-display text-xl">Lead funnel</CardTitle>
            <CardDescription>
              Pipeline stage counts and CRM sync health.
            </CardDescription>
          </div>
          <CsvDownloadButton
            filename="lead-funnel-report.csv"
            columns={[
              { key: "stage", label: "Stage" },
              { key: "count", label: "Count" },
            ]}
            rows={funnelRows}
          />
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Stage</th>
                  <th className="px-4 py-3 font-medium">Count</th>
                </tr>
              </thead>
              <tbody>
                {funnelRows.map((row) => (
                  <tr key={row.stage} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{row.stage}</td>
                    <td className="px-4 py-3">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
