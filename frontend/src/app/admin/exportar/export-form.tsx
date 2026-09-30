"use client";

import { DownloadIcon, FileSpreadsheetIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { catalogs } from "@/lib/catalogs";
import { cn } from "@/lib/utils";

const selectClass = "h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground";

const filterDefs = [
  { key: "tipo", label: "Tipo de organización", options: catalogs.orgTypes },
  { key: "rol", label: "Rol", options: catalogs.roles },
  { key: "area", label: "Área de impacto", options: catalogs.impactAreas },
  { key: "linea", label: "Línea de trabajo", options: catalogs.workLines },
  { key: "territorio", label: "Territorio", options: catalogs.territories },
] as const;

// Exportación con filtros (FR-012): el archivo contiene solo lo que cumple los filtros elegidos.
export function ExportForm({ datasets, periods }: { datasets: Record<string, string>; periods: string[] }) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const query = useMemo(() => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v) sp.set(k, v);
    return sp.toString();
  }, [filters]);
  const active = Object.values(filters).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-card p-5" aria-labelledby="filtros-exportacion">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="filtros-exportacion" className="font-heading text-lg font-bold text-foreground">Filtros</h2>
          {active > 0 && (
            <button type="button" onClick={() => setFilters({})} className="text-sm font-semibold text-goyn-violeta hover:underline">
              Limpiar ({active})
            </button>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filterDefs.map((f) => (
            <label key={f.key} className="space-y-1 text-xs font-bold text-muted-foreground uppercase">
              {f.label}
              <select value={filters[f.key] ?? ""} onChange={(e) => setFilters({ ...filters, [f.key]: e.target.value })} className={selectClass}>
                <option value="">Todos</option>
                {f.options.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
              </select>
            </label>
          ))}
          <label className="space-y-1 text-xs font-bold text-muted-foreground uppercase">
            Periodo (indicadores)
            <select value={filters.periodo ?? ""} onChange={(e) => setFilters({ ...filters, periodo: e.target.value })} className={selectClass}>
              <option value="">Todos</option>
              {periods.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(datasets).map(([key, title]) => (
          <section key={key} className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
            <FileSpreadsheetIcon className="size-8 text-goyn-violeta" aria-hidden />
            <h2 className="font-heading text-lg font-bold text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground">{active ? `Con ${active} filtro${active > 1 ? "s" : ""} aplicado${active > 1 ? "s" : ""}.` : "Sin filtros: todos los registros publicados."}</p>
            <div className="mt-auto flex gap-2">
              <a href={`/admin/exportar/descargar?dataset=${key}&format=csv${query ? `&${query}` : ""}`} className={cn(buttonVariants({ variant: "outline" }), "h-10 flex-1 rounded-full")}>
                <DownloadIcon aria-hidden /> CSV
              </a>
              <a href={`/admin/exportar/descargar?dataset=${key}&format=xlsx${query ? `&${query}` : ""}`} className={cn(buttonVariants(), "h-10 flex-1 rounded-full font-bold")}>
                <DownloadIcon aria-hidden /> XLSX
              </a>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
