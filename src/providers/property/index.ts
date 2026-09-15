import { ManualPropertyProvider } from "./manual.provider";
import { LeadRatPropertyProvider } from "./leadrat.provider";
import type { PropertyProvider } from "./types";

export type {
  CanonicalProperty,
  PublicPropertyDto,
  PropertyProvider,
  PropertySearchParams,
  PropertySyncResult,
} from "./types";

const registry: Record<string, PropertyProvider> = {
  manual: new ManualPropertyProvider(),
  leadrat: new LeadRatPropertyProvider(),
};

export function getPropertyProvider(name: string): PropertyProvider {
  const provider = registry[name];
  if (!provider) {
    throw new Error(`Unknown property provider: ${name}`);
  }
  return provider;
}

export function listPropertyProviders(): string[] {
  return Object.keys(registry);
}

export function registerPropertyProvider(provider: PropertyProvider): void {
  registry[provider.name] = provider;
}
