import type { Metadata } from "next";
import { Suspense } from "react";
import { FilterBar, FilterSidebar } from "@/components/ecosystem/filter-panel";
import { OrgCard } from "@/components/ecosystem/org-card";
import { listOrganizations } from "@/lib/data";
import { parseFilters } from "@/lib/filters";

export const metadata: Metadata = { title: "Directorio de actores" };

export default async function ActoresPage(props: PageProps<"/actores">) {
  const filters = parseFilters(await props.searchParams);
  const [all, orgs] = await Promise.all([listOrganizations(), listOrganizations(filters)]);

  return (
    <div className="goyn-container py-6 sm:py-8">
      <div className="mb-5 space-y-2">
        <span className="goyn-eyebrow">Quiero conectar</span>
        <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">Directorio de actores</h1>
        <p className="max-w-2xl text-muted-foreground">
          Organizaciones del Colaborativo con perfil validado por el equipo GOYN. Filtra por tipo, rol, área de impacto, población y territorio.
        </p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <Suspense>
          <FilterSidebar />
        </Suspense>
        <div className="min-w-0 space-y-5">
          <Suspense>
            <FilterBar view="lista" total={all.length} shown={orgs.length} />
          </Suspense>
          {orgs.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {orgs.map((org) => (
                <li key={org.id} className="flex">
                  <OrgCard org={org} />
                </li>
              ))}
            </ul>
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
