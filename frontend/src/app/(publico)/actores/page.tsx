import type { Metadata } from "next";
import { Suspense } from "react";
import { FilterBar, FilterSidebar } from "@/components/ecosystem/filter-panel";
import { OrgCard } from "@/components/ecosystem/org-card";
import { Pagination, paginate } from "@/components/ui/pagination";
import { listMapPrograms, listOrganizations, listRelations } from "@/lib/data";
import { countProgramFilters, filterByPrograms, microEcosystem, parseFilters, sortOrganizations } from "@/lib/filters";

export const metadata: Metadata = { title: "Directorio de actores" };

const PAGE_SIZE = 18;

export default async function ActoresPage(props: PageProps<"/actores">) {
  const sp = await props.searchParams;
  const filters = parseFilters(sp);
  const [all, found, relations] = await Promise.all([listOrganizations(), listOrganizations(filters), filters.org?.length ? listRelations() : Promise.resolve([])]);
  // Filtro de proyectos (ajuste 14): solo organizaciones con algún programa publicado que cumpla.
  const programs = countProgramFilters(filters) ? await listMapPrograms(false) : [];
  const orgs = sortOrganizations(microEcosystem(filterByPrograms(found, programs, filters), relations, filters.org), filters.orden);
  // 18 por página (múltiplo de 2 y 3 columnas). Al cambiar un filtro, filtersToQuery() descarta
  // ?pagina, así que siempre se vuelve a la página 1.
  const page = paginate(orgs, sp, PAGE_SIZE);

  return (
    <div className="goyn-container py-6 sm:py-8">
      <div className="mb-5 space-y-2">
        <span className="goyn-eyebrow">Quiero conectar</span>
        <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">Directorio de actores</h1>
        <p className="max-w-2xl text-muted-foreground">
          Organizaciones del ecosistema de oportunidades para los jóvenes con un perfil validado por el equipo GOYN Barranquilla. Filtra por tipo, rol, área de impacto, población y territorio, y ordena como prefieras.
        </p>
      </div>
      {/* Panel lateral sticky: nunca más alto que la ventana visible menos el header (top-24) y con scroll interno. */}
      <div className="grid gap-6 xl:grid-cols-[300px_1fr] xl:[&>aside>div]:max-h-[calc(100dvh-7rem)] xl:[&>aside>div]:overflow-y-auto xl:[&>aside>div]:overscroll-contain">
        <Suspense>
          <FilterSidebar />
        </Suspense>
        <div className="min-w-0 space-y-5">
          <Suspense>
            <FilterBar view="lista" total={all.length} shown={orgs.length} orgOptions={all.map((o) => ({ slug: o.slug, name: o.name }))} />
          </Suspense>
          {orgs.length > 0 ? (
            <>
              <ul className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                {page.items.map((org) => (
                  <li key={org.id} className="flex">
                    <OrgCard org={org} />
                  </li>
                ))}
              </ul>
              <Pagination pathname="/actores" searchParams={sp} page={page.page} pageSize={PAGE_SIZE} total={page.total} itemLabel="organizaciones" />
            </>
          ) : (
            <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
              Ninguna organización coincide con los filtros. Prueba quitando alguno.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
