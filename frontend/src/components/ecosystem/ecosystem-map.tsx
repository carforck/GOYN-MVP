"use client";

import { Loader2Icon, MapIcon, SkipForwardIcon, TriangleAlertIcon } from "lucide-react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { LiveGlobe } from "@/components/globe/live-globe";
import { useLive } from "@/components/live/live-provider";
import { LiveFeed } from "@/components/live/live-ticker";
import { MapHud } from "@/components/ecosystem/map-hud";
import { type BasemapProvider, loadBasemap } from "@/components/ecosystem/map-style";
import { catalogs } from "@/lib/catalogs";
import { cn } from "@/lib/utils";
import { webglSupported } from "@/lib/webgl";

export type MapOrg = {
  slug: string;
  name: string;
  org_type_label: string;
  primary_role_code: string;
  primary_role_label: string;
  area_code: string;
  territory_code: string;
  territory: string;
  lat: number;
  lng: number;
  precision: string;
};

export type MapRelation = { type: string; from: [number, number]; to: [number, number] };

// Mapa del ecosistema en vivo ("sala de control", referencia: cybermap de Kaspersky):
//  intro con el globo 3D → el mapa oscuro de la marca vuela hasta Barranquilla → actores con brillo,
//  arcos animados por tipo de relación y ondas por cada evento en vivo.
// Mapa base con respaldo en cadena (OpenFreeMap → CARTO → fondo local): ver map-style.ts (ADR 005).
const CENTER: [number, number] = [-74.82, 10.955];
const INTRO_KEY = "goyn-intro-globo-visto";
// Tope de la intro: si el globo no termina (equipo lento, texturas que no llegan), se pasa al mapa igual.
const INTRO_MAX_MS = 14000;

maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

const roleColors = catalogs.roles.map((r) => [r.code, r.color ?? "#9B00FF"]).flat();
const areaColors = catalogs.impactAreas.map((a) => [a.code, a.color === "#060A28" ? "#8A86FF" : (a.color ?? "#9B00FF")]).flat();
const colorExpr = (by: "rol" | "area") =>
  (by === "rol" ? ["match", ["get", "primary_role_code"], ...roleColors, "#9B00FF"] : ["match", ["get", "area_code"], ...areaColors, "#9B00FF"]) as never;
export type ColorBy = "rol" | "area";
export type GroupBy = "cercania" | "territorio";
export const relationColors: Record<string, string> = { socio: "#FF01A2", aliado: "#9B00FF", colaborador: "#00A0CC" };

// Localidades del catálogo (centroides) para la capa de referencia del mapa claro.
const LOCALITIES: GeoJSON.FeatureCollection<GeoJSON.Point> = {
  type: "FeatureCollection",
  features: catalogs.territories
    .filter((t) => t.lat != null && t.lng != null && t.code !== "cobertura_general")
    .map((t) => ({ type: "Feature", geometry: { type: "Point", coordinates: [t.lng!, t.lat!] }, properties: { label: t.label.replace(/^(BAQ|AMB) – /, "") } })),
};

// Curva entre dos actores (bezier cuadrática en lon/lat) para dibujar arcos.
function arc(from: [number, number], to: [number, number], steps = 40): [number, number][] {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const cx = mx - dy * 0.3;
  const cy = my + dx * 0.3;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const a = (1 - t) * (1 - t);
    const b = 2 * (1 - t) * t;
    const c = t * t;
    return [a * x1 + b * cx + c * x2, a * y1 + b * cy + c * y2];
  });
}

// Secuencia de guiones para simular flujo sobre los arcos (técnica de "línea animada" de MapLibre).
const DASHES = [
  [0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5], [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0],
  [0, 0.5, 3, 3.5], [0, 1, 3, 3], [0, 1.5, 3, 2.5], [0, 2, 3, 2], [0, 2.5, 3, 1.5], [0, 3, 3, 1], [0, 3.5, 3, 0.5],
];

type Ripple = { id: string; lng: number; lat: number; color: string; start: number; big: boolean };

type MapProps = { orgs: MapOrg[]; relations: MapRelation[]; className?: string };

// Envoltorio de seguridad: si algo del mapa falla, la página y la lista siguen funcionando.
export function EcosystemMap(props: MapProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className={cn("grid place-items-center rounded-3xl bg-goyn-navy p-6 text-center text-sm text-white/80", props.className)}>
          <p>El mapa interactivo no está disponible en este momento. Las {props.orgs.length} organizaciones están en la lista de abajo.</p>
        </div>
      }
    >
      <EcosystemMapInner {...props} />
    </ErrorBoundary>
  );
}

function EcosystemMapInner({ orgs, relations, className }: MapProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const ready = useRef(false);
  const ripples = useRef<Ripple[]>([]);
  const flights = useRef<{ id: string; coords: [number, number][]; start: number }[]>([]);
  const router = useRouter();
  const live = useLive();
  const [basemap, setBasemap] = useState<BasemapProvider | null>(null);
  const [noWebgl, setNoWebgl] = useState(false);
  const [intro, setIntro] = useState<"desconocido" | "globo" | "listo">("desconocido");
  // De menos a más: arranca solo con organizaciones y localidades; las conexiones se suman como capa.
  const [showArcs, setShowArcs] = useState(false);
  const [colorBy, setColorBy] = useState<ColorBy>("rol");
  const [groupBy, setGroupBy] = useState<GroupBy>("cercania");
  const stage = useRef<HTMLDivElement>(null);

  // Agrupación por territorio (FR-001): una burbuja por zona con el número de organizaciones.
  const territoryBubbles = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point>>(
    () => ({
      type: "FeatureCollection",
      features: catalogs.territories
        .filter((t) => t.lat != null && t.lng != null)
        .map((t) => ({ t, count: orgs.filter((o) => o.territory_code === t.code).length }))
        .filter((x) => x.count > 0)
        .map(({ t, count }) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [t.lng!, t.lat!] },
          properties: { label: t.label.replace(/^(BAQ|AMB) – /, ""), count, code: t.code },
        })),
    }),
    [orgs],
  );

  const geojson = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point>>(
    () => ({
      type: "FeatureCollection",
      features: orgs.map((o) => ({ type: "Feature", geometry: { type: "Point", coordinates: [o.lng, o.lat] }, properties: { ...o } })),
    }),
    [orgs],
  );
  const arcs = useMemo<GeoJSON.FeatureCollection<GeoJSON.LineString>>(
    () => ({
      type: "FeatureCollection",
      features: relations.map((r, i) => ({ type: "Feature", id: i, geometry: { type: "LineString", coordinates: arc(r.from, r.to) }, properties: { type: r.type } })),
    }),
    [relations],
  );

  // ¿Mostrar la intro del globo? Solo la primera vez por sesión y si no se pidió reducir movimiento.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let seen = false;
    try {
      seen = sessionStorage.getItem(INTRO_KEY) === "1";
    } catch {
      /* sin almacenamiento */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- decisión única al montar según preferencias y capacidades del navegador
    setIntro(reduce || seen || !webglSupported() ? "listo" : "globo");
  }, []);

  useEffect(() => {
    if (intro !== "globo") return;
    const id = setTimeout(() => setIntro("listo"), INTRO_MAX_MS);
    return () => clearTimeout(id);
  }, [intro]);

  const finishIntro = () => {
    try {
      sessionStorage.setItem(INTRO_KEY, "1");
    } catch {
      /* ignorar */
    }
    setIntro("listo");
  };

  // Crear el mapa.
  useEffect(() => {
    if (!container.current || map.current) return;
    let cancelled = false;
    let raf = 0;

    (async () => {
      if (!webglSupported()) {
        setNoWebgl(true);
        return;
      }
      const { style, provider } = await loadBasemap();
      if (cancelled || !container.current) return;
      setBasemap(provider);
      let instance: MapLibreMap;
      try {
        instance = new maplibregl.Map({
          container: container.current,
          style,
          center: CENTER,
          zoom: 4.2,
          minZoom: 2,
          maxZoom: 17,
          pitch: 0,
          attributionControl: { compact: true },
          cooperativeGestures: window.matchMedia("(pointer: coarse)").matches,
        });
      } catch {
        setNoWebgl(true);
        return;
      }
      map.current = instance;
      instance.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }), "top-right");
      if (stage.current) instance.addControl(new maplibregl.FullscreenControl({ container: stage.current }), "top-right");
      instance.addControl(new maplibregl.GlobeControl(), "top-right");

      instance.on("load", () => {
        // Proyección de globo al alejarse (empalma con la intro 3D); se aplica tras cargar el estilo.
        try {
          instance.setProjection({ type: "globe" });
        } catch {
          /* navegadores sin soporte: se queda en mercator */
        }
        instance.addSource("orgs", { type: "geojson", data: geojson, cluster: true, clusterRadius: 42, clusterMaxZoom: 13 });
        instance.addSource("arcs", { type: "geojson", data: arcs });
        instance.addSource("ripples", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        instance.addSource("flights", { type: "geojson", data: { type: "FeatureCollection", features: [] }, lineMetrics: true });
        instance.addSource("territories", { type: "geojson", data: territoryBubbles });
        instance.addSource("localities", { type: "geojson", data: LOCALITIES });

        // Localidades: zona suave + nombre, para ubicarse sin calles (ajustes 06-oct).
        instance.addLayer({
          id: "loc-zone",
          type: "circle",
          source: "localities",
          paint: {
            "circle-radius": ["interpolate", ["exponential", 2], ["zoom"], 8, 10, 11, 46, 13, 180],
            "circle-color": "#9B00FF",
            "circle-opacity": 0.07,
            "circle-stroke-color": "#9B00FF",
            "circle-stroke-opacity": 0.3,
            "circle-stroke-width": 1.5,
          },
        });
        instance.addLayer({
          id: "loc-label",
          type: "symbol",
          source: "localities",
          minzoom: 8.5,
          layout: {
            "text-field": ["upcase", ["get", "label"]],
            "text-font": ["Noto Sans Bold"],
            "text-size": ["interpolate", ["linear"], ["zoom"], 9, 10, 13, 14],
            "text-letter-spacing": 0.08,
            "text-offset": [0, -2.4],
            "text-allow-overlap": false,
          },
          paint: { "text-color": "#6A00C2", "text-halo-color": "#FFFFFF", "text-halo-width": 1.5 },
        });

        const byType = ["match", ["get", "type"], "socio", relationColors.socio, "aliado", relationColors.aliado, relationColors.colaborador];
        instance.addLayer({ id: "arcs-base", type: "line", source: "arcs", layout: { visibility: "none" }, paint: { "line-color": byType as never, "line-width": 0.8, "line-opacity": 0.18 } });
        instance.addLayer({
          id: "arcs-flow",
          type: "line",
          source: "arcs",
          layout: { "line-cap": "round", visibility: "none" },
          paint: { "line-color": byType as never, "line-width": 1.8, "line-opacity": 0.75, "line-blur": 0.5, "line-dasharray": DASHES[0] },
        });
        instance.addLayer({
          id: "flights",
          type: "line",
          source: "flights",
          layout: { "line-cap": "round" },
          paint: {
            "line-width": 3.5,
            "line-gradient": ["interpolate", ["linear"], ["line-progress"], 0, "rgba(155,0,255,0)", 0.7, "rgba(155,0,255,0.85)", 1, "#DB0089"],
          },
        });
        instance.addLayer({
          id: "ripples",
          type: "circle",
          source: "ripples",
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["get", "p"], 0, 4, 1, ["case", ["get", "big"], 70, 44]],
            "circle-color": "transparent",
            "circle-stroke-color": ["get", "color"],
            "circle-stroke-width": 2.5,
            "circle-stroke-opacity": ["-", 1, ["get", "p"]],
          },
        });
        instance.addLayer({
          id: "clusters-glow",
          type: "circle",
          source: "orgs",
          filter: ["has", "point_count"],
          paint: { "circle-color": "#9B00FF", "circle-radius": ["step", ["get", "point_count"], 30, 8, 38, 20, 48], "circle-blur": 1, "circle-opacity": 0.55 },
        });
        instance.addLayer({
          id: "clusters",
          type: "circle",
          source: "orgs",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": ["step", ["get", "point_count"], "#9B00FF", 8, "#FF01A2", 20, "#FE5200"],
            "circle-radius": ["step", ["get", "point_count"], 16, 8, 21, 20, 28],
            "circle-stroke-width": 2,
            "circle-stroke-color": "rgba(255,255,255,0.8)",
          },
        });
        instance.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: "orgs",
          filter: ["has", "point_count"],
          layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 13, "text-font": ["Noto Sans Bold"] },
          paint: { "text-color": "#ffffff" },
        });
        instance.addLayer({
          id: "terr-glow",
          type: "circle",
          source: "territories",
          layout: { visibility: "none" },
          paint: { "circle-color": "#9B00FF", "circle-radius": ["+", 30, ["*", 3.5, ["get", "count"]]], "circle-blur": 1, "circle-opacity": 0.5 },
        });
        instance.addLayer({
          id: "terr-bubbles",
          type: "circle",
          source: "territories",
          layout: { visibility: "none" },
          paint: {
            "circle-color": "#FF01A2",
            "circle-opacity": 0.85,
            "circle-radius": ["+", 16, ["*", 2, ["get", "count"]]],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });
        instance.addLayer({
          id: "terr-labels",
          type: "symbol",
          source: "territories",
          layout: {
            visibility: "none",
            "text-field": ["format", ["to-string", ["get", "count"]], { "font-scale": 1.2 }, "\n", {}, ["get", "label"], { "font-scale": 0.75 }],
            "text-font": ["Noto Sans Bold"],
            "text-size": 13,
            "text-allow-overlap": true,
          },
          paint: { "text-color": "#ffffff", "text-halo-color": "#060a28", "text-halo-width": 1 },
        });
        const color = colorExpr("rol");
        instance.addLayer({
          id: "points-glow",
          type: "circle",
          source: "orgs",
          filter: ["!", ["has", "point_count"]],
          paint: { "circle-color": color as never, "circle-radius": 18, "circle-blur": 1, "circle-opacity": 0.6 },
        });
        instance.addLayer({
          id: "points",
          type: "circle",
          source: "orgs",
          filter: ["!", ["has", "point_count"]],
          paint: { "circle-color": color as never, "circle-radius": 7, "circle-stroke-width": 2, "circle-stroke-color": "#ffffff" },
        });

        instance.on("click", "clusters", async (e) => {
          const feature = instance.queryRenderedFeatures(e.point, { layers: ["clusters"] })[0];
          const zoom = await (instance.getSource("orgs") as GeoJSONSource).getClusterExpansionZoom(feature.properties.cluster_id);
          instance.easeTo({ center: (feature.geometry as GeoJSON.Point).coordinates as [number, number], zoom });
        });
        instance.on("click", "points", (e) => {
          const f = e.features?.[0];
          if (!f) return;
          const p = f.properties as MapOrg;
          const popup = new maplibregl.Popup({ offset: 14, maxWidth: "280px", className: "goyn-popup" })
            .setLngLat((f.geometry as GeoJSON.Point).coordinates as [number, number])
            .setHTML(`
              <div class="w-64 p-4">
                <p class="text-[11px] font-bold uppercase tracking-wider text-[#a9a6cc]">${escapeHtml(p.org_type_label)}</p>
                <p class="mt-1 font-heading text-base font-bold leading-snug text-white">${escapeHtml(p.name)}</p>
                <p class="mt-2 text-sm text-white/80">${escapeHtml(p.primary_role_label)} · ${escapeHtml(p.territory)}</p>
                ${p.precision === "aproximada" ? '<p class="mt-1 text-[11px] text-[#a9a6cc]">Ubicación aproximada (zona)</p>' : ""}
                <a href="/actores/${encodeURIComponent(p.slug)}" class="mt-3 inline-flex h-9 w-full items-center justify-center rounded-full bg-[#9B00FF] text-sm font-bold text-white">Ver hoja de vida</a>
              </div>`)
            .addTo(instance);
          popup.getElement().querySelector("a")?.addEventListener("click", (ev) => {
            ev.preventDefault();
            router.push(`/actores/${p.slug}`);
          });
        });
        for (const layer of ["clusters", "points"]) {
          instance.on("mouseenter", layer, () => (instance.getCanvas().style.cursor = "pointer"));
          instance.on("mouseleave", layer, () => (instance.getCanvas().style.cursor = ""));
        }

        ready.current = true;

        // Bucle de animación: flujo de arcos, respiración de los actores, ondas y vuelos en vivo.
        let step = -1;
        const loop = (now: number) => {
          raf = requestAnimationFrame(loop);
          if (document.hidden) return;
          // Vigilante: si la cámara queda en un estado inválido, se reubica en Barranquilla.
          if (!Number.isFinite(instance.getZoom())) {
            try {
              instance.stop();
              instance.jumpTo({ center: CENTER, zoom: 10.6, pitch: 0, bearing: 0 });
            } catch {
              /* se reintenta en el siguiente cuadro */
            }
          }
          try {
            frame(now);
          } catch {
            /* un cuadro fallido no detiene el mapa */
          }
        };
        const frame = (now: number) => {
          const s = Math.floor(now / 70) % DASHES.length;
          if (s !== step && instance.getLayer("arcs-flow")) {
            step = s;
            instance.setPaintProperty("arcs-flow", "line-dasharray", DASHES[s]);
          }
          const breathe = 0.45 + Math.sin(now / 700) * 0.2;
          instance.setPaintProperty("points-glow", "circle-opacity", breathe);
          instance.setPaintProperty("clusters-glow", "circle-opacity", breathe + 0.1);

          ripples.current = ripples.current.filter((r) => now - r.start < 1800);
          (instance.getSource("ripples") as GeoJSONSource).setData({
            type: "FeatureCollection",
            features: ripples.current.map((r) => ({
              type: "Feature",
              geometry: { type: "Point", coordinates: [r.lng, r.lat] },
              properties: { p: (now - r.start) / 1800, color: r.color, big: r.big },
            })),
          });
          flights.current = flights.current.filter((f) => now - f.start < 2600);
          (instance.getSource("flights") as GeoJSONSource).setData({
            type: "FeatureCollection",
            features: flights.current.map((f) => {
              const p = Math.min(1, (now - f.start) / 1400);
              const n = Math.max(2, Math.round(f.coords.length * p));
              return { type: "Feature", geometry: { type: "LineString", coordinates: f.coords.slice(0, n) }, properties: {} };
            }),
          });
        };
        raf = requestAnimationFrame(loop);
      });

      // Errores de teselas o recursos externos: el mapa sigue funcionando con las capas propias.
      instance.on("error", (e) => console.warn("[mapa]", e.error?.message ?? e));

    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      map.current?.remove();
      map.current = null;
      ready.current = false;
    };
    // El mapa se crea una sola vez; los datos se actualizan en los efectos siguientes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Vuelo de llegada: cuando termina la intro (o se salta), del Caribe a Barranquilla.
  useEffect(() => {
    if (intro !== "listo") return;
    const go = () => {
      const m = map.current;
      if (!m) return;
      // easeTo y no flyTo: en MapLibre 6.11 el flyTo con proyección de globo deja el zoom en NaN
      // en ciertos altos de pantalla (~15 % de los tamaños probados) y el mapa queda congelado.
      m.easeTo({ center: CENTER, zoom: 10.6, pitch: 0, bearing: 0, duration: 3200, essential: true, easing: (t) => 1 - Math.pow(1 - t, 3) });
      // La inclinación 3D se aplica al terminar el vuelo (en vista cercana), no durante la proyección de globo.
      m.once("moveend", () => m.easeTo({ pitch: 40, bearing: -10, duration: 1600 }));
    };
    if (ready.current) go();
    else {
      const id = setInterval(() => {
        if (ready.current) {
          clearInterval(id);
          go();
        }
      }, 150);
      return () => clearInterval(id);
    }
  }, [intro]);

  useEffect(() => {
    (map.current?.getSource("orgs") as GeoJSONSource | undefined)?.setData(geojson);
  }, [geojson]);
  useEffect(() => {
    (map.current?.getSource("arcs") as GeoJSONSource | undefined)?.setData(arcs);
  }, [arcs]);
  // Capas visibles según agrupación (cercanía / territorio) y conexiones.
  useEffect(() => {
    const m = map.current;
    if (!m || !ready.current) return;
    const set = (layers: string[], visible: boolean) => layers.forEach((l) => m.getLayer(l) && m.setLayoutProperty(l, "visibility", visible ? "visible" : "none"));
    const byTerritory = groupBy === "territorio";
    set(["clusters-glow", "clusters", "cluster-count", "points-glow", "points"], !byTerritory);
    set(["terr-glow", "terr-bubbles", "terr-labels"], byTerritory);
    set(["loc-zone", "loc-label"], !byTerritory);
    set(["arcs-base", "arcs-flow"], showArcs && !byTerritory);
  }, [showArcs, groupBy]);
  useEffect(() => {
    const m = map.current;
    if (!m || !ready.current) return;
    m.setPaintProperty("points", "circle-color", colorExpr(colorBy));
    m.setPaintProperty("points-glow", "circle-color", colorExpr(colorBy));
  }, [colorBy]);
  useEffect(() => {
    (map.current?.getSource("territories") as GeoJSONSource | undefined)?.setData(territoryBubbles);
  }, [territoryBubbles]);

  // Cada evento en vivo: onda en la organización y, si es una conexión, un vuelo de luz entre ambas.
  const lastEvent = live.lastEvent;
  useEffect(() => {
    if (!lastEvent || lastEvent.lat == null || lastEvent.lng == null) return;
    const now = performance.now();
    const color = lastEvent.kind === "conexion" ? "#FFBD25" : lastEvent.indicator === "fortalecidos" ? "#00A0CC" : lastEvent.indicator === "transformados" ? "#FF01A2" : "#B44DFF";
    ripples.current.push({ id: lastEvent.id, lng: lastEvent.lng, lat: lastEvent.lat, color, start: now, big: false });
    ripples.current.push({ id: `${lastEvent.id}-b`, lng: lastEvent.lng, lat: lastEvent.lat, color, start: now + 350, big: true });
    if (lastEvent.kind === "conexion" && lastEvent.targetLat != null && lastEvent.targetLng != null) {
      flights.current.push({ id: lastEvent.id, coords: arc([lastEvent.lng, lastEvent.lat], [lastEvent.targetLng, lastEvent.targetLat], 60), start: now });
    }
  }, [lastEvent]);

  return (
    <div ref={stage} className={cn("relative isolate overflow-hidden rounded-3xl border border-goyn-navy/10 bg-[#F6F3FD] text-goyn-navy shadow-xl shadow-goyn-violeta/10", className)}>
      <div ref={container} className="h-full w-full" role="region" aria-label="Mapa de organizaciones del ecosistema" />

      <MapHud
        showArcs={showArcs}
        onToggleArcs={() => setShowArcs((v) => !v)}
        colorBy={colorBy}
        onColorBy={setColorBy}
        groupBy={groupBy}
        onGroupBy={setGroupBy}
        onReplay={() => {
          map.current?.jumpTo({ center: CENTER, zoom: 4.2, pitch: 0, bearing: 0 });
          setIntro("globo");
        }}
      />

      <div className="pointer-events-none absolute right-3 bottom-8 hidden w-80 lg:block">
        <div className="pointer-events-auto rounded-2xl border border-goyn-navy/10 bg-white/92 p-3 shadow-xl shadow-goyn-violeta/10 backdrop-blur-md">
          <LiveFeed limit={4} />
        </div>
      </div>

      <AnimatePresence>
        {intro !== "listo" && (
          <motion.div
            key="intro"
            className="absolute inset-0 z-20 bg-[#03051a]"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.08 }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
          >
            {intro === "globo" ? (
              <>
                <LiveGlobe variant="intro" className="h-full w-full" onArrive={finishIntro} />
                <div className="pointer-events-none absolute inset-x-0 top-8 text-center">
                  <p className="text-xs font-bold tracking-[0.3em] text-white/60 uppercase">Global Opportunity Youth Network</p>
                  <p className="mt-2 font-heading text-xl font-bold uppercase sm:text-3xl">Entrando a Barranquilla</p>
                </div>
                <button
                  type="button"
                  onClick={finishIntro}
                  className="absolute right-4 bottom-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur hover:bg-white/20"
                >
                  <SkipForwardIcon className="size-4" aria-hidden /> Saltar intro
                </button>
              </>
            ) : (
              <div className="grid h-full place-items-center">
                <Loader2Icon className="size-8 animate-spin text-white/60" aria-hidden />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {basemap === "local" && (
        <p role="status" className="pointer-events-none absolute bottom-8 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/15 bg-[#060a28]/85 px-3 py-1.5 text-xs text-white/80 backdrop-blur">
          <TriangleAlertIcon className="size-3.5 text-goyn-amarillo" aria-hidden /> Calles no disponibles por ahora · las organizaciones se muestran igual
        </p>
      )}

      {noWebgl && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-goyn-navy p-6 text-center text-sm text-white/80">
          <div className="max-w-sm">
            <MapIcon className="mx-auto mb-3 size-8 text-goyn-lila" aria-hidden />
            <p className="font-heading text-base font-bold text-white">Este navegador no puede dibujar el mapa interactivo</p>
            <p className="mt-2">Activa la aceleración por hardware o prueba con otro navegador. Las {orgs.length} organizaciones están en la lista de abajo.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function escapeHtml(value: string) {
  return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
