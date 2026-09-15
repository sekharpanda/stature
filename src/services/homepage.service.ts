import { cache } from "react";

import {
  DEFAULT_HOMEPAGE_CONTENT,
  DEFAULT_HOMEPAGE_VISIBILITY,
  type HomepageContent,
} from "@/config/homepage-defaults";
import { prisma } from "@/lib/db";
import { organizationRepository } from "@/repositories/organization.repository";

const SETTING_KEY = "homepage.content";

function deepMergeHomepage(
  base: HomepageContent,
  patch: Partial<HomepageContent> | null | undefined,
): HomepageContent {
  if (!patch || typeof patch !== "object") return base;
  return {
    ...base,
    ...patch,
    seo: {
      title: patch.seo?.title ?? base.seo?.title ?? "",
      description: patch.seo?.description ?? base.seo?.description ?? "",
    },
    visibility: {
      ...DEFAULT_HOMEPAGE_VISIBILITY,
      ...base.visibility,
      ...patch.visibility,
    },
    layout: Array.isArray(patch.layout)
      ? patch.layout
      : (base.layout ?? DEFAULT_HOMEPAGE_CONTENT.layout),
    hero: { ...base.hero, ...(patch.hero ?? {}) },
    trust: patch.trust?.length ? patch.trust : base.trust,
    paths: {
      ...base.paths,
      ...(patch.paths ?? {}),
      items: patch.paths?.items?.length ? patch.paths.items : base.paths.items,
    },
    featured: { ...base.featured, ...(patch.featured ?? {}) },
    blocks: Array.isArray(patch.blocks) ? patch.blocks : (base.blocks ?? []),
    sellSplit: { ...base.sellSplit, ...(patch.sellSplit ?? {}) },
    areas: {
      ...base.areas,
      ...(patch.areas ?? {}),
      items: patch.areas?.items?.length ? patch.areas.items : base.areas.items,
    },
    team: { ...base.team, ...(patch.team ?? {}) },
    insight: {
      ...base.insight,
      ...(patch.insight ?? {}),
      stats: patch.insight?.stats?.length
        ? patch.insight.stats
        : base.insight.stats,
    },
    seoLinks: {
      ...base.seoLinks,
      ...(patch.seoLinks ?? {}),
      columns: patch.seoLinks?.columns?.length
        ? patch.seoLinks.columns
        : base.seoLinks.columns,
    },
  };
}

async function loadHomepageContent(
  organizationId?: string,
): Promise<HomepageContent> {
  const orgId =
    organizationId ?? (await organizationRepository.getDefault())?.id;
  if (!orgId) return DEFAULT_HOMEPAGE_CONTENT;

  const row = await prisma.websiteSetting.findFirst({
    where: { organizationId: orgId, key: SETTING_KEY, deletedAt: null },
    select: { value: true },
  });
  const raw = row?.value;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return DEFAULT_HOMEPAGE_CONTENT;
  }
  return deepMergeHomepage(
    DEFAULT_HOMEPAGE_CONTENT,
    raw as Partial<HomepageContent>,
  );
}

export const homepageService = {
  getContent: cache(loadHomepageContent),

  async saveContent(organizationId: string, content: HomepageContent) {
    await prisma.websiteSetting.upsert({
      where: {
        organizationId_key: { organizationId, key: SETTING_KEY },
      },
      create: {
        organizationId,
        key: SETTING_KEY,
        value: content as object,
      },
      update: {
        value: content as object,
        deletedAt: null,
      },
    });
  },
};
