import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EcosystemMap, type MapOrg } from "@/components/ecosystem/ecosystem-map";
import { FilterBar, FilterSidebar } from "@/components/ecosystem/filter-panel";
import { RoleIcon } from "@/components/ecosystem/role-badge";
import { shortTerritory } from "@/lib/catalogs";
import { listOrganizations } from "@/lib/data";
import { parseFilters } from "@/lib/filters";

export const metadata: Metadata = { title: "Mapa del ecosistema" };

export default async function MapaPage(props: PageProps<"/mapa">) {
  const filters = parseFilters(await props.searchParams);
  const [all, orgs] = await Promise.all([listOrganizations(), listOrganizations(filters)]);
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

  return (
    <div className="goyn-container py-6 sm:py-8">
      <div className="mb-5 space-y-2">
        <span className="goyn-eyebrow">Quiero ver el ecosistema</span>
        <h1 className="text-3xl font-extrabold text-goyn-navy sm:text-4xl">Mapa del ecosistema</h1>
      </div>
      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <Suspense>
          <FilterSidebar />
        </Suspense>
        <div className="min-w-0 space-y-4">
          <Suspense>
            <FilterBar view="mapa" total={all.length} shown={orgs.length} />
          </Suspense>
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <EcosystemMap orgs={points} className="h-[62vh] min-h-[420px]" />
            {/* Alternativa accesible al mapa: la misma selección en lista (arquitectura §1). */}
            <section aria-label="Organizaciones visibles en el mapa" className="max-h-[62vh] min-h-[200px] overflow-y-auto rounded-2xl border bg-white">
              <ul className="divide-y">
                {orgs.map((o) => (
                  <li key={o.id}>
                    <Link href={`/actores/${o.slug}`} className="flex items-center gap-3 p-3.5 transition-colors hover:bg-muted">
                      <RoleIcon code={o.primary_role_code} size={30} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-goyn-navy">{o.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {o.org_type_label} · {o.location_territory_code ? shortTerritory(o.location_territory_code) : "Cobertura general"}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
                {orgs.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">Ninguna organización coincide con los filtros.</li>}
              </ul>
            </section>
          </div>
          <p className="text-xs text-muted-foreground">
            Las ubicaciones marcadas como aproximadas se muestran en el centro de su zona. Mapa: © OpenStreetMap, OpenFreeMap.
          </p>
        </div>
      </div>
    </div>
  );
}
