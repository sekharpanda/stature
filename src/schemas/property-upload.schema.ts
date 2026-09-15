import { z } from "zod";

const optionalString = z
  .union([z.string(), z.literal(""), z.null()])
  .optional()
  .transform((v) => (v == null || v === "" ? null : v));

const optionalNumber = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .optional()
  .transform((v) => {
    if (v == null || v === "") return null;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  });

const stringList = z
  .union([z.string(), z.array(z.string()), z.null()])
  .optional()
  .transform((v) => {
    if (v == null) return [] as string[];
    if (Array.isArray(v)) return v.map((u) => u.trim()).filter(Boolean);
    return v
      .split(/[\n,]/)
      .map((u) => u.trim())
      .filter(Boolean);
  });

export const manualPropertyUploadSchema = z.object({
  // Property details (NRI-style)
  status: z
    .enum(["DRAFT", "PUBLISHED", "ARCHIVED", "EXPIRED"])
    .optional()
    .default("PUBLISHED"),
  name: z.string().min(2).max(200),
  categoryId: optionalString,
  categoryName: optionalString,
  propertyTypeId: optionalString,
  propertyTypeName: optionalString,
  unitNumber: optionalString,
  description: optionalString,
  shortDescription: optionalString,
  addressLine: optionalString,
  pinCode: optionalString,
  cityName: optionalString,
  cityId: optionalString,
  countryName: optionalString,
  currency: z.string().min(3).max(8).optional().default("AED"),
  price: optionalNumber,
  minPrice: optionalNumber,
  maxPrice: optionalNumber,
  bedrooms: optionalNumber,
  story: optionalString,
  propertyLocation: optionalString,
  marketStatus: optionalString,
  saleStatus: optionalString,
  buildingName: optionalString,
  buildings: optionalString,
  buildingCount: optionalNumber,
  plottingCode: optionalString,
  plottingAreaSqFt: optionalNumber,
  minSize: optionalNumber,
  maxSize: optionalNumber,
  areaUnit: z.string().max(20).optional().nullable(),

  // Additional details
  reference: optionalString,
  previousReference: optionalString,
  purchaseCost: optionalNumber,
  purchasedDate: optionalString,
  possessionHandover: z.boolean().optional().default(false),
  handoverDelay: z.boolean().optional().default(false),
  completionLabel: optionalString,
  constructionStatus: optionalString,
  possessionDate: optionalString,

  // Government details
  municipalityName: optionalString,
  propertyTaxId: optionalString,
  vpcNumber: optionalString,
  khateNumber: optionalString,
  governmentComments: optionalString,

  // Media
  coverImageUrl: optionalString,
  galleryUrls: stringList,
  galleryIllustration: optionalString,
  imageUrls: stringList,
  youtubeUrl: optionalString,
  youtubeTitle: optionalString,

  // Map / location
  mapEmbedUrl: optionalString,
  googleMapsUrl: optionalString,
  latitude: optionalNumber,
  longitude: optionalNumber,
  mapLocation: optionalString,
  emirate: optionalString,

  // SEO
  metaTitle: optionalString,
  metaDescription: optionalString,
  canonicalUrl: optionalString,
  ogTitle: optionalString,
  ogDescription: optionalString,
  twitterTitle: optionalString,
  twitterDescription: optionalString,
  seoKeywords: optionalString,

  // Amenities + catalog links
  amenities: stringList,
  developerId: optionalString,
  agentId: optionalString,
  developerName: optionalString,
  areaId: optionalString,
  areaName: optionalString,
  communityId: optionalString,
  communityName: optionalString,
  slug: optionalString,
  website: optionalString,
  depositDescription: optionalString,
  serviceCharge: optionalString,
  unitsCount: optionalNumber,
  isFeatured: z.boolean().optional().default(false),
  isVerified: z.boolean().optional().default(false),
  paymentPlanTitle: optionalString,
  paymentPlanSteps: z
    .array(
      z.object({
        name: z.string().min(1),
        percent: z.number().optional().nullable(),
      }),
    )
    .optional()
    .nullable(),
});

export type ManualPropertyUploadInput = z.infer<
  typeof manualPropertyUploadSchema
>;

/** Hand-curated marketing fields with no upstream equivalent in the feed. */
export const marketingOffersSchema = z.object({
  propertyId: z.string().min(1),
  cashbackPercent: optionalNumber.refine(
    (v) => v == null || (v >= 0 && v <= 100),
    { message: "Cashback must be between 0 and 100" },
  ),
  virtualTour: z
    .union([z.enum(["TOUR_360", "VIDEO", "LIVE"]), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v == null || v === "" ? null : v)),
});

export type MarketingOffersInput = z.infer<typeof marketingOffersSchema>;

export const PROPERTY_JSON_SAMPLE = {
  status: "PUBLISHED",
  name: "Aura Elite Residences",
  categoryName: "Residential",
  propertyTypeName: "Apartment",
  unitNumber: "A-1204",
  description:
    "A premium off-plan community in Business Bay featuring studios to 3-bedroom apartments.",
  addressLine: "Business Bay Boulevard",
  pinCode: null,
  cityName: "Dubai",
  emirate: "Dubai",
  countryName: "United Arab Emirates",
  currency: "AED",
  price: 990283,
  bedrooms: 2,
  story: "12",
  propertyLocation: "Business Bay",
  marketStatus: "On Sale",
  buildingName: "Aura Tower 1",
  buildings: "2",
  plottingCode: "PLT-204",
  plottingAreaSqFt: 1250,
  reference: "PRW-2026-001",
  previousReference: null,
  purchaseCost: null,
  purchasedDate: null,
  possessionHandover: false,
  handoverDelay: false,
  municipalityName: "Dubai Municipality",
  propertyTaxId: "",
  vpcNumber: "",
  khateNumber: "",
  governmentComments: "",
  coverImageUrl: "https://images.example.com/aura-cover.jpg",
  galleryUrls: [
    "https://images.example.com/aura-1.jpg",
    "https://images.example.com/aura-2.jpg",
  ],
  galleryIllustration: "Lobby, pool deck, typical 2BR",
  youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  youtubeTitle: "Project walkthrough",
  googleMapsUrl: "https://maps.google.com/?q=Business+Bay+Dubai",
  mapEmbedUrl: null,
  latitude: 25.1855,
  longitude: 55.2739,
  mapLocation: "Business Bay, Dubai, UAE",
  metaTitle: "Aura Elite Residences | Business Bay Dubai Off Plan",
  metaDescription:
    "Premium off-plan apartments in Business Bay, Dubai. Studios to 3 bedrooms from AED 990,283.",
  canonicalUrl: null,
  ogTitle: "Aura Elite Residences — Business Bay",
  ogDescription:
    "Explore Aura Elite Residences in Business Bay with flexible payment plans.",
  twitterTitle: null,
  twitterDescription: null,
  seoKeywords: "Business Bay, Dubai off plan, apartments for sale",
  amenities: ["Swimming Pool", "Gym", "Kids Play Area"],
  developerName: "Aura Infinite Real Estate Development",
  completionLabel: "Q2 2028",
};
