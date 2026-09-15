import type { AnalyticsEventType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { organizationRepository } from "@/repositories/organization.repository";

export type TrackAnalyticsInput = {
  type: AnalyticsEventType;
  path?: string | null;
  propertyId?: string | null;
  sessionId?: string | null;
  userId?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  referrer?: string | null;
  metadata?: Prisma.InputJsonValue;
  organizationId?: string | null;
};

const PROPERTY_COUNTER: Partial<
  Record<AnalyticsEventType, keyof typeof PROPERTY_COUNTER_FIELDS>
> = {
  PROPERTY_VIEW: "views",
  LEAD_SUBMIT: "enquiries",
  BROCHURE_DOWNLOAD: "brochureDownloads",
  WHATSAPP_CLICK: "whatsappClicks",
  CALL_CLICK: "callClicks",
  MEETING: "meetings",
  SITE_VISIT: "siteVisits",
  CONVERSION: "conversions",
};

const PROPERTY_COUNTER_FIELDS = {
  views: true,
  enquiries: true,
  brochureDownloads: true,
  whatsappClicks: true,
  callClicks: true,
  meetings: true,
  siteVisits: true,
  conversions: true,
} as const;

export const analyticsService = {
  async track(input: TrackAnalyticsInput) {
    let organizationId = input.organizationId ?? null;
    if (!organizationId) {
      organizationId = (await organizationRepository.getDefault())?.id ?? null;
    }
    if (!organizationId) return null;

    const event = await prisma.analyticsEvent.create({
      data: {
        organizationId,
        type: input.type,
        path: input.path ?? undefined,
        propertyId: input.propertyId ?? undefined,
        sessionId: input.sessionId ?? undefined,
        userId: input.userId ?? undefined,
        utmSource: input.utmSource ?? undefined,
        utmMedium: input.utmMedium ?? undefined,
        utmCampaign: input.utmCampaign ?? undefined,
        gclid: input.gclid ?? undefined,
        fbclid: input.fbclid ?? undefined,
        referrer: input.referrer ?? undefined,
        metadata: input.metadata,
      },
    });

    const counter = PROPERTY_COUNTER[input.type];
    if (counter && input.propertyId) {
      await prisma.propertyAnalytics.upsert({
        where: { propertyId: input.propertyId },
        create: {
          propertyId: input.propertyId,
          [counter]: 1,
        },
        update: {
          [counter]: { increment: 1 },
        },
      });
    }

    return event;
  },

  async getSummary(organizationId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const events = await prisma.analyticsEvent.findMany({
      where: {
        organizationId,
        deletedAt: null,
        createdAt: { gte: since },
      },
      select: { type: true, path: true, utmSource: true, createdAt: true },
    });

    const byType = new Map<string, number>();
    const byPath = new Map<string, number>();
    const bySource = new Map<string, number>();

    for (const event of events) {
      byType.set(event.type, (byType.get(event.type) ?? 0) + 1);
      if (event.path) {
        byPath.set(event.path, (byPath.get(event.path) ?? 0) + 1);
      }
      const source = event.utmSource || "Direct";
      bySource.set(source, (bySource.get(source) ?? 0) + 1);
    }

    const pageViews = byType.get("PAGE_VIEW") ?? 0;
    const propertyViews = byType.get("PROPERTY_VIEW") ?? 0;
    const searches = byType.get("SEARCH") ?? 0;
    const leadSubmits = byType.get("LEAD_SUBMIT") ?? 0;
    const conversionRate =
      pageViews > 0 ? Math.round((leadSubmits / pageViews) * 1000) / 10 : 0;

    return {
      total: events.length,
      pageViews,
      propertyViews,
      searches,
      leadSubmits,
      conversionRate,
      topPaths: [...byPath.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([label, value]) => ({ label, value })),
      channels: [...bySource.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([label, value]) => ({ label, value })),
      byType: [...byType.entries()].map(([label, value]) => ({ label, value })),
    };
  },
};
