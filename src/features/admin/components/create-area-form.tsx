"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createAreaAction } from "@/actions/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type CityOption = { id: string; name: string };

export function CreateAreaForm({
  organizationId,
  cities,
}: {
  organizationId: string;
  cities: CityOption[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [cityId, setCityId] = useState(cities[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <Card className="card-elevated border-border/80">
      <CardHeader>
        <CardTitle className="font-display text-xl">Add area</CardTitle>
        <CardDescription>
          Create a location hub under a city for SEO and inventory filters.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError(null);
            const result = await createAreaAction({
              organizationId,
              name,
              cityId,
            });
            setLoading(false);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setName("");
            router.refresh();
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="area-name">Name</Label>
              <Input
                id="area-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area-city">City</Label>
              <select
                id="area-city"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
                required
              >
                <option value="" disabled>
                  Select city
                </option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={loading || !cityId}>
            {loading ? "Saving…" : "Create area"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
