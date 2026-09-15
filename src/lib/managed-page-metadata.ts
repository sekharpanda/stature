import type { Metadata } from "next";

import {
  STATIC_PAGE_META,
  type StaticPageKey,
} from "@/config/page-content-defaults";
import { buildPageMetadata } from "@/lib/seo";
import { pageContentService } from "@/services/page-content.service";

export async function buildManagedPageMetadata(
  key: StaticPageKey,
  fallback: { title: string; description: string },
): Promise<Metadata> {
  const content = await pageContentService.get(key);
  return buildPageMetadata({
    title: content.metaTitle?.trim() || fallback.title,
    description: content.metaDescription?.trim() || fallback.description,
    path: STATIC_PAGE_META[key].href,
  });
}
