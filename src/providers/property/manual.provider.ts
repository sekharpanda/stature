import type {
  CanonicalProperty,
  PropertyProvider,
  PropertyProviderContext,
  PropertySyncResult,
} from "./types";

/**
 * Manual Property Provider
 * Admin-created properties live in our DB; this adapter normalizes them
 * into the same CanonicalProperty contract as LeadRat imports.
 */
export class ManualPropertyProvider implements PropertyProvider {
  readonly name = "manual";

  async fetchAll(ctx: PropertyProviderContext): Promise<CanonicalProperty[]> {
    void ctx;
    // Implemented in Phase 2 via repository — interface locked in Phase 0
    return [];
  }

  async sync(ctx: PropertyProviderContext): Promise<PropertySyncResult> {
    void ctx;
    return { imported: 0, updated: 0, deleted: 0, skipped: 0, errors: [] };
  }
}
