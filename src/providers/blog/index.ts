import { getBlogApiConfig, type BlogApiConfig, type BlogApiProviderKind } from "./config";
import { fetchJsonPosts } from "./json";
import type { BlogFetchResult, BlogProviderContext } from "./types";
import { fetchWordPressPosts } from "./wordpress";

export type { BlogApiConfig, BlogApiProviderKind };
export type { CanonicalBlogPost, BlogFetchResult } from "./types";
export { getBlogApiConfig };

export function isBlogApiReady(config = getBlogApiConfig()) {
  return config.enabled && config.configured;
}

export async function fetchBlogPage(
  config: BlogApiConfig,
  options: { page?: number; perPage?: number } = {},
): Promise<BlogFetchResult> {
  const ctx: BlogProviderContext = {
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
  };

  if (config.provider === "json") {
    return fetchJsonPosts(ctx, options);
  }
  return fetchWordPressPosts(ctx, options);
}
