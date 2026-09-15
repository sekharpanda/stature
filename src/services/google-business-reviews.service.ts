import { unstable_cache } from "next/cache";

import { brand } from "@/config/brand";

export type GoogleReviewItem = {
  authorName: string;
  profilePhotoUrl: string | null;
  rating: number;
  relativeTime: string;
  text: string;
  authorUrl: string | null;
};

export type GoogleBusinessReviews = {
  rating: number;
  reviewCount: number;
  source: "google" | "fallback";
  /**
   * Merged from Places Details `most_relevant` + `newest` (≤5 each).
   * Google does not expose the full review list via Places API.
   */
  reviews: GoogleReviewItem[];
};

type PlacesReview = {
  author_name?: string;
  author_url?: string;
  profile_photo_url?: string;
  rating?: number;
  relative_time_description?: string;
  text?: string;
};

type PlaceDetailsResult = {
  rating?: number;
  user_ratings_total?: number;
  reviews?: PlacesReview[];
};

const MAX_SLIDER_REVIEWS = 10;

function apiKey() {
  return (
    process.env.GOOGLE_PLACES_API_KEY?.trim() ||
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    ""
  );
}

function placeId() {
  return process.env.GOOGLE_PLACE_ID?.trim() || "";
}

function fallbackReviews(): GoogleBusinessReviews {
  return {
    rating: brand.rating,
    reviewCount: brand.reviewCount,
    source: "fallback",
    reviews: [],
  };
}

function reviewKey(r: GoogleReviewItem) {
  return `${r.authorName.toLowerCase()}|${r.text.slice(0, 80).toLowerCase()}`;
}

function toItem(r: PlacesReview): GoogleReviewItem | null {
  const text = (r.text ?? "").trim();
  if (text.length < 20) return null;
  return {
    authorName: r.author_name?.trim() || "Google reviewer",
    profilePhotoUrl: r.profile_photo_url?.trim() || null,
    rating: Number(r.rating ?? 0),
    relativeTime: r.relative_time_description?.trim() || "",
    text,
    authorUrl: r.author_url?.trim() || null,
  };
}

/** Prefer 5★, then 4★+, de-dupe, cap for the homepage slider. */
function mergeReviews(batches: PlacesReview[][]): GoogleReviewItem[] {
  const fiveStar: GoogleReviewItem[] = [];
  const fourPlus: GoogleReviewItem[] = [];
  const seen = new Set<string>();

  for (const batch of batches) {
    for (const raw of batch) {
      const item = toItem(raw);
      if (!item) continue;
      const key = reviewKey(item);
      if (seen.has(key)) continue;
      seen.add(key);
      if (item.rating >= 5) fiveStar.push(item);
      else if (item.rating >= 4) fourPlus.push(item);
    }
  }

  return [...fiveStar, ...fourPlus].slice(0, MAX_SLIDER_REVIEWS);
}

async function resolvePlaceId(key: string): Promise<string | null> {
  const configured = placeId();
  if (configured) return configured;

  const query =
    process.env.GOOGLE_PLACE_QUERY?.trim() ||
    `${brand.name} Icon Tower Barsha Heights Dubai`;

  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/findplacefromtext/json",
  );
  url.searchParams.set("input", query);
  url.searchParams.set("inputtype", "textquery");
  url.searchParams.set("fields", "place_id,name");
  url.searchParams.set("key", key);

  const res = await fetch(url.toString(), {
    next: { revalidate: 60 * 60 * 12 },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    status?: string;
    candidates?: Array<{ place_id?: string }>;
  };
  if (data.status !== "OK" || !data.candidates?.[0]?.place_id) {
    console.warn(
      "[google-reviews] findplacefromtext failed:",
      data.status ?? res.status,
    );
    return null;
  }
  return data.candidates[0].place_id;
}

async function fetchPlaceDetailsOnce(
  key: string,
  id: string,
  sort: "most_relevant" | "newest",
): Promise<PlaceDetailsResult | null> {
  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/details/json",
  );
  url.searchParams.set("place_id", id);
  url.searchParams.set("fields", "name,rating,user_ratings_total,reviews");
  url.searchParams.set("reviews_sort", sort);
  url.searchParams.set("key", key);

  const res = await fetch(url.toString(), {
    next: { revalidate: 60 * 60 * 6 },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    status?: string;
    result?: PlaceDetailsResult;
  };

  if (data.status !== "OK" || data.result?.rating == null) {
    console.warn(
      `[google-reviews] place details (${sort}) failed:`,
      data.status ?? res.status,
    );
    return null;
  }

  return data.result;
}

async function fetchPlaceDetails(
  key: string,
  id: string,
): Promise<GoogleBusinessReviews | null> {
  // Google returns ≤5 reviews per request — pull both sort modes and merge.
  const [relevant, newest] = await Promise.all([
    fetchPlaceDetailsOnce(key, id, "most_relevant"),
    fetchPlaceDetailsOnce(key, id, "newest"),
  ]);

  const primary = relevant ?? newest;
  if (!primary) return null;

  const reviews = mergeReviews([
    primary.reviews ?? [],
    (primary === relevant ? newest?.reviews : relevant?.reviews) ?? [],
  ]);

  return {
    rating: Number(primary.rating),
    reviewCount: Number(primary.user_ratings_total ?? 0),
    source: "google",
    reviews,
  };
}

async function loadGoogleBusinessReviews(): Promise<GoogleBusinessReviews> {
  const key = apiKey();
  if (!key) return fallbackReviews();

  try {
    const id = await resolvePlaceId(key);
    if (!id) return fallbackReviews();
    const details = await fetchPlaceDetails(key, id);
    return details ?? fallbackReviews();
  } catch (error) {
    console.error("[google-reviews] fetch error:", error);
    return fallbackReviews();
  }
}

/** Cached Google Business / Places rating + merged review snippets. */
export const getGoogleBusinessReviews = unstable_cache(
  loadGoogleBusinessReviews,
  ["google-business-reviews-v4"],
  { revalidate: 60 * 60 * 6 },
);

export function googleReviewsPageUrl(placeIdOverride?: string) {
  const id = placeIdOverride?.trim() || placeId();
  if (!id) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(brand.name + " Dubai")}`;
  }
  return `https://search.google.com/local/reviews?placeid=${encodeURIComponent(id)}`;
}

export function formatTrustGoogleReviews(reviews: GoogleBusinessReviews) {
  const ratingLabel = `${reviews.rating.toFixed(1).replace(/\.0$/, "")}★`;
  const count = reviews.reviewCount.toLocaleString("en-US");
  return {
    value: ratingLabel,
    label: `${count} Google reviews`,
    href: googleReviewsPageUrl(),
  };
}

/** Trust-strip items that are synced from Google Places (not CMS-editable). */
export { isGoogleReviewsTrustItem } from "@/lib/google-reviews-trust";
