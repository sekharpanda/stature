import Link from "next/link";
import { ClipboardList } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/features/admin/components/shared/empty-state";
import { SubmissionBadge } from "@/features/portal/components/workflow-badge";
import { WithdrawButton } from "@/features/portal/components/withdraw-button";
import { ENTITY_LABELS } from "@/services/submission.service";
import { portalService } from "@/services/portal.service";

export const metadata = {
  title: "My Submissions",
  robots: { index: false, follow: false },
};

function targetHref(entityType: string, entityId: string | null) {
  if (!entityId) return null;
  if (entityType === "PROPERTY") return `/admin/my/listings/${entityId}`;
  if (entityType === "BLOG_POST") return `/admin/my/posts/${entityId}`;
  if (entityType === "AGENT_PROFILE") return "/admin/my/profile";
  return null;
}

export default async function PortalSubmissionsPage() {
  const { items } = await portalService.mySubmissions();

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Agent portal</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">
          My submissions
        </h1>
        <p className="mt-2 text-muted-foreground">
          Everything you have sent for approval, newest first.
        </p>
      </div>

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">History</CardTitle>
          <CardDescription>
            A reviewer&apos;s note appears here when they ask for changes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Nothing submitted yet"
              description="Send a profile change, listing or post for approval and it will be tracked here."
              className="py-12"
            />
          ) : (
            items.map((item) => {
              const href = targetHref(item.entityType, item.entityId);
              return (
                <div
                  key={item.id}
                  className="space-y-2 rounded-lg border px-4 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {href ? (
                          <Link href={href} className="hover:underline">
                            {item.title}
                          </Link>
                        ) : (
                          item.title
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ENTITY_LABELS[item.entityType]} •{" "}
                        {item.kind === "UPDATE" ? "Edit" : "New"} • submitted{" "}
                        {item.submittedAt.toLocaleString()}
                        {item.reviewedAt
                          ? ` • reviewed ${item.reviewedAt.toLocaleString()}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <SubmissionBadge status={item.status} />
                      {item.status === "PENDING" ? (
                        <WithdrawButton submissionId={item.id} />
                      ) : null}
                    </div>
                  </div>
                  {item.note ? (
                    <p className="text-sm text-muted-foreground">
                      Your note: {item.note}
                    </p>
                  ) : null}
                  {item.reviewNote ? (
                    <p className="rounded-md bg-muted px-3 py-2 text-sm">
                      <span className="font-medium">Reviewer:</span>{" "}
                      {item.reviewNote}
                    </p>
                  ) : null}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
