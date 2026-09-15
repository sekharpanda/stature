"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  createApiSourceAction,
  deleteApiSourceAction,
  previewApiSourceAction,
  syncApiSourceAction,
} from "@/actions/api-source";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Target =
  | "BLOG"
  | "INSIGHT"
  | "FAQ"
  | "TESTIMONIAL"
  | "DEVELOPER"
  | "AREA"
  | "COMMUNITY"
  | "AGENT"
  | "AMENITY"
  | "PROPERTY"
  | "CATEGORY"
  | "PAGE"
  | "LANDING_PAGE";

type ApiSourceRow = {
  id: string;
  name: string;
  target: Target;
  method: string;
  url: string;
  authType: string;
  hasAuth: boolean;
  itemsPath: string | null;
  fieldMap: Record<string, string>;
  autoPublish: boolean;
  enabled: boolean;
  lastFetchedAt: Date | string | null;
  lastResult: unknown;
};

const TARGET_OPTIONS: Array<{ value: Target; label: string; group: string }> = [
  { value: "PROPERTY", label: "Properties", group: "Inventory" },
  { value: "DEVELOPER", label: "Developers", group: "Inventory" },
  { value: "AREA", label: "Areas", group: "Inventory" },
  { value: "COMMUNITY", label: "Communities", group: "Inventory" },
  { value: "AGENT", label: "Agents", group: "Inventory" },
  { value: "AMENITY", label: "Amenities", group: "Inventory" },
  { value: "CATEGORY", label: "Property categories", group: "Inventory" },
  { value: "BLOG", label: "Blog posts", group: "Content" },
  { value: "INSIGHT", label: "Market insights (blog)", group: "Content" },
  { value: "PAGE", label: "CMS pages", group: "Content" },
  { value: "LANDING_PAGE", label: "Landing pages", group: "Content" },
  { value: "FAQ", label: "FAQs", group: "Content" },
  { value: "TESTIMONIAL", label: "Testimonials", group: "Content" },
];

const DEFAULT_MAPS: Record<Target, Record<string, string>> = {
  BLOG: {
    externalId: "id",
    title: "title",
    slug: "slug",
    excerpt: "excerpt",
    content: "content",
    coverUrl: "coverUrl",
    publishedAt: "publishedAt",
    canonicalUrl: "url",
  },
  INSIGHT: {
    externalId: "id",
    title: "title",
    slug: "slug",
    excerpt: "excerpt",
    content: "content",
    coverUrl: "coverUrl",
    publishedAt: "publishedAt",
    canonicalUrl: "url",
  },
  FAQ: {
    externalId: "id",
    question: "question",
    answer: "answer",
  },
  TESTIMONIAL: {
    externalId: "id",
    authorName: "authorName",
    authorRole: "authorRole",
    content: "content",
    rating: "rating",
  },
  DEVELOPER: {
    externalId: "id",
    name: "name",
    slug: "slug",
    shortDescription: "shortDescription",
    description: "description",
    website: "website",
    email: "email",
    phone: "phone",
    logoUrl: "logoUrl",
  },
  AREA: {
    externalId: "id",
    name: "name",
    slug: "slug",
    cityName: "cityName",
    shortDescription: "shortDescription",
    description: "description",
    latitude: "latitude",
    longitude: "longitude",
  },
  COMMUNITY: {
    externalId: "id",
    name: "name",
    slug: "slug",
    areaName: "areaName",
    shortDescription: "shortDescription",
    description: "description",
  },
  AGENT: {
    externalId: "id",
    name: "name",
    slug: "slug",
    email: "email",
    phone: "phone",
    title: "title",
    bio: "bio",
    photoUrl: "photoUrl",
  },
  AMENITY: {
    externalId: "id",
    name: "name",
    slug: "slug",
    icon: "icon",
    iconUrl: "iconUrl",
  },
  PROPERTY: {
    externalId: "id",
    name: "name",
    slug: "slug",
    description: "description",
    shortDescription: "shortDescription",
    minPrice: "minPrice",
    maxPrice: "maxPrice",
    developerName: "developerName",
    areaName: "areaName",
    coverUrl: "coverUrl",
  },
  CATEGORY: {
    externalId: "id",
    name: "name",
    slug: "slug",
    description: "description",
  },
  PAGE: {
    externalId: "id",
    title: "title",
    slug: "slug",
    excerpt: "excerpt",
    body: "body",
  },
  LANDING_PAGE: {
    externalId: "id",
    title: "title",
    slug: "slug",
    campaign: "campaign",
  },
};

const HINTS: Record<Target, string> = {
  BLOG: "Required: title, content. Optional: slug, excerpt, coverUrl, publishedAt",
  INSIGHT:
    "Writes blog posts shown on /market-insights. Required: title, content",
  FAQ: "Required: question, answer",
  TESTIMONIAL: "Required: authorName, content. Optional: authorRole, rating",
  DEVELOPER: "Required: name. Optional: description, website, logoUrl, email",
  AREA: "Required: name. Optional: cityName (defaults Dubai), description, lat/lng",
  COMMUNITY: "Required: name + areaName (must match an existing area)",
  AGENT: "Required: name. Optional: email, phone, title, bio, photoUrl",
  AMENITY: "Required: name. Optional: icon, iconUrl",
  PROPERTY:
    "Required: name. Optional: prices, developerName, areaName, description",
  CATEGORY: "Required: name. Optional: description",
  PAGE: "Required: title. Optional: slug, excerpt, body",
  LANDING_PAGE: "Required: title. Optional: slug, campaign",
};

function fieldMapToText(map: Record<string, string>) {
  return Object.entries(map)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
}

function textToFieldMap(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}

export function CustomApiSources({ sources }: { sources: ApiSourceRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(sources.length === 0);
  const [preview, setPreview] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [target, setTarget] = useState<Target>("PROPERTY");
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [authType, setAuthType] = useState<"none" | "bearer" | "basic">("none");
  const [authValue, setAuthValue] = useState("");
  const [itemsPath, setItemsPath] = useState("");
  const [fieldMapText, setFieldMapText] = useState(
    fieldMapToText(DEFAULT_MAPS.PROPERTY),
  );
  const [autoPublish, setAutoPublish] = useState(true);
  const [headersText, setHeadersText] = useState("");

  const fieldHints = useMemo(() => HINTS[target], [target]);
  const showPublish = ![
    "FAQ",
    "TESTIMONIAL",
    "AGENT",
    "AMENITY",
    "CATEGORY",
  ].includes(target);

  const inventory = TARGET_OPTIONS.filter((o) => o.group === "Inventory");
  const content = TARGET_OPTIONS.filter((o) => o.group === "Content");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Connect any JSON API and map it into inventory or content — properties,
          developers, areas, insights, and more.
        </p>
        <Button
          type="button"
          variant="outline"
          className="rounded-[3px]"
          onClick={() => setShowForm((v) => !v)}
        >
          <Plus className="mr-2 size-4" />
          {showForm ? "Hide form" : "Add API source"}
        </Button>
      </div>

      {showForm ? (
        <div className="space-y-3 rounded-md border p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="api-name">Name</Label>
              <Input
                id="api-name"
                className="rounded-[3px]"
                placeholder="Developers feed"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="api-target">Integrate into</Label>
              <select
                id="api-target"
                className="flex h-9 w-full rounded-[3px] border border-input bg-transparent px-3 text-sm"
                value={target}
                onChange={(e) => {
                  const next = e.target.value as Target;
                  setTarget(next);
                  setFieldMapText(fieldMapToText(DEFAULT_MAPS[next]));
                }}
              >
                <optgroup label="Inventory">
                  {inventory.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Content">
                  {content.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="api-url">API URL</Label>
              <Input
                id="api-url"
                className="rounded-[3px]"
                placeholder="https://your-api.com/v1/items"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="api-method">Method</Label>
              <select
                id="api-method"
                className="flex h-9 w-full rounded-[3px] border border-input bg-transparent px-3 text-sm"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="api-items">Items path (optional)</Label>
              <Input
                id="api-items"
                className="rounded-[3px]"
                placeholder="data.items or leave blank"
                value={itemsPath}
                onChange={(e) => setItemsPath(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="api-auth-type">Auth</Label>
              <select
                id="api-auth-type"
                className="flex h-9 w-full rounded-[3px] border border-input bg-transparent px-3 text-sm"
                value={authType}
                onChange={(e) =>
                  setAuthType(e.target.value as "none" | "bearer" | "basic")
                }
              >
                <option value="none">None</option>
                <option value="bearer">Bearer token</option>
                <option value="basic">Basic (user:pass)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="api-auth-value">Auth value</Label>
              <Input
                id="api-auth-value"
                type="password"
                className="rounded-[3px]"
                placeholder={
                  authType === "basic" ? "username:password" : "token"
                }
                value={authValue}
                onChange={(e) => setAuthValue(e.target.value)}
                disabled={authType === "none"}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="api-headers">Extra headers (optional)</Label>
              <Textarea
                id="api-headers"
                className="min-h-16 rounded-[3px] font-mono text-xs"
                placeholder={"X-Api-Key=...\nAccept=application/json"}
                value={headersText}
                onChange={(e) => setHeadersText(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="api-map">Field map (websiteField=api.path)</Label>
              <Textarea
                id="api-map"
                className="min-h-28 rounded-[3px] font-mono text-xs"
                value={fieldMapText}
                onChange={(e) => setFieldMapText(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{fieldHints}</p>
            </div>
          </div>

          {showPublish ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 rounded-[2px]"
                checked={autoPublish}
                onChange={(e) => setAutoPublish(e.target.checked)}
              />
              Publish / make live immediately
            </label>
          ) : null}

          <Button
            type="button"
            className="rounded-[3px]"
            disabled={pending || !name.trim() || !url.trim()}
            onClick={() => {
              startTransition(async () => {
                const headers = textToFieldMap(headersText);
                const result = await createApiSourceAction({
                  name: name.trim(),
                  target,
                  method,
                  url: url.trim(),
                  headers,
                  authType,
                  authValue: authType === "none" ? null : authValue.trim(),
                  itemsPath: itemsPath.trim() || null,
                  fieldMap: textToFieldMap(fieldMapText),
                  autoPublish,
                });
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                toast.success("API source saved");
                setShowForm(false);
                setName("");
                setUrl("");
                setAuthValue("");
                router.refresh();
              });
            }}
          >
            Save API source
          </Button>
        </div>
      ) : null}

      {sources.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No custom APIs yet. Add one for developers, areas, properties,
          insights, or any other supported target.
        </p>
      ) : (
        <div className="space-y-3">
          {sources.map((source) => {
            const last = source.lastResult as
              | {
                  imported?: number;
                  updated?: number;
                  fetched?: number;
                  errorCount?: number;
                }
              | null;
            return (
              <div
                key={source.id}
                className="space-y-3 rounded-md border p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{source.name}</p>
                      <Badge variant="outline">{source.target}</Badge>
                      <Badge variant={source.enabled ? "secondary" : "outline"}>
                        {source.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                      {source.method} {source.url}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-[3px]"
                      disabled={pending}
                      onClick={() => {
                        startTransition(async () => {
                          const result = await previewApiSourceAction(
                            source.id,
                          );
                          if (!result.ok) {
                            toast.error(result.error);
                            setPreview(result.error);
                            return;
                          }
                          setPreview(
                            JSON.stringify(
                              {
                                itemCount: result.data.itemCount,
                                sampleKeys: result.data.sampleKeys,
                                mappedPreview: result.data.mappedPreview,
                              },
                              null,
                              2,
                            ),
                          );
                          toast.success(
                            `Preview: ${result.data.itemCount} items`,
                          );
                        });
                      }}
                    >
                      <Eye className="mr-1.5 size-3.5" />
                      Preview
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-[3px]"
                      disabled={pending || !source.enabled}
                      onClick={() => {
                        startTransition(async () => {
                          const result = await syncApiSourceAction(source.id);
                          if (!result.ok) {
                            toast.error(result.error);
                            return;
                          }
                          const d = result.data;
                          toast.success(
                            `Fetched ${d.fetched}: +${d.imported} / ~${d.updated} / skip ${d.skipped}`,
                          );
                          router.refresh();
                        });
                      }}
                    >
                      <RefreshCw
                        className={`mr-1.5 size-3.5 ${pending ? "animate-spin" : ""}`}
                      />
                      Fetch & integrate
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="rounded-[3px] text-destructive"
                      disabled={pending}
                      onClick={() => {
                        startTransition(async () => {
                          const result = await deleteApiSourceAction(source.id);
                          if (!result.ok) {
                            toast.error(result.error);
                            return;
                          }
                          toast.success("API source removed");
                          router.refresh();
                        });
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                {last ? (
                  <p className="text-xs text-muted-foreground">
                    Last run: fetched {last.fetched ?? 0}, imported{" "}
                    {last.imported ?? 0}, updated {last.updated ?? 0}
                    {last.errorCount ? `, errors ${last.errorCount}` : ""}
                    {source.lastFetchedAt
                      ? ` · ${new Date(source.lastFetchedAt).toLocaleString()}`
                      : ""}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {preview ? (
        <pre className="max-h-64 overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
          {preview}
        </pre>
      ) : null}
    </div>
  );
}
