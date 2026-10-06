import type { LayerSpecification, StyleSpecification } from "maplibre-gl";

// Mapa base CLARO y mínimo (ajustes 06-oct: "ir de menos a más"): sin calles, edificios ni
// puntos de interés; solo agua, límites y nombres de lugares, para que resalten las localidades
// y las capas de datos. Respaldo en cadena para que el mapa funcione SIEMPRE:
//   1. OpenFreeMap "positron" (OSM, sin llave)  → principal
//   2. CARTO "positron"                          → respaldo si OpenFreeMap no responde
//   3. Estilo local (solo fondo de marca)  → último recurso: sin calles, pero organizaciones,
//      clústeres, arcos y territorios siguen funcionando porque son capas propias.
// En los respaldos, las tipografías de las etiquetas se sirven desde /fonts (no dependen de terceros).

export type BasemapProvider = "openfreemap" | "carto" | "local";

const PROVIDERS: { id: Exclude<BasemapProvider, "local">; url: string }[] = [
  { id: "openfreemap", url: "https://tiles.openfreemap.org/styles/positron" },
  { id: "carto", url: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json" },
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

// Capas que se omiten: el mapa arranca limpio y los datos se suman como capas propias.
const HIDDEN = /^(building|highway|road|tunnel|bridge|rail|aeroway|airport|poi|housenumber|roadname|transportation)/;

export const BASEMAP_BG = "#F6F3FD";

// Tiñe el estilo claro con la paleta GOYN (lila suave + morado).
function brand(style: StyleSpecification, provider: BasemapProvider): StyleSpecification {
  const layers = style.layers
    .filter((layer) => !HIDDEN.test(layer.id))
    .map((layer) => {
      const l = structuredClone(layer) as LayerSpecification & { paint?: Record<string, unknown>; layout?: Record<string, unknown> };
      const id = l.id;
      const paint = (l.paint ??= {});
      if (l.type === "symbol") {
        const place = id.startsWith("place") || id.startsWith("label");
        paint["text-color"] = place ? "#3B2A6B" : "#7A73A0";
        paint["text-halo-color"] = "#FFFFFF";
        paint["text-halo-width"] = 1.2;
        if (l.layout?.["text-font"]) l.layout["text-font"] = localFont(l.layout["text-font"]);
      } else if (l.type === "background") paint["background-color"] = BASEMAP_BG;
      else if (id.startsWith("water")) {
        if (l.type === "fill") paint["fill-color"] = "#DCD3F5";
        if (l.type === "line") paint["line-color"] = "#DCD3F5";
      } else if (l.type === "fill") paint["fill-color"] = "#EEE9FA";
      else if (l.type === "line" && id.includes("boundary")) {
        paint["line-color"] = "#B39DEB";
        paint["line-opacity"] = 0.8;
      }
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
    layers: [{ id: "background", type: "background", paint: { "background-color": BASEMAP_BG } }],
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
