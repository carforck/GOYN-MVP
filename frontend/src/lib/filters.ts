import type { EcosystemFilters, PublicOrganization } from "@/lib/types";

// Filtro de proyectos (ajuste 14): /mapa?parea=educacion&ppoblacion=jovenes&proyecto=empleo
export const PROGRAM_FILTER_KEYS = ["parea", "ppoblacion"] as const;
export type ProgramFilterKey = (typeof PROGRAM_FILTER_KEYS)[number];

// Claves de URL (en español, compartibles): /mapa?tipo=colectivo_juvenil&territorio=amb_soledad
export const FILTER_KEYS = ["tipo", "rol", "area", "poblacion", "territorio"] as const;
export const SORTS = [
  { value: "nombre", label: "Nombre (A–Z)" },
  { value: "reciente", label: "Actualización más reciente" },
  { value: "programas", label: "Más programas" },
  { value: "conexiones", label: "Más conexiones" },
] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];

type RawParams = Record<string, string | string[] | undefined>;

export function parseFilters(params: RawParams): EcosystemFilters {
  const list = (key: string) => {
    const raw = params[key];
    const values = (Array.isArray(raw) ? raw : raw ? [raw] : []).flatMap((v) => v.split(",")).filter(Boolean);
    return values.length ? values : undefined;
  };
  const q = typeof params.q === "string" && params.q.trim() ? params.q.trim() : undefined;
  const orden = SORTS.find((s) => s.value === params.orden)?.value;
  const proyecto = typeof params.proyecto === "string" && params.proyecto.trim() ? params.proyecto.trim() : undefined;
  return { q, tipo: list("tipo"), rol: list("rol"), area: list("area"), poblacion: list("poblacion"), territorio: list("territorio"), org: list("org"), orden, parea: list("parea"), ppoblacion: list("ppoblacion"), proyecto };
}

export function filtersToQuery(filters: EcosystemFilters) {
  const sp = new URLSearchParams();
  if (filters.q) sp.set("q", filters.q);
  if (filters.orden && filters.orden !== "nombre") sp.set("orden", filters.orden);
  for (const key of FILTER_KEYS) {
    const values = filters[key];
    if (values?.length) sp.set(key, values.join(","));
  }
  if (filters.org?.length) sp.set("org", filters.org.join(","));
  for (const key of PROGRAM_FILTER_KEYS) {
    const values = filters[key];
    if (values?.length) sp.set(key, values.join(","));
  }
  if (filters.proyecto) sp.set("proyecto", filters.proyecto);
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function countActive(filters: EcosystemFilters) {
  return FILTER_KEYS.reduce((n, k) => n + (filters[k]?.length ?? 0), (filters.q ? 1 : 0) + (filters.org?.length ?? 0) + countProgramFilters(filters));
}

export function countProgramFilters(f: EcosystemFilters) {
  return (f.parea?.length ?? 0) + (f.ppoblacion?.length ?? 0) + (f.proyecto ? 1 : 0);
}

type ProgramLike = { org_slug: string; name: string; primary_area_code: string; population_codes: string[] };

// ¿El programa cumple el filtro de proyectos? OR dentro de cada filtro, AND entre filtros.
export function matchesProgram(p: ProgramLike, f: EcosystemFilters) {
  if (f.proyecto && !normalize(p.name).includes(normalize(f.proyecto))) return false;
  return overlaps([p.primary_area_code], f.parea) && overlaps(p.population_codes, f.ppoblacion);
}

// Deja solo las organizaciones con algún programa publicado que cumpla el filtro de proyectos.
// Sin filtro de proyectos devuelve la lista tal cual.
export function filterByPrograms<T extends { slug: string }>(orgs: T[], programs: ProgramLike[], f: EcosystemFilters) {
  if (!countProgramFilters(f)) return orgs;
  const keep = new Set(programs.filter((p) => matchesProgram(p, f)).map((p) => p.org_slug));
  return orgs.filter((o) => keep.has(o.slug));
}

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const overlaps = (have: string[], want?: string[]) => !want?.length || want.some((w) => have.includes(w));

// Micro-ecosistema (reunión 08-oct): las organizaciones elegidas y las que se conectan
// directamente con ellas. Se aplica después de los demás filtros.
export function microEcosystem<T extends { slug: string }>(orgs: T[], relations: { source_slug: string; target_slug: string }[], chosen?: string[]) {
  if (!chosen?.length) return orgs;
  const keep = new Set(chosen);
  for (const r of relations) {
    if (chosen.includes(r.source_slug)) keep.add(r.target_slug);
    if (chosen.includes(r.target_slug)) keep.add(r.source_slug);
  }
  return orgs.filter((o) => keep.has(o.slug));
}

// Misma semántica que la consulta a Supabase: OR dentro de un filtro, AND entre filtros.
export function matchesFilters(org: PublicOrganization, f: EcosystemFilters) {
  if (f.q) {
    const q = normalize(f.q);
    if (!normalize(`${org.name} ${org.description}`).includes(q)) return false;
  }
  return (
    overlaps([org.org_type_code], f.tipo) &&
    overlaps(org.role_codes, f.rol) &&
    overlaps(org.area_codes, f.area) &&
    overlaps(org.population_codes, f.poblacion) &&
    overlaps(org.territory_codes, f.territorio)
  );
}

// Ordenamiento del directorio (FR-005).
export function sortOrganizations(orgs: PublicOrganization[], orden: EcosystemFilters["orden"] = "nombre") {
  const list = [...orgs];
  if (orden === "reciente") return list.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  if (orden === "programas") return list.sort((a, b) => b.programs_count - a.programs_count || a.name.localeCompare(b.name, "es"));
  if (orden === "conexiones") return list.sort((a, b) => b.connections_count - a.connections_count || a.name.localeCompare(b.name, "es"));
  return list.sort((a, b) => a.name.localeCompare(b.name, "es"));
}
