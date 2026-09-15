"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { retryLeadCrmSyncAction } from "@/actions/leads";

export function RetryCrmButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="rounded-[3px]"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await retryLeadCrmSyncAction(leadId);
        setLoading(false);
        router.refresh();
      }}
    >
      {loading ? "Retrying…" : "Retry CRM"}
    </Button>
  );
}
