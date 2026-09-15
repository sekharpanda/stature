import Link from "next/link";

import { BlogPostEditor } from "@/features/admin/components/create-blog-post-form";
import { Button } from "@/components/ui/button";
import { organizationRepository } from "@/repositories/organization.repository";

export const metadata = {
  title: "Create Blog Post",
  robots: { index: false, follow: false },
};

export default async function AdminBlogNewPage() {
  const org = await organizationRepository.getDefault();
  if (!org) return <p className="text-muted-foreground">Organization not seeded.</p>;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">CMS · Blog</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">
            Create article
          </h1>
          <p className="mt-2 text-muted-foreground">
            Craft the story, add a cover, then draft or publish.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/blog">All posts</Link>
        </Button>
      </div>

      <BlogPostEditor organizationId={org.id} mode="create" />
    </div>
  );
}
