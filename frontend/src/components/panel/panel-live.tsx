"use client";

import { ActivityIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMemo } from "react";
import { AreaTrendChart, type SeriesPoint } from "@/components/ecosystem/impact-charts";
import { useLive } from "@/components/live/live-provider";
import { describeEvent } from "@/components/live/live-ticker";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type Totals = { conectados: number; fortalecidos: number; transformados: number };

// Suma a los totales publicados lo que llega en vivo para esta organización.
function useOrgLive(slug: string) {
  const live = useLive();
  return useMemo(() => {
    const events = live.events.filter((e) => e.orgSlug === slug);
    const delta: Totals = { conectados: 0, fortalecidos: 0, transformados: 0 };
    for (const e of events) if (!e.historic && e.kind === "reporte" && e.indicator && e.delta) delta[e.indicator] += e.delta;
    return { events, delta, source: live.source, version: live.version };
  }, [live.events, live.source, live.version, slug]);
}

const cards = [
  { key: "conectados", label: "Jóvenes conectados", color: "#9B00FF", from: "from-goyn-violeta/25" },
  { key: "fortalecidos", label: "Jóvenes fortalecidos", color: "#00A0CC", from: "from-goyn-cian/25" },
  { key: "transformados", label: "Jóvenes transformados", color: "#FF01A2", from: "from-goyn-magenta/25" },
] as const;

export function PanelKpis({ slug, base }: { slug: string; base: Totals }) {
  const { delta } = useOrgLive(slug);
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((c, i) => {
        const value = base[c.key] + delta[c.key];
        return (
          <motion.div
            key={c.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className={cn("relative overflow-hidden rounded-3xl border bg-linear-to-br to-card p-6", c.from)}
          >
            <span aria-hidden className="absolute -right-10 -bottom-10 size-32 rounded-full opacity-30 blur-2xl" style={{ backgroundColor: c.color }} />
            <p className="flex items-center justify-between text-xs font-bold tracking-widest text-muted-foreground uppercase">
              {c.label}
              <span className="goyn-live-dot" aria-hidden />
            </p>
            <AnimatedNumber value={value} className="mt-3 block font-heading text-5xl leading-none font-bold text-foreground" />
            <span aria-hidden className="mt-4 block h-1 w-14 rounded-full" style={{ backgroundColor: c.color }} />
          </motion.div>
        );
      })}
    </div>
  );
}

export function PanelTrend({ slug, series }: { slug: string; series: SeriesPoint[] }) {
  const { delta } = useOrgLive(slug);
  // El último periodo crece con lo reportado en vivo (validación visual del tiempo real).
  const data = useMemo(() => {
    if (!series.length) return series;
    const last = series[series.length - 1];
    return [
      ...series.slice(0, -1),
      {
        ...last,
        conectados: last.conectados + delta.conectados,
        fortalecidos: last.fortalecidos + delta.fortalecidos,
        transformados: last.transformados + delta.transformados,
      },
    ];
  }, [series, delta]);
  return <AreaTrendChart data={data} />;
}

export function PanelActivity({ slug }: { slug: string }) {
  const { events, source } = useOrgLive(slug);
  const reduce = useReducedMotion();
  return (
    <div>
      <p className="mb-3 flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
        <ActivityIcon className="size-4 text-goyn-magenta" aria-hidden />
        {source === "demo" ? "Actividad de tu organización · simulación" : "Actividad de tu organización"}
      </p>
      {events.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Aquí verás en tiempo real los reportes aprobados y las nuevas conexiones de tu organización.
        </p>
      ) : (
        <ol className="relative space-y-3 border-l-2 border-goyn-lila pl-5">
          <AnimatePresence initial={false}>
            {events.slice(0, 6).map((e) => (
              <motion.li
                key={e.id}
                layout
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={reduce ? { duration: 0 } : undefined}
                className="relative rounded-2xl border bg-card p-3 text-sm"
              >
                <span aria-hidden className="absolute top-4 -left-[27px] size-3 rounded-full border-2 border-background bg-goyn-magenta" />
                <p className="font-semibold text-foreground">{describeEvent(e)}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(e.at)}</p>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      )}
    </div>
  );
}

// Anillo animado de completitud del perfil.
export function CompletenessRing({ value, size = 132 }: { value: number; size?: number }) {
  const r = (size - 16) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgb(255 255 255 / 0.2)" strokeWidth={10} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ring)"
          strokeWidth={10}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - value / 100) }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        />
        <defs>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFBD25" />
            <stop offset="100%" stopColor="#FF01A2" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <AnimatedNumber value={value} format={(n) => `${Math.round(n)}%`} className="font-heading text-3xl font-bold" />
          <p className="text-[11px] font-semibold text-white/75">perfil completo</p>
        </div>
      </div>
    </div>
  );
}
