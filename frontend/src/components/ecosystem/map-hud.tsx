"use client";

import { ChevronDownIcon, GlobeIcon, LayersIcon, Share2Icon, SlidersHorizontalIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { ColorBy, GroupBy } from "@/components/ecosystem/ecosystem-map";
import { FilterGroups, FilterHeader } from "@/components/ecosystem/filter-panel";
import { useLive } from "@/components/live/live-provider";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { catalogs } from "@/lib/catalogs";
import { countActive, parseFilters } from "@/lib/filters";
import { cn } from "@/lib/utils";

const relationLegend = [
  { code: "socio", label: "Socios", color: "#FF01A2" },
  { code: "aliado", label: "Aliados", color: "#9B00FF" },
  { code: "colaborador", label: "Colaboradores", color: "#00A0CC" },
];

// Panel del mapa (referencia: panel por país del cybermap): contadores en vivo por territorio,
// leyenda de conexiones y controles.
function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-bold tracking-widest text-goyn-navy/60 uppercase">{label}</p>
      <div role="radiogroup" aria-label={label} className="grid grid-flow-col gap-1 rounded-xl bg-goyn-navy/5 p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn("rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors", value === o.value ? "bg-goyn-violeta text-white" : "text-goyn-navy/75 hover:bg-goyn-navy/10")}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Sección desplegable del panel (cifras, filtros, capas): se abre solo lo que se necesita.
function Section({ title, icon, badge, defaultOpen = false, children }: { title: string; icon: React.ReactNode; badge?: number; defaultOpen?: boolean; children: React.ReactNode }) {
  return (
    <details open={defaultOpen || undefined} className="group border-t border-goyn-navy/10 first:border-t-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 font-heading text-sm font-bold text-goyn-violeta [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          {icon}
          {title}
          {badge ? <span className="rounded-full bg-goyn-violeta px-2 py-0.5 text-[11px] text-white">{badge}</span> : null}
        </span>
        <ChevronDownIcon className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="space-y-4 px-4 pb-4">{children}</div>
    </details>
  );
}

export function MapHud({
  showArcs,
  onToggleArcs,
  onReplay,
  colorBy,
  onColorBy,
  groupBy,
  onGroupBy,
}: {
  showArcs: boolean;
  onToggleArcs: () => void;
  onReplay: () => void;
  colorBy: ColorBy;
  onColorBy: (v: ColorBy) => void;
  groupBy: GroupBy;
  onGroupBy: (v: GroupBy) => void;
}) {
  const live = useLive();
  const params = useSearchParams();
  const activeFilters = countActive(parseFilters(Object.fromEntries(params.entries())));
  const [territory, setTerritory] = useState<string>("todo");
  // null = automático: abierto en pantallas medianas y grandes, plegado en celular.
  const [open, setOpen] = useState<boolean | null>(null);

  const totals =
    territory === "todo"
      ? { orgs: live.stats.organizations, conectados: live.stats.conectados, fortalecidos: live.stats.fortalecidos, transformados: live.stats.transformados }
      : (live.territories[territory] ?? { orgs: 0, conectados: 0, fortalecidos: 0, transformados: 0 });

  const rows = [
    { key: "orgs", label: "Organizaciones", color: "#060A28", value: totals.orgs },
    { key: "conectados", label: "Jóvenes conectados", color: "#B44DFF", value: totals.conectados },
    { key: "fortalecidos", label: "Jóvenes fortalecidos", color: "#00A0CC", value: totals.fortalecidos },
    { key: "transformados", label: "Jóvenes transformados", color: "#DB0089", value: totals.transformados },
  ];

  return (
    <div className="absolute top-3 left-3 z-10 w-[calc(100%-4.5rem)] max-w-xs">
      <div className="overflow-hidden rounded-2xl border border-goyn-navy/10 bg-white/92 text-goyn-navy shadow-xl shadow-goyn-violeta/10 backdrop-blur-md">
        <button type="button" onClick={() => setOpen((o) => (o === null ? window.innerWidth < 768 : !o))} aria-expanded={open ?? undefined} className="flex w-full items-center justify-between gap-2 border-b border-goyn-navy/10 px-4 py-3 text-left">
          <span>
            <span className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-goyn-navy/60 uppercase">
              <span className="goyn-live-dot" aria-hidden /> {live.source === "demo" ? "En vivo · simulación" : "En vivo"}
            </span>
            <span className="mt-0.5 block font-heading text-base font-bold">
              {territory === "todo" ? "Todo el ecosistema" : catalogs.territories.find((t) => t.code === territory)?.label}
            </span>
          </span>
          <ChevronDownIcon className={cn("size-4 shrink-0 transition-transform", open === null ? "md:rotate-180" : open && "rotate-180")} aria-hidden />
        </button>

        {open !== false && (
          <div className={cn("max-h-[62vh] overflow-y-auto", open === null && "hidden md:block")}>
            <Section title="Cifras" icon={<span className="goyn-live-dot" aria-hidden />} defaultOpen>
              <label className="block">
                <span className="sr-only">Territorio</span>
                <select
                  value={territory}
                  onChange={(e) => setTerritory(e.target.value)}
                  className="h-9 w-full rounded-lg border border-goyn-navy/15 bg-white px-2.5 text-sm text-goyn-navy focus-visible:ring-2 focus-visible:ring-goyn-violeta focus-visible:outline-none"
                >
                  <option value="todo">Todo el ecosistema</option>
                  {catalogs.territories.map((t) => (
                    <option key={t.code} value={t.code}>{t.label}</option>
                  ))}
                </select>
              </label>
              <dl className="space-y-2.5">
                {rows.map((r) => (
                  <div key={r.key} className="flex items-baseline justify-between gap-3">
                    <dt className="flex items-center gap-2 text-xs font-semibold text-goyn-navy/75">
                      <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: r.color }} />
                      {r.label}
                    </dt>
                    <dd>
                      <AnimatedNumber key={`${territory}-${r.key}`} value={r.value} duration={1.1} className="font-heading text-lg font-bold" />
                    </dd>
                  </div>
                ))}
              </dl>
            </Section>

            <Section title="Filtros" icon={<SlidersHorizontalIcon className="size-4" aria-hidden />} badge={activeFilters}>
              <FilterHeader compact />
              <FilterGroups compact />
            </Section>

            <Section title="Capas" icon={<LayersIcon className="size-4" aria-hidden />} defaultOpen>
              <div className="grid grid-cols-2 gap-2">
                <Segmented label="Agrupar" value={groupBy} onChange={onGroupBy} options={[{ value: "cercania", label: "Cercanía" }, { value: "territorio", label: "Localidad" }]} />
                <Segmented label="Color" value={colorBy} onChange={onColorBy} options={[{ value: "rol", label: "Rol" }, { value: "area", label: "Área" }]} />
              </div>
              {groupBy === "cercania" && (
                <ul className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-goyn-navy/75" aria-label={colorBy === "rol" ? "Colores por rol" : "Colores por área de impacto"}>
                  {(colorBy === "rol" ? catalogs.roles : catalogs.impactAreas).map((c) => (
                    <li key={c.code} className="flex items-center gap-1.5 truncate">
                      <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ backgroundColor: c.color ?? "#9B00FF" }} />
                      <span className="truncate">{c.label}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="border-t border-goyn-navy/10 pt-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-goyn-navy/60 uppercase">
                    <Share2Icon className="size-3.5" aria-hidden /> Conexiones
                  </p>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={showArcs}
                    onClick={onToggleArcs}
                    className={cn("relative h-5 w-9 rounded-full transition-colors", showArcs ? "bg-goyn-magenta-a11y" : "bg-goyn-navy/20")}
                  >
                    <span className={cn("absolute top-0.5 size-4 rounded-full bg-white shadow transition-all", showArcs ? "left-4.5" : "left-0.5")} />
                    <span className="sr-only">Mostrar conexiones</span>
                  </button>
                </div>
                <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-goyn-navy/75">
                  {relationLegend.map((r) => (
                    <li key={r.code} className="flex items-center gap-1.5">
                      <span aria-hidden className="h-0.5 w-4 rounded-full" style={{ backgroundColor: r.color }} />
                      {r.label}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={onReplay}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-goyn-navy/15 py-2 text-sm font-semibold transition-colors hover:bg-goyn-navy/5"
              >
                <GlobeIcon className="size-4" aria-hidden /> Ver desde el mundo
              </button>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}
