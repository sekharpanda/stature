"use client";

import { useState } from "react";

import { statureContent } from "@/config/stature";
import { stashStatureEnquiry } from "@/features/marketing/stature-home/enquiry-stash";
import { useStatureLead } from "@/features/marketing/stature-home/stature-lead-modal";

export function StatureHeroEnquire() {
  const { openLead } = useStatureLead();
  const [tab, setTab] = useState<(typeof statureContent.heroTabs)[number]>(
    statureContent.heroTabs[0],
  );
  const [q, setQ] = useState("");

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    stashStatureEnquiry({
      interest: tab,
      note: q.trim() || undefined,
    });
    openLead("hero");
  }

  return (
    <form className="hp-search" onSubmit={onSubmit}>
      <div className="hp-tabs" role="tablist">
        {statureContent.heroTabs.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={tab === item}
            className={`hp-tab${tab === item ? " on" : ""}`}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <label className="hp-search-field">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#8a8a8a"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={statureContent.hero.searchPlaceholder}
          aria-label="Preferred area, budget or bedrooms"
        />
      </label>
      <button type="submit" className="hp-go">
        Enquire
      </button>
    </form>
  );
}
