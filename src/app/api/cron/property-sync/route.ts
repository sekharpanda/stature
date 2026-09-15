import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { organizationRepository } from "@/repositories/organization.repository";
import { runInventorySync } from "@/services/property-sync.service";
import { isLeadRatReady } from "@/providers/leadrat";

/**
 * Scheduled / manual LeadRat inventory sync.
 * Auth: Authorization: Bearer $CRON_SECRET  OR authenticated session.
 */
export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  const session = await getSession();
  const cronOk = Boolean(cronSecret && bearer && bearer === cronSecret);

  if (!cronOk && !session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isLeadRatReady()) {
    return NextResponse.json(
      { error: "LeadRat not configured" },
      { status: 503 },
    );
  }

  const org = await organizationRepository.getDefault();
  if (!org) {
    return NextResponse.json({ error: "No organization" }, { status: 500 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      enrichDetails?: boolean;
      markMissing?: boolean;
      maxPages?: number;
    };

    const result = await runInventorySync({
      organizationId: org.id,
      enrichDetails: body.enrichDetails ?? false,
      markMissing: body.markMissing ?? false,
      maxPages: body.maxPages,
      mode: cronOk ? "cron" : "manual",
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Sync failed",
      },
      { status: 500 },
    );
  }
}
