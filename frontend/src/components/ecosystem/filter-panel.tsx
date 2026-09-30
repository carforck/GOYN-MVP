"use client";

import { ListIcon, MapIcon, SearchIcon, SlidersHorizontalIcon, XIcon } from "lucide-react";
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

function FilterGroups({ compact = false }: { compact?: boolean }) {
  const { filters, toggle } = useFilters();
  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <fieldset key={group.key}>
          <legend className="mb-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">{group.title}</legend>
          <div className="flex flex-wrap gap-1.5">
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
        </fieldset>
      ))}
    </div>
  );
}

export function FilterBar({ view, total, shown, alwaysSheet = false }: { view: "mapa" | "lista"; total: number; shown: number; alwaysSheet?: boolean }) {
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
            className="h-11 rounded-full bg-card pl-10"
          />
        </form>

        <Sheet>
          <SheetTrigger render={<Button variant="outline" className={cn("h-11 rounded-full px-4 font-semibold", !alwaysSheet && "xl:hidden")} />}>
            <SlidersHorizontalIcon aria-hidden /> Filtros
            {active > 0 && <span className="grid size-5 place-items-center rounded-full bg-goyn-violeta text-[11px] text-white">{active}</span>}
          </SheetTrigger>
          <SheetContent side="left" className="w-[90vw] max-w-md overflow-y-auto p-5">
            <SheetTitle className="font-heading text-lg font-bold">Filtrar el ecosistema</SheetTitle>
            <FilterGroups compact />
          </SheetContent>
        </Sheet>

        <div className="inline-flex rounded-full border bg-card p-1" role="group" aria-label="Cambiar vista">
          <Link
            href={`/mapa${query}`}
            aria-current={view === "mapa" ? "page" : undefined}
            className={cn("inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold", view === "mapa" ? "bg-goyn-navy text-white" : "text-foreground")}
          >
            <MapIcon className="size-4" aria-hidden /> Mapa
          </Link>
          <Link
            href={`/actores${query}`}
            aria-current={view === "lista" ? "page" : undefined}
            className={cn("inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold", view === "lista" ? "bg-goyn-navy text-white" : "text-foreground")}
          >
            <ListIcon className="size-4" aria-hidden /> Lista
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
        {active > 0 && (
          <Button variant="ghost" size="sm" className="rounded-full text-goyn-violeta" onClick={() => { setQ(""); apply({}); }}>
            <XIcon aria-hidden /> Limpiar filtros
          </Button>
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
        <h2 className="mb-4 font-heading text-base font-bold text-foreground">Filtrar el ecosistema</h2>
        <FilterGroups />
      </div>
    </aside>
  );
}
