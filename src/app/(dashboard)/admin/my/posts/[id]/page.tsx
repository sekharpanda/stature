import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PostForm } from "@/features/portal/components/post-form";
import { WithdrawButton } from "@/features/portal/components/withdraw-button";
import { WorkflowBadge } from "@/features/portal/components/workflow-badge";
import { NotFoundError } from "@/lib/errors";
import { portalService } from "@/services/portal.service";
import type { FieldChange } from "@/services/submission.service";

export const metadata = {
  title: "Edit Post",
  robots: { index: false, follow: false },
};

type Params = Promise<{ id: string }>;

export default async function PortalPostPage({ params }: { params: Params }) {
  const { id } = await params;

  let data: Awaited<ReturnType<typeof portalService.getPost>>;
  try {
    data = await portalService.getPost(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const { post, live, pending, pendingChanges, values } = data;
  const changes = pendingChanges as FieldChange[];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Agent portal</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl md:text-4xl">{post.title}</h1>
            <WorkflowBadge state={post.workflowState} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {live ? (
            <Button asChild variant="outline">
              <Link href={`/blog/${post.slug}`} target="_blank">
                View published post
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link href="/admin/my/posts">Back to my posts</Link>
          </Button>
        </div>
      </div>

      {post.workflowState === "REJECTED" ? (
        <Card className="border-red-300 bg-red-50/60 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="font-display text-lg">
              Changes were requested
            </CardTitle>
            <CardDescription>
              Check your notifications for the reviewer&apos;s note, then update
              and resubmit.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {pending ? (
        <Card className="border-amber-300 bg-amber-50/60 dark:bg-amber-950/20">
          <CardHeader className="gap-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 font-display text-lg">
                  <Clock className="size-4" />
                  {pending.kind === "CREATE"
                    ? "Waiting for approval to publish"
                    : `${changes.length} change${changes.length === 1 ? "" : "s"} waiting for approval`}
                </CardTitle>
                <CardDescription>
                  Submitted {pending.submittedAt.toLocaleString()}.
                </CardDescription>
              </div>
              <WithdrawButton submissionId={pending.id} />
            </div>
          </CardHeader>
          {changes.length > 0 ? (
            <CardContent>
              <ul className="space-y-1.5 text-sm">
                {changes.map((change) => (
                  <li key={change.field} className="flex flex-wrap gap-x-2">
                    <span className="font-medium">{change.label}:</span>
                    <span className="text-muted-foreground line-through">
                      {change.from ?? "empty"}
                    </span>
                    <span aria-hidden>→</span>
                    <span>{change.to ?? "empty"}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          ) : null}
        </Card>
      ) : null}

      <PostForm
        live={live}
        values={{
          postId: post.id,
          title: String(values.title ?? ""),
          excerpt: (values.excerpt as string | null) ?? null,
          content: (values.content as string | null) ?? null,
          coverUrl: (values.coverUrl as string | null) ?? null,
          metaTitle: (values.metaTitle as string | null) ?? null,
          metaDescription: (values.metaDescription as string | null) ?? null,
        }}
      />
    </div>
  );
}
