"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadPortalMediaAction } from "@/actions/portal";

type Props = {
  label: string;
  folder: "agents" | "properties";
  /** Single keeps one URL, multiple appends to a gallery. */
  mode: "single" | "multiple";
  value: string[];
  onChange: (urls: string[]) => void;
  hint?: string;
};

export function ImageUploadField({
  label,
  folder,
  mode,
  value,
  onChange,
  hint,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [manualUrl, setManualUrl] = useState("");

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const tooLarge = Array.from(files).find((file) => file.size > 20 * 1024 * 1024);
    if (tooLarge) {
      toast.error("Choose images under 20MB");
      return;
    }
    const formData = new FormData();
    formData.set("folder", folder);
    Array.from(files).forEach((file) => formData.append("files", file));

    startTransition(async () => {
      const result = await uploadPortalMediaAction(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onChange(mode === "single" ? result.data.urls.slice(0, 1) : [...value, ...result.data.urls]);
      toast.success(
        result.data.urls.length === 1
          ? "Image uploaded"
          : `${result.data.urls.length} images uploaded`,
      );
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  function addManualUrl() {
    const url = manualUrl.trim();
    if (!url) return;
    onChange(mode === "single" ? [url] : [...value, url]);
    setManualUrl("");
  }

  return (
    <div className="space-y-3">
      <Label>{label}</Label>

      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {value.map((url) => (
            <div key={url} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="size-20 rounded-md border object-cover"
              />
              <button
                type="button"
                onClick={() => onChange(value.filter((item) => item !== url))}
                className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow"
                aria-label="Remove image"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={mode === "multiple"}
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
        >
          {pending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Upload className="mr-2 size-4" />
          )}
          {pending ? "Uploading…" : "Upload"}
        </Button>
        <Input
          value={manualUrl}
          onChange={(event) => setManualUrl(event.target.value)}
          placeholder="or paste an image URL"
          className="h-9 max-w-xs"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addManualUrl();
            }
          }}
        />
        <Button type="button" variant="ghost" size="sm" onClick={addManualUrl}>
          Add URL
        </Button>
      </div>

      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
