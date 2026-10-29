import {
  formatPct,
  niceAxis,
  womenShare,
  type Measure,
} from "@/lib/impact-metrics";
import {
  AxisTicks,
  GridLines,
  nf,
  RESULT_COLORS,
  type ResultKey,
} from "./shared";

// Tono claro del total: la parte de mujeres (color sólido) queda como la más oscura e intensa.
const totalTone = (base: string) =>
  `color-mix(in oklab, ${base} 22%, var(--card))`;

// Pin 3: por indicador, barra con el total (tono claro) y, superpuesta, la parte de mujeres (tono
// oscuro). El "N total" va justo al final de cada barra; el área de trazado reserva un margen
// derecho para que quepa aunque la barra llegue al final del eje.
export function WomenBars({
  rows,
}: {
  rows: { key: ResultKey; label: string; m: Measure }[];
}) {
  const { max, ticks } = niceAxis(Math.max(...rows.map((r) => r.m.total), 0));
  // En móvil el rótulo va encima de la barra para dejarle todo el ancho.
  const grid = "grid gap-1 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-3";
  const plot = "min-w-0 pr-28 sm:pr-32";
  return (
    <div>
      <ul className="space-y-4">
        {rows.map(({ key, label, m }) => {
          const share = womenShare(m);
          const c = RESULT_COLORS[key];
          const totalW = (m.total / max) * 100;
          const womenW = share == null ? 0 : (m.total * share * 100) / max;
          const pctTxt = share == null ? null : formatPct(share);
          const inside = share != null && share >= 0.28;
          return (
            <li key={key} className={`${grid} items-center`}>
              <span className="text-sm font-semibold text-foreground">
                {label}
              </span>
              <div className={plot}>
                <div className="relative h-8">
                  <GridLines ticks={ticks} max={max} />
                  <div
                    role="img"
                    aria-label={`${label}: ${nf.format(m.total)} jóvenes en total${pctTxt ? `, ${pctTxt} mujeres` : ", dato de mujeres por recolectar"}`}
                    className="absolute inset-y-0 left-0 rounded-r-md"
                    style={{
                      width: `${totalW}%`,
                      backgroundColor: totalTone(c.base),
                    }}
                  >
                    {share != null && (
                      <div
                        className="flex h-full items-center justify-end overflow-hidden px-2 text-xs font-bold whitespace-nowrap text-white"
                        style={{
                          width: `${(womenW / Math.max(totalW, 0.0001)) * 100}%`,
                          backgroundColor: c.solid,
                        }}
                      >
                        {inside && (
                          <span aria-hidden className="max-sm:hidden">
                            {pctTxt} mujeres
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <span
                    aria-hidden
                    className="absolute top-1/2 ml-2 -translate-y-1/2 text-xs leading-tight font-semibold whitespace-nowrap text-foreground tabular-nums"
                    style={{ left: `${totalW}%` }}
                  >
                    {nf.format(m.total)} total
                    {inside ? (
                      <span className="block font-normal text-muted-foreground sm:hidden">
                        {pctTxt} mujeres
                      </span>
                    ) : (
                      <span className="block font-normal text-muted-foreground">
                        {pctTxt
                          ? `${pctTxt} mujeres`
                          : "Mujeres por recolectar"}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className={`mt-1 ${grid}`}>
        <span className="max-sm:hidden" />
        <div className={plot}>
          <AxisTicks ticks={ticks} max={max} />
        </div>
      </div>
      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="h-3 w-5 rounded-sm"
            style={{
              backgroundColor: totalTone(RESULT_COLORS.conectados.base),
            }}
          />{" "}
          Total de jóvenes
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="h-3 w-5 rounded-sm"
            style={{ backgroundColor: RESULT_COLORS.conectados.solid }}
          />{" "}
          Mujeres
        </span>
      </p>
    </div>
  );
}
