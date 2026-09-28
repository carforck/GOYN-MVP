"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useLive } from "@/components/live/live-provider";
import { label, shortTerritory } from "@/lib/catalogs";
import type { LiveEvent } from "@/lib/live/types";
import { cn } from "@/lib/utils";

const indicatorColor = { conectados: "#9B00FF", fortalecidos: "#00A0CC", transformados: "#FF01A2" } as const;

export function describeEvent(e: LiveEvent) {
  if (e.kind === "conexion") return e.targetName ? `nueva conexión con ${e.targetName}` : "registró una nueva conexión";
  if (e.kind === "registro") return "se publicó en el mapa del ecosistema";
  return `+${e.delta} ${label("indicators", e.indicator).toLowerCase()}`;
}

// Últimos eventos del ecosistema, el más reciente entra animado por arriba.
export function LiveFeed({ limit = 5, className, dark = false }: { limit?: number; className?: string; dark?: boolean }) {
  const live = useLive();
  const events = live.events.slice(0, limit);
  return (
    <div className={cn("space-y-2", className)} aria-live="polite">
      <p className={cn("flex items-center gap-2 text-xs font-bold tracking-wider uppercase", dark ? "text-white/70" : "text-muted-foreground")}>
        <span className="goyn-live-dot" aria-hidden />
        {live.source === "demo" ? "Actividad en vivo · simulación demo" : "Actividad en vivo"}
      </p>
      <ul className="space-y-1.5">
        <AnimatePresence initial={false}>
          {events.map((e) => (
            <motion.li
              key={e.id}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className={cn("flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm", dark ? "bg-white/8 text-white" : "bg-card text-foreground shadow-sm")}
            >
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: e.kind === "reporte" && e.indicator ? indicatorColor[e.indicator] : e.kind === "conexion" ? "#FE5200" : "#0AA066" }}
              />
              <span className="min-w-0 flex-1 truncate">
                <Link href={`/actores/${e.orgSlug}`} className="font-bold hover:underline">{e.orgName}</Link>{" "}
                <span className={dark ? "text-white/75" : "text-muted-foreground"}>{describeEvent(e)}</span>
              </span>
              {e.territory && <span className={cn("hidden shrink-0 text-xs sm:inline", dark ? "text-white/55" : "text-muted-foreground")}>{shortTerritory(e.territory)}</span>}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
