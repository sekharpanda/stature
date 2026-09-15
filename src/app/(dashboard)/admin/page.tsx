import {
  BadgeCheck,
  Building2,
  Database,
  FileText,
  Handshake,
  Inbox,
  Map as MapIcon,
  MapPin,
  Rocket,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import { KpiCard } from "@/features/admin/components/shared/kpi-card";
import { QuickActionsGrid } from "@/features/admin/components/dashboard/quick-actions-grid";
import { DashboardChart } from "@/features/admin/components/dashboard/dashboard-charts";
import { RecentActivityPanel } from "@/features/admin/components/dashboard/recent-activity-panel";
import { redirect } from "next/navigation";

import { organizationRepository } from "@/repositories/organization.repository";
import { getSession, getUserPermissionKeys } from "@/lib/auth";
import {
  getDashboardCharts,
  getDashboardMetrics,
  getRecentActivity,
} from "@/services/dashboard.service";

export const metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function AdminOverviewPage() {
  const session = await getSession();

  // Consultants have no business on the company dashboard; send them to their
  // own workspace instead of throwing a permission error.
  if (session?.user?.id) {
    const permissions = await getUserPermissionKeys(session.user.id);
    if (!permissions.includes("dashboard:view") && permissions.includes("portal:access")) {
      redirect("/admin/my");
    }
  }

  const organizationId =
    (session?.user as { organizationId?: string | null } | undefined)
      ?.organizationId ?? (await organizationRepository.getDefault())?.id;

  if (!organizationId) {
    return (
      <div className="rounded-xl border bg-card p-8">
        <p className="eyebrow">Setup required</p>
        <h1 className="mt-2 font-display text-3xl">Organization missing</h1>
        <p className="mt-2 text-muted-foreground">
          Run database seed to create the Prowin workspace.
        </p>
        <pre className="mt-4 overflow-auto rounded-lg bg-muted p-4 text-sm">
          {`npx prisma db push
npm run db:seed`}
        </pre>
      </div>
    );
  }

  // Sequential on purpose: layout already loads metrics (React cache), and
  // fan-out Promise.all here was starving the Neon connection pool.
  const metrics = await getDashboardMetrics(organizationId);
  const charts = await getDashboardCharts(organizationId);
  const recent = await getRecentActivity(organizationId);

  const inventoryKpis = [
    {
      label: "Total Properties",
      value: metrics.properties.total,
      href: "/admin/properties",
      icon: Building2,
      tone: "primary" as const,
      hint: "All inventory sources",
    },
    {
      label: "Manual Properties",
      value: metrics.properties.manual,
      href: "/admin/properties?source=manual",
      icon: Sparkles,
      tone: "gold" as const,
    },
    {
      label: "Off Plan Projects",
      value: metrics.properties.leadrat,
      href: "/admin/properties?source=leadrat",
      icon: Database,
      tone: "default" as const,
    },
    {
      label: "Featured",
      value: metrics.properties.featured,
      href: "/admin/properties?featured=true",
      icon: Star,
      tone: "gold" as const,
    },
    {
      label: "Drafts",
      value: metrics.properties.draft,
      href: "/admin/properties?status=draft",
      icon: FileText,
      tone: "warning" as const,
    },
    {
      label: "Published",
      value: metrics.properties.published,
      href: "/admin/properties?status=published",
      icon: BadgeCheck,
      tone: "success" as const,
    },
  ];

  const leadKpis = [
    {
      label: "Today's Leads",
      value: metrics.leads.today,
      href: "/admin/leads",
      icon: Inbox,
      tone: "primary" as const,
    },
    {
      label: "Monthly Leads",
      value: metrics.leads.month,
      href: "/admin/leads",
      icon: Inbox,
      tone: "default" as const,
    },
    {
      label: "Pending CRM Sync",
      value: metrics.leads.crmPending,
      href: "/admin/leads/crm-sync",
      icon: Database,
      tone: "warning" as const,
    },
    {
      label: "Failed CRM Sync",
      value: metrics.leads.crmFailed,
      href: "/admin/leads/crm-sync",
      icon: Database,
      tone: "danger" as const,
    },
    {
      label: "CRM Synced",
      value: metrics.leads.crmSynced,
      href: "/admin/leads/crm-sync",
      icon: BadgeCheck,
      tone: "success" as const,
    },
  ];

  const growthKpis = [
    {
      label: "Developers",
      value: metrics.catalog.developers,
      href: "/admin/developers",
      icon: Handshake,
    },
    {
      label: "Communities",
      value: metrics.catalog.communities,
      href: "/admin/communities",
      icon: MapPin,
    },
    {
      label: "Areas",
      value: metrics.catalog.areas,
      href: "/admin/areas",
      icon: MapIcon,
    },
    {
      label: "Blogs",
      value: metrics.content.blogs,
      href: "/admin/blog",
      icon: FileText,
    },
    {
      label: "Landing Pages",
      value: metrics.content.landingPages,
      href: "/admin/landing-pages",
      icon: Rocket,
    },
    {
      label: "Users",
      value: metrics.users,
      href: "/admin/users",
      icon: Users,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Operations center</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">
            Good{" "}
            {new Date().getHours() < 12
              ? "morning"
              : new Date().getHours() < 18
                ? "afternoon"
                : "evening"}
            {session?.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
            Enterprise overview across inventory, CRM, content and growth —
            designed for high-velocity Dubai brokerage operations.
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Quick actions</h2>
        </div>
        <QuickActionsGrid />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">Inventory</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {inventoryKpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">Leads & CRM</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {leadKpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">Catalog & content</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {growthKpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} tone="default" />
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
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
        <DashboardChart
          title="Properties added"
          description="Inventory growth by month"
          data={charts.propertiesAdded}
          type="bar"
        />
        <DashboardChart
          title="CRM sync status"
          description="LeadRat push health"
          data={charts.crmSyncStatus}
          type="pie"
        />
        <DashboardChart
          title="Top developers"
          description="By linked property count"
          data={charts.topDevelopers}
          type="bar"
        />
        <DashboardChart
          title="Top communities"
          description="By linked property count"
          data={charts.topCommunities}
          type="bar"
        />
        <DashboardChart
          title="Traffic overview"
          description="Page, property and search events"
          data={charts.trafficOverview}
          type="line"
        />
      </section>

      <RecentActivityPanel data={recent} />
    </div>
  );
}
