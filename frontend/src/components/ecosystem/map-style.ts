import type { LayerSpecification, StyleSpecification } from "maplibre-gl";

// Mapa base con respaldo en cadena para que el mapa funcione SIEMPRE:
//   1. OpenFreeMap "dark" (OSM, sin llave)  → principal
//   2. CARTO "dark-matter"                 → respaldo si OpenFreeMap no responde
//   3. Estilo local (solo fondo de marca)  → último recurso: sin calles, pero organizaciones,
//      clústeres, arcos y territorios siguen funcionando porque son capas propias.
// En los respaldos, las tipografías de las etiquetas se sirven desde /fonts (no dependen de terceros).

export type BasemapProvider = "openfreemap" | "carto" | "local";

const PROVIDERS: { id: Exclude<BasemapProvider, "local">; url: string }[] = [
  { id: "openfreemap", url: "https://tiles.openfreemap.org/styles/dark" },
  { id: "carto", url: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" },
];

const TIMEOUT_MS = 5000;

const glyphsUrl = () => `${window.location.origin}/fonts/{fontstack}/{range}.pbf`;

// Todas las etiquetas usan Noto Sans alojada localmente.
function localFont(fonts: unknown): string[] {
  const name = Array.isArray(fonts) ? String(fonts[0] ?? "") : "";
  if (/italic/i.test(name)) return ["Noto Sans Italic"];
  if (/bold|semibold|medium/i.test(name)) return ["Noto Sans Bold"];
  return ["Noto Sans Regular"];
}

// Tiñe cualquier estilo oscuro con la paleta GOYN (azul noche + morado).
function brand(style: StyleSpecification, provider: BasemapProvider): StyleSpecification {
  const layers = style.layers.map((layer) => {
    const l = structuredClone(layer) as LayerSpecification & { paint?: Record<string, unknown>; layout?: Record<string, unknown> };
    const id = l.id;
    const paint = (l.paint ??= {});
    if (l.type === "symbol") {
      paint["text-color"] = id.startsWith("place") ? "#c9c3f5" : "#6f6aa8";
      paint["text-halo-color"] = "#060a28";
      if (l.layout?.["text-font"]) l.layout["text-font"] = localFont(l.layout["text-font"]);
    } else if (l.type === "background") paint["background-color"] = "#060a28";
    else if (id === "water" || id.startsWith("water")) {
      if (l.type === "fill") paint["fill-color"] = "#0b1348";
      if (l.type === "line") paint["line-color"] = "#0b1348";
    } else if (l.type === "fill" && (id.startsWith("landcover") || id.startsWith("landuse") || id.startsWith("park"))) paint["fill-color"] = "#0a0f35";
    else if (l.type === "fill" && id.startsWith("building")) {
      paint["fill-color"] = "#10164a";
      paint["fill-outline-color"] = "#1b2266";
    } else if (l.type === "line" && id.includes("boundary")) paint["line-color"] = "#4a2c9c";
    else if (l.type === "line" && (id.includes("motorway") || id.includes("major") || id.includes("pri"))) paint["line-color"] = "rgba(155,0,255,0.45)";
    else if (l.type === "line" && (id.startsWith("highway") || id.startsWith("road") || id.startsWith("railway") || id.startsWith("aeroway") || id.startsWith("tunnel") || id.startsWith("bridge")))
      paint["line-color"] = "#1a2060";
    return l;
  });
  // OpenFreeMap sirve Noto Sans completa (todos los alfabetos); en los respaldos se usa la copia local
  // (latín y signos), y MapLibre dibuja en el navegador cualquier otro carácter.
  const glyphs = provider === "openfreemap" && style.glyphs ? style.glyphs : glyphsUrl();
  return { ...style, glyphs, layers } as StyleSpecification;
}

export function localStyle(): StyleSpecification {
  return {
    version: 8,
    glyphs: glyphsUrl(),
    sources: {},
    layers: [{ id: "background", type: "background", paint: { "background-color": "#060a28" } }],
  };
}

async function fetchWithTimeout(url: string) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as StyleSpecification;
  } finally {
    clearTimeout(timer);
  }
}

export async function loadBasemap(): Promise<{ style: StyleSpecification; provider: BasemapProvider }> {
  for (const p of PROVIDERS) {
    try {
      return { style: brand(await fetchWithTimeout(p.url), p.id), provider: p.id };
    } catch {
      /* siguiente proveedor */
    }
  }
  return { style: localStyle(), provider: "local" };
}
