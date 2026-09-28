"use client";

import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCompact, formatNumber } from "@/lib/format";

export type SeriesPoint = { period: string; conectados: number; fortalecidos: number; transformados: number };
export type CategoryPoint = { name: string; conectados: number; fortalecidos: number; transformados: number };

const COLORS = { conectados: "#9B00FF", fortalecidos: "#00A0CC", transformados: "#FF01A2" } as const;
const NAMES = { conectados: "Conectados", fortalecidos: "Fortalecidos", transformados: "Transformados" } as const;
const keys = ["conectados", "fortalecidos", "transformados"] as const;

const tooltipProps = {
  formatter: (value: unknown, name: unknown) => [formatNumber(Number(value)), String(name)] as [string, string],
  contentStyle: { borderRadius: 12, border: "1px solid #e6e1ef", fontFamily: "var(--font-quicksand)", fontSize: 13 },
};

export function TrendChart({ data }: { data: SeriesPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#eee8f5" vertical={false} />
        <XAxis dataKey="period" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis tickFormatter={formatCompact} tickLine={false} axisLine={false} fontSize={12} width={48} />
        <Tooltip {...tooltipProps} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
        {keys.map((k) => (
          <Line key={k} type="monotone" dataKey={k} name={NAMES[k]} stroke={COLORS[k]} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CategoryChart({ data, layout = "vertical" }: { data: CategoryPoint[]; layout?: "vertical" | "horizontal" }) {
  const height = layout === "vertical" ? Math.max(260, data.length * 44) : 320;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={layout} margin={{ top: 8, right: 16, left: 0, bottom: 0 }} barCategoryGap="22%">
        <CartesianGrid stroke="#eee8f5" horizontal={layout === "horizontal"} vertical={layout === "vertical"} />
        {layout === "vertical" ? (
          <>
            <XAxis type="number" tickFormatter={formatCompact} tickLine={false} axisLine={false} fontSize={12} />
            <YAxis type="category" dataKey="name" width={150} tickLine={false} axisLine={false} fontSize={12} />
          </>
        ) : (
          <>
            <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis tickFormatter={formatCompact} tickLine={false} axisLine={false} fontSize={12} width={48} />
          </>
        )}
        <Tooltip {...tooltipProps} cursor={{ fill: "#f4ecff" }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
        {keys.map((k) => (
          <Bar key={k} dataKey={k} name={NAMES[k]} fill={COLORS[k]} radius={layout === "vertical" ? [0, 6, 6, 0] : [6, 6, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
