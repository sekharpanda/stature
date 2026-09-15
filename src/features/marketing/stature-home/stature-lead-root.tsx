"use client";

import type { ReactNode } from "react";

import { StatureLeadProvider } from "@/features/marketing/stature-home/stature-lead-modal";

import "@/features/marketing/homepage/homepage.css";
import "@/features/marketing/stature-home/stature-home.css";

export function StatureLeadRoot({ children }: { children: ReactNode }) {
  return <StatureLeadProvider>{children}</StatureLeadProvider>;
}
