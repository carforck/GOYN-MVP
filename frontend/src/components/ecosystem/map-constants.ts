// Constantes compartidas por el mapa y su panel (archivo aparte para evitar importaciones circulares).

import { CONNECTION_STYLES, CONNECTION_TYPES, colorConexion } from "@/lib/palette";

// Colores y trazos de conexión: única fuente de verdad en "@/lib/palette" (pendiente #10).
export const relationColors: Record<"socio" | "aliado" | "colaborador", string> = {
  socio: colorConexion("socio"),
  aliado: colorConexion("aliado"),
  colaborador: colorConexion("colaborador"),
};

// Conexiones: el tipo se distingue por el trazo, no solo por el color (accesible para daltonismo).
// Socios = sólida y gruesa · Aliados = guiones largos · Colaboradores = punteada. Reunión 08-oct.
export const ARC_STYLES: [type: "socio" | "aliado" | "colaborador", dash: number[] | null, width: number][] = CONNECTION_TYPES.map(
  (t) => [t, CONNECTION_STYLES[t].dash, CONNECTION_STYLES[t].width],
);
