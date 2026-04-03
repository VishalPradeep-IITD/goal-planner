"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CorpusPoint } from "@/lib/calculations/project";
import { formatInr } from "@/lib/format/inr";

interface CorpusChartProps {
  data: CorpusPoint[];
  targetInr: number;
}

export function CorpusChart({ data, targetInr }: CorpusChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: d.yearFraction.toFixed(1),
  }));

  return (
    <div className="h-[280px] w-full min-w-0 overflow-x-auto sm:h-[320px]">
      <ResponsiveContainer width="100%" height="100%" minWidth={300}>
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="corpusFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="yearFraction"
            tickFormatter={(v) => `${v}y`}
            className="text-[10px] sm:text-xs"
            stroke="var(--color-muted-foreground)"
          />
          <YAxis
            tickFormatter={(v) => formatInr(v)}
            width={72}
            className="text-[10px] sm:text-xs"
            stroke="var(--color-muted-foreground)"
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const row = payload[0].payload as CorpusPoint;
              return (
                <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
                  <p className="font-medium">
                    Year {row.yearFraction.toFixed(1)}
                  </p>
                  <p className="text-muted-foreground">
                    Corpus: {formatInr(row.corpusInr)}
                  </p>
                  <p className="text-muted-foreground">
                    Target: {formatInr(targetInr)}
                  </p>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="corpusInr"
            name="Projected corpus"
            stroke="var(--color-primary)"
            fill="url(#corpusFill)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
