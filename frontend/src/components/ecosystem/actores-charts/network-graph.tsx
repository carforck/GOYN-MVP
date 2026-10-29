"use client";

import { useMemo, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent } from "react";
import { catalogs } from "@/lib/catalogs";
import { cn } from "@/lib/utils";
import { type ChartOrg, ORG_TYPE_COLORS, nf } from "./shared";

// E) "¿Cómo se relacionan los actores?" (pines 9 y 10 de la propuesta de gráficos).
// Grafo de fuerzas en SVG: nodos = organizaciones, aristas = relaciones (socio / aliado / colaborador).
// La simulación es propia (sin dependencias) y determinista; solo se dibuja en el cliente.

// Relación liviana entre dos organizaciones presentes (por slug). `type` = código de cat_relation_type.
export type ChartRelation = { source: string; target: string; type: string };

type RelType = "socio" | "aliado" | "colaborador";
type ColorBy = "rol" | "tipo";

// Los códigos de cat_relation_type coinciden 1:1 con las tres categorías de la propuesta.
const REL_TYPES: { code: RelType; label: string; width: number; dash?: string }[] = [
  { code: "socio", label: "Socio", width: 3.2 },
  { code: "aliado", label: "Aliado", width: 1.8 },
  { code: "colaborador", label: "Colaborador", width: 1.3, dash: "4 3" },
];
const REL_RANK: Record<RelType, number> = { socio: 0, aliado: 1, colaborador: 2 };
const relLabel = (code: RelType) => catalogs.relationTypes.find((r) => r.code === code)?.label ?? REL_TYPES[REL_RANK[code]].label;

const dec1 = new Intl.NumberFormat("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// ─── Simulación de fuerzas ───────────────────────────────────────────────────
type Pt = { x: number; y: number };

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Inspirada en d3-force: resortes en las aristas, repulsión entre todos los nodos, gravedad al
// centro y colisión. Posiciones iniciales en filotaxis y semilla fija → mismo resultado siempre.
function simulate(n: number, links: [number, number][], radius: (i: number) => number): Pt[] {
  const rand = mulberry32(20261029);
  const jiggle = () => (rand() - 0.5) * 1e-6;
  const x = new Float64Array(n);
  const y = new Float64Array(n);
  const vx = new Float64Array(n);
  const vy = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const r = 10 * Math.sqrt(0.5 + i);
    const a = i * Math.PI * (3 - Math.sqrt(5));
    x[i] = r * Math.cos(a);
    y[i] = r * Math.sin(a);
  }
  const deg = new Array<number>(n).fill(0);
  for (const [s, t] of links) {
    deg[s]++;
    deg[t]++;
  }
  const linkStrength = links.map(([s, t]) => 1 / Math.min(deg[s], deg[t]));
  const linkBias = links.map(([s, t]) => deg[s] / (deg[s] + deg[t]));

  const ticks = 320;
  const alphaMin = 0.001;
  const alphaDecay = 1 - Math.pow(alphaMin, 1 / ticks);
  const velocityDecay = 0.6;
  const linkDistance = 42;
  const charge = -70;
  const gravity = 0.07;
  let alpha = 1;

  for (let k = 0; k < ticks; k++) {
    alpha += (0 - alpha) * alphaDecay;

    // Resortes.
    links.forEach(([s, t], li) => {
      let dx = x[t] + vx[t] - x[s] - vx[s] || jiggle();
      let dy = y[t] + vy[t] - y[s] - vy[s] || jiggle();
      let l = Math.sqrt(dx * dx + dy * dy);
      l = ((l - linkDistance) / l) * alpha * linkStrength[li];
      dx *= l;
      dy *= l;
      const b = linkBias[li];
      vx[t] -= dx * b;
      vy[t] -= dy * b;
      vx[s] += dx * (1 - b);
      vy[s] += dy * (1 - b);
    });

    // Repulsión (n² es suficiente para algunos cientos de organizaciones).
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = x[j] - x[i];
        let dy = y[j] - y[i];
        if (dx === 0) dx = jiggle();
        if (dy === 0) dy = jiggle();
        let l2 = dx * dx + dy * dy;
        if (l2 < 1) l2 = Math.sqrt(l2);
        const w = (charge * alpha) / l2;
        vx[i] += dx * w;
        vy[i] += dy * w;
        vx[j] -= dx * w;
        vy[j] -= dy * w;
      }
    }

    // Gravedad hacia el centro (mantiene cerca a las organizaciones sin conexiones).
    for (let i = 0; i < n; i++) {
      vx[i] -= x[i] * gravity * alpha;
      vy[i] -= y[i] * gravity * alpha;
    }

    for (let i = 0; i < n; i++) {
      vx[i] *= velocityDecay;
      vy[i] *= velocityDecay;
      x[i] += vx[i];
      y[i] += vy[i];
    }

    // Colisión.
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = x[j] - x[i];
        const dy = y[j] - y[i];
        const min = radius(i) + radius(j) + 3;
        const l = Math.sqrt(dx * dx + dy * dy) || 1e-6;
        if (l < min) {
          const push = ((min - l) / l) * 0.5;
          x[i] -= dx * push;
          y[i] -= dy * push;
          x[j] += dx * push;
          y[j] += dy * push;
        }
      }
    }
  }
  return Array.from({ length: n }, (_, i) => ({ x: x[i], y: y[i] }));
}

const nodeRadius = (degree: number) => 5 + 2.6 * Math.sqrt(degree);

// Solo en el cliente: evita diferencias de redondeo entre servidor y navegador (hidratación).
const subscribe = () => () => {};
const useMounted = () => useSyncExternalStore(subscribe, () => true, () => false);

// ─── Componente ──────────────────────────────────────────────────────────────
export function NetworkGraph({ orgs, relations }: { orgs: ChartOrg[]; relations: ChartRelation[] }) {
  const mounted = useMounted();
  const [types, setTypes] = useState<RelType[]>(["socio", "aliado", "colaborador"]);
  const [colorBy, setColorBy] = useState<ColorBy>("rol");
  const [active, setActive] = useState<string | null>(null);
  const [dragged, setDragged] = useState<Record<string, Pt>>({});
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ slug: string; id: number; moved: boolean } | null>(null);

  // Una arista por par de organizaciones con todos los tipos que las unen (sin auto-relaciones
  // ni organizaciones fuera de la selección).
  const pairs = useMemo(() => {
    const index = new Map(orgs.map((o, i) => [o.slug, i]));
    const byKey = new Map<string, { s: number; t: number; types: Set<RelType> }>();
    for (const r of relations) {
      const s = index.get(r.source);
      const t = index.get(r.target);
      if (s == null || t == null || s === t || !(r.type in REL_RANK)) continue;
      const [a, b] = s < t ? [s, t] : [t, s];
      const key = `${a}-${b}`;
      const pair = byKey.get(key) ?? { s: a, t: b, types: new Set<RelType>() };
      pair.types.add(r.type as RelType);
      byKey.set(key, pair);
    }
    return [...byKey.values()];
  }, [orgs, relations]);

  // Layout con TODAS las relaciones: las posiciones no saltan al conmutar tipos.
  const layout = useMemo(() => {
    if (!mounted || !orgs.length) return null;
    const fullDeg = new Array<number>(orgs.length).fill(0);
    for (const p of pairs) {
      fullDeg[p.s]++;
      fullDeg[p.t]++;
    }
    const pts = simulate(
      orgs.length,
      pairs.map((p) => [p.s, p.t]),
      (i) => nodeRadius(fullDeg[i]),
    );
    const maxR = nodeRadius(Math.max(0, ...fullDeg));
    const pad = maxR + 8;
    const minX = Math.min(...pts.map((p) => p.x)) - pad;
    const maxX = Math.max(...pts.map((p) => p.x)) + pad;
    const minY = Math.min(...pts.map((p) => p.y)) - pad - 14; // espacio para la etiqueta superior
    const maxY = Math.max(...pts.map((p) => p.y)) + pad;
    return { pts, box: { x: minX, y: minY, w: Math.max(maxX - minX, 200), h: Math.max(maxY - minY, 160) } };
  }, [mounted, orgs, pairs]);

  // Aristas visibles con el tipo más fuerte entre los activos.
  const edges = useMemo(
    () =>
      pairs
        .map((p) => {
          const on = [...p.types].filter((t) => types.includes(t)).sort((a, b) => REL_RANK[a] - REL_RANK[b]);
          return on.length ? { s: p.s, t: p.t, type: on[0] } : null;
        })
        .filter((e): e is { s: number; t: number; type: RelType } => e !== null),
    [pairs, types],
  );

  const degree = useMemo(() => {
    const d = new Array<number>(orgs.length).fill(0);
    for (const e of edges) {
      d[e.s]++;
      d[e.t]++;
    }
    return d;
  }, [edges, orgs.length]);

  const n = orgs.length;
  const E = edges.length;
  const possible = (n * (n - 1)) / 2;
  const isolated = degree.filter((d) => d === 0).length;
  const top = orgs
    .map((o, i) => ({ name: o.name, slug: o.slug, d: degree[i] }))
    .filter((o) => o.d > 0)
    .sort((a, b) => b.d - a.d || a.name.localeCompare(b.name, "es"))
    .slice(0, 3);

  const colorOf = (o: ChartOrg) =>
    colorBy === "rol"
      ? (catalogs.roles.find((r) => r.code === o.primary_role_code)?.color ?? "#9B00FF")
      : (ORG_TYPE_COLORS[o.org_type_code] ?? "#9B00FF");

  const legend = (colorBy === "rol" ? catalogs.roles : catalogs.orgTypes)
    .map((c) => ({
      code: c.code,
      label: c.label,
      color: colorBy === "rol" ? (c.color ?? "#9B00FF") : (ORG_TYPE_COLORS[c.code] ?? "#9B00FF"),
      n: orgs.filter((o) => (colorBy === "rol" ? o.primary_role_code : o.org_type_code) === c.code).length,
    }))
    .filter((c) => c.n > 0)
    // Como en la propuesta (y en los círculos de "¿Quiénes son?"): de mayor a menor número de organizaciones.
    .sort((a, b) => b.n - a.n || a.label.localeCompare(b.label, "es"));

  const activeIdx = active ? orgs.findIndex((o) => o.slug === active) : -1;
  const neighbors = useMemo(() => {
    const set = new Set<number>();
    if (activeIdx < 0) return set;
    for (const e of edges) {
      if (e.s === activeIdx) set.add(e.t);
      if (e.t === activeIdx) set.add(e.s);
    }
    return set;
  }, [edges, activeIdx]);

  const pos = (i: number): Pt => dragged[orgs[i].slug] ?? layout!.pts[i];

  const toSvg = (ev: ReactPointerEvent): Pt | null => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm || !layout) return null;
    const p = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(ctm.inverse());
    const { box } = layout;
    return { x: Math.min(box.x + box.w - 6, Math.max(box.x + 6, p.x)), y: Math.min(box.y + box.h - 6, Math.max(box.y + 20, p.y)) };
  };

  const onNodeDown = (slug: string) => (ev: ReactPointerEvent<SVGGElement>) => {
    ev.stopPropagation();
    ev.currentTarget.setPointerCapture(ev.pointerId);
    drag.current = { slug, id: ev.pointerId, moved: false };
    setActive(slug);
  };
  const onMove = (ev: ReactPointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d || d.id !== ev.pointerId) return;
    const p = toSvg(ev);
    if (!p) return;
    d.moved = true;
    setDragged((prev) => ({ ...prev, [d.slug]: p }));
  };
  const onUp = (ev: ReactPointerEvent<SVGSVGElement>) => {
    if (drag.current?.id === ev.pointerId) {
      drag.current = null;
      if (ev.pointerType === "mouse" && !(ev.target as Element).closest?.("[data-node]")) setActive(null);
    }
  };

  const toggleType = (t: RelType) => setTypes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const chip = (on: boolean) =>
    cn(
      "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
      on ? "border-transparent bg-goyn-violeta text-white" : "bg-card text-foreground hover:bg-muted",
    );

  const typesLabel = types.length ? types.map((t) => relLabel(t).toLowerCase()).join(", ") : "ninguno";
  const ariaLabel =
    `Red de relaciones entre ${n} organizaciones (tipos: ${typesLabel}). ${nf.format(E)} conexiones; ` +
    (top.length ? `las más conectadas: ${top.map((t) => `${t.name} (${t.d})`).join(", ")}.` : "sin conexiones con los tipos seleccionados.");

  const activeLabel = activeIdx >= 0 && layout ? { ...pos(activeIdx), name: orgs[activeIdx].name, d: degree[activeIdx], r: nodeRadius(degree[activeIdx]) } : null;

  return (
    <section aria-labelledby="actores-red" className="space-y-4">
      <div className="space-y-1">
        <h2 id="actores-red" className="text-2xl font-bold text-foreground">
          ¿Cómo se relacionan los actores?
        </h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Las organizaciones no trabajan solas: se asocian, se alían y colaboran. Esta red muestra esos vínculos para reconocer quiénes conectan al ecosistema,
          qué organizaciones podrían sumarse a más alianzas y dónde hay oportunidades de articulación.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* Pin 9: la red */}
        <div className="min-w-0 space-y-4 rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
            <div className="space-y-1.5">
              <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">Tipo de relación</p>
              <div className="flex flex-wrap gap-2">
                {REL_TYPES.map((t) => {
                  const on = types.includes(t.code);
                  return (
                    <button key={t.code} type="button" aria-pressed={on} onClick={() => toggleType(t.code)} className={chip(on)}>
                      <svg width="22" height="8" viewBox="0 0 22 8" aria-hidden className="shrink-0">
                        <line x1="1" y1="4" x2="21" y2="4" stroke="currentColor" strokeWidth={t.width} strokeDasharray={t.dash} strokeLinecap="round" />
                      </svg>
                      {relLabel(t.code)}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">Color por</p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["rol", "Rol"],
                    ["tipo", "Tipo de Organización"],
                  ] as const
                ).map(([v, l]) => (
                  <button key={v} type="button" aria-pressed={colorBy === v} onClick={() => setColorBy(v)} className={chip(colorBy === v)}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {n === 0 ? (
            <p className="text-sm text-muted-foreground">No hay organizaciones con los filtros actuales.</p>
          ) : !layout ? (
            <div className="aspect-[4/3] w-full animate-pulse rounded-xl bg-muted/50" aria-hidden />
          ) : (
            <svg
              ref={svgRef}
              role="img"
              aria-label={ariaLabel}
              viewBox={`${layout.box.x} ${layout.box.y} ${layout.box.w} ${layout.box.h}`}
              className="mx-auto block h-auto max-h-[560px] w-full select-none"
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
              onPointerDown={() => setActive(null)}
              onPointerLeave={(ev) => {
                if (!drag.current && ev.pointerType === "mouse") setActive(null);
              }}
            >
              <g fill="none" strokeLinecap="round">
                {edges.map((e) => {
                  const spec = REL_TYPES[REL_RANK[e.type]];
                  const a = pos(e.s);
                  const b = pos(e.t);
                  const lit = activeIdx >= 0 && (e.s === activeIdx || e.t === activeIdx);
                  const dim = activeIdx >= 0 && !lit;
                  return (
                    <line
                      key={`${e.s}-${e.t}`}
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      strokeWidth={spec.width}
                      strokeDasharray={spec.dash}
                      className={cn(lit ? "stroke-foreground" : "stroke-muted-foreground", "transition-opacity")}
                      strokeOpacity={lit ? 0.9 : dim ? 0.08 : 0.4}
                    />
                  );
                })}
              </g>
              <g>
                {orgs.map((o, i) => {
                  const p = pos(i);
                  const isActive = i === activeIdx;
                  const dim = activeIdx >= 0 && !isActive && !neighbors.has(i);
                  return (
                    <g
                      key={o.slug}
                      data-node
                      onPointerEnter={(ev) => {
                        if (ev.pointerType === "mouse" && !drag.current) setActive(o.slug);
                      }}
                      onPointerDown={onNodeDown(o.slug)}
                      className="cursor-grab touch-none active:cursor-grabbing"
                      opacity={dim ? 0.25 : 1}
                    >
                      <circle cx={p.x} cy={p.y} r={nodeRadius(degree[i])} fill={colorOf(o)} className="stroke-card" strokeWidth={isActive ? 2.5 : 1.5} />
                    </g>
                  );
                })}
              </g>
              {activeLabel && (
                <text
                  x={Math.min(layout.box.x + layout.box.w - 4, Math.max(layout.box.x + 4, activeLabel.x))}
                  y={activeLabel.y - activeLabel.r - 6}
                  textAnchor={
                    activeLabel.x < layout.box.x + layout.box.w * 0.2 ? "start" : activeLabel.x > layout.box.x + layout.box.w * 0.8 ? "end" : "middle"
                  }
                  className="pointer-events-none fill-foreground stroke-card text-[12px] font-bold"
                  strokeWidth={3}
                  paintOrder="stroke"
                >
                  {activeLabel.name} · {activeLabel.d} {activeLabel.d === 1 ? "conexión" : "conexiones"}
                </text>
              )}
            </svg>
          )}

          <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-foreground" aria-label={colorBy === "rol" ? "Leyenda por rol" : "Leyenda por tipo de organización"}>
            {legend.map((c) => (
              <li key={c.code} className="flex items-center gap-1.5">
                <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: c.color }} aria-hidden />
                {c.label}
              </li>
            ))}
          </ul>
        </div>

        {/* Pin 10: lectura de la red */}
        <aside className="space-y-4 rounded-2xl border bg-card p-4 text-sm leading-relaxed text-muted-foreground shadow-sm sm:p-6">
          <h3 className="text-lg font-bold text-foreground">Lectura de la red</h3>
          <p>
            Cada círculo es una organización y su tamaño crece con el número de conexiones. Las líneas gruesas son relaciones de socio, las medias de aliado y las
            punteadas de colaborador. Al pasar el cursor por una organización se resaltan sus vínculos; los círculos se pueden arrastrar.
          </p>
          <dl className="grid grid-cols-2 gap-3">
            {[
              [nf.format(E), "conexiones entre organizaciones"],
              [dec1.format(n ? (2 * E) / n : 0), "conexiones en promedio por organización"],
              [`${dec1.format(possible ? (E / possible) * 100 : 0)}%`, "de todas las conexiones posibles (densidad de la red)"],
              [nf.format(isolated), "organizaciones sin conexiones con los tipos seleccionados"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-xl border bg-muted/40 p-3">
                <dt className="sr-only">{l}</dt>
                <dd className="font-heading text-2xl leading-none font-bold text-foreground">{v}</dd>
                <dd className="mt-1 text-xs">{l}</dd>
              </div>
            ))}
          </dl>
          <div className="space-y-2">
            <p className="text-xs font-bold tracking-wide uppercase">Organizaciones más conectadas</p>
            {top.length ? (
              <ol className="space-y-1.5">
                {top.map((t, i) => (
                  <li key={t.slug} className="flex items-center gap-2 text-foreground">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-goyn-violeta text-xs font-bold text-white">{i + 1}</span>
                    <span className="min-w-0 flex-1">{t.name}</span>
                    <span className="font-bold">{t.d}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p>No hay conexiones con los tipos seleccionados.</p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
