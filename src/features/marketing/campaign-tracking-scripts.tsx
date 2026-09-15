"use client";

import { useEffect } from "react";
import Script from "next/script";

import type { LandingTrackingConfig } from "@/types/landing-campaign";

function injectHtmlSnippet(html: string, target: "head" | "body") {
  const container = document.createElement("div");
  container.innerHTML = html;
  const parent = target === "head" ? document.head : document.body;
  Array.from(container.childNodes).forEach((node) => {
    if (node.nodeName.toLowerCase() === "script") {
      const old = node as HTMLScriptElement;
      const script = document.createElement("script");
      Array.from(old.attributes).forEach((attr) => {
        script.setAttribute(attr.name, attr.value);
      });
      script.text = old.textContent || "";
      parent.appendChild(script);
    } else {
      parent.appendChild(node.cloneNode(true));
    }
  });
}

/**
 * Injects Google Ads / custom tracking snippets so pasted <script> tags execute.
 */
export function CampaignTrackingScripts({
  tracking,
}: {
  tracking: LandingTrackingConfig;
}) {
  const conversionId = tracking.conversionId?.trim();

  useEffect(() => {
    if (tracking.googleAdsHeadCode?.trim()) {
      injectHtmlSnippet(tracking.googleAdsHeadCode.trim(), "head");
    }
    if (tracking.customHeadCode?.trim()) {
      injectHtmlSnippet(tracking.customHeadCode.trim(), "head");
    }
    if (tracking.googleAdsBodyCode?.trim()) {
      injectHtmlSnippet(tracking.googleAdsBodyCode.trim(), "body");
    }
    if (tracking.customBodyCode?.trim()) {
      injectHtmlSnippet(tracking.customBodyCode.trim(), "body");
    }
  }, [
    tracking.googleAdsHeadCode,
    tracking.customHeadCode,
    tracking.googleAdsBodyCode,
    tracking.customBodyCode,
  ]);

  if (!conversionId) return null;

  // When only conversion ID is set (no full pasted head snippet), load gtag
  if (tracking.googleAdsHeadCode?.includes("gtag")) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${conversionId}`}
        strategy="afterInteractive"
      />
      <Script id={`gtag-init-${conversionId}`} strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${conversionId}');
        `}
      </Script>
    </>
  );
}
