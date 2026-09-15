"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { setPropertyMarketingOffersAction } from "@/actions/properties";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type VirtualTourValue = "" | "TOUR_360" | "VIDEO" | "LIVE";

const TOUR_OPTIONS: Array<{ value: VirtualTourValue; label: string }> = [
  { value: "", label: "— None —" },
  { value: "TOUR_360", label: "360 tour" },
  { value: "VIDEO", label: "Video tour" },
  { value: "LIVE", label: "Live viewing" },
];

export function PropertyMarketingOffers({
  propertyId,
  cashbackPercent,
  virtualTour,
}: {
  propertyId: string;
  cashbackPercent: string;
  virtualTour: VirtualTourValue;
}) {
  const router = useRouter();
  const [cashback, setCashback] = useState(cashbackPercent);
  const [tour, setTour] = useState<VirtualTourValue>(virtualTour);
  const [loading, setLoading] = useState(false);

  const dirty = cashback !== cashbackPercent || tour !== virtualTour;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cashback-percent">Cashback (%)</Label>
        <Input
          id="cashback-percent"
          type="number"
          min={0}
          max={100}
          step="0.1"
          inputMode="decimal"
          placeholder="e.g. 1"
          value={cashback}
          onChange={(e) => setCashback(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Leave blank if no cashback is offered. Buyers can filter by 0.3% and
          1% on the public site.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="virtual-tour">Virtual tour</Label>
        <select
          id="virtual-tour"
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          value={tour}
          onChange={(e) => setTour(e.target.value as VirtualTourValue)}
        >
          {TOUR_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <Button
        type="button"
        size="sm"
        className="w-full"
        disabled={loading || !dirty}
        onClick={async () => {
          setLoading(true);
          const result = await setPropertyMarketingOffersAction({
            propertyId,
            cashbackPercent: cashback,
            virtualTour: tour,
          });
          setLoading(false);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success("Marketing offers updated");
          router.refresh();
        }}
      >
        {loading ? "Saving…" : "Save offers"}
      </Button>
    </div>
  );
}
