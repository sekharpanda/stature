/**
 * LeadRat Property Provider — Off Plan public listings inventory.
 * Uses projectsapi.leadrat.com (not Enterprise connect.leadrat.com projects).
 */

import {
  hashCanonicalProperty,
  mapOffPlanListingToCanonical,
  offPlanClient,
} from "@/providers/leadrat";
import type {
  CanonicalProperty,
  PropertyProvider,
  PropertyProviderContext,
  PropertySyncResult,
  ProviderListPage,
} from "./types";

function offPlanCreds(ctx: PropertyProviderContext) {
  return {
    apiKey: (ctx.credentials?.apiKey as string | undefined) ?? undefined,
    baseUrl: (ctx.credentials?.baseUrl as string | undefined) ?? undefined,
  };
}

export class LeadRatPropertyProvider implements PropertyProvider {
  readonly name = "leadrat";

  async listProjects(
    ctx: PropertyProviderContext,
    options?: { limit?: number; offset?: number; updatedSince?: string },
  ): Promise<ProviderListPage> {
    void options?.updatedSince;
    const pageSize = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const page = Math.floor(offset / pageSize) + 1;

    const response = await offPlanClient.listListings({
      page,
      pageSize,
      config: offPlanCreds(ctx),
    });

    const items = (response.results ?? []).map(mapOffPlanListingToCanonical);
    const total = Number(response.count ?? items.length);
    const nextOffset = offset + items.length;
    const hasMore =
      (response.currentPage ?? page) < (response.totalPages ?? 1) &&
      items.length > 0;

    return {
      items,
      count: total,
      nextOffset: hasMore ? nextOffset : null,
      hasMore,
    };
  }

  async fetchAll(ctx: PropertyProviderContext): Promise<CanonicalProperty[]> {
    const all: CanonicalProperty[] = [];
    let offset = 0;
    const limit = 50;
    let guard = 0;

    while (guard < 50) {
      const page = await this.listProjects(ctx, { limit, offset });
      all.push(...page.items);
      if (!page.hasMore || page.items.length === 0) break;
      offset = page.nextOffset ?? offset + page.items.length;
      guard += 1;
    }

    return all;
  }

  async fetchByExternalId(
    ctx: PropertyProviderContext,
    externalId: string,
  ): Promise<CanonicalProperty | null> {
    const response = await offPlanClient.getListing(
      externalId,
      offPlanCreds(ctx),
    );
    const project = response.project;
    if (!project?.id) return null;
    return mapOffPlanListingToCanonical(project);
  }

  async sync(ctx: PropertyProviderContext): Promise<PropertySyncResult> {
    const items = await this.fetchAll(ctx);
    return {
      imported: items.length,
      updated: 0,
      deleted: 0,
      skipped: 0,
      errors: [],
    };
  }
}

export { hashCanonicalProperty };
