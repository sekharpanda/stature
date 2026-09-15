import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ReviewPanel } from "@/features/admin/components/approvals/review-panel";
import { SubmissionBadge } from "@/features/portal/components/workflow-badge";
import { NotFoundError } from "@/lib/errors";
import {
  ENTITY_LABELS,
  submissionService,
  type FieldChange,
} from "@/services/submission.service";

export const metadata = {
  title: "Review Submission",
  robots: { index: false, follow: false },
};

type Params = Promise<{ id: string }>;

function PayloadRows({ payload }: { payload: Record<string, unknown> }) {
  const entries = Object.entries(payload).filter(([, value]) => {
    if (value == null) return false;
    if (Array.isArray(value)) return value.length > 0;
    return String(value).trim() !== "";
  });

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing submitted.</p>;
  }

  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {entries.map(([key, value]) => (
        <div key={key} className="min-w-0">
          <dt className="text-xs tracking-wide text-muted-foreground uppercase">
            {key}
          </dt>
          <dd className="break-words text-sm">
            {Array.isArray(value) ? value.join(", ") : String(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default async function ReviewSubmissionPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  let data: Awaited<ReturnType<typeof submissionService.getDetail>>;
  try {
    data = await submissionService.getDetail(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const { submission, changes, preview, agentOptions } = data;
  const payload = (submission.payload ?? {}) as Record<string, unknown>;
  const fieldChanges = changes as FieldChange[];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Approvals</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl md:text-4xl">
              {submission.title}
            </h1>
            <SubmissionBadge status={submission.status} />
          </div>
          <p className="mt-2 text-muted-foreground">
            {ENTITY_LABELS[submission.entityType]} •{" "}
            {submission.kind === "UPDATE"
              ? "Edit to live content"
              : submission.kind === "ACCESS_REQUEST"
                ? "Portal access request"
                : "New submission"}{" "}
            • from {submission.submittedBy?.name ?? "unknown"} on{" "}
            {submission.submittedAt.toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {preview?.adminHref ? (
            <Button asChild variant="outline">
              <Link href={preview.adminHref}>Open in admin</Link>
            </Button>
          ) : null}
          {preview?.publicHref ? (
            <Button asChild variant="outline">
              <Link href={preview.publicHref} target="_blank">
                View live version
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link href="/admin/approvals">Back to queue</Link>
          </Button>
        </div>
      </div>

      {submission.note ? (
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="font-display text-lg">
              Note from the agent
            </CardTitle>
            <CardDescription>{submission.note}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {preview ? (
        <Card className="card-elevated border-border/80">
          <CardHeader>
            <CardTitle className="font-display text-xl">
              Current record
            </CardTitle>
            <CardDescription>{preview.title}</CardDescription>
          </CardHeader>
          {preview.meta.length > 0 ? (
            <CardContent className="flex flex-wrap gap-2">
              {preview.meta.map((item) => (
                <Badge key={item} variant="outline">
                  {item}
                </Badge>
              ))}
            </CardContent>
          ) : null}
        </Card>
      ) : null}

      {submission.kind === "UPDATE" ? (
        <Card className="card-elevated border-border/80">
          <CardHeader>
            <CardTitle className="font-display text-xl">
              What changes
            </CardTitle>
            <CardDescription>
              {fieldChanges.length} field
              {fieldChanges.length === 1 ? "" : "s"} differ from what is live now.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {fieldChanges.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No field-level differences were recorded.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Field</th>
                      <th className="px-4 py-2.5 font-medium">Live now</th>
                      <th className="px-4 py-2.5 font-medium">Proposed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fieldChanges.map((change) => (
                      <tr key={change.field} className="border-b last:border-0">
                        <td className="px-4 py-2.5 font-medium">
                          {change.label}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {change.from ?? "—"}
                        </td>
                        <td className="px-4 py-2.5">{change.to ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="card-elevated border-border/80">
          <CardHeader>
            <CardTitle className="font-display text-xl">Submitted</CardTitle>
            <CardDescription>Everything the agent filled in.</CardDescription>
          </CardHeader>
          <CardContent>
            <PayloadRows payload={payload} />
          </CardContent>
        </Card>
      )}

      {submission.status === "PENDING" ? (
        <ReviewPanel
          submissionId={submission.id}
          entityType={submission.entityType}
          kind={submission.kind}
          agentOptions={agentOptions.map((option) => ({
            id: option.id,
            name: option.name,
          }))}
        />
      ) : (
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="font-display text-lg">
              Already reviewed
            </CardTitle>
            <CardDescription>
              {submission.reviewedBy?.name ?? "A reviewer"} decided on{" "}
              {submission.reviewedAt?.toLocaleString() ?? "an earlier date"}.
              {submission.reviewNote ? ` Note: ${submission.reviewNote}` : ""}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
