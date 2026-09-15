import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { leadService } from "@/services/lead.service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const forwarded = request.headers.get("x-forwarded-for");
    const lead = await leadService.capture(body, {
      ipAddress: forwarded?.split(",")[0]?.trim() ?? null,
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          id: lead.id,
          crmSyncStatus: lead.crmSyncStatus,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code, details: error.details },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { ok: false, error: "Unable to capture lead" },
      { status: 500 },
    );
  }
}
