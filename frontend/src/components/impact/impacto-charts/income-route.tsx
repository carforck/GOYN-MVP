import {
  formatPct,
  niceAxis,
  type TransformedSplit,
} from "@/lib/impact-metrics";
import {
  AxisTicks,
  GridLines,
  nf,
  RESULT_COLORS,
  type ResultKey,
} from "./shared";
import { BRAND } from "@/lib/palette";

// Emprendimiento: amarillo de marca (mismo tono del área "Educación"/"Academia" no aplica; es un
// sub-resultado de transformados que necesita contrastar con su magenta).
const EMPRENDIMIENTO_COLOR = BRAND.amarillo;

// Pin 7: ruta conectados → fortalecidos → transformados en Generación de ingresos, con el
// porcentaje que avanza entre pasos. La barra de transformados se divide en empleo / emprendimiento
// solo cuando llegan ambos datos (`split` no nulo); mientras tanto es de un solo color.
// El valor y el "· x%" van justo al final de cada barra (margen derecho reservado en el trazado).
export function IncomeRoute({
  steps,
  split,
}: {
  steps: { key: ResultKey; label: string; value: number }[];
  split?: TransformedSplit;
}) {
  const parts =
    split && split.empleo != null && split.emprendimiento != null
      ? { empleo: split.empleo, emprendimiento: split.emprendimiento }
      : null;
  const partsTotal = parts ? parts.empleo + parts.emprendimiento : 0;
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
                    aria-label={`${s.label}: ${nf.format(s.value)} jóvenes${adv ? `, ${adv} del paso anterior` : ""}${s.key === "transformados" && parts ? ` (empleo ${nf.format(parts.empleo)}, emprendimiento ${nf.format(parts.emprendimiento)})` : ""}`}
                    className="absolute inset-y-0 left-0 flex overflow-hidden rounded-r-md"
                    style={{
                      width: `${w}%`,
                      backgroundColor: RESULT_COLORS[s.key].base,
                    }}
                  >
                    {s.key === "transformados" && parts && partsTotal > 0 && (
                      <span
                        aria-hidden
                        className="ml-auto h-full"
                        style={{
                          width: `${(parts.emprendimiento / partsTotal) * 100}%`,
                          backgroundColor: EMPRENDIMIENTO_COLOR,
                        }}
                      />
                    )}
                  </div>
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
      {parts && (
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2.5 rounded-full"
              style={{ backgroundColor: RESULT_COLORS.transformados.base }}
            />
            Empleo: {nf.format(parts.empleo)}
          </span>
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2.5 rounded-full"
              style={{ backgroundColor: EMPRENDIMIENTO_COLOR }}
            />
            Emprendimiento: {nf.format(parts.emprendimiento)}
          </span>
        </p>
      )}
    </div>
  );
}
