"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { ChartPoint } from "@/services/dashboard.service";
import { EmptyState } from "@/features/admin/components/shared/empty-state";
import { ChartColumn } from "lucide-react";

const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

type SeriesChartProps = {
  title: string;
  description?: string;
  data: ChartPoint[];
  type?: "bar" | "line" | "pie";
};

export function DashboardChart({
  title,
  description,
  data,
  type = "bar",
}: SeriesChartProps) {
  const hasData = data.some((point) => point.value > 0);
  const config = {
    value: {
      label: title,
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  return (
    <Card className="card-elevated border-border/80">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-xl">{title}</CardTitle>
        {description ? (
          <CardDescription>{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyState
            icon={ChartColumn}
            title="No chart data yet"
            description="Metrics will appear as leads, properties and traffic accumulate."
            className="border-0 bg-transparent py-8"
          />
        ) : type === "pie" ? (
          <ChartContainer config={config} className="mx-auto aspect-square max-h-64">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                innerRadius={52}
                outerRadius={84}
                strokeWidth={2}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.label}
                    fill={chartColors[index % chartColors.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        ) : type === "line" ? (
          <ChartContainer config={config} className="aspect-[16/9] max-h-64 w-full">
            <LineChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ChartContainer>
        ) : (
          <ChartContainer config={config} className="aspect-[16/9] max-h-64 w-full">
            <BarChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="value"
                fill="var(--color-value)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
