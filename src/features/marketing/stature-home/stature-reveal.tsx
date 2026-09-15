"use client";

import { useEffect, useState } from "react";

export function StatureReveal({
  children,
  className = "",
  mode = "mount",
  delayMs = 0,
}: {
  children: React.ReactNode;
  className?: string;
  mode?: "mount" | "scroll";
  delayMs?: number;
}) {
  const [hydrated, setHydrated] = useState(false);
  const [inView, setInView] = useState(false);
  const [node, setNode] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return;
    }

    if (mode === "mount") {
      const t = window.setTimeout(() => setInView(true), 60 + delayMs);
      return () => window.clearTimeout(t);
    }

    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.16, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hydrated, mode, delayMs, node]);

  const pending = hydrated && !inView;

  return (
    <div
      ref={setNode}
      className={`hp-reveal${pending ? " hp-reveal--pending" : ""}${inView ? " in" : ""} ${className}`.trim()}
      style={
        delayMs && mode === "scroll"
          ? { transitionDelay: `${delayMs}ms` }
          : undefined
      }
    >
      {children}
    </div>
  );
}
