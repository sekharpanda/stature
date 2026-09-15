import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { leadService } from "@/services/lead.service";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const result = await leadService.retryCrmSync(id);
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { ok: false, error: "Unable to retry CRM sync" },
      { status: 500 },
    );
  }
}
