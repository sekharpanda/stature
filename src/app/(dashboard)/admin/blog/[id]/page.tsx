import Link from "next/link";
import { notFound } from "next/navigation";

import { BlogPostEditor } from "@/features/admin/components/create-blog-post-form";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { organizationRepository } from "@/repositories/organization.repository";

export const metadata = {
  title: "Edit Blog Post",
  robots: { index: false, follow: false },
};

export default async function AdminBlogEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const org = await organizationRepository.getDefault();
  if (!org) return <p className="text-muted-foreground">Organization not seeded.</p>;

  const post = await prisma.blogPost.findFirst({
    where: { id, organizationId: org.id, deletedAt: null },
  });
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">CMS · Blog</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">
            Edit article
          </h1>
          <p className="mt-2 text-muted-foreground">
            {post.workflowState === "PUBLISHED" ? "Published" : "Draft"}
            {post.slug ? ` · /blog/${post.slug}` : ""}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/blog">All posts</Link>
        </Button>
      </div>

      <BlogPostEditor
        organizationId={org.id}
        mode="edit"
        initial={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          metaTitle: post.metaTitle,
          metaDescription: post.metaDescription,
          canonicalUrl: post.canonicalUrl,
          workflowState: post.workflowState,
        }}
      />
    </div>
  );
}
