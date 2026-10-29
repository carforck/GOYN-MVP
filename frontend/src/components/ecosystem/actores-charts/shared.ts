// Tipos y utilidades compartidas por los gráficos de "Los actores" (/mapa, ajuste 15).

// Versión liviana de la organización que se envía al cliente.
export type ChartOrg = {
  slug: string;
  name: string;
  org_type_code: string;
  primary_role_code: string;
  territory_codes: string[];
  area_codes: string[];
  problem_codes: string[];
};

export const nf = new Intl.NumberFormat("es-CO");

export const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);

// Colores para tipos de organización (tokens de marca GOYN; navy y violeta oscuro completan la serie).
export const ORG_TYPE_COLORS: Record<string, string> = {
  privado_fundacion: "#9B00FF",
  privado_empresa: "#00A0CC",
  privado_gremio: "#1600CC",
  publico_local: "#FE5200",
  publico_nacional: "#E20613",
  educativa: "#FFBD25",
  bolsa_empleo: "#060A28",
  colectivo_juvenil: "#FF01A2",
  comunitaria: "#0AA066",
};

// ─── Circle packing ──────────────────────────────────────────────────────────
// Empaquetado voraz: los círculos (de mayor a menor) se ubican tangentes a pares de círculos ya
// colocados, eligiendo la posición libre más cercana al centro. Para ≤ 15 categorías es inmediato.
export type Packed = { x: number; y: number; r: number };

export function packCircles(radii: number[], gap = 4): Packed[] {
  const order = radii.map((r, i) => ({ r, i })).sort((a, b) => b.r - a.r);
  const placed: (Packed & { i: number })[] = [];
  const free = (x: number, y: number, r: number) => placed.every((p) => Math.hypot(p.x - x, p.y - y) >= p.r + r + gap - 1e-6);

  for (const { r, i } of order) {
    if (!placed.length) {
      placed.push({ x: 0, y: 0, r, i });
      continue;
    }
    if (placed.length === 1) {
      const p = placed[0];
      placed.push({ x: p.x + p.r + r + gap, y: 0, r, i });
      continue;
    }
    let best: { x: number; y: number; d: number } | null = null;
    for (let a = 0; a < placed.length; a++) {
      for (let b = a + 1; b < placed.length; b++) {
        for (const c of tangent(placed[a], placed[b], r + gap)) {
          if (!free(c.x, c.y, r)) continue;
          const d = Math.hypot(c.x, c.y);
          if (!best || d < best.d) best = { ...c, d };
        }
      }
    }
    if (!best) {
      // Respaldo: a la derecha de todo lo colocado.
      const maxX = Math.max(...placed.map((p) => p.x + p.r));
      best = { x: maxX + r + gap, y: 0, d: 0 };
    }
    placed.push({ x: best.x, y: best.y, r, i });
  }

  // Centra el conjunto en (0, 0).
  const minX = Math.min(...placed.map((p) => p.x - p.r));
  const maxX = Math.max(...placed.map((p) => p.x + p.r));
  const minY = Math.min(...placed.map((p) => p.y - p.r));
  const maxY = Math.max(...placed.map((p) => p.y + p.r));
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const out: Packed[] = new Array(radii.length);
  for (const p of placed) out[p.i] = { x: p.x - cx, y: p.y - cy, r: p.r };
  return out;
}

// Posiciones del centro de un círculo de radio r tangente (con separación) a los círculos A y B.
function tangent(A: Packed, B: Packed, r: number) {
  const ra = A.r + r;
  const rb = B.r + r;
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const d = Math.hypot(dx, dy);
  if (d === 0 || d > ra + rb || d < Math.abs(ra - rb)) return [];
  const a = (ra * ra - rb * rb + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, ra * ra - a * a));
  const mx = A.x + (a * dx) / d;
  const my = A.y + (a * dy) / d;
  return [
    { x: mx + (h * dy) / d, y: my - (h * dx) / d },
    { x: mx - (h * dy) / d, y: my + (h * dx) / d },
  ];
}
