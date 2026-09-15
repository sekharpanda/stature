"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function ensureSessionId() {
  try {
    const key = "pw_sid";
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `sid_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(key, id);
    document.cookie = `${key}=${id}; path=/; max-age=31536000; samesite=lax`;
    return id;
  } catch {
    return null;
  }
}

function utmFromSearch(search: string) {
  const params = new URLSearchParams(search);
  return {
    utmSource: params.get("utm_source"),
    utmMedium: params.get("utm_medium"),
    utmCampaign: params.get("utm_campaign"),
    gclid: params.get("gclid"),
    fbclid: params.get("fbclid"),
  };
}

export function trackClientEvent(input: {
  type: string;
  path?: string;
  propertyId?: string;
  metadata?: Record<string, unknown>;
}) {
  if (typeof window === "undefined") return;
  const sessionId = ensureSessionId();
  const utm = utmFromSearch(window.location.search);
  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: input.type,
      path: input.path ?? window.location.pathname,
      propertyId: input.propertyId,
      sessionId,
      referrer: document.referrer || null,
      metadata: input.metadata,
      ...utm,
    }),
    keepalive: true,
  }).catch(() => {
    /* non-blocking */
  });
}

export function AnalyticsTracker({
  propertyId,
}: {
  propertyId?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    const search = searchParams?.toString() ?? "";
    const key = `${pathname}?${search}|${propertyId ?? ""}`;
    if (lastKey.current === key) return;
    lastKey.current = key;

    if (propertyId) {
      trackClientEvent({
        type: "PROPERTY_VIEW",
        path: pathname,
        propertyId,
      });
    } else {
      trackClientEvent({
        type: "PAGE_VIEW",
        path: pathname + (search ? `?${search}` : ""),
      });
      if (pathname === "/properties" && search.includes("q=")) {
        trackClientEvent({
          type: "SEARCH",
          path: pathname,
          metadata: { query: searchParams?.get("q") },
        });
      }
    }
  }, [pathname, searchParams, propertyId]);

  return null;
}
