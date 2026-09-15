"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { adminNav, entityIcons, quickActions } from "@/config/admin-nav";
import type { SearchGroupKey, SearchHit } from "@/repositories/search.repository";

const groupLabels: Record<SearchGroupKey, string> = {
  properties: "Properties",
  developers: "Developers",
  communities: "Communities",
  areas: "Areas",
  blogs: "Blog posts",
  leads: "Leads",
  users: "Users",
};

const groupIcons: Record<SearchGroupKey, typeof entityIcons.property> = {
  properties: entityIcons.property,
  developers: entityIcons.developer,
  communities: entityIcons.community,
  areas: entityIcons.area,
  blogs: entityIcons.blog,
  leads: entityIcons.lead,
  users: entityIcons.user,
};

const navTargets = adminNav.flatMap((section) =>
  section.items.flatMap((item) => [
    { label: item.label, href: item.href, section: section.label, icon: item.icon },
    ...(item.items ?? []).map((child) => ({
      label: `${item.label} · ${child.label}`,
      href: child.href,
      section: section.label,
      icon: item.icon,
    })),
  ]),
);

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(
          `/api/admin/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        const payload = await response.json();
        setResults(payload.ok ? (payload.data as SearchHit[]) : []);
      } catch (error) {
        if ((error as Error)?.name !== "AbortError") setResults([]);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => clearTimeout(timeout);
  }, [query]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router],
  );

  const grouped = results.reduce<Record<string, SearchHit[]>>((acc, hit) => {
    (acc[hit.group] ??= []).push(hit);
    return acc;
  }, {});

  const showDefaults = query.trim().length < 2;

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-9 w-full justify-start gap-2 bg-card px-3 text-muted-foreground shadow-none md:w-72 lg:w-96"
      >
        <Search className="size-4" />
        <span className="truncate text-sm font-normal">
          Search properties, leads, content…
        </span>
        <kbd className="ml-auto hidden shrink-0 items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground sm:inline-flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Global search"
        description="Search across the workspace"
        shouldFilter={showDefaults}
      >
        <CommandInput
          placeholder="Search properties, developers, leads, blog…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Searching…
            </div>
          ) : null}

          {!loading && !showDefaults && results.length === 0 ? (
            <CommandEmpty>No results for “{query.trim()}”.</CommandEmpty>
          ) : null}

          {showDefaults ? (
            <>
              <CommandGroup heading="Quick actions">
                {quickActions.map((action) => (
                  <CommandItem
                    key={action.href}
                    value={`action ${action.label}`}
                    onSelect={() => go(action.href)}
                  >
                    <action.icon className="size-4" />
                    <span>{action.label}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {action.description}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Navigate">
                {navTargets.map((target) => (
                  <CommandItem
                    key={`${target.href}-${target.label}`}
                    value={`nav ${target.label} ${target.section}`}
                    onSelect={() => go(target.href)}
                  >
                    {target.icon ? <target.icon className="size-4" /> : null}
                    <span>{target.label}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {target.section}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          ) : (
            Object.entries(grouped).map(([group, hits]) => {
              const key = group as SearchGroupKey;
              const Icon = groupIcons[key];

              return (
                <CommandGroup key={group} heading={groupLabels[key]}>
                  {hits.map((hit) => (
                    <CommandItem
                      key={hit.id}
                      value={`${hit.group}-${hit.id}-${hit.title}`}
                      onSelect={() => go(hit.href)}
                    >
                      <Icon className="size-4" />
                      <span className="truncate">{hit.title}</span>
                      {hit.subtitle ? (
                        <span className="ml-auto truncate text-xs text-muted-foreground">
                          {hit.subtitle}
                        </span>
                      ) : null}
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
