import type { EcosystemFilters, PublicOrganization } from "@/lib/types";

// Claves de URL (en español, compartibles): /mapa?tipo=colectivo_juvenil&territorio=amb_soledad
export const FILTER_KEYS = ["tipo", "rol", "area", "poblacion", "territorio"] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];

type RawParams = Record<string, string | string[] | undefined>;

export function parseFilters(params: RawParams): EcosystemFilters {
  const list = (key: string) => {
    const raw = params[key];
    const values = (Array.isArray(raw) ? raw : raw ? [raw] : []).flatMap((v) => v.split(",")).filter(Boolean);
    return values.length ? values : undefined;
  };
  const q = typeof params.q === "string" && params.q.trim() ? params.q.trim() : undefined;
  return { q, tipo: list("tipo"), rol: list("rol"), area: list("area"), poblacion: list("poblacion"), territorio: list("territorio") };
}

export function filtersToQuery(filters: EcosystemFilters) {
  const sp = new URLSearchParams();
  if (filters.q) sp.set("q", filters.q);
  for (const key of FILTER_KEYS) {
    const values = filters[key];
    if (values?.length) sp.set(key, values.join(","));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function countActive(filters: EcosystemFilters) {
  return FILTER_KEYS.reduce((n, k) => n + (filters[k]?.length ?? 0), filters.q ? 1 : 0);
}

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const overlaps = (have: string[], want?: string[]) => !want?.length || want.some((w) => have.includes(w));

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
