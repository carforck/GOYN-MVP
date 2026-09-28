"use client";

import { ChevronDownIcon, GlobeIcon, Share2Icon } from "lucide-react";
import { useState } from "react";
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
export function MapHud({ showArcs, onToggleArcs, onReplay }: { showArcs: boolean; onToggleArcs: () => void; onReplay: () => void }) {
  const live = useLive();
  const [territory, setTerritory] = useState<string>("todo");
  const [open, setOpen] = useState(true);

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
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between gap-2 border-b border-white/10 px-4 py-3 text-left">
          <span>
            <span className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-white/60 uppercase">
              <span className="goyn-live-dot" aria-hidden /> {live.source === "demo" ? "En vivo · simulación" : "En vivo"}
            </span>
            <span className="mt-0.5 block font-heading text-base font-bold">
              {territory === "todo" ? "Todo el ecosistema" : catalogs.territories.find((t) => t.code === territory)?.label}
            </span>
          </span>
          <ChevronDownIcon className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")} aria-hidden />
        </button>

        {open && (
          <div className="space-y-4 p-4">
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
                  className={cn("relative h-5 w-9 rounded-full transition-colors", showArcs ? "bg-goyn-magenta" : "bg-white/20")}
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
