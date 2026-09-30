import catalogsJson from "@/lib/demo/catalogs.json";
import type { Catalogs, CatalogItem } from "@/lib/types";

// Los catálogos se generan desde backend/scripts/catalogs.mjs, la misma fuente que produce la
// migración de Supabase, así que son idénticos en modo demo y en modo conectado.
export const catalogs = catalogsJson as Catalogs;

const index = (list: CatalogItem[]) => new Map(list.map((item) => [item.code, item]));
const maps = {
  orgTypes: index(catalogs.orgTypes),
  roles: index(catalogs.roles),
  territories: index(catalogs.territories),
  impactAreas: index(catalogs.impactAreas),
  problems: index(catalogs.problems),
  populations: index(catalogs.populations),
  relationTypes: index(catalogs.relationTypes),
  modalities: index(catalogs.modalities),
  scopes: index(catalogs.scopes),
  indicators: index(catalogs.indicators),
  workLines: index(catalogs.workLines),
};

export type CatalogName = keyof typeof maps;

export function label(catalog: CatalogName, code: string | null | undefined) {
  if (!code) return "";
  return maps[catalog].get(code)?.label ?? code;
}

export function item(catalog: CatalogName, code: string | null | undefined) {
  return code ? maps[catalog].get(code) : undefined;
}

// "BAQ – Sur Oriente" → "Sur Oriente" para chips compactos.
export function shortTerritory(code: string) {
  return label("territories", code).replace(/^(BAQ|AMB) – /, "");
}
