import { AppError } from "@/lib/errors";

export type OffPlanConfig = {
  baseUrl: string;
  apiKey: string;
  enabled: boolean;
};

export function getOffPlanConfig(
  overrides?: Partial<OffPlanConfig>,
): OffPlanConfig {
  const baseUrl = (
    overrides?.baseUrl ??
    process.env.LEADRAT_OFFPLAN_API_BASE_URL ??
    "https://projectsapi.leadrat.com/api/public"
  ).replace(/\/$/, "");

  const apiKey =
    overrides?.apiKey ??
    process.env.LEADRAT_OFFPLAN_API_KEY ??
    process.env.LEADRAT_PUBLIC_API_KEY ??
    "";

  const enabled =
    overrides?.enabled ??
    (process.env.LEADRAT_OFFPLAN_ENABLED === "true" ||
      process.env.LEADRAT_ENABLED === "true");

  return { baseUrl, apiKey, enabled };
}

export function assertOffPlanConfigured(config: OffPlanConfig) {
  if (!config.enabled) {
    throw new AppError(
      "LeadRat Off Plan is disabled (set LEADRAT_OFFPLAN_ENABLED=true)",
      { code: "OFFPLAN_DISABLED", status: 503 },
    );
  }
  if (!config.apiKey) {
    throw new AppError(
      "LeadRat Off Plan API key missing. Set LEADRAT_OFFPLAN_API_KEY.",
      { code: "OFFPLAN_CONFIG", status: 503 },
    );
  }
}

export function isOffPlanReady(config = getOffPlanConfig()): boolean {
  return Boolean(config.enabled && config.apiKey);
}
