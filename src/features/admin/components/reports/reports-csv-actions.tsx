"use client";

import { Button } from "@/components/ui/button";

type Row = { metric: string; value: number };

function downloadCsv(filename: string, rows: Row[]) {
  const body = ["metric,value", ...rows.map((r) => `"${r.metric}",${r.value}`)].join(
    "\n",
  );
  const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ReportsCsvActions({
  inventoryRows,
  leadRows,
}: {
  inventoryRows: Row[];
  leadRows: Row[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        className="rounded-lg"
        onClick={() =>
          downloadCsv("prowin-inventory-report.csv", inventoryRows)
        }
      >
        Export inventory CSV
      </Button>
      <Button
        type="button"
        variant="outline"
        className="rounded-lg"
        onClick={() => downloadCsv("prowin-leads-report.csv", leadRows)}
      >
        Export leads CSV
      </Button>
    </div>
  );
}
