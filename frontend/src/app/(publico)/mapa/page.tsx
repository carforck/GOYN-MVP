import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EcosystemMap, type MapOrg, type MapRelation } from "@/components/ecosystem/ecosystem-map";
import { FilterBar } from "@/components/ecosystem/filter-panel";
import { EcosystemInsights } from "@/components/ecosystem/ecosystem-insights";
import { shortTerritory } from "@/lib/catalogs";
import { listIndicatorReports, listOrganizations, listRelations } from "@/lib/data";
import { computeEcosystemMetrics } from "@/lib/ecosystem-metrics";
import { computeMapStats } from "@/lib/map-stats";
import { parseFilters } from "@/lib/filters";

export const metadata: Metadata = { title: "Mapa del ecosistema en vivo" };

export default async function MapaPage(props: PageProps<"/mapa">) {
  const filters = parseFilters(await props.searchParams);
  const [all, orgs, relations, reports] = await Promise.all([listOrganizations(), listOrganizations(filters), listRelations(), listIndicatorReports()]);

  const points: MapOrg[] = orgs
    .filter((o) => o.lat != null && o.lng != null)
    .map((o) => ({
      slug: o.slug,
      name: o.name,
      org_type_label: o.org_type_label,
      primary_role_code: o.primary_role_code,
      primary_role_label: o.primary_role_label,
      area_code: o.area_codes[0] ?? "",
      territory_code: o.location_territory_code ?? "",
      territory: o.location_territory_code ? shortTerritory(o.location_territory_code) : "",
      lat: o.lat!,
      lng: o.lng!,
      precision: o.location_precision,
    }));

  // Solo se dibujan conexiones entre organizaciones visibles con los filtros actuales.
  const coords = new Map(points.map((p) => [p.slug, [p.lng, p.lat] as [number, number]]));
  const arcs: MapRelation[] = relations
    .filter((r) => coords.has(r.source_slug) && coords.has(r.target_slug))
    .map((r) => ({ type: r.relation_type_code, from: coords.get(r.source_slug)!, to: coords.get(r.target_slug)! }));

  const metrics = computeEcosystemMetrics(orgs, relations);
  const stats = computeMapStats(orgs, reports);

  return (
    <div className="goyn-container space-y-5 py-6 sm:py-8">
      <div className="space-y-2">
        <span className="goyn-eyebrow">
          <span className="goyn-live-dot bg-white" aria-hidden /> Quiero ver el ecosistema
        </span>
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Mapa del ecosistema en vivo</h1>
        <p className="max-w-3xl text-muted-foreground">
          Cada punto es una organización del Colaborativo, ubicada en su localidad. Filtra desde el panel del mapa y suma capas, como las conexiones entre organizaciones.
        </p>
      </div>

      {/* Controles del mapa justo encima de él: búsqueda, vista y resultado. */}
      <Suspense>
        <FilterBar view="mapa" total={all.length} shown={orgs.length} filterButton="mobile" />
      </Suspense>

      <EcosystemMap orgs={points} relations={arcs} stats={stats} className="h-[78vh] min-h-[520px]" />

      <p className="text-xs text-muted-foreground">
        Las ubicaciones aproximadas se muestran en el centro de su zona. ¿Prefieres leer las organizaciones una por una? Usa la <Link href="/actores" className="font-semibold text-goyn-violeta underline-offset-2 hover:underline">vista lista</Link>. Mapa: © OpenStreetMap, OpenFreeMap. Globo: NASA Blue Marble.
      </p>

      <EcosystemInsights metrics={metrics} shown={orgs.length} />
    </div>
  );
}
