// Constantes compartidas por el mapa y su panel (archivo aparte para evitar importaciones circulares).

export const relationColors: Record<"socio" | "aliado" | "colaborador", string> = { socio: "#DB0089", aliado: "#7A00CC", colaborador: "#0089B0" };

// Conexiones: el tipo se distingue por el trazo, no solo por el color (accesible para daltonismo).
// Socios = sólida y gruesa · Aliados = guiones largos · Colaboradores = punteada. Reunión 08-oct.
export const ARC_STYLES: [type: "socio" | "aliado" | "colaborador", dash: number[] | null, width: number][] = [
  ["socio", null, 3],
  ["aliado", [4, 2], 2.2],
  ["colaborador", [0, 2], 2.4],
];
