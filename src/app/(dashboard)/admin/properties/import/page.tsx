import { RefreshCw } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeadRatSyncControls } from "@/features/admin/components/properties/leadrat-sync-controls";
import { EmptyState } from "@/features/admin/components/shared/empty-state";
import { propertySyncService } from "@/services/property-sync.service";
import { requirePermission } from "@/lib/auth";

export const metadata = {
  title: "Import from LeadRat",
  robots: { index: false, follow: false },
};

export default async function LeadRatImportPage() {
  await requirePermission("property:sync");
  const data = await propertySyncService.getOverview();

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Core inventory</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">
          Import from LeadRat
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Sync Off Plan listings from LeadRat public API (covers, prices,
          payment plans, galleries). Old Enterprise Project inventory is no
          longer used.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Off Plan projects", value: data.overview.total },
          { label: "Synced", value: data.overview.synced },
          { label: "Failed", value: data.overview.failed },
          { label: "Stale", value: data.overview.stale },
          { label: "Removed", value: data.overview.deleted },
        ].map((kpi) => (
          <Card key={kpi.label} className="rounded-[3px]">
            <CardHeader className="pb-2">
              <CardDescription>{kpi.label}</CardDescription>
              <CardTitle className="font-display text-3xl tabular-nums">
                {kpi.value}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="rounded-[3px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="size-4" />
            Sync console
          </CardTitle>
          <CardDescription>
            Inventory auto-pulls in the background when you use admin (every{" "}
            {data.connection.autoSyncMinutes ?? 30} minutes). Use this button for
            a full detail refresh.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeadRatSyncControls connection={data.connection} />
          {data.lastJob ? (
            <div className="mt-6 rounded-md border p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">Last job</span>
                <Badge variant="outline">{data.lastJob.status}</Badge>
                <span className="text-muted-foreground">
                  {data.lastJob.createdAt.toLocaleString()}
                </span>
              </div>
              {data.lastJob.error ? (
                <p className="mt-2 text-destructive">{data.lastJob.error}</p>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-[3px]">
        <CardHeader>
          <CardTitle>Recent sync logs</CardTitle>
          <CardDescription>Latest property-level sync attempts</CardDescription>
        </CardHeader>
        <CardContent>
          {data.overview.recentLogs.length === 0 ? (
            <EmptyState
              icon={RefreshCw}
              title="No sync logs yet"
              description="Run a LeadRat sync to populate inventory and logs."
              className="py-10"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b text-muted-foreground">
                  <tr>
                    <th className="px-2 py-2 font-medium">Property</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium">LeadRat ID</th>
                    <th className="px-2 py-2 font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {data.overview.recentLogs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0">
                      <td className="px-2 py-2.5 font-medium">
                        {log.property.name}
                      </td>
                      <td className="px-2 py-2.5">
                        <Badge
                          variant={
                            log.status === "SYNCED"
                              ? "default"
                              : log.status === "FAILED"
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {log.status}
                        </Badge>
                      </td>
                      <td className="px-2 py-2.5 font-mono text-xs text-muted-foreground">
                        {log.property.leadratProjectId ?? "—"}
                      </td>
                      <td className="px-2 py-2.5 text-muted-foreground">
                        {log.createdAt.toLocaleString()}
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
