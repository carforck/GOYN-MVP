import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EcosystemMap, type MapOrg, type MapRelation } from "@/components/ecosystem/ecosystem-map";
import { FilterBar } from "@/components/ecosystem/filter-panel";
import { RoleIcon } from "@/components/ecosystem/role-badge";
import { Reveal } from "@/components/motion/reveal";
import { shortTerritory } from "@/lib/catalogs";
import { listOrganizations, listRelations } from "@/lib/data";
import { parseFilters } from "@/lib/filters";

export const metadata: Metadata = { title: "Mapa del ecosistema en vivo" };

export default async function MapaPage(props: PageProps<"/mapa">) {
  const filters = parseFilters(await props.searchParams);
  const [all, orgs, relations] = await Promise.all([listOrganizations(), listOrganizations(filters), listRelations()]);

  const points: MapOrg[] = orgs
    .filter((o) => o.lat != null && o.lng != null)
    .map((o) => ({
      slug: o.slug,
      name: o.name,
      org_type_label: o.org_type_label,
      primary_role_code: o.primary_role_code,
      primary_role_label: o.primary_role_label,
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

  return (
    <div className="goyn-container space-y-5 py-6 sm:py-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <span className="goyn-eyebrow">
            <span className="goyn-live-dot bg-white" aria-hidden /> Quiero ver el ecosistema
          </span>
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Mapa del ecosistema en vivo</h1>
          <p className="max-w-2xl text-muted-foreground">
            Cada punto es una organización del Colaborativo; las líneas que fluyen son sus alianzas. Las ondas marcan la actividad que llega en tiempo real.
          </p>
        </div>
        <div className="lg:w-[560px]">
          <Suspense>
            <FilterBar view="mapa" total={all.length} shown={orgs.length} alwaysSheet />
          </Suspense>
        </div>
      </div>

      <EcosystemMap orgs={points} relations={arcs} className="h-[78vh] min-h-[520px]" />

      <p className="text-xs text-muted-foreground">
        Las ubicaciones aproximadas se muestran en el centro de su zona. Mapa: © OpenStreetMap, OpenFreeMap. Globo: NASA Blue Marble.
      </p>

      {/* Alternativa accesible al mapa: la misma selección en lista (arquitectura §1). */}
      <section aria-labelledby="lista-mapa" className="space-y-3 pt-4">
        <h2 id="lista-mapa" className="font-heading text-xl font-bold text-foreground">Organizaciones en el mapa ({orgs.length})</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {orgs.map((o, i) => (
            <Reveal as="li" key={o.id} delay={(i % 6) * 0.04}>
              <Link href={`/actores/${o.slug}`} className="flex items-center gap-3 rounded-2xl border bg-card p-3.5 transition-all hover:-translate-y-0.5 hover:border-goyn-violeta/50 hover:shadow-md">
                <RoleIcon code={o.primary_role_code} size={34} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-foreground">{o.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {o.org_type_label} · {o.location_territory_code ? shortTerritory(o.location_territory_code) : "Cobertura general"}
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
          {orgs.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">Ninguna organización coincide con los filtros.</li>}
        </ul>
      </section>
    </div>
  );
}
