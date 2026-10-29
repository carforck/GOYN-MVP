import { MapIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { EcosystemMap, type MapOrg, type MapRelation } from "@/components/ecosystem/ecosystem-map";
import { FilterBar } from "@/components/ecosystem/filter-panel";
import { buttonVariants } from "@/components/ui/button";
import { shortTerritory } from "@/lib/catalogs";
import { getViewer } from "@/lib/auth";
import { listIndicatorReports, listOrganizations, listRelations } from "@/lib/data";
import { filtersToQuery, microEcosystem } from "@/lib/filters";
import { computeMapStats } from "@/lib/map-stats";
import type { EcosystemFilters } from "@/lib/types";
import { cn } from "@/lib/utils";

// Mapa del ecosistema embebido en el inicio (ajuste 03). Reutiliza el mismo componente y los
// mismos datos que /mapa; los filtros viajan en la URL del inicio y se conservan al abrir el mapa completo.
export async function HomeMap({ filters }: { filters: EcosystemFilters }) {
  const [all, filtered, relations, reports, viewer] = await Promise.all([listOrganizations(), listOrganizations(filters), listRelations(), listIndicatorReports(), getViewer()]);
  const orgs = microEcosystem(filtered, relations, filters.org);
  const chosen = new Set(filters.org ?? []);

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
      selected: chosen.has(o.slug),
    }));

  const coords = new Map(points.map((p) => [p.slug, [p.lng, p.lat] as [number, number]]));
  const arcs: MapRelation[] = relations
    .filter((r) => coords.has(r.source_slug) && coords.has(r.target_slug))
    .map((r) => ({ type: r.relation_type_code, from: coords.get(r.source_slug)!, to: coords.get(r.target_slug)! }));

  const stats = computeMapStats(orgs, reports);
  const orgOptions = all.map((o) => ({ slug: o.slug, name: o.name }));

  return (
    <div className="space-y-4">
      <Suspense>
        <FilterBar view="mapa" total={all.length} shown={orgs.length} orgOptions={orgOptions} filterButton="mobile" />
      </Suspense>
      <Suspense fallback={<HomeMapSkeleton />}>
        <EcosystemMap orgs={points} relations={arcs} stats={stats} orgOptions={orgOptions} isAuthenticated={viewer.role !== "visitante"} guideAutoStart={false} className="h-[420px] md:h-[560px]" />
      </Suspense>
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-xs text-muted-foreground">Las ubicaciones aproximadas se muestran en el centro de su zona. Mapa: © OpenStreetMap, OpenFreeMap.</p>
        <Link href={`/mapa${filtersToQuery(filters)}`} className={cn(buttonVariants(), "h-11 shrink-0 rounded-full bg-goyn-violeta px-5 font-bold text-white hover:bg-goyn-violeta/90")}>
          <MapIcon aria-hidden /> Ver el mapa completo
        </Link>
      </div>
    </div>
  );
}

export function HomeMapSkeleton() {
  return <div aria-hidden className="h-[420px] animate-pulse rounded-3xl bg-goyn-lila/40 md:h-[560px]" />;
}
