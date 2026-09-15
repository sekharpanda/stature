import {
  Eye,
  Inbox,
  MousePointerClick,
  Percent,
  Search,
  Building2,
} from "lucide-react";

import { KpiCard } from "@/features/admin/components/shared/kpi-card";
import { DashboardChart } from "@/features/admin/components/dashboard/dashboard-charts";
import { organizationRepository } from "@/repositories/organization.repository";
import { getSession } from "@/lib/auth";
import { getDashboardCharts } from "@/services/dashboard.service";
import { analyticsService } from "@/services/analytics.service";

export const metadata = {
  title: "Analytics",
  robots: { index: false, follow: false },
};

export default async function AdminAnalyticsPage() {
  const session = await getSession();
  const organizationId =
    (session?.user as { organizationId?: string | null } | undefined)
      ?.organizationId ?? (await organizationRepository.getDefault())?.id;

  if (!organizationId) {
    return (
      <p className="text-muted-foreground">Organization not seeded.</p>
    );
  }

  const [charts, summary] = await Promise.all([
    getDashboardCharts(organizationId),
    analyticsService.getSummary(organizationId, 30),
  ]);

  const kpis = [
    {
      label: "Page views (30d)",
      value: summary.pageViews,
      icon: Eye,
      tone: "primary" as const,
    },
    {
      label: "Property views",
      value: summary.propertyViews,
      icon: Building2,
      tone: "success" as const,
    },
    {
      label: "Searches",
      value: summary.searches,
      icon: Search,
      tone: "warning" as const,
    },
    {
      label: "Lead submits",
      value: summary.leadSubmits,
      href: "/admin/leads",
      icon: Inbox,
      tone: "primary" as const,
    },
    {
      label: "Conversion rate",
      value: `${summary.conversionRate}%`,
      icon: Percent,
      tone: "gold" as const,
    },
    {
      label: "Total events",
      value: summary.total,
      icon: MousePointerClick,
      tone: "warning" as const,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Insights</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">Analytics</h1>
        <p className="mt-2 text-muted-foreground">
          Live traffic and conversion from site events (last 30 days).
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <DashboardChart
          title="Traffic overview"
          description="Page, property and search events by month"
          data={charts.trafficOverview}
          type="line"
        />
        <DashboardChart
          title="Channels"
          description="UTM source mix on tracked events"
          data={
            summary.channels.length > 0
              ? summary.channels
              : [{ label: "No data yet", value: 0 }]
          }
          type="pie"
        />
        <DashboardChart
          title="Top paths"
          description="Most viewed public routes"
          data={
            summary.topPaths.length > 0
              ? summary.topPaths
              : [{ label: "No data yet", value: 0 }]
          }
          type="bar"
        />
        <DashboardChart
          title="Event mix"
          description="Breakdown by event type"
          data={
            summary.byType.length > 0
              ? summary.byType
              : [{ label: "No data yet", value: 0 }]
          }
          type="bar"
        />
        <DashboardChart
          title="Monthly leads"
          description="Last 6 months of captured enquiries"
          data={charts.monthlyLeads}
          type="line"
        />
        <DashboardChart
          title="Lead sources"
          description="Attribution mix across campaigns"
          data={charts.leadSources}
          type="pie"
        />
      </section>
    </div>
  );
}
