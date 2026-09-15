"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Save, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { savePortalListingAction } from "@/actions/portal";
import { ImageUploadField } from "@/features/portal/components/image-upload-field";

export type ListingFormValues = {
  propertyId?: string | null;
  name: string;
  propertyTypeName: string | null;
  categoryName: string | null;
  developerName: string | null;
  cityName: string | null;
  areaName: string | null;
  communityName: string | null;
  addressLine: string | null;
  currency: string | null;
  price: number | null;
  maxPrice: number | null;
  bedrooms: number | null;
  minSize: number | null;
  maxSize: number | null;
  completionLabel: string | null;
  saleStatus: string | null;
  shortDescription: string | null;
  description: string | null;
  amenities: string[];
  coverImageUrl: string | null;
  galleryUrls: string[];
  youtubeUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
};

function text(value: string | number | null | undefined) {
  return value == null ? "" : String(value);
}

export function ListingForm({
  values,
  live,
}: {
  values: ListingFormValues;
  /** A live listing keeps serving the approved version while edits queue up. */
  live: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: values.name ?? "",
    propertyTypeName: text(values.propertyTypeName),
    categoryName: text(values.categoryName),
    developerName: text(values.developerName),
    cityName: text(values.cityName) || "Dubai",
    areaName: text(values.areaName),
    communityName: text(values.communityName),
    addressLine: text(values.addressLine),
    currency: text(values.currency) || "AED",
    price: text(values.price),
    maxPrice: text(values.maxPrice),
    bedrooms: text(values.bedrooms),
    minSize: text(values.minSize),
    maxSize: text(values.maxSize),
    completionLabel: text(values.completionLabel),
    saleStatus: text(values.saleStatus),
    shortDescription: text(values.shortDescription),
    description: text(values.description),
    amenities: values.amenities.join(", "),
    youtubeUrl: text(values.youtubeUrl),
    metaTitle: text(values.metaTitle),
    metaDescription: text(values.metaDescription),
    note: "",
  });
  const [cover, setCover] = useState<string[]>(
    values.coverImageUrl ? [values.coverImageUrl] : [],
  );
  const [gallery, setGallery] = useState<string[]>(values.galleryUrls ?? []);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function save(submit: boolean) {
    startTransition(async () => {
      const result = await savePortalListingAction(
        {
          ...form,
          propertyId: values.propertyId ?? null,
          coverImageUrl: cover[0] ?? null,
          galleryUrls: gallery,
        },
        { submit },
      );

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      if (result.data.mode === "draft") {
        toast.success("Draft saved", {
          description: "Only you and the office can see it until you submit.",
        });
      } else if (result.data.mode === "update-pending") {
        toast.success("Changes sent for approval", {
          description: "Your live listing stays online until they are approved.",
        });
      } else {
        toast.success("Sent for approval", {
          description: "It goes live as soon as a superadmin approves it.",
        });
      }

      router.push(`/admin/my/listings/${result.data.propertyId}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">The property</CardTitle>
          <CardDescription>
            Name, type and location. Anything you leave empty is simply hidden on
            the public page.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">Listing name *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(event) => set("name", event.target.value)}
              placeholder="Aura Elite Residences"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="propertyTypeName">Property type</Label>
            <Input
              id="propertyTypeName"
              value={form.propertyTypeName}
              onChange={(event) => set("propertyTypeName", event.target.value)}
              placeholder="Apartment"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoryName">Category</Label>
            <Input
              id="categoryName"
              value={form.categoryName}
              onChange={(event) => set("categoryName", event.target.value)}
              placeholder="Residential"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="developerName">Developer</Label>
            <Input
              id="developerName"
              value={form.developerName}
              onChange={(event) => set("developerName", event.target.value)}
              placeholder="Emaar"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="saleStatus">Sale status</Label>
            <Input
              id="saleStatus"
              value={form.saleStatus}
              onChange={(event) => set("saleStatus", event.target.value)}
              placeholder="On sale"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cityName">City</Label>
            <Input
              id="cityName"
              value={form.cityName}
              onChange={(event) => set("cityName", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="areaName">Area</Label>
            <Input
              id="areaName"
              value={form.areaName}
              onChange={(event) => set("areaName", event.target.value)}
              placeholder="Business Bay"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="communityName">Community</Label>
            <Input
              id="communityName"
              value={form.communityName}
              onChange={(event) => set("communityName", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressLine">Address</Label>
            <Input
              id="addressLine"
              value={form.addressLine}
              onChange={(event) => set("addressLine", event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">
            Price and size
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              value={form.currency}
              onChange={(event) => set("currency", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price from</Label>
            <Input
              id="price"
              type="number"
              value={form.price}
              onChange={(event) => set("price", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxPrice">Price to</Label>
            <Input
              id="maxPrice"
              type="number"
              value={form.maxPrice}
              onChange={(event) => set("maxPrice", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bedrooms">Bedrooms</Label>
            <Input
              id="bedrooms"
              type="number"
              value={form.bedrooms}
              onChange={(event) => set("bedrooms", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minSize">Size from (sqft)</Label>
            <Input
              id="minSize"
              type="number"
              value={form.minSize}
              onChange={(event) => set("minSize", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxSize">Size to (sqft)</Label>
            <Input
              id="maxSize"
              type="number"
              value={form.maxSize}
              onChange={(event) => set("maxSize", event.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="completionLabel">Handover</Label>
            <Input
              id="completionLabel"
              value={form.completionLabel}
              onChange={(event) => set("completionLabel", event.target.value)}
              placeholder="Q4 2027"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">
            Description and photos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="shortDescription">Summary</Label>
            <Textarea
              id="shortDescription"
              rows={2}
              value={form.shortDescription}
              onChange={(event) => set("shortDescription", event.target.value)}
              placeholder="One or two lines shown on listing cards."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Full description</Label>
            <Textarea
              id="description"
              rows={7}
              value={form.description}
              onChange={(event) => set("description", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amenities">Amenities</Label>
            <Input
              id="amenities"
              value={form.amenities}
              onChange={(event) => set("amenities", event.target.value)}
              placeholder="Swimming pool, Gym, Kids play area"
            />
          </div>
          <ImageUploadField
            label="Cover photo"
            folder="properties"
            mode="single"
            value={cover}
            onChange={setCover}
          />
          <ImageUploadField
            label="Gallery"
            folder="properties"
            mode="multiple"
            value={gallery}
            onChange={setGallery}
            hint="Up to 12 photos at a time."
          />
          <div className="space-y-2">
            <Label htmlFor="youtubeUrl">Video link</Label>
            <Input
              id="youtubeUrl"
              value={form.youtubeUrl}
              onChange={(event) => set("youtubeUrl", event.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">
            {live ? "Send changes for approval" : "Save or submit"}
          </CardTitle>
          <CardDescription>
            {live
              ? "This listing is live. Your edit waits for a superadmin, and the current version stays online in the meantime."
              : "Save a draft to keep working, or submit it for a superadmin to approve and publish."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note">Note for the reviewer (optional)</Label>
            <Textarea
              id="note"
              rows={3}
              value={form.note}
              onChange={(event) => set("note", event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            {live ? null : (
              <Button
                variant="outline"
                disabled={pending}
                onClick={() => save(false)}
              >
                {pending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Save className="mr-2 size-4" />
                )}
                Save draft
              </Button>
            )}
            <Button disabled={pending} onClick={() => save(true)}>
              {pending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Send className="mr-2 size-4" />
              )}
              {live ? "Send changes for approval" : "Submit for approval"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
