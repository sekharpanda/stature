"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createManualPropertyAction } from "@/actions/properties";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Option = { id: string; name: string };

export function CreateManualPropertyForm({
  developers,
  agents = [],
  areas,
  communities,
  cities,
}: {
  developers: Option[];
  agents?: Option[];
  areas: Option[];
  communities: Option[];
  cities: Option[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Card className="card-elevated border-border/80">
      <CardHeader>
        <CardTitle className="font-display text-xl">Property details</CardTitle>
        <CardDescription>
          Creates a manual draft listing. Publish when ready for the website.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            setLoading(true);
            setError(null);
            const form = new FormData(event.currentTarget);
            const result = await createManualPropertyAction({
              name: String(form.get("name") ?? ""),
              shortDescription: String(form.get("shortDescription") ?? "") || null,
              description: String(form.get("description") ?? "") || null,
              minPrice: String(form.get("minPrice") ?? "") || null,
              currency: String(form.get("currency") ?? "AED"),
              developerId: String(form.get("developerId") ?? "") || null,
              agentId: String(form.get("agentId") ?? "") || null,
              cityId: String(form.get("cityId") ?? "") || null,
              areaId: String(form.get("areaId") ?? "") || null,
              communityId: String(form.get("communityId") ?? "") || null,
              saleStatus: String(form.get("saleStatus") ?? "") || null,
              completionLabel: String(form.get("completionLabel") ?? "") || null,
            });
            setLoading(false);
            if (!result.ok) {
              setError(result.error);
              toast.error(result.error);
              return;
            }
            toast.success("Property created as draft");
            router.push(`/admin/properties/${result.data.id}`);
            router.refresh();
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required minLength={2} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="shortDescription">Short description</Label>
              <Textarea id="shortDescription" name="shortDescription" rows={2} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Full description</Label>
              <Textarea id="description" name="description" rows={5} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minPrice">Price from</Label>
              <Input id="minPrice" name="minPrice" type="number" min={0} step="1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" name="currency" defaultValue="AED" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="saleStatus">Sale status</Label>
              <Input
                id="saleStatus"
                name="saleStatus"
                placeholder="On Sale"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="completionLabel">Handover</Label>
              <Input
                id="completionLabel"
                name="completionLabel"
                placeholder="Q4 2028"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="developerId">Developer</Label>
              <select
                id="developerId"
                name="developerId"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Select…</option>
                {developers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="agentId">Listing agent</Label>
              <select
                id="agentId"
                name="agentId"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Select…</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cityId">City / Region</Label>
              <select
                id="cityId"
                name="cityId"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Select…</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="areaId">Area / District</Label>
              <select
                id="areaId"
                name="areaId"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Select…</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="communityId">Community</Label>
              <select
                id="communityId"
                name="communityId"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Select…</option>
                {communities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={loading} className="rounded-lg">
              {loading ? "Creating…" : "Create draft property"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              onClick={() => router.push("/admin/properties")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
