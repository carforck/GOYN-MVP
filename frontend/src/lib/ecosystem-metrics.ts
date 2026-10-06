import { catalogs, shortTerritory } from "@/lib/catalogs";
import type { PublicOrganization, PublicRelation } from "@/lib/types";

// Métricas de red del ecosistema para la sección "Lo que el mapa no muestra" (/mapa).
// Metodología: análisis de redes sociales (centralidad de grado e intermediación, índice E-I
// de Krackhardt) y mapa de cobertura de servicios. Todo se calcula sobre las organizaciones
// y conexiones visibles con los filtros actuales.

// Hélices: agrupación de los 9 tipos de organización en los sectores del ecosistema.
// Colores validados para daltonismo en este orden (skill dataviz, validate_palette.js).
export const HELICES = [
  { code: "publico", label: "Público", short: "Púb.", color: "#9B00FF", types: ["publico_local", "publico_nacional"] },
  { code: "privado", label: "Privado", short: "Priv.", color: "#0AA066", types: ["privado_empresa", "privado_gremio", "privado_fundacion", "bolsa_empleo"] },
  { code: "academia", label: "Academia", short: "Acad.", color: "#FE5200", types: ["educativa"] },
  { code: "sociedad", label: "Sociedad civil", short: "Soc. civil", color: "#0089B0", types: ["comunitaria"] },
  { code: "juventudes", label: "Juventudes", short: "Juv.", color: "#DB0089", types: ["colectivo_juvenil"] },
] as const;
export type HeliceCode = (typeof HELICES)[number]["code"];

export const heliceOf = (orgType: string): HeliceCode => HELICES.find((h) => (h.types as readonly string[]).includes(orgType))?.code ?? "sociedad";

export type CoverageCell = { territory: string; area: string; count: number; orgs: string[] };
export type ActorPoint = { slug: string; name: string; helice: HeliceCode; degree: number; betweenness: number };
export type EcosystemMetrics = {
  coverage: { territories: { code: string; label: string }[]; areas: { code: string; label: string }[]; cells: CoverageCell[] };
  matrix: { counts: number[][]; total: number };
  ei: { helice: HeliceCode; label: string; internal: number; external: number; index: number | null; orgs: number }[];
  actors: ActorPoint[];
  medians: { degree: number; betweenness: number };
};

const median = (values: number[]) => {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// Intermediación (Brandes, grafo no dirigido sin pesos), normalizada a 0–1.
function betweenness(nodes: string[], adj: Map<string, Set<string>>) {
  const cb = new Map(nodes.map((n) => [n, 0]));
  for (const s of nodes) {
    const stack: string[] = [];
    const pred = new Map<string, string[]>(nodes.map((n) => [n, []]));
    const sigma = new Map(nodes.map((n) => [n, 0]));
    const dist = new Map(nodes.map((n) => [n, -1]));
    sigma.set(s, 1);
    dist.set(s, 0);
    const queue = [s];
    while (queue.length) {
      const v = queue.shift()!;
      stack.push(v);
      for (const w of adj.get(v) ?? []) {
        if (dist.get(w)! < 0) {
          dist.set(w, dist.get(v)! + 1);
          queue.push(w);
        }
        if (dist.get(w) === dist.get(v)! + 1) {
          sigma.set(w, sigma.get(w)! + sigma.get(v)!);
          pred.get(w)!.push(v);
        }
      }
    }
    const delta = new Map(nodes.map((n) => [n, 0]));
    while (stack.length) {
      const w = stack.pop()!;
      for (const v of pred.get(w)!) delta.set(v, delta.get(v)! + (sigma.get(v)! / sigma.get(w)!) * (1 + delta.get(w)!));
      if (w !== s) cb.set(w, cb.get(w)! + delta.get(w)!);
    }
  }
  const n = nodes.length;
  // No dirigido: cada par se cuenta dos veces; se normaliza por (n-1)(n-2).
  const norm = n > 2 ? (n - 1) * (n - 2) : 1;
  return new Map([...cb].map(([k, v]) => [k, v / norm]));
}

export function computeEcosystemMetrics(orgs: PublicOrganization[], relations: PublicRelation[]): EcosystemMetrics {
  const bySlug = new Map(orgs.map((o) => [o.slug, o]));
  const links = relations.filter((r) => bySlug.has(r.source_slug) && bySlug.has(r.target_slug) && r.source_slug !== r.target_slug);

  // Cobertura: cuántas organizaciones atienden cada área en cada territorio.
  const territories = catalogs.territories.filter((t) => t.code !== "cobertura_general").map((t) => ({ code: t.code, label: shortTerritory(t.code) }));
  const areas = catalogs.impactAreas.map((a) => ({ code: a.code, label: a.label }));
  const cells: CoverageCell[] = [];
  for (const t of territories)
    for (const a of areas) {
      const hits = orgs.filter((o) => o.territory_codes.includes(t.code) && o.area_codes.includes(a.code));
      cells.push({ territory: t.code, area: a.code, count: hits.length, orgs: hits.map((o) => o.name) });
    }

  // Grafo no dirigido (una arista por par, aunque haya varias relaciones).
  const adj = new Map<string, Set<string>>(orgs.map((o) => [o.slug, new Set()]));
  for (const r of links) {
    adj.get(r.source_slug)!.add(r.target_slug);
    adj.get(r.target_slug)!.add(r.source_slug);
  }

  // Matriz hélice × hélice (simétrica) e índice E-I por hélice.
  const idx = new Map(HELICES.map((h, i) => [h.code, i]));
  const counts = HELICES.map(() => HELICES.map(() => 0));
  const seen = new Set<string>();
  for (const [a, partners] of adj)
    for (const b of partners) {
      const key = a < b ? `${a}|${b}` : `${b}|${a}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const i = idx.get(heliceOf(bySlug.get(a)!.org_type_code))!;
      const j = idx.get(heliceOf(bySlug.get(b)!.org_type_code))!;
      counts[i][j] += 1;
      if (i !== j) counts[j][i] += 1;
    }
  const ei = HELICES.map((h, i) => {
    const internal = counts[i][i];
    const external = counts[i].reduce((sum, v, j) => (j === i ? sum : sum + v), 0);
    const total = internal + external;
    return {
      helice: h.code,
      label: h.label,
      internal,
      external,
      index: total ? (external - internal) / total : null,
      orgs: orgs.filter((o) => heliceOf(o.org_type_code) === h.code).length,
    };
  });

  // Cuadrante de roles: grado (con cuántos se conecta) × intermediación (cuánto une a otros).
  const nodes = [...adj.keys()];
  const btw = betweenness(nodes, adj);
  const actors: ActorPoint[] = orgs.map((o) => ({
    slug: o.slug,
    name: o.name,
    helice: heliceOf(o.org_type_code),
    degree: adj.get(o.slug)!.size,
    betweenness: btw.get(o.slug) ?? 0,
  }));

  return {
    coverage: { territories, areas, cells },
    matrix: { counts, total: seen.size },
    ei,
    actors,
    medians: { degree: median(actors.map((a) => a.degree)), betweenness: median(actors.map((a) => a.betweenness)) },
  };
}
