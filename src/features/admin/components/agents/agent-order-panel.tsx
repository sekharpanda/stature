"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Star } from "lucide-react";
import { toast } from "sonner";

import { reorderAgentsAction } from "@/actions/agents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type AgentOrderItem = {
  id: string;
  name: string;
  title: string | null;
  photoUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
};

export function AgentOrderPanel({
  organizationId,
  agents,
}: {
  organizationId: string;
  agents: AgentOrderItem[];
}) {
  const router = useRouter();
  const initialOrder = useMemo(() => agents.map((agent) => agent.id), [agents]);
  const [orderedIds, setOrderedIds] = useState<string[]>(initialOrder);
  const [pending, startTransition] = useTransition();

  const byId = useMemo(
    () => new Map(agents.map((agent) => [agent.id, agent])),
    [agents],
  );
  const ordered = orderedIds
    .map((id) => byId.get(id))
    .filter((agent): agent is AgentOrderItem => Boolean(agent));
  const dirty =
    orderedIds.length !== initialOrder.length ||
    orderedIds.some((id, index) => id !== initialOrder[index]);

  function move(id: string, delta: -1 | 1) {
    setOrderedIds((prev) => {
      const index = prev.indexOf(id);
      const nextIndex = index + delta;
      if (index < 0 || nextIndex < 0 || nextIndex >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(nextIndex, 0, item!);
      return copy;
    });
  }

  function save() {
    startTransition(async () => {
      const result = await reorderAgentsAction({
        organizationId,
        orderedAgentIds: orderedIds,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Team order saved");
      router.refresh();
    });
  }

  if (agents.length === 0) return null;

  return (
    <Card className="card-elevated border-border/80">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
        <div>
          <CardTitle className="font-display text-xl">
            Public display order
          </CardTitle>
          <CardDescription className="mt-1.5 max-w-xl">
            Top to bottom is the order visitors see on the homepage and
            /our-team. Featured agents still lead their section.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          {dirty ? (
            <Button
              variant="ghost"
              disabled={pending}
              onClick={() => setOrderedIds(initialOrder)}
            >
              Reset
            </Button>
          ) : null}
          <Button onClick={save} disabled={pending || !dirty}>
            {pending ? "Saving…" : "Save order"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="divide-y overflow-hidden rounded-lg border">
          {ordered.map((agent, index) => (
            <li
              key={agent.id}
              className="flex flex-wrap items-center gap-3 px-3 py-2.5"
            >
              <span className="w-6 shrink-0 text-center text-sm font-semibold tabular-nums text-muted-foreground">
                {index + 1}
              </span>
              {agent.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={agent.photoUrl}
                  alt=""
                  className="size-8 rounded-full border object-cover"
                />
              ) : (
                <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {agent.name.slice(0, 1)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {agent.name}
                  {agent.isFeatured ? (
                    <Star className="ml-1.5 inline size-3 fill-amber-400 text-amber-400" />
                  ) : null}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {agent.title || "Property Consultant"}
                </p>
              </div>
              {!agent.isActive ? (
                <Badge variant="outline" className="text-xs">
                  Inactive
                </Badge>
              ) : null}
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8"
                  disabled={index === 0 || pending}
                  onClick={() => move(agent.id, -1)}
                  aria-label={`Move ${agent.name} up`}
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8"
                  disabled={index === ordered.length - 1 || pending}
                  onClick={() => move(agent.id, 1)}
                  aria-label={`Move ${agent.name} down`}
                >
                  <ArrowDown className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
