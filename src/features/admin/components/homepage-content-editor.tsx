"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { updateHomepageContentAction } from "@/actions/homepage";
import {
  DEFAULT_HOMEPAGE_LAYOUT,
  DEFAULT_HOMEPAGE_VISIBILITY,
  HOMEPAGE_SECTION_KEYS,
  HOMEPAGE_SECTION_LABELS,
  type HomepageContent,
  type HomepageSectionKey,
} from "@/config/homepage-defaults";
import { type StaticPageContent } from "@/config/page-content-defaults";
import { PublicPagePreview } from "@/features/admin/components/public-page-preview";
import { StaticPageContentEditor } from "@/features/admin/components/static-page-content-editor";
import { isGoogleReviewsTrustItem } from "@/lib/google-reviews-trust";
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

function HomepageLayoutEditor({
  layout,
  visibility,
  onChange,
}: {
  layout: HomepageSectionKey[];
  visibility: Record<HomepageSectionKey, boolean>;
  onChange: (
    layout: HomepageSectionKey[],
    visibility: Record<HomepageSectionKey, boolean>,
  ) => void;
}) {
  const visible = layout.filter((key) => visibility[key] !== false);
  const missing = HOMEPAGE_SECTION_KEYS.filter(
    (key) => !visible.includes(key),
  );

  function move(index: number, delta: number) {
    const next = moveItem(visible, index, delta);
    onChange(next, {
      ...DEFAULT_HOMEPAGE_VISIBILITY,
      ...Object.fromEntries(
        HOMEPAGE_SECTION_KEYS.map((key) => [key, next.includes(key)]),
      ),
    } as Record<HomepageSectionKey, boolean>);
  }

  function remove(key: HomepageSectionKey) {
    const next = visible.filter((item) => item !== key);
    onChange(next, {
      ...visibility,
      [key]: false,
    });
  }

  function add(key: HomepageSectionKey) {
    const next = [...visible, key];
    onChange(next, {
      ...visibility,
      [key]: true,
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Homepage sections</p>
      <div className="space-y-2">
        {visible.map((key, index) => (
          <div
            key={key}
            className="flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-background px-3 py-2"
          >
            <span className="text-sm">{HOMEPAGE_SECTION_LABELS[key]}</span>
            <ItemToolbar
              index={index}
              total={visible.length}
              onMove={(delta) => move(index, delta)}
              onRemove={() => remove(key)}
            />
          </div>
        ))}
      </div>
      {missing.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {missing.map((key) => (
            <Button
              key={key}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => add(key)}
            >
              <Plus className="mr-1.5 size-3.5" />
              {HOMEPAGE_SECTION_LABELS[key]}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function moveItem<T>(list: T[], index: number, delta: number): T[] {
  const next = index + delta;
  if (next < 0 || next >= list.length) return list;
  const copy = [...list];
  const [item] = copy.splice(index, 1);
  copy.splice(next, 0, item!);
  return copy;
}

function ItemToolbar({
  index,
  total,
  onMove,
  onRemove,
}: {
  index: number;
  total: number;
  onMove: (delta: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8"
        disabled={index === 0}
        onClick={() => onMove(-1)}
        aria-label="Move up"
      >
        <ChevronUp className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8"
        disabled={index >= total - 1}
        onClick={() => onMove(1)}
        aria-label="Move down"
      >
        <ChevronDown className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 text-destructive hover:text-destructive"
        onClick={onRemove}
        aria-label="Remove"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

export function HomepageContentEditor({
  organizationId,
  initialContent,
  googleTrust,
}: {
  organizationId: string;
  initialContent: HomepageContent;
  /** Live Google Places rating — shown locked in the trust strip. */
  googleTrust: { value: string; label: string; href?: string };
}) {
  const [content, setContent] = useState<HomepageContent>(() => ({
    ...initialContent,
    // Keep only manually editable trust items in CMS state
    trust: initialContent.trust.filter((item) => !isGoogleReviewsTrustItem(item)),
  }));
  const [loading, setLoading] = useState(false);

  function patchHero<K extends keyof HomepageContent["hero"]>(
    key: K,
    value: HomepageContent["hero"][K],
  ) {
    setContent((c) => ({ ...c, hero: { ...c.hero, [key]: value } }));
  }

  function patchSell<K extends keyof HomepageContent["sellSplit"]>(
    key: K,
    value: HomepageContent["sellSplit"][K],
  ) {
    setContent((c) => ({
      ...c,
      sellSplit: { ...c.sellSplit, [key]: value },
    }));
  }

  function patchInsight<K extends keyof HomepageContent["insight"]>(
    key: K,
    value: HomepageContent["insight"][K],
  ) {
    setContent((c) => ({
      ...c,
      insight: { ...c.insight, [key]: value },
    }));
  }

  function patchFeatured<K extends keyof HomepageContent["featured"]>(
    key: K,
    value: HomepageContent["featured"][K],
  ) {
    setContent((c) => ({
      ...c,
      featured: { ...c.featured, [key]: value },
    }));
  }

  function patchTeam<K extends keyof HomepageContent["team"]>(
    key: K,
    value: HomepageContent["team"][K],
  ) {
    setContent((c) => ({
      ...c,
      team: { ...c.team, [key]: value },
    }));
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: HomepageContent = {
        ...content,
        // Never persist Google reviews — always live from Places API on the site
        trust: content.trust.filter((item) => !isGoogleReviewsTrustItem(item)),
      };
      const result = await updateHomepageContentAction({
        organizationId,
        content: payload,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setContent(payload);
      toast.success("Homepage saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={onSave}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Visual editor — reorder sections, then save. Changes publish
          immediately.
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/" target="_blank" rel="noreferrer">
              Preview site
            </Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Save homepage"}
          </Button>
        </div>
      </div>

      <PublicPagePreview href="/" label="Homepage preview" />

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">
            Layout, visibility & SEO
          </CardTitle>
          <CardDescription>
            Reorder homepage sections like WordPress widgets. Remove a section
            to hide it — copy stays saved. SEO fields become the homepage title
            and description.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>SEO title</Label>
              <Input
                value={content.seo?.title ?? ""}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    seo: {
                      title: e.target.value,
                      description: c.seo?.description ?? "",
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>SEO description</Label>
              <Textarea
                rows={2}
                value={content.seo?.description ?? ""}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    seo: {
                      title: c.seo?.title ?? "",
                      description: e.target.value,
                    },
                  }))
                }
              />
            </div>
          </div>
          <HomepageLayoutEditor
            layout={
              content.layout?.length
                ? content.layout
                : DEFAULT_HOMEPAGE_LAYOUT
            }
            visibility={{
              ...DEFAULT_HOMEPAGE_VISIBILITY,
              ...content.visibility,
            }}
            onChange={(layout, visibility) =>
              setContent((c) => ({ ...c, layout, visibility }))
            }
          />
        </CardContent>
      </Card>

      <StaticPageContentEditor
        organizationId={organizationId}
        heading="Custom homepage widgets"
        href="/"
        hideSave
        blocksOnly
        initialContent={
          {
            eyebrow: "",
            title: "",
            lede: "",
            blocks: content.blocks ?? [],
          } satisfies StaticPageContent
        }
        onChange={(next) =>
          setContent((c) => {
            const blocks = next.blocks;
            const layout = c.layout?.length
              ? c.layout
              : DEFAULT_HOMEPAGE_LAYOUT;
            const modulesOn =
              layout.includes("modules") && c.visibility?.modules !== false;
            if (blocks.length && !modulesOn) {
              return {
                ...c,
                blocks,
                layout: layout.includes("modules")
                  ? layout
                  : [...layout, "modules"],
                visibility: {
                  ...DEFAULT_HOMEPAGE_VISIBILITY,
                  ...c.visibility,
                  modules: true,
                },
              };
            }
            return { ...c, blocks };
          })
        }
      />

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">Hero</CardTitle>
          <CardDescription>First viewport copy and background image.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="hero-eyebrow">Eyebrow</Label>
            <Input
              id="hero-eyebrow"
              value={content.hero.eyebrow}
              onChange={(e) => patchHero("eyebrow", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="hero-title">Title</Label>
            <Input
              id="hero-title"
              value={content.hero.title}
              onChange={(e) => patchHero("title", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="hero-lede">Lede (optional)</Label>
            <Textarea
              id="hero-lede"
              rows={3}
              value={content.hero.lede}
              onChange={(e) => patchHero("lede", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero-image">Image URL</Label>
            <Input
              id="hero-image"
              value={content.hero.imageUrl}
              onChange={(e) => patchHero("imageUrl", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero-placeholder">Search placeholder</Label>
            <Input
              id="hero-placeholder"
              value={content.hero.searchPlaceholder}
              onChange={(e) => patchHero("searchPlaceholder", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="card-elevated border-border/80">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="font-display text-xl">Trust strip</CardTitle>
            <CardDescription>
              Google reviews are live from Places API. Add other stats below.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setContent((c) => ({
                ...c,
                trust: [...c.trust, { value: "0", label: "New stat" }],
              }))
            }
          >
            <Plus className="mr-1 size-3.5" />
            Add item
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                Synced from Google
              </p>
              {googleTrust.href ? (
                <a
                  href={googleTrust.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Open reviews
                </a>
              ) : null}
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">Value</Label>
                <Input value={googleTrust.value} disabled readOnly />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Label</Label>
                <Input value={googleTrust.label} disabled readOnly />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Link</Label>
                <Input value={googleTrust.href ?? ""} disabled readOnly />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Rating and review count update automatically from Google Business
              Profile. Not editable here.
            </p>
          </div>

          {content.trust.map((item, index) => (
            <div
              key={index}
              className="space-y-2 rounded-xl border border-border/70 p-3"
            >
              <ItemToolbar
                index={index}
                total={content.trust.length}
                onMove={(delta) =>
                  setContent((c) => ({
                    ...c,
                    trust: moveItem(c.trust, index, delta),
                  }))
                }
                onRemove={() =>
                  setContent((c) => ({
                    ...c,
                    trust: c.trust.filter((_, i) => i !== index),
                  }))
                }
              />
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Value</Label>
                  <Input
                    value={item.value}
                    onChange={(e) =>
                      setContent((c) => {
                        const trust = [...c.trust];
                        trust[index] = { ...item, value: e.target.value };
                        return { ...c, trust };
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Label</Label>
                  <Input
                    value={item.label}
                    onChange={(e) =>
                      setContent((c) => {
                        const trust = [...c.trust];
                        trust[index] = { ...item, label: e.target.value };
                        return { ...c, trust };
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Link (optional)</Label>
                  <Input
                    value={item.href ?? ""}
                    placeholder="https://…"
                    onChange={(e) =>
                      setContent((c) => {
                        const trust = [...c.trust];
                        trust[index] = {
                          ...item,
                          href: e.target.value || undefined,
                        };
                        return { ...c, trust };
                      })
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="card-elevated border-border/80">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="font-display text-xl">Paths</CardTitle>
            <CardDescription>
              Off-plan / Buy / Rent / Sell cards under the trust strip.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setContent((c) => ({
                ...c,
                paths: {
                  ...c.paths,
                  items: [
                    ...c.paths.items,
                    {
                      n: String(c.paths.items.length + 1).padStart(2, "0"),
                      title: "New path",
                      body: "Short description.",
                      href: "/properties",
                      cta: "Explore →",
                    },
                  ],
                },
              }))
            }
          >
            <Plus className="mr-1 size-3.5" />
            Add path
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Eyebrow</Label>
              <Input
                value={content.paths.eyebrow}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    paths: { ...c.paths, eyebrow: e.target.value },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={content.paths.title}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    paths: { ...c.paths, title: e.target.value },
                  }))
                }
              />
            </div>
          </div>
          {content.paths.items.map((item, index) => (
            <div
              key={index}
              className="space-y-2 rounded-xl border border-border/70 p-3"
            >
              <ItemToolbar
                index={index}
                total={content.paths.items.length}
                onMove={(delta) =>
                  setContent((c) => ({
                    ...c,
                    paths: {
                      ...c.paths,
                      items: moveItem(c.paths.items, index, delta),
                    },
                  }))
                }
                onRemove={() =>
                  setContent((c) => ({
                    ...c,
                    paths: {
                      ...c.paths,
                      items: c.paths.items.filter((_, i) => i !== index),
                    },
                  }))
                }
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Number</Label>
                  <Input
                    value={item.n}
                    onChange={(e) =>
                      setContent((c) => {
                        const items = [...c.paths.items];
                        items[index] = { ...item, n: e.target.value };
                        return { ...c, paths: { ...c.paths, items } };
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Title</Label>
                  <Input
                    value={item.title}
                    onChange={(e) =>
                      setContent((c) => {
                        const items = [...c.paths.items];
                        items[index] = { ...item, title: e.target.value };
                        return { ...c, paths: { ...c.paths, items } };
                      })
                    }
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Body</Label>
                  <Textarea
                    rows={2}
                    value={item.body}
                    onChange={(e) =>
                      setContent((c) => {
                        const items = [...c.paths.items];
                        items[index] = { ...item, body: e.target.value };
                        return { ...c, paths: { ...c.paths, items } };
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Link</Label>
                  <Input
                    value={item.href}
                    onChange={(e) =>
                      setContent((c) => {
                        const items = [...c.paths.items];
                        items[index] = { ...item, href: e.target.value };
                        return { ...c, paths: { ...c.paths, items } };
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">CTA text</Label>
                  <Input
                    value={item.cta}
                    onChange={(e) =>
                      setContent((c) => {
                        const items = [...c.paths.items];
                        items[index] = { ...item, cta: e.target.value };
                        return { ...c, paths: { ...c.paths, items } };
                      })
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">Featured projects</CardTitle>
          <CardDescription>
            Headings for the featured listings strip (properties come from admin
            inventory).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Eyebrow</Label>
            <Input
              value={content.featured.eyebrow}
              onChange={(e) => patchFeatured("eyebrow", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>View all label</Label>
            <Input
              value={content.featured.viewAllLabel}
              onChange={(e) => patchFeatured("viewAllLabel", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Title</Label>
            <Input
              value={content.featured.title}
              onChange={(e) => patchFeatured("title", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Description</Label>
            <Textarea
              rows={2}
              value={content.featured.description}
              onChange={(e) => patchFeatured("description", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>View all link</Label>
            <Input
              value={content.featured.viewAllHref}
              onChange={(e) => patchFeatured("viewAllHref", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>How many cards</Label>
            <Input
              type="number"
              min={1}
              max={12}
              value={content.featured.limit ?? 3}
              onChange={(e) =>
                patchFeatured(
                  "limit",
                  Math.min(12, Math.max(1, Number(e.target.value) || 3)),
                )
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">Sell / valuation</CardTitle>
          <CardDescription>Split section copy and form heading.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Eyebrow</Label>
            <Input
              value={content.sellSplit.eyebrow}
              onChange={(e) => patchSell("eyebrow", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Title</Label>
            <Input
              value={content.sellSplit.title}
              onChange={(e) => patchSell("title", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Body</Label>
            <Textarea
              rows={3}
              value={content.sellSplit.body}
              onChange={(e) => patchSell("body", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>CTA label</Label>
            <Input
              value={content.sellSplit.ctaLabel}
              onChange={(e) => patchSell("ctaLabel", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>CTA href</Label>
            <Input
              value={content.sellSplit.ctaHref}
              onChange={(e) => patchSell("ctaHref", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Form title</Label>
            <Input
              value={content.sellSplit.formTitle}
              onChange={(e) => patchSell("formTitle", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Form note</Label>
            <Input
              value={content.sellSplit.formNote}
              onChange={(e) => patchSell("formNote", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="card-elevated border-border/80">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="font-display text-xl">Areas</CardTitle>
            <CardDescription>
              Fallback community cards when live inventory is empty.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setContent((c) => ({
                ...c,
                areas: {
                  ...c.areas,
                  items: [
                    ...c.areas.items,
                    {
                      name: "New area",
                      subtitle: "Dubai",
                      href: "/properties",
                    },
                  ],
                },
              }))
            }
          >
            <Plus className="mr-1 size-3.5" />
            Add area
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Eyebrow</Label>
              <Input
                value={content.areas.eyebrow}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    areas: { ...c.areas, eyebrow: e.target.value },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={content.areas.title}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    areas: { ...c.areas, title: e.target.value },
                  }))
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Description</Label>
              <Textarea
                rows={2}
                value={content.areas.description}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    areas: { ...c.areas, description: e.target.value },
                  }))
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>View all link</Label>
              <Input
                value={content.areas.viewAllHref}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    areas: { ...c.areas, viewAllHref: e.target.value },
                  }))
                }
              />
            </div>
          </div>
          {content.areas.items.map((item, index) => (
            <div
              key={index}
              className="space-y-2 rounded-xl border border-border/70 p-3"
            >
              <ItemToolbar
                index={index}
                total={content.areas.items.length}
                onMove={(delta) =>
                  setContent((c) => ({
                    ...c,
                    areas: {
                      ...c.areas,
                      items: moveItem(c.areas.items, index, delta),
                    },
                  }))
                }
                onRemove={() =>
                  setContent((c) => ({
                    ...c,
                    areas: {
                      ...c.areas,
                      items: c.areas.items.filter((_, i) => i !== index),
                    },
                  }))
                }
              />
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input
                    value={item.name}
                    onChange={(e) =>
                      setContent((c) => {
                        const items = [...c.areas.items];
                        items[index] = { ...item, name: e.target.value };
                        return { ...c, areas: { ...c.areas, items } };
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Subtitle</Label>
                  <Input
                    value={item.subtitle}
                    onChange={(e) =>
                      setContent((c) => {
                        const items = [...c.areas.items];
                        items[index] = { ...item, subtitle: e.target.value };
                        return { ...c, areas: { ...c.areas, items } };
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Link</Label>
                  <Input
                    value={item.href}
                    onChange={(e) =>
                      setContent((c) => {
                        const items = [...c.areas.items];
                        items[index] = { ...item, href: e.target.value };
                        return { ...c, areas: { ...c.areas, items } };
                      })
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">Team strip</CardTitle>
          <CardDescription>
            Headings for the consultants section (people come from Agents).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Eyebrow</Label>
            <Input
              value={content.team.eyebrow}
              onChange={(e) => patchTeam("eyebrow", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>View all link</Label>
            <Input
              value={content.team.viewAllHref}
              onChange={(e) => patchTeam("viewAllHref", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Title</Label>
            <Input
              value={content.team.title}
              onChange={(e) => patchTeam("title", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Description</Label>
            <Textarea
              rows={2}
              value={content.team.description}
              onChange={(e) => patchTeam("description", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="card-elevated border-border/80">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="font-display text-xl">Market insight</CardTitle>
            <CardDescription>Insight copy and stats row.</CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setContent((c) => ({
                ...c,
                insight: {
                  ...c.insight,
                  stats: [
                    ...c.insight.stats,
                    { value: "0", label: "New stat" },
                  ],
                },
              }))
            }
          >
            <Plus className="mr-1 size-3.5" />
            Add stat
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Eyebrow</Label>
            <Input
              value={content.insight.eyebrow}
              onChange={(e) => patchInsight("eyebrow", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Title</Label>
            <Input
              value={content.insight.title}
              onChange={(e) => patchInsight("title", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Body</Label>
            <Textarea
              rows={3}
              value={content.insight.body}
              onChange={(e) => patchInsight("body", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>CTA label</Label>
            <Input
              value={content.insight.ctaLabel}
              onChange={(e) => patchInsight("ctaLabel", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>CTA href</Label>
            <Input
              value={content.insight.ctaHref}
              onChange={(e) => patchInsight("ctaHref", e.target.value)}
            />
          </div>
          <div className="space-y-3 sm:col-span-2">
            {content.insight.stats.map((stat, index) => (
              <div
                key={index}
                className="space-y-2 rounded-xl border border-border/70 p-3"
              >
                <ItemToolbar
                  index={index}
                  total={content.insight.stats.length}
                  onMove={(delta) =>
                    setContent((c) => ({
                      ...c,
                      insight: {
                        ...c.insight,
                        stats: moveItem(c.insight.stats, index, delta),
                      },
                    }))
                  }
                  onRemove={() =>
                    setContent((c) => ({
                      ...c,
                      insight: {
                        ...c.insight,
                        stats: c.insight.stats.filter((_, i) => i !== index),
                      },
                    }))
                  }
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    value={stat.value}
                    placeholder="Value"
                    onChange={(e) =>
                      setContent((c) => {
                        const stats = [...c.insight.stats];
                        stats[index] = { ...stat, value: e.target.value };
                        return {
                          ...c,
                          insight: { ...c.insight, stats },
                        };
                      })
                    }
                  />
                  <Input
                    value={stat.label}
                    placeholder="Label"
                    onChange={(e) =>
                      setContent((c) => {
                        const stats = [...c.insight.stats];
                        stats[index] = { ...stat, label: e.target.value };
                        return {
                          ...c,
                          insight: { ...c.insight, stats },
                        };
                      })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="card-elevated border-border/80">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="font-display text-xl">SEO link columns</CardTitle>
            <CardDescription>
              Footer SEO columns with heading + links.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setContent((c) => ({
                ...c,
                seoLinks: {
                  ...c.seoLinks,
                  columns: [
                    ...c.seoLinks.columns,
                    {
                      heading: "New column",
                      links: [{ label: "Link", href: "/" }],
                    },
                  ],
                },
              }))
            }
          >
            <Plus className="mr-1 size-3.5" />
            Add column
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Eyebrow</Label>
              <Input
                value={content.seoLinks.eyebrow}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    seoLinks: { ...c.seoLinks, eyebrow: e.target.value },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={content.seoLinks.title}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    seoLinks: { ...c.seoLinks, title: e.target.value },
                  }))
                }
              />
            </div>
          </div>

          {content.seoLinks.columns.map((column, colIndex) => (
            <div
              key={colIndex}
              className="space-y-3 rounded-xl border border-border/70 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label className="text-sm font-semibold">
                  Column {colIndex + 1}
                </Label>
                <ItemToolbar
                  index={colIndex}
                  total={content.seoLinks.columns.length}
                  onMove={(delta) =>
                    setContent((c) => ({
                      ...c,
                      seoLinks: {
                        ...c.seoLinks,
                        columns: moveItem(c.seoLinks.columns, colIndex, delta),
                      },
                    }))
                  }
                  onRemove={() =>
                    setContent((c) => ({
                      ...c,
                      seoLinks: {
                        ...c.seoLinks,
                        columns: c.seoLinks.columns.filter(
                          (_, i) => i !== colIndex,
                        ),
                      },
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Heading</Label>
                <Input
                  value={column.heading}
                  onChange={(e) =>
                    setContent((c) => {
                      const columns = [...c.seoLinks.columns];
                      columns[colIndex] = {
                        ...column,
                        heading: e.target.value,
                      };
                      return {
                        ...c,
                        seoLinks: { ...c.seoLinks, columns },
                      };
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Links</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() =>
                    setContent((c) => {
                      const columns = [...c.seoLinks.columns];
                      columns[colIndex] = {
                        ...column,
                        links: [
                          ...column.links,
                          { label: "New link", href: "/" },
                        ],
                      };
                      return {
                        ...c,
                        seoLinks: { ...c.seoLinks, columns },
                      };
                    })
                  }
                >
                  <Plus className="mr-1 size-3" />
                  Add link
                </Button>
              </div>
              {column.links.map((link, linkIndex) => (
                <div
                  key={linkIndex}
                  className="grid gap-2 rounded-lg border border-dashed border-border/80 p-2 sm:grid-cols-[1fr_1fr_auto]"
                >
                  <Input
                    value={link.label}
                    placeholder="Label"
                    onChange={(e) =>
                      setContent((c) => {
                        const columns = [...c.seoLinks.columns];
                        const links = [...column.links];
                        links[linkIndex] = {
                          ...link,
                          label: e.target.value,
                        };
                        columns[colIndex] = { ...column, links };
                        return {
                          ...c,
                          seoLinks: { ...c.seoLinks, columns },
                        };
                      })
                    }
                  />
                  <Input
                    value={link.href}
                    placeholder="/path"
                    onChange={(e) =>
                      setContent((c) => {
                        const columns = [...c.seoLinks.columns];
                        const links = [...column.links];
                        links[linkIndex] = {
                          ...link,
                          href: e.target.value,
                        };
                        columns[colIndex] = { ...column, links };
                        return {
                          ...c,
                          seoLinks: { ...c.seoLinks, columns },
                        };
                      })
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9 text-destructive"
                    onClick={() =>
                      setContent((c) => {
                        const columns = [...c.seoLinks.columns];
                        columns[colIndex] = {
                          ...column,
                          links: column.links.filter((_, i) => i !== linkIndex),
                        };
                        return {
                          ...c,
                          seoLinks: { ...c.seoLinks, columns },
                        };
                      })
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" asChild>
          <Link href="/" target="_blank" rel="noreferrer">
            Preview site
          </Link>
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : "Save homepage"}
        </Button>
      </div>
    </form>
  );
}
