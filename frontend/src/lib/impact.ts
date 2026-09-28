import { catalogs, label, shortTerritory } from "@/lib/catalogs";
import { formatPeriod } from "@/lib/format";
import type { IndicatorReport } from "@/lib/types";

// Agregación del tablero de impacto. Regla ADR 007: se suman reportes APROBADOS; el resultado se
// rotula "suma de reportes validados", no "personas únicas", mientras no exista método aprobado.

export type ImpactFilters = { periodo?: string; area?: string; territorio?: string; tipo?: string };

type Totals = { conectados: number; fortalecidos: number; transformados: number };
const empty = (): Totals => ({ conectados: 0, fortalecidos: 0, transformados: 0 });

export function filterReports(reports: IndicatorReport[], f: ImpactFilters) {
  return reports.filter(
    (r) =>
      (!f.periodo || r.period_label.startsWith(f.periodo)) &&
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

export function byPeriod(reports: IndicatorReport[]) {
  const map = new Map<string, Totals>();
  for (const r of [...reports].sort((a, b) => a.period_start.localeCompare(b.period_start))) {
    const row = map.get(r.period_label) ?? empty();
    row[r.indicator_code] += r.value;
    map.set(r.period_label, row);
  }
  return [...map.entries()].map(([period, t]) => ({ period: formatPeriod(period), ...t }));
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
  return [...new Set(reports.map((r) => r.period_label.slice(0, 4)))].sort();
}
