import type { IndicatorReport, PublicOrganization } from "@/lib/types";

// Cifras del mapa calculadas UNA sola vez sobre las organizaciones visibles con los filtros, para
// que panel, burbujas y puntos concuerden:
//   · sede      = organizaciones con sede en la localidad (son los puntos que se ven en el mapa)
//   · presencia = organizaciones que declaran trabajar allí (aunque su sede esté en otra parte)
//   · jóvenes   = reportes validados de esas organizaciones en programas que se ejecutan allí
export type Youth = { conectados: number; fortalecidos: number; transformados: number };
export type TerritoryStat = Youth & { sede: number; presencia: number };
export type MapStats = { total: Youth & { orgs: number }; byTerritory: Record<string, TerritoryStat> };

export function computeMapStats(orgs: PublicOrganization[], reports: IndicatorReport[]): MapStats {
  const visible = new Set(orgs.map((o) => o.slug));
  const mine = reports.filter((r) => visible.has(r.organization_slug));
  const byTerritory: Record<string, TerritoryStat> = {};
  const at = (code: string) => (byTerritory[code] ??= { sede: 0, presencia: 0, conectados: 0, fortalecidos: 0, transformados: 0 });
  for (const o of orgs) {
    if (o.location_territory_code) at(o.location_territory_code).sede += 1;
    for (const t of o.territory_codes) at(t).presencia += 1;
  }
  const total: MapStats["total"] = { orgs: orgs.length, conectados: 0, fortalecidos: 0, transformados: 0 };
  for (const r of mine) {
    total[r.indicator_code] += r.value;
    for (const t of r.territory_codes) at(t)[r.indicator_code] += r.value;
  }
  return { total, byTerritory };
}
