import { ImageResponse } from "next/og";

import { stature, statureContent } from "@/config/stature";

export const alt = "Stature Properties — homes in Bengaluru";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b0f14",
          color: "#fff",
          padding: "72px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontSize: 42,
              fontWeight: 500,
              color: "#2BB3A0",
              fontFamily: "Georgia, Times New Roman, serif",
            }}
          >
            Stature
          </span>
          <span
            style={{
              fontSize: 14,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "#2BB3A0",
            }}
          >
            Properties Private Limited
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              display: "flex",
              fontSize: 58,
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
              maxWidth: 860,
            }}
          >
            {statureContent.hero.title}
          </div>
          <div style={{ display: "flex", fontSize: 24, color: "rgba(255,255,255,0.72)" }}>
            {`Bengaluru real estate · since ${stature.foundedYear}`}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 20,
            color: "rgba(255,255,255,0.6)",
          }}
        >
          {stature.city}
        </div>
      </div>
    ),
    size,
  );
}
