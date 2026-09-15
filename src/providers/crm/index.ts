import { LeadRatCrmProvider } from "./leadrat.provider";
import type { CrmProvider } from "./types";

export type { CrmLeadPayload, CrmProvider, CrmPushResult, CrmSyncResultStatus } from "./types";

const registry: Record<string, CrmProvider> = {
  leadrat: new LeadRatCrmProvider(),
};

export function getCrmProvider(name = "leadrat"): CrmProvider {
  const provider = registry[name];
  if (!provider) {
    throw new Error(`Unknown CRM provider: ${name}`);
  }
  return provider;
}

export function registerCrmProvider(provider: CrmProvider): void {
  registry[provider.name] = provider;
}
