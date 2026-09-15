import Link from "next/link";
import { Building2, CircleHelp, Star } from "lucide-react";

import { PublishToggle } from "@/features/admin/components/properties/publish-toggle";
import { cn } from "@/lib/utils";

export type OffPlanCardProperty = {
  id: string;
  name: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "EXPIRED" | string;
  saleStatus?: string | null;
  completionLabel?: string | null;
  minPriceLabel?: string | null;
  paymentPlanLabel?: string | null;
  developer?: { name: string; logoUrl?: string | null } | null;
  community?: { name: string } | null;
  area?: { name: string } | null;
  city?: { name: string } | null;
  coverImage?: { url: string; alt?: string | null } | null;
};

function developerInitials(name?: string | null) {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function saleBadgeClass(saleStatus?: string | null) {
  const s = (saleStatus ?? "").toLowerCase();
  if (s.includes("sold")) {
    return "bg-neutral-800 text-white";
  }
  if (s.includes("presale") || s.includes("pre-sale") || s.includes("pre sale")) {
    return "bg-[#c5eef5] text-[#0b6b7a]";
  }
  // LeadRat "On Sale" — light teal pill, dark text
  return "bg-[#c8ebf0] text-[#0f5f6b]";
}

export function OffPlanPropertyCard({
  property,
  className,
}: {
  property: OffPlanCardProperty;
  className?: string;
}) {
  const published = property.status === "PUBLISHED";
  const developerName = property.developer?.name;
  const logoUrl = property.developer?.logoUrl;

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl bg-white shadow-[0_1px_3px_rgba(16,24,40,0.08)] ring-1 ring-black/[0.04] transition hover:shadow-[0_8px_24px_rgba(16,24,40,0.12)]",
        className,
      )}
    >
      <Link
        href={`/admin/properties/${property.id}`}
        className="relative block aspect-[4/3] overflow-hidden bg-[#eef1f4]"
      >
        {property.coverImage?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={property.coverImage.url}
            alt={property.coverImage.alt ?? property.name}
            className="size-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Building2 className="size-10 text-neutral-400" />
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
          {property.saleStatus ? (
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none shadow-sm",
                saleBadgeClass(property.saleStatus),
              )}
            >
              {property.saleStatus}
            </span>
          ) : null}
          {property.completionLabel ? (
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold leading-none text-neutral-800 shadow-sm">
              {property.completionLabel}
            </span>
          ) : null}
        </div>

        <span className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-full bg-white/90 text-neutral-400 shadow-sm backdrop-blur-sm transition group-hover:text-[#1d9bb8]">
          <Star className="size-4" />
        </span>
      </Link>

      <div className="relative z-10 -mt-5 flex flex-1 flex-col gap-2.5 px-4 pb-3.5 pt-0">
        <span className="inline-flex size-10 items-center justify-center overflow-hidden rounded-full bg-[#1a1a1a] shadow-md ring-2 ring-white">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={developerName ?? "Developer"}
              className="size-full object-cover"
            />
          ) : (
            <span className="text-[11px] font-bold tracking-wide text-white">
              {developerInitials(developerName)}
            </span>
          )}
        </span>

        <div className="min-w-0 space-y-0.5">
          <Link
            href={`/admin/properties/${property.id}`}
            className="line-clamp-2 text-[16px] font-semibold leading-snug tracking-[-0.01em] text-neutral-900 hover:text-[#A01919]"
          >
            {property.name}
          </Link>
          <p className="line-clamp-1 text-[13px] text-neutral-500">
            {developerName ? `by ${developerName}` : "Developer TBA"}
          </p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-neutral-100 pt-3">
          <div className="min-w-0">
            <p className="text-[11px] text-neutral-500">Price from</p>
            <p className="truncate text-[15px] font-semibold tabular-nums text-neutral-900">
              {property.minPriceLabel && !property.minPriceLabel.startsWith("0 ")
                ? property.minPriceLabel
                : "On request"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-neutral-500">Payment plan</p>
            <p className="inline-flex items-center justify-end gap-1 text-[15px] font-semibold tabular-nums text-neutral-900">
              {property.paymentPlanLabel ?? "—"}
              <CircleHelp className="size-3.5 text-neutral-400" />
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="text-[11px] text-neutral-400">Website</span>
          <PublishToggle
            propertyId={property.id}
            published={published}
            className="gap-1.5"
          />
        </div>
      </div>
    </article>
  );
}
