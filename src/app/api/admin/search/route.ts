import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { organizationRepository } from "@/repositories/organization.repository";
import { searchRepository } from "@/repositories/search.repository";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ ok: true, data: [] });
  }

  const organizationId =
    (session.user as { organizationId?: string | null }).organizationId ??
    (await organizationRepository.getDefault())?.id;

  if (!organizationId) {
    return NextResponse.json({ ok: true, data: [] });
  }

  try {
    const results = await searchRepository.globalSearch(organizationId, query);
    return NextResponse.json({ ok: true, data: results });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Search failed" },
      { status: 500 },
    );
  }
}
