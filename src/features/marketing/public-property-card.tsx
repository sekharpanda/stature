import Image from "next/image";
import Link from "next/link";
import { Building2, PlayCircle } from "lucide-react";

import { brand } from "@/config/brand";
import { locationLabel } from "@/lib/location";
import { cn } from "@/lib/utils";

export type PublicPropertyCardData = {
  name: string;
  slug: string;
  saleStatus?: string | null;
  completionLabel?: string | null;
  minPriceLabel?: string | null;
  launchPriceLabel?: string | null;
  paymentPlanLabel?: string | null;
  bedroomLabel?: string | null;
  ownershipLabel?: string | null;
  cashbackLabel?: string | null;
  virtualTourLabel?: string | null;
  propertyType?: { name: string } | null;
  developer?: { name: string; logoUrl?: string | null } | null;
  community?: { name: string } | null;
  area?: { name: string } | null;
  city?: { name: string } | null;
  coverImage?: { url: string; alt?: string | null } | null;
};


function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function PublicPropertyCard({
  property,
  className,
}: {
  property: PublicPropertyCardData;
  className?: string;
}) {
  const location = locationLabel([
    property.community?.name,
    property.area?.name,
    property.city?.name,
  ]);

  const handover = property.completionLabel
    ? `Handover: ${property.completionLabel}`
    : (property.saleStatus ?? null);

  const typeLabel = property.propertyType?.name ?? null;
  const beds = property.bedroomLabel ?? null;
  const price = property.launchPriceLabel ?? property.minPriceLabel ?? null;
  const ownership = property.ownershipLabel ?? null;
  const href = `/properties/${property.slug}`;
  const whatsappHref = `https://wa.me/${brand.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
    `Hi, I'm interested in ${property.name}`,
  )}`;

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)] ring-1 ring-black/[0.04] transition hover:shadow-[0_14px_36px_rgba(15,23,42,0.12)]",
        className,
      )}
    >
      <Link
        href={href}
        aria-label={`View ${property.name}`}
        className="relative block aspect-[16/10] overflow-hidden bg-[#eef1f4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
      >
        {property.coverImage?.url ? (
          <Image
            src={property.coverImage.url}
            alt={property.coverImage.alt ?? property.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            // Reelly/S3 origins often time out through the Next image optimizer.
            unoptimized
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#f4f6f8] to-[#e6eaef]">
            <Building2 className="size-8 text-[#b6bec9]" aria-hidden="true" />
            <span className="text-[11px] font-medium tracking-[0.14em] text-[#98a2b0] uppercase">
              Photos coming soon
            </span>
          </div>
        )}

        {handover ? (
          <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1.5 text-[11px] font-medium tracking-wide text-white backdrop-blur-sm">
            {handover}
          </span>
        ) : null}

        {property.cashbackLabel || property.virtualTourLabel ? (
          <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
            {property.cashbackLabel ? (
              <span className="rounded-full bg-red px-3 py-1.5 text-[11px] font-semibold tracking-wide text-white">
                {property.cashbackLabel}
              </span>
            ) : null}
            {property.virtualTourLabel ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-medium tracking-wide text-[#1f2937] backdrop-blur-sm">
                <PlayCircle className="size-3.5" aria-hidden="true" />
                {property.virtualTourLabel}
              </span>
            ) : null}
          </div>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <Link
          href={href}
          className="min-w-0 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
        >
          <h3 className="line-clamp-2 text-[22px] font-semibold leading-snug tracking-[-0.02em] text-[#1f2937]">
            {property.name}
          </h3>
          <p className="mt-1 line-clamp-1 text-sm text-[#6b7280]">{location}</p>
        </Link>

        <div className="mt-4 border-t border-[#eceff3]" />

        <div className="mt-4 flex items-end gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[#6b7280]">
              {price ? "Starting from" : "Price"}
            </p>
            <p className="mt-1 truncate text-base font-semibold text-[#1f2937]">
              {price ?? "On request"}
            </p>
          </div>
          {beds ? (
            <div className="min-w-0 flex-1">
              <p className="text-xs text-[#6b7280]">Bedrooms</p>
              <p className="mt-1 truncate text-sm font-semibold text-[#1f2937]">
                {beds}
              </p>
            </div>
          ) : null}
          {property.developer?.logoUrl ? (
            <div className="flex shrink-0 items-center justify-end">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={property.developer.logoUrl}
                alt={property.developer.name}
                loading="lazy"
                className="h-8 max-w-[88px] object-contain"
              />
            </div>
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <span className="min-w-0 truncate rounded-full bg-[#f3f4f6] px-3 py-1.5 text-xs font-medium text-[#5b6472]">
            {property.developer?.name ??
              (ownership ? `Ownership: ${ownership}` : (typeLabel ?? "Dubai"))}
          </span>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            aria-label={`Enquire about ${property.name} on WhatsApp`}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-[#25D366] px-3.5 text-[11px] font-bold tracking-[0.08em] text-[#1a8a45] transition hover:bg-[#25D366]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366] sm:min-h-0 sm:py-2"
          >
            <WhatsAppIcon className="size-3.5" aria-hidden="true" />
            WHATSAPP
          </a>
        </div>
      </div>
    </article>
  );
}
