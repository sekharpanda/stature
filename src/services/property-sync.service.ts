import { after } from "next/server";

import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { getOffPlanConfig, isOffPlanReady } from "@/providers/leadrat";
import { getPropertyProvider } from "@/providers/property";
import { organizationRepository } from "@/repositories/organization.repository";
import { propertyRepository } from "@/repositories/property.repository";

export type SyncRunResult = {
  imported: number;
  updated: number;
  skipped: number;
  deleted: number;
  errors: Array<{ externalId?: string; message: string }>;
  durationMs: number;
  jobId?: string;
  mode?: "auto" | "manual" | "cron";
};

export type SyncRunOptions = {
  organizationId: string;
  maxPages?: number;
  /** When false, upsert from list payload only (faster for auto sync). */
  enrichDetails?: boolean;
  markMissing?: boolean;
  mode?: "auto" | "manual" | "cron";
};

function offPlanCredentials() {
  const config = getOffPlanConfig();
  return {
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
  };
}

function autoSyncIntervalMs() {
  const minutes = Number(process.env.LEADRAT_AUTO_SYNC_MINUTES ?? "30");
  const safe = Number.isFinite(minutes) && minutes > 0 ? minutes : 30;
  return safe * 60_000;
}

function autoSyncEnabled() {
  if (process.env.LEADRAT_AUTO_SYNC === "false") return false;
  return true;
}

/**
 * Core inventory sync — Off Plan public listings only
 * (projectsapi.leadrat.com). Enterprise Project API is not used.
 */
export async function runInventorySync(
  options: SyncRunOptions,
): Promise<SyncRunResult> {
  if (!isOffPlanReady()) {
    throw new AppError(
      "LeadRat Off Plan is not ready. Set LEADRAT_OFFPLAN_ENABLED=true and LEADRAT_OFFPLAN_API_KEY.",
      { code: "OFFPLAN_CONFIG", status: 503 },
    );
  }

  const running = await prisma.syncJob.findFirst({
    where: {
      organizationId: options.organizationId,
      provider: "leadrat",
      status: "RUNNING",
      deletedAt: null,
      startedAt: { gte: new Date(Date.now() - 2 * 60 * 60_000) },
    },
    select: { id: true },
  });
  if (running) {
    return {
      imported: 0,
      updated: 0,
      skipped: 0,
      deleted: 0,
      errors: [{ message: "Sync already running" }],
      durationMs: 0,
      jobId: running.id,
      mode: options.mode,
    };
  }

  const enrichDetails = options.enrichDetails ?? true;
  const markMissing = options.markMissing ?? enrichDetails;
  const maxPages = options.maxPages ?? 20;
  const started = Date.now();

  const job = await prisma.syncJob.create({
    data: {
      organizationId: options.organizationId,
      type: "FULL_SYNC",
      provider: "leadrat",
      status: "RUNNING",
      startedAt: new Date(),
      payload: {
        maxPages,
        enrichDetails,
        markMissing,
        mode: options.mode ?? "manual",
        source: "offplan-public",
      },
    },
  });

  const result: SyncRunResult = {
    imported: 0,
    updated: 0,
    skipped: 0,
    deleted: 0,
    errors: [],
    durationMs: 0,
    jobId: job.id,
    mode: options.mode,
  };

  const provider = getPropertyProvider("leadrat");
  const seen = new Set<string>();
  const credentials = offPlanCredentials();

  try {
    let offset = 0;
    const limit = 50;
    let page = 0;

    while (page < maxPages) {
      const list = await provider.listProjects?.(
        { organizationId: options.organizationId, credentials },
        { limit, offset },
      );

      if (!list || list.items.length === 0) break;

      for (const item of list.items) {
        const externalId = item.leadratProjectId ?? undefined;
        if (externalId) seen.add(externalId);

        try {
          const detailed =
            enrichDetails && externalId && provider.fetchByExternalId
              ? ((await provider.fetchByExternalId(
                  {
                    organizationId: options.organizationId,
                    credentials,
                  },
                  externalId,
                )) ?? item)
              : item;

          // Preserve list-card fields that detail payloads sometimes omit
          const merged = {
            ...item,
            ...detailed,
            completionLabel:
              detailed.completionLabel ?? item.completionLabel ?? null,
            saleStatus: detailed.saleStatus ?? item.saleStatus ?? null,
            constructionStatus:
              detailed.constructionStatus ?? item.constructionStatus ?? null,
            minPrice: detailed.minPrice ?? item.minPrice,
            maxPrice: detailed.maxPrice ?? item.maxPrice,
            depositDescription:
              detailed.depositDescription ?? item.depositDescription ?? null,
            images:
              detailed.images && detailed.images.length > 0
                ? detailed.images
                : item.images,
            developer: detailed.developer ?? item.developer,
            paymentPlans:
              detailed.paymentPlans && detailed.paymentPlans.length > 0
                ? detailed.paymentPlans
                : item.paymentPlans,
          };

          const upsert = await propertyRepository.upsertFromCanonical(
            options.organizationId,
            merged,
          );

          if (upsert.action === "imported") result.imported += 1;
          else if (upsert.action === "updated") result.updated += 1;
          else result.skipped += 1;

          await propertyRepository.addSyncLog({
            propertyId: upsert.property.id,
            status: "SYNCED",
            response: {
              action: upsert.action,
              hash: upsert.contentHash,
              mode: options.mode,
              source: "offplan-public",
            },
            durationMs: Date.now() - started,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown sync error";
          result.errors.push({ externalId, message });
        }
      }

      if (!list.hasMore) break;
      offset = list.nextOffset ?? offset + list.items.length;
      page += 1;
    }

    if (markMissing) {
      const existing = await propertyRepository.listLeadRatExternalIds(
        options.organizationId,
      );
      for (const row of existing) {
        if (!seen.has(row.leadratProjectId)) {
          await propertyRepository.markProviderDeleted(row.id);
          result.deleted += 1;
        }
      }
    }

    result.durationMs = Date.now() - started;

    await prisma.syncJob.update({
      where: { id: job.id },
      data: {
        status: result.errors.length ? "PARTIAL" : "SUCCESS",
        finishedAt: new Date(),
        result,
      },
    });

    await prisma.activityLog.create({
      data: {
        organizationId: options.organizationId,
        action: "property.leadrat_sync",
        entityType: "SyncJob",
        entityId: job.id,
        metadata: result,
      },
    });

    return result;
  } catch (error) {
    result.durationMs = Date.now() - started;
    const message =
      error instanceof Error ? error.message : "LeadRat Off Plan sync failed";

    await prisma.syncJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        error: message,
        result,
      },
    });

    await prisma.notification.create({
      data: {
        organizationId: options.organizationId,
        type: "PROPERTY_SYNC_FAILED",
        title: "LeadRat Off Plan sync failed",
        body: message,
        href: "/admin/properties/import",
      },
    });

    throw error;
  }
}

export const propertySyncService = {
  getStatus() {
    const config = getOffPlanConfig();
    return {
      enabled: config.enabled,
      configured: isOffPlanReady(config),
      autoSync: autoSyncEnabled() && isOffPlanReady(config),
      autoSyncMinutes: Number(process.env.LEADRAT_AUTO_SYNC_MINUTES ?? "30"),
      baseUrl: config.baseUrl,
      hasApiKey: Boolean(config.apiKey),
      hasSecretKey: false,
      hasTenant: false,
      source: "offplan-public" as const,
    };
  },

  async syncAll(options?: {
    organizationId?: string;
    maxPages?: number;
    markMissing?: boolean;
    enrichDetails?: boolean;
  }): Promise<SyncRunResult> {
    await requirePermission("property:sync");

    let organizationId = options?.organizationId;
    if (!organizationId) {
      const org = await organizationRepository.getDefault();
      if (!org) {
        throw new AppError("Organization not configured", {
          code: "ORG_MISSING",
          status: 500,
        });
      }
      organizationId = org.id;
    }

    return runInventorySync({
      organizationId,
      maxPages: options?.maxPages,
      markMissing: options?.markMissing ?? true,
      enrichDetails: options?.enrichDetails ?? true,
      mode: "manual",
    });
  },

  /**
   * Background auto-pull when inventory is stale.
   * Enriches details so covers + galleries stay current.
   */
  async syncIfStale(organizationId: string): Promise<SyncRunResult | null> {
    if (!autoSyncEnabled() || !isOffPlanReady()) return null;

    const lastJob = await prisma.syncJob.findFirst({
      where: {
        organizationId,
        provider: "leadrat",
        deletedAt: null,
        status: { in: ["SUCCESS", "PARTIAL", "RUNNING"] },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, status: true, createdAt: true, finishedAt: true },
    });

    if (lastJob?.status === "RUNNING") return null;

    const lastAt = lastJob?.finishedAt ?? lastJob?.createdAt;
    if (lastAt && Date.now() - lastAt.getTime() < autoSyncIntervalMs()) {
      return null;
    }

    return runInventorySync({
      organizationId,
      enrichDetails: false,
      markMissing: true,
      mode: "auto",
    });
  },

  /** Schedule auto sync after the current response (non-blocking). */
  scheduleAutoSync(organizationId: string) {
    if (!autoSyncEnabled() || !isOffPlanReady()) return;
    after(async () => {
      try {
        await propertySyncService.syncIfStale(organizationId);
      } catch (error) {
        console.error("[offplan-auto-sync]", error);
      }
    });
  },

  async syncOne(leadratProjectId: string, organizationId?: string) {
    await requirePermission("property:sync");
    if (!isOffPlanReady()) {
      throw new AppError("LeadRat Off Plan is not ready", {
        code: "OFFPLAN_CONFIG",
        status: 503,
      });
    }

    let orgId = organizationId;
    if (!orgId) {
      const org = await organizationRepository.getDefault();
      if (!org)
        throw new AppError("Organization not configured", { status: 500 });
      orgId = org.id;
    }

    const provider = getPropertyProvider("leadrat");
    const detailed = await provider.fetchByExternalId?.(
      { organizationId: orgId, credentials: offPlanCredentials() },
      leadratProjectId,
    );
    if (!detailed) {
      throw new AppError("Off Plan listing not found", {
        code: "NOT_FOUND",
        status: 404,
      });
    }

    return propertyRepository.upsertFromCanonical(orgId, detailed);
  },

  async getOverview(organizationId?: string) {
    await requirePermission("property:read");
    let orgId = organizationId;
    if (!orgId) {
      const org = await organizationRepository.getDefault();
      if (!org)
        throw new AppError("Organization not configured", { status: 500 });
      orgId = org.id;
    }

    const [overview, lastJob] = await Promise.all([
      propertyRepository.getSyncOverview(orgId),
      prisma.syncJob.findFirst({
        where: { organizationId: orgId, provider: "leadrat", deletedAt: null },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      connection: this.getStatus(),
      overview,
      lastJob,
    };
  },

  async getLastSyncSummary(organizationId: string) {
    return prisma.syncJob.findFirst({
      where: {
        organizationId,
        provider: "leadrat",
        deletedAt: null,
        status: { in: ["SUCCESS", "PARTIAL", "FAILED", "RUNNING"] },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        createdAt: true,
        finishedAt: true,
        result: true,
        error: true,
      },
    });
  },
};
