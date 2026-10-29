"use client";

import { catalogs, shortTerritory } from "@/lib/catalogs";
import { cn } from "@/lib/utils";
import type { ChartOrg } from "./shared";

// C) "¿En qué están enfocadas las organizaciones de la red colaborativa?" — radar de áreas de impacto
// (pines 5, 6 y 7 de la propuesta). Escala fija (0 → máximo de toda la red redondeado a múltiplo de 4)
// para comparar cualquier selección de zonas. Se conservan todas las áreas aunque valgan cero (D3).

export function ZoneChips({ orgs, zones, onChange }: { orgs: ChartOrg[]; zones: string[]; onChange: (z: string[]) => void }) {
  // Como en la propuesta: nombre completo de la zona (BAQ / AMB) y de mayor a menor número de organizaciones.
  const counts = catalogs.territories
    .map((t) => ({ code: t.code, label: t.label, n: orgs.filter((o) => o.territory_codes.includes(t.code)).length }))
    .filter((t) => t.n > 0)
    .sort((a, b) => b.n - a.n || a.label.localeCompare(b.label, "es"));
  const chip = (on: boolean) =>
    cn(
      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
      on ? "border-transparent bg-goyn-violeta text-white" : "bg-card text-foreground hover:bg-muted",
    );
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-semibold text-muted-foreground">Zona de incidencia</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por zona de incidencia">
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

// Áreas ordenadas por número de organizaciones en toda la red (mismo orden de los ejes del radar).
export function rankAreas(orgs: ChartOrg[]) {
  return catalogs.impactAreas
    .map((a) => ({ code: a.code, label: a.label, color: a.color ?? "#9B00FF", total: orgs.filter((o) => o.area_codes.includes(a.code)).length }))
    .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label, "es"));
}

export const zonesName = (zones: string[]) => zones.map(shortTerritory).join(" + ");

// Párrafo bajo el título de la sección (siempre sobre toda la red).
export function FocusLead({ orgs }: { orgs: ChartOrg[] }) {
  const ranked = rankAreas(orgs);
  if (!orgs.length || ranked.length < 3) return null;
  const [a, b] = ranked;
  const last = ranked[ranked.length - 1];
  return (
    <p className="max-w-3xl text-muted-foreground">
      Las áreas de impacto muestran hacia dónde dirigen sus esfuerzos las {orgs.length} organizaciones de la red. Los focos más fuertes son{" "}
      <strong className="text-foreground">{a.label}</strong> ({a.total} organizaciones) y <strong className="text-foreground">{b.label}</strong> ({b.total}); el
      menos atendido es <strong className="text-foreground">{last.label}</strong> ({last.total}).
    </p>
  );
}

// Geometría en fracciones del lienzo cuadrado: el polígono ocupa un radio de 0,29 y las etiquetas
// (HTML, para que el texto no se encoja en móvil) van en un radio de 0,41; en pantallas angostas
// la posición horizontal se acota para que ninguna etiqueta se salga del lienzo.
const V = 400; // viewBox del SVG
const R = 0.29;
const LABEL_R = 0.41;

export function FocusRadar({ orgs, selected, zones }: { orgs: ChartOrg[]; selected: ChartOrg[]; zones: string[] }) {
  const areas = rankAreas(orgs);
  const all = areas.map((a) => a.total);
  const sel = areas.map((a) => selected.filter((o) => o.area_codes.includes(a.code)).length);
  const max = Math.max(4, Math.ceil(Math.max(0, ...all) / 4) * 4);
  const filtering = zones.length > 0;
  const selName = filtering ? zonesName(zones) : "Toda la red";

  // Primer eje arriba; los siguientes en sentido antihorario, de mayor a menor.
  const angle = (i: number) => -Math.PI / 2 - (i * 2 * Math.PI) / areas.length;
  // Redondeo a milésimas para que servidor y navegador generen exactamente los mismos atributos.
  const r3 = (n: number) => Math.round(n * 1000) / 1000;
  const at = (i: number, frac: number) => [r3(V / 2 + frac * V * Math.cos(angle(i))), r3(V / 2 + frac * V * Math.sin(angle(i)))] as const;
  const pt = (i: number, v: number) => at(i, (v / max) * R);
  const poly = (vals: number[]) => vals.map((v, i) => pt(i, v).join(",")).join(" ");
  const ticks = [0.25, 0.5, 0.75, 1];

  const order = areas.map((a, i) => ({ ...a, n: sel[i] })).sort((x, y) => y.n - x.n || y.total - x.total);
  const top = order[0];
  const bottom = order[order.length - 1];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="min-w-0">
        <div className="relative mx-auto aspect-square w-full max-w-[520px]">
          <svg
            viewBox={`0 0 ${V} ${V}`}
            className="absolute inset-0 h-full w-full"
            role="img"
            aria-label={`Radar de áreas de impacto (${selName}): ${areas.map((a, i) => `${a.label} ${sel[i]}`).join(", ")}`}
          >
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
              return <line key={i} x1={V / 2} y1={V / 2} x2={x} y2={y} stroke="currentColor" className="text-border" strokeWidth={1} />;
            })}

            {filtering && (
              <polygon points={poly(all)} fill="none" stroke="#060A28" strokeOpacity={0.55} strokeWidth={1.5} strokeDasharray="5 4" className="dark:stroke-white" />
            )}
            <polygon points={poly(sel)} fill="#9B00FF" fillOpacity={0.22} stroke="#9B00FF" strokeWidth={2.5} strokeLinejoin="round" />
            {sel.map((v, i) => {
              const [x, y] = pt(i, v);
              const [lx, ly] = at(i, (v / max) * R + 0.04);
              return (
                <g key={areas[i].code}>
                  <circle cx={x} cy={y} r={4} fill="#9B00FF">
                    <title>{`${areas[i].label}: ${v} ${filtering ? `de ${all[i]} ` : ""}organizaciones`}</title>
                  </circle>
                  <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central" className="fill-foreground text-[12px] font-bold" aria-hidden>
                    {v}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Ícono + nombre completo de cada área en la punta de su eje. */}
          {areas.map((a, i) => {
            const [x, y] = at(i, LABEL_R);
            return (
              <div
                key={a.code}
                className="pointer-events-none absolute flex w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 text-center sm:w-24"
                style={{ left: `clamp(3rem, ${r3((x / V) * 100)}%, calc(100% - 3rem))`, top: `${r3((y / V) * 100)}%` }}
                aria-hidden
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/images/areas/${a.code}.svg`} alt="" width={26} height={26} className="size-6 sm:size-7" />
                <span className="text-[10px] leading-tight font-semibold text-foreground sm:text-[11px]">{a.label}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          {filtering && (
            <span className="inline-flex items-center gap-1.5">
              <svg width="20" height="8" aria-hidden>
                <line x1="0" y1="4" x2="20" y2="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
              </svg>
              Toda la red (referencia)
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-5 rounded-sm border-2 border-goyn-violeta bg-goyn-violeta/25" aria-hidden />
            <b className="font-semibold text-foreground">
              {selName} · {selected.length} organizaciones
            </b>
          </span>
        </div>
      </div>

      <aside className="space-y-3 text-sm leading-relaxed text-muted-foreground lg:border-l lg:pl-6" aria-live="polite">
        <h3 className="text-lg font-bold text-foreground">Dónde ponemos el foco</h3>
        <p>
          El radar muestra cuántas organizaciones trabajan cada área de impacto. Mientras más se aleja la forma del centro, más organizaciones atienden esa área: las
          puntas revelan los focos estratégicos y los entrantes, las áreas donde la red tiene menos presencia.
        </p>
        <p>
          La línea punteada es siempre toda la red. Al elegir una o varias zonas, el área de color muestra a las organizaciones con presencia en ellas, y la
          distancia con la referencia indica qué peso tiene ese territorio en cada foco.
        </p>
        {selected.length === 0 ? (
          <p>No hay organizaciones con presencia en la selección.</p>
        ) : filtering ? (
          <p>
            En <strong className="text-foreground">{selName}</strong> tienen presencia {selected.length} de las {orgs.length} organizaciones. Su foco principal es{" "}
            <strong className="text-foreground">{top.label}</strong> ({top.n} organizaciones)
            {bottom.n === 0 && (
              <>
                , y ninguna trabaja <strong className="text-foreground">{bottom.label}</strong>
              </>
            )}
            .
          </p>
        ) : (
          <p>
            En toda la red, <strong className="text-foreground">{top.label}</strong> concentra el mayor número de organizaciones ({top.n} de {orgs.length}).
          </p>
        )}
        <ol className="divide-y">
          {order.map((a) => (
            <li key={a.code} className="flex items-center gap-2 py-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/images/areas/${a.code}.svg`} alt="" width={20} height={20} className="size-5 shrink-0" />
              <span className="min-w-0 flex-1 text-foreground">{a.label}</span>
              <span className="font-bold text-foreground">
                {a.n}
                {filtering && <small className="ml-1 font-normal text-muted-foreground">de {a.total}</small>}
              </span>
            </li>
          ))}
        </ol>
        <p className="text-xs">Respuesta múltiple: una organización puede marcar varias áreas.</p>
      </aside>
    </div>
  );
}
