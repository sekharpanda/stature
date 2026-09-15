import { cache } from "react";

import { prisma } from "@/lib/db";
import type { NavBadgeKey } from "@/config/admin-nav";

export type DashboardMetrics = {
  properties: {
    total: number;
    manual: number;
    leadrat: number;
    featured: number;
    draft: number;
    published: number;
  };
  leads: {
    today: number;
    month: number;
    total: number;
    new: number;
    followUp: number;
    meeting: number;
    closed: number;
    crmPending: number;
    crmFailed: number;
    crmSynced: number;
  };
  catalog: {
    developers: number;
    communities: number;
    areas: number;
  };
  content: {
    blogs: number;
    landingPages: number;
  };
  users: number;
  notificationsUnread: number;
  submissionsPending: number;
};

export type ChartPoint = { label: string; value: number };

export type DashboardCharts = {
  monthlyLeads: ChartPoint[];
  leadSources: ChartPoint[];
  propertiesAdded: ChartPoint[];
  crmSyncStatus: ChartPoint[];
  topDevelopers: ChartPoint[];
  topCommunities: ChartPoint[];
  trafficOverview: ChartPoint[];
};

function monthKeys(count = 6) {
  const keys: { key: string; label: string; start: Date; end: Date }[] = [];
  const now = new Date();

  for (let i = count - 1; i >= 0; i -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    keys.push({
      key: `${start.getFullYear()}-${start.getMonth()}`,
      label: start.toLocaleString("en", { month: "short" }),
      start,
      end,
    });
  }

  return keys;
}

export const getDashboardMetrics = cache(
  async (organizationId: string): Promise<DashboardMetrics> => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const propertyBase = { organizationId, deletedAt: null };
    const leadBase = { organizationId, deletedAt: null };

    // Small parallel waves (not one giant Promise.all) for Neon pool safety.
    const [propertyBySource, propertyByStatus, propertiesFeatured] =
      await Promise.all([
        prisma.property.groupBy({
          by: ["source"],
          where: propertyBase,
          _count: { _all: true },
          orderBy: { source: "asc" },
        }),
        prisma.property.groupBy({
          by: ["status"],
          where: propertyBase,
          _count: { _all: true },
          orderBy: { status: "asc" },
        }),
        prisma.property.count({
          where: { ...propertyBase, isFeatured: true },
        }),
      ]);

    const [leadByStatus, leadByCrm, leadsToday] = await Promise.all([
      prisma.lead.groupBy({
        by: ["status"],
        where: leadBase,
        _count: { _all: true },
        orderBy: { status: "asc" },
      }),
      prisma.lead.groupBy({
        by: ["crmSyncStatus"],
        where: leadBase,
        _count: { _all: true },
        orderBy: { crmSyncStatus: "asc" },
      }),
      prisma.lead.count({
        where: { ...leadBase, createdAt: { gte: startOfDay } },
      }),
    ]);

    const [leadsMonth, leadsTotal, developers] = await Promise.all([
      prisma.lead.count({
        where: { ...leadBase, createdAt: { gte: startOfMonth } },
      }),
      prisma.lead.count({ where: leadBase }),
      prisma.developer.count({ where: { organizationId, deletedAt: null } }),
    ]);

    const [communities, areas, blogs] = await Promise.all([
      prisma.community.count({ where: { organizationId, deletedAt: null } }),
      prisma.area.count({ where: { organizationId, deletedAt: null } }),
      prisma.blogPost.count({ where: { organizationId, deletedAt: null } }),
    ]);

    const [landingPages, users, notificationsUnread, submissionsPending] =
      await Promise.all([
        prisma.landingPage.count({ where: { organizationId, deletedAt: null } }),
        prisma.user.count({ where: { organizationId, deletedAt: null } }),
        prisma.notification.count({
          where: { organizationId, deletedAt: null, isRead: false },
        }),
        prisma.contentSubmission.count({
          where: { organizationId, deletedAt: null, status: "PENDING" },
        }),
      ]);

    const sourceCount = (source: string) =>
      propertyBySource.find((row) => row.source === source)?._count._all ?? 0;
    const statusCount = (status: string) =>
      propertyByStatus.find((row) => row.status === status)?._count._all ?? 0;
    const leadStatus = (status: string) =>
      leadByStatus.find((row) => row.status === status)?._count._all ?? 0;
    const crmCount = (status: string) =>
      leadByCrm.find((row) => row.crmSyncStatus === status)?._count._all ?? 0;

    const propertiesTotal = propertyBySource.reduce(
      (sum, row) => sum + row._count._all,
      0,
    );

    return {
      properties: {
        total: propertiesTotal,
        manual: sourceCount("MANUAL"),
        leadrat: sourceCount("LEADRAT"),
        featured: propertiesFeatured,
        draft: statusCount("DRAFT"),
        published: statusCount("PUBLISHED"),
      },
      leads: {
        today: leadsToday,
        month: leadsMonth,
        total: leadsTotal,
        new: leadStatus("NEW"),
        followUp: leadStatus("FOLLOW_UP"),
        meeting: leadStatus("MEETING_SCHEDULED"),
        closed: leadStatus("CLOSED"),
        crmPending: crmCount("PENDING"),
        crmFailed: crmCount("FAILED"),
        crmSynced: crmCount("SYNCED"),
      },
      catalog: { developers, communities, areas },
      content: { blogs, landingPages },
      users,
      notificationsUnread,
      submissionsPending,
    };
  },
);

export function metricsToNavBadges(
  metrics: DashboardMetrics,
): Partial<Record<NavBadgeKey, number>> {
  return {
    propertiesDraft: metrics.properties.draft,
    propertiesFeatured: metrics.properties.featured,
    propertiesManual: metrics.properties.manual,
    propertiesLeadrat: metrics.properties.leadrat,
    leadsNew: metrics.leads.new,
    leadsFollowUp: metrics.leads.followUp,
    leadsMeeting: metrics.leads.meeting,
    leadsTotal: metrics.leads.total,
    crmPending: metrics.leads.crmPending + metrics.leads.crmFailed,
    notificationsUnread: metrics.notificationsUnread,
    submissionsPending: metrics.submissionsPending,
  };
}

export const getDashboardCharts = cache(
  async (organizationId: string): Promise<DashboardCharts> => {
    const months = monthKeys(6);
    const rangeStart = months[0]?.start ?? new Date();

    const [leads, properties] = await Promise.all([
      prisma.lead.findMany({
        where: {
          organizationId,
          deletedAt: null,
          createdAt: { gte: rangeStart },
        },
        select: {
          createdAt: true,
          leadSource: true,
          utmSource: true,
          crmSyncStatus: true,
        },
      }),
      prisma.property.findMany({
        where: {
          organizationId,
          deletedAt: null,
          createdAt: { gte: rangeStart },
        },
        select: { createdAt: true },
      }),
    ]);

    const [topDevelopers, topCommunities, traffic] = await Promise.all([
      prisma.developer.findMany({
        where: { organizationId, deletedAt: null },
        select: {
          name: true,
          _count: { select: { properties: true } },
        },
        orderBy: { properties: { _count: "desc" } },
        take: 5,
      }),
      prisma.community.findMany({
        where: { organizationId, deletedAt: null },
        select: {
          name: true,
          _count: { select: { properties: true } },
        },
        orderBy: { properties: { _count: "desc" } },
        take: 5,
      }),
      prisma.analyticsEvent.findMany({
        where: {
          organizationId,
          deletedAt: null,
          createdAt: { gte: rangeStart },
          type: { in: ["PAGE_VIEW", "PROPERTY_VIEW", "SEARCH"] },
        },
        select: { createdAt: true },
      }),
    ]);

    const monthlyLeads = months.map((month) => ({
      label: month.label,
      value: leads.filter(
        (lead) => lead.createdAt >= month.start && lead.createdAt < month.end,
      ).length,
    }));

    const propertiesAdded = months.map((month) => ({
      label: month.label,
      value: properties.filter(
        (property) =>
          property.createdAt >= month.start && property.createdAt < month.end,
      ).length,
    }));

    const trafficOverview = months.map((month) => ({
      label: month.label,
      value: traffic.filter(
        (event) =>
          event.createdAt >= month.start && event.createdAt < month.end,
      ).length,
    }));

    const sourceMap = new Map<string, number>();
    for (const lead of leads) {
      const source = lead.leadSource || lead.utmSource || "Direct";
      sourceMap.set(source, (sourceMap.get(source) ?? 0) + 1);
    }

    const leadSources = [...sourceMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({ label, value }));

    const crmSyncStatus = [
      {
        label: "Synced",
        value: leads.filter((lead) => lead.crmSyncStatus === "SYNCED").length,
      },
      {
        label: "Pending",
        value: leads.filter((lead) => lead.crmSyncStatus === "PENDING").length,
      },
      {
        label: "Failed",
        value: leads.filter((lead) => lead.crmSyncStatus === "FAILED").length,
      },
    ];

    return {
      monthlyLeads,
      leadSources:
        leadSources.length > 0
          ? leadSources
          : [{ label: "No data yet", value: 0 }],
      propertiesAdded,
      crmSyncStatus,
      topDevelopers: topDevelopers.map((item) => ({
        label: item.name,
        value: item._count.properties,
      })),
      topCommunities: topCommunities.map((item) => ({
        label: item.name,
        value: item._count.properties,
      })),
      trafficOverview,
    };
  },
);

export const getRecentActivity = cache(async (organizationId: string) => {
  const [leads, properties, syncLogs] = await Promise.all([
    prisma.lead.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        crmSyncStatus: true,
        createdAt: true,
      },
    }),
    prisma.property.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        name: true,
        status: true,
        source: true,
        createdAt: true,
      },
    }),
    prisma.crmSyncLog.findMany({
      where: {
        deletedAt: null,
        lead: { organizationId },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        status: true,
        error: true,
        createdAt: true,
        lead: { select: { id: true, name: true } },
      },
    }),
  ]);

  const [blogs, activity] = await Promise.all([
    prisma.blogPost.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        workflowState: true,
        updatedAt: true,
      },
    }),
    prisma.activityLog.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    }),
  ]);

  return { leads, properties, syncLogs, blogs, activity };
});
