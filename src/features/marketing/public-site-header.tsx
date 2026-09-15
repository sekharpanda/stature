"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn } from "lucide-react";

import { brand } from "@/config/brand";
import { DEFAULT_SITE_CHROME, type SiteNavItem } from "@/config/site-chrome-defaults";
import { BrandLogo } from "@/features/marketing/brand-logo";
import { LeadModalCta } from "@/features/leads/components/site-lead-capture-modal";
import { cn } from "@/lib/utils";

/** Fallback when Admin → Menus has not been saved yet. */
export const PUBLIC_NAV = DEFAULT_SITE_CHROME.nav;

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red";

function navIsCurrent(pathname: string, item: SiteNavItem) {
  // Off-Plan and Buy share the listings route — leave both unmarked so we
  // don't light up the wrong one without reading the query string.
  if (item.label === "Off-Plan" || item.label === "Buy") return false;
  if (item.kind === "lead" || item.label === "Enquire to rent") {
    return pathname === "/contact";
  }
  if (item.label === "Insights") {
    return (
      pathname === "/market-insights" ||
      pathname === "/blog" ||
      pathname.startsWith("/blog/")
    );
  }
  const base = item.href.split("?")[0]!;
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function PublicSiteHeader({
  nav = PUBLIC_NAV,
  brandName = brand.name,
  headerCtaLabel = DEFAULT_SITE_CHROME.headerCtaLabel,
}: {
  nav?: SiteNavItem[];
  brandName?: string;
  headerCtaLabel?: string;
} = {}) {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  // Escape + rudimentary focus trap while the mobile drawer is open.
  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const firstLink = menuRef.current?.querySelector<HTMLElement>("a, button");
    firstLink?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !menuRef.current) return;

      const focusable = Array.from(
        menuRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (
        previouslyFocused &&
        document.contains(previouslyFocused) &&
        previouslyFocused !== toggleRef.current
      ) {
        // Leave focus alone if Escape already restored it to the toggle.
      }
    };
  }, [open]);

  // Close the drawer on navigation.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/92 backdrop-blur-[10px]">
      <div className="mx-auto flex h-[88px] max-w-[1180px] items-center justify-between gap-4 px-6">
        <Link
          href="/"
          className={cn("rounded-sm", FOCUS_RING)}
          aria-label={`${brandName} home`}
          onClick={() => setOpen(false)}
        >
          <BrandLogo />
        </Link>

        <nav
          className="hidden items-center gap-[30px] lg:flex"
          aria-label="Primary"
        >
          {nav.map((item) => {
            const current = navIsCurrent(pathname, item);
            if (item.kind === "lead" || item.label === "Enquire to rent") {
              return (
                <LeadModalCta
                  key={item.label}
                  leadSource="nav_rent"
                  campaign="header"
                  className={cn(
                    "rounded-sm text-sm font-medium transition hover:text-red",
                    FOCUS_RING,
                    current ? "text-red" : "text-ink",
                  )}
                >
                  {item.label}
                </LeadModalCta>
              );
            }
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "rounded-sm text-sm font-medium transition hover:text-red",
                  FOCUS_RING,
                  current ? "text-red" : "text-ink",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <LeadModalCta
            leadSource="list_property"
            campaign="header"
            className={cn(
              "rounded-[2px] bg-red px-[18px] py-[9px] text-[13px] font-semibold text-white transition hover:bg-red-dark",
              FOCUS_RING,
            )}
          >
            {headerCtaLabel}
          </LeadModalCta>
          <Link
            href="/login?next=/admin"
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-[2px] border border-line text-slate transition hover:border-red hover:text-red",
              FOCUS_RING,
            )}
            aria-label="Admin login"
            title="Admin login"
          >
            <LogIn className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href="/login?next=/admin"
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-[2px] border border-line text-slate transition hover:border-red hover:text-red",
              FOCUS_RING,
            )}
            aria-label="Admin login"
            title="Admin login"
          >
            <LogIn className="h-4 w-4" strokeWidth={2} />
          </Link>
          <button
            ref={toggleRef}
            type="button"
            className={cn(
              "rounded-sm text-[26px] leading-none text-ink",
              FOCUS_RING,
            )}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "×" : "☰"}
          </button>
        </div>
      </div>

      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          className="border-t border-line bg-white px-6 py-4 lg:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {nav.map((item) => {
              const current = navIsCurrent(pathname, item);
              if (item.kind === "lead" || item.label === "Enquire to rent") {
                return (
                  <LeadModalCta
                    key={`m-${item.label}`}
                    leadSource="nav_rent"
                    campaign="header-mobile"
                    className={cn(
                      "rounded-sm py-2.5 text-left text-sm font-medium",
                      FOCUS_RING,
                      current ? "text-red" : "text-ink",
                    )}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </LeadModalCta>
                );
              }
              return (
                <Link
                  key={`m-${item.label}`}
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "rounded-sm py-2.5 text-sm font-medium",
                    FOCUS_RING,
                    current ? "text-red" : "text-ink",
                  )}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
            <LeadModalCta
              leadSource="list_property"
              campaign="header-mobile"
              className={cn(
                "mt-2 inline-flex items-center justify-center rounded-[2px] bg-red px-4 py-2.5 text-[13px] font-semibold text-white",
                FOCUS_RING,
              )}
              onClick={() => setOpen(false)}
            >
              {headerCtaLabel}
            </LeadModalCta>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
