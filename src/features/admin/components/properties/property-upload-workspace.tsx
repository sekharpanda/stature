"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileJson2, FormInput, Upload } from "lucide-react";
import { toast } from "sonner";

import {
  createManualPropertyAction,
  importManualPropertiesJsonAction,
  uploadPropertyImagesAction,
} from "@/actions/properties";
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
import { PROPERTY_JSON_SAMPLE } from "@/schemas/property-upload.schema";
import { cn } from "@/lib/utils";

type Option = { id: string; name: string };

const MUNICIPALITIES = [
  "Dubai Municipality",
  "Abu Dhabi Municipality",
  "Sharjah Municipality",
  "Ajman Municipality",
  "Ras Al Khaimah Municipality",
  "Fujairah Municipality",
  "Umm Al Quwain Municipality",
];

const DUBAI_AREAS = [
  "Downtown Dubai",
  "Business Bay",
  "Dubai Marina",
  "Jumeirah Lake Towers (JLT)",
  "Palm Jumeirah",
  "Dubai Hills Estate",
  "Arabian Ranches",
  "Jumeirah Village Circle (JVC)",
  "Jumeirah Village Triangle (JVT)",
  "Dubai Creek Harbour",
  "City Walk",
  "DIFC",
  "Meydan",
  "MBR City",
  "Dubai South",
  "Al Furjan",
  "Damac Hills",
  "Bluewaters Island",
  "Dubai Harbour",
  "Sobha Hartland",
];

const EMIRATES = [
  "Dubai",
  "Abu Dhabi",
  "Sharjah",
  "Ajman",
  "Ras Al Khaimah",
  "Fujairah",
  "Umm Al Quwain",
];

function Field({
  label,
  htmlFor,
  children,
  hint,
  className,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function selectClass() {
  return "h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 border-t pt-6 first:border-t-0 first:pt-0">
      <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
      {children}
    </section>
  );
}

export function PropertyUploadWorkspace({
  categories,
  propertyTypes,
}: {
  categories: Option[];
  propertyTypes: Option[];
  developers?: Option[];
  areas?: Option[];
  communities?: Option[];
  cities?: Option[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"form" | "json">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [jsonText, setJsonText] = useState(
    () => JSON.stringify(PROPERTY_JSON_SAMPLE, null, 2),
  );
  const [importSummary, setImportSummary] = useState<string | null>(null);

  const samplePretty = useMemo(
    () => JSON.stringify(PROPERTY_JSON_SAMPLE, null, 2),
    [],
  );

  const categoryOptions =
    categories.length > 0
      ? categories
      : [
          { id: "", name: "Residential" },
          { id: "", name: "Commercial" },
          { id: "", name: "Land" },
        ].map((c, i) => ({ id: `fallback-cat-${i}`, name: c.name }));

  const typeOptions =
    propertyTypes.length > 0
      ? propertyTypes
      : ["Apartment", "Villa", "Townhouse", "Plot", "Office"].map((name, i) => ({
          id: `fallback-type-${i}`,
          name,
        }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 rounded-xl border bg-white p-1.5 shadow-sm">
        <button
          type="button"
          onClick={() => setMode("form")}
          className={cn(
            "inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition sm:flex-none",
            mode === "form"
              ? "bg-neutral-900 text-white"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          <FormInput className="size-4" />
          Upload Form
        </button>
        <button
          type="button"
          onClick={() => setMode("json")}
          className={cn(
            "inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition sm:flex-none",
            mode === "json"
              ? "bg-neutral-900 text-white"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          <FileJson2 className="size-4" />
          JSON upload
        </button>
      </div>

      {mode === "form" ? (
        <Card className="card-elevated border-border/80">
          <CardContent className="pt-6">
            <form
              className="space-y-2"
              onSubmit={async (event) => {
                event.preventDefault();
                setLoading(true);
                setError(null);
                const form = new FormData(event.currentTarget);

                let imageUrls: string[] = [];
                if (imageFiles.length > 0) {
                  const uploadData = new FormData();
                  imageFiles.slice(0, 10).forEach((file) => {
                    uploadData.append("images", file);
                  });
                  const uploaded = await uploadPropertyImagesAction(uploadData);
                  if (!uploaded.ok) {
                    setLoading(false);
                    setError(uploaded.error);
                    toast.error(uploaded.error);
                    return;
                  }
                  imageUrls = uploaded.data.urls;
                }

                const categoryId = String(form.get("categoryId") ?? "");
                const propertyTypeId = String(form.get("propertyTypeId") ?? "");
                const categoryName =
                  categoryOptions.find((c) => c.id === categoryId)?.name ||
                  null;
                const propertyTypeName =
                  typeOptions.find((t) => t.id === propertyTypeId)?.name ||
                  null;

                const result = await createManualPropertyAction({
                  status: String(form.get("status") ?? "PUBLISHED"),
                  name: String(form.get("name") ?? ""),
                  categoryId: categoryId.startsWith("fallback-")
                    ? null
                    : categoryId || null,
                  categoryName,
                  propertyTypeId: propertyTypeId.startsWith("fallback-")
                    ? null
                    : propertyTypeId || null,
                  propertyTypeName,
                  unitNumber: String(form.get("unitNumber") ?? "") || null,
                  description: String(form.get("description") ?? "") || null,
                  addressLine: String(form.get("addressLine") ?? "") || null,
                  pinCode: String(form.get("pinCode") ?? "") || null,
                  cityName: String(form.get("cityName") ?? "") || null,
                  countryName: String(form.get("countryName") ?? "") || null,
                  currency: String(form.get("currency") ?? "AED"),
                  price: String(form.get("price") ?? "") || null,
                  bedrooms: String(form.get("bedrooms") ?? "") || null,
                  story: String(form.get("story") ?? "") || null,
                  propertyLocation:
                    String(form.get("propertyLocation") ?? "") || null,
                  marketStatus: String(form.get("marketStatus") ?? "") || null,
                  saleStatus: String(form.get("marketStatus") ?? "") || null,
                  buildingName: String(form.get("buildingName") ?? "") || null,
                  buildings: String(form.get("buildings") ?? "") || null,
                  plottingCode: String(form.get("plottingCode") ?? "") || null,
                  plottingAreaSqFt:
                    String(form.get("plottingAreaSqFt") ?? "") || null,
                  reference: String(form.get("reference") ?? "") || null,
                  previousReference:
                    String(form.get("previousReference") ?? "") || null,
                  purchaseCost: String(form.get("purchaseCost") ?? "") || null,
                  purchasedDate:
                    String(form.get("purchasedDate") ?? "") || null,
                  possessionHandover: form.get("possessionHandover") === "on",
                  handoverDelay: form.get("handoverDelay") === "on",
                  municipalityName:
                    String(form.get("municipalityName") ?? "") || null,
                  propertyTaxId:
                    String(form.get("propertyTaxId") ?? "") || null,
                  vpcNumber: String(form.get("vpcNumber") ?? "") || null,
                  khateNumber: String(form.get("khateNumber") ?? "") || null,
                  governmentComments:
                    String(form.get("governmentComments") ?? "") || null,
                  galleryIllustration:
                    String(form.get("galleryIllustration") ?? "") || null,
                  youtubeUrl: String(form.get("youtubeUrl") ?? "") || null,
                  youtubeTitle: String(form.get("youtubeTitle") ?? "") || null,
                  googleMapsUrl:
                    String(form.get("googleMapsUrl") ?? "") || null,
                  mapEmbedUrl: String(form.get("mapEmbedUrl") ?? "") || null,
                  mapLocation: String(form.get("mapLocation") ?? "") || null,
                  latitude: String(form.get("latitude") ?? "") || null,
                  longitude: String(form.get("longitude") ?? "") || null,
                  emirate: String(form.get("emirate") ?? "") || null,
                  metaTitle: String(form.get("metaTitle") ?? "") || null,
                  metaDescription:
                    String(form.get("metaDescription") ?? "") || null,
                  canonicalUrl: String(form.get("canonicalUrl") ?? "") || null,
                  ogTitle: String(form.get("ogTitle") ?? "") || null,
                  ogDescription:
                    String(form.get("ogDescription") ?? "") || null,
                  twitterTitle: String(form.get("twitterTitle") ?? "") || null,
                  twitterDescription:
                    String(form.get("twitterDescription") ?? "") || null,
                  seoKeywords: String(form.get("seoKeywords") ?? "") || null,
                  imageUrls,
                  coverImageUrl: imageUrls[0] ?? null,
                  amenities: String(form.get("amenities") ?? "") || null,
                });
                setLoading(false);
                if (!result.ok) {
                  setError(result.error);
                  toast.error(result.error);
                  return;
                }
                toast.success("Property uploaded");
                router.push(`/admin/properties/${result.data.id}`);
                router.refresh();
              }}
            >
              <Section title="Property details">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Status" htmlFor="status">
                    <select
                      id="status"
                      name="status"
                      className={selectClass()}
                      defaultValue="PUBLISHED"
                    >
                      <option value="PUBLISHED">Published</option>
                      <option value="DRAFT">Draft</option>
                      <option value="ARCHIVED">Archived</option>
                      <option value="EXPIRED">Expired</option>
                    </select>
                  </Field>
                  <Field label="Name" htmlFor="name">
                    <Input id="name" name="name" required minLength={2} />
                  </Field>
                  <Field label="Property Category" htmlFor="categoryId">
                    <select
                      id="categoryId"
                      name="categoryId"
                      className={selectClass()}
                    >
                      <option value="">Select…</option>
                      {categoryOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Property Type" htmlFor="propertyTypeId">
                    <select
                      id="propertyTypeId"
                      name="propertyTypeId"
                      className={selectClass()}
                    >
                      <option value="">Select…</option>
                      {typeOptions.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Unit Number" htmlFor="unitNumber">
                    <Input id="unitNumber" name="unitNumber" />
                  </Field>
                  <Field
                    label="Description"
                    htmlFor="description"
                    className="md:col-span-2"
                  >
                    <Textarea id="description" name="description" rows={4} />
                  </Field>
                  <Field label="Address" htmlFor="addressLine">
                    <Input
                      id="addressLine"
                      name="addressLine"
                      placeholder="Street / community address"
                    />
                  </Field>
                  <Field
                    label="PO Box (optional)"
                    htmlFor="pinCode"
                    hint="Dubai listings rarely need a PIN — leave blank if unused"
                  >
                    <Input id="pinCode" name="pinCode" placeholder="e.g. 12345" />
                  </Field>
                  <Field label="City / Town" htmlFor="cityName">
                    <Input
                      id="cityName"
                      name="cityName"
                      defaultValue="Dubai"
                    />
                  </Field>
                  <Field label="Emirate" htmlFor="emirate">
                    <select
                      id="emirate"
                      name="emirate"
                      className={selectClass()}
                      defaultValue="Dubai"
                    >
                      {EMIRATES.map((e) => (
                        <option key={e} value={e}>
                          {e}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Country" htmlFor="countryName">
                    <Input
                      id="countryName"
                      name="countryName"
                      defaultValue="United Arab Emirates"
                    />
                  </Field>
                  <Field label="Currency" htmlFor="currency">
                    <select
                      id="currency"
                      name="currency"
                      className={selectClass()}
                      defaultValue="AED"
                    >
                      <option value="AED">AED</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="INR">INR</option>
                    </select>
                  </Field>
                  <Field label="Price (AED)" htmlFor="price">
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      min={0}
                      step="1"
                      placeholder="990283"
                    />
                  </Field>
                  <Field label="Bedrooms" htmlFor="bedrooms">
                    <Input
                      id="bedrooms"
                      name="bedrooms"
                      type="number"
                      min={0}
                      placeholder="Studio = 0"
                    />
                  </Field>
                  <Field label="Floors / Story" htmlFor="story">
                    <Input id="story" name="story" placeholder="e.g. 12" />
                  </Field>
                  <Field label="Community / Area" htmlFor="propertyLocation">
                    <Input
                      id="propertyLocation"
                      name="propertyLocation"
                      list="dubai-areas"
                      placeholder="Business Bay"
                    />
                    <datalist id="dubai-areas">
                      {DUBAI_AREAS.map((a) => (
                        <option key={a} value={a} />
                      ))}
                    </datalist>
                  </Field>
                  <Field label="Market status" htmlFor="marketStatus">
                    <select
                      id="marketStatus"
                      name="marketStatus"
                      className={selectClass()}
                      defaultValue="On Sale"
                    >
                      <option value="On Sale">On Sale</option>
                      <option value="Announced">Announced</option>
                      <option value="Sold Out">Sold Out</option>
                      <option value="Coming Soon">Coming Soon</option>
                    </select>
                  </Field>
                  <Field label="Building Name" htmlFor="buildingName">
                    <Input id="buildingName" name="buildingName" />
                  </Field>
                  <Field label="Buildings" htmlFor="buildings">
                    <Input id="buildings" name="buildings" />
                  </Field>
                  <Field
                    label="Plot / Master plan code"
                    htmlFor="plottingCode"
                  >
                    <Input id="plottingCode" name="plottingCode" />
                  </Field>
                  <Field
                    label="Plot / Unit area (sq ft)"
                    htmlFor="plottingAreaSqFt"
                  >
                    <Input
                      id="plottingAreaSqFt"
                      name="plottingAreaSqFt"
                      type="number"
                      min={0}
                    />
                  </Field>
                </div>
              </Section>

              <Section title="Additional details">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Reference" htmlFor="reference">
                    <Input id="reference" name="reference" />
                  </Field>
                  <Field label="Previous reference" htmlFor="previousReference">
                    <Input id="previousReference" name="previousReference" />
                  </Field>
                  <Field label="Purchase Cost" htmlFor="purchaseCost">
                    <Input
                      id="purchaseCost"
                      name="purchaseCost"
                      type="number"
                      min={0}
                    />
                  </Field>
                  <Field label="Purchased date" htmlFor="purchasedDate">
                    <Input
                      id="purchasedDate"
                      name="purchasedDate"
                      type="date"
                    />
                  </Field>
                  <label className="flex items-center gap-2 text-sm md:col-span-2">
                    <input
                      type="checkbox"
                      name="possessionHandover"
                      className="size-4"
                    />
                    Possession handover
                  </label>
                  <label className="flex items-center gap-2 text-sm md:col-span-2">
                    <input
                      type="checkbox"
                      name="handoverDelay"
                      className="size-4"
                    />
                    Handover delay
                  </label>
                </div>
              </Section>

              <Section title="Government Details">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Municipality name" htmlFor="municipalityName">
                    <select
                      id="municipalityName"
                      name="municipalityName"
                      className={selectClass()}
                      defaultValue="Dubai Municipality"
                    >
                      <option value="">Select…</option>
                      {MUNICIPALITIES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field
                    label="DLD / Property tax ID"
                    htmlFor="propertyTaxId"
                    hint="Dubai Land Department reference when available"
                  >
                    <Input id="propertyTaxId" name="propertyTaxId" />
                  </Field>
                  <Field label="VPC Number" htmlFor="vpcNumber">
                    <Input id="vpcNumber" name="vpcNumber" />
                  </Field>
                  <Field label="Khate number" htmlFor="khateNumber">
                    <Input id="khateNumber" name="khateNumber" />
                  </Field>
                  <Field
                    label="Comments"
                    htmlFor="governmentComments"
                    className="md:col-span-2"
                  >
                    <Textarea
                      id="governmentComments"
                      name="governmentComments"
                      rows={3}
                    />
                  </Field>
                </div>
              </Section>

              <Section title="Media Information">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    label="Upload Image(s)"
                    className="md:col-span-2"
                    hint="Up to 10 photos, 8MB each. First image is used as cover."
                  >
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-10 text-sm text-muted-foreground hover:bg-muted/40">
                      <Upload className="size-6" />
                      <span>
                        {imageFiles.length
                          ? `${imageFiles.length} file(s) selected`
                          : "Click to choose images"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files ?? []).slice(
                            0,
                            10,
                          );
                          setImageFiles(files);
                        }}
                      />
                    </label>
                    {imageFiles.length > 0 ? (
                      <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                        {imageFiles.map((f) => (
                          <li key={f.name + f.size}>{f.name}</li>
                        ))}
                      </ul>
                    ) : null}
                  </Field>
                  <Field
                    label="YouTube URL"
                    htmlFor="youtubeUrl"
                    className="md:col-span-2"
                    hint="Project walkthrough or promo video"
                  >
                    <Input
                      id="youtubeUrl"
                      name="youtubeUrl"
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=…"
                    />
                  </Field>
                  <Field
                    label="YouTube title"
                    htmlFor="youtubeTitle"
                    className="md:col-span-2"
                  >
                    <Input
                      id="youtubeTitle"
                      name="youtubeTitle"
                      placeholder="Project walkthrough"
                    />
                  </Field>
                  <Field
                    label="Gallery Illustration"
                    htmlFor="galleryIllustration"
                    className="md:col-span-2"
                  >
                    <Textarea
                      id="galleryIllustration"
                      name="galleryIllustration"
                      rows={3}
                      placeholder="Notes about gallery images"
                    />
                  </Field>
                </div>
              </Section>

              <Section title="Map & location">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    label="Map location label"
                    htmlFor="mapLocation"
                    className="md:col-span-2"
                  >
                    <Input
                      id="mapLocation"
                      name="mapLocation"
                      placeholder="Business Bay, Dubai, UAE"
                    />
                  </Field>
                  <Field
                    label="Google Maps link"
                    htmlFor="googleMapsUrl"
                    className="md:col-span-2"
                    hint="Share link from Google Maps"
                  >
                    <Input
                      id="googleMapsUrl"
                      name="googleMapsUrl"
                      type="url"
                      placeholder="https://maps.google.com/…"
                    />
                  </Field>
                  <Field
                    label="Map embed URL"
                    htmlFor="mapEmbedUrl"
                    className="md:col-span-2"
                    hint="Optional iframe src from Google Maps → Embed a map"
                  >
                    <Input
                      id="mapEmbedUrl"
                      name="mapEmbedUrl"
                      type="url"
                      placeholder="https://www.google.com/maps/embed?…"
                    />
                  </Field>
                  <Field label="Latitude" htmlFor="latitude">
                    <Input
                      id="latitude"
                      name="latitude"
                      type="number"
                      step="any"
                      placeholder="25.1855"
                    />
                  </Field>
                  <Field label="Longitude" htmlFor="longitude">
                    <Input
                      id="longitude"
                      name="longitude"
                      type="number"
                      step="any"
                      placeholder="55.2739"
                    />
                  </Field>
                </div>
              </Section>

              <Section title="SEO">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    label="Meta title"
                    htmlFor="metaTitle"
                    className="md:col-span-2"
                    hint="Browser / Google title — aim for ~50–60 characters"
                  >
                    <Input
                      id="metaTitle"
                      name="metaTitle"
                      maxLength={120}
                      placeholder="Aura Elite Residences | Business Bay Dubai"
                    />
                  </Field>
                  <Field
                    label="Meta description"
                    htmlFor="metaDescription"
                    className="md:col-span-2"
                    hint="Search snippet — aim for ~150–160 characters"
                  >
                    <Textarea
                      id="metaDescription"
                      name="metaDescription"
                      rows={3}
                      maxLength={320}
                      placeholder="Premium off-plan apartments in Business Bay, Dubai…"
                    />
                  </Field>
                  <Field
                    label="SEO keywords"
                    htmlFor="seoKeywords"
                    className="md:col-span-2"
                    hint="Comma-separated"
                  >
                    <Input
                      id="seoKeywords"
                      name="seoKeywords"
                      placeholder="Business Bay, Dubai off plan, apartments for sale"
                    />
                  </Field>
                  <Field
                    label="Canonical URL"
                    htmlFor="canonicalUrl"
                    className="md:col-span-2"
                  >
                    <Input
                      id="canonicalUrl"
                      name="canonicalUrl"
                      type="url"
                      placeholder="https://yoursite.com/properties/aura-elite"
                    />
                  </Field>
                  <Field label="Open Graph title" htmlFor="ogTitle">
                    <Input
                      id="ogTitle"
                      name="ogTitle"
                      placeholder="Defaults to meta title if empty"
                    />
                  </Field>
                  <Field label="Twitter title" htmlFor="twitterTitle">
                    <Input
                      id="twitterTitle"
                      name="twitterTitle"
                      placeholder="Defaults to OG / meta title"
                    />
                  </Field>
                  <Field
                    label="Open Graph description"
                    htmlFor="ogDescription"
                    className="md:col-span-2"
                  >
                    <Textarea
                      id="ogDescription"
                      name="ogDescription"
                      rows={2}
                      placeholder="Defaults to meta description if empty"
                    />
                  </Field>
                  <Field
                    label="Twitter description"
                    htmlFor="twitterDescription"
                    className="md:col-span-2"
                  >
                    <Textarea
                      id="twitterDescription"
                      name="twitterDescription"
                      rows={2}
                      placeholder="Defaults to OG / meta description"
                    />
                  </Field>
                </div>
              </Section>

              <Section title="Amenities">
                <Field label="Amenities" htmlFor="amenities">
                  <Textarea
                    id="amenities"
                    name="amenities"
                    rows={4}
                    placeholder="Swimming Pool, Gym, Kids Play Area, Concierge"
                  />
                </Field>
              </Section>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <div className="flex flex-wrap gap-2 border-t pt-6">
                <Button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-red-600 text-white hover:bg-red-700"
                >
                  {loading ? "Uploading…" : "Upload Property"}
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
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card className="card-elevated border-border/80">
            <CardHeader>
              <CardTitle className="font-display text-xl">
                Import from JSON
              </CardTitle>
              <CardDescription>
                Paste a single property, an array, or{" "}
                <code className="text-xs">{`{ "properties": [...] }`}</code>.
                Up to 50 records per import.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted">
                  <Upload className="size-4" />
                  Upload .json file
                  <input
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const text = await file.text();
                      setJsonText(text);
                      setImportSummary(null);
                      toast.success(`Loaded ${file.name}`);
                    }}
                  />
                </label>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-lg"
                  onClick={() => {
                    setJsonText(samplePretty);
                    setImportSummary(null);
                  }}
                >
                  Load sample
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-lg"
                  onClick={() => {
                    try {
                      const parsed = JSON.parse(jsonText);
                      setJsonText(JSON.stringify(parsed, null, 2));
                      toast.success("JSON formatted");
                    } catch {
                      toast.error("Invalid JSON — cannot format");
                    }
                  }}
                >
                  Format
                </Button>
              </div>

              <Textarea
                value={jsonText}
                onChange={(e) => {
                  setJsonText(e.target.value);
                  setImportSummary(null);
                }}
                rows={22}
                className="font-mono text-xs leading-relaxed"
                spellCheck={false}
              />

              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              {importSummary ? (
                <p className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                  {importSummary}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={loading}
                  className="rounded-lg bg-red-600 text-white hover:bg-red-700"
                  onClick={async () => {
                    setLoading(true);
                    setError(null);
                    setImportSummary(null);
                    try {
                      const parsed = JSON.parse(jsonText);
                      const result =
                        await importManualPropertiesJsonAction(parsed);
                      setLoading(false);
                      if (!result.ok) {
                        setError(result.error);
                        toast.error(result.error);
                        return;
                      }
                      const { data } = result;
                      setImportSummary(
                        `Imported ${data.imported}, updated ${data.updated}, skipped ${data.skipped}, failed ${data.failed} of ${data.total}`,
                      );
                      if (data.failed > 0) {
                        toast.error(
                          `${data.failed} properties failed — check summary`,
                        );
                      } else {
                        toast.success("JSON import completed");
                      }
                      if (
                        data.results.length === 1 &&
                        data.results[0]?.id &&
                        data.failed === 0
                      ) {
                        router.push(
                          `/admin/properties/${data.results[0].id}`,
                        );
                      }
                      router.refresh();
                    } catch {
                      setLoading(false);
                      setError("Invalid JSON syntax");
                      toast.error("Invalid JSON syntax");
                    }
                  }}
                >
                  {loading ? "Importing…" : "Import JSON"}
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
            </CardContent>
          </Card>

          <Card className="border-border/80 h-fit">
            <CardHeader>
              <CardTitle className="font-display text-xl">JSON guide</CardTitle>
              <CardDescription>
                Same NRI-style fields as the upload form.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Minimum required field: <code className="text-xs">name</code>.
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Address: <code className="text-xs">addressLine</code>,{" "}
                  <code className="text-xs">cityName</code>,{" "}
                  <code className="text-xs">emirate</code>,{" "}
                  <code className="text-xs">propertyLocation</code>
                </li>
                <li>
                  Media: <code className="text-xs">youtubeUrl</code>,{" "}
                  <code className="text-xs">galleryUrls</code>
                </li>
                <li>
                  Map: <code className="text-xs">latitude</code>,{" "}
                  <code className="text-xs">longitude</code>,{" "}
                  <code className="text-xs">googleMapsUrl</code>,{" "}
                  <code className="text-xs">mapEmbedUrl</code>
                </li>
                <li>
                  SEO: <code className="text-xs">metaTitle</code>,{" "}
                  <code className="text-xs">metaDescription</code>,{" "}
                  <code className="text-xs">ogTitle</code>,{" "}
                  <code className="text-xs">seoKeywords</code>
                </li>
                <li>
                  Government: <code className="text-xs">municipalityName</code>,{" "}
                  <code className="text-xs">propertyTaxId</code> (DLD)
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
