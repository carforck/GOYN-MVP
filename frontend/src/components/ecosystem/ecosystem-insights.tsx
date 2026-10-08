"use client";

import { InfoIcon } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  HELICES,
  type EcosystemMetrics,
  type HeliceCode,
} from "@/lib/ecosystem-metrics";
import { cn } from "@/lib/utils";

// "Lo que el mapa no muestra": cobertura, colaboración entre sectores, apertura (E-I) y
// cuadrante de roles. Color: secuencial violeta para magnitudes; categórico (hélices) para
// identidad, validado para daltonismo. Cada gráfica trae su tabla equivalente.

const heliceColor = (code: HeliceCode) =>
  HELICES.find((h) => h.code === code)!.color;
const heliceLabel = (code: HeliceCode) =>
  HELICES.find((h) => h.code === code)!.label;

// Rampa secuencial (un solo tono, claro → oscuro). 0 se marca con trama: es una brecha.
const RAMP = ["#F1E6FF", "#DCC2FF", "#BE8CFF", "#9B4DFF", "#7A00CC"];
function rampFor(count: number, max: number) {
  if (count <= 0) return null;
  const step =
    max <= 1
      ? 0
      : Math.min(
          RAMP.length - 1,
          Math.floor(((count - 1) / Math.max(1, max - 1)) * (RAMP.length - 1)),
        );
  return { bg: RAMP[step], ink: step >= 3 ? "#FFFFFF" : "#060A28" };
}

type Tip = { x: number; y: number; title: string; body: string; items?: string[] } | null;
type TipApi = {
  show: (
    e: React.MouseEvent | React.FocusEvent,
    title: string,
    body: string,
    items?: string[],
  ) => void;
  hide: () => void;
};

// Zona con tooltip propio: posiciona la burbuja sobre el elemento señalado.
function TipArea({
  className,
  children,
}: {
  className?: string;
  children: (tip: TipApi) => React.ReactNode;
}) {
  const [tip, setTip] = useState<Tip>(null);
  const api: TipApi = {
    show: (e, title, body, items) => {
      const box = (e.currentTarget as Element).closest("[data-tip-area]")?.getBoundingClientRect();
      const target = (e.currentTarget as Element).getBoundingClientRect();
      if (!box) return;
      setTip({
        x: target.left + target.width / 2 - box.left,
        y: target.top - box.top,
        title,
        body,
        items,
      });
    },
    hide: () => setTip(null),
  };
  return (
    <div data-tip-area className={cn("relative", className)}>
      {children(api)}
      {tip && (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-20 w-max max-w-64 -translate-x-1/2 -translate-y-full rounded-xl border bg-card px-3 py-2 text-xs shadow-xl"
          style={{ left: tip.x, top: tip.y - 8 }}
        >
          <p className="font-bold text-foreground">{tip.title}</p>
          <p className="mt-0.5 text-muted-foreground">{tip.body}</p>
          {tip.items && (
            <ul className="mt-1.5 space-y-0.5 text-foreground">
              {tip.items.map((it) => (
                <li key={it} className="flex gap-1.5">
                  <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-goyn-violeta" />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Card({
  title,
  how,
  help,
  children,
  table,
  className,
}: {
  title: string;
  how: string;
  help: { lee: string; ejemplo: string; ojo: string };
  children: React.ReactNode;
  table: React.ReactNode;
  className?: string;
}) {
  return (
    <figure
      className={cn("min-w-0 rounded-3xl border bg-card p-5 sm:p-6", className)}
    >
      <figcaption>
        <h3 className="font-heading text-lg font-bold text-foreground">
          {title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{how}</p>
        <ChartHelp title={title} help={help} />
      </figcaption>
      <div className="mt-5">{children}</div>
      <details className="group mt-4 text-sm">
        <summary className="cursor-pointer font-semibold text-goyn-violeta">
          Ver como tabla
        </summary>
        <div className="mt-3 overflow-x-auto">{table}</div>
      </details>
    </figure>
  );
}

// Ventana explicativa en lenguaje sencillo (acuerdo del 08-oct: gráficas técnicas comprensibles
// para personas sin formación en análisis de datos).
function ChartHelp({ title, help }: { title: string; help: { lee: string; ejemplo: string; ojo: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-goyn-lila/70 px-3 py-1 text-xs font-bold text-goyn-violeta hover:bg-goyn-lila"
      >
        <InfoIcon className="size-3.5" aria-hidden /> ¿Cómo leer esta gráfica?
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg gap-4 rounded-3xl p-6 sm:max-w-lg">
          <DialogTitle className="pr-6 font-heading text-xl font-bold text-goyn-violeta">{title}</DialogTitle>
          <div className="space-y-3 text-sm leading-relaxed text-foreground/85">
            <p><strong className="text-foreground">Cómo se lee:</strong> {help.lee}</p>
            <p><strong className="text-foreground">Ejemplo:</strong> {help.ejemplo}</p>
            <p className="rounded-xl bg-goyn-amarillo/15 p-3"><strong className="text-foreground">Ten en cuenta:</strong> {help.ojo}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

const th = "border-b px-2 py-1.5 text-left font-semibold text-muted-foreground";
const td = "border-b px-2 py-1.5 tabular-nums text-foreground";

function HeliceLegend() {
  return (
    <ul
      className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground"
      aria-label="Sectores (hélices)"
    >
      {HELICES.map((h) => (
        <li key={h.code} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-2.5 rounded-full"
            style={{ backgroundColor: h.color }}
          />
          {h.label}
        </li>
      ))}
    </ul>
  );
}

// ─── 1. Mapa de cobertura ─────────────────────────────────────────────────────
function Coverage({ data }: { data: EcosystemMetrics["coverage"] }) {
  const max = Math.max(1, ...data.cells.map((c) => c.count));
  const cell = (t: string, a: string) =>
    data.cells.find((c) => c.territory === t && c.area === a)!;
  const gaps = data.cells.filter((c) => c.count === 0).length;
  const fragile = data.cells.filter((c) => c.count === 1).length;
  return (
    <Card
      className="lg:col-span-2"
      title="¿Dónde declaran trabajar las organizaciones, por área?"
      how={`Cada celda cuenta las organizaciones que dicen trabajar en esa localidad y en esa área de impacto (no es su sede ni cuenta programas). Con trama: nadie declara trabajar ahí. Con punto: solo una organización. Hoy hay ${gaps} brechas y ${fragile} zonas que dependen de una sola.`}
      help={{
        lee: "Las filas son localidades y las columnas, áreas de impacto. El número dice cuántas organizaciones declaran trabajar en esa localidad atendiendo esa área. Más oscuro = más organizaciones.",
        ejemplo: "Si la celda Galapa · Bienestar y salud muestra 3, tres organizaciones dicen trabajar en Galapa en temas de bienestar y salud. Pasa el cursor para ver cuáles.",
        ojo: "Muestra dónde dicen trabajar las organizaciones, no dónde está su sede (eso lo muestran los puntos del mapa) ni si hay un programa activo allí. La capa de programas por territorio está por validar con GOYN.",
      }}
      table={
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className={th}>Territorio</th>
              {data.areas.map((a) => (
                <th key={a.code} className={th}>
                  {a.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.territories.map((t) => (
              <tr key={t.code}>
                <td className={td}>{t.label}</td>
                {data.areas.map((a) => (
                  <td key={a.code} className={td}>
                    {cell(t.code, a.code).count}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <p className="mb-1 text-[11px] font-semibold text-goyn-violeta sm:hidden">Desliza para ver toda la gráfica →</p>
      <TipArea className="overflow-x-auto">
        {(tip) => (
          <>
            <div
              className="grid min-w-[640px] gap-[2px]"
              style={{
                gridTemplateColumns: `minmax(120px,1.3fr) repeat(${data.areas.length}, minmax(0,1fr))`,
              }}
            >
              <span />
              {data.areas.map((a) => (
                <span
                  key={a.code}
                  className="px-1 pb-1 text-center text-[11px] leading-tight font-semibold text-muted-foreground"
                >
                  {a.label}
                </span>
              ))}
              {data.territories.map((t) => (
                <div key={t.code} className="contents">
                  <span className="flex items-center pr-2 text-xs font-semibold text-foreground">
                    {t.label}
                  </span>
                  {data.areas.map((a) => {
                    const c = cell(t.code, a.code);
                    const color = rampFor(c.count, max);
                    return (
                      <button
                        key={a.code}
                        type="button"
                        onMouseEnter={(e) =>
                          tip.show(
                            e,
                            `${t.label} · ${a.label}`,
                            c.count
                              ? `${c.count} organización${c.count > 1 ? "es" : ""} declara${c.count > 1 ? "n" : ""} trabajar aquí en esta área:`
                              : "Brecha: ninguna organización declara trabajar aquí en esta área.",
                            c.count ? [...c.orgs.slice(0, 8), ...(c.count > 8 ? [`y ${c.count - 8} más`] : [])] : undefined,
                          )
                        }
                        onFocus={(e) =>
                          tip.show(
                            e,
                            `${t.label} · ${a.label}`,
                            c.count ? `${c.count} organizaciones` : "Brecha",
                          )
                        }
                        onMouseLeave={tip.hide}
                        onBlur={tip.hide}
                        aria-label={`${t.label}, ${a.label}: ${c.count}`}
                        className="relative grid h-10 place-items-center rounded-[4px] text-xs font-bold tabular-nums transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-goyn-violeta focus-visible:outline-none"
                        style={
                          color
                            ? { backgroundColor: color.bg, color: color.ink }
                            : {
                                backgroundImage:
                                  "repeating-linear-gradient(45deg, #e9e4f5 0 2px, transparent 2px 7px)",
                                color: "#6b6790",
                              }
                        }
                      >
                        {c.count}
                        {c.count === 1 && (
                          <span
                            aria-hidden
                            className="absolute top-1 right-1 size-1.5 rounded-full bg-goyn-navy"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
        )}
      </TipArea>
      <div
        className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground"
        aria-hidden
      >
        <span className="flex items-center gap-1.5">
          <span
            className="size-3 rounded-[3px]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, #d9d2ee 0 2px, transparent 2px 6px)",
            }}
          />{" "}
          Brecha
        </span>
        <span className="flex items-center gap-1.5">Menos</span>
        {RAMP.map((c) => (
          <span
            key={c}
            className="h-3 w-5 rounded-[3px]"
            style={{ backgroundColor: c }}
          />
        ))}
        <span>Más organizaciones</span>
      </div>
    </Card>
  );
}

// ─── 2. Matriz de colaboración entre sectores ─────────────────────────────────
function Matrix({ data }: { data: EcosystemMetrics["matrix"] }) {
  const max = Math.max(1, ...data.counts.flat());
  return (
    <Card
      title="¿Quién colabora con quién?"
      help={{
        lee: "Cada fila y cada columna es un sector (público, privado, academia, sociedad civil, juventudes). La celda donde se cruzan dice cuántas conexiones hay entre organizaciones de esos dos sectores.",
        ejemplo: "Si Privado × Juventudes muestra 10, hay 10 conexiones entre empresas o fundaciones y colectivos juveniles. Una celda vacía fuera de la diagonal es una oportunidad: dos sectores que todavía no trabajan juntos.",
        ojo: "Cuenta conexiones declaradas por las organizaciones, sin importar si son socios, aliados o colaboradores. La agrupación por sectores debe unificarse con la clasificación oficial de GOYN.",
      }}
      how={`Conexiones entre sectores (${data.total} en total). La diagonal es colaboración dentro del mismo sector; las celdas vacías fuera de ella son brechas de articulación.`}
      table={
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className={th} />
              {HELICES.map((h) => (
                <th key={h.code} className={th}>
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HELICES.map((h, i) => (
              <tr key={h.code}>
                <td className={td}>{h.label}</td>
                {HELICES.map((_, j) => (
                  <td key={j} className={td}>
                    {data.counts[i][j]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <TipArea className="">
        {(tip) => (
          <>
            <div
              className="grid gap-[2px]"
              style={{
                gridTemplateColumns: `minmax(90px,1.2fr) repeat(${HELICES.length}, minmax(0,1fr))`,
              }}
            >
              <span />
              {HELICES.map((h) => (
                <span
                  key={h.code}
                  className="flex flex-col items-center gap-1 pb-1 text-center text-[11px] leading-tight font-semibold text-muted-foreground"
                >
                  <span
                    aria-hidden
                    className="size-2 rounded-full"
                    style={{ backgroundColor: h.color }}
                  />
                  <span className="sm:hidden">{h.short}</span>
                  <span className="hidden sm:inline">{h.label}</span>
                </span>
              ))}
              {HELICES.map((row, i) => (
                <div key={row.code} className="contents">
                  <span className="flex items-center gap-1.5 pr-2 text-xs font-semibold text-foreground">
                    <span
                      aria-hidden
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: row.color }}
                    />
                    {row.label}
                  </span>
                  {HELICES.map((col, j) => {
                    const n = data.counts[i][j];
                    const color = rampFor(n, max);
                    return (
                      <button
                        key={col.code}
                        type="button"
                        onMouseEnter={(e) =>
                          tip.show(
                            e,
                            i === j
                              ? `Dentro de ${row.label}`
                              : `${row.label} ↔ ${col.label}`,
                            n
                              ? `${n} conexion${n > 1 ? "es" : ""}`
                              : "Sin conexiones: brecha de articulación",
                          )
                        }
                        onMouseLeave={tip.hide}
                        aria-label={`${row.label} con ${col.label}: ${n}`}
                        className={cn(
                          "grid h-11 place-items-center rounded-[4px] text-xs font-bold tabular-nums",
                          i === j && "ring-1 ring-goyn-navy/25 ring-inset",
                        )}
                        style={
                          color
                            ? { backgroundColor: color.bg, color: color.ink }
                            : {
                                backgroundImage:
                                  "repeating-linear-gradient(45deg, #e9e4f5 0 2px, transparent 2px 7px)",
                                color: "#6b6790",
                              }
                        }
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
        )}
      </TipArea>
    </Card>
  );
}

// ─── 3. Índice E-I: ¿cada sector se conecta hacia adentro o hacia afuera? ──────
function OpennessIndex({ data }: { data: EcosystemMetrics["ei"] }) {
  return (
    <Card
      title="¿Cada sector se abre a los demás?"
      help={{
        lee: "La barra va de −1 a +1. Hacia la izquierda (negativo), el sector se conecta sobre todo consigo mismo; hacia la derecha (positivo), sobre todo con otros sectores.",
        ejemplo: "Si Privado marca +0,48, las organizaciones privadas tienen más conexiones con otros sectores que entre ellas: es un sector abierto a articularse.",
        ojo: "En sectores con pocas organizaciones el valor tiende a salir alto aunque haya pocas conexiones. Úsalo junto a la gráfica «¿Quién colabora con quién?».",
      }}
      how="Índice E-I: de −1 (solo se conecta consigo mismo) a +1 (solo con otros sectores). En grupos pequeños el valor tiende a ser alto."
      table={
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className={th}>Sector</th>
              <th className={th}>Organizaciones</th>
              <th className={th}>Internas</th>
              <th className={th}>Externas</th>
              <th className={th}>E-I</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.helice}>
                <td className={td}>{d.label}</td>
                <td className={td}>{d.orgs}</td>
                <td className={td}>{d.internal}</td>
                <td className={td}>{d.external}</td>
                <td className={td}>
                  {d.index == null ? "—" : d.index.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <TipArea className="space-y-3">
        {(tip) => (
          <>
            <div
              className="flex justify-between text-[11px] font-semibold text-muted-foreground"
              aria-hidden
            >
              <span>← Hacia adentro</span>
              <span>Hacia afuera →</span>
            </div>
            {data.map((d) => {
              const v = d.index ?? 0;
              return (
                <div
                  key={d.helice}
                  className="grid grid-cols-[96px_1fr_40px] items-center gap-2"
                >
                  <span className="truncate text-xs font-semibold text-foreground">
                    {d.label}
                  </span>
                  <div
                    className="relative h-6"
                    onMouseEnter={(e) =>
                      tip.show(
                        e,
                        d.label,
                        d.index == null
                          ? "Sin conexiones"
                          : `${d.external} conexiones con otros sectores y ${d.internal} dentro del sector`,
                      )
                    }
                    onMouseLeave={tip.hide}
                  >
                    <span
                      aria-hidden
                      className="absolute inset-y-0 left-1/2 w-px bg-border"
                    />
                    {d.index != null && (
                      <span
                        className="absolute top-1 h-4 rounded-[4px]"
                        style={{
                          backgroundColor: heliceColor(d.helice),
                          left: v >= 0 ? "50%" : `${50 + v * 50}%`,
                          width: `${Math.max(1, Math.abs(v) * 50)}%`,
                        }}
                      />
                    )}
                  </div>
                  <span className="text-right text-xs font-bold text-foreground tabular-nums">
                    {d.index == null ? "—" : (v > 0 ? "+" : "") + v.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </>
        )}
      </TipArea>
    </Card>
  );
}

// ─── 4. Cuadrante de roles ────────────────────────────────────────────────────
function RoleQuadrant({
  actors,
  medians,
}: {
  actors: EcosystemMetrics["actors"];
  medians: EcosystemMetrics["medians"];
}) {
  const W = 1000,
    H = 420,
    P = { l: 48, r: 20, t: 40, b: 44 };
  const maxX = Math.max(1, ...actors.map((a) => a.degree));
  const maxY = Math.max(0.01, ...actors.map((a) => a.betweenness));
  const x = (v: number) => P.l + (v / maxX) * (W - P.l - P.r);
  const y = (v: number) => H - P.b - (v / maxY) * (H - P.t - P.b);
  const top = [...actors]
    .sort(
      (a, b) =>
        b.betweenness + b.degree / maxX - (a.betweenness + a.degree / maxX),
    )
    .slice(0, 4)
    .map((a) => a.slug);
  // Puntos con el mismo número de conexiones se separan un poco en horizontal para no encimarse.
  const jitter = new Map<string, number>();
  const byDegree = new Map<number, string[]>();
  for (const a of [...actors].sort((p, q) => p.betweenness - q.betweenness)) byDegree.set(a.degree, [...(byDegree.get(a.degree) ?? []), a.slug]);
  for (const slugs of byDegree.values()) slugs.forEach((slug, i) => jitter.set(slug, slugs.length > 1 ? ((i % 5) - 2) * 7 : 0));
  const quadrant = (a: { degree: number; betweenness: number }) =>
    a.betweenness > medians.betweenness
      ? a.degree > medians.degree
        ? "Articulador"
        : "Puente oculto"
      : a.degree > medians.degree
        ? "Conector local"
        : "Periférico";
  return (
    <Card
      className="lg:col-span-2"
      title="Cuadrante de roles en la red"
      help={{
        lee: "Cada punto es una organización. Más a la derecha: se conecta con más organizaciones. Más arriba: sirve de puente entre organizaciones que, sin ella, no estarían conectadas.",
        ejemplo: "Un punto arriba a la izquierda tiene pocas conexiones, pero son clave: es un «puente oculto» que conviene invitar a los espacios de gobernanza.",
        ojo: "Se calcula con las conexiones registradas en la plataforma: una organización que aún no ha registrado sus alianzas aparecerá abajo a la izquierda aunque en la realidad sea muy activa.",
      }}
      how="Derecha: se conecta con muchas organizaciones. Arriba: une a quienes de otro modo no estarían conectados. Arriba a la derecha están los articuladores; arriba a la izquierda, los puentes ocultos que conviene sumar a la gobernanza."
      table={
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className={th}>Organización</th>
              <th className={th}>Sector</th>
              <th className={th}>Conexiones</th>
              <th className={th}>Intermediación</th>
              <th className={th}>Posición</th>
            </tr>
          </thead>
          <tbody>
            {[...actors]
              .sort((a, b) => b.betweenness - a.betweenness)
              .map((a) => (
                <tr key={a.slug}>
                  <td className={td}>{a.name}</td>
                  <td className={td}>{heliceLabel(a.helice)}</td>
                  <td className={td}>{a.degree}</td>
                  <td className={td}>{a.betweenness.toFixed(3)}</td>
                  <td className={td}>{quadrant(a)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      }
    >
      <HeliceLegend />
      <p className="mb-1 text-[11px] font-semibold text-goyn-violeta sm:hidden">Desliza para ver toda la gráfica →</p>
      <TipArea className="mt-3 overflow-x-auto">
        {(tip) => (
          <>
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="h-auto w-full min-w-[640px]"
              role="img"
              aria-label="Dispersión de organizaciones por conexiones e intermediación"
            >
              {[0.25, 0.5, 0.75, 1].map((f) => (
                <line
                  key={f}
                  x1={P.l}
                  x2={W - P.r}
                  y1={y(maxY * f)}
                  y2={y(maxY * f)}
                  stroke="currentColor"
                  className="text-border"
                  strokeWidth={1}
                />
              ))}
              <line
                x1={x(medians.degree)}
                x2={x(medians.degree)}
                y1={P.t}
                y2={H - P.b}
                stroke="#060A28"
                strokeOpacity={0.25}
                strokeDasharray="4 4"
              />
              <line
                x1={P.l}
                x2={W - P.r}
                y1={y(medians.betweenness)}
                y2={y(medians.betweenness)}
                stroke="#060A28"
                strokeOpacity={0.25}
                strokeDasharray="4 4"
              />
              <g className="fill-muted-foreground text-[11px] font-semibold">
                <text x={W - P.r - 4} y={P.t - 16} textAnchor="end">
                  Articuladores
                </text>
                <text x={P.l + 6} y={P.t - 16}>
                  Puentes ocultos
                </text>
                <text x={W - P.r - 4} y={H - P.b - 8} textAnchor="end">
                  Conectores locales
                </text>
                <text x={P.l + 6} y={H - P.b - 8}>
                  Periféricos
                </text>
              </g>
              <line
                x1={P.l}
                x2={W - P.r}
                y1={H - P.b}
                y2={H - P.b}
                stroke="#060A28"
                strokeOpacity={0.3}
              />
              <line
                x1={P.l}
                x2={P.l}
                y1={P.t}
                y2={H - P.b}
                stroke="#060A28"
                strokeOpacity={0.3}
              />
              <text
                x={(P.l + W - P.r) / 2}
                y={H - 8}
                textAnchor="middle"
                className="fill-muted-foreground text-[12px]"
              >
                Conexiones directas →
              </text>
              <text
                x={14}
                y={(P.t + H - P.b) / 2}
                textAnchor="middle"
                transform={`rotate(-90 14 ${(P.t + H - P.b) / 2})`}
                className="fill-muted-foreground text-[12px]"
              >
                Intermediación →
              </text>
              {Array.from({ length: maxX + 1 }, (_, i) => i)
                .filter((i) => maxX <= 10 || i % 2 === 0)
                .map((i) => (
                  <text
                    key={i}
                    x={x(i)}
                    y={H - P.b + 14}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[10px] tabular-nums"
                  >
                    {i}
                  </text>
                ))}
              {actors.map((a) => (
                <circle
                  key={a.slug}
                  cx={x(a.degree) + (jitter.get(a.slug) ?? 0)}
                  cy={y(a.betweenness)}
                  r={6}
                  fill={heliceColor(a.helice)}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  tabIndex={0}
                  className="cursor-pointer outline-none focus-visible:stroke-goyn-navy"
                  onMouseEnter={(e) =>
                    tip.show(
                      e,
                      a.name,
                      `${heliceLabel(a.helice)} · ${a.degree} conexiones · ${quadrant(a)}`,
                    )
                  }
                  onFocus={(e) =>
                    tip.show(
                      e,
                      a.name,
                      `${heliceLabel(a.helice)} · ${a.degree} conexiones · ${quadrant(a)}`,
                    )
                  }
                  onMouseLeave={tip.hide}
                  onBlur={tip.hide}
                />
              ))}
              {actors
                .filter((a) => top.includes(a.slug))
                .map((a) => (
                  <text
                    key={a.slug}
                    x={x(a.degree) + (jitter.get(a.slug) ?? 0) - 10}
                    y={y(a.betweenness) + 4}
                    textAnchor="end"
                    className="fill-foreground text-[11px] font-semibold"
                  >
                    {a.name.length > 26 ? `${a.name.slice(0, 25)}…` : a.name}
                  </text>
                ))}
            </svg>
          </>
        )}
      </TipArea>
    </Card>
  );
}

export function EcosystemInsights({
  metrics,
  shown,
}: {
  metrics: EcosystemMetrics;
  shown: number;
}) {
  return (
    <section aria-labelledby="insights" data-tour="graficas" className="space-y-5 pt-6">
      <div className="space-y-2">
        <span className="goyn-eyebrow">Análisis del ecosistema</span>
        <h2
          id="insights"
          className="font-heading text-2xl font-bold text-foreground sm:text-3xl"
        >
          Lo que el mapa no muestra
        </h2>
        <p className="max-w-3xl text-muted-foreground">
          Cobertura y articulación de las {shown} organizaciones visibles con
          los filtros actuales. Pasa el cursor sobre cada celda o punto para ver
          el detalle.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Coverage data={metrics.coverage} />
        <Matrix data={metrics.matrix} />
        <OpennessIndex data={metrics.ei} />
        <RoleQuadrant actors={metrics.actors} medians={metrics.medians} />
      </div>
    </section>
  );
}
