import { cache } from "react";

import {
  DEFAULT_PAGE_CONTENT,
  normalizePageContent,
  type StaticPageContent,
  type StaticPageKey,
} from "@/config/page-content-defaults";
import { prisma } from "@/lib/db";
import { organizationRepository } from "@/repositories/organization.repository";

async function loadPageContent(
  key: StaticPageKey,
  organizationId?: string,
): Promise<StaticPageContent> {
  const defaults = DEFAULT_PAGE_CONTENT[key];
  const orgId =
    organizationId ?? (await organizationRepository.getDefault())?.id;
  if (!orgId) return normalizePageContent(defaults, defaults);

  const row = await prisma.websiteSetting.findFirst({
    where: {
      organizationId: orgId,
      key: `page.${key}`,
      deletedAt: null,
    },
    select: { value: true },
  });
  const raw = row?.value;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return normalizePageContent(defaults, defaults);
  }
  return normalizePageContent(
    raw as Partial<StaticPageContent>,
    defaults,
  );
}

export const pageContentService = {
  get: cache(loadPageContent),

  async getMany(keys: StaticPageKey[], organizationId?: string) {
    const entries = await Promise.all(
      keys.map(
        async (key) => [key, await this.get(key, organizationId)] as const,
      ),
    );
    return Object.fromEntries(entries) as Record<
      StaticPageKey,
      StaticPageContent
    >;
  },

  async save(
    organizationId: string,
    key: StaticPageKey,
    content: StaticPageContent,
  ) {
    const normalized = normalizePageContent(
      content,
      DEFAULT_PAGE_CONTENT[key],
    );
    // Persist blocks only (drop legacy sections)
    const value = {
      eyebrow: normalized.eyebrow,
      title: normalized.title,
      lede: normalized.lede,
      metaTitle: normalized.metaTitle ?? "",
      metaDescription: normalized.metaDescription ?? "",
      blocks: normalized.blocks,
    };
    await prisma.websiteSetting.upsert({
      where: {
        organizationId_key: {
          organizationId,
          key: `page.${key}`,
        },
      },
      create: {
        organizationId,
        key: `page.${key}`,
        value,
      },
      update: {
        value,
        deletedAt: null,
      },
    });
  },
};
