"use client";

import Script from "next/script";
import { useEffect } from "react";

const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "";
const googleTagId = process.env.NEXT_PUBLIC_GOOGLE_TAG_ID?.trim() || "";
const googleSendTo =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_SEND_TO?.trim() || "";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function StatureAdsScripts() {
  if (!pixelId && !googleTagId) return null;

  return (
    <>
      {pixelId ? (
        <Script id="stature-meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
            (window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      ) : null}
      {googleTagId ? (
        <>
          <Script
            id="stature-gtag"
            src={`https://www.googletagmanager.com/gtag/js?id=${googleTagId}`}
            strategy="afterInteractive"
          />
          <Script id="stature-gtag-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${googleTagId}');
            `}
          </Script>
        </>
      ) : null}
    </>
  );
}

export function StatureLeadConversion() {
  useEffect(() => {
    window.fbq?.("track", "Lead");
    if (googleSendTo) {
      window.gtag?.("event", "conversion", { send_to: googleSendTo });
    } else if (googleTagId) {
      window.gtag?.("event", "generate_lead");
    }
  }, []);
  return null;
}
