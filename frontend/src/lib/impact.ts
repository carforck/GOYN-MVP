import { catalogs, label, shortTerritory } from "@/lib/catalogs";
import type { IndicatorReport } from "@/lib/types";

// Agregación del tablero de impacto. Regla ADR 007: se suman reportes APROBADOS; el resultado se
// rotula "suma de reportes validados", no "personas únicas", mientras no exista método aprobado.

// Año de un reporte (ajustes 26/28, 2026-10-29): ya no se reporta por trimestre; cada reporte se
// consolida en el año de la FECHA DE INICIO de su programa. Sin programa (o sin fecha) se usa el
// año del periodo reportado ("2025" o "2025-T1" → "2025").
export function reportYear(programStartDate: string | null | undefined, periodLabel: string) {
  return /^\d{4}/.test(programStartDate ?? "") ? programStartDate!.slice(0, 4) : periodLabel.slice(0, 4);
}

export type ImpactFilters = { periodo?: string; area?: string; territorio?: string; tipo?: string };

type Totals = { conectados: number; fortalecidos: number; transformados: number };
const empty = (): Totals => ({ conectados: 0, fortalecidos: 0, transformados: 0 });

export function filterReports(reports: IndicatorReport[], f: ImpactFilters) {
  return reports.filter(
    (r) =>
      (!f.periodo || r.year === f.periodo) &&
      (!f.area || r.primary_area_code === f.area) &&
      (!f.territorio || r.territory_codes.includes(f.territorio)) &&
      (!f.tipo || r.org_type_code === f.tipo),
  );
}

export function totals(reports: IndicatorReport[]) {
  const t = empty();
  for (const r of reports) t[r.indicator_code] += r.value;
  const women = reports.reduce((n, r) => n + (r.indicator_code === "conectados" ? r.value_women ?? 0 : 0), 0);
  return { ...t, mujeresConectadas: women, organizaciones: new Set(reports.map((r) => r.organization_id)).size };
}

// Consolidado por año (año de inicio del programa). Reemplaza la antigua serie por trimestre.
export function byYear(reports: IndicatorReport[]) {
  const map = new Map<string, Totals>();
  for (const r of reports) {
    const row = map.get(r.year) ?? empty();
    row[r.indicator_code] += r.value;
    map.set(r.year, row);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([period, t]) => ({ period, ...t }));
}

export function byArea(reports: IndicatorReport[]) {
  return catalogs.impactAreas
    .map((a) => {
      const t = empty();
      for (const r of reports) if (r.primary_area_code === a.code) t[r.indicator_code] += r.value;
      return { name: label("impactAreas", a.code), ...t };
    })
    .filter((x) => x.conectados > 0)
    .sort((a, b) => b.conectados - a.conectados);
}

export function byTerritory(reports: IndicatorReport[]) {
  return catalogs.territories
    .map((terr) => {
      const t = empty();
      for (const r of reports) if (r.territory_codes.includes(terr.code)) t[r.indicator_code] += r.value;
      return { name: shortTerritory(terr.code), ...t };
    })
    .filter((x) => x.conectados > 0)
    .sort((a, b) => b.conectados - a.conectados);
}

export function periodsAvailable(reports: IndicatorReport[]) {
  return [...new Set(reports.map((r) => r.year))].sort();
}
