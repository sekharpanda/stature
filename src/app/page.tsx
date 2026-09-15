import type { Metadata } from "next";

import { stature, statureContent } from "@/config/stature";
import { StatureHomepage } from "@/features/marketing/stature-home/stature-homepage";

export const metadata: Metadata = {
  title: { absolute: statureContent.seo.title },
  description: statureContent.seo.description,
  applicationName: stature.legalName,
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: stature.legalName,
    title: statureContent.seo.title,
    description: statureContent.seo.description,
  },
};

export default function HomePage() {
  return <StatureHomepage />;
}
