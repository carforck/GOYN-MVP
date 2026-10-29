"use client";

import { useMemo, useState } from "react";
import { ChallengesTree } from "./challenges-tree";
import { FiguresCards } from "./figures-cards";
import { FocusLead, FocusRadar, ZoneChips, zonesName } from "./focus-radar";
import { NetworkGraph, type ChartRelation } from "./network-graph";
import { NewDataCards } from "./new-data-cards";
import type { ChartOrg } from "./shared";
import { WhoCircles } from "./who-circles";

export type { ChartOrg } from "./shared";

// Gráficos del ecosistema bajo el mapa (ajuste 15, propuesta de gráficos de la sección Mapa):
// A) cifras (pines 1-2), B) quiénes son (circle packing, pines 3-4), C) foco por áreas (radar, pines 5-7),
// D) retos por área (árbol, pin 8) y E) nuevos datos del instrumento (pin 11). C y D comparten la selección
// de "Zona de incidencia".
export function ActoresCharts({
  orgs,
  investment,
  relations,
}: {
  orgs: ChartOrg[];
  investment: { totalCop: number | null; reported: number };
  relations: ChartRelation[];
}) {
  const [zones, setZones] = useState<string[]>([]);
  const selected = useMemo(
    () => (zones.length ? orgs.filter((o) => o.territory_codes.some((t) => zones.includes(t))) : orgs),
    [orgs, zones],
  );

  const selName = zones.length ? zonesName(zones) : null;

  return (
    <div className="space-y-10 pt-4">
      <FiguresCards organizations={orgs.length} investment={investment} />
      <WhoCircles orgs={orgs} />

      <section aria-labelledby="actores-foco" className="space-y-4">
        <div className="space-y-2">
          <h2 id="actores-foco" className="text-2xl font-bold text-foreground">
            ¿En qué están enfocadas las organizaciones de la red colaborativa?
          </h2>
          <FocusLead orgs={orgs} />
        </div>
        <div className="space-y-6 rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
          <ZoneChips orgs={orgs} zones={zones} onChange={setZones} />
          <FocusRadar orgs={orgs} selected={selected} zones={zones} />
        </div>

        {/* Pin 8: retos por área de impacto, con la misma selección de zonas del radar. */}
        <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6" id="actores-retos">
          <ChallengesTree orgs={selected} selName={selName}>
            <ZoneChips orgs={orgs} zones={zones} onChange={setZones} />
          </ChallengesTree>
        </div>
      </section>

      {/* Red de relaciones (pines 9-10) */}
      <NetworkGraph orgs={orgs} relations={relations} />

      <NewDataCards />
    </div>
  );
}
