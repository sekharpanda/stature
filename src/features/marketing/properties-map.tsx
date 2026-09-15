"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";

import "leaflet/dist/leaflet.css";

export type MapProperty = {
  id: string;
  slug: string;
  name: string;
  location: string;
  priceLabel: string | null;
  coverUrl: string | null;
  latitude: number;
  longitude: number;
};

/** Roughly central Dubai, used when no markers are available. */
const DUBAI_CENTER: [number, number] = [25.114, 55.2];

function popupHtml(property: MapProperty) {
  const escape = (value: string) =>
    value.replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char] ?? char,
    );

  const image = property.coverUrl
    ? `<img src="${escape(property.coverUrl)}" alt="" style="width:100%;height:110px;object-fit:cover;border-radius:6px;margin-bottom:8px" />`
    : "";

  return `
    <a href="/properties/${escape(property.slug)}" style="display:block;text-decoration:none;color:#141414;min-width:200px">
      ${image}
      <strong style="display:block;font-size:14px;line-height:1.3">${escape(property.name)}</strong>
      <span style="display:block;font-size:12px;color:#6b7280;margin-top:2px">${escape(property.location)}</span>
      <span style="display:block;font-size:13px;font-weight:600;margin-top:6px">${escape(property.priceLabel ?? "Price on request")}</span>
    </a>
  `;
}

export function PropertiesMap({
  properties,
  className,
  emptyTitle = "Nothing to map yet",
  emptyBody = "None of the listings in this search have map coordinates.",
  emptyHref = "/properties",
  emptyLabel = "Back to list view",
}: {
  properties: MapProperty[];
  className?: string;
  emptyTitle?: string;
  emptyBody?: string;
  emptyHref?: string;
  emptyLabel?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    // Leaflet touches `window` on import, so it can only load in the browser.
    let cleanup: (() => void) | undefined;

    void (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: DUBAI_CENTER,
        zoom: 11,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const markers = properties.map((property) => {
        const label = property.priceLabel ?? "Enquire";
        // Approximate pill width so anchors sit on the pin tip.
        const width = Math.max(56, label.length * 7 + 20);
        const icon = L.divIcon({
          className: "prowin-map-marker",
          html: `<span style="display:inline-flex;align-items:center;height:26px;padding:0 10px;border-radius:13px;background:#A01919;color:#fff;font-size:12px;font-weight:600;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.25)">${label}</span>`,
          iconSize: [width, 26],
          iconAnchor: [width / 2, 13],
        });

        return L.marker([property.latitude, property.longitude], { icon })
          .bindPopup(popupHtml(property))
          .addTo(map);
      });

      if (markers.length) {
        map.fitBounds(L.featureGroup(markers).getBounds().pad(0.15), {
          maxZoom: 14,
        });
      }

      // Leaflet often initializes before the container finishes layout
      // (rounded card / flex height), leaving a grey empty map.
      const refresh = () => {
        if (cancelled) return;
        map.invalidateSize();
      };
      requestAnimationFrame(refresh);
      const t1 = window.setTimeout(refresh, 100);
      const t2 = window.setTimeout(refresh, 400);
      window.addEventListener("resize", refresh);

      cleanup = () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
        window.removeEventListener("resize", refresh);
        map.remove();
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [properties]);

  if (!properties.length) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-line bg-white px-6 text-center">
        <Building2 className="size-8 text-[#b6bec9]" aria-hidden="true" />
        <p className="font-display text-2xl">{emptyTitle}</p>
        <p className="max-w-md text-sm text-slate">{emptyBody}</p>
        <Link
          href={emptyHref}
          className="mt-2 rounded-full border border-ink px-5 py-2.5 text-sm font-semibold transition hover:bg-ink hover:text-white"
        >
          {emptyLabel}
        </Link>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label={`Map of ${properties.length} properties`}
      className={
        className ??
        "h-[calc(100vh-260px)] min-h-[420px] w-full overflow-hidden rounded-[20px] border border-line bg-[#ddd]"
      }
    />
  );
}
