"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useLive } from "@/components/live/live-provider";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const items = [
  { key: "organizations", label: "Organizaciones", color: "#060A28", href: "/actores" },
  { key: "programs", label: "Programas", color: "#0AA066", href: "/actores" },
  { key: "connections", label: "Conexiones", color: "#FE5200", href: "/mapa" },
  { key: "conectados", label: "Jóvenes conectados", color: "#9B00FF", href: "/impacto" },
  { key: "fortalecidos", label: "Jóvenes fortalecidos", color: "#00A0CC", href: "/impacto" },
  { key: "transformados", label: "Jóvenes transformados", color: "#FF01A2", href: "/impacto" },
] as const;

// Franja de cifras del ecosistema: contadores animados que se mueven con los datos en vivo.
export function LiveKpiStrip() {
  const { stats, source } = useLive();
  return (
    <div>
      <div className="grid grid-cols-2 gap-2 rounded-3xl border bg-card p-2 shadow-2xl shadow-goyn-violeta/15 sm:p-3 lg:grid-cols-6">
        {items.map((k, i) => (
          <motion.div
            key={k.key}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link href={k.href} className="group block rounded-2xl p-3 transition-colors hover:bg-muted sm:p-4">
              <span aria-hidden className="mb-3 block h-1.5 w-10 rounded-full transition-all group-hover:w-16" style={{ backgroundColor: k.color }} />
              <AnimatedNumber value={stats[k.key]} className="font-heading text-2xl font-bold text-foreground sm:text-3xl" />
              <p className="mt-1 text-xs font-semibold text-muted-foreground sm:text-sm">{k.label}</p>
            </Link>
          </motion.div>
        ))}
      </div>
      <p className="mt-3 flex flex-wrap items-center justify-center gap-x-2 text-center text-xs text-muted-foreground">
        <span className="goyn-live-dot" aria-hidden />
        {source === "demo" ? "Simulación en vivo con datos sintéticos" : "Actualizado en tiempo real"}
        <span aria-hidden>·</span> Cifras de jóvenes = suma de reportes validados (no personas únicas) · Corte {formatDate(stats.indicators_updated_at)}
      </p>
    </div>
  );
}

// Cifra protagonista: número grande animado con rótulo y definición.
export function BigStat({
  value,
  label,
  hint,
  color,
  className,
  dark = false,
  compact = false,
}: {
  value: number;
  label: string;
  hint?: string;
  color: string;
  className?: string;
  dark?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-3xl", compact ? "p-4 sm:p-5" : "p-6 sm:p-8", dark ? "bg-white/6 text-white" : "border bg-card", className)}>
      <span aria-hidden className="absolute -top-16 -right-16 size-48 rounded-full opacity-25 blur-3xl" style={{ backgroundColor: color }} />
      <p className={cn("text-xs font-bold tracking-widest uppercase", dark ? "text-white/70" : "text-muted-foreground")}>{label}</p>
      <AnimatedNumber
        value={value}
        className={cn("mt-2 block font-heading leading-none font-bold", compact ? "text-3xl xl:text-4xl" : "text-5xl sm:text-6xl", !dark && "text-foreground")}
      />
      <span aria-hidden className="mt-4 block h-1 w-16 rounded-full" style={{ backgroundColor: color }} />
      {hint && <p className={cn("mt-4 text-sm leading-relaxed", dark ? "text-white/70" : "text-muted-foreground")}>{hint}</p>}
    </div>
  );
}

export function LiveBigStats({ dark = false, withHints = false, compact = false }: { dark?: boolean; withHints?: boolean; compact?: boolean }) {
  const { stats } = useLive();
  return (
    <div className={cn("grid gap-3 sm:grid-cols-3", !compact && "gap-4")}>
      <BigStat compact={compact} dark={dark} value={stats.conectados} label="Jóvenes conectados" color="#9B00FF"
        hint={withHints ? "Jóvenes que interactúan con actividades, programas, talleres o sesiones del Colaborativo." : undefined} />
      <BigStat compact={compact} dark={dark} value={stats.fortalecidos} label="Jóvenes fortalecidos" color="#00A0CC"
        hint={withHints ? "Jóvenes que mejoran habilidades en procesos de formación de más de 5 horas." : undefined} />
      <BigStat compact={compact} dark={dark} value={stats.transformados} label="Jóvenes transformados" color="#FF01A2"
        hint={withHints ? "Jóvenes con empleo formal, emprendimiento formalizado o mejora estable de ingresos." : undefined} />
    </div>
  );
}
