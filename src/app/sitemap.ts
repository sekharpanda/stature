import type { MetadataRoute } from "next";

import { prisma } from "@/lib/db";
import { siteUrl } from "@/lib/seo";
import { organizationRepository } from "@/repositories/organization.repository";

export const revalidate = 3600;

const STATIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/properties", changeFrequency: "daily", priority: 0.9 },
  { path: "/areas", changeFrequency: "weekly", priority: 0.7 },
  { path: "/developers", changeFrequency: "weekly", priority: 0.7 },
  { path: "/our-team", changeFrequency: "monthly", priority: 0.6 },
  { path: "/market-insights", changeFrequency: "weekly", priority: 0.7 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.7 },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  try {
    const org = await organizationRepository.getDefault();
    if (!org) return entries;

    const [properties, posts, agents, customPages, landingPages] =
      await Promise.all([
      prisma.property.findMany({
        where: {
          organizationId: org.id,
          status: "PUBLISHED",
          deletedAt: null,
        },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 5000,
      }),
      prisma.blogPost.findMany({
        where: {
          organizationId: org.id,
          workflowState: "PUBLISHED",
          deletedAt: null,
        },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 1000,
      }),
      prisma.agent.findMany({
        where: { organizationId: org.id, isActive: true, deletedAt: null },
        select: { slug: true, updatedAt: true },
      }),
      prisma.page.findMany({
        where: {
          organizationId: org.id,
          kind: "STATIC",
          workflowState: "PUBLISHED",
          deletedAt: null,
        },
        select: { slug: true, updatedAt: true },
      }),
      prisma.landingPage.findMany({
        where: {
          organizationId: org.id,
          workflowState: "PUBLISHED",
          deletedAt: null,
        },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    for (const property of properties) {
      entries.push({
        url: `${siteUrl}/properties/${property.slug}`,
        lastModified: property.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    for (const agent of agents) {
      entries.push({
        url: `${siteUrl}/our-team/${agent.slug}`,
        lastModified: agent.updatedAt,
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }

    for (const post of posts) {
      entries.push({
        url: `${siteUrl}/blog/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }

    for (const page of customPages) {
      entries.push({
        url: `${siteUrl}/${page.slug}`,
        lastModified: page.updatedAt,
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }

    entries.push({
      url: `${siteUrl}/dubai-projects`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });

    for (const page of landingPages) {
      entries.push({
        url: `${siteUrl}/dubai-projects/${page.slug}`,
        lastModified: page.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch {
    // A database outage should still produce a valid static sitemap.
  }

  return entries;
}
