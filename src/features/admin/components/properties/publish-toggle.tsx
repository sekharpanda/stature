"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { setPropertyPublishAction } from "@/actions/properties";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type PublishToggleProps = {
  propertyId: string;
  published: boolean;
  className?: string;
  /** Stop card/link navigation when toggling */
  stopPropagation?: boolean;
};

export function PublishToggle({
  propertyId,
  published,
  className,
  stopPropagation = true,
}: PublishToggleProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div
      className={cn("flex items-center gap-2", className)}
      onClick={(event) => {
        if (stopPropagation) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      onKeyDown={(event) => {
        if (stopPropagation) event.stopPropagation();
      }}
    >
      <Switch
        size="sm"
        checked={published}
        disabled={pending}
        aria-label={published ? "Unpublish property" : "Publish property"}
        onCheckedChange={(checked) => {
          startTransition(async () => {
            const result = await setPropertyPublishAction({
              propertyId,
              published: checked,
            });
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success(
              checked
                ? "Published — visible on the website when live"
                : "Unpublished — hidden from the website",
            );
            router.refresh();
          });
        }}
      />
      <span className="text-xs font-medium text-muted-foreground">
        {published ? "Published" : "Draft"}
      </span>
    </div>
  );
}
