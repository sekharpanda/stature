"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          background: "#faf9f8",
          color: "#141414",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: "480px", textAlign: "center" }}>
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "#A01919",
              fontWeight: 600,
            }}
          >
            Prowin Properties
          </p>
          <h1 style={{ margin: "16px 0 0", fontSize: "28px", lineHeight: 1.2 }}>
            Something went wrong
          </h1>
          <p style={{ margin: "16px 0 0", color: "#5b5b5b", lineHeight: 1.6 }}>
            The site ran into an unexpected error. Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "28px",
              background: "#A01919",
              color: "#fff",
              border: 0,
              borderRadius: "3px",
              padding: "12px 24px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
