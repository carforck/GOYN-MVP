"use client";

import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { catalogs } from "@/lib/catalogs";
import { cn } from "@/lib/utils";

export type MapOrg = {
  slug: string;
  name: string;
  org_type_label: string;
  primary_role_code: string;
  primary_role_label: string;
  territory: string;
  lat: number;
  lng: number;
  precision: string;
};

// Teselas vectoriales de OpenFreeMap (OSM, sin llave ni cuota). Cambiar aquí si GOYN contrata
// otro proveedor (ADR 005).
const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
const CENTER: [number, number] = [-74.815, 10.955];

// Worker servido desde public/maplibre (scripts/copy-maplibre-worker.mjs).
maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

const roleColors = catalogs.roles.map((r) => [r.code, r.color ?? "#9B00FF"]).flat();

export function EcosystemMap({ orgs, className }: { orgs: MapOrg[]; className?: string }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  const geojson = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point>>(
    () => ({
      type: "FeatureCollection",
      features: orgs.map((o) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [o.lng, o.lat] },
        properties: { ...o },
      })),
    }),
    [orgs],
  );

  useEffect(() => {
    if (!container.current || map.current) return;
    const instance = new maplibregl.Map({
      container: container.current,
      style: STYLE_URL,
      center: CENTER,
      zoom: 10.6,
      minZoom: 8,
      maxZoom: 17,
      attributionControl: { compact: true },
      cooperativeGestures: typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches,
    });
    map.current = instance;
    instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    instance.on("error", (e) => {
      if (!instance.isStyleLoaded() && String(e.error?.message ?? "").includes("Failed to fetch")) setFailed(true);
    });

    instance.on("load", () => {
      instance.addSource("orgs", { type: "geojson", data: geojson, cluster: true, clusterRadius: 44, clusterMaxZoom: 14 });

      instance.addLayer({
        id: "clusters",
        type: "circle",
        source: "orgs",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": ["step", ["get", "point_count"], "#9B00FF", 8, "#FF01A2", 20, "#060A28"],
          "circle-radius": ["step", ["get", "point_count"], 18, 8, 24, 20, 32],
          "circle-stroke-width": 4,
          "circle-stroke-color": "rgba(255,255,255,0.6)",
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
        id: "points",
        type: "circle",
        source: "orgs",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": ["match", ["get", "primary_role_code"], ...roleColors, "#9B00FF"] as unknown as string,
          "circle-radius": 9,
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
        },
      });

      instance.on("click", "clusters", async (e) => {
        const feature = instance.queryRenderedFeatures(e.point, { layers: ["clusters"] })[0];
        const source = instance.getSource("orgs") as GeoJSONSource;
        const zoom = await source.getClusterExpansionZoom(feature.properties.cluster_id);
        instance.easeTo({ center: (feature.geometry as GeoJSON.Point).coordinates as [number, number], zoom });
      });

      instance.on("click", "points", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const p = f.properties as MapOrg;
        const html = `
          <div class="w-64 p-4">
            <p class="text-[11px] font-bold uppercase tracking-wider text-[#54566b]">${escapeHtml(p.org_type_label)}</p>
            <p class="mt-1 font-heading text-base font-bold leading-snug text-[#060a28]">${escapeHtml(p.name)}</p>
            <p class="mt-2 text-sm text-[#060a28]">${escapeHtml(p.primary_role_label)} · ${escapeHtml(p.territory)}</p>
            ${p.precision === "aproximada" ? '<p class="mt-1 text-[11px] text-[#54566b]">Ubicación aproximada (zona)</p>' : ""}
            <a href="/actores/${encodeURIComponent(p.slug)}" data-slug="${escapeHtml(p.slug)}"
               class="mt-3 inline-flex h-9 w-full items-center justify-center rounded-full bg-[#9B00FF] text-sm font-bold text-white">
              Ver hoja de vida
            </a>
          </div>`;
        const popup = new maplibregl.Popup({ offset: 14, maxWidth: "280px" })
          .setLngLat((f.geometry as GeoJSON.Point).coordinates as [number, number])
          .setHTML(html)
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
    });

    return () => {
      instance.remove();
      map.current = null;
    };
    // El mapa se crea una sola vez; los datos se actualizan en el efecto siguiente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const source = map.current?.getSource("orgs") as GeoJSONSource | undefined;
    source?.setData(geojson);
  }, [geojson]);

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border bg-goyn-lila/40", className)}>
      <div ref={container} className="h-full w-full" role="region" aria-label="Mapa de organizaciones del ecosistema" />
      {failed && (
        <div className="absolute inset-0 grid place-items-center bg-white/90 p-6 text-center text-sm text-muted-foreground">
          No pudimos cargar el mapa. El directorio sigue disponible en la vista de lista.
        </div>
      )}
      <MapLegend />
    </div>
  );
}

function MapLegend() {
  return (
    <details className="absolute bottom-3 left-3 max-w-[70%] rounded-xl bg-white/95 px-3 py-2 text-xs shadow-md">
      <summary className="cursor-pointer font-bold text-goyn-navy">Rol principal</summary>
      <ul className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
        {catalogs.roles.map((r) => (
          <li key={r.code} className="flex items-center gap-1.5">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: r.color }} aria-hidden />
            {r.label}
          </li>
        ))}
      </ul>
    </details>
  );
}

function escapeHtml(value: string) {
  return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
