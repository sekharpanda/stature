export type BlogApiProviderKind = "wordpress" | "json";

export type BlogApiConfig = {
  enabled: boolean;
  configured: boolean;
  provider: BlogApiProviderKind;
  baseUrl: string;
  apiKey: string | null;
  /** When true, synced posts are published immediately. */
  autoPublish: boolean;
};

function asBool(value: string | undefined, fallback: boolean) {
  if (value == null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

export function getBlogApiConfig(
  overrides?: Partial<{
    baseUrl: string;
    provider: string;
    apiKey: string;
    autoPublish: boolean;
  }>,
): BlogApiConfig {
  const providerRaw = (
    overrides?.provider ||
    process.env.BLOG_API_PROVIDER ||
    "wordpress"
  )
    .trim()
    .toLowerCase();
  const provider: BlogApiProviderKind =
    providerRaw === "json" ? "json" : "wordpress";

  const baseUrl = (
    overrides?.baseUrl ||
    process.env.BLOG_API_BASE_URL ||
    ""
  ).trim().replace(/\/+$/, "");

  const apiKey = (
    overrides?.apiKey ||
    process.env.BLOG_API_KEY ||
    ""
  ).trim() || null;

  const envEnabled = asBool(process.env.BLOG_API_ENABLED, Boolean(baseUrl));
  // One-off admin URL always enables the run for that request.
  const enabled = overrides?.baseUrl?.trim() ? true : envEnabled;
  const autoPublish =
    overrides?.autoPublish ?? asBool(process.env.BLOG_API_AUTO_PUBLISH, true);

  return {
    enabled,
    configured: Boolean(baseUrl),
    provider,
    baseUrl,
    apiKey,
    autoPublish,
  };
}
