"use client";

import { Button } from "@/components/ui/button";

type CsvColumn = { key: string; label: string };

export function CsvDownloadButton({
  filename,
  columns,
  rows,
  label = "Download CSV",
}: {
  filename: string;
  columns: CsvColumn[];
  rows: Record<string, string | number>[];
  label?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => {
        const escape = (value: string | number) => {
          const text = String(value ?? "");
          if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
          return text;
        };
        const header = columns.map((c) => escape(c.label)).join(",");
        const body = rows
          .map((row) => columns.map((c) => escape(row[c.key] ?? "")).join(","))
          .join("\n");
        const blob = new Blob([`${header}\n${body}`], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }}
    >
      {label}
    </Button>
  );
}
