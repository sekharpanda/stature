import Link from "next/link";
import { CheckCircle2, ClipboardList, Clock, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/features/admin/components/shared/empty-state";
import { KpiCard } from "@/features/admin/components/shared/kpi-card";
import { SubmissionBadge } from "@/features/portal/components/workflow-badge";
import { ENTITY_LABELS, submissionService } from "@/services/submission.service";
import {
  SUBMISSION_STATUS_FILTERS,
  type SubmissionStatusFilter,
} from "@/schemas/portal.schema";

export const metadata = {
  title: "Approvals",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const FILTER_LABELS: Record<SubmissionStatusFilter, string> = {
  pending: "Awaiting approval",
  approved: "Approved",
  rejected: "Sent back",
  all: "Everything",
};

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const statusRaw = (Array.isArray(sp.status) ? sp.status[0] : sp.status) as
    | SubmissionStatusFilter
    | undefined;
  const status =
    statusRaw && SUBMISSION_STATUS_FILTERS.includes(statusRaw)
      ? statusRaw
      : "pending";
  const pageParam = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const page = Math.max(1, Number(pageParam ?? "1") || 1);

  const result = await submissionService.listQueue({ status, page });

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Governance</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">Approvals</h1>
        <p className="mt-2 text-muted-foreground">
          Everything agents submit from the portal lands here. Nothing reaches the
          website until you approve it.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Awaiting approval"
          value={result.counts.PENDING}
          icon={Clock}
          tone={result.counts.PENDING > 0 ? "warning" : "default"}
          href="/admin/approvals?status=pending"
        />
        <KpiCard
          label="Approved"
          value={result.counts.APPROVED}
          icon={CheckCircle2}
          tone="success"
          href="/admin/approvals?status=approved"
        />
        <KpiCard
          label="Sent back"
          value={result.counts.REJECTED}
          icon={XCircle}
          href="/admin/approvals?status=rejected"
        />
        <KpiCard
          label="Withdrawn"
          value={result.counts.WITHDRAWN}
          icon={ClipboardList}
        />
      </div>

      <Card className="card-elevated border-border/80">
        <CardHeader className="gap-4">
          <div>
            <CardTitle className="font-display text-xl">
              {FILTER_LABELS[status]}
            </CardTitle>
            <CardDescription>
              {result.total} submission{result.total === 1 ? "" : "s"}.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {SUBMISSION_STATUS_FILTERS.map((option) => (
              <Button
                key={option}
                asChild
                size="sm"
                variant={option === status ? "default" : "outline"}
              >
                <Link href={`/admin/approvals?status=${option}`}>
                  {FILTER_LABELS[option]}
                </Link>
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.items.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title={
                status === "pending"
                  ? "Nothing waiting for you"
                  : "Nothing to show"
              }
              description="Agent submissions from the portal appear here for approval."
              className="py-12"
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">What</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">From</th>
                    <th className="px-4 py-3 font-medium">Submitted</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium sr-only">Review</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/approvals/${item.id}`}
                          className="font-medium hover:underline"
                        >
                          {item.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline">
                            {ENTITY_LABELS[item.entityType]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {item.kind === "UPDATE"
                              ? "Edit"
                              : item.kind === "ACCESS_REQUEST"
                                ? "Access"
                                : "New"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {item.submittedBy?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {item.submittedAt.toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <SubmissionBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/approvals/${item.id}`}>
                            {item.status === "PENDING" ? "Review" : "Open"}
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result.pageCount > 1 ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Page {result.page} of {result.pageCount}
              </p>
              <div className="flex gap-2">
                {result.page > 1 ? (
                  <Button asChild variant="outline" size="sm">
                    <Link
                      href={`/admin/approvals?status=${status}&page=${result.page - 1}`}
                    >
                      Previous
                    </Link>
                  </Button>
                ) : null}
                {result.page < result.pageCount ? (
                  <Button asChild variant="outline" size="sm">
                    <Link
                      href={`/admin/approvals?status=${status}&page=${result.page + 1}`}
                    >
                      Next
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
