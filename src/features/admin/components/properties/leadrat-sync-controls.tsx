"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { runLeadRatPropertySyncAction } from "@/actions/properties";

type ConnectionStatus = {
  enabled: boolean;
  configured: boolean;
  autoSync?: boolean;
  autoSyncMinutes?: number;
  baseUrl: string;
  hasApiKey: boolean;
  hasSecretKey?: boolean;
  hasTenant?: boolean;
  source?: string;
};

export function LeadRatSyncControls({
  connection,
}: {
  connection: ConnectionStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [lastResult, setLastResult] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={connection.configured ? "default" : "destructive"}>
          {connection.configured ? "Ready" : "Not configured"}
        </Badge>
        <Badge variant={connection.enabled ? "secondary" : "outline"}>
          {connection.enabled ? "Enabled" : "Disabled"}
        </Badge>
        <Badge variant={connection.autoSync ? "secondary" : "outline"}>
          {connection.autoSync
            ? `Auto-sync every ${connection.autoSyncMinutes ?? 30}m`
            : "Auto-sync off"}
        </Badge>
        <Badge variant="outline">Off Plan public API</Badge>
        <span className="text-xs text-muted-foreground">{connection.baseUrl}</span>
      </div>

      <ul className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
        <li>API key: {connection.hasApiKey ? "set" : "missing"}</li>
        <li>Source: {connection.source ?? "offplan-public"}</li>
      </ul>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="rounded-[3px]"
          disabled={pending || !connection.configured}
          onClick={() => {
            startTransition(async () => {
              const result = await runLeadRatPropertySyncAction({
                markMissing: true,
              });
              if (!result.ok) {
                toast.error(result.error);
                setLastResult(result.error);
                return;
              }
              const d = result.data;
              const msg = `Imported ${d.imported}, updated ${d.updated}, skipped ${d.skipped}, removed ${d.deleted}, errors ${d.errors.length}`;
              toast.success(msg);
              setLastResult(msg);
              router.refresh();
            });
          }}
        >
          <RefreshCw className={`mr-2 size-4 ${pending ? "animate-spin" : ""}`} />
          {pending ? "Syncing…" : "Sync Off Plan listings"}
        </Button>
      </div>

      {lastResult ? (
        <p className="text-xs text-muted-foreground">{lastResult}</p>
      ) : null}
    </div>
  );
}
