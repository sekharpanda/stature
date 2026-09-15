"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  AgentSortOption,
  AgentStatusFilter,
} from "@/schemas/agent.schema";

const STATUS_LABELS: Record<AgentStatusFilter, string> = {
  all: "All statuses",
  active: "Active",
  inactive: "Inactive",
  featured: "Featured",
};

const SORT_LABELS: Record<AgentSortOption, string> = {
  order: "Display order",
  name: "Name A–Z",
  listings: "Most listings",
  recent: "Recently added",
};

export function AgentFilterBar({
  q,
  status,
  sort,
}: {
  q: string;
  status: AgentStatusFilter;
  sort: AgentSortOption;
}) {
  const router = useRouter();
  const [term, setTerm] = useState(q);
  const [pending, startTransition] = useTransition();

  function apply(patch: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { q: term, status, sort, ...patch };
    for (const [key, value] of Object.entries(merged)) {
      if (!value || value === "all" || (key === "sort" && value === "order")) {
        continue;
      }
      params.set(key, value);
    }
    const query = params.toString();
    startTransition(() => {
      router.push(query ? `/admin/agents?${query}` : "/admin/agents");
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        className="relative min-w-[220px] flex-1"
        onSubmit={(event) => {
          event.preventDefault();
          apply({ page: undefined });
        }}
      >
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Search name, email, phone or BRN…"
          className="pl-9"
          aria-label="Search agents"
        />
        {term ? (
          <button
            type="button"
            aria-label="Clear search"
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"
            onClick={() => {
              setTerm("");
              apply({ q: undefined, page: undefined });
            }}
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </form>

      <select
        className="h-9 rounded-md border bg-background px-3 text-sm"
        value={status}
        aria-label="Filter by status"
        onChange={(event) => apply({ status: event.target.value, page: undefined })}
      >
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <select
        className="h-9 rounded-md border bg-background px-3 text-sm"
        value={sort}
        aria-label="Sort agents"
        onChange={(event) => apply({ sort: event.target.value, page: undefined })}
      >
        {Object.entries(SORT_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => {
          setTerm("");
          startTransition(() => router.push("/admin/agents"));
        }}
      >
        Reset
      </Button>
    </div>
  );
}
