"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompact, formatNumber } from "@/lib/format";

export type SeriesPoint = { period: string; conectados: number; fortalecidos: number; transformados: number };
export type CategoryPoint = { name: string; conectados: number; fortalecidos: number; transformados: number };

// Colores del Manual de identidad; ejes y rejilla usan variables CSS para responder al modo oscuro.
const COLORS = { conectados: "#9B00FF", fortalecidos: "#00A0CC", transformados: "#FF01A2" } as const;
const NAMES = { conectados: "Conectados", fortalecidos: "Fortalecidos", transformados: "Transformados" } as const;
const keys = ["conectados", "fortalecidos", "transformados"] as const;

const axis = { tickLine: false, axisLine: false, fontSize: 12, tick: { fill: "var(--muted-foreground)" } } as const;
const tooltipProps = {
  formatter: (value: unknown, name: unknown) => [formatNumber(Number(value)), String(name)] as [string, string],
  contentStyle: {
    borderRadius: 12,
    border: "1px solid var(--border)",
    background: "var(--popover)",
    color: "var(--popover-foreground)",
    fontFamily: "var(--font-quicksand)",
    fontSize: 13,
  },
  labelStyle: { color: "var(--popover-foreground)", fontWeight: 700 },
};
const legend = { iconType: "circle" as const, wrapperStyle: { fontSize: 13, color: "var(--muted-foreground)" } };

export function TrendChart({ data }: { data: SeriesPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--grid)" vertical={false} />
        <XAxis dataKey="period" {...axis} />
        <YAxis tickFormatter={formatCompact} {...axis} width={48} />
        <Tooltip {...tooltipProps} />
        <Legend {...legend} />
        {keys.map((k) => (
          <Line key={k} type="monotone" dataKey={k} name={NAMES[k]} stroke={COLORS[k]} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} animationDuration={1400} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// Tendencia con áreas degradadas (panel de organización).
export function AreaTrendChart({ data, height = 280 }: { data: SeriesPoint[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <defs>
          {keys.map((k) => (
            <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS[k]} stopOpacity={0.45} />
              <stop offset="100%" stopColor={COLORS[k]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid stroke="var(--grid)" vertical={false} />
        <XAxis dataKey="period" {...axis} />
        <YAxis tickFormatter={formatCompact} {...axis} width={44} />
        <Tooltip {...tooltipProps} />
        <Legend {...legend} />
        {keys.map((k) => (
          <Area key={k} type="monotone" dataKey={k} name={NAMES[k]} stroke={COLORS[k]} strokeWidth={2.5} fill={`url(#grad-${k})`} animationDuration={1600} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CategoryChart({ data, layout = "vertical", height }: { data: CategoryPoint[]; layout?: "vertical" | "horizontal"; height?: number }) {
  const h = height ?? (layout === "vertical" ? Math.max(260, data.length * 44) : 320);
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data} layout={layout} margin={{ top: 8, right: 16, left: 0, bottom: 0 }} barCategoryGap="22%">
        <CartesianGrid stroke="var(--grid)" horizontal={layout === "horizontal"} vertical={layout === "vertical"} />
        {layout === "vertical" ? (
          <>
            <XAxis type="number" tickFormatter={formatCompact} {...axis} />
            <YAxis type="category" dataKey="name" width={150} {...axis} />
          </>
        ) : (
          <>
            <XAxis dataKey="name" {...axis} fontSize={11} interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis tickFormatter={formatCompact} {...axis} width={48} />
          </>
        )}
        <Tooltip {...tooltipProps} cursor={{ fill: "var(--lila)" }} />
        <Legend {...legend} />
        {keys.map((k) => (
          <Bar key={k} dataKey={k} name={NAMES[k]} fill={COLORS[k]} radius={layout === "vertical" ? [0, 6, 6, 0] : [6, 6, 0, 0]} animationDuration={1300} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// Proporción (p. ej. mujeres vs. total conectado).
export function DonutChart({ value, total, label, color = "#FF01A2" }: { value: number; total: number; label: string; color?: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const data = [
    { name: label, value },
    { name: "Resto", value: Math.max(0, total - value) },
  ];
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius="68%" outerRadius="92%" startAngle={90} endAngle={-270} stroke="none" animationDuration={1400}>
            <Cell fill={color} />
            <Cell fill="var(--grid)" />
          </Pie>
          <Tooltip {...tooltipProps} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="font-heading text-3xl font-bold text-foreground">{pct}%</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}
