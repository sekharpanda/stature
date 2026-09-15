import type { Metadata } from "next";

import { brand } from "@/config/brand";

export const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? brand.domain;

type PageMetadataInput = {
  title: string;
  description: string;
  /** Path with leading slash, e.g. "/our-team". Omit for the homepage. */
  path?: string;
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  noIndex?: boolean;
};

/**
 * Single source of truth for public page metadata so every route ships the
 * same canonical, Open Graph and Twitter card shape.
 */
export function buildPageMetadata({
  title,
  description,
  path = "/",
  image = "/opengraph-image",
  type = "website",
  publishedTime,
  noIndex,
}: PageMetadataInput): Metadata {
  const url = `${siteUrl}${path}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type,
      url,
      siteName: brand.name,
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
