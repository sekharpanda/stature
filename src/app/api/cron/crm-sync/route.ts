import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { getSession } from "@/lib/auth";
import { leadService } from "@/services/lead.service";
import { organizationRepository } from "@/repositories/organization.repository";
import { leadRepository } from "@/repositories/lead.repository";

/**
 * Cron-ready endpoint to retry pending/failed LeadRat syncs.
 * Protect with CRON_SECRET bearer token in production.
 */
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const provided = request.headers.get("authorization")?.replace("Bearer ", "");

    if (cronSecret) {
      if (provided !== cronSecret) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
      }
    } else {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
      }
    }

    const org = await organizationRepository.getDefault();
    if (!org) {
      throw new AppError("Organization missing", { status: 500, code: "ORG_MISSING" });
    }

    const pending = await leadRepository.listPendingCrmSync(org.id, 25);
    const results = [];

    for (const lead of pending) {
      results.push({
        leadId: lead.id,
        result: await leadService.pushToCrm(lead.id),
      });
    }

    return NextResponse.json({
      ok: true,
      data: { processed: results.length, results },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: error.status },
      );
    }
    return NextResponse.json({ ok: false, error: "Sync job failed" }, { status: 500 });
  }
}
