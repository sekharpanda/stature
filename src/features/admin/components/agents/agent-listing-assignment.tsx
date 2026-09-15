"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Loader2, Plus, Search, UserMinus } from "lucide-react";
import { toast } from "sonner";

import {
  assignAgentListingsAction,
  searchAgentListingCandidatesAction,
  unassignAgentListingsAction,
  type AgentListingCandidate,
} from "@/actions/agents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export type AssignedListing = {
  id: string;
  name: string;
  status: string;
  location: string | null;
  price: string | null;
};

export function AgentListingAssignment({
  organizationId,
  agentId,
  agentName,
  assigned,
  total,
  page,
  pageCount,
}: {
  organizationId: string;
  agentId: string;
  agentName: string;
  assigned: AssignedListing[];
  total: number;
  page: number;
  pageCount: number;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [scope, setScope] = useState<"unassigned" | "all">("unassigned");
  const [candidates, setCandidates] = useState<AgentListingCandidate[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!pickerOpen) return;
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      const result = await searchAgentListingCandidatesAction({
        organizationId,
        agentId,
        q: term || undefined,
        scope,
        take: 25,
      });
      if (cancelled) return;
      setSearching(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setCandidates(result.data);
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pickerOpen, term, scope, organizationId, agentId]);

  function toggleSelected(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function unassign(ids: string[]) {
    if (ids.length === 0) return;
    startTransition(async () => {
      const result = await unassignAgentListingsAction({
        agentId,
        propertyIds: ids,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setSelected([]);
      toast.success(
        `${result.data.updated} listing${result.data.updated === 1 ? "" : "s"} unassigned`,
      );
      router.refresh();
    });
  }

  async function assign() {
    if (picked.length === 0) return;
    setAssigning(true);
    const result = await assignAgentListingsAction({
      agentId,
      propertyIds: picked,
    });
    setAssigning(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(
      `${result.data.updated} listing${result.data.updated === 1 ? "" : "s"} assigned to ${agentName}`,
    );
    setPicked([]);
    setPickerOpen(false);
    router.refresh();
  }

  function goToPage(next: number) {
    const params = new URLSearchParams();
    if (next > 1) params.set("lp", String(next));
    const query = params.toString();
    router.push(
      query ? `/admin/agents/${agentId}?${query}` : `/admin/agents/${agentId}`,
    );
  }

  return (
    <Card className="card-elevated border-border/80">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
        <div>
          <CardTitle className="font-display text-xl">
            Assigned listings
          </CardTitle>
          <CardDescription className="mt-1.5">
            {total} propert{total === 1 ? "y" : "ies"} currently handled by{" "}
            {agentName}.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          {selected.length > 0 ? (
            <Button
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => unassign(selected)}
            >
              <UserMinus className="mr-1.5 size-3.5" />
              Unassign {selected.length}
            </Button>
          ) : null}
          <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1.5 size-3.5" />
                Assign listings
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Assign listings to {agentName}</DialogTitle>
                <DialogDescription>
                  Assigning replaces any agent currently set on the property.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-wrap gap-2">
                <div className="relative min-w-[220px] flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={term}
                    onChange={(event) => setTerm(event.target.value)}
                    placeholder="Search listings by name…"
                    className="pl-9"
                  />
                </div>
                <select
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  value={scope}
                  onChange={(event) =>
                    setScope(event.target.value as "unassigned" | "all")
                  }
                >
                  <option value="unassigned">Unassigned only</option>
                  <option value="all">All other listings</option>
                </select>
              </div>

              <div className="max-h-80 divide-y overflow-y-auto rounded-lg border">
                {searching ? (
                  <p className="flex items-center gap-2 px-3 py-6 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Searching listings…
                  </p>
                ) : candidates.length === 0 ? (
                  <p className="px-3 py-6 text-sm text-muted-foreground">
                    No matching listings.
                  </p>
                ) : (
                  candidates.map((candidate) => (
                    <label
                      key={candidate.id}
                      className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-muted/40"
                    >
                      <input
                        type="checkbox"
                        className="size-4"
                        checked={picked.includes(candidate.id)}
                        onChange={() =>
                          setPicked((prev) =>
                            prev.includes(candidate.id)
                              ? prev.filter((item) => item !== candidate.id)
                              : [...prev, candidate.id],
                          )
                        }
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {candidate.name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {[
                            candidate.location,
                            candidate.currentAgent
                              ? `Currently ${candidate.currentAgent}`
                              : "Unassigned",
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {candidate.status}
                      </Badge>
                    </label>
                  ))
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setPickerOpen(false)}
                  disabled={assigning}
                >
                  Cancel
                </Button>
                <Button
                  onClick={assign}
                  disabled={assigning || picked.length === 0}
                >
                  {assigning
                    ? "Assigning…"
                    : `Assign ${picked.length || ""}`.trim()}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {assigned.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center">
            <Building2 className="size-5 text-muted-foreground" />
            <p className="text-sm font-medium">No listings yet</p>
            <p className="text-xs text-muted-foreground">
              Assign listings here, or pick this agent from a property&apos;s
              summary sidebar.
            </p>
          </div>
        ) : (
          <ul className="divide-y overflow-hidden rounded-lg border">
            {assigned.map((listing) => (
              <li
                key={listing.id}
                className="flex flex-wrap items-center gap-3 px-3 py-2.5"
              >
                <input
                  type="checkbox"
                  className="size-4"
                  aria-label={`Select ${listing.name}`}
                  checked={selected.includes(listing.id)}
                  onChange={() => toggleSelected(listing.id)}
                />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/properties/${listing.id}`}
                    className="block truncate text-sm font-medium hover:underline"
                  >
                    {listing.name}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">
                    {[listing.location, listing.price]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {listing.status}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => unassign([listing.id])}
                >
                  Unassign
                </Button>
              </li>
            ))}
          </ul>
        )}

        {pageCount > 1 ? (
          <div className="flex items-center justify-between gap-2 pt-1">
            <p className="text-xs text-muted-foreground">
              Page {page} of {pageCount}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pageCount}
                onClick={() => goToPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
