"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { runBlogApiSyncAction } from "@/actions/blog-sync";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ConnectionStatus = {
  enabled: boolean;
  configured: boolean;
  provider: string;
  baseUrl: string;
  hasApiKey: boolean;
  autoPublish: boolean;
};

export function BlogApiSyncControls({
  connection,
}: {
  connection: ConnectionStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState(connection.baseUrl || "");
  const [provider, setProvider] = useState<"wordpress" | "json">(
    connection.provider === "json" ? "json" : "wordpress",
  );
  const [autoPublish, setAutoPublish] = useState(connection.autoPublish);
  const [apiKey, setApiKey] = useState("");

  const canRun = Boolean(baseUrl.trim()) || connection.configured;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={connection.configured ? "default" : "destructive"}>
          {connection.configured ? "Env ready" : "URL required"}
        </Badge>
        <Badge variant="outline">
          {provider === "wordpress" ? "WordPress REST" : "Generic JSON"}
        </Badge>
        <Badge variant={autoPublish ? "secondary" : "outline"}>
          {autoPublish ? "Auto-publish on" : "Import as drafts"}
        </Badge>
        {connection.baseUrl ? (
          <span className="text-xs text-muted-foreground">
            Default: {connection.baseUrl}
          </span>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="blog-api-url">API base URL</Label>
          <Input
            id="blog-api-url"
            className="rounded-[3px]"
            placeholder={
              provider === "wordpress"
                ? "https://example.com or …/wp-json/wp/v2/posts"
                : "https://api.example.com/posts"
            }
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            WordPress: site root or full posts endpoint. JSON: array or{" "}
            {"{ posts: [] }"} payload.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="blog-api-provider">Provider</Label>
          <select
            id="blog-api-provider"
            className="flex h-9 w-full rounded-[3px] border border-input bg-transparent px-3 text-sm"
            value={provider}
            onChange={(e) =>
              setProvider(e.target.value === "json" ? "json" : "wordpress")
            }
          >
            <option value="wordpress">WordPress</option>
            <option value="json">Generic JSON</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="blog-api-key">API key (optional)</Label>
          <Input
            id="blog-api-key"
            type="password"
            className="rounded-[3px]"
            placeholder={connection.hasApiKey ? "Using env key" : "Bearer token"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={autoPublish}
          onChange={(e) => setAutoPublish(e.target.checked)}
          className="size-4 rounded-[2px]"
        />
        Publish synced posts immediately
      </label>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="rounded-[3px]"
          disabled={pending || !canRun}
          onClick={() => {
            startTransition(async () => {
              const result = await runBlogApiSyncAction({
                baseUrl: baseUrl.trim() || undefined,
                provider,
                apiKey: apiKey.trim() || undefined,
                autoPublish,
                maxPages: 10,
              });
              if (!result.ok) {
                toast.error(result.error);
                setLastResult(result.error);
                return;
              }
              const d = result.data;
              const msg = `Fetched ${d.fetched}: imported ${d.imported}, updated ${d.updated}, skipped ${d.skipped}, errors ${d.errors.length}`;
              toast.success(msg);
              setLastResult(msg);
              router.refresh();
            });
          }}
        >
          <RefreshCw className={`mr-2 size-4 ${pending ? "animate-spin" : ""}`} />
          {pending ? "Fetching blogs…" : "Fetch blogs now"}
        </Button>
      </div>

      {lastResult ? (
        <p className="text-xs text-muted-foreground">{lastResult}</p>
      ) : null}
    </div>
  );
}
