// Paleta única de GOYN Conecta BAQ (pendiente #10 del cliente): un mismo dato se ve con el mismo
// color en todo el ecosistema — mapa, círculos, red, radar, árbol, leyendas, Impacto, panel y home.
// Todos los componentes deben pedir aquí el color de una categoría en lugar de escribir hex sueltos.
//
// Base: Manual de identidad 2024. Principales violeta #9B00FF, magenta #FF01A2, navy #060A28;
// complementarios naranja #FE5200, amarillo #FFBD25, cian #00A0CC, verde #0AA066.
// Criterio de contraste: los colores de marca (puntos, barras, líneas) deben verse sobre fondo claro
// (#FFFFFF) y oscuro (card #0D1238) con ≥ 3:1 cuando es posible; para texto blanco encima se usa
// `solid` o `solidSwatch()` (≥ 4.5:1). Las excepciones se documentan junto al color.

import catalogsJson from "@/lib/demo/catalogs.json";

const raw = catalogsJson as { roles: { code: string; color?: string | null }[] };

export const BRAND = {
  violeta: "#9B00FF",
  violetaOscuro: "#7A00CC",
  magenta: "#FF01A2",
  magentaA11y: "#DB0089",
  navy: "#060A28",
  naranja: "#FE5200",
  amarillo: "#FFBD25",
  cian: "#00A0CC",
  verde: "#0AA066",
} as const;

const FALLBACK = BRAND.violeta;

// ─── Roles ───────────────────────────────────────────────────────────────────
// Salen del disco de cada ícono de marca (public/images/roles/rol-NN.webp), así el punto/círculo de
// un rol coincide con su ícono. Fuente: catálogo (backend/scripts/catalogs.mjs). Financiador (#634494)
// queda por debajo de 3:1 en modo oscuro: se conserva por identidad con su ícono y siempre se dibuja
// con borde blanco/card.
export const ROLE_COLORS: Record<string, string> = Object.fromEntries(raw.roles.map((r) => [r.code, r.color ?? FALLBACK]));
export const colorRol = (code: string | null | undefined) => (code && ROLE_COLORS[code]) || FALLBACK;

// ─── Tipos de organización (actor) y hélices ─────────────────────────────────
// Cada hélice tiene un tono de marca y sus tipos lo comparten o son vecinos, para que "tipo" y
// "hélice" se lean igual en círculos, red y matriz de colaboración.
export const ORG_TYPE_COLORS: Record<string, string> = {
  // Público → naranja / rojo
  publico_local: BRAND.naranja,
  publico_nacional: "#E20613",
  // Privado → cian / azules / violeta
  privado_empresa: BRAND.cian,
  privado_gremio: "#4D4DFF", // antes #1600CC: invisible en modo oscuro (1.6:1)
  privado_fundacion: BRAND.violeta,
  bolsa_empleo: "#8A86FF", // antes navy #060A28: invisible en modo oscuro (1.1:1)
  // Academia → amarillo
  educativa: BRAND.amarillo,
  // Juventudes → magenta
  colectivo_juvenil: BRAND.magenta,
  // Sociedad civil → verde
  comunitaria: BRAND.verde,
};
export const colorTipoOrg = (code: string | null | undefined) => (code && ORG_TYPE_COLORS[code]) || FALLBACK;

export const HELIX_COLORS = {
  publico: BRAND.naranja,
  privado: BRAND.cian,
  academia: BRAND.amarillo,
  sociedad: BRAND.verde,
  juventudes: BRAND.magenta,
} as const;
export const colorHelice = (code: string) => HELIX_COLORS[code as keyof typeof HELIX_COLORS] ?? FALLBACK;

// ─── Áreas de impacto ────────────────────────────────────────────────────────
// Mismo color en radar, árbol de retos, mapa (color por área), tarjetas y ficha del actor.
export const AREA_COLORS: Record<string, string> = {
  educacion: BRAND.amarillo,
  ingresos: BRAND.cian,
  participacion: BRAND.magenta,
  orientacion: BRAND.verde,
  entornos: BRAND.violeta,
  bienestar: BRAND.naranja,
  inclusion_digital: "#4D4DFF", // antes #1600CC (catálogo): invisible en modo oscuro
};
export const colorArea = (code: string | null | undefined) => (code && AREA_COLORS[code]) || FALLBACK;

// ─── Territorios / localidades ───────────────────────────────────────────────
// Tonos de violeta (relleno de localidades en el mapa). Son de fondo con opacidad, no de texto.
export const ZONE_COLORS: Record<string, string> = {
  baq_riomar: "#B98CFF",
  baq_norte_centro: "#7A00CC",
  baq_suroccidente: "#D4B8FF",
  baq_suroriente: "#9B4DFF",
  baq_metropolitana: "#5C1AA8",
  amb_puerto_colombia: "#8E5CE6",
  amb_soledad: "#C59CFF",
  amb_galapa: "#6E33C9",
  amb_malambo: "#A877F0",
  cobertura_general: BRAND.violeta,
};
export const colorZona = (code: string | null | undefined) => (code && ZONE_COLORS[code]) || FALLBACK;

// ─── Tipos de conexión ───────────────────────────────────────────────────────
// Color + trazo (accesible para daltonismo). Igual en el mapa, su leyenda y la red de actores.
// Socio = sólida y gruesa · Aliado = guiones largos · Colaborador = punteada (reunión 08-oct).
export type ConnectionType = "socio" | "aliado" | "colaborador";
export const CONNECTION_STYLES: Record<ConnectionType, { color: string; width: number; dash: number[] | null; cap: "round" | "butt" }> = {
  socio: { color: BRAND.magentaA11y, width: 3, dash: null, cap: "butt" },
  aliado: { color: BRAND.violeta, width: 2.2, dash: [4, 2], cap: "butt" }, // antes #7A00CC (2.3:1 en oscuro)
  colaborador: { color: "#0089B0", width: 2.4, dash: [0, 2], cap: "round" },
};
export const CONNECTION_TYPES = Object.keys(CONNECTION_STYLES) as ConnectionType[];
export const colorConexion = (type: string) => CONNECTION_STYLES[type as ConnectionType]?.color ?? FALLBACK;
// Patrón de guiones para SVG (las unidades de MapLibre son múltiplos del ancho de línea).
export const svgDash = (type: ConnectionType, width = CONNECTION_STYLES[type].width) => {
  const d = CONNECTION_STYLES[type].dash;
  if (!d) return undefined;
  return d.map((v) => (v === 0 ? 0.1 : v * width)).join(" ");
};

// ─── Indicadores y cifras ────────────────────────────────────────────────────
// base = barras/líneas/puntos · solid = relleno con texto blanco (AA) y parte "mujeres" de una barra
// · onDark = texto del indicador sobre fondos navy (popups del mapa, paneles oscuros).
export type IndicatorKey = "conectados" | "fortalecidos" | "transformados";
export type FigureKey = IndicatorKey | "organizaciones" | "programas" | "conexiones";
export const INDICATOR_COLORS: Record<FigureKey, { base: string; solid: string; onDark: string }> = {
  conectados: { base: BRAND.violeta, solid: BRAND.violetaOscuro, onDark: "#D9B3FF" },
  fortalecidos: { base: BRAND.cian, solid: "#00708F", onDark: "#7FD6EE" },
  transformados: { base: BRAND.magenta, solid: BRAND.magentaA11y, onDark: "#FF8FCF" },
  // Navy: en modo oscuro se usa `onDark` (el navy desaparece sobre fondo navy).
  organizaciones: { base: BRAND.navy, solid: BRAND.navy, onDark: "#B8B5E0" },
  programas: { base: BRAND.verde, solid: "#07804F", onDark: "#7FE0B8" },
  conexiones: { base: BRAND.naranja, solid: "#C94000", onDark: "#FFB08A" },
};
// "mujeres" no tiene un color propio: es el tono `solid` del indicador al que pertenece
// (barra clara = total, barra intensa = mujeres). Sin indicador, magenta accesible.
export function colorIndicador(key: FigureKey | "mujeres", variant: "base" | "solid" | "onDark" = "base", of?: IndicatorKey) {
  if (key === "mujeres") return of ? INDICATOR_COLORS[of].solid : BRAND.magentaA11y;
  return INDICATOR_COLORS[key][variant];
}

// ─── Contraste (WCAG 2.x) ────────────────────────────────────────────────────
const hexRgb = (hex: string) => {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.replace(/./g, "$&$&") : h.slice(0, 6);
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16));
};
const toHex = (rgb: number[]) => `#${rgb.map((c) => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, "0")).join("")}`;

export function luminance(hex: string) {
  const [r, g, b] = hexRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// Relleno sólido + color de contenido con contraste AA (≥ 4.5:1). Si el color con blanco no llega,
// se oscurece el relleno; si habría que oscurecerlo demasiado (amarillos, verdes claros), se conserva
// el color y el contenido pasa a navy.
export function solidSwatch(color: string): { fill: string; ink: string } {
  if (contrast(color, "#ffffff") >= 4.5) return { fill: color, ink: "#ffffff" };
  const rgb = hexRgb(color);
  for (let k = 0.04; k <= 0.3 + 1e-9; k += 0.02) {
    const fill = toHex(rgb.map((c) => c * (1 - k)));
    if (contrast(fill, "#ffffff") >= 4.5) return { fill, ink: "#ffffff" };
  }
  return { fill: color, ink: BRAND.navy };
}

// ─── Eventos en vivo (ticker, notificaciones y ondas del mapa) ────────────────
// registro = organización nueva · conexion = color de "conexiones" · reporte = color del indicador.
export const EVENT_COLORS = { registro: BRAND.magentaA11y, conexion: INDICATOR_COLORS.conexiones.base, reporte: INDICATOR_COLORS.conectados.base } as const;
export const colorEvento = (kind: string, indicator?: IndicatorKey) =>
  kind === "reporte" && indicator ? INDICATOR_COLORS[indicator].base : (EVENT_COLORS[kind as keyof typeof EVENT_COLORS] ?? BRAND.violeta);
