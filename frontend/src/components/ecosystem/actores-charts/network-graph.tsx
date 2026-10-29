"use client";

import { ArrowRightIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent } from "react";
import { catalogs, label, shortTerritory } from "@/lib/catalogs";
import { cn } from "@/lib/utils";
import { type ChartOrg, colorRol, colorTipoOrg, nf } from "./shared";
import { colorConexion, svgDash } from "@/lib/palette";

// E) "¿Cómo se relacionan los actores?" (pines 9 y 10 de la propuesta de gráficos).
// Grafo de fuerzas en SVG: nodos = organizaciones, aristas = relaciones (socio / aliado / colaborador).
// La simulación es propia (sin dependencias) y determinista; solo se dibuja en el cliente.
// Sobre ese layout 2D cada nodo recibe una profundidad z y la red se anima de forma continua (flotación
// suave + rotación lenta en perspectiva) con requestAnimationFrame, escribiendo los atributos SVG por
// refs: React no se vuelve a renderizar por cuadro. Se pausa al interactuar y queda estática con
// prefers-reduced-motion.

// Relación liviana entre dos organizaciones presentes (por slug). `type` = código de cat_relation_type.
export type ChartRelation = { source: string; target: string; type: string };

type RelType = "socio" | "aliado" | "colaborador";
type ColorBy = "rol" | "tipo";

// Los códigos de cat_relation_type coinciden 1:1 con las tres categorías de la propuesta.
// Color y patrón de trazo vienen de la paleta única (los mismos que las conexiones del mapa).
const REL_TYPES: { code: RelType; label: string; width: number; dash?: string; color: string }[] = (
  [
    { code: "socio", label: "Socio", width: 3.2 },
    { code: "aliado", label: "Aliado", width: 1.8 },
    { code: "colaborador", label: "Colaborador", width: 1.6 },
  ] as const
).map((t) => ({ ...t, dash: svgDash(t.code, t.width), color: colorConexion(t.code) }));
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

// ─── Proyección 3D ───────────────────────────────────────────────────────────
// Cada nodo tiene una posición base (x, y) del layout, una profundidad z y fases propias de flotación.
// Con el tiempo t (segundos de animación) la red oscila alrededor del eje vertical (yaw) y del
// horizontal (pitch) y se proyecta en perspectiva: lo cercano se ve más grande y opaco.
type Scene = {
  cx: number;
  cy: number;
  span: number;
  z: Float64Array;
  phase: Float64Array; // 3 fases por nodo
  freq: Float64Array; // 3 frecuencias por nodo
};

const FLOAT = 3.2; // amplitud de la flotación (unidades del viewBox)
const YAW = 0.42; // amplitud de la rotación (rad)
const PITCH = 0.14;

type Proj = { X: number; Y: number; k: number; depth: number };

function project(sc: Scene, i: number, bx: number, by: number, t: number): Proj {
  const ph = i * 3;
  const fx = FLOAT * Math.sin(t * sc.freq[ph] + sc.phase[ph]);
  const fy = FLOAT * Math.cos(t * sc.freq[ph + 1] + sc.phase[ph + 1]);
  const fz = FLOAT * 2 * Math.sin(t * sc.freq[ph + 2] + sc.phase[ph + 2]);
  const x = bx - sc.cx + fx;
  const y = by - sc.cy + fy;
  const z = sc.z[i] + fz;
  const yaw = YAW * Math.sin(t * 0.11);
  const pitch = PITCH * Math.sin(t * 0.083 + 1.3);
  const cyw = Math.cos(yaw);
  const syw = Math.sin(yaw);
  const x1 = x * cyw + z * syw;
  const z1 = -x * syw + z * cyw;
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const y2 = y * cp - z1 * sp;
  const z2 = y * sp + z1 * cp;
  const D = sc.span * 1.8;
  const k = D / (D - z2);
  return { X: sc.cx + x1 * k, Y: sc.cy + y2 * k, k, depth: Math.max(-1, Math.min(1, z2 / (sc.span * 0.3))) };
}

// Inversa aproximada (para arrastrar): la posición base cuya proyección cae en (X, Y) en el instante t.
function unproject(sc: Scene, i: number, X: number, Y: number, t: number, start: Pt): Pt {
  let bx = start.x;
  let by = start.y;
  const h = 0.5;
  for (let it = 0; it < 10; it++) {
    // Newton 2D con jacobiano numérico.
    const p = project(sc, i, bx, by, t);
    const ex = X - p.X;
    const ey = Y - p.Y;
    if (Math.abs(ex) + Math.abs(ey) < 0.01) break;
    const px = project(sc, i, bx + h, by, t);
    const py = project(sc, i, bx, by + h, t);
    const a = (px.X - p.X) / h;
    const b = (py.X - p.X) / h;
    const c = (px.Y - p.Y) / h;
    const d = (py.Y - p.Y) / h;
    const det = a * d - b * c || 1e-6;
    bx += (d * ex - b * ey) / det;
    by += (a * ey - c * ex) / det;
  }
  return { x: bx, y: by };
}

// ─── Componente ──────────────────────────────────────────────────────────────
export function NetworkGraph({ orgs, relations }: { orgs: ChartOrg[]; relations: ChartRelation[] }) {
  const mounted = useMounted();
  const [types, setTypes] = useState<RelType[]>(["socio", "aliado", "colaborador"]);
  const [colorBy, setColorBy] = useState<ColorBy>("rol");
  const [hover, setHover] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ slug: string; i: number; id: number; moved: boolean; x0: number; y0: number } | null>(null);
  const dragged = useRef(new Map<string, Pt>()); // posiciones base movidas por el usuario
  const tRef = useRef(0); // tiempo de animación acumulado (s)
  const insideRef = useRef(false); // cursor sobre la red
  const pinnedRef = useRef<string | null>(null);

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
    const minX0 = Math.min(...pts.map((p) => p.x));
    const maxX0 = Math.max(...pts.map((p) => p.x));
    const minY0 = Math.min(...pts.map((p) => p.y));
    const maxY0 = Math.max(...pts.map((p) => p.y));
    const span = Math.max(maxX0 - minX0, maxY0 - minY0, 120);
    // Margen extra para la rotación en perspectiva y la flotación.
    const pad = maxR + 8 + span * 0.07;
    const minX = minX0 - pad;
    const maxX = maxX0 + pad;
    const minY = minY0 - pad - 14; // espacio para la etiqueta superior
    const maxY = maxY0 + pad;

    const n = orgs.length;
    const rand = mulberry32(7331);
    const z = new Float64Array(n);
    const phase = new Float64Array(n * 3);
    const freq = new Float64Array(n * 3);
    for (let i = 0; i < n; i++) {
      z[i] = (rand() - 0.5) * span * 0.5;
      for (let j = 0; j < 3; j++) {
        phase[i * 3 + j] = rand() * Math.PI * 2;
        freq[i * 3 + j] = 0.35 + rand() * 0.45;
      }
    }
    const scene: Scene = { cx: (minX0 + maxX0) / 2, cy: (minY0 + maxY0) / 2, span, z, phase, freq };
    return { pts, scene, box: { x: minX, y: minY, w: Math.max(maxX - minX, 200), h: Math.max(maxY - minY, 160) } };
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
      ? colorRol(o.primary_role_code)
      : colorTipoOrg(o.org_type_code);

  const legend = (colorBy === "rol" ? catalogs.roles : catalogs.orgTypes)
    .map((c) => ({
      code: c.code,
      label: c.label,
      color: colorBy === "rol" ? colorRol(c.code) : colorTipoOrg(c.code),
      n: orgs.filter((o) => (colorBy === "rol" ? o.primary_role_code : o.org_type_code) === c.code).length,
    }))
    .filter((c) => c.n > 0)
    // Como en la propuesta (y en los círculos de "¿Quiénes son?"): de mayor a menor número de organizaciones.
    .sort((a, b) => b.n - a.n || a.label.localeCompare(b.label, "es"));

  const active = pinned ?? hover;
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

  // Resumen de la organización activa para el panel "Lectura de la red".
  const detail = useMemo(() => {
    if (activeIdx < 0) return null;
    const o = orgs[activeIdx];
    const byType: Record<RelType, number> = { socio: 0, aliado: 0, colaborador: 0 };
    for (const p of pairs) {
      if (p.s !== activeIdx && p.t !== activeIdx) continue;
      for (const t of p.types) if (types.includes(t)) byType[t]++;
    }
    const list = [...neighbors].map((i) => orgs[i]).sort((a, b) => a.name.localeCompare(b.name, "es"));
    return {
      org: o,
      role: label("roles", o.primary_role_code),
      type: label("orgTypes", o.org_type_code),
      zones: o.territory_codes.map(shortTerritory),
      byType,
      list,
    };
  }, [activeIdx, orgs, pairs, types, neighbors]);

  // ─── Animación (fuera del ciclo de render de React) ─────────────────────────
  // Los atributos de posición (cx, cy, r, x1…) NO van en el JSX: los escribe `draw` vía el DOM.
  const els = useRef<{ nodes: SVGCircleElement[]; lines: SVGLineElement[]; text: SVGTextElement | null }>({ nodes: [], lines: [], text: null });

  const drawRef = useRef<() => void>(() => {});
  const kickRef = useRef<() => void>(() => {});
  // Tras cada render: cachea los elementos SVG y los ubica antes de pintar.
  useLayoutEffect(() => {
    pinnedRef.current = pinned;
    drawRef.current = () => {
      const L = layout;
      const deg = degree;
      const ai = activeIdx;
      if (!L) return;
      const t = tRef.current;
      const X = new Float64Array(orgs.length);
      const Y = new Float64Array(orgs.length);
      const { nodes, lines, text } = els.current;
      for (const c of nodes) {
        const i = Number(c.dataset.i);
        const b = dragged.current.get(orgs[i].slug) ?? L.pts[i];
        const p = project(L.scene, i, b.x, b.y, t);
        X[i] = p.X;
        Y[i] = p.Y;
        c.setAttribute("cx", p.X.toFixed(2));
        c.setAttribute("cy", p.Y.toFixed(2));
        c.setAttribute("r", (nodeRadius(deg[i]) * p.k).toFixed(2));
        c.setAttribute("fill-opacity", (0.78 + 0.22 * (p.depth + 1) * 0.5).toFixed(3));
      }
      for (const l of lines) {
        const s = Number(l.dataset.s);
        const e = Number(l.dataset.t);
        l.setAttribute("x1", X[s].toFixed(2));
        l.setAttribute("y1", Y[s].toFixed(2));
        l.setAttribute("x2", X[e].toFixed(2));
        l.setAttribute("y2", Y[e].toFixed(2));
      }
      if (text && ai >= 0) {
        const { box } = L;
        const r = Number(nodes.find((c) => Number(c.dataset.i) === ai)?.getAttribute("r") ?? nodeRadius(deg[ai]));
        text.setAttribute("x", Math.min(box.x + box.w - 4, Math.max(box.x + 4, X[ai])).toFixed(2));
        text.setAttribute("y", (Y[ai] - r - 6).toFixed(2));
        text.setAttribute("text-anchor", X[ai] < box.x + box.w * 0.2 ? "start" : X[ai] > box.x + box.w * 0.8 ? "end" : "middle");
      }
    };
    const svg = svgRef.current;
    if (!svg) {
      els.current = { nodes: [], lines: [], text: null };
      return;
    }
    els.current = {
      nodes: [...svg.querySelectorAll<SVGCircleElement>("circle[data-i]")],
      lines: [...svg.querySelectorAll<SVGLineElement>("line[data-s]")],
      text: svg.querySelector<SVGTextElement>("text[data-label]"),
    };
    drawRef.current();
  });

  // Bucle de animación: corre solo si la red está en pantalla, no hay interacción y no se pidió
  // reducir el movimiento.
  const hasLayout = !!layout;
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !hasLayout) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let raf = 0;
    let last = 0;
    const paused = () => reduce.matches || !visible || insideRef.current || pinnedRef.current != null || drag.current != null || document.hidden;
    const frame = (now: number) => {
      raf = 0;
      if (paused()) return;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      tRef.current += dt;
      drawRef.current();
      raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (raf || paused()) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    kickRef.current = kick;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      kick();
    });
    io.observe(svg);
    reduce.addEventListener("change", kick);
    document.addEventListener("visibilitychange", kick);
    return () => {
      io.disconnect();
      reduce.removeEventListener("change", kick);
      document.removeEventListener("visibilitychange", kick);
      if (raf) cancelAnimationFrame(raf);
      kickRef.current = () => {};
    };
  }, [hasLayout]);

  // Al soltar la selección fija se reanuda el movimiento.
  useEffect(() => {
    if (!pinned) kickRef.current();
  }, [pinned]);

  const toSvg = (ev: ReactPointerEvent): Pt | null => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm || !layout) return null;
    const p = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(ctm.inverse());
    const { box } = layout;
    return { x: Math.min(box.x + box.w - 6, Math.max(box.x + 6, p.x)), y: Math.min(box.y + box.h - 6, Math.max(box.y + 20, p.y)) };
  };

  const onNodeDown = (slug: string, i: number) => (ev: ReactPointerEvent<SVGGElement>) => {
    ev.stopPropagation();
    ev.currentTarget.setPointerCapture(ev.pointerId);
    drag.current = { slug, i, id: ev.pointerId, moved: false, x0: ev.clientX, y0: ev.clientY };
  };
  const onMove = (ev: ReactPointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d || d.id !== ev.pointerId || !layout) return;
    if (!d.moved && Math.hypot(ev.clientX - d.x0, ev.clientY - d.y0) < 4) return;
    const p = toSvg(ev);
    if (!p) return;
    if (!d.moved) {
      d.moved = true;
      setHover(d.slug);
    }
    const start = dragged.current.get(d.slug) ?? layout.pts[d.i];
    dragged.current.set(d.slug, unproject(layout.scene, d.i, p.x, p.y, tRef.current, start));
    drawRef.current();
  };
  const onUp = (ev: ReactPointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (d?.id !== ev.pointerId) return;
    drag.current = null;
    // Clic / toque sin arrastre: fija (o suelta) la selección.
    if (!d.moved) setPinned((cur) => (cur === d.slug ? null : d.slug));
    else if (ev.pointerType !== "mouse") setHover(null);
    kickRef.current();
  };

  const toggleType = (t: RelType) => setTypes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const chip = (on: boolean) =>
    cn(
      "inline-flex min-h-10 items-center gap-2 rounded-full border px-3 py-1 text-xs sm:min-h-0 font-semibold transition-colors",
      on ? "border-transparent bg-goyn-violeta text-white" : "bg-card text-foreground hover:bg-muted",
    );

  const typesLabel = types.length ? types.map((t) => relLabel(t).toLowerCase()).join(", ") : "ninguno";
  const ariaLabel =
    `Red de relaciones entre ${n} organizaciones (tipos: ${typesLabel}). ${nf.format(E)} conexiones; ` +
    (top.length ? `las más conectadas: ${top.map((t) => `${t.name} (${t.d})`).join(", ")}.` : "sin conexiones con los tipos seleccionados.");

  const MAX_LIST = 8;

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
                      {/* Muestra del trazo sobre fondo claro: el chip activo es violeta y taparía el color. */}
                      <svg width="30" height="12" viewBox="-4 -2 30 12" aria-hidden className="shrink-0 rounded-full bg-white">
                        <line x1="1" y1="4" x2="21" y2="4" stroke={t.color} strokeWidth={t.width} strokeDasharray={t.dash} strokeLinecap={t.code === "colaborador" ? "round" : "butt"} />
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
              onPointerDown={() => setPinned(null)}
              onPointerEnter={(ev) => {
                if (ev.pointerType === "mouse") insideRef.current = true;
              }}
              onPointerLeave={(ev) => {
                if (ev.pointerType !== "mouse") return;
                insideRef.current = false;
                if (!drag.current) setHover(null);
                kickRef.current();
              }}
            >
              <g fill="none" strokeLinecap="round">
                {edges.map((e) => {
                  const spec = REL_TYPES[REL_RANK[e.type]];
                  const lit = activeIdx >= 0 && (e.s === activeIdx || e.t === activeIdx);
                  const dim = activeIdx >= 0 && !lit;
                  return (
                    <line
                      key={`${e.s}-${e.t}`}
                      data-s={e.s}
                      data-t={e.t}
                      stroke={spec.color}
                      strokeWidth={spec.width}
                      strokeDasharray={spec.dash}
                      strokeLinecap={spec.code === "colaborador" ? "round" : "butt"}
                      className="transition-[stroke-opacity]"
                      strokeOpacity={lit ? 0.95 : dim ? 0.08 : 0.5}
                    />
                  );
                })}
              </g>
              <g>
                {orgs.map((o, i) => {
                  const isActive = i === activeIdx;
                  const dim = activeIdx >= 0 && !isActive && !neighbors.has(i);
                  return (
                    <g
                      key={o.slug}
                      data-node
                      onPointerEnter={(ev) => {
                        if (ev.pointerType === "mouse" && !drag.current) setHover(o.slug);
                      }}
                      onPointerLeave={(ev) => {
                        if (ev.pointerType === "mouse" && !drag.current) setHover((cur) => (cur === o.slug ? null : cur));
                      }}
                      onPointerDown={onNodeDown(o.slug, i)}
                      className="cursor-pointer touch-none active:cursor-grabbing"
                      opacity={dim ? 0.25 : 1}
                    >
                      <circle data-i={i} fill={colorOf(o)} className="stroke-card" strokeWidth={isActive ? 2.5 : 1.5} />
                    </g>
                  );
                })}
              </g>
              {activeIdx >= 0 && (
                <text data-label className="pointer-events-none fill-foreground stroke-card text-[12px] font-bold" strokeWidth={3} paintOrder="stroke">
                  {orgs[activeIdx].name} · {degree[activeIdx]} {degree[activeIdx] === 1 ? "conexión" : "conexiones"}
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

        {/* Pin 10: lectura de la red (general o de la organización activa) */}
        <aside className="space-y-4 rounded-2xl border bg-card p-4 text-sm leading-relaxed text-muted-foreground shadow-sm sm:p-6" aria-live="polite">
          {detail ? (
            <>
              <div className="flex items-start gap-3">
                <span className="mt-1.5 size-3.5 shrink-0 rounded-full" style={{ backgroundColor: colorOf(detail.org) }} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold tracking-wide uppercase">{pinned ? "Organización seleccionada" : "Organización"}</p>
                  <h3 className="text-lg leading-snug font-bold text-foreground">{detail.org.name}</h3>
                </div>
                {pinned && (
                  <button
                    type="button"
                    onClick={() => setPinned(null)}
                    aria-label="Cerrar y volver a la lectura general de la red"
                    className="rounded-full p-1.5 text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-goyn-violeta"
                  >
                    <XIcon className="size-4" aria-hidden />
                  </button>
                )}
              </div>
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1">
                <dt className="font-semibold">Rol</dt>
                <dd className="text-foreground">{detail.role || "—"}</dd>
                <dt className="font-semibold">Tipo</dt>
                <dd className="text-foreground">{detail.type || "—"}</dd>
                <dt className="font-semibold">{detail.zones.length === 1 ? "Zona" : "Zonas"}</dt>
                <dd className="text-foreground">{detail.zones.length ? detail.zones.join(", ") : "—"}</dd>
              </dl>
              <div className="grid grid-cols-3 gap-2">
                {REL_TYPES.map((t) => (
                  <div key={t.code} className={cn("rounded-xl border bg-muted/40 p-2.5", !types.includes(t.code) && "opacity-50")}>
                    <p className="font-heading text-xl leading-none font-bold text-foreground">{detail.byType[t.code]}</p>
                    <p className="mt-1 text-xs">{relLabel(t.code)}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-bold tracking-wide uppercase">
                  Se conecta con {detail.list.length} {detail.list.length === 1 ? "organización" : "organizaciones"}
                </p>
                {detail.list.length ? (
                  <ul className="list-disc space-y-0.5 pl-4 text-foreground">
                    {detail.list.slice(0, MAX_LIST).map((o) => (
                      <li key={o.slug}>{o.name}</li>
                    ))}
                    {detail.list.length > MAX_LIST && <li className="list-none text-muted-foreground">y {detail.list.length - MAX_LIST} más</li>}
                  </ul>
                ) : (
                  <p>Sin conexiones con los tipos de relación seleccionados.</p>
                )}
              </div>
              <Link
                href={`/actores/${detail.org.slug}`}
                className="inline-flex items-center gap-1.5 font-semibold text-goyn-violeta underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-goyn-violeta"
              >
                Ver ficha de la organización <ArrowRightIcon className="size-3.5" aria-hidden />
              </Link>
              {!pinned && <p className="text-xs">Haz clic (o toca) para fijar esta organización.</p>}
            </>
          ) : (
            <>
              <h3 className="text-lg font-bold text-foreground">Lectura de la red</h3>
              <p>
                Cada círculo es una organización y su tamaño crece con el número de conexiones. Las líneas gruesas son relaciones de socio, las medias de aliado y las
                punteadas de colaborador. Al pasar el cursor por una organización se resaltan sus vínculos y aquí aparece su resumen; con un clic queda fija. Los
                círculos se pueden arrastrar.
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
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
