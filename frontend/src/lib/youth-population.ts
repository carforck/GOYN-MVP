// Jóvenes de 14 a 28 años (Ley 1622 de 2013) por municipio, año 2026.
// Suma de edades simples del archivo del DANE; las localidades de Barranquilla no tienen dato
// oficial (el DANE no publica población por localidad para el Distrito).
export const YOUTH_SOURCE =
  "DANE, Proyecciones de población municipal por área, sexo y edad 2018–2042 (base CNPV 2018, actualización ago-2025). Jóvenes de 14 a 28 años (Ley 1622 de 2013), año 2026. Cálculo propio a partir de edades simples.";

export const YOUTH_YEAR = 2026;

type Municipality = { name: string; youth: number; population: number };

export const YOUTH_BY_MUNICIPALITY: Record<string, Municipality> = {
  barranquilla: { name: "Barranquilla", youth: 300428, population: 1275854 },
  amb_soledad: { name: "Soledad", youth: 187564, population: 733597 },
  amb_malambo: { name: "Malambo", youth: 39614, population: 153223 },
  amb_puerto_colombia: { name: "Puerto Colombia", youth: 15154, population: 65686 },
  amb_galapa: { name: "Galapa", youth: 17493, population: 70042 },
};

export const YOUTH_TOTAL = Object.values(YOUTH_BY_MUNICIPALITY).reduce((s, m) => s + m.youth, 0);
export const POPULATION_TOTAL = Object.values(YOUTH_BY_MUNICIPALITY).reduce((s, m) => s + m.population, 0);

export type ZoneYouth =
  | { kind: "municipio"; name: string; youth: number; share: number }
  | { kind: "localidad"; name: string; district: Municipality }
  | null;

// Dato de jóvenes para una zona del catálogo (códigos baq_* son localidades, amb_* municipios).
export function youthForZone(code: string): ZoneYouth {
  if (code.startsWith("baq_")) return { kind: "localidad", name: code, district: YOUTH_BY_MUNICIPALITY.barranquilla };
  const m = YOUTH_BY_MUNICIPALITY[code];
  return m ? { kind: "municipio", name: m.name, youth: m.youth, share: m.youth / m.population } : null;
}
