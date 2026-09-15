"use client";

import type { ReactNode } from "react";

import {
  stashStatureEnquiry,
  type StatureEnquiryDraft,
} from "@/features/marketing/stature-home/enquiry-stash";
import { useStatureLead } from "@/features/marketing/stature-home/stature-lead-modal";

export function StatureStashLink({
  href,
  stash,
  className,
  children,
}: {
  href: string;
  stash: StatureEnquiryDraft;
  className?: string;
  children: ReactNode;
}) {
  const { openLead } = useStatureLead();
  return (
    <a
      href={href}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        stashStatureEnquiry(stash);
        openLead("listing");
      }}
    >
      {children}
    </a>
  );
}
