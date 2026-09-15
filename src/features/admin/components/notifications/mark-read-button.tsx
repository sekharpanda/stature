"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { markAllNotificationsReadAction } from "@/actions/notifications";
import { Button } from "@/components/ui/button";

export function MarkNotificationsReadButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      className="rounded-lg"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await markAllNotificationsReadAction();
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success("All notifications marked read");
          router.refresh();
        });
      }}
    >
      {pending ? "Updating…" : "Mark all read"}
    </Button>
  );
}
