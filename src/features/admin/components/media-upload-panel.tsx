"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import {
  deleteMediaAssetAction,
  uploadMediaLibraryAction,
} from "@/actions/cms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function MediaUploadPanel() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [alt, setAlt] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <Card className="card-elevated border-border/80">
      <CardHeader>
        <CardTitle className="font-display text-xl">Upload media</CardTitle>
        <CardDescription>
          Images, PDFs and documents (up to 20 files, 20MB each). Stored in the
          central media library.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (files.length === 0) {
              toast.error("Choose at least one file");
              return;
            }
            setLoading(true);
            const data = new FormData();
            files.forEach((f) => data.append("files", f));
            if (title) data.set("title", title);
            if (alt) data.set("alt", alt);
            const result = await uploadMediaLibraryAction(data);
            setLoading(false);
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success(`Uploaded ${result.data.ids.length} file(s)`);
            setFiles([]);
            setTitle("");
            setAlt("");
            router.refresh();
          }}
        >
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-10 text-sm text-muted-foreground hover:bg-muted/40">
            <Upload className="size-6" />
            <span>
              {files.length
                ? `${files.length} file(s) selected`
                : "Click to choose files"}
            </span>
            <input
              type="file"
              multiple
              accept="image/*,application/pdf,video/*,.doc,.docx,.xls,.xlsx"
              className="hidden"
              onChange={(e) =>
                setFiles(Array.from(e.target.files ?? []).slice(0, 20))
              }
            />
          </label>
          {files.length > 0 ? (
            <ul className="space-y-1 text-xs text-muted-foreground">
              {files.map((f) => (
                <li key={f.name + f.size}>
                  {f.name} ({Math.round(f.size / 1024)} KB)
                </li>
              ))}
            </ul>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="media-title">Title (optional)</Label>
              <Input
                id="media-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="media-alt">Alt text (optional)</Label>
              <Input
                id="media-alt"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" disabled={loading || files.length === 0}>
            {loading ? "Uploading…" : "Upload to library"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function DeleteMediaButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="h-8 px-2 text-destructive"
      disabled={loading}
      onClick={async () => {
        if (!confirm("Remove this asset from the library?")) return;
        setLoading(true);
        const result = await deleteMediaAssetAction(id);
        setLoading(false);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success("Asset removed");
        router.refresh();
      }}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
