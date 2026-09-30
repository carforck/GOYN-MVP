"use client";

import { ChevronDownIcon, GlobeIcon, Share2Icon } from "lucide-react";
import { useState } from "react";
import type { ColorBy, GroupBy } from "@/components/ecosystem/ecosystem-map";
import { useLive } from "@/components/live/live-provider";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { catalogs } from "@/lib/catalogs";
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
      <p className="mb-1.5 text-[11px] font-bold tracking-widest text-white/60 uppercase">{label}</p>
      <div role="radiogroup" aria-label={label} className="grid grid-flow-col gap-1 rounded-xl bg-white/5 p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn("rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors", value === o.value ? "bg-goyn-violeta text-white" : "text-white/75 hover:bg-white/10")}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
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
  const [territory, setTerritory] = useState<string>("todo");
  // null = automático: abierto en pantallas medianas y grandes, plegado en celular.
  const [open, setOpen] = useState<boolean | null>(null);

  const totals =
    territory === "todo"
      ? { orgs: live.stats.organizations, conectados: live.stats.conectados, fortalecidos: live.stats.fortalecidos, transformados: live.stats.transformados }
      : (live.territories[territory] ?? { orgs: 0, conectados: 0, fortalecidos: 0, transformados: 0 });

  const rows = [
    { key: "orgs", label: "Organizaciones", color: "#FFFFFF", value: totals.orgs },
    { key: "conectados", label: "Jóvenes conectados", color: "#B44DFF", value: totals.conectados },
    { key: "fortalecidos", label: "Jóvenes fortalecidos", color: "#22C3F0", value: totals.fortalecidos },
    { key: "transformados", label: "Jóvenes transformados", color: "#FF3DB5", value: totals.transformados },
  ];

  return (
    <div className="absolute top-3 left-3 z-10 w-[calc(100%-4.5rem)] max-w-xs">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#060a28]/85 shadow-2xl backdrop-blur-md">
        <button type="button" onClick={() => setOpen((o) => (o === null ? window.innerWidth < 768 : !o))} aria-expanded={open ?? undefined} className="flex w-full items-center justify-between gap-2 border-b border-white/10 px-4 py-3 text-left">
          <span>
            <span className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-white/60 uppercase">
              <span className="goyn-live-dot" aria-hidden /> {live.source === "demo" ? "En vivo · simulación" : "En vivo"}
            </span>
            <span className="mt-0.5 block font-heading text-base font-bold">
              {territory === "todo" ? "Todo el ecosistema" : catalogs.territories.find((t) => t.code === territory)?.label}
            </span>
          </span>
          <ChevronDownIcon className={cn("size-4 shrink-0 transition-transform", open === null ? "md:rotate-180" : open && "rotate-180")} aria-hidden />
        </button>

        {open !== false && (
          <div className={cn("max-h-[60vh] space-y-4 overflow-y-auto p-4", open === null && "hidden md:block")}>
            <label className="block">
              <span className="sr-only">Territorio</span>
              <select
                value={territory}
                onChange={(e) => setTerritory(e.target.value)}
                className="h-9 w-full rounded-lg border border-white/15 bg-white/5 px-2.5 text-sm text-white focus-visible:ring-2 focus-visible:ring-goyn-magenta focus-visible:outline-none"
              >
                <option value="todo" className="bg-goyn-navy">Todo el ecosistema</option>
                {catalogs.territories.map((t) => (
                  <option key={t.code} value={t.code} className="bg-goyn-navy">{t.label}</option>
                ))}
              </select>
            </label>

            <dl className="space-y-2.5">
              {rows.map((r) => (
                <div key={r.key} className="flex items-baseline justify-between gap-3">
                  <dt className="flex items-center gap-2 text-xs font-semibold text-white/75">
                    <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: r.color }} />
                    {r.label}
                  </dt>
                  <dd>
                    <AnimatedNumber key={`${territory}-${r.key}`} value={r.value} duration={1.1} className="font-heading text-lg font-bold" />
                  </dd>
                </div>
              ))}
            </dl>

            <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
              <Segmented label="Agrupar" value={groupBy} onChange={onGroupBy} options={[{ value: "cercania", label: "Cercanía" }, { value: "territorio", label: "Territorio" }]} />
              <Segmented label="Color" value={colorBy} onChange={onColorBy} options={[{ value: "rol", label: "Rol" }, { value: "area", label: "Área" }]} />
            </div>
            {groupBy === "cercania" && (
              <ul className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-white/75" aria-label={colorBy === "rol" ? "Colores por rol" : "Colores por área de impacto"}>
                {(colorBy === "rol" ? catalogs.roles : catalogs.impactAreas).map((c) => (
                  <li key={c.code} className="flex items-center gap-1.5 truncate">
                    <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ backgroundColor: c.color === "#060A28" ? "#8A86FF" : c.color }} />
                    <span className="truncate">{c.label}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="border-t border-white/10 pt-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-white/60 uppercase">
                  <Share2Icon className="size-3.5" aria-hidden /> Conexiones
                </p>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showArcs}
                  onClick={onToggleArcs}
                  className={cn("relative h-5 w-9 rounded-full transition-colors", showArcs ? "bg-goyn-magenta-a11y" : "bg-white/20")}
                >
                  <span className={cn("absolute top-0.5 size-4 rounded-full bg-white transition-all", showArcs ? "left-4.5" : "left-0.5")} />
                  <span className="sr-only">Mostrar conexiones</span>
                </button>
              </div>
              <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/75">
                {relationLegend.map((r) => (
                  <li key={r.code} className="flex items-center gap-1.5">
                    <span aria-hidden className="h-0.5 w-4 rounded-full" style={{ backgroundColor: r.color, boxShadow: `0 0 6px ${r.color}` }} />
                    {r.label}
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={onReplay}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-2 text-sm font-semibold transition-colors hover:bg-white/10"
            >
              <GlobeIcon className="size-4" aria-hidden /> Ver desde el mundo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
