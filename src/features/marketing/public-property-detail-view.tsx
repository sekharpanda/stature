import Link from "next/link";
import {
  Building2,
  Download,
  MapPin,
  Phone,
} from "lucide-react";

import { brand } from "@/config/brand";
import { LeadCaptureForm } from "@/features/leads/components/lead-capture-form";
import { LeadModalCta } from "@/features/leads/components/site-lead-capture-modal";
import { PropertyGallery } from "@/features/marketing/property-gallery";
import {
  PublicPropertyCard,
  type PublicPropertyCardData,
} from "@/features/marketing/public-property-card";
import { locationLabel } from "@/lib/location";
import { siteUrl } from "@/lib/seo";

type DetailProperty = Awaited<
  ReturnType<typeof import("@/services/property.service").propertyService.getPublishedBySlug>
>;

function moneyLabel(
  value: { toString(): string } | number | null | undefined,
  currency: string,
) {
  if (value == null) return null;
  const n = typeof value === "number" ? value : Number(value.toString());
  if (!Number.isFinite(n)) return null;
  return `AED ${Math.round(n).toLocaleString("en-AE")}`;
}

function sizeLabel(
  value: { toString(): string } | number | null | undefined,
  unit = "sqft",
) {
  if (value == null) return null;
  const n = Number(value.toString());
  if (!Number.isFinite(n)) return null;
  return `${Math.round(n).toLocaleString("en-AE")} ${unit}`;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const NAV = [
  { id: "overview", label: "Overview" },
  { id: "units", label: "Units" },
  { id: "plans", label: "Plans" },
  { id: "amenities", label: "Amenities" },
  { id: "location", label: "Location" },
  { id: "gallery", label: "Gallery" },
  { id: "enquire", label: "Enquire" },
] as const;

function Panel({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-28 rounded-[24px] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.04] md:p-8"
    >
      <h2 className="text-2xl font-semibold tracking-tight text-[#1f2937]">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function PublicPropertyDetailView({
  property,
  similar = [],
}: {
  property: DetailProperty;
  similar?: PublicPropertyCardData[];
}) {
  const location = locationLabel([
    property.community?.name,
    property.area?.name,
    property.city?.name,
    property.country?.name,
  ]);

  const whatsapp = property.agent?.whatsapp || brand.whatsapp;
  const phone = property.agent?.phone || brand.phone;
  const whatsappHref = `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
    `Hi, I'm interested in ${property.name}`,
  )}`;

  const lat = property.address?.latitude;
  const lng = property.address?.longitude;

  const propertyUrl = `${siteUrl}/properties/${property.slug}`;
  const minPriceValue = property.minPrice
    ? Number(property.minPrice.toString())
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          {
            "@type": "ListItem",
            position: 2,
            name: "Properties",
            item: `${siteUrl}/properties`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: property.name,
            item: propertyUrl,
          },
        ],
      },
      {
        "@type": "RealEstateListing",
        name: property.name,
        url: propertyUrl,
        ...(property.shortDescription || property.description
          ? { description: property.shortDescription ?? property.description }
          : {}),
        ...(property.images.length
          ? { image: property.images.slice(0, 6).map((image) => image.url) }
          : {}),
        ...(location
          ? {
              address: {
                "@type": "PostalAddress",
                addressLocality:
                  property.community?.name ?? property.area?.name ?? "Dubai",
                addressRegion: property.city?.name ?? "Dubai",
                addressCountry: "AE",
              },
            }
          : {}),
        ...(lat != null && lng != null
          ? {
              geo: {
                "@type": "GeoCoordinates",
                latitude: lat,
                longitude: lng,
              },
            }
          : {}),
        ...(minPriceValue && minPriceValue > 0
          ? {
              offers: {
                "@type": "Offer",
                price: minPriceValue,
                priceCurrency: property.currency || "AED",
                availability: "https://schema.org/InStock",
                url: propertyUrl,
              },
            }
          : {}),
        broker: {
          "@type": "RealEstateAgent",
          name: brand.name,
          telephone: brand.phone,
          url: siteUrl,
        },
      },
    ],
  };

  const mapSrc =
    lat != null && lng != null
      ? `https://maps.google.com/maps?q=${lat},${lng}&z=14&output=embed`
      : property.address?.mapLocation
        ? `https://maps.google.com/maps?q=${encodeURIComponent(property.address.mapLocation)}&z=14&output=embed`
        : null;

  const facts = [
    property.constructionStatus
      ? { label: "Construction", value: property.constructionStatus }
      : null,
    property.completionLabel
      ? { label: "Handover", value: property.completionLabel }
      : null,
    property.saleStatus ? { label: "Sale status", value: property.saleStatus } : null,
    property.unitsCount != null
      ? { label: "Units", value: String(property.unitsCount) }
      : null,
    property.buildingCount != null
      ? { label: "Buildings", value: String(property.buildingCount) }
      : null,
    property.hasEscrow
      ? {
          label: "Escrow",
          value: property.escrowNumber || "Available",
        }
      : null,
    property.postHandover ? { label: "Post handover", value: "Yes" } : null,
    property.serviceCharge
      ? { label: "Service charge", value: property.serviceCharge }
      : null,
    property.furnishing && property.furnishing !== "NOT_SPECIFIED"
      ? {
          label: "Furnishing",
          value: property.furnishing.replaceAll("_", " ").toLowerCase(),
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  const sizeRange = [
    sizeLabel(property.minSize, property.areaUnit),
    sizeLabel(property.maxSize, property.areaUnit),
  ]
    .filter(Boolean)
    .join(" – ");

  const visibleNav = NAV.filter((item) => {
    if (item.id === "units") return property.unitTypes.length > 0;
    if (item.id === "plans") return property.paymentPlans.length > 0;
    if (item.id === "amenities") return property.amenities.length > 0;
    if (item.id === "location")
      return Boolean(location || mapSrc || property.address);
    if (item.id === "gallery")
      return property.images.length > 0 || property.videos.length > 0;
    return true;
  });

  return (
    <div className="bg-[#f5f6f8]">
      <div className="border-b border-[#eceff3] bg-white">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-4 px-4 py-4 md:px-6">
          <nav aria-label="Breadcrumb" className="text-sm text-[#6b7280]">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="transition hover:text-[#1f2937]">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  href="/properties"
                  className="transition hover:text-[#1f2937]"
                >
                  Properties
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-[#1f2937]" aria-current="page">
                {property.name}
              </li>
            </ol>
          </nav>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {visibleNav.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="shrink-0 rounded-full border border-[#d9dde3] bg-white px-3.5 py-1.5 text-sm text-[#4b5563] transition hover:border-[#b8bec8] hover:text-[#1f2937]"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1180px] gap-6 px-4 py-6 md:px-6 md:py-10 lg:grid-cols-[1.45fr_0.85fr]">
        <div className="space-y-6">
          <PropertyGallery images={property.images} title={property.name} />

          <section
            id="overview"
            className="scroll-mt-28 rounded-[24px] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.04] md:p-8"
          >
            <div className="flex flex-wrap items-center gap-2">
              {property.completionLabel ? (
                <span className="rounded-full bg-black/80 px-3 py-1 text-xs font-medium text-white">
                  Handover: {property.completionLabel}
                </span>
              ) : null}
              {property.saleStatus ? (
                <span className="rounded-full bg-[#fbeded] px-3 py-1 text-xs font-medium text-red">
                  {property.saleStatus}
                </span>
              ) : null}
              {property.propertyType?.name ? (
                <span className="rounded-full bg-[#f3f4f6] px-3 py-1 text-xs font-medium text-[#6b7280]">
                  {property.propertyType.name}
                </span>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-3xl font-semibold tracking-tight text-[#1f2937] md:text-4xl">
                  {property.name}
                </h1>
                {location ? (
                  <p className="mt-2 flex items-start gap-2 text-[#8b93a1]">
                    <MapPin className="mt-0.5 size-4 shrink-0" />
                    <span>{location}</span>
                  </p>
                ) : null}
              </div>
              {property.developer?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={property.developer.logoUrl}
                  alt={property.developer.name}
                  className="h-10 max-w-[120px] object-contain"
                />
              ) : property.developer?.name ? (
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6b7280]">
                  {property.developer.name}
                </p>
              ) : null}
            </div>

            <div className="mt-6 grid gap-4 border-y border-[#eceff3] py-5 sm:grid-cols-3">
              <div>
                <p className="text-xs text-[#9aa3af]">Launch price</p>
                <p className="mt-1 text-lg font-semibold text-[#1f2937]">
                  {property.minPriceLabel
                    ? `From ${property.minPriceLabel}`
                    : "Price on request"}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#9aa3af]">Payment plan</p>
                <p className="mt-1 text-lg font-semibold text-[#1f2937]">
                  {property.paymentPlanLabel ?? "On request"}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#9aa3af]">Size</p>
                <p className="mt-1 text-lg font-semibold text-[#1f2937]">
                  {sizeRange || "On request"}
                </p>
              </div>
            </div>

            {(property.shortDescription || property.description) && (
              <div className="mt-6 space-y-3 text-[15px] leading-relaxed text-[#4b5563] whitespace-pre-line">
                {property.shortDescription ? (
                  <p className="font-medium text-[#1f2937]">
                    {property.shortDescription}
                  </p>
                ) : null}
                {property.description ? <p>{property.description}</p> : null}
              </div>
            )}

            {facts.length > 0 ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {facts.map((fact) => (
                  <div
                    key={fact.label}
                    className="rounded-[16px] bg-[#f7f8fa] px-4 py-3"
                  >
                    <p className="text-xs text-[#9aa3af]">{fact.label}</p>
                    <p className="mt-1 text-sm font-semibold capitalize text-[#1f2937]">
                      {fact.value}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-2 lg:hidden">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white"
              >
                <WhatsAppIcon className="size-4" />
                WhatsApp
              </a>
              <LeadModalCta
                leadSource="property_detail"
                campaign={property.slug}
                propertyId={property.id}
                className="inline-flex flex-1 items-center justify-center rounded-full border border-[#1f2937] px-4 py-3 text-sm font-semibold text-[#1f2937]"
              >
                Enquire
              </LeadModalCta>
            </div>
          </section>

          {property.unitTypes.length > 0 ? (
            <Panel id="units" title="Unit types">
              <div className="overflow-x-auto rounded-[18px] border border-[#eceff3]">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="border-b bg-[#f7f8fa] text-[#6b7280]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Beds</th>
                      <th className="px-4 py-3 font-medium">Size</th>
                      <th className="px-4 py-3 font-medium">From</th>
                    </tr>
                  </thead>
                  <tbody>
                    {property.unitTypes.map((unit) => (
                      <tr key={unit.id} className="border-b last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {unit.typicalImageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={unit.typicalImageUrl}
                                alt=""
                                className="size-12 rounded-[10px] object-cover"
                              />
                            ) : (
                              <span className="flex size-12 items-center justify-center rounded-[10px] bg-[#f3f4f6]">
                                <Building2 className="size-4 text-[#9aa3af]" />
                              </span>
                            )}
                            <span className="font-medium text-[#1f2937]">
                              {unit.name || unit.unitType || "Unit"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#4b5563]">
                          {unit.bedroomsLabel ||
                            (unit.bedrooms != null
                              ? Number(unit.bedrooms.toString()) === 0
                                ? "Studio"
                                : String(unit.bedrooms)
                              : "—")}
                        </td>
                        <td className="px-4 py-3 text-[#4b5563]">
                          {sizeLabel(
                            unit.sizeFromSqft ?? unit.areaFrom,
                            "sqft",
                          ) ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-[#4b5563]">
                          {moneyLabel(
                            unit.priceFromAed ?? unit.priceFrom,
                            property.currency,
                          ) ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          ) : null}

          {property.paymentPlans.length > 0 ? (
            <Panel id="plans" title="Payment plans">
              <div className="space-y-4">
                {property.paymentPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="rounded-[18px] border border-[#eceff3] p-5"
                  >
                    <p className="font-semibold text-[#1f2937]">{plan.title}</p>
                    {plan.description ? (
                      <p className="mt-1 text-sm text-[#6b7280]">
                        {plan.description}
                      </p>
                    ) : null}
                    {plan.steps.length > 0 ? (
                      <ol className="mt-4 space-y-3">
                        {plan.steps.map((step, index) => (
                          <li key={step.id} className="flex gap-3 text-sm">
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#fbeded] text-xs font-semibold text-red">
                              {index + 1}
                            </span>
                            <div>
                              <p className="font-medium text-[#1f2937]">
                                {step.name}
                                {step.percent != null
                                  ? ` — ${Number(step.percent.toString())}%`
                                  : ""}
                              </p>
                              {step.dueLabel ? (
                                <p className="text-[#8b93a1]">{step.dueLabel}</p>
                              ) : null}
                            </div>
                          </li>
                        ))}
                      </ol>
                    ) : null}
                  </div>
                ))}
              </div>
            </Panel>
          ) : null}

          {property.amenities.length > 0 ? (
            <Panel id="amenities" title="Amenities">
              <ul className="grid gap-2 sm:grid-cols-2">
                {property.amenities.map((row) => (
                  <li
                    key={row.id}
                    className="rounded-[14px] bg-[#f7f8fa] px-4 py-3 text-sm text-[#374151]"
                  >
                    {row.amenity.name}
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          {(location || mapSrc || property.address) && (
            <Panel id="location" title="Location">
              {location ? (
                <p className="text-[#4b5563]">{location}</p>
              ) : null}
              {property.address?.mapLocation ||
              property.address?.locality ||
              property.address?.district ? (
                <p className="mt-2 text-sm text-[#8b93a1]">
                  {[
                    property.address.mapLocation,
                    property.address.locality,
                    property.address.district,
                    property.address.tower,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              ) : null}
              {mapSrc ? (
                <div className="mt-4 overflow-hidden rounded-[18px] border border-[#eceff3]">
                  <iframe
                    title={`${property.name} map`}
                    src={mapSrc}
                    className="h-72 w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              ) : null}
            </Panel>
          )}

          {(property.images.length > 0 || property.videos.length > 0) && (
            <Panel id="gallery" title="Gallery & media">
              {property.videos.length > 0 ? (
                <div className="mb-5 space-y-3">
                  {property.videos.slice(0, 2).map((video) => (
                    <div key={video.id}>
                      {video.title ? (
                        <p className="mb-2 text-sm font-medium text-[#1f2937]">
                          {video.title}
                        </p>
                      ) : null}
                      {video.url ? (
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-full border border-red px-4 py-2 text-sm font-medium text-red transition hover:bg-red hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                        >
                          Watch video
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {property.images.slice(0, 9).map((image) => (
                  <div
                    key={image.id}
                    className="overflow-hidden rounded-[16px] bg-[#eef1f4]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.url}
                      alt={image.alt ?? property.name}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div
            id="enquire"
            className="scroll-mt-28 rounded-[24px] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.04]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9aa3af]">
              Launch price
            </p>
            <p className="mt-1 text-2xl font-semibold text-[#1f2937]">
              {property.minPriceLabel
                ? `From ${property.minPriceLabel}`
                : "Price on request"}
            </p>
            {property.paymentPlanLabel ? (
              <p className="mt-1 text-sm text-[#8b93a1]">
                Payment plan {property.paymentPlanLabel}
              </p>
            ) : null}

            <div className="mt-5 flex gap-2">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#25D366] px-4 py-2.5 text-sm font-bold tracking-wide text-[#25D366]"
              >
                <WhatsAppIcon className="size-4" />
                WHATSAPP
              </a>
              <a
                href={`tel:${phone}`}
                aria-label={`Call ${phone}`}
                className="inline-flex items-center justify-center rounded-full border border-[#d9dde3] px-4 py-2.5 text-sm font-semibold text-[#1f2937] transition hover:border-[#1f2937]"
              >
                <Phone className="size-4" aria-hidden="true" />
              </a>
            </div>

            <div className="mt-6 border-t border-[#eceff3] pt-5">
              <h2 className="text-xl font-semibold text-[#1f2937]">
                Enquire now
              </h2>
              <p className="mt-1 text-sm text-[#8b93a1]">
                Share your details and our team will follow up with pricing and
                availability.
              </p>
              <div className="mt-4">
                <LeadCaptureForm
                  propertyId={property.id}
                  leadSource="property_detail"
                  campaign={property.slug}
                />
              </div>
            </div>
          </div>

          {property.agent ? (
            <div className="rounded-[24px] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.04]">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9aa3af]">
                Your agent
              </p>
              <div className="mt-4 flex items-center gap-3">
                {property.agent.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={property.agent.photoUrl}
                    alt={property.agent.name}
                    className="size-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-14 items-center justify-center rounded-full bg-[#1f2937] text-sm font-bold text-white">
                    {property.agent.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-[#1f2937]">
                    {property.agent.name}
                  </p>
                  {property.agent.title ? (
                    <p className="text-sm text-[#8b93a1]">
                      {property.agent.title}
                    </p>
                  ) : null}
                  {property.agent.reraNumber ? (
                    <p className="text-xs text-[#9aa3af]">
                      RERA {property.agent.reraNumber}
                    </p>
                  ) : null}
                </div>
              </div>
              {property.agent.bio ? (
                <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-[#6b7280]">
                  {property.agent.bio}
                </p>
              ) : null}
              {property.agent.languages?.length ? (
                <p className="mt-3 text-xs text-[#9aa3af]">
                  Languages: {property.agent.languages.join(", ")}
                </p>
              ) : null}
              {property.agent.isActive && property.agent.slug ? (
                <Link
                  href={`/our-team/${property.agent.slug}`}
                  className="mt-4 inline-block text-sm font-semibold text-red hover:text-red-dark"
                >
                  View full profile →
                </Link>
              ) : null}
            </div>
          ) : null}

          {property.brochures[0]?.url ? (
            <a
              href={property.brochures[0].url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] border border-[#1f2937] bg-white px-4 py-3 text-sm font-semibold text-[#1f2937] transition hover:bg-[#1f2937] hover:text-white"
            >
              <Download className="size-4" />
              Download brochure
            </a>
          ) : null}

          {property.developer?.website ? (
            <a
              href={property.developer.website}
              target="_blank"
              rel="noreferrer"
              className="block text-center text-sm font-medium text-red hover:underline"
            >
              Visit developer website
            </a>
          ) : null}
        </aside>
      </div>

      {similar.length > 0 ? (
        <section className="mx-auto max-w-[1180px] px-4 pb-12 md:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-[#1f2937]">
            Similar properties
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((item) => (
              <PublicPropertyCard key={item.slug} property={item} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Mobile conversion bar — the enquiry form sits far below the fold. */}
      <div className="sticky bottom-0 z-40 border-t border-[#eceff3] bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 text-sm font-semibold text-white"
          >
            <WhatsAppIcon className="size-4" aria-hidden="true" />
            WhatsApp
          </a>
          <a
            href={`tel:${phone}`}
            aria-label={`Call ${phone}`}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-[#d9dde3] text-[#1f2937]"
          >
            <Phone className="size-4" aria-hidden="true" />
          </a>
          <LeadModalCta
            leadSource="property_detail"
            campaign={property.slug}
            propertyId={property.id}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-[#1f2937] px-4 text-sm font-semibold text-white"
          >
            Enquire
          </LeadModalCta>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
