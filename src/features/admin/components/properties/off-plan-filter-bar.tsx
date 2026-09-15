"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bookmark,
  ChevronDown,
  Map,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FILTER_KEYS = [
  "region",
  "district",
  "developer",
  "handover",
  "type",
  "beds",
  "sale",
  "construction",
  "price",
  "payments",
] as const;

type FilterKey = (typeof FILTER_KEYS)[number];

const FILTER_LABELS: Record<FilterKey, string> = {
  region: "Region",
  district: "District",
  developer: "Developer",
  handover: "Handover",
  type: "Type",
  beds: "Beds",
  sale: "Sale",
  construction: "Construction",
  price: "Price",
  payments: "Payments",
};

export type OffPlanFilterOption = { value: string; label: string };

export type OffPlanFilterOptions = {
  regions: OffPlanFilterOption[];
  districts: OffPlanFilterOption[];
  developers: OffPlanFilterOption[];
  handovers: OffPlanFilterOption[];
  types: OffPlanFilterOption[];
  beds: OffPlanFilterOption[];
  sales: OffPlanFilterOption[];
  constructions: OffPlanFilterOption[];
  prices: OffPlanFilterOption[];
  payments: OffPlanFilterOption[];
};

export type OffPlanActiveFilters = {
  q?: string;
  region?: string;
  district?: string;
  developer?: string;
  handover?: string;
  type?: string;
  beds?: string;
  sale?: string;
  construction?: string;
  price?: string;
  payments?: string;
  status?: string;
};

const FALLBACK: Record<FilterKey, OffPlanFilterOption[]> = {
  region: [],
  district: [],
  developer: [],
  handover: [
    { value: "Q1 2026", label: "Q1 2026" },
    { value: "Q2 2026", label: "Q2 2026" },
    { value: "Q3 2026", label: "Q3 2026" },
    { value: "Q4 2026", label: "Q4 2026" },
    { value: "Q1 2027", label: "Q1 2027" },
    { value: "Q2 2027", label: "Q2 2027" },
    { value: "Q3 2027", label: "Q3 2027" },
    { value: "Q4 2027", label: "Q4 2027" },
    { value: "Q1 2028", label: "Q1 2028" },
    { value: "Q2 2028", label: "Q2 2028" },
    { value: "Q3 2028", label: "Q3 2028" },
    { value: "Q4 2028", label: "Q4 2028" },
    { value: "Q1 2029", label: "Q1 2029" },
    { value: "Q2 2029", label: "Q2 2029" },
    { value: "Q3 2029", label: "Q3 2029" },
    { value: "Q4 2029", label: "Q4 2029" },
  ],
  type: [
    { value: "Apartment", label: "Apartment" },
    { value: "Villa", label: "Villa" },
    { value: "Townhouse", label: "Townhouse" },
    { value: "Penthouse", label: "Penthouse" },
  ],
  beds: [
    { value: "studio", label: "Studio" },
    { value: "1", label: "1 Bedroom" },
    { value: "2", label: "2 Bedrooms" },
    { value: "3", label: "3 Bedrooms" },
    { value: "4", label: "4 Bedrooms" },
    { value: "5+", label: "5+ Bedrooms" },
  ],
  sale: [
    { value: "On Sale", label: "On Sale" },
    { value: "Presale", label: "Presale" },
    { value: "Sold Out", label: "Sold Out" },
    { value: "Announced", label: "Announced" },
  ],
  construction: [
    { value: "Off Plan", label: "Off Plan" },
    { value: "Under Construction", label: "Under Construction" },
    { value: "Completed", label: "Completed" },
  ],
  price: [
    { value: "0-1000000", label: "Under 1M AED" },
    { value: "1000000-2000000", label: "1M – 2M AED" },
    { value: "2000000-5000000", label: "2M – 5M AED" },
    { value: "5000000-10000000", label: "5M – 10M AED" },
    { value: "10000000-", label: "10M+ AED" },
  ],
  payments: [
    { value: "60/40", label: "60/40%" },
    { value: "50/50", label: "50/50%" },
    { value: "70/30", label: "70/30%" },
    { value: "80/20", label: "80/20%" },
    { value: "90/10", label: "90/10%" },
    { value: "40/60", label: "40/60%" },
  ],
};

function countActive(filters: OffPlanActiveFilters) {
  return (
    FILTER_KEYS.reduce((n, key) => (filters[key] ? n + 1 : n), 0) +
    (filters.q ? 1 : 0)
  );
}

function optionsFor(
  key: FilterKey,
  options: OffPlanFilterOptions,
): OffPlanFilterOption[] {
  const fromDb = (() => {
    switch (key) {
      case "region":
        return options.regions;
      case "district":
        return options.districts;
      case "developer":
        return options.developers;
      case "handover":
        return options.handovers;
      case "type":
        return options.types;
      case "beds":
        return options.beds;
      case "sale":
        return options.sales;
      case "construction":
        return options.constructions;
      case "price":
        return options.prices;
      case "payments":
        return options.payments;
    }
  })();
  return fromDb.length > 0 ? fromDb : FALLBACK[key];
}

function FilterDropdown({
  label,
  selected,
  options,
  onSelect,
}: {
  label: string;
  selected?: string;
  options: OffPlanFilterOption[];
  onSelect: (value: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedLabel =
    options.find((opt) => opt.value === selected)?.label ?? null;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-lg border bg-white px-3 text-xs font-medium shadow-sm transition hover:border-neutral-300",
          selected
            ? "border-[#22c55e] bg-[#22c55e]/5 text-neutral-900"
            : "border-neutral-200 text-neutral-700",
          open && "border-neutral-400",
        )}
      >
        <span className="max-w-[9rem] truncate">
          {selected ? `${label} (1)` : label}
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 text-neutral-400 transition",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 min-w-[220px] overflow-hidden rounded-xl border border-neutral-200 bg-[#f8f9fb] shadow-[0_12px_32px_rgba(15,23,42,0.14)]">
          <div className="max-h-64 overflow-y-auto p-1.5">
            <button
              type="button"
              onClick={() => {
                onSelect(undefined);
                setOpen(false);
              }}
              className={cn(
                "flex w-full rounded-lg px-3 py-2 text-left text-sm transition",
                !selected
                  ? "bg-[#A01919] font-medium text-white"
                  : "text-neutral-700 hover:bg-white",
              )}
            >
              All {label.toLowerCase()}
            </button>
            {options.map((opt) => {
              const active = selected === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onSelect(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full rounded-lg px-3 py-2 text-left text-sm transition",
                    active
                      ? "bg-[#A01919] font-medium text-white"
                      : "text-neutral-800 hover:bg-white",
                  )}
                  title={opt.label}
                >
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })}
            {options.length === 0 ? (
              <p className="px-3 py-2 text-sm text-neutral-500">No options</p>
            ) : null}
          </div>
          {selectedLabel ? (
            <div className="border-t border-neutral-200 bg-white px-3 py-2 text-[11px] text-neutral-500">
              Selected: {selectedLabel}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function OffPlanFilterBar({
  total,
  filters,
  options,
  className,
}: {
  total: number;
  filters: OffPlanActiveFilters;
  options: OffPlanFilterOptions;
  className?: string;
}) {
  const router = useRouter();
  const activeCount = countActive(filters);

  function push(patch: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    params.set("source", "leadrat");
    const next: OffPlanActiveFilters = {
      q: filters.q,
      region: filters.region,
      district: filters.district,
      developer: filters.developer,
      handover: filters.handover,
      type: filters.type,
      beds: filters.beds,
      sale: filters.sale,
      construction: filters.construction,
      price: filters.price,
      payments: filters.payments,
      status: filters.status,
      ...patch,
    };
    for (const [key, value] of Object.entries(next)) {
      if (!value) continue;
      params.set(key, value);
    }
    router.push(`/admin/properties?${params.toString()}`);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 rounded-md border-neutral-200 bg-white text-xs font-medium text-neutral-700 shadow-none"
          >
            <Link href="/admin/properties/import">
              <RefreshCw className="mr-1.5 size-3.5" />
              Integrations
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "h-8 rounded-md border-neutral-200 bg-white text-xs font-medium shadow-none",
              !filters.status
                ? "border-[#22c55e]/40 bg-[#22c55e]/10 text-neutral-900"
                : "text-neutral-700",
            )}
            onClick={() => push({ status: undefined })}
          >
            My Listings
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-md border-neutral-200 bg-white text-xs font-medium text-neutral-700 shadow-none"
            disabled
          >
            <Map className="mr-1.5 size-3.5" />
            Map
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-md border-neutral-200 bg-white text-xs font-medium text-neutral-700 shadow-none"
            disabled
          >
            <Bookmark className="mr-1.5 size-3.5" />
            Saved filters
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-neutral-600">
          <span className="inline-flex overflow-hidden rounded-md border border-neutral-200 bg-white">
            <span className="bg-neutral-900 px-2.5 py-1.5 text-white">AED</span>
            <span className="px-2.5 py-1.5 text-neutral-500">USD</span>
          </span>
          <span className="inline-flex overflow-hidden rounded-md border border-neutral-200 bg-white">
            <span className="bg-neutral-900 px-2.5 py-1.5 text-white">ft²</span>
            <span className="px-2.5 py-1.5 text-neutral-500">m²</span>
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-xs font-medium text-neutral-700">
              <SlidersHorizontal className="size-3.5 text-neutral-500" />
              {activeCount > 0
                ? `${activeCount} Filter${activeCount === 1 ? "" : "s"} active`
                : "All projects"}
            </div>

            <form
              className="min-w-[200px] flex-1"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                push({ q: String(form.get("q") ?? "").trim() || undefined });
              }}
            >
              <input
                name="q"
                defaultValue={filters.q ?? ""}
                placeholder="Search projects…"
                className="h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-neutral-300"
              />
            </form>

            <div className="ml-auto flex flex-wrap items-center gap-3 text-xs">
              <span className="font-semibold tabular-nums text-neutral-900">
                {total.toLocaleString()} projects
              </span>
              {activeCount > 0 ? (
                <button
                  type="button"
                  className="font-medium text-neutral-500 underline-offset-2 hover:text-neutral-800 hover:underline"
                  onClick={() =>
                    push({
                      q: undefined,
                      region: undefined,
                      district: undefined,
                      developer: undefined,
                      handover: undefined,
                      type: undefined,
                      beds: undefined,
                      sale: undefined,
                      construction: undefined,
                      price: undefined,
                      payments: undefined,
                      status: undefined,
                    })
                  }
                >
                  Reset all
                </button>
              ) : null}
              <span className="font-medium text-[#16a34a]">Save filter</span>
            </div>
          </div>

          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {FILTER_KEYS.map((key) => (
              <FilterDropdown
                key={key}
                label={FILTER_LABELS[key]}
                selected={filters[key]}
                options={optionsFor(key, options)}
                onSelect={(value) => push({ [key]: value })}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
