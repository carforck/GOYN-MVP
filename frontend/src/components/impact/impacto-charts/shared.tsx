import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Piezas comunes del dashboard "Resultados con jóvenes" (/impacto, ajuste 21).

// Colores de marca por resultado. `solid` es una variante más oscura para texto blanco encima (AA).
export const RESULT_COLORS = {
  conectados: { base: "#9B00FF", solid: "#7A00CC" },
  fortalecidos: { base: "#00A0CC", solid: "#00708F" },
  transformados: { base: "#FF01A2", solid: "#C2007B" },
} as const;

export type ResultKey = keyof typeof RESULT_COLORS;

export const nf = new Intl.NumberFormat("es-CO");

// Encabezado de bloque numerado, como en la propuesta.
export function BlockHead({
  id,
  badge,
  title,
  children,
}: {
  id: string;
  badge: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden
        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-goyn-violeta font-heading text-sm font-bold text-white"
      >
        {badge}
      </span>
      <div className="min-w-0">
        <h2 id={id} className="font-heading text-2xl font-bold text-foreground">
          {title}
        </h2>
        {children && (
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            {children}
          </p>
        )}
      </div>
    </div>
  );
}

export function PendingTag({
  children = "Por recolectar",
}: {
  children?: ReactNode;
}) {
  return (
    <span className="inline-flex items-center rounded-full bg-goyn-amarillo/25 px-2 py-0.5 text-[11px] font-bold text-foreground">
      {children}
    </span>
  );
}

// Tarjeta de cifra: rótulo, valor, descripción y, opcionalmente, porcentaje de mujeres.
export function StatCard({
  label,
  value,
  description,
  women,
  color = RESULT_COLORS.conectados.base,
}: {
  label: string;
  value: ReactNode;
  description: string;
  women?: string | null; // "54,8%" | null = por recolectar | undefined = no aplica
  color?: string;
}) {
  return (
    <article className="relative flex flex-col overflow-hidden rounded-2xl border bg-card p-5 shadow-sm">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1.5"
        style={{ backgroundColor: color }}
      />
      <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
        {label}
      </h3>
      <p className="mt-2 font-heading text-4xl font-bold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {women !== undefined && (
        <p className="mt-auto flex items-center gap-2 pt-3 text-sm font-semibold text-foreground">
          <span
            aria-hidden
            className="size-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          {women === null ? (
            <>
              Mujeres: <PendingTag />
            </>
          ) : (
            <>{women} son mujeres</>
          )}
        </p>
      )}
    </article>
  );
}

export function ChartCard({
  id,
  title,
  subtitle,
  className,
  children,
}: {
  id: string;
  title: string;
  subtitle?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className={cn(
        "min-w-0 rounded-2xl border bg-card p-5 shadow-sm",
        className,
      )}
    >
      <h3 id={id} className="font-heading text-lg font-bold text-foreground">
        {title}
      </h3>
      {subtitle && (
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}

// Eje horizontal compartido por las barras: marcas en porcentaje del ancho.
export function AxisTicks({ ticks, max }: { ticks: number[]; max: number }) {
  return (
    <div
      aria-hidden
      className="relative h-5 text-[11px] text-muted-foreground tabular-nums"
    >
      {ticks.map((t, i) => (
        <span
          key={t}
          // En móvil solo el primero, el del medio y el último, para que no se monten.
          className={cn(
            "absolute top-0 whitespace-nowrap",
            i !== 0 &&
              i !== ticks.length - 1 &&
              (ticks.length < 5 || i !== Math.floor((ticks.length - 1) / 2)) &&
              "max-sm:hidden",
          )}
          style={{
            left: `${(t / max) * 100}%`,
            transform:
              i === 0
                ? "none"
                : i === ticks.length - 1
                  ? "translateX(-100%)"
                  : "translateX(-50%)",
          }}
        >
          {nf.format(t)}
        </span>
      ))}
    </div>
  );
}

export function GridLines({ ticks, max }: { ticks: number[]; max: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {ticks.map((t) => (
        <span
          key={t}
          className="absolute inset-y-0 w-px bg-border"
          style={{ left: `${(t / max) * 100}%` }}
        />
      ))}
    </div>
  );
}
