export function isOffPlanCompletion(value?: string | null) {
  if (!value) return false;
  const normalized = value.trim().toLowerCase().replace(/_/g, "-");
  return normalized === "off-plan";
}

export function isReadyCompletion(value?: string | null) {
  return value?.trim().toLowerCase() === "ready";
}

export function normalizeCompletionParam(value?: string | null) {
  if (isOffPlanCompletion(value)) return "off-plan" as const;
  if (isReadyCompletion(value)) return "ready" as const;
  return undefined;
}
