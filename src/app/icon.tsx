import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          background: "#1B3F6E",
          color: "#2BB3A0",
          fontSize: 28,
          fontWeight: 600,
          fontFamily: "Georgia, Times New Roman, serif",
        }}
      >
        S
      </div>
    ),
    size,
  );
}
