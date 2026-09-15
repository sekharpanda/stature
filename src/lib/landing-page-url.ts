import { brand } from "@/config/brand";

/** Public Google Ads landing prefix: /dubai-projects/project-name */
export const LANDING_URL_PREFIX = "dubai-projects";

export function landingPagePath(slug: string) {
  const clean = slug.replace(/^\/+|\/+$/g, "");
  return `/${LANDING_URL_PREFIX}/${clean}`;
}

export function landingThankYouPath(slug: string) {
  return `${landingPagePath(slug)}/thank-you`;
}

export function landingPageAbsoluteUrl(slug: string) {
  const origin = (brand.domain || "https://www.prowinproperties.com").replace(
    /\/$/,
    "",
  );
  return `${origin}${landingPagePath(slug)}`;
}

export function slugifyLandingTitle(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
