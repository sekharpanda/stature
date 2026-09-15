"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Pin, PinOff } from "lucide-react";
import { toast } from "sonner";

import { updateDeveloperListingOrderAction } from "@/actions/catalog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DEFAULT_LIST_PRIORITY } from "@/config/priority-developers";

export type DeveloperOrderItem = {
  id: string;
  name: string;
  listPriority: number;
  propertyCount: number;
};

export function DeveloperListingOrderPanel({
  organizationId,
  developers,
}: {
  organizationId: string;
  developers: DeveloperOrderItem[];
}) {
  const [orderedIds, setOrderedIds] = useState<string[]>(() =>
    developers
      .filter((d) => d.listPriority < DEFAULT_LIST_PRIORITY)
      .sort((a, b) => a.listPriority - b.listPriority || a.name.localeCompare(b.name))
      .map((d) => d.id),
  );
  const [pending, startTransition] = useTransition();

  const byId = useMemo(() => {
    const map = new Map(developers.map((d) => [d.id, d]));
    return map;
  }, [developers]);

  const pinned = orderedIds
    .map((id) => byId.get(id))
    .filter((d): d is DeveloperOrderItem => Boolean(d));
  const pinnedSet = new Set(orderedIds);
  const unpinned = developers
    .filter((d) => !pinnedSet.has(d.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  function move(id: string, delta: -1 | 1) {
    setOrderedIds((prev) => {
      const index = prev.indexOf(id);
      if (index < 0) return prev;
      const nextIndex = index + delta;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(nextIndex, 0, item!);
      return copy;
    });
  }

  function pin(id: string) {
    setOrderedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  function unpin(id: string) {
    setOrderedIds((prev) => prev.filter((x) => x !== id));
  }

  function save() {
    startTransition(async () => {
      const result = await updateDeveloperListingOrderAction({
        organizationId,
        orderedDeveloperIds: orderedIds,
      });
      if (!result.ok) {
        toast.error(result.error || "Could not save order");
        return;
      }
      toast.success("Listing order saved — these developers stay on top");
    });
  }

  return (
    <Card className="card-elevated border-border/80">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
        <div>
          <CardTitle className="font-display text-xl">
            Public listing order
          </CardTitle>
          <CardDescription className="mt-1.5 max-w-xl">
            Pin developers here to keep their projects at the top of
            /properties. Order top → bottom is what visitors see first.
          </CardDescription>
        </div>
        <Button onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save order"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Pinned ({pinned.length})
          </p>
          {pinned.length === 0 ? (
            <p className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
              No developers pinned yet. Add from the list below.
            </p>
          ) : (
            <ul className="divide-y overflow-hidden rounded-lg border">
              {pinned.map((d, index) => (
                <li
                  key={d.id}
                  className="flex flex-wrap items-center gap-3 px-3 py-2.5"
                >
                  <span className="w-8 shrink-0 text-center text-sm font-semibold tabular-nums text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.propertyCount}{" "}
                      {d.propertyCount === 1 ? "property" : "properties"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={index === 0 || pending}
                      onClick={() => move(d.id, -1)}
                      aria-label={`Move ${d.name} up`}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={index === pinned.length - 1 || pending}
                      onClick={() => move(d.id, 1)}
                      aria-label={`Move ${d.name} down`}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={pending}
                      onClick={() => unpin(d.id)}
                      aria-label={`Unpin ${d.name}`}
                    >
                      <PinOff className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Not pinned ({unpinned.length})
          </p>
          {unpinned.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              All developers are in the listing order.
            </p>
          ) : (
            <ul className="max-h-72 divide-y overflow-y-auto rounded-lg border">
              {unpinned.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between gap-3 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.propertyCount}{" "}
                      {d.propertyCount === 1 ? "property" : "properties"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() => pin(d.id)}
                  >
                    <Pin className="mr-1.5 h-3.5 w-3.5" />
                    Pin
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
