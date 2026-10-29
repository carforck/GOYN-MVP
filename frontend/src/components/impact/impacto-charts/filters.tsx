"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { ImpactDashboardFilters } from "@/lib/impact-metrics";

type Option = { code: string; label: string };

const selectClass =
  "h-11 w-full min-w-0 rounded-full border border-input bg-card px-4 text-sm font-semibold text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

// Pin 1: filtros del dashboard. Se aplican al cambiar (sin recargar arriba) y van en la URL;
// sin JavaScript el botón "Aplicar" envía el formulario por GET.
export function ImpactFilters({
  values,
  zones,
  areas,
  populations,
  periods,
}: {
  values: ImpactDashboardFilters;
  zones: Option[];
  areas: Option[];
  populations: Option[];
  periods: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const active = Boolean(
    values.zona || values.area || values.poblacion || values.periodo,
  );

  const go = (form: HTMLFormElement) => {
    const qs = new URLSearchParams();
    for (const [k, v] of new FormData(form))
      if (typeof v === "string" && v) qs.set(k, v);
    const s = qs.toString();
    startTransition(() =>
      router.replace(s ? `/impacto?${s}` : "/impacto", { scroll: false }),
    );
  };

  const field = (
    name: string,
    label: string,
    all: string,
    opts: Option[],
    value?: string,
  ) => (
    <label className="min-w-0 space-y-1 text-xs font-bold text-muted-foreground uppercase">
      {label}
      <select name={name} defaultValue={value ?? ""} className={selectClass}>
        <option value="">{all}</option>
        {opts.map((o) => (
          <option key={o.code} value={o.code}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <form
      action="/impacto"
      method="get"
      aria-label="Filtrar resultados"
      aria-busy={pending}
      onChange={(e) => go(e.currentTarget)}
      onSubmit={(e) => {
        e.preventDefault();
        go(e.currentTarget);
      }}
      className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]"
    >
      {field(
        "zona",
        "Zona de incidencia",
        "Todas las zonas",
        zones,
        values.zona,
      )}
      {field(
        "area",
        "Área principal del proyecto",
        "Todas las áreas",
        areas,
        values.area,
      )}
      {field(
        "poblacion",
        "Población objetivo",
        "Todas las poblaciones",
        populations,
        values.poblacion,
      )}
      {field(
        "periodo",
        "Año de inicio del programa",
        "Todos los años",
        periods.map((p) => ({ code: p, label: p })),
        values.periodo,
      )}
      <div className="flex items-end gap-2">
        <noscript>
          <button
            type="submit"
            className="h-11 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground"
          >
            Aplicar
          </button>
        </noscript>
        <a
          href="/impacto"
          onClick={(e) => {
            e.preventDefault();
            const form = e.currentTarget.closest("form");
            form?.reset();
            form?.querySelectorAll("select").forEach((s) => (s.value = ""));
            startTransition(() =>
              router.replace("/impacto", { scroll: false }),
            );
          }}
          aria-disabled={!active}
          className="inline-flex h-11 items-center rounded-full px-3 text-sm font-bold text-goyn-violeta underline-offset-4 hover:underline aria-disabled:text-muted-foreground"
        >
          Quitar filtros
        </a>
      </div>
      <p className="sr-only" aria-live="polite">
        {pending ? "Actualizando resultados…" : ""}
      </p>
    </form>
  );
}
