"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { updatePageContentAction } from "@/actions/page-content";
import { PublicPagePreview } from "@/features/admin/components/public-page-preview";
import {
  BLOCK_PALETTE,
  STATIC_PAGE_META,
  createEmptyBlock,
  isWidgetBlock,
  type PageBlock,
  type PageBlockType,
  type StaticPageContent,
  type StaticPageKey,
} from "@/config/page-content-defaults";
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
import { cn } from "@/lib/utils";

function SortableBlockCard({
  block,
  index,
  total,
  onChange,
  onRemove,
  onDuplicate,
  onMove,
}: {
  block: PageBlock;
  index: number;
  total: number;
  onChange: (next: PageBlock) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onMove: (delta: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const typeLabel =
    BLOCK_PALETTE.find((p) => p.type === block.type)?.label ?? block.type;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-xl border border-border/80 bg-background shadow-sm",
        isDragging && "z-10 opacity-90 ring-2 ring-primary/30",
      )}
    >
      <div className="flex items-center gap-2 border-b border-border/70 px-3 py-2">
        <button
          type="button"
          className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {typeLabel}
        </span>
        <div className="ml-auto flex items-center gap-1">
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
            className="size-8"
            onClick={onDuplicate}
            aria-label="Duplicate"
          >
            <Copy className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-destructive hover:text-destructive"
            onClick={onRemove}
            aria-label="Delete block"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {block.type === "spacer" ? (
          <div className="space-y-2">
            <Label>Height (px)</Label>
            <Input
              type="number"
              min={16}
              max={240}
              value={block.height ?? 48}
              onChange={(e) =>
                onChange({ ...block, height: Number(e.target.value) || 48 })
              }
            />
          </div>
        ) : null}

        {block.type !== "spacer" ? (
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={block.title ?? ""}
              onChange={(e) => onChange({ ...block, title: e.target.value })}
              placeholder="Section title"
            />
          </div>
        ) : null}

        {block.type !== "spacer" ? (
          <div className="grid gap-3 rounded-lg border border-dashed border-border/80 p-3 sm:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">Background</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                value={block.bg ?? "none"}
                onChange={(e) =>
                  onChange({
                    ...block,
                    bg: e.target.value as PageBlock["bg"],
                  })
                }
              >
                <option value="none">None</option>
                <option value="white">White</option>
                <option value="mist">Mist</option>
                <option value="ink">Dark</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Padding</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                value={block.padY ?? "md"}
                onChange={(e) =>
                  onChange({
                    ...block,
                    padY: e.target.value as PageBlock["padY"],
                  })
                }
              >
                <option value="sm">Tight</option>
                <option value="md">Normal</option>
                <option value="lg">Roomy</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Align</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                value={block.align ?? "left"}
                onChange={(e) =>
                  onChange({
                    ...block,
                    align: e.target.value as PageBlock["align"],
                  })
                }
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Width</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                value={block.width ?? "wide"}
                onChange={(e) =>
                  onChange({
                    ...block,
                    width: e.target.value as PageBlock["width"],
                  })
                }
              >
                <option value="wide">Wide</option>
                <option value="narrow">Narrow</option>
              </select>
            </div>
          </div>
        ) : null}

        {(block.type === "text" ||
          block.type === "cta" ||
          block.type === "split" ||
          isWidgetBlock(block.type)) && (
          <div className="space-y-2">
            <Label>Body</Label>
            <Textarea
              rows={4}
              value={block.body ?? ""}
              onChange={(e) => onChange({ ...block, body: e.target.value })}
              placeholder="Write the section copy…"
            />
          </div>
        )}

        {block.type === "image" || block.type === "split" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Image URL</Label>
              <Input
                value={block.imageUrl ?? ""}
                onChange={(e) =>
                  onChange({ ...block, imageUrl: e.target.value })
                }
                placeholder="/media/… or https://…"
              />
            </div>
            <div className="space-y-2">
              <Label>Alt text</Label>
              <Input
                value={block.alt ?? ""}
                onChange={(e) => onChange({ ...block, alt: e.target.value })}
              />
            </div>
            {block.type === "split" ? (
              <>
                <div className="space-y-2">
                  <Label>Photo side</Label>
                  <select
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={block.imageSide ?? "left"}
                    onChange={(e) =>
                      onChange({
                        ...block,
                        imageSide: e.target.value as PageBlock["imageSide"],
                      })
                    }
                  >
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Button label</Label>
                  <Input
                    value={block.buttonLabel ?? ""}
                    onChange={(e) =>
                      onChange({ ...block, buttonLabel: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Button link</Label>
                  <Input
                    value={block.buttonHref ?? ""}
                    onChange={(e) =>
                      onChange({ ...block, buttonHref: e.target.value })
                    }
                  />
                </div>
              </>
            ) : null}
          </div>
        ) : null}

        {isWidgetBlock(block.type) && block.type !== "form" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {block.type === "listings" || block.type === "map" ? (
              <>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Search / community</Label>
                  <Input
                    value={block.query ?? ""}
                    onChange={(e) =>
                      onChange({ ...block, query: e.target.value })
                    }
                    placeholder="JVC, Emaar, Business Bay…"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Inventory</Label>
                  <select
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={block.completion ?? "all"}
                    onChange={(e) =>
                      onChange({
                        ...block,
                        completion: e.target.value as PageBlock["completion"],
                      })
                    }
                  >
                    <option value="all">All listings</option>
                    <option value="off-plan">Off-plan</option>
                    <option value="ready">Ready</option>
                  </select>
                </div>
                <label className="flex items-end gap-2 pb-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(block.featuredOnly)}
                    onChange={(e) =>
                      onChange({ ...block, featuredOnly: e.target.checked })
                    }
                  />
                  Featured only
                </label>
              </>
            ) : null}
            <div className="space-y-2">
              <Label>How many</Label>
              <Input
                type="number"
                min={1}
                max={block.type === "map" ? 200 : 24}
                value={block.limit ?? (block.type === "map" ? 80 : 6)}
                onChange={(e) =>
                  onChange({
                    ...block,
                    limit: Number(e.target.value) || 6,
                  })
                }
              />
            </div>
            {block.type === "listings" ? (
              <div className="space-y-2">
                <Label>Layout</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={block.layout ?? "grid"}
                  onChange={(e) =>
                    onChange({
                      ...block,
                      layout: e.target.value as PageBlock["layout"],
                    })
                  }
                >
                  <option value="grid">Grid</option>
                  <option value="list">List</option>
                </select>
              </div>
            ) : null}
            {block.type === "listings" ||
            block.type === "team" ||
            block.type === "blog" ||
            block.type === "areas" ||
            block.type === "developers" ? (
              <>
                <div className="space-y-2">
                  <Label>View-all label</Label>
                  <Input
                    value={block.buttonLabel ?? ""}
                    onChange={(e) =>
                      onChange({ ...block, buttonLabel: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>View-all link</Label>
                  <Input
                    value={block.buttonHref ?? ""}
                    onChange={(e) =>
                      onChange({ ...block, buttonHref: e.target.value })
                    }
                    placeholder="/properties"
                  />
                </div>
              </>
            ) : null}
          </div>
        ) : null}

        {block.type === "cta" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Button label</Label>
              <Input
                value={block.buttonLabel ?? ""}
                onChange={(e) =>
                  onChange({ ...block, buttonLabel: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Button link</Label>
              <Input
                value={block.buttonHref ?? ""}
                onChange={(e) =>
                  onChange({ ...block, buttonHref: e.target.value })
                }
                placeholder="/contact"
              />
            </div>
          </div>
        ) : null}

        {block.type === "columns" || block.type === "stats" ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>
                {block.type === "stats" ? "Stat items" : "Column cards"}
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => {
                  const items = [...(block.items ?? [])];
                  items.push(
                    block.type === "stats"
                      ? { value: "0", label: "Label" }
                      : { title: "New card", body: "Short text." },
                  );
                  onChange({ ...block, items });
                }}
              >
                <Plus className="mr-1 size-3.5" />
                Add item
              </Button>
            </div>
            {(block.items ?? []).map((item, itemIndex) => (
              <div
                key={itemIndex}
                className="space-y-2 rounded-lg border border-dashed border-border/80 p-3"
              >
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive"
                    onClick={() => {
                      const items = (block.items ?? []).filter(
                        (_, i) => i !== itemIndex,
                      );
                      onChange({ ...block, items });
                    }}
                  >
                    Remove
                  </Button>
                </div>
                {block.type === "stats" ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      value={item.value ?? ""}
                      placeholder="Value"
                      onChange={(e) => {
                        const items = [...(block.items ?? [])];
                        items[itemIndex] = {
                          ...item,
                          value: e.target.value,
                        };
                        onChange({ ...block, items });
                      }}
                    />
                    <Input
                      value={item.label ?? ""}
                      placeholder="Label"
                      onChange={(e) => {
                        const items = [...(block.items ?? [])];
                        items[itemIndex] = {
                          ...item,
                          label: e.target.value,
                        };
                        onChange({ ...block, items });
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <Input
                      value={item.title ?? ""}
                      placeholder="Card title"
                      onChange={(e) => {
                        const items = [...(block.items ?? [])];
                        items[itemIndex] = {
                          ...item,
                          title: e.target.value,
                        };
                        onChange({ ...block, items });
                      }}
                    />
                    <Textarea
                      rows={2}
                      value={item.body ?? ""}
                      placeholder="Card body"
                      onChange={(e) => {
                        const items = [...(block.items ?? [])];
                        items[itemIndex] = {
                          ...item,
                          body: e.target.value,
                        };
                        onChange({ ...block, items });
                      }}
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function StaticPageContentEditor({
  organizationId,
  pageKey,
  initialContent,
  previewHref,
  heading,
  href: hrefProp,
  onChange,
  hideSave,
  blocksOnly,
}: {
  organizationId: string;
  pageKey?: StaticPageKey;
  initialContent: StaticPageContent;
  previewHref?: string;
  heading?: string;
  href?: string;
  onChange?: (content: StaticPageContent) => void;
  hideSave?: boolean;
  /** Only the block palette — used on the homepage custom-widgets slot. */
  blocksOnly?: boolean;
}) {
  const meta = pageKey ? STATIC_PAGE_META[pageKey] : null;
  const href = hrefProp ?? previewHref ?? meta?.href ?? "/";
  const [content, setContentState] = useState(initialContent);
  const [loading, setLoading] = useState(false);

  function setContent(
    next: StaticPageContent | ((prev: StaticPageContent) => StaticPageContent),
  ) {
    setContentState((prev) => {
      const value = typeof next === "function" ? next(prev) : next;
      onChange?.(value);
      return value;
    });
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const blockIds = useMemo(
    () => content.blocks.map((b) => b.id),
    [content.blocks],
  );

  function patchBlock(id: string, next: PageBlock) {
    setContent((c) => ({
      ...c,
      blocks: c.blocks.map((b) => (b.id === id ? next : b)),
    }));
  }

  function addBlock(type: PageBlockType) {
    setContent((c) => ({
      ...c,
      blocks: [...c.blocks, createEmptyBlock(type)],
    }));
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setContent((c) => {
      const oldIndex = c.blocks.findIndex((b) => b.id === active.id);
      const newIndex = c.blocks.findIndex((b) => b.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return c;
      return { ...c, blocks: arrayMove(c.blocks, oldIndex, newIndex) };
    });
  }

  async function save() {
    if (!pageKey) return;
    setLoading(true);
    try {
      const result = await updatePageContentAction({
        organizationId,
        key: pageKey,
        content,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`${meta?.label ?? "Page"} saved`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card
      id={pageKey ? `page-${pageKey}` : undefined}
      className="scroll-mt-24 border-border/80 shadow-sm"
    >
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="font-display text-xl">
            {heading ?? meta?.label ?? "Page"}
          </CardTitle>
          <CardDescription className="mt-1">
            {blocksOnly
              ? "Drop listings, a map, team, FAQs or a form onto the homepage. Then add “Custom widgets” in the layout list."
              : `Visual builder for ${href} — drag blocks, set spacing, then Save.`}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={href} target="_blank">
              Preview
            </Link>
          </Button>
          {hideSave ? null : (
            <Button size="sm" disabled={loading} onClick={() => void save()}>
              {loading ? "Saving…" : "Save"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {blocksOnly ? null : (
        <div className="grid gap-4 rounded-xl border border-border/70 bg-muted/20 p-4 sm:grid-cols-3">
          <div className="space-y-2 sm:col-span-1">
            <Label>Eyebrow</Label>
            <Input
              value={content.eyebrow}
              onChange={(e) =>
                setContent((c) => ({ ...c, eyebrow: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Page title</Label>
            <Input
              value={content.title}
              onChange={(e) =>
                setContent((c) => ({ ...c, title: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2 sm:col-span-3">
            <Label>Intro</Label>
            <Textarea
              rows={2}
              value={content.lede}
              onChange={(e) =>
                setContent((c) => ({ ...c, lede: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2 sm:col-span-1">
            <Label>SEO title</Label>
            <Input
              value={content.metaTitle ?? ""}
              onChange={(e) =>
                setContent((c) => ({ ...c, metaTitle: e.target.value }))
              }
              placeholder={content.title}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>SEO description</Label>
            <Textarea
              rows={2}
              value={content.metaDescription ?? ""}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  metaDescription: e.target.value,
                }))
              }
            />
          </div>
        </div>
        )}

        {blocksOnly ? null : <PublicPagePreview href={href} />}

        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">Content blocks</p>
              <p className="text-xs text-muted-foreground">
                Add widgets like Elementor sections, then drag to reorder.
              </p>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {BLOCK_PALETTE.map((item) => (
              <Button
                key={item.type}
                type="button"
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={() => addBlock(item.type)}
                title={item.description}
              >
                <Plus className="mr-1.5 size-3.5" />
                {item.label}
              </Button>
            ))}
          </div>

          {content.blocks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              No blocks yet. Add text, or drop in a listings grid, map, team,
              FAQs, blog or lead form.
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
            >
              <SortableContext
                items={blockIds}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {content.blocks.map((block, index) => (
                    <SortableBlockCard
                      key={block.id}
                      block={block}
                      index={index}
                      total={content.blocks.length}
                      onChange={(next) => patchBlock(block.id, next)}
                      onRemove={() =>
                        setContent((c) => ({
                          ...c,
                          blocks: c.blocks.filter((b) => b.id !== block.id),
                        }))
                      }
                      onDuplicate={() =>
                        setContent((c) => {
                          const copy = createEmptyBlock(block.type);
                          const next = {
                            ...block,
                            id: copy.id,
                          };
                          const blocks = [...c.blocks];
                          blocks.splice(index + 1, 0, next);
                          return { ...c, blocks };
                        })
                      }
                      onMove={(delta) =>
                        setContent((c) => {
                          const to = index + delta;
                          if (to < 0 || to >= c.blocks.length) return c;
                          return {
                            ...c,
                            blocks: arrayMove(c.blocks, index, to),
                          };
                        })
                      }
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
