"use client";

import { useId, useMemo, useState } from "react";
import { INCOME_AREA, type ProjectRow } from "@/lib/impact-metrics";
import { cn } from "@/lib/utils";
import { ChartCard, nf, RESULT_COLORS, type ResultKey } from "./shared";

type Option = { code: string; label: string };
type Cell = { z: string; a: string };

const METRICS: { key: ResultKey; label: string }[] = [
  { key: "conectados", label: "Conectados" },
  { key: "fortalecidos", label: "Fortalecidos" },
  { key: "transformados", label: "Transformados" },
];

// Nombre completo de la zona como en Actores (prefijo BAQ / AMB); la cobertura general, sin prefijo.
const zoneName = (label: string) =>
  label.replace(/^Presencia no focalizada \/ /, "");

// Pines 4 y 5: mapa de calor (zonas × área principal, celda = nº de programas) y top 10 de
// programas por resultado. Clic en una celda filtra el top a sus programas; otro clic la quita.
// Van apilados: con el contenedor de 1280px el mapa necesita todo el ancho para sus 7 columnas.
export function WhereExplorer({
  rows,
  zones,
  areas,
  incomeLabel,
}: {
  rows: ProjectRow[];
  zones: Option[];
  areas: Option[];
  incomeLabel: string;
}) {
  const [sel, setSel] = useState<Cell | null>(null);
  const [hover, setHover] = useState<Cell | null>(null);
  const [metric, setMetric] = useState<ResultKey>("conectados");
  const uid = useId();

  const cell = useMemo(() => {
    const map = new Map<string, ProjectRow[]>();
    for (const p of rows)
      for (const z of p.zones) {
        const k = `${z}|${p.area}`;
        map.set(k, [...(map.get(k) ?? []), p]);
      }
    return (z: string, a: string) => map.get(`${z}|${a}`) ?? [];
  }, [rows]);

  const max = Math.max(
    1,
    ...zones.flatMap((z) => areas.map((a) => cell(z.code, a.code).length)),
  );
  const zoneLabel = (code: string) =>
    zones.find((z) => z.code === code)?.label ?? code;
  const areaLabel = (code: string) =>
    areas.find((a) => a.code === code)?.label ?? code;

  const focus = hover ?? sel;
  const focusRows = focus
    ? [...cell(focus.z, focus.a)].sort(
        (x, y) => y.conectados.total - x.conectados.total,
      )
    : [];

  let base = sel ? cell(sel.z, sel.a) : rows;
  if (metric === "transformados")
    base = base.filter((p) => p.area === INCOME_AREA);
  const top = [...base]
    .filter((p) => p[metric].total > 0 || metric !== "transformados")
    .sort((x, y) => y[metric].total - x[metric].total)
    .slice(0, 10);
  const topMax = Math.max(1, ...top.map((p) => p[metric].total));
  const mname = metric;

  return (
    <div className="grid gap-6">
      <ChartCard
        id={`${uid}-heat`}
        title="Programas por zona y área de impacto"
        subtitle="Cada celda es el número de programas. Pasa el cursor (o enfoca la celda) para ver cuáles son; haz clic para ver su top de resultados."
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_17rem] xl:items-start">
          <div
            className="overflow-x-auto pb-2"
            tabIndex={0}
            role="region"
            aria-label="Mapa de calor con desplazamiento horizontal"
          >
            <p className="sticky left-0 mb-1 text-[11px] font-semibold text-goyn-violeta md:hidden">Desliza para ver todo →</p>
            <table className="w-full min-w-[720px] table-fixed border-separate border-spacing-1 text-xs">
              <caption className="sr-only">
                Número de programas por zona de incidencia (filas) y área
                principal (columnas)
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="w-32 sm:w-48" />
                  {areas.map((a) => (
                    <th
                      key={a.code}
                      scope="col"
                      className="px-1 pb-1 align-bottom leading-tight font-semibold text-balance text-muted-foreground"
                    >
                      {a.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody onMouseLeave={() => setHover(null)}>
                {zones.map((z) => (
                  <tr key={z.code}>
                    <th
                      scope="row"
                      className="pr-2 text-left leading-tight font-semibold text-foreground sm:whitespace-nowrap"
                    >
                      {zoneName(z.label)}
                    </th>
                    {areas.map((a) => {
                      const n = cell(z.code, a.code).length;
                      const isSel = sel?.z === z.code && sel?.a === a.code;
                      const t = n / max;
                      return (
                        <td key={a.code} className="p-0">
                          <button
                            type="button"
                            disabled={!n}
                            aria-pressed={isSel}
                            aria-label={`${zoneLabel(z.code)}, ${a.label}: ${n} programa${n === 1 ? "" : "s"}`}
                            onMouseEnter={() =>
                              n && setHover({ z: z.code, a: a.code })
                            }
                            onFocus={() =>
                              n && setHover({ z: z.code, a: a.code })
                            }
                            onBlur={() => setHover(null)}
                            onClick={() =>
                              setSel(isSel ? null : { z: z.code, a: a.code })
                            }
                            className={cn(
                              "flex h-9 w-full min-w-12 items-center justify-center rounded-md font-mono text-sm font-bold tabular-nums transition-shadow focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none disabled:cursor-default",
                              n
                                ? "cursor-pointer hover:ring-2 hover:ring-foreground/40"
                                : "bg-muted/60",
                              isSel && "ring-[3px] ring-foreground",
                            )}
                            style={
                              n
                                ? {
                                    backgroundColor: `color-mix(in oklab, ${RESULT_COLORS.conectados.solid} ${Math.round(15 + 85 * t)}%, var(--card))`,
                                    color:
                                      t > 0.45 ? "#fff" : "var(--foreground)",
                                  }
                                : undefined
                            }
                          >
                            {n || ""}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div
            className="min-h-24 rounded-xl bg-muted/50 p-3 text-sm"
            aria-live="polite"
          >
            {focus ? (
              <>
                <p className="font-bold text-foreground">
                  {zoneName(zoneLabel(focus.z))}
                </p>
                <p className="text-xs text-muted-foreground">
                  {areaLabel(focus.a)} · {focusRows.length} programa
                  {focusRows.length === 1 ? "" : "s"}
                </p>
                <ul className="mt-2 space-y-1">
                  {focusRows.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-wrap justify-between gap-x-3 text-xs"
                    >
                      <span className="min-w-0">
                        <strong className="text-foreground">{p.name}</strong>{" "}
                        <span className="text-muted-foreground">· {p.org}</span>
                      </span>
                      <span className="font-mono tabular-nums">
                        {nf.format(p.conectados.total)} conectados
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-muted-foreground">
                {rows.length
                  ? "Pasa el cursor o enfoca una celda para ver sus programas."
                  : "No hay programas en esta selección."}{" "}
                Un programa con varias zonas aparece en cada una de sus filas.
              </p>
            )}
          </div>
        </div>
      </ChartCard>

      <section
        aria-labelledby={`${uid}-top`}
        className="min-w-0 rounded-2xl border bg-card p-5 shadow-sm"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3
              id={`${uid}-top`}
              className="font-heading text-lg font-bold text-foreground"
            >
              {sel
                ? `Top programas en ${zoneName(zoneLabel(sel.z))}`
                : "Top 10 programas del ecosistema"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {sel ? `${areaLabel(sel.a)} · ` : ""}Ordenados por jóvenes {mname}
              {metric === "transformados" ? ` (solo ${incomeLabel})` : ""}.{" "}
              {top.length} de {nf.format(base.length)} programas.
            </p>
          </div>
          {sel && (
            <button
              type="button"
              onClick={() => setSel(null)}
              className="text-sm font-bold text-goyn-violeta underline-offset-4 hover:underline"
            >
              Ver todo el ecosistema
            </button>
          )}
        </div>
        <div
          role="group"
          aria-label="Resultado"
          className="mt-3 inline-flex rounded-full border bg-muted/40 p-1"
        >
          {METRICS.map((m) => (
            <button
              key={m.key}
              type="button"
              aria-pressed={metric === m.key}
              onClick={() => setMetric(m.key)}
              className="min-h-10 rounded-full px-2.5 py-1.5 text-xs font-semibold sm:min-h-0 sm:px-3 sm:text-sm text-muted-foreground transition-colors aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {m.label}
            </button>
          ))}
        </div>
        {top.length ? (
          <ol className="mt-4 max-w-4xl space-y-3">
            {top.map((p) => {
              const v = p[metric].total;
              return (
                <li
                  key={p.id}
                  className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]"
                >
                  <span className="min-w-0 leading-tight">
                    <span
                      className="block truncate text-sm font-semibold text-foreground"
                      title={p.name}
                    >
                      {p.name}
                    </span>
                    <span
                      className="block truncate text-xs text-muted-foreground"
                      title={p.org}
                    >
                      {p.org}
                    </span>
                  </span>
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden
                      className="h-4 rounded-r-md"
                      style={{
                        width: `${Math.max(2, (v / topMax) * 85)}%`,
                        backgroundColor: RESULT_COLORS[metric].base,
                      }}
                    />
                    <span className="shrink-0 font-mono text-xs font-semibold tabular-nums">
                      {nf.format(v)}
                    </span>
                    <span className="sr-only"> jóvenes {mname}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">
            {metric === "transformados"
              ? `No hay programas de ${incomeLabel} con transformados en esta selección.`
              : "No hay programas en esta selección."}
          </p>
        )}
      </section>
    </div>
  );
}
