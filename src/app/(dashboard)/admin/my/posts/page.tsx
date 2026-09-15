import Link from "next/link";
import { FileText } from "lucide-react";

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
import { WorkflowBadge } from "@/features/portal/components/workflow-badge";
import { portalService } from "@/services/portal.service";

export const metadata = {
  title: "My Posts",
  robots: { index: false, follow: false },
};

export default async function PortalPostsPage() {
  const { posts, pending } = await portalService.listPosts();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Agent portal</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">My posts</h1>
          <p className="mt-2 text-muted-foreground">
            Write market insight for the blog. A superadmin approves each article
            before it is published.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/my/posts/new">Write post</Link>
        </Button>
      </div>

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">
            {posts.length} post{posts.length === 1 ? "" : "s"}
          </CardTitle>
          <CardDescription>Only posts you wrote appear here.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {posts.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No posts yet"
              description="Share what you know about your areas — it builds trust with buyers."
              className="py-12"
              actionLabel="Write post"
              actionHref="/admin/my/posts/new"
            />
          ) : (
            posts.map((post) => (
              <Link
                key={post.id}
                href={`/admin/my/posts/${post.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 transition-colors hover:border-primary/30"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {post.title}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {post.excerpt ||
                      `Updated ${post.updatedAt.toLocaleDateString()}`}
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  {pending.has(post.id) ? (
                    <Badge
                      variant="outline"
                      className="border-amber-300 text-amber-800 dark:text-amber-200"
                    >
                      Edit pending
                    </Badge>
                  ) : null}
                  <WorkflowBadge state={post.workflowState} />
                </span>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
