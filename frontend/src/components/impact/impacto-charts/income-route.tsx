import { formatPct, niceAxis } from "@/lib/impact-metrics";
import {
  AxisTicks,
  GridLines,
  nf,
  PendingTag,
  RESULT_COLORS,
  type ResultKey,
} from "./shared";

// Pin 7: ruta conectados → fortalecidos → transformados en Generación de ingresos, con el
// porcentaje que avanza entre pasos. El desglose empleo / emprendimiento aún no se reporta.
// El valor y el "· x%" van justo al final de cada barra (margen derecho reservado en el trazado).
export function IncomeRoute({
  steps,
}: {
  steps: { key: ResultKey; label: string; value: number }[];
}) {
  const { max, ticks } = niceAxis(Math.max(...steps.map((s) => s.value), 0));
  // En móvil el rótulo va encima de la barra para dejarle todo el ancho.
  const grid = "grid gap-1 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-3";
  const plot = "min-w-0 pr-24 sm:pr-28";
  return (
    <div>
      <ol className="space-y-4">
        {steps.map((s, i) => {
          const prev = i ? steps[i - 1].value : 0;
          const adv = i && prev ? formatPct(s.value / prev) : null;
          const w = (s.value / max) * 100;
          return (
            <li key={s.key} className={`${grid} items-center`}>
              <span className="text-sm font-semibold text-foreground">
                {s.label}
              </span>
              <div className={plot}>
                <div className="relative h-8">
                  <GridLines ticks={ticks} max={max} />
                  <div
                    role="img"
                    aria-label={`${s.label}: ${nf.format(s.value)} jóvenes${adv ? `, ${adv} del paso anterior` : ""}`}
                    className="absolute inset-y-0 left-0 rounded-r-md"
                    style={{
                      width: `${w}%`,
                      backgroundColor: RESULT_COLORS[s.key].base,
                    }}
                  />
                  <span
                    aria-hidden
                    className="absolute top-1/2 ml-2 -translate-y-1/2 text-xs font-semibold whitespace-nowrap text-foreground tabular-nums"
                    style={{ left: `${w}%` }}
                  >
                    {nf.format(s.value)}
                    {adv && (
                      <span className="text-muted-foreground"> · {adv}</span>
                    )}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className={`mt-1 ${grid}`}>
        <span className="max-sm:hidden" />
        <div className={plot}>
          <AxisTicks ticks={ticks} max={max} />
        </div>
      </div>
      <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        Desglose de transformados en empleo y emprendimiento: <PendingTag />
      </p>
    </div>
  );
}
