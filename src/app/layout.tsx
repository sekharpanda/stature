import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import { stature, statureContent } from "@/config/stature";
import { StatureAdsScripts } from "@/features/marketing/stature-home/stature-ads";
import { StatureLeadRoot } from "@/features/marketing/stature-home/stature-lead-root";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const description = statureContent.seo.description;

export const metadata: Metadata = {
  title: {
    default: statureContent.seo.title,
    template: `%s | ${stature.name}`,
  },
  description,
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? stature.domain,
  ),
  applicationName: stature.legalName,
  openGraph: {
    type: "website",
    siteName: stature.legalName,
    url: process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? stature.domain,
    title: statureContent.seo.title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: statureContent.seo.title,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <body className={`${display.variable} ${sans.variable} antialiased`}>
        <StatureAdsScripts />
        <AppProviders>
          <StatureLeadRoot>{children}</StatureLeadRoot>
        </AppProviders>
      </body>
    </html>
  );
}
