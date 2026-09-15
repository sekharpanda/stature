"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function PublicPagePreview({
  href,
  label = "Live preview",
}: {
  href: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{label}</p>
          <p className="text-xs text-muted-foreground">
            Opens the public page in a frame. Save first to see the latest
            changes.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Hide preview" : "Show preview"}
        </Button>
      </div>
      {open ? (
        <iframe
          title={label}
          src={href}
          className="h-[640px] w-full rounded-lg border border-border bg-white"
        />
      ) : null}
    </div>
  );
}
