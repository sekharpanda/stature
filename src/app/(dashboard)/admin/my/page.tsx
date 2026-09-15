import Link from "next/link";
import { Building2, CheckCircle2, ClipboardList, FileText } from "lucide-react";

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
import {
  SubmissionBadge,
  WorkflowBadge,
} from "@/features/portal/components/workflow-badge";
import { ENTITY_LABELS } from "@/services/submission.service";
import { portalService } from "@/services/portal.service";

export const metadata = {
  title: "My Portal",
  robots: { index: false, follow: false },
};

export default async function PortalHomePage() {
  const { context, listings, posts, submissions, stats } =
    await portalService.overview();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Agent portal</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">
            Welcome, {context.agent.name.split(" ")[0]}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Update your profile, add listings and write articles. A superadmin
            approves everything before it goes live.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/our-team/${context.agent.slug}`} target="_blank">
              View my public page
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/my/listings/new">Add listing</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="My listings"
          value={stats.listingsTotal}
          icon={Building2}
          tone="primary"
          href="/admin/my/listings"
        />
        <KpiCard
          label="Live listings"
          value={stats.listingsLive}
          hint="Visible on the website"
          icon={CheckCircle2}
          tone="success"
        />
        <KpiCard
          label="My posts"
          value={stats.postsTotal}
          icon={FileText}
          href="/admin/my/posts"
        />
        <KpiCard
          label="Awaiting approval"
          value={stats.pending}
          icon={ClipboardList}
          tone={stats.pending > 0 ? "warning" : "default"}
          href="/admin/my/submissions"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="card-elevated border-border/80">
          <CardHeader>
            <CardTitle className="font-display text-xl">
              Recent listings
            </CardTitle>
            <CardDescription>Your five most recently updated.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {listings.items.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No listings yet"
                description="Add your first property and send it for approval."
                className="py-10"
                actionLabel="Add listing"
                actionHref="/admin/my/listings/new"
              />
            ) : (
              listings.items.map((item) => (
                <Link
                  key={item.id}
                  href={`/admin/my/listings/${item.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:border-primary/30"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {item.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {[item.city?.name, item.area?.name]
                        .filter(Boolean)
                        .join(" • ") || "Location not set"}
                    </span>
                  </span>
                  <WorkflowBadge
                    state={item.workflowState}
                    fallbackLabel={item.status === "PUBLISHED" ? "Live" : "Draft"}
                  />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="card-elevated border-border/80">
          <CardHeader>
            <CardTitle className="font-display text-xl">
              Latest activity
            </CardTitle>
            <CardDescription>
              What you have sent for approval recently.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {submissions.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="Nothing submitted yet"
                description="Your approval history will show up here."
                className="py-10"
              />
            ) : (
              submissions.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {item.title}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {ENTITY_LABELS[item.entityType]} •{" "}
                      {item.submittedAt.toLocaleDateString()}
                    </span>
                  </span>
                  <SubmissionBadge status={item.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">My posts</CardTitle>
          <CardDescription>Articles you have written.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {posts.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No posts yet"
              description="Share market insight with buyers and sellers."
              className="py-10"
              actionLabel="Write a post"
              actionHref="/admin/my/posts/new"
            />
          ) : (
            posts.map((post) => (
              <Link
                key={post.id}
                href={`/admin/my/posts/${post.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:border-primary/30"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {post.title}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Updated {post.updatedAt.toLocaleDateString()}
                  </span>
                </span>
                <WorkflowBadge state={post.workflowState} />
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
