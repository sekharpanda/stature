"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { CheckCheck } from "lucide-react";

import { markAllNotificationsReadAction } from "@/actions/notifications";
import { Button } from "@/components/ui/button";

export function MarkAllNotificationsReadButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await markAllNotificationsReadAction();
          router.refresh();
        });
      }}
    >
      <CheckCheck className="mr-2 size-4" />
      {pending ? "Updating…" : "Mark all read"}
    </Button>
  );
}
