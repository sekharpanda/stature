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
import { savePortalPostAction } from "@/actions/portal";
import { ImageUploadField } from "@/features/portal/components/image-upload-field";

export type PostFormValues = {
  postId?: string | null;
  title: string;
  excerpt: string | null;
  content: string | null;
  coverUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
};

export function PostForm({
  values,
  live,
}: {
  values: PostFormValues;
  live: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    title: values.title ?? "",
    excerpt: values.excerpt ?? "",
    content: values.content ?? "",
    metaTitle: values.metaTitle ?? "",
    metaDescription: values.metaDescription ?? "",
    note: "",
  });
  const [cover, setCover] = useState<string[]>(
    values.coverUrl ? [values.coverUrl] : [],
  );

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function save(submit: boolean) {
    startTransition(async () => {
      const result = await savePortalPostAction(
        { ...form, postId: values.postId ?? null, coverUrl: cover[0] ?? null },
        { submit },
      );

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      if (result.data.mode === "draft") {
        toast.success("Draft saved");
      } else if (result.data.mode === "update-pending") {
        toast.success("Changes sent for approval", {
          description: "The published article stays as it is until approved.",
        });
      } else {
        toast.success("Sent for approval");
      }

      router.push(`/admin/my/posts/${result.data.postId}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">Your article</CardTitle>
          <CardDescription>
            Basic HTML is supported in the body — headings, paragraphs, lists and
            links.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(event) => set("title", event.target.value)}
              placeholder="Five things to check before buying off-plan in Dubai"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              rows={2}
              value={form.excerpt}
              onChange={(event) => set("excerpt", event.target.value)}
              placeholder="A short teaser shown on the blog index."
            />
          </div>
          <ImageUploadField
            label="Cover image"
            folder="properties"
            mode="single"
            value={cover}
            onChange={setCover}
          />
          <div className="space-y-2">
            <Label htmlFor="content">Body</Label>
            <Textarea
              id="content"
              rows={16}
              value={form.content}
              onChange={(event) => set("content", event.target.value)}
              className="font-mono text-[13px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">Search listing</CardTitle>
          <CardDescription>
            Optional. Leave empty to use the title and excerpt.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="metaTitle">Meta title</Label>
            <Input
              id="metaTitle"
              value={form.metaTitle}
              onChange={(event) => set("metaTitle", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="metaDescription">Meta description</Label>
            <Input
              id="metaDescription"
              value={form.metaDescription}
              onChange={(event) => set("metaDescription", event.target.value)}
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
              ? "This post is published. Your edit waits for a superadmin and the live article is untouched."
              : "A superadmin approves the post before it appears on the blog."}
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
