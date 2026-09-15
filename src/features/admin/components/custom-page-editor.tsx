"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  createCustomPageAction,
  deleteCustomPageAction,
  updateCustomPageAction,
} from "@/actions/custom-pages";
import type { StaticPageContent } from "@/config/page-content-defaults";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StaticPageContentEditor } from "@/features/admin/components/static-page-content-editor";

const EMPTY_CONTENT: StaticPageContent = {
  eyebrow: "Prowin Properties",
  title: "New page",
  lede: "",
  blocks: [],
};

export function CustomPageEditor({
  organizationId,
  page,
}: {
  organizationId: string;
  page?: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    workflowState: string;
    content: StaticPageContent;
  };
}) {
  const router = useRouter();
  const isNew = !page;
  const [title, setTitle] = useState(page?.title ?? "New page");
  const [slug, setSlug] = useState(page?.slug ?? "");
  const [excerpt, setExcerpt] = useState(page?.excerpt ?? "");
  const [metaTitle, setMetaTitle] = useState(page?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(
    page?.metaDescription ?? "",
  );
  const [publish, setPublish] = useState(page?.workflowState === "PUBLISHED");
  const [content, setContent] = useState(page?.content ?? EMPTY_CONTENT);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    try {
      const payload = {
        organizationId,
        title,
        slug: slug || title,
        excerpt,
        metaTitle,
        metaDescription,
        content: { ...content, title: content.title || title },
        publish,
      };
      const result = isNew
        ? await createCustomPageAction(payload)
        : await updateCustomPageAction({ ...payload, id: page.id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(publish ? "Page published" : "Draft saved");
      if (isNew && "id" in result.data) {
        router.push(`/admin/pages/${result.data.id}`);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    if (!page) return;
    if (!window.confirm("Delete this page? It will leave the public site.")) {
      return;
    }
    setLoading(true);
    try {
      const result = await deleteCustomPageAction({
        organizationId,
        id: page.id,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Page deleted");
      router.push("/admin/pages");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Admin title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>URL slug</Label>
          <Input
            value={slug}
            placeholder="careers"
            onChange={(e) => setSlug(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Live at /{slugifyPreview(slug || title)}
          </p>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Short summary</Label>
          <Input
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Optional — used in admin lists"
          />
        </div>
        <div className="space-y-2">
          <Label>SEO title</Label>
          <Input
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            placeholder={title}
          />
        </div>
        <div className="space-y-2">
          <Label>SEO description</Label>
          <Textarea
            rows={2}
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={publish}
            onChange={(e) => setPublish(e.target.checked)}
          />
          Publish on the website
        </label>
        <div className="flex justify-end gap-2">
          {page ? (
            <Button
              type="button"
              variant="outline"
              className="text-destructive"
              disabled={loading}
              onClick={() => void remove()}
            >
              Delete
            </Button>
          ) : null}
          <Button disabled={loading} onClick={() => void save()}>
            {loading ? "Saving…" : isNew ? "Create page" : "Save page"}
          </Button>
        </div>
      </div>

      <StaticPageContentEditor
        organizationId={organizationId}
        heading={title || "Page content"}
        href={`/${slugifyPreview(slug || title)}`}
        initialContent={content}
        onChange={setContent}
        hideSave
      />
    </div>
  );
}

function slugifyPreview(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .replace(/[^a-z0-9/-]+/g, "-")
    .replace(/-+/g, "-");
}
