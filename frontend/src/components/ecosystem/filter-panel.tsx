"use client";

import { ChevronDownIcon, ListIcon, MapIcon, SearchIcon, SlidersHorizontalIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { catalogs } from "@/lib/catalogs";
import { SORTS, countActive, filtersToQuery, parseFilters, type FilterKey } from "@/lib/filters";
import type { CatalogItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const groups: { key: FilterKey; title: string; options: CatalogItem[] }[] = [
  { key: "tipo", title: "Tipo de organización", options: catalogs.orgTypes },
  { key: "rol", title: "Rol en el ecosistema", options: catalogs.roles },
  { key: "area", title: "Área de impacto", options: catalogs.impactAreas },
  { key: "poblacion", title: "Población objetivo", options: catalogs.populations },
  { key: "territorio", title: "Territorio", options: catalogs.territories },
  { key: "linea", title: "Línea de trabajo", options: catalogs.workLines },
];

function useFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const filters = parseFilters(Object.fromEntries(params.entries()));

  const apply = (next: typeof filters) =>
    startTransition(() => router.replace(`${pathname}${filtersToQuery(next)}`, { scroll: false }));

  const toggle = (key: FilterKey, code: string) => {
    const current = filters[key] ?? [];
    const values = current.includes(code) ? current.filter((c) => c !== code) : [...current, code];
    apply({ ...filters, [key]: values.length ? values : undefined });
  };

  return { filters, apply, toggle, pending, query: filtersToQuery(filters) };
}

// Cada categoría es desplegable (<details>): se ve de un vistazo todo lo que se puede filtrar.
// Las que tienen filtros activos arrancan abiertas.
export function FilterGroups({ compact = false }: { compact?: boolean }) {
  const { filters, toggle } = useFilters();
  return (
    <div className="divide-y">
      {groups.map((group) => {
        const selected = filters[group.key]?.length ?? 0;
        return (
          <details key={group.key} open={selected > 0 || undefined} className="group py-3 first:pt-0">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg py-1 font-heading text-sm font-bold text-goyn-violeta focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
              <span>
                {group.title}
                {selected > 0 && <span className="ml-2 rounded-full bg-goyn-violeta px-2 py-0.5 text-[11px] text-white">{selected}</span>}
              </span>
              <ChevronDownIcon className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {group.options.map((option) => {
                const active = filters[group.key]?.includes(option.code) ?? false;
                return (
                  <button
                    key={option.code}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggle(group.key, option.code)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-left text-xs font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                      active ? "border-goyn-violeta bg-goyn-violeta text-white" : "bg-card text-foreground hover:border-goyn-violeta/50",
                      compact && "py-1",
                    )}
                  >
                    {option.label.replace(/^(BAQ|AMB) – /, "")}
                  </button>
                );
              })}
            </div>
          </details>
        );
      })}
    </div>
  );
}

// Encabezado del panel de filtros con "Limpiar filtros" al lado (junto a lo que limpia).
export function FilterHeader({ compact = false }: { compact?: boolean }) {
  const { filters, apply } = useFilters();
  const active = countActive(filters) - (filters.q ? 1 : 0);
  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      {compact ? <span className="text-xs text-muted-foreground">Elige una o varias opciones</span> : <h2 className="font-heading text-base font-bold text-foreground">Filtros</h2>}
      {active > 0 && (
        <Button variant="ghost" size="sm" className="h-8 rounded-full px-2.5 text-goyn-violeta" onClick={() => apply(filters.q ? { q: filters.q } : {})}>
          <XIcon aria-hidden /> Limpiar ({active})
        </Button>
      )}
    </div>
  );
}

// filterButton: "auto" = solo cuando no hay panel lateral (xl); "mobile" = solo en celular (en /mapa
// los filtros viven en el panel del mapa).
export function FilterBar({ view, total, shown, filterButton = "auto" }: { view: "mapa" | "lista"; total: number; shown: number; filterButton?: "auto" | "mobile" }) {
  const { filters, apply, pending, query } = useFilters();
  const [q, setQ] = useState(filters.q ?? "");
  const active = countActive(filters);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <form
          role="search"
          className="relative min-w-0 flex-1 basis-64"
          onSubmit={(e) => {
            e.preventDefault();
            apply({ ...filters, q: q.trim() || undefined });
          }}
        >
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar organización o tema…"
            aria-label="Buscar organización"
            className="h-11 rounded-full bg-card pr-10 pl-10"
          />
          {filters.q && (
            <button
              type="button"
              aria-label="Borrar búsqueda"
              onClick={() => { setQ(""); apply({ ...filters, q: undefined }); }}
              className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <XIcon className="size-4" aria-hidden />
            </button>
          )}
        </form>

        <Sheet>
          <SheetTrigger render={<Button variant="outline" className={cn("h-11 rounded-full px-4 font-semibold", filterButton === "auto" ? "xl:hidden" : "md:hidden")} />}>
            <SlidersHorizontalIcon aria-hidden /> Filtros
            {active > 0 && <span className="grid size-5 place-items-center rounded-full bg-goyn-violeta text-[11px] text-white">{active}</span>}
          </SheetTrigger>
          <SheetContent side="left" className="w-[90vw] max-w-md overflow-y-auto p-5">
            <SheetTitle className="sr-only">Filtrar el ecosistema</SheetTitle>
            <FilterHeader />
            <FilterGroups compact />
          </SheetContent>
        </Sheet>

        <div className="inline-flex rounded-full border bg-card p-1" role="group" aria-label="Cambiar vista">
          <Link
            href={`/mapa${query}`}
            aria-current={view === "mapa" ? "page" : undefined}
            className={cn("inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold", view === "mapa" ? "bg-goyn-navy text-white" : "text-foreground")}
          >
            <MapIcon className="size-4" aria-hidden /> Vista mapa
          </Link>
          <Link
            href={`/actores${query}`}
            aria-current={view === "lista" ? "page" : undefined}
            className={cn("inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold", view === "lista" ? "bg-goyn-navy text-white" : "text-foreground")}
          >
            <ListIcon className="size-4" aria-hidden /> Vista lista
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm" aria-live="polite">
        <span className={cn("font-semibold text-foreground", pending && "opacity-50")}>
          {shown} de {total} organizaciones
        </span>
        {view === "lista" && (
          <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            Ordenar por
            <select
              value={filters.orden ?? "nombre"}
              onChange={(e) => apply({ ...filters, orden: e.target.value as typeof filters.orden })}
              className="h-9 rounded-full border border-input bg-card px-3 text-sm font-semibold text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
        )}
      </div>
    </div>
  );
}

// Panel lateral fijo para pantallas grandes.
export function FilterSidebar() {
  return (
    <aside className="hidden xl:block" aria-label="Filtros">
      <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border bg-card p-5">
        <FilterHeader />
        <FilterGroups />
      </div>
    </aside>
  );
}
