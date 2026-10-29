import type { IndicatorReport, PublicProgram } from "@/lib/types";

// Métricas del dashboard "Resultados con jóvenes" (/impacto, ajuste 21: sección Impacto de la
// propuesta de datos GOYN 2026-10-16/21). La unidad es el PROYECTO (programa): cada uno suma sus
// reportes validados por indicador. Reglas de la propuesta:
// - Un proyecto entra en una zona o población si la marcó entre sus opciones.
// - El área que filtra y agrupa es el área PRINCIPAL del proyecto.
// - "Transformados" solo se pregunta en proyectos de Generación de ingresos (área `ingresos`).
// - Mujeres: solo se reporta el porcentaje de mujeres; no se nombra al resto como hombres.
// Se suman reportes (ADR 007), no personas únicas.

export const INCOME_AREA = "ingresos";
export const COVERAGE_ZONE = "cobertura_general";

// Orden de las áreas en filtros y mapa de calor, como en la propuesta (Generación de ingresos primero).
export const AREA_ORDER = [
  "ingresos",
  "educacion",
  "orientacion",
  "participacion",
  "entornos",
  "inclusion_digital",
  "bienestar",
];
export const byAreaOrder = (a: { code: string }, b: { code: string }) => {
  const rank = (c: string) =>
    AREA_ORDER.includes(c) ? AREA_ORDER.indexOf(c) : AREA_ORDER.length;
  return rank(a.code) - rank(b.code);
};

export type ImpactDashboardFilters = {
  zona?: string;
  area?: string;
  poblacion?: string;
  periodo?: string;
};

// Suma de un indicador con la parte de mujeres. `womenBase` es la parte del total que trae el dato
// de mujeres: el porcentaje se calcula solo sobre ella para no subestimarlo.
export type Measure = {
  total: number;
  women: number;
  womenBase: number;
  reports: number;
};

export type ProjectRow = {
  id: string;
  name: string;
  org: string;
  area: string;
  zones: string[];
  populations: string[];
  conectados: Measure;
  fortalecidos: Measure;
  transformados: Measure;
};

const emptyMeasure = (): Measure => ({
  total: 0,
  women: 0,
  womenBase: 0,
  reports: 0,
});

function add(m: Measure, r: IndicatorReport) {
  m.total += r.value;
  m.reports += 1;
  if (r.value_women != null) {
    m.women += r.value_women;
    m.womenBase += r.value;
  }
}

// Une programas públicos con sus reportes (filtrados por año si se indicó; el año es el de inicio
// del programa, ajustes 26/28). Los reportes sin
// programa público asociado no entran: la propuesta mide por proyecto.
export function buildProjectRows(
  programs: PublicProgram[],
  reports: IndicatorReport[],
  periodo?: string,
): ProjectRow[] {
  const rows = new Map<string, ProjectRow>(
    programs.map((p) => [
      p.id,
      {
        id: p.id,
        name: p.name,
        org: p.organization_name,
        area: p.primary_area_code,
        zones: p.territory_codes,
        populations: p.population_codes,
        conectados: emptyMeasure(),
        fortalecidos: emptyMeasure(),
        transformados: emptyMeasure(),
      },
    ]),
  );
  for (const r of reports) {
    if (!r.program_id || (periodo && r.year !== periodo)) continue;
    const row = rows.get(r.program_id);
    if (row) add(row[r.indicator_code], r);
  }
  return [...rows.values()];
}

export function filterProjects(rows: ProjectRow[], f: ImpactDashboardFilters) {
  return rows.filter(
    (p) =>
      (!f.zona || p.zones.includes(f.zona)) &&
      (!f.area || p.area === f.area) &&
      (!f.poblacion || p.populations.includes(f.poblacion)),
  );
}

export function sumMeasure(
  rows: ProjectRow[],
  key: "conectados" | "fortalecidos" | "transformados",
): Measure {
  const m = emptyMeasure();
  for (const p of rows) {
    m.total += p[key].total;
    m.women += p[key].women;
    m.womenBase += p[key].womenBase;
    m.reports += p[key].reports;
  }
  return m;
}

// Porcentaje de mujeres o null si ningún reporte trae el dato.
export const womenShare = (m: Measure) =>
  m.womenBase > 0 ? m.women / m.womenBase : null;

const pctFmt = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
export const formatPct = (ratio: number) => `${pctFmt.format(ratio * 100)}%`;
export const formatDecimal = (n: number) => pctFmt.format(n);

// Máximo "redondo" para ejes (1, 2, 2,5 o 5 × 10^n) y sus marcas.
export function niceAxis(max: number, ticks = 5) {
  if (max <= 0) return { max: 1, ticks: [0, 1] };
  const raw = max / ticks;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step =
    [1, 2, 2.5, 5, 10].map((s) => s * pow).find((s) => s >= raw) ?? 10 * pow;
  const top = Math.ceil(max / step) * step;
  const out: number[] = [];
  for (let v = 0; v <= top + 1e-9; v += step) out.push(Math.round(v));
  return { max: top, ticks: out };
}

// Desglose de transformados en empleo / emprendimiento. El reporte actual no lo trae: se lee de
// campos opcionales `value_empleo` / `value_emprendimiento` del reporte de transformados cuando la
// capa de datos los entregue. Cada parte es null mientras ningún reporte de los proyectos traiga el
// dato; la vista oculta tarjetas y división de la barra mientras sea null y las muestra solas
// cuando exista.
type TransformedSplitReport = IndicatorReport & {
  value_empleo?: number | null;
  value_emprendimiento?: number | null;
};
export type TransformedSplit = {
  empleo: number | null;
  emprendimiento: number | null;
};

export function transformedSplit(
  reports: IndicatorReport[],
  projectIds: Set<string>,
  periodo?: string,
): TransformedSplit {
  const out: TransformedSplit = { empleo: null, emprendimiento: null };
  for (const r of reports as TransformedSplitReport[]) {
    if (
      r.indicator_code !== "transformados" ||
      !r.program_id ||
      !projectIds.has(r.program_id) ||
      (periodo && r.year !== periodo)
    )
      continue;
    if (r.value_empleo != null) out.empleo = (out.empleo ?? 0) + r.value_empleo;
    if (r.value_emprendimiento != null)
      out.emprendimiento = (out.emprendimiento ?? 0) + r.value_emprendimiento;
  }
  return out;
}

export function periodsOf(reports: IndicatorReport[]) {
  return [...new Set(reports.map((r) => r.year))].sort();
}
