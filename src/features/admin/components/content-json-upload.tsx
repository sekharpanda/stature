"use client";

import { useState } from "react";
import { FileJson2, Upload } from "lucide-react";
import { toast } from "sonner";

import { importContentJsonAction } from "@/actions/content-import";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CONTENT_JSON_SAMPLE } from "@/schemas/content-upload.schema";

export function ContentJsonUpload() {
  const [jsonText, setJsonText] = useState(CONTENT_JSON_SAMPLE);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  async function runImport(parsed: unknown) {
    setLoading(true);
    setLastResult(null);
    try {
      const result = await importContentJsonAction(parsed);
      if (!result.ok) {
        toast.error(result.error);
        setLastResult(result.error);
        return;
      }
      const c = result.data.counts;
      const total =
        c.blogPosts +
        c.agents +
        c.developers +
        c.areas +
        c.faqs +
        c.testimonials;
      const summary = `Imported ${total}: ${c.blogPosts} blog, ${c.agents} agents, ${c.developers} developers, ${c.areas} areas, ${c.faqs} FAQs, ${c.testimonials} testimonials`;
      toast.success(summary);
      setLastResult(
        [
          summary,
          ...(result.data.errors.length
            ? ["", "Warnings:", ...result.data.errors]
            : []),
        ].join("\n"),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-xl">
            <FileJson2 className="size-5" />
            Paste or upload JSON
          </CardTitle>
          <CardDescription>
            Include any of:{" "}
            <code className="text-xs">blogPosts</code>,{" "}
            <code className="text-xs">agents</code>,{" "}
            <code className="text-xs">developers</code>,{" "}
            <code className="text-xs">areas</code>,{" "}
            <code className="text-xs">faqs</code>,{" "}
            <code className="text-xs">testimonials</code>. You can upload one
            type or mix them in a single file.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="min-h-[420px] font-mono text-xs leading-relaxed"
            spellCheck={false}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={loading}
              onClick={async () => {
                try {
                  const parsed = JSON.parse(jsonText) as unknown;
                  await runImport(parsed);
                } catch {
                  toast.error("JSON is invalid — check commas and quotes");
                }
              }}
            >
              {loading ? "Importing…" : "Import JSON"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setJsonText(CONTENT_JSON_SAMPLE)}
            >
              Reset sample
            </Button>
            <label className="inline-flex">
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const text = await file.text();
                  setJsonText(text);
                  try {
                    await runImport(JSON.parse(text));
                  } catch {
                    toast.error("Uploaded file is not valid JSON");
                  }
                  e.target.value = "";
                }}
              />
              <Button type="button" variant="outline" asChild>
                <span className="cursor-pointer">
                  <Upload className="mr-2 size-4" />
                  Upload .json file
                </span>
              </Button>
            </label>
          </div>
          {lastResult ? (
            <pre className="overflow-x-auto rounded-md border bg-mist p-3 text-xs whitespace-pre-wrap text-slate">
              {lastResult}
            </pre>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Field guide</CardTitle>
          <CardDescription>
            Use image URLs (https://… or /uploads/…) for photos and covers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate">
          <div>
            <p className="font-semibold text-ink">blogPosts</p>
            <p>
              title, slug?, excerpt?, content?, coverUrl?, publish?, metaTitle?,
              metaDescription?
            </p>
          </div>
          <div>
            <p className="font-semibold text-ink">agents</p>
            <p>
              name, slug?, title?, email?, phone?, whatsapp?, photoUrl?, bio?,
              specialties[], languages[], serviceAreas[], reraNumber?,
              yearsExperience?, isFeatured?, isActive?
            </p>
          </div>
          <div>
            <p className="font-semibold text-ink">developers</p>
            <p>
              name, slug?, shortDescription?, description?, website?, logoUrl?,
              foundedYear?, headquarters?, isPublished?
            </p>
          </div>
          <div>
            <p className="font-semibold text-ink">areas</p>
            <p>
              name, slug?, cityName? (defaults to Dubai), shortDescription?,
              description?, isPublished?
            </p>
          </div>
          <div>
            <p className="font-semibold text-ink">faqs</p>
            <p>question, answer, sortOrder?</p>
          </div>
          <div>
            <p className="font-semibold text-ink">testimonials</p>
            <p>
              authorName, authorRole?, content, rating?, isFeatured?, sortOrder?
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
