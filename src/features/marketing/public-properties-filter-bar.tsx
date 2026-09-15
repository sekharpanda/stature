"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Armchair,
  Bell,
  Building2,
  ChevronDown,
  Diamond,
  Filter,
  Info,
  Map as MapIcon,
  PlayCircle,
  Ruler,
  Search,
  SlidersHorizontal,
  Wallet,
  X,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { SavedSearchDialog } from "./saved-search-dialog";
import {
  isOffPlanCompletion,
  isReadyCompletion,
} from "@/lib/property-filters";

export type PublicFilterOption = { value: string; label: string };

export type PublicPropertyFiltersState = {
  q?: string;
  type?: string;
  beds?: string;
  priceMin?: string;
  priceMax?: string;
  completion?: string;
  furnishing?: string;
  sizeMin?: string;
  sizeMax?: string;
  priceSqftMin?: string;
  priceSqftMax?: string;
  amenity?: string;
  keywords?: string;
  viewing?: string;
  cashback?: string;
  sort?: string;
};

const CASHBACK_OPTIONS = [
  { value: "1", label: "1% cashback or more" },
  { value: "0.3", label: "0.3% cashback or more" },
];

const VIEWING_OPTIONS = [
  { value: "", label: "Any listing" },
  { value: "any", label: "Has a virtual tour" },
  { value: "360", label: "360 tours" },
  { value: "video", label: "Video tours" },
  { value: "live", label: "Live viewings" },
];

const BED_OPTIONS = [
  { value: "", label: "Beds & Baths" },
  { value: "studio", label: "Studio" },
  { value: "1", label: "1 Bedroom" },
  { value: "2", label: "2 Bedrooms" },
  { value: "3", label: "3 Bedrooms" },
  { value: "4", label: "4 Bedrooms" },
  { value: "5+", label: "5+ Bedrooms" },
];

const PRICE_PRESETS = [
  { value: "", label: "Any price" },
  { value: "0-1000000", label: "Under AED 1M" },
  { value: "1000000-2000000", label: "AED 1M – 2M" },
  { value: "2000000-5000000", label: "AED 2M – 5M" },
  { value: "5000000-10000000", label: "AED 5M – 10M" },
  { value: "10000000-", label: "AED 10M+" },
];

export const SORT_OPTIONS = [
  { value: "", label: "Featured first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "newest", label: "Newest first" },
  { value: "handover", label: "Handover: soonest" },
];

const FURNISHING_OPTIONS = [
  { value: "ANY", label: "All furnishings" },
  { value: "FURNISHED", label: "Furnished" },
  { value: "UNFURNISHED", label: "Unfurnished" },
  { value: "PARTLY", label: "Partly furnished" },
];

const COMPLETION_MORE = [
  { value: "", label: "Any" },
  { value: "off-plan", label: "Off-plan" },
  { value: "ready", label: "Ready" },
];

const DEFAULT_AMENITIES = [
  "Central A/C",
  "Maids Room",
  "Balcony",
  "Shared Pool",
  "Shared Spa",
];

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--filter-accent)]";

function Chip({
  active,
  children,
  onClick,
  className,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3.5 py-2 text-sm transition",
        FOCUS_RING,
        active
          ? "border-[color:var(--filter-accent)] bg-[color:var(--filter-accent-soft)] font-medium text-[color:var(--filter-accent)]"
          : "border-[#d9dde3] bg-white text-[#4b5563] hover:border-[#b8bec8]",
        className,
      )}
    >
      {children}
    </button>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  active,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: PublicFilterOption[];
  active?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-11 w-full appearance-none rounded-full border bg-white py-2 pl-4 pr-9 text-sm outline-none",
          FOCUS_RING,
          active
            ? "border-[color:var(--filter-accent)] font-medium text-[color:var(--filter-accent)]"
            : "border-[#d9dde3] text-[#374151]",
        )}
      >
        {options.map((opt) => (
          <option key={`${opt.value}-${opt.label}`} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#6b7280]" />
    </div>
  );
}

export function buildHref(filters: PublicPropertyFiltersState, base = "/properties") {
  const sp = new URLSearchParams();
  const entries: Array<[keyof PublicPropertyFiltersState, string | undefined]> =
    [
      ["q", filters.q],
      ["type", filters.type],
      ["beds", filters.beds],
      ["priceMin", filters.priceMin],
      ["priceMax", filters.priceMax],
      ["completion", filters.completion],
      ["furnishing", filters.furnishing],
      ["sizeMin", filters.sizeMin],
      ["sizeMax", filters.sizeMax],
      ["priceSqftMin", filters.priceSqftMin],
      ["priceSqftMax", filters.priceSqftMax],
      ["amenity", filters.amenity],
      ["keywords", filters.keywords],
      ["viewing", filters.viewing],
      ["cashback", filters.cashback],
      ["sort", filters.sort],
    ];

  for (const [key, value] of entries) {
    if (!value || value === "ANY") continue;
    sp.set(String(key), value);
  }

  const s = sp.toString();
  return s ? `${base}?${s}` : base;
}

/** Human label for each active filter, used by the removable chip row. */
function activeFilterChips(
  filters: PublicPropertyFiltersState,
): Array<{ key: keyof PublicPropertyFiltersState; label: string; clear: Partial<PublicPropertyFiltersState> }> {
  const chips: Array<{
    key: keyof PublicPropertyFiltersState;
    label: string;
    clear: Partial<PublicPropertyFiltersState>;
  }> = [];

  if (filters.q) {
    chips.push({ key: "q", label: `“${filters.q}”`, clear: { q: undefined } });
  }
  if (filters.type) {
    chips.push({ key: "type", label: filters.type, clear: { type: undefined } });
  }
  if (filters.beds) {
    const bed = BED_OPTIONS.find((b) => b.value === filters.beds);
    chips.push({
      key: "beds",
      label: bed?.label ?? `${filters.beds} beds`,
      clear: { beds: undefined },
    });
  }
  if (filters.priceMin || filters.priceMax) {
    const preset = PRICE_PRESETS.find(
      (p) => p.value === `${filters.priceMin ?? ""}-${filters.priceMax ?? ""}`,
    );
    chips.push({
      key: "priceMin",
      label: preset?.label ?? "Custom price",
      clear: { priceMin: undefined, priceMax: undefined },
    });
  }
  if (filters.completion) {
    chips.push({
      key: "completion",
      label: isReadyCompletion(filters.completion) ? "Ready" : "Off-plan",
      clear: { completion: undefined },
    });
  }
  if (filters.furnishing && filters.furnishing !== "ANY") {
    const opt = FURNISHING_OPTIONS.find((f) => f.value === filters.furnishing);
    chips.push({
      key: "furnishing",
      label: opt?.label ?? filters.furnishing,
      clear: { furnishing: "ANY" },
    });
  }
  if (filters.amenity) {
    chips.push({
      key: "amenity",
      label: filters.amenity,
      clear: { amenity: undefined },
    });
  }
  if (filters.sizeMin || filters.sizeMax) {
    chips.push({
      key: "sizeMin",
      label: `${filters.sizeMin ?? "0"}–${filters.sizeMax ?? "any"} sqft`,
      clear: { sizeMin: undefined, sizeMax: undefined },
    });
  }
  if (filters.priceSqftMin || filters.priceSqftMax) {
    chips.push({
      key: "priceSqftMin",
      label: `AED ${filters.priceSqftMin ?? "0"}–${filters.priceSqftMax ?? "any"} /sqft`,
      clear: { priceSqftMin: undefined, priceSqftMax: undefined },
    });
  }
  if (filters.keywords) {
    chips.push({
      key: "keywords",
      label: filters.keywords,
      clear: { keywords: undefined },
    });
  }
  if (filters.cashback) {
    const opt = CASHBACK_OPTIONS.find((c) => c.value === filters.cashback);
    chips.push({
      key: "cashback",
      label: opt?.label ?? `${filters.cashback}% cashback`,
      clear: { cashback: undefined },
    });
  }
  if (filters.viewing) {
    const opt = VIEWING_OPTIONS.find((v) => v.value === filters.viewing);
    chips.push({
      key: "viewing",
      label: opt?.label ?? filters.viewing,
      clear: { viewing: undefined },
    });
  }

  return chips;
}

/** Reflects the active search back in the page heading. */
export function headingFor(filters: PublicPropertyFiltersState) {
  const type = filters.type ? filters.type.toLowerCase() : "properties";
  const plural = filters.type
    ? /s$/i.test(type)
      ? type
      : `${type}s`
    : "properties";

  const qualifier =
    isOffPlanCompletion(filters.completion)
      ? "Off-plan "
      : isReadyCompletion(filters.completion)
        ? "Ready "
        : "";

  const where = filters.q ? filters.q : "Dubai";

  const heading = `${qualifier}${plural} for sale in ${where}`;
  return heading.charAt(0).toUpperCase() + heading.slice(1);
}

export function PublicPropertiesFilterBar({
  total,
  initial,
  types,
  amenities,
  rangeLabel,
}: {
  total: number;
  initial: PublicPropertyFiltersState;
  types: PublicFilterOption[];
  amenities: PublicFilterOption[];
  rangeLabel?: string;
}) {
  const router = useRouter();
  const [openMore, setOpenMore] = useState(false);
  const [draft, setDraft] = useState<PublicPropertyFiltersState>(initial);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);

  // The URL is the source of truth. Without this, closing the sheet without
  // applying leaves stale draft values that the next main-bar change submits.
  useEffect(() => {
    setDraft(initial);
  }, [initial]);

  const typeOptions = useMemo(
    () => [{ value: "", label: "Property type" }, ...types],
    [types],
  );

  const amenityOptions = useMemo(() => {
    const names = amenities.length
      ? amenities.map((a) => a.label)
      : DEFAULT_AMENITIES;
    return names;
  }, [amenities]);

  const visibleAmenities = showAllAmenities
    ? amenityOptions
    : amenityOptions.slice(0, 5);

  const pricePreset = (() => {
    if (!draft.priceMin && !draft.priceMax) return "";
    return `${draft.priceMin ?? ""}-${draft.priceMax ?? ""}`;
  })();

  const chips = activeFilterChips(initial);

  function patch(partial: Partial<PublicPropertyFiltersState>) {
    setDraft((prev) => ({ ...prev, ...partial }));
  }

  function apply(next?: PublicPropertyFiltersState) {
    router.push(buildHref(next ?? draft));
  }

  function applyMainBar(partial: Partial<PublicPropertyFiltersState>) {
    const next = { ...draft, ...partial };
    setDraft(next);
    apply(next);
  }

  const listedLabel = total.toLocaleString("en-AE");

  return (
    <div
      className="rounded-[24px] border border-[#eceff3] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] md:p-6"
      style={
        {
          "--filter-accent": "#A01919",
          "--filter-accent-soft": "#fbeded",
        } as React.CSSProperties
      }
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1f2937] md:text-[28px]">
          {headingFor(initial)}
        </h1>
        <p className="text-sm text-[#6b7280]" aria-live="polite">
          {rangeLabel ?? `${listedLabel} listed`}
        </p>
      </div>

      <form
        className="mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          apply();
        }}
      >
        <div className="flex gap-2">
          <label className="relative block flex-1">
            <span className="sr-only">Search by city, community or building</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#6b7280]" />
            <input
              type="search"
              value={draft.q ?? ""}
              onChange={(e) => patch({ q: e.target.value })}
              placeholder="City, community or building"
              className={cn(
                "h-12 w-full rounded-full border border-[#d9dde3] bg-white pl-11 pr-4 text-sm text-[#1f2937] outline-none placeholder:text-[#6b7280]",
                FOCUS_RING,
              )}
            />
          </label>
          <button
            type="submit"
            className={cn(
              "h-12 shrink-0 rounded-full bg-[color:var(--filter-accent)] px-6 text-sm font-semibold text-white transition hover:opacity-90",
              FOCUS_RING,
            )}
          >
            Search
          </button>
        </div>

        {/* Desktop filter row. Below md these collapse into the sheet so the
            first listing stays close to the top of the screen. */}
        <div className="mt-4 hidden flex-wrap items-center gap-2 md:flex">
          <FilterSelect
            label="Property type"
            value={draft.type || ""}
            onChange={(type) => applyMainBar({ type })}
            options={typeOptions}
            active={Boolean(draft.type)}
          />
          <FilterSelect
            label="Bedrooms"
            value={draft.beds || ""}
            onChange={(beds) => applyMainBar({ beds })}
            options={BED_OPTIONS}
            active={Boolean(draft.beds)}
          />
          <FilterSelect
            label="Price range"
            value={pricePreset}
            onChange={(value) => {
              if (!value) {
                applyMainBar({ priceMin: undefined, priceMax: undefined });
                return;
              }
              const [min, max] = value.split("-");
              applyMainBar({
                priceMin: min || undefined,
                priceMax: max || undefined,
              });
            }}
            options={PRICE_PRESETS.map((p) => ({
              value: p.value,
              label: p.value ? p.label : "Price",
            }))}
            active={Boolean(draft.priceMin || draft.priceMax)}
          />

          <div className="inline-flex h-11 items-center rounded-full border border-[#d9dde3] p-1 text-sm">
            <button
              type="button"
              aria-pressed={isOffPlanCompletion(draft.completion)}
              onClick={() =>
                applyMainBar({
                  completion: isOffPlanCompletion(draft.completion)
                    ? undefined
                    : "off-plan",
                })
              }
              className={cn(
                "rounded-full px-3.5 py-1.5 transition",
                FOCUS_RING,
                isOffPlanCompletion(draft.completion)
                  ? "bg-[color:var(--filter-accent-soft)] font-medium text-[color:var(--filter-accent)]"
                  : "text-[#4b5563]",
              )}
            >
              Off-plan
            </button>
            <span className="h-5 w-px bg-[#e5e7eb]" />
            <button
              type="button"
              aria-pressed={isReadyCompletion(draft.completion)}
              onClick={() =>
                applyMainBar({
                  completion: isReadyCompletion(draft.completion)
                    ? undefined
                    : "ready",
                })
              }
              className={cn(
                "rounded-full px-3.5 py-1.5 transition",
                FOCUS_RING,
                isReadyCompletion(draft.completion)
                  ? "bg-[color:var(--filter-accent-soft)] font-medium text-[color:var(--filter-accent)]"
                  : "text-[#4b5563]",
              )}
            >
              Ready
            </button>
          </div>

          <button
            type="button"
            onClick={() => setOpenMore(true)}
            className={cn(
              "inline-flex h-11 items-center gap-2 rounded-full border border-[#d9dde3] px-4 text-sm text-[#374151] transition hover:border-[#b8bec8]",
              FOCUS_RING,
            )}
          >
            More filters
            <SlidersHorizontal className="size-4" aria-hidden="true" />
          </button>

          <FilterSelect
            label="Sort results"
            value={draft.sort || ""}
            onChange={(sort) => applyMainBar({ sort: sort || undefined })}
            options={SORT_OPTIONS}
            active={Boolean(draft.sort)}
            className="min-w-[168px]"
          />

          <button
            type="button"
            onClick={() => setAlertsOpen(true)}
            className={cn(
              "inline-flex h-11 items-center gap-2 rounded-full border border-[#d9dde3] px-4 text-sm text-[#374151] transition hover:border-[#b8bec8]",
              FOCUS_RING,
            )}
          >
            <Bell className="size-4" aria-hidden="true" />
            Save search
          </button>

          <Link
            href={buildHref(initial, "/properties/map")}
            className={cn(
              "ml-auto inline-flex h-11 items-center gap-2 rounded-full bg-[#1e2a44] px-4 text-sm font-medium text-white transition hover:bg-[#162034]",
              FOCUS_RING,
            )}
          >
            <MapIcon className="size-4" aria-hidden="true" />
            Map
          </Link>
        </div>

        {/* Mobile control row */}
        <div className="mt-3 flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setOpenMore(true)}
            className={cn(
              "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-[#d9dde3] text-sm font-medium text-[#374151]",
              FOCUS_RING,
              chips.length
                ? "border-[color:var(--filter-accent)] text-[color:var(--filter-accent)]"
                : "",
            )}
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            Filters
            {chips.length ? ` (${chips.length})` : ""}
          </button>
          <Link
            href={buildHref(initial, "/properties/map")}
            className={cn(
              "inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-[#1e2a44] px-4 text-sm font-medium text-white",
              FOCUS_RING,
            )}
          >
            <MapIcon className="size-4" aria-hidden="true" />
            Map
          </Link>
        </div>
      </form>

      {chips.length ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={`${chip.key}-${chip.label}`}
              type="button"
              onClick={() => applyMainBar(chip.clear)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full bg-[color:var(--filter-accent-soft)] py-1.5 pl-3 pr-2 text-xs font-medium text-[color:var(--filter-accent)] transition hover:opacity-80",
                FOCUS_RING,
              )}
            >
              {chip.label}
              <X className="size-3.5" aria-hidden="true" />
              <span className="sr-only">Remove filter</span>
            </button>
          ))}
          <Link
            href="/properties"
            className={cn(
              "rounded-full px-2 py-1.5 text-xs font-medium text-[#6b7280] underline underline-offset-2 transition hover:text-[#1f2937]",
              FOCUS_RING,
            )}
          >
            Clear all
          </Link>
        </div>
      ) : null}

      <SavedSearchDialog
        open={alertsOpen}
        onOpenChange={setAlertsOpen}
        query={initial as Record<string, string | undefined>}
        summary={headingFor(initial)}
      />

      <Sheet
        open={openMore}
        onOpenChange={(next) => {
          setOpenMore(next);
          // Discard unapplied edits so the main bar never submits hidden values.
          if (!next) setDraft(initial);
        }}
      >
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full overflow-y-auto border-l border-[#eceff3] p-0 sm:max-w-md"
          style={
            {
              "--filter-accent": "#A01919",
              "--filter-accent-soft": "#fbeded",
            } as React.CSSProperties
          }
        >
          <SheetHeader className="sticky top-0 z-10 border-b border-[#eceff3] bg-white px-5 py-4 text-left">
            <div className="flex items-center justify-between gap-3">
              <SheetTitle className="text-xl font-semibold text-[#1f2937]">
                Filters
              </SheetTitle>
              <button
                type="button"
                onClick={() => setOpenMore(false)}
                className="rounded-full p-2 text-[#6b7280] hover:bg-[#f3f4f6]"
                aria-label="Close filters"
              >
                <X className="size-4" />
              </button>
            </div>
          </SheetHeader>

          <div className="space-y-0 px-5 pb-28">
            {/* Mirrors of the desktop main-bar controls, for small screens. */}
            <section className="border-b border-[#eceff3] py-5 md:hidden">
              <div className="mb-3 text-sm font-semibold text-[#1f2937]">
                Search
              </div>
              <div className="grid gap-3">
                <FilterSelect
                  label="Property type"
                  value={draft.type || ""}
                  onChange={(type) => patch({ type })}
                  options={typeOptions}
                  active={Boolean(draft.type)}
                />
                <FilterSelect
                  label="Bedrooms"
                  value={draft.beds || ""}
                  onChange={(beds) => patch({ beds })}
                  options={BED_OPTIONS}
                  active={Boolean(draft.beds)}
                />
                <FilterSelect
                  label="Price range"
                  value={pricePreset}
                  onChange={(value) => {
                    if (!value) {
                      patch({ priceMin: undefined, priceMax: undefined });
                      return;
                    }
                    const [min, max] = value.split("-");
                    patch({
                      priceMin: min || undefined,
                      priceMax: max || undefined,
                    });
                  }}
                  options={PRICE_PRESETS.map((p) => ({
                    value: p.value,
                    label: p.value ? p.label : "Price",
                  }))}
                  active={Boolean(draft.priceMin || draft.priceMax)}
                />
                <FilterSelect
                  label="Sort results"
                  value={draft.sort || ""}
                  onChange={(sort) => patch({ sort: sort || undefined })}
                  options={SORT_OPTIONS}
                  active={Boolean(draft.sort)}
                />
              </div>
            </section>

            <section className="border-b border-[#eceff3] py-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#1f2937]">
                <Wallet className="size-4 text-[#6b7280]" aria-hidden="true" />
                Financing offers
              </div>
              <p className="mb-3 flex items-start gap-1.5 text-xs text-[#6b7280]">
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                Cashback is paid by Prowin from our commission on completion.
              </p>
              <div className="space-y-3">
                {CASHBACK_OPTIONS.map((item) => (
                  <div
                    key={item.value}
                    className="flex items-center justify-between gap-3 text-sm text-[#374151]"
                  >
                    <span id={`cashback-${item.value}`}>{item.label}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={draft.cashback === item.value}
                      aria-labelledby={`cashback-${item.value}`}
                      onClick={() =>
                        patch({
                          cashback:
                            draft.cashback === item.value
                              ? undefined
                              : item.value,
                        })
                      }
                      className={cn(
                        "relative h-6 w-11 shrink-0 rounded-full transition",
                        FOCUS_RING,
                        draft.cashback === item.value
                          ? "bg-[color:var(--filter-accent)]"
                          : "bg-[#d1d5db]",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 size-5 rounded-full bg-white shadow transition",
                          draft.cashback === item.value ? "left-5" : "left-0.5",
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="border-b border-[#eceff3] py-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#1f2937]">
                <Armchair className="size-4 text-[#6b7280]" aria-hidden="true" />
                Furnishing
              </div>
              <div className="flex flex-wrap gap-2">
                {FURNISHING_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.value}
                    active={(draft.furnishing || "ANY") === opt.value}
                    onClick={() => patch({ furnishing: opt.value })}
                  >
                    {opt.label}
                  </Chip>
                ))}
              </div>
            </section>

            <section className="border-b border-[#eceff3] py-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#1f2937]">
                <Building2 className="size-4 text-[#6b7280]" aria-hidden="true" />
                Completion status
              </div>
              <div className="flex flex-wrap gap-2">
                {COMPLETION_MORE.map((opt) => (
                  <Chip
                    key={opt.label}
                    active={
                      opt.value === "off-plan"
                        ? isOffPlanCompletion(draft.completion)
                        : opt.value === "ready"
                          ? isReadyCompletion(draft.completion)
                          : !draft.completion
                    }
                    onClick={() => patch({ completion: opt.value || undefined })}
                  >
                    {opt.label}
                  </Chip>
                ))}
              </div>
            </section>

            <section className="border-b border-[#eceff3] py-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#1f2937]">
                <Ruler className="size-4 text-[#6b7280]" aria-hidden="true" />
                Property size (sqft)
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  aria-label="Minimum size in square feet"
                  placeholder="Min. sqft"
                  value={draft.sizeMin ?? ""}
                  onChange={(e) => patch({ sizeMin: e.target.value || undefined })}
                  className={cn(
                    "h-11 flex-1 rounded-xl border border-[#d9dde3] px-3 text-sm outline-none",
                    FOCUS_RING,
                  )}
                />
                <span className="text-[#6b7280]" aria-hidden="true">
                  —
                </span>
                <input
                  type="number"
                  min={0}
                  aria-label="Maximum size in square feet"
                  placeholder="Max. sqft"
                  value={draft.sizeMax ?? ""}
                  onChange={(e) => patch({ sizeMax: e.target.value || undefined })}
                  className={cn(
                    "h-11 flex-1 rounded-xl border border-[#d9dde3] px-3 text-sm outline-none",
                    FOCUS_RING,
                  )}
                />
              </div>
            </section>

            <section className="border-b border-[#eceff3] py-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#1f2937]">
                <Wallet className="size-4 text-[#6b7280]" aria-hidden="true" />
                Price per area (sqft)
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  aria-label="Minimum price per square foot"
                  placeholder="Min. AED/sqft"
                  value={draft.priceSqftMin ?? ""}
                  onChange={(e) =>
                    patch({ priceSqftMin: e.target.value || undefined })
                  }
                  className={cn(
                    "h-11 flex-1 rounded-xl border border-[#d9dde3] px-3 text-sm outline-none",
                    FOCUS_RING,
                  )}
                />
                <span className="text-[#6b7280]" aria-hidden="true">
                  —
                </span>
                <input
                  type="number"
                  min={0}
                  aria-label="Maximum price per square foot"
                  placeholder="Max. AED/sqft"
                  value={draft.priceSqftMax ?? ""}
                  onChange={(e) =>
                    patch({ priceSqftMax: e.target.value || undefined })
                  }
                  className={cn(
                    "h-11 flex-1 rounded-xl border border-[#d9dde3] px-3 text-sm outline-none",
                    FOCUS_RING,
                  )}
                />
              </div>
            </section>

            <section className="border-b border-[#eceff3] py-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#1f2937]">
                <Diamond className="size-4 text-[#6b7280]" aria-hidden="true" />
                Amenities
              </div>
              <div className="space-y-3">
                {visibleAmenities.map((name) => {
                  const checked = draft.amenity === name;
                  return (
                    <label
                      key={name}
                      className="flex items-center gap-3 text-sm text-[#374151]"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          patch({ amenity: checked ? undefined : name })
                        }
                        className="size-4 rounded border-[#d1d5db] accent-[color:var(--filter-accent)]"
                      />
                      {name}
                    </label>
                  );
                })}
              </div>
              {amenityOptions.length > 5 ? (
                <button
                  type="button"
                  onClick={() => setShowAllAmenities((v) => !v)}
                  className={cn(
                    "mt-4 rounded-full border border-[color:var(--filter-accent)] px-4 py-2 text-sm font-medium text-[color:var(--filter-accent)]",
                    FOCUS_RING,
                  )}
                >
                  {showAllAmenities ? "Show less" : "Show more"}
                </button>
              ) : null}
            </section>

            <section className="border-b border-[#eceff3] py-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#1f2937]">
                <Search className="size-4 text-[#6b7280]" aria-hidden="true" />
                Keywords
              </div>
              <input
                type="text"
                aria-label="Keywords"
                value={draft.keywords ?? ""}
                onChange={(e) =>
                  patch({ keywords: e.target.value || undefined })
                }
                placeholder="Keywords: e.g. beach, chiller free."
                className={cn(
                  "h-11 w-full rounded-full border border-[#d9dde3] bg-[#f7f8fa] px-4 text-sm outline-none",
                  FOCUS_RING,
                )}
              />
            </section>

            <section className="py-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#1f2937]">
                <PlayCircle className="size-4 text-[#6b7280]" aria-hidden="true" />
                Virtual viewings
              </div>
              <div className="flex flex-wrap gap-2">
                {VIEWING_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.label}
                    active={(draft.viewing || "") === opt.value}
                    onClick={() => patch({ viewing: opt.value || undefined })}
                  >
                    {opt.label}
                  </Chip>
                ))}
              </div>
            </section>
          </div>

          <div className="sticky bottom-0 flex gap-3 border-t border-[#eceff3] bg-white px-5 py-4">
            <button
              type="button"
              onClick={() => {
                const cleared: PublicPropertyFiltersState = {
                  furnishing: "ANY",
                };
                setDraft(cleared);
                apply(cleared);
                setOpenMore(false);
              }}
              className={cn(
                "h-11 flex-1 rounded-full border border-[#d9dde3] text-sm font-medium text-[#374151]",
                FOCUS_RING,
              )}
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => {
                apply();
                setOpenMore(false);
              }}
              className={cn(
                "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[color:var(--filter-accent)] text-sm font-semibold text-white",
                FOCUS_RING,
              )}
            >
              <Filter className="size-4" aria-hidden="true" />
              Show {total.toLocaleString("en-AE")} results
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
