import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { brand } from "@/config/brand";
import { PublicBlogDetailView } from "@/features/marketing/public-blog-detail-view";
import { PublicSiteShell } from "@/features/marketing/public-site-shell";
import { buildPageMetadata } from "@/lib/seo";
import { organizationRepository } from "@/repositories/organization.repository";
import { blogService } from "@/services/blog.service";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const org = await organizationRepository.getDefault();
  if (!org) return { title: brand.name };
  const post = await blogService.getPublishedBySlug(org.id, slug);
  if (!post) return { title: "Article" };

  const metadata = buildPageMetadata({
    title: post.metaTitle || post.title,
    description:
      post.metaDescription ||
      post.excerpt ||
      `Dubai property insights from ${brand.name}.`,
    path: `/blog/${post.slug}`,
    image: post.coverUrl ?? undefined,
    type: "article",
    publishedTime: post.publishedAt?.toISOString(),
  });

  if (post.canonicalUrl) {
    metadata.alternates = { canonical: post.canonicalUrl };
  }
  return metadata;
}

export default async function BlogDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const org = await organizationRepository.getDefault();
  if (!org) notFound();
  const post = await blogService.getPublishedBySlug(org.id, slug);
  if (!post) notFound();

  return (
    <PublicSiteShell>
      <main>
        <PublicBlogDetailView post={post} />
      </main>
    </PublicSiteShell>
  );
}
