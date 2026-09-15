import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RetryCrmButton } from "@/features/admin/components/retry-crm-button";
import { LeadWorkflowPanel } from "@/features/admin/components/leads/lead-workflow-panel";
import { leadRepository } from "@/repositories/lead.repository";
import { organizationRepository } from "@/repositories/organization.repository";
import { prisma } from "@/lib/db";

type Props = { params: Promise<{ id: string }> };

export default async function AdminLeadDetailPage({ params }: Props) {
  const { id } = await params;
  const lead = await leadRepository.findById(id);
  if (!lead) notFound();

  const org = await organizationRepository.getDefault();
  const agents = org
    ? await prisma.user.findMany({
        where: {
          organizationId: org.id,
          deletedAt: null,
          status: "ACTIVE",
        },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
        take: 100,
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button asChild variant="ghost" className="-ml-3 mb-2 h-8 px-3 text-sm">
            <Link href="/admin/leads">← Back to leads</Link>
          </Button>
          <p className="eyebrow">Lead workspace</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">{lead.name}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="secondary">{lead.status}</Badge>
            <Badge variant="outline">{lead.crmSyncStatus}</Badge>
            {lead.assignedTo ? (
              <Badge variant="outline">Assigned · {lead.assignedTo.name}</Badge>
            ) : (
              <Badge variant="outline">Unassigned</Badge>
            )}
          </div>
        </div>
        {lead.crmSyncStatus !== "SYNCED" ? (
          <RetryCrmButton leadId={lead.id} />
        ) : null}
      </div>

      <LeadWorkflowPanel
        leadId={lead.id}
        status={lead.status}
        assignedToId={lead.assignedToId}
        agents={agents}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Contact</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Email</dt>
              <dd>{lead.email ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Phone</dt>
              <dd>{lead.phone ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">WhatsApp</dt>
              <dd>{lead.whatsapp ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Country</dt>
              <dd>{lead.country ?? "—"}</dd>
            </div>
            {lead.property ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Property</dt>
                <dd>
                  <Link
                    href={`/admin/properties/${lead.property.id}`}
                    className="text-primary hover:underline"
                  >
                    {lead.property.name}
                  </Link>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Attribution</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Source</dt>
              <dd>{lead.leadSource ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Campaign</dt>
              <dd>{lead.campaign ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">UTM</dt>
              <dd className="text-right">
                {[lead.utmSource, lead.utmMedium, lead.utmCampaign]
                  .filter(Boolean)
                  .join(" / ") || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Landing</dt>
              <dd className="max-w-[60%] truncate text-right">
                {lead.landingPage ?? "—"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="text-lg font-semibold">CRM sync history</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {lead.crmSyncLogs.length === 0 ? (
            <li className="text-muted-foreground">No sync attempts yet.</li>
          ) : (
            lead.crmSyncLogs.map((log) => (
              <li
                key={log.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-3 last:border-0"
              >
                <div>
                  <Badge variant="outline">{log.status}</Badge>
                  <span className="ml-2 text-muted-foreground">
                    attempt {log.attempt} · {log.createdAt.toLocaleString()}
                  </span>
                  {log.error ? (
                    <p className="mt-1 text-destructive">{log.error}</p>
                  ) : null}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Internal notes</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {lead.notes.length === 0 ? (
            <li className="text-muted-foreground">No notes yet.</li>
          ) : (
            lead.notes.map((note) => (
              <li
                key={note.id}
                className="border-b border-neutral-100 pb-3 last:border-0"
              >
                <p>{note.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {note.createdAt.toLocaleString()}
                </p>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
