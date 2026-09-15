import { NextResponse } from "next/server";
import type { AnalyticsEventType, Prisma } from "@prisma/client";

import { analyticsService } from "@/services/analytics.service";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set<AnalyticsEventType>([
  "PAGE_VIEW",
  "PROPERTY_VIEW",
  "SEARCH",
  "FILTER",
  "LEAD_SUBMIT",
  "BROCHURE_DOWNLOAD",
  "WHATSAPP_CLICK",
  "CALL_CLICK",
  "FORM_START",
  "FORM_SUBMIT",
  "SHARE",
]);

function sessionIdFrom(request: Request, bodySession?: string | null) {
  if (bodySession?.trim()) return bodySession.trim().slice(0, 80);
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)pw_sid=([^;]+)/);
  return match?.[1] ?? null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      type?: string;
      path?: string;
      propertyId?: string;
      sessionId?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
      gclid?: string;
      fbclid?: string;
      referrer?: string;
      metadata?: Record<string, unknown>;
    };

    const type = body.type as AnalyticsEventType | undefined;
    if (!type || !ALLOWED_TYPES.has(type)) {
      return NextResponse.json(
        { ok: false, error: "Invalid event type" },
        { status: 400 },
      );
    }

    await analyticsService.track({
      type,
      path: body.path?.slice(0, 500) ?? null,
      propertyId: body.propertyId ?? null,
      sessionId: sessionIdFrom(request, body.sessionId),
      utmSource: body.utmSource?.slice(0, 120) ?? null,
      utmMedium: body.utmMedium?.slice(0, 120) ?? null,
      utmCampaign: body.utmCampaign?.slice(0, 120) ?? null,
      gclid: body.gclid?.slice(0, 120) ?? null,
      fbclid: body.fbclid?.slice(0, 120) ?? null,
      referrer: body.referrer?.slice(0, 500) ?? null,
      metadata: body.metadata as Prisma.InputJsonValue | undefined,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unable to track event" },
      { status: 500 },
    );
  }
}
