import type { ReactNode } from "react";

import { StatureFooter } from "@/features/marketing/stature-home/stature-footer";
import { StatureHeader } from "@/features/marketing/stature-home/stature-header";

import "@/features/marketing/homepage/homepage.css";
import "@/features/marketing/stature-home/stature-home.css";

export function StatureLegalShell({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  children: ReactNode;
}) {
  return (
    <div className="stature-home flex min-h-screen flex-col bg-[#faf9f8] text-[#141414]">
      <StatureHeader />
      <main className="flex-1 bg-white">
        <section className="border-b border-line bg-white px-6 py-16">
          <div className="mx-auto max-w-[760px]">
            <p className="hp-eyebrow">{eyebrow}</p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-medium tracking-tight">
              {title}
            </h1>
            <p className="mt-4 max-w-[58ch] text-[16px] leading-relaxed text-slate">
              {lede}
            </p>
          </div>
        </section>
        <section className="bg-mist px-6 py-14">
          <div className="stature-legal mx-auto max-w-[760px] space-y-6 text-[15px] leading-relaxed text-slate">
            {children}
          </div>
        </section>
      </main>
      <StatureFooter />
    </div>
  );
}
