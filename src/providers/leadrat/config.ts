import { AppError } from "@/lib/errors";

export type LeadRatConfig = {
  baseUrl: string;
  apiKey: string;
  secretKey: string;
  tenant: string;
  enabled: boolean;
  /** Absolute base for relative image/document paths from LeadRat */
  mediaBaseUrl: string;
};

export function getLeadRatConfig(
  overrides?: Partial<LeadRatConfig>,
): LeadRatConfig {
  const baseUrl = (
    overrides?.baseUrl ??
    process.env.LEADRAT_API_BASE_URL ??
    "https://connect.leadrat.com/api/v1"
  ).replace(/\/$/, "");

  const apiKey = overrides?.apiKey ?? process.env.LEADRAT_API_KEY ?? "";
  const secretKey =
    overrides?.secretKey ?? process.env.LEADRAT_SECRET_KEY ?? "";
  const tenant = overrides?.tenant ?? process.env.LEADRAT_TENANT ?? "";
  const enabled =
    overrides?.enabled ?? process.env.LEADRAT_ENABLED === "true";
  const mediaBaseUrl = (
    overrides?.mediaBaseUrl ??
    process.env.LEADRAT_MEDIA_BASE_URL ??
    `https://lrstorage.blob.core.windows.net/${tenant || "prowinproperties"}`
  ).replace(/\/$/, "");

  return { baseUrl, apiKey, secretKey, tenant, enabled, mediaBaseUrl };
}

export function assertLeadRatConfigured(config: LeadRatConfig) {
  if (!config.enabled) {
    throw new AppError("LeadRat is disabled (set LEADRAT_ENABLED=true)", {
      code: "LEADRAT_DISABLED",
      status: 503,
    });
  }
  if (!config.apiKey || !config.secretKey || !config.tenant) {
    throw new AppError(
      "LeadRat credentials incomplete. Set LEADRAT_API_KEY, LEADRAT_SECRET_KEY, and LEADRAT_TENANT.",
      { code: "LEADRAT_CONFIG", status: 503 },
    );
  }
}

export function isLeadRatReady(config = getLeadRatConfig()): boolean {
  return Boolean(
    config.enabled && config.apiKey && config.secretKey && config.tenant,
  );
}
