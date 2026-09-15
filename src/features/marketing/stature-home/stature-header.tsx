"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";

import { stature, statureNav } from "@/config/stature";
import { StatureLeadCta } from "@/features/marketing/stature-home/stature-lead-modal";
import { cn } from "@/lib/utils";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--red)]";

export function StatureHeader() {
  const [open, setOpen] = useState(false);
  const [hash, setHash] = useState("#top");
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    function sync() {
      setHash(window.location.hash || "#top");
    }
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    const firstLink = menuRef.current?.querySelector<HTMLElement>("a, button");
    firstLink?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <header className="stature-header sticky top-0 z-50 border-b border-line">
      <div className="mx-auto flex h-[88px] max-w-[1180px] items-center justify-between gap-4 px-6">
        <a
          href="#top"
          className={cn("rounded-sm", FOCUS)}
          aria-label={`${stature.legalName} home`}
          onClick={() => setOpen(false)}
        >
          <Image
            src={stature.logo}
            alt={stature.legalName}
            width={627}
            height={314}
            priority
            unoptimized
            className="stature-logo"
            style={{ width: "auto", height: 52 }}
          />
        </a>

        <nav className="hidden items-center gap-[30px] lg:flex" aria-label="Primary">
          {statureNav.map((item) => {
            const id = item.href.includes("#")
              ? `#${item.href.split("#")[1]}`
              : item.href;
            const current = hash === id;
            return (
              <a
                key={item.label}
                href={item.href}
                aria-current={current ? "location" : undefined}
                className={cn(
                  "rounded-sm text-sm font-medium transition hover:text-[var(--red)]",
                  FOCUS,
                  current ? "text-[var(--red)]" : "text-ink",
                )}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {stature.phone ? (
            <a
              href={stature.phoneHref}
              className={cn(
                "rounded-sm text-sm font-medium text-ink hover:text-[var(--red)]",
                FOCUS,
              )}
            >
              {stature.phone}
            </a>
          ) : null}
          <StatureLeadCta source="header" className={cn("stature-header-cta", FOCUS)}>
            Talk to us
          </StatureLeadCta>
        </div>

        <button
          ref={toggleRef}
          type="button"
          className={cn(
            "rounded-sm text-[26px] leading-none text-ink lg:hidden",
            FOCUS,
          )}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "×" : "☰"}
        </button>
      </div>

      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          className="border-t border-line bg-white px-6 py-4 lg:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {statureNav.map((item) => (
              <a
                key={`m-${item.label}`}
                href={item.href}
                className={cn(
                  "rounded-sm py-2.5 text-sm font-medium text-ink",
                  FOCUS,
                )}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <StatureLeadCta
              source="header-mobile"
              className={cn("stature-header-cta mt-2", FOCUS)}
              onClick={() => setOpen(false)}
            >
              Talk to us
            </StatureLeadCta>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
