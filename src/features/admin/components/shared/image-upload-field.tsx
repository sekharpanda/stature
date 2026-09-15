"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { uploadMediaLibraryAction } from "@/actions/cms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type ImageUploadValue = {
  url: string;
  mediaId: string | null;
};

export function ImageUploadField({
  label,
  description,
  value,
  onChange,
  shape = "square",
  disabled = false,
}: {
  label: string;
  description?: string;
  value: ImageUploadValue;
  onChange: (next: ImageUploadValue) => void;
  shape?: "square" | "circle";
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Choose an image under 20MB");
      return;
    }
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
    if (!url) {
      toast.error("Upload did not return a file URL");
      return;
    }
    onChange({ url, mediaId: result.data.ids?.[0] ?? null });
    toast.success("Image uploaded to the media library");
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap items-start gap-4">
        <div
          className={cn(
            "relative flex size-24 shrink-0 items-center justify-center overflow-hidden border bg-muted/40",
            shape === "circle" ? "rounded-full" : "rounded-xl",
          )}
        >
          {value.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value.url}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <ImagePlus className="size-6 text-muted-foreground" />
          )}
          {uploading ? (
            <span className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Loader2 className="size-5 animate-spin text-primary" />
            </span>
          ) : null}
        </div>

        <div className="flex min-w-[220px] flex-1 flex-col gap-2">
          <Input
            value={value.url}
            disabled={disabled || uploading}
            placeholder="https://…/photo.jpg"
            onChange={(event) =>
              onChange({ url: event.target.value, mediaId: null })
            }
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || uploading}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="mr-1.5 size-3.5" />
              {value.url ? "Replace" : "Upload"}
            </Button>
            {value.url ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || uploading}
                onClick={() => onChange({ url: "", mediaId: null })}
              >
                <Trash2 className="mr-1.5 size-3.5" />
                Remove
              </Button>
            ) : null}
          </div>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) await upload(file);
        }}
      />
    </div>
  );
}
