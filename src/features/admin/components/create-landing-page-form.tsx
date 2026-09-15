"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";

import {
  createLandingPageAction,
  updateLandingPageAction,
  uploadMediaLibraryAction,
} from "@/actions/cms";
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
import { PublicPagePreview } from "@/features/admin/components/public-page-preview";
import { StaticPageContentEditor } from "@/features/admin/components/static-page-content-editor";
import {
  landingPageAbsoluteUrl,
  landingPagePath,
  slugifyLandingTitle,
} from "@/lib/landing-page-url";
import {
  DEFAULT_LANDING_CAMPAIGN,
  defaultLandingBlocks,
  parseCampaignConfig,
  type LandingCampaignConfig,
} from "@/types/landing-campaign";
import { cn } from "@/lib/utils";

function Field({
  label,
  children,
  hint,
  className,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">{children}</CardContent>
    </Card>
  );
}

export function LandingPageEditor({
  organizationId,
  mode,
  initial,
}: {
  organizationId: string;
  mode: "create" | "edit";
  initial?: {
    id: string;
    title: string;
    slug: string;
    campaign: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    workflowState: string;
    campaignConfig?: unknown;
  };
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [campaign, setCampaign] = useState(initial?.campaign ?? "");
  const [metaTitle, setMetaTitle] = useState(initial?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(
    initial?.metaDescription ?? "",
  );
  const [config, setConfig] = useState<LandingCampaignConfig>(() => {
    if (initial?.campaignConfig) {
      return parseCampaignConfig(initial.campaignConfig);
    }
    return parseCampaignConfig({
      ...DEFAULT_LANDING_CAMPAIGN,
      blocks: defaultLandingBlocks(),
    });
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function patch<K extends keyof LandingCampaignConfig>(
    key: K,
    value: LandingCampaignConfig[K],
  ) {
    setConfig((c) => ({ ...c, [key]: value }));
  }

  async function submit(publish: boolean) {
    setLoading(true);
    setError(null);
    const payload = {
      title: title || config.hero.headline,
      slug: slug || null,
      campaign: campaign || null,
      metaTitle: metaTitle || config.hero.headline || null,
      metaDescription: metaDescription || null,
      campaignConfig: config,
      publish,
      unpublish: !publish && mode === "edit",
    };

    const result =
      mode === "create"
        ? await createLandingPageAction({ organizationId, ...payload })
        : await updateLandingPageAction({ id: initial!.id, ...payload });

    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success(publish ? "Landing page published" : "Draft saved");
    router.push(`/admin/landing-pages/${result.data.id}`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-gradient-to-r from-[#0A2E20] to-[#163D2C] px-5 py-4 text-white">
        <div>
          <p className="text-xs tracking-[0.18em] text-[#C4A47C] uppercase">
            Campaign builder
          </p>
          <p className="mt-1 text-sm text-white/80">
            WordPress-style builder for Google Ads. Publish to
            /dubai-projects/project-name.
          </p>
        </div>
        {mode === "edit" && initial ? (
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary" size="sm" className="rounded-lg">
              <a
                href={`/preview/campaigns/${initial.id}`}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="mr-1.5 size-3.5" />
                Preview
              </a>
            </Button>
            {initial.workflowState === "PUBLISHED" ? (
              <Button asChild variant="secondary" size="sm" className="rounded-lg">
                <a
                  href={landingPagePath(initial.slug)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Live page
                </a>
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <SectionCard
        title="Basics & SEO"
        description="Page identity and search metadata"
      >
        <Field label="Internal title" className="md:col-span-2">
          <Input
            value={title}
            onChange={(e) => {
              const next = e.target.value;
              setTitle(next);
              if (!slugTouched) setSlug(slugifyLandingTitle(next));
            }}
            required
            minLength={3}
            placeholder="Business Bay Residences"
          />
        </Field>
        <Field label="Campaign name (Ads)">
          <Input
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            placeholder="Google Ads · Business Bay Q3"
          />
        </Field>
        <Field
          label="Project URL name"
          hint="Live address after publish"
        >
          <Input
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugifyLandingTitle(e.target.value) || e.target.value);
            }}
            placeholder="business-bay-residences"
          />
        </Field>
        <Field label="Public URL" className="md:col-span-2">
          <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm break-all">
            {landingPageAbsoluteUrl(slug || "project-name")}
          </p>
        </Field>
        <Field label="Brand name">
          <Input
            value={config.brandName}
            onChange={(e) => patch("brandName", e.target.value)}
          />
        </Field>
        <Field label="Brand tagline (under name)">
          <Input
            value={config.brandTagline}
            onChange={(e) => patch("brandTagline", e.target.value)}
            placeholder="BY PROWIN | DUBAI"
          />
        </Field>
        <Field
          label="Project / brand logo"
          className="md:col-span-2"
          hint="Shown in the header and footer. Upload PNG/SVG with transparent background for best results."
        >
          <div className="flex flex-wrap items-start gap-4">
            {config.logoUrl ? (
              <div className="relative flex h-20 w-40 items-center justify-center overflow-hidden rounded-lg border bg-muted/40 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={config.logoUrl}
                  alt="Logo preview"
                  className="max-h-full max-w-full object-contain"
                />
                <button
                  type="button"
                  className="absolute top-1 right-1 rounded bg-black/70 px-1.5 text-[10px] text-white"
                  onClick={() => patch("logoUrl", "")}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex h-20 w-40 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
                No logo yet
              </div>
            )}
            <div className="flex min-w-[220px] flex-1 flex-col gap-2">
              <Input
                value={config.logoUrl}
                onChange={(e) => patch("logoUrl", e.target.value)}
                placeholder="https://…/logo.png or upload below"
              />
              <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted">
                Upload logo
                <input
                  type="file"
                  accept="image/*,.svg"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const data = new FormData();
                    data.append("files", file);
                    const result = await uploadMediaLibraryAction(data);
                    if (!result.ok) {
                      toast.error(result.error);
                      return;
                    }
                    const url = result.data.urls[0];
                    if (url) {
                      patch("logoUrl", url);
                      toast.success("Logo uploaded");
                    }
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>
        </Field>
        <Field label="Phone">
          <Input
            value={config.phone}
            onChange={(e) => patch("phone", e.target.value)}
          />
        </Field>
        <Field label="WhatsApp (with country code)">
          <Input
            value={config.whatsapp}
            onChange={(e) => patch("whatsapp", e.target.value)}
            placeholder="+9715…"
          />
        </Field>
        <Field label="Office / project address" className="md:col-span-2">
          <Input
            value={config.address}
            onChange={(e) => patch("address", e.target.value)}
            placeholder="Business Bay, Dubai, UAE"
          />
        </Field>
        <Field label="Meta title" className="md:col-span-2">
          <Input
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            placeholder="Defaults to hero headline"
          />
        </Field>
        <Field label="Meta description" className="md:col-span-2">
          <Textarea
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            rows={2}
          />
        </Field>
        <Field label="SEO keywords" className="md:col-span-2">
          <Input
            value={config.seoKeywords}
            onChange={(e) => patch("seoKeywords", e.target.value)}
            placeholder="Dubai off plan, Business Bay…"
          />
        </Field>
      </SectionCard>

      {mode === "edit" && initial?.workflowState === "PUBLISHED" && slug ? (
        <PublicPagePreview
          href={landingPagePath(slug)}
          label="Live landing page"
        />
      ) : null}

      <StaticPageContentEditor
        organizationId={organizationId}
        heading="Page builder"
        href={slug ? landingPagePath(slug) : "/dubai-projects"}
        hideSave
        blocksOnly
        initialContent={{
          eyebrow: "",
          title: "",
          lede: "",
          blocks: config.blocks ?? [],
        }}
        onChange={(next) => patch("blocks", next.blocks)}
      />

      <SectionCard
        title="Hero"
        description="Full-bleed image, headline, bullets and lead form"
      >
        <Field label="Headline" className="md:col-span-2">
          <Input
            value={config.hero.headline}
            onChange={(e) =>
              patch("hero", { ...config.hero, headline: e.target.value })
            }
          />
        </Field>
        <Field label="Gold eyebrow tag">
          <Input
            value={config.hero.eyebrow}
            onChange={(e) =>
              patch("hero", { ...config.hero, eyebrow: e.target.value })
            }
            placeholder="Phase 1 · Launching soon"
          />
        </Field>
        <Field label="Sub-headline (location line)">
          <Input
            value={config.hero.subheadline}
            onChange={(e) =>
              patch("hero", { ...config.hero, subheadline: e.target.value })
            }
            placeholder="Business Bay · Canal Front · Downtown"
          />
        </Field>
        <Field
          label="Feature bullets (one per line — shown as 2-column diamond grid)"
          className="md:col-span-2"
          hint="Aim for 6 bullets for the best layout"
        >
          <Textarea
            value={config.hero.bullets}
            onChange={(e) =>
              patch("hero", { ...config.hero, bullets: e.target.value })
            }
            rows={6}
          />
        </Field>
        <Field
          label="Hero image"
          className="md:col-span-2"
          hint="Full-bleed aerial / project photo. Upload or paste URL."
        >
          <div className="space-y-3">
            <Input
              value={config.hero.imageUrl}
              onChange={(e) =>
                patch("hero", { ...config.hero, imageUrl: e.target.value })
              }
              placeholder="https://…/hero.jpg"
            />
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted">
                Upload hero image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const data = new FormData();
                    data.append("files", file);
                    const result = await uploadMediaLibraryAction(data);
                    if (!result.ok) {
                      toast.error(result.error);
                      return;
                    }
                    const url = result.data.urls[0];
                    if (url) {
                      patch("hero", { ...config.hero, imageUrl: url });
                      toast.success("Hero image uploaded");
                    }
                    e.target.value = "";
                  }}
                />
              </label>
              {config.hero.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={config.hero.imageUrl}
                  alt="Hero preview"
                  className="h-14 w-24 rounded border object-cover"
                />
              ) : null}
            </div>
          </div>
        </Field>
        <Field label="Primary CTA label">
          <Input
            value={config.hero.primaryCta.label}
            onChange={(e) =>
              patch("hero", {
                ...config.hero,
                primaryCta: {
                  ...config.hero.primaryCta,
                  label: e.target.value,
                },
              })
            }
          />
        </Field>
        <Field label="Primary CTA link">
          <Input
            value={config.hero.primaryCta.href}
            onChange={(e) =>
              patch("hero", {
                ...config.hero,
                primaryCta: {
                  ...config.hero.primaryCta,
                  href: e.target.value,
                },
              })
            }
          />
        </Field>
        <Field label="Secondary CTA label">
          <Input
            value={config.hero.secondaryCta.label}
            onChange={(e) =>
              patch("hero", {
                ...config.hero,
                secondaryCta: {
                  ...config.hero.secondaryCta,
                  label: e.target.value,
                },
              })
            }
          />
        </Field>
        <Field label="Lead form title">
          <Input
            value={config.hero.formTitle}
            onChange={(e) =>
              patch("hero", { ...config.hero, formTitle: e.target.value })
            }
          />
        </Field>
        <Field label="Form submit button">
          <Input
            value={config.hero.formSubmitLabel}
            onChange={(e) =>
              patch("hero", {
                ...config.hero,
                formSubmitLabel: e.target.value,
              })
            }
            placeholder="Get brochure & pricing →"
          />
        </Field>
        <Field label="Form subtitle" className="md:col-span-2">
          <Input
            value={config.hero.formSubtitle}
            onChange={(e) =>
              patch("hero", { ...config.hero, formSubtitle: e.target.value })
            }
          />
        </Field>
        <Field label="Form submit button label (legacy leadForm)">
          <Input
            value={config.leadForm.submitLabel}
            onChange={(e) =>
              patch("leadForm", {
                ...config.leadForm,
                submitLabel: e.target.value,
              })
            }
            placeholder="Get brochure & pricing →"
          />
        </Field>
      </SectionCard>

      <SectionCard
        title="Overview"
        description="Story section with architecture imagery"
      >
        <Field label="Eyebrow label">
          <Input
            value={config.overview.eyebrow}
            onChange={(e) =>
              patch("overview", {
                ...config.overview,
                eyebrow: e.target.value,
              })
            }
            placeholder="About the project"
          />
        </Field>
        <Field label="CTA label">
          <Input
            value={config.overview.ctaLabel}
            onChange={(e) =>
              patch("overview", {
                ...config.overview,
                ctaLabel: e.target.value,
              })
            }
          />
        </Field>
        <Field label="Title" className="md:col-span-2">
          <Input
            value={config.overview.title}
            onChange={(e) =>
              patch("overview", { ...config.overview, title: e.target.value })
            }
          />
        </Field>
        <Field
          label="Body (blank line = new paragraph)"
          className="md:col-span-2"
        >
          <Textarea
            value={config.overview.body}
            onChange={(e) =>
              patch("overview", { ...config.overview, body: e.target.value })
            }
            rows={5}
          />
        </Field>
        <Field label="Image URL" className="md:col-span-2">
          <Input
            value={config.overview.imageUrl}
            onChange={(e) =>
              patch("overview", {
                ...config.overview,
                imageUrl: e.target.value,
              })
            }
          />
        </Field>
      </SectionCard>

      <SectionCard
        title="Investment band"
        description="Stats, bar charts and comparison table (dark green section)"
      >
        <Field label="Section title" className="md:col-span-2">
          <Input
            value={config.investment.title}
            onChange={(e) =>
              patch("investment", {
                ...config.investment,
                title: e.target.value,
              })
            }
          />
        </Field>
        {config.stats.map((stat, index) => (
          <div key={index} className="grid gap-2 md:col-span-1">
            <Field label={`Stat ${index + 1} value`}>
              <Input
                value={stat.value}
                onChange={(e) => {
                  const stats = [...config.stats];
                  stats[index] = { ...stat, value: e.target.value };
                  patch("stats", stats);
                }}
              />
            </Field>
            <Field label="Label">
              <Input
                value={stat.label}
                onChange={(e) => {
                  const stats = [...config.stats];
                  stats[index] = { ...stat, label: e.target.value };
                  patch("stats", stats);
                }}
              />
            </Field>
          </div>
        ))}
        {config.investment.charts.map((chart, index) => (
          <div
            key={index}
            className="grid gap-2 rounded-lg border p-3 md:col-span-1"
          >
            <Field label={`Chart ${index + 1} title`}>
              <Input
                value={chart.title}
                onChange={(e) => {
                  const charts = [...config.investment.charts];
                  charts[index] = { ...chart, title: e.target.value };
                  patch("investment", { ...config.investment, charts });
                }}
              />
            </Field>
            <Field
              label="Bars (one per line: Year:value)"
              hint="e.g. 2020:980"
            >
              <Textarea
                value={chart.bars}
                onChange={(e) => {
                  const charts = [...config.investment.charts];
                  charts[index] = { ...chart, bars: e.target.value };
                  patch("investment", { ...config.investment, charts });
                }}
                rows={5}
              />
            </Field>
          </div>
        ))}
        <Field
          label="Table headers (pipe-separated)"
          className="md:col-span-2"
          hint="e.g. Metric|Business Bay|Downtown|Marina"
        >
          <Input
            value={config.investment.tableHeaders}
            onChange={(e) =>
              patch("investment", {
                ...config.investment,
                tableHeaders: e.target.value,
              })
            }
          />
        </Field>
        <Field
          label="Table rows (one per line, cells pipe-separated)"
          className="md:col-span-2"
        >
          <Textarea
            value={config.investment.tableRows}
            onChange={(e) =>
              patch("investment", {
                ...config.investment,
                tableRows: e.target.value,
              })
            }
            rows={5}
          />
        </Field>
      </SectionCard>

      <SectionCard
        title="Location & map"
        description="Connectivity list, Google Map embed and nearby POIs"
      >
        <Field label="Section title" className="md:col-span-2">
          <Input
            value={config.location.title}
            onChange={(e) =>
              patch("location", { ...config.location, title: e.target.value })
            }
          />
        </Field>
        <Field
          label="Connectivity points (one per line)"
          className="md:col-span-2"
        >
          <Textarea
            value={config.location.points}
            onChange={(e) =>
              patch("location", { ...config.location, points: e.target.value })
            }
            rows={4}
          />
        </Field>
        <Field label="Map embed URL" className="md:col-span-2">
          <Input
            value={config.location.mapEmbedUrl}
            onChange={(e) =>
              patch("location", {
                ...config.location,
                mapEmbedUrl: e.target.value,
              })
            }
            placeholder="https://www.google.com/maps/embed?…"
          />
        </Field>
        <Field label="Google Maps link" className="md:col-span-2">
          <Input
            value={config.location.googleMapsUrl}
            onChange={(e) =>
              patch("location", {
                ...config.location,
                googleMapsUrl: e.target.value,
              })
            }
          />
        </Field>
        <Field
          label="Nearby (one per line)"
          className="md:col-span-2"
          hint="e.g. Healthcare — City Hospital 6 mins"
        >
          <Textarea
            value={config.location.nearby}
            onChange={(e) =>
              patch("location", { ...config.location, nearby: e.target.value })
            }
            rows={4}
          />
        </Field>
      </SectionCard>

      <SectionCard title="Pricing cards" description="Unit configurations">
        {config.pricing.map((plan, index) => (
          <div
            key={index}
            className="grid gap-2 rounded-lg border p-3 md:col-span-1"
          >
            <Field label="Name">
              <Input
                value={plan.name}
                onChange={(e) => {
                  const pricing = [...config.pricing];
                  pricing[index] = { ...plan, name: e.target.value };
                  patch("pricing", pricing);
                }}
              />
            </Field>
            <Field label="Size">
              <Input
                value={plan.size}
                onChange={(e) => {
                  const pricing = [...config.pricing];
                  pricing[index] = { ...plan, size: e.target.value };
                  patch("pricing", pricing);
                }}
              />
            </Field>
            <Field label="Price">
              <Input
                value={plan.price}
                onChange={(e) => {
                  const pricing = [...config.pricing];
                  pricing[index] = { ...plan, price: e.target.value };
                  patch("pricing", pricing);
                }}
              />
            </Field>
            <Field label="CTA label">
              <Input
                value={plan.ctaLabel}
                onChange={(e) => {
                  const pricing = [...config.pricing];
                  pricing[index] = { ...plan, ctaLabel: e.target.value };
                  patch("pricing", pricing);
                }}
              />
            </Field>
          </div>
        ))}
      </SectionCard>

      <SectionCard
        title="Floor plans grid"
        description="Six configuration cards under Plans"
      >
        {config.floorPlans.map((plan, index) => (
          <div
            key={index}
            className="grid gap-2 rounded-lg border p-3 md:col-span-1"
          >
            <Field label={`Plan ${index + 1} name`}>
              <Input
                value={plan.name}
                onChange={(e) => {
                  const floorPlans = [...config.floorPlans];
                  floorPlans[index] = { ...plan, name: e.target.value };
                  patch("floorPlans", floorPlans);
                }}
              />
            </Field>
            <Field label="Size">
              <Input
                value={plan.size}
                onChange={(e) => {
                  const floorPlans = [...config.floorPlans];
                  floorPlans[index] = { ...plan, size: e.target.value };
                  patch("floorPlans", floorPlans);
                }}
              />
            </Field>
            <Field label="Price">
              <Input
                value={plan.price}
                onChange={(e) => {
                  const floorPlans = [...config.floorPlans];
                  floorPlans[index] = { ...plan, price: e.target.value };
                  patch("floorPlans", floorPlans);
                }}
              />
            </Field>
          </div>
        ))}
      </SectionCard>

      <SectionCard
        title="Why invest & amenities"
        description="Numbered advantages list and amenity icon grid"
      >
        {config.highlights.map((h, index) => (
          <div key={index} className="grid gap-2 md:col-span-1">
            <Field label={`Highlight ${index + 1} title`}>
              <Input
                value={h.title}
                onChange={(e) => {
                  const highlights = [...config.highlights];
                  highlights[index] = { ...h, title: e.target.value };
                  patch("highlights", highlights);
                }}
              />
            </Field>
            <Field label="Points (one per line)">
              <Textarea
                value={h.points}
                onChange={(e) => {
                  const highlights = [...config.highlights];
                  highlights[index] = { ...h, points: e.target.value };
                  patch("highlights", highlights);
                }}
                rows={3}
              />
            </Field>
          </div>
        ))}
        <Field
          label="Amenities (comma or line separated)"
          className="md:col-span-2"
        >
          <Textarea
            value={config.amenities}
            onChange={(e) => patch("amenities", e.target.value)}
            rows={3}
          />
        </Field>
      </SectionCard>

      <SectionCard
        title="Media — gallery & YouTube"
        description="Upload multiple gallery images or paste URLs; add a walkthrough video"
      >
        <Field label="Gallery section title" className="md:col-span-2">
          <Input
            value={config.media.galleryTitle}
            onChange={(e) =>
              patch("media", {
                ...config.media,
                galleryTitle: e.target.value,
              })
            }
            placeholder="Glimpse of the lifestyle"
          />
        </Field>
        <Field
          label="Gallery image URLs (one per line)"
          className="md:col-span-2"
          hint="Or upload files below — uploaded URLs are appended automatically"
        >
          <Textarea
            value={config.media.galleryUrls.join("\n")}
            onChange={(e) => {
              const galleryUrls = e.target.value
                .split("\n")
                .map((u) => u.trim())
                .filter(Boolean);
              patch("media", {
                ...config.media,
                galleryUrls,
                galleryImageUrl: galleryUrls[0] ?? "",
              });
            }}
            rows={5}
            placeholder={"https://…/1.jpg\nhttps://…/2.jpg"}
          />
        </Field>
        <div className="md:col-span-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted">
            Upload gallery images
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={async (e) => {
                const files = Array.from(e.target.files ?? []);
                if (!files.length) return;
                const data = new FormData();
                files.forEach((f) => data.append("files", f));
                const result = await uploadMediaLibraryAction(data);
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                const galleryUrls = [
                  ...config.media.galleryUrls,
                  ...result.data.urls,
                ];
                patch("media", {
                  ...config.media,
                  galleryUrls,
                  galleryImageUrl: galleryUrls[0] ?? "",
                });
                toast.success(`Added ${result.data.urls.length} image(s)`);
                e.target.value = "";
              }}
            />
          </label>
          {config.media.galleryUrls.length ? (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {config.media.galleryUrls.map((url) => (
                <div key={url} className="relative overflow-hidden rounded border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="aspect-square object-cover" />
                  <button
                    type="button"
                    className="absolute top-1 right-1 rounded bg-black/70 px-1.5 text-[10px] text-white"
                    onClick={() => {
                      const galleryUrls = config.media.galleryUrls.filter(
                        (u) => u !== url,
                      );
                      patch("media", {
                        ...config.media,
                        galleryUrls,
                        galleryImageUrl: galleryUrls[0] ?? "",
                      });
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <Field label="YouTube URL" className="md:col-span-2">
          <Input
            value={config.media.youtubeUrl}
            onChange={(e) =>
              patch("media", { ...config.media, youtubeUrl: e.target.value })
            }
            placeholder="https://www.youtube.com/watch?v=…"
          />
        </Field>
      </SectionCard>

      <SectionCard
        title="Lead form API"
        description="Send enquiries to an external CRM webhook, or leave API URL empty to use Prowin leads"
      >
        <Field
          label="API URL"
          className="md:col-span-2"
          hint="Example: https://hooks.zapier.com/... or your CRM endpoint"
        >
          <Input
            value={config.leadForm.apiUrl}
            onChange={(e) =>
              patch("leadForm", { ...config.leadForm, apiUrl: e.target.value })
            }
            placeholder="https://…"
          />
        </Field>
        <Field label="API key / token">
          <Input
            value={config.leadForm.apiKey}
            onChange={(e) =>
              patch("leadForm", { ...config.leadForm, apiKey: e.target.value })
            }
            type="password"
            autoComplete="off"
          />
        </Field>
        <Field label="Key header">
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={config.leadForm.apiKeyHeader}
            onChange={(e) =>
              patch("leadForm", {
                ...config.leadForm,
                apiKeyHeader: e.target.value as
                  | "Authorization"
                  | "X-Api-Key"
                  | "X-API-KEY"
                  | "api-key",
              })
            }
          >
            <option value="X-Api-Key">X-Api-Key</option>
            <option value="X-API-KEY">X-API-KEY</option>
            <option value="Authorization">Authorization (Bearer)</option>
            <option value="api-key">api-key</option>
          </select>
        </Field>
        <Field label="HTTP method">
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={config.leadForm.method}
            onChange={(e) =>
              patch("leadForm", {
                ...config.leadForm,
                method: e.target.value as "POST" | "PUT",
              })
            }
          >
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
          </select>
        </Field>
        <Field
          label="Extra headers (key: value per line)"
          className="md:col-span-2"
        >
          <Textarea
            value={config.leadForm.extraHeaders}
            onChange={(e) =>
              patch("leadForm", {
                ...config.leadForm,
                extraHeaders: e.target.value,
              })
            }
            rows={3}
            placeholder={"X-Tenant: dubai\nX-Source: campaign"}
            className="font-mono text-xs"
          />
        </Field>
      </SectionCard>

      <SectionCard
        title="Thank you page"
        description="Shown after a successful lead at /dubai-projects/[project]/thank-you"
      >
        <Field label="Title" className="md:col-span-2">
          <Input
            value={config.leadForm.thankYouTitle}
            onChange={(e) =>
              patch("leadForm", {
                ...config.leadForm,
                thankYouTitle: e.target.value,
              })
            }
          />
        </Field>
        <Field label="Message" className="md:col-span-2">
          <Textarea
            value={config.leadForm.thankYouMessage}
            onChange={(e) =>
              patch("leadForm", {
                ...config.leadForm,
                thankYouMessage: e.target.value,
              })
            }
            rows={3}
          />
        </Field>
        <Field label="Image URL" className="md:col-span-2">
          <Input
            value={config.leadForm.thankYouImageUrl}
            onChange={(e) =>
              patch("leadForm", {
                ...config.leadForm,
                thankYouImageUrl: e.target.value,
              })
            }
          />
        </Field>
        <Field label="Optional redirect URL">
          <Input
            value={config.leadForm.thankYouRedirectUrl}
            onChange={(e) =>
              patch("leadForm", {
                ...config.leadForm,
                thankYouRedirectUrl: e.target.value,
              })
            }
            placeholder="https://… or leave blank"
          />
        </Field>
        <Field label="Redirect after (seconds)">
          <Input
            type="number"
            min={0}
            value={config.leadForm.thankYouRedirectSeconds}
            onChange={(e) =>
              patch("leadForm", {
                ...config.leadForm,
                thankYouRedirectSeconds: Number(e.target.value) || 0,
              })
            }
          />
        </Field>
      </SectionCard>

      <SectionCard
        title="Google Ads & tracking"
        description="Paste Google tag / Ads snippets. Conversion fires on successful form submit when ID + label are set."
      >
        <Field
          label="Google Ads / gtag head code"
          className="md:col-span-2"
          hint="Paste the full <script> block from Google Ads / Tag Manager"
        >
          <Textarea
            value={config.tracking.googleAdsHeadCode}
            onChange={(e) =>
              patch("tracking", {
                ...config.tracking,
                googleAdsHeadCode: e.target.value,
              })
            }
            rows={6}
            className="font-mono text-xs"
            placeholder={"<!-- Google tag (gtag.js) -->\n<script>…</script>"}
          />
        </Field>
        <Field label="Conversion ID" hint="e.g. AW-123456789">
          <Input
            value={config.tracking.conversionId}
            onChange={(e) =>
              patch("tracking", {
                ...config.tracking,
                conversionId: e.target.value,
              })
            }
            placeholder="AW-…"
          />
        </Field>
        <Field label="Conversion label">
          <Input
            value={config.tracking.conversionLabel}
            onChange={(e) =>
              patch("tracking", {
                ...config.tracking,
                conversionLabel: e.target.value,
              })
            }
          />
        </Field>
        <Field
          label="Google Ads body / noscript (optional)"
          className="md:col-span-2"
        >
          <Textarea
            value={config.tracking.googleAdsBodyCode}
            onChange={(e) =>
              patch("tracking", {
                ...config.tracking,
                googleAdsBodyCode: e.target.value,
              })
            }
            rows={3}
            className="font-mono text-xs"
          />
        </Field>
        <Field label="Extra head code" className="md:col-span-2">
          <Textarea
            value={config.tracking.customHeadCode}
            onChange={(e) =>
              patch("tracking", {
                ...config.tracking,
                customHeadCode: e.target.value,
              })
            }
            rows={3}
            className="font-mono text-xs"
            placeholder="Meta Pixel, etc."
          />
        </Field>
        <Field label="Extra body code" className="md:col-span-2">
          <Textarea
            value={config.tracking.customBodyCode}
            onChange={(e) =>
              patch("tracking", {
                ...config.tracking,
                customBodyCode: e.target.value,
              })
            }
            rows={3}
            className="font-mono text-xs"
          />
        </Field>
      </SectionCard>

      <SectionCard title="Final CTA" description="Closing conversion band">
        <Field label="Headline" className="md:col-span-2">
          <Input
            value={config.finalCta.headline}
            onChange={(e) =>
              patch("finalCta", {
                ...config.finalCta,
                headline: e.target.value,
              })
            }
          />
        </Field>
        <Field label="Button label">
          <Input
            value={config.finalCta.buttonLabel}
            onChange={(e) =>
              patch("finalCta", {
                ...config.finalCta,
                buttonLabel: e.target.value,
              })
            }
          />
        </Field>
        <Field label="Background image URL">
          <Input
            value={config.finalCta.backgroundImageUrl}
            onChange={(e) =>
              patch("finalCta", {
                ...config.finalCta,
                backgroundImageUrl: e.target.value,
              })
            }
          />
        </Field>
      </SectionCard>

      <SectionCard title="FAQs" description="Trust-building Q&A">
        {config.faqs.map((faq, index) => (
          <div key={index} className="grid gap-2 md:col-span-2">
            <Field label={`Question ${index + 1}`}>
              <Input
                value={faq.question}
                onChange={(e) => {
                  const faqs = [...config.faqs];
                  faqs[index] = { ...faq, question: e.target.value };
                  patch("faqs", faqs);
                }}
              />
            </Field>
            <Field label="Answer">
              <Textarea
                value={faq.answer}
                onChange={(e) => {
                  const faqs = [...config.faqs];
                  faqs[index] = { ...faq, answer: e.target.value };
                  patch("faqs", faqs);
                }}
                rows={2}
              />
            </Field>
          </div>
        ))}
      </SectionCard>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="sticky bottom-4 z-20 flex flex-wrap gap-2 rounded-xl border bg-white/95 p-3 shadow-lg backdrop-blur">
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => void submit(false)}
        >
          {loading ? "Saving…" : "Save draft"}
        </Button>
        <Button
          type="button"
          disabled={loading}
          className="bg-[#0A2E20] hover:bg-[#163D2C]"
          onClick={() => void submit(true)}
        >
          {loading ? "Saving…" : "Publish live"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/landing-pages")}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function CreateLandingPageForm({
  organizationId,
}: {
  organizationId: string;
}) {
  return <LandingPageEditor organizationId={organizationId} mode="create" />;
}

export function sectionConfigString(
  config: unknown,
  key: string,
): string | undefined {
  if (!config || typeof config !== "object") return undefined;
  const value = (config as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}
