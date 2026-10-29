"use client";

import { catalogs, shortTerritory } from "@/lib/catalogs";
import { cn } from "@/lib/utils";
import type { ChartOrg } from "./shared";

// C) "¿En qué están enfocadas las organizaciones de la red?" — radar de áreas de impacto.
// Escala fija (0 → máximo de toda la red) para comparar cualquier selección de zonas.

export function ZoneChips({ orgs, zones, onChange }: { orgs: ChartOrg[]; zones: string[]; onChange: (z: string[]) => void }) {
  const counts = catalogs.territories
    .map((t) => ({ code: t.code, label: shortTerritory(t.code), n: orgs.filter((o) => o.territory_codes.includes(t.code)).length }))
    .filter((t) => t.n > 0);
  const chip = (on: boolean) =>
    cn(
      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
      on ? "border-transparent bg-goyn-violeta text-white" : "bg-card text-foreground hover:bg-muted",
    );
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-semibold text-muted-foreground">Zona de incidencia</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" aria-pressed={zones.length === 0} onClick={() => onChange([])} className={chip(zones.length === 0)}>
          Toda la red <span className="opacity-75">{orgs.length}</span>
        </button>
        {counts.map((t) => {
          const on = zones.includes(t.code);
          return (
            <button
              key={t.code}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? zones.filter((z) => z !== t.code) : [...zones, t.code])}
              className={chip(on)}
            >
              {t.label} <span className="opacity-75">{t.n}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const SIZE = 420;
const C = SIZE / 2;
const R = 140;

export function FocusRadar({ orgs, selected, zones }: { orgs: ChartOrg[]; selected: ChartOrg[]; zones: string[] }) {
  const areas = catalogs.impactAreas;
  const all = areas.map((a) => orgs.filter((o) => o.area_codes.includes(a.code)).length);
  const sel = areas.map((a) => selected.filter((o) => o.area_codes.includes(a.code)).length);
  const max = Math.max(1, ...all);
  const filtering = zones.length > 0;

  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / areas.length;
  const pt = (i: number, v: number) => {
    const r = (v / max) * R;
    return [C + r * Math.cos(angle(i)), C + r * Math.sin(angle(i))] as const;
  };
  const poly = (vals: number[]) => vals.map((v, i) => pt(i, v).join(",")).join(" ");
  const ticks = [0.25, 0.5, 0.75, 1];

  const ranked = areas.map((a, i) => ({ ...a, n: sel[i], all: all[i] })).sort((a, b) => b.n - a.n || b.all - a.all);
  const top = ranked[0];
  const zoneNames = zones.map(shortTerritory);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="min-w-0">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto h-auto w-full max-w-[480px]" role="img" aria-label="Radar de áreas de impacto: número de organizaciones por área">
          {ticks.map((f) => (
            <polygon
              key={f}
              points={areas.map((_, i) => pt(i, max * f).join(",")).join(" ")}
              fill="none"
              stroke="currentColor"
              className="text-border"
              strokeWidth={1}
            />
          ))}
          {areas.map((_, i) => {
            const [x, y] = pt(i, max);
            return <line key={i} x1={C} y1={C} x2={x} y2={y} stroke="currentColor" className="text-border" strokeWidth={1} />;
          })}
          {ticks.map((f) => (
            <text key={f} x={C + 4} y={C - R * f + 3} className="fill-muted-foreground text-[10px]">
              {Math.round(max * f)}
            </text>
          ))}

          {filtering && <polygon points={poly(all)} fill="none" stroke="#060A28" strokeOpacity={0.55} strokeWidth={1.5} strokeDasharray="5 4" className="dark:stroke-white" />}
          <polygon points={poly(sel)} fill="#9B00FF" fillOpacity={0.22} stroke="#9B00FF" strokeWidth={2.5} strokeLinejoin="round" />
          {sel.map((v, i) => {
            const [x, y] = pt(i, v);
            return (
              <circle key={i} cx={x} cy={y} r={4} fill="#9B00FF">
                <title>{`${areas[i].label}: ${v} ${filtering ? `de ${all[i]} ` : ""}organizaciones`}</title>
              </circle>
            );
          })}

          {areas.map((a, i) => {
            const [ix, iy] = [C + (R + 32) * Math.cos(angle(i)), C + (R + 32) * Math.sin(angle(i))];
            return (
              <g key={a.code}>
                <image href={`/images/areas/${a.code}.svg`} x={ix - 15} y={iy - 15} width={30} height={30}>
                  <title>{a.label}</title>
                </image>
                <text x={ix} y={iy + 27} textAnchor="middle" className="fill-foreground text-[11px] font-bold">
                  {sel[i]}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="mt-2 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-5 rounded-sm border-2 border-goyn-violeta bg-goyn-violeta/25" aria-hidden />
            {filtering ? "Organizaciones en las zonas elegidas" : "Toda la red"}
          </span>
          {filtering && (
            <span className="inline-flex items-center gap-1.5">
              <svg width="20" height="8" aria-hidden>
                <line x1="0" y1="4" x2="20" y2="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
              </svg>
              Toda la red (referencia)
            </span>
          )}
          <span>Escala fija: 0 a {max} organizaciones</span>
        </div>
      </div>

      <aside className="space-y-3 text-sm leading-relaxed text-muted-foreground lg:border-l lg:pl-6">
        <h3 className="text-lg font-bold text-foreground">Dónde ponemos el foco</h3>
        {selected.length === 0 ? (
          <p>No hay organizaciones con presencia en la selección.</p>
        ) : (
          <p>
            {filtering ? (
              <>
                En {zoneNames.length === 1 ? "la zona" : "las zonas"} <strong className="text-foreground">{zoneNames.join(", ")}</strong> hay{" "}
                <strong className="text-foreground">{selected.length} de {orgs.length} organizaciones</strong> de la red.
              </>
            ) : (
              <>
                Las <strong className="text-foreground">{orgs.length} organizaciones</strong> de la red marcaron una o varias áreas de impacto.
              </>
            )}{" "}
            El foco principal está en <strong className="text-foreground">{top.label}</strong> ({top.n} organizaciones).
          </p>
        )}
        <ol className="space-y-1.5">
          {ranked.map((a) => (
            <li key={a.code} className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/images/areas/${a.code}.svg`} alt="" width={20} height={20} className="size-5 shrink-0" />
              <span className="min-w-0 flex-1 text-foreground">{a.label}</span>
              <span className="font-bold text-foreground">{filtering ? `${a.n} de ${a.all}` : a.n}</span>
            </li>
          ))}
        </ol>
        <p className="text-xs">Respuesta múltiple: una organización puede marcar varias áreas.</p>
      </aside>
    </div>
  );
}
