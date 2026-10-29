"use client";

import { useMemo, useState } from "react";
import { shortTerritory } from "@/lib/catalogs";
import { ChallengesTree } from "./challenges-tree";
import { FiguresCards } from "./figures-cards";
import { FocusRadar, ZoneChips } from "./focus-radar";
import type { ChartOrg } from "./shared";
import { WhoCircles } from "./who-circles";

export type { ChartOrg } from "./shared";

// Gráficos del ecosistema bajo el mapa (ajuste 15, propuesta de gráficos de la sección Mapa):
// A) cifras, B) quiénes son (circle packing), C) foco por áreas (radar) y D) retos por área (árbol).
// C y D comparten la selección de "Zona de incidencia".
export function ActoresCharts({ orgs, investment }: { orgs: ChartOrg[]; investment: { totalCop: number | null; reported: number } }) {
  const [zones, setZones] = useState<string[]>([]);
  const selected = useMemo(
    () => (zones.length ? orgs.filter((o) => o.territory_codes.some((t) => zones.includes(t))) : orgs),
    [orgs, zones],
  );

  return (
    <div className="space-y-10 pt-4">
      <FiguresCards organizations={orgs.length} investment={investment} />
      <WhoCircles orgs={orgs} />

      <section aria-labelledby="actores-foco" className="space-y-4">
        <h2 id="actores-foco" className="text-2xl font-bold text-foreground">
          ¿En qué están enfocadas las organizaciones de la red?
        </h2>
        <div className="space-y-6 rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
          <ZoneChips orgs={orgs} zones={zones} onChange={setZones} />
          <FocusRadar orgs={orgs} selected={selected} zones={zones} />
        </div>
      </section>

      <section aria-labelledby="actores-retos" className="space-y-4">
        <div className="space-y-1">
          <h2 id="actores-retos" className="text-2xl font-bold text-foreground">
            Retos por área de impacto
          </h2>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Problemáticas y barreras que atienden las organizaciones en cada área. Despliega cada recuadro para llegar hasta las organizaciones. Usa la misma
            selección de zonas del gráfico anterior.
          </p>
        </div>
        <div className="space-y-4 rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
          <ZoneChips orgs={orgs} zones={zones} onChange={setZones} />
          <ChallengesTree orgs={selected} zonesLabel={zones.length ? zones.map(shortTerritory).join(", ") : null} />
        </div>
      </section>
    </div>
  );
}
