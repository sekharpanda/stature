"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createCommunityAction } from "@/actions/catalog";
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

type AreaOption = { id: string; name: string };

export function CreateCommunityForm({
  organizationId,
  areas,
  redirectOnCreate = false,
}: {
  organizationId: string;
  areas: AreaOption[];
  redirectOnCreate?: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [areaId, setAreaId] = useState(areas[0]?.id ?? "");
  const [shortDescription, setShortDescription] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <Card className="card-elevated border-border/80">
      <CardHeader>
        <CardTitle className="font-display text-xl">Add community</CardTitle>
        <CardDescription>
          Link a community to an area for SEO hubs and property filters.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError(null);
            const result = await createCommunityAction({
              organizationId,
              name,
              areaId,
              shortDescription: shortDescription || null,
              metaTitle: metaTitle || null,
              metaDescription: metaDescription || null,
              isPublished: true,
            });
            setLoading(false);
            if (!result.ok) {
              setError(result.error);
              toast.error(result.error);
              return;
            }
            toast.success("Community created");
            const id =
              result.data &&
              typeof result.data === "object" &&
              "id" in result.data
                ? String((result.data as { id: string }).id)
                : null;
            if (redirectOnCreate && id) {
              router.push(`/admin/communities/${id}`);
            } else {
              setName("");
              setShortDescription("");
              router.refresh();
            }
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="community-name">Name</Label>
              <Input
                id="community-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="community-area">Area</Label>
              <select
                id="community-area"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
                required
              >
                <option value="" disabled>
                  Select area
                </option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="community-desc">Short description</Label>
              <Textarea
                id="community-desc"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="community-meta-title">Meta title</Label>
              <Input
                id="community-meta-title"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="community-meta-desc">Meta description</Label>
              <Input
                id="community-meta-desc"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
              />
            </div>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={loading || !areaId}>
            {loading ? "Saving…" : "Create community"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
