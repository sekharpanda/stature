"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ExternalLink,
  Eye,
  ImagePlus,
  Search,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import {
  createBlogPostAction,
  updateBlogPostAction,
  uploadMediaLibraryAction,
} from "@/actions/cms";
import { BlogRichTextEditor } from "@/features/admin/components/blog-rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { blogHtmlToPlainText } from "@/lib/blog-html";

function parseCover(content: string | null | undefined) {
  if (!content) return { coverUrl: "", body: "" };
  const match = content.match(/^<!--cover:(.*?)-->\n?([\s\S]*)$/);
  if (!match) return { coverUrl: "", body: content };
  return { coverUrl: match[1] ?? "", body: match[2] ?? "" };
}

function wordCount(html: string) {
  const t = blogHtmlToPlainText(html);
  if (!t) return 0;
  return t.split(/\s+/).length;
}

export function BlogPostEditor({
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
    excerpt: string | null;
    content: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    canonicalUrl: string | null;
    workflowState: string;
  };
}) {
  const router = useRouter();
  const parsed = parseCover(initial?.content);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [content, setContent] = useState(parsed.body);
  const [coverUrl, setCoverUrl] = useState(parsed.coverUrl);
  const [metaTitle, setMetaTitle] = useState(initial?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(
    initial?.metaDescription ?? "",
  );
  const [canonicalUrl, setCanonicalUrl] = useState(
    initial?.canonicalUrl ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [seoOpen, setSeoOpen] = useState(
    Boolean(initial?.metaTitle || initial?.metaDescription || initial?.canonicalUrl),
  );

  const stats = useMemo(() => {
    const words = wordCount(content);
    const mins = Math.max(1, Math.ceil(words / 200));
    return { words, mins, chars: content.length };
  }, [content]);

  const status = initial?.workflowState ?? "DRAFT";
  const isPublished = status === "PUBLISHED";

  async function submit(publish: boolean) {
    setLoading(true);
    setError(null);
    const payload = {
      title,
      slug: slug || null,
      excerpt: excerpt || null,
      content: content || null,
      coverUrl: coverUrl || null,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      canonicalUrl: canonicalUrl || null,
      publish,
      ...(publish ? {} : { workflowState: "DRAFT" as const }),
    };

    const result =
      mode === "create"
        ? await createBlogPostAction({ organizationId, ...payload })
        : await updateBlogPostAction({
            id: initial!.id,
            ...payload,
            workflowState: publish ? "PUBLISHED" : "DRAFT",
          });

    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success(publish ? "Post published" : "Draft saved");
    router.push(`/admin/blog/${result.data.id}`);
    router.refresh();
  }

  async function onUploadCover(file: File) {
    setUploading(true);
    const data = new FormData();
    data.append("files", file);
    const result = await uploadMediaLibraryAction(data);
    setUploading(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    const url = result.data.urls[0];
    if (url) setCoverUrl(url);
    toast.success("Cover uploaded");
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        void submit(false);
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={isPublished ? "default" : "secondary"}
            className={
              isPublished
                ? "bg-emerald-600 hover:bg-emerald-600"
                : "bg-amber-100 text-amber-900 hover:bg-amber-100"
            }
          >
            {mode === "create" ? "New draft" : status}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {stats.words} words · ~{stats.mins} min read
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {mode === "edit" && slug ? (
            <Button asChild type="button" variant="ghost" size="sm">
              <Link href={`/blog/${slug}`} target="_blank">
                <Eye className="mr-1.5 size-4" />
                View live
              </Link>
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading || uploading}
            onClick={() => router.push("/admin/blog")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={loading || uploading}
          >
            {loading ? "Saving…" : "Save draft"}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={loading || uploading}
            onClick={() => void submit(true)}
          >
            {loading ? "Saving…" : "Publish"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card className="overflow-hidden border-border/80 shadow-sm">
            <CardContent className="space-y-5 p-6 md:p-8">
              <div className="space-y-2">
                <Label htmlFor="blog-title" className="sr-only">
                  Title
                </Label>
                <Input
                  id="blog-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  minLength={3}
                  placeholder="Article title"
                  className="h-auto border-0 bg-transparent px-0 py-1 font-display text-3xl font-semibold shadow-none focus-visible:ring-0 md:text-4xl"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <div className="space-y-2">
                  <Label htmlFor="blog-slug" className="text-muted-foreground">
                    URL slug
                  </Label>
                  <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3">
                    <span className="shrink-0 text-xs text-muted-foreground">
                      /blog/
                    </span>
                    <Input
                      id="blog-slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="auto-from-title"
                      className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="blog-excerpt">Excerpt</Label>
                <Textarea
                  id="blog-excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={2}
                  placeholder="Short summary shown on the blog listing and social cards…"
                  className="resize-none bg-muted/20"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <CardTitle className="text-base font-semibold">
                Article body
              </CardTitle>
              <CardDescription>
                Format text, change fonts, and insert images from the toolbar.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <BlogRichTextEditor
                value={content}
                onChange={setContent}
                disabled={loading || uploading}
              />
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Search className="size-4 text-muted-foreground" />
                  SEO
                </CardTitle>
                <CardDescription className="mt-1">
                  Search title, description, and canonical URL.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSeoOpen((v) => !v)}
              >
                {seoOpen ? "Hide" : "Edit"}
              </Button>
            </CardHeader>
            {seoOpen ? (
              <CardContent className="space-y-4 border-t pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="blog-meta-title">Meta title</Label>
                    <span className="text-xs text-muted-foreground">
                      {(metaTitle || title).length}/70
                    </span>
                  </div>
                  <Input
                    id="blog-meta-title"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder={title || "Defaults to article title"}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="blog-meta-desc">Meta description</Label>
                    <span className="text-xs text-muted-foreground">
                      {(metaDescription || excerpt).length}/160
                    </span>
                  </div>
                  <Textarea
                    id="blog-meta-desc"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    rows={3}
                    placeholder={excerpt || "Defaults to excerpt"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blog-canonical">Canonical URL</Label>
                  <Input
                    id="blog-canonical"
                    value={canonicalUrl}
                    onChange={(e) => setCanonicalUrl(e.target.value)}
                    type="url"
                    placeholder="https://www.prowinproperties.com/blog/…"
                  />
                </div>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Sparkles className="size-3.5" />
                    Search preview
                  </p>
                  <p className="truncate text-lg text-[#1a0dab]">
                    {metaTitle || title || "Untitled article"}
                  </p>
                  <p className="truncate text-sm text-emerald-700">
                    prowinproperties.com/blog/{slug || "your-slug"}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                    {metaDescription ||
                      excerpt ||
                      "Meta description will appear here."}
                  </p>
                </div>
              </CardContent>
            ) : null}
          </Card>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <Card className="overflow-hidden border-border/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Cover</CardTitle>
              <CardDescription>
                Shown on the public blog and article header.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative aspect-[16/10] overflow-hidden rounded-lg border bg-muted/40">
                {coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ImagePlus className="size-8 opacity-50" />
                    <p className="text-xs">No cover yet</p>
                  </div>
                )}
              </div>
              <Label htmlFor="blog-cover" className="sr-only">
                Cover image URL
              </Label>
              <Input
                id="blog-cover"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                type="url"
                placeholder="Paste image URL…"
              />
              <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm font-medium transition hover:bg-muted">
                {uploading ? "Uploading…" : "Upload from device"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading || loading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    await onUploadCover(file);
                    e.target.value = "";
                  }}
                />
              </label>
              {coverUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={() => setCoverUrl("")}
                >
                  Remove cover
                </Button>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Publish</CardTitle>
              <CardDescription>
                Drafts stay private. Publish to show on /blog.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {error ? (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              ) : null}
              <Button
                type="submit"
                variant="outline"
                className="w-full"
                disabled={loading || uploading}
              >
                {loading ? "Saving…" : "Save draft"}
              </Button>
              <Button
                type="button"
                className="w-full"
                disabled={loading || uploading}
                onClick={() => void submit(true)}
              >
                {loading ? "Saving…" : "Publish now"}
              </Button>
              {mode === "edit" && slug ? (
                <Button asChild type="button" variant="secondary" className="w-full">
                  <Link href={`/blog/${slug}`} target="_blank">
                    <ExternalLink className="mr-1.5 size-4" />
                    Open public page
                  </Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </div>
    </form>
  );
}
