import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/features/admin/components/shared/empty-state";
import { prisma } from "@/lib/db";
import { organizationRepository } from "@/repositories/organization.repository";

export const metadata = {
  title: "Blog",
  robots: { index: false, follow: false },
};

function parseCoverUrl(content: string | null | undefined) {
  if (!content) return null;
  const match = content.match(/^<!--cover:(.*?)-->/);
  return match?.[1]?.trim() || null;
}

export default async function AdminBlogPage() {
  const org = await organizationRepository.getDefault();
  if (!org) return <p className="text-muted-foreground">Organization not seeded.</p>;

  const posts = await prisma.blogPost.findMany({
    where: { organizationId: org.id, deletedAt: null },
    orderBy: { updatedAt: "desc" },
  });

  const publishedCount = posts.filter((p) => p.workflowState === "PUBLISHED").length;
  const draftCount = posts.length - publishedCount;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">CMS</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">Blog</h1>
          <p className="mt-2 text-muted-foreground">
            Write, publish, and manage Dubai market insights.
            {posts.length > 0
              ? ` · ${publishedCount} published · ${draftCount} draft${draftCount === 1 ? "" : "s"}`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/blog" target="_blank">
              View public blog
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/blog/new">
              <Plus className="mr-1.5 size-4" />
              New post
            </Link>
          </Button>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/20 px-6 py-16">
          <EmptyState
            icon={FileText}
            title="No blog posts yet"
            description="Create your first article with a cover, excerpt, and SEO."
            className="py-4"
            actionLabel="New post"
            actionHref="/admin/blog/new"
          />
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => {
            const cover = parseCoverUrl(post.content);
            const published = post.workflowState === "PUBLISHED";
            return (
              <Link
                key={post.id}
                href={`/admin/blog/${post.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-muted to-muted/40">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt=""
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-end p-5">
                      <FileText className="size-10 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="absolute left-3 top-3">
                    <Badge
                      className={
                        published
                          ? "bg-emerald-600 hover:bg-emerald-600"
                          : "bg-amber-100 text-amber-950 hover:bg-amber-100"
                      }
                    >
                      {published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <h2 className="line-clamp-2 font-display text-xl leading-snug group-hover:text-primary">
                    {post.title}
                  </h2>
                  {post.excerpt ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {post.excerpt}
                    </p>
                  ) : null}
                  <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-xs text-muted-foreground">
                    <span className="truncate">/{post.slug}</span>
                    <span className="shrink-0">
                      {post.publishedAt
                        ? format(post.publishedAt, "dd MMM yyyy")
                        : format(post.updatedAt, "dd MMM yyyy")}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
