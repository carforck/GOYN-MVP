"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { supabasePublishableKey, supabaseUrl } from "@/lib/config";
import { getLiveState, initLive, pushEvent, replaceSnapshot, subscribeLive, type LiveState } from "@/lib/live/store";
import type { LiveEvent, LiveSnapshot } from "@/lib/live/types";

// Fuente de datos en vivo:
//  · Modo conectado: canal público "ecosistema" de Supabase Realtime (la base de datos emite un
//    aviso cuando se publica algo, migración 009) → se vuelve a pedir /api/ecosistema.
//    Además se consulta cada 45 s como respaldo.
//  · Modo demo: simulador que genera reportes y conexiones cada pocos segundos para validar
//    la experiencia en tiempo real. Se rotula como simulación en la interfaz.
const LiveContext = createContext<LiveState | null>(null);

// Estado en vivo. En el servidor y durante la hidratación devuelve la instantánea inicial
// (mismo HTML en ambos lados); luego sigue al almacén del cliente.
export function useLive(): LiveState {
  const initial = useContext(LiveContext);
  if (!initial) throw new Error("useLive debe usarse dentro de <LiveProvider>");
  return useSyncExternalStore(subscribeLive, () => getLiveState() ?? initial, () => initial);
}

export function LiveProvider({ snapshot, focusSlug, children }: { snapshot: LiveSnapshot; focusSlug?: string; children: React.ReactNode }) {
  const [initial] = useState<LiveState>(() => ({ ...snapshot, lastEvent: null, version: 0 }));
  useEffect(() => {
    initLive(snapshot);
    if (snapshot.source === "demo") return startSimulator(snapshot, focusSlug);
    return startRealtime();
    // La instantánea inicial solo se usa al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <LiveContext value={initial}>{children}</LiveContext>;
}

function startRealtime() {
  let stopped = false;
  const refresh = async (event?: LiveEvent) => {
    try {
      const res = await fetch("/api/ecosistema", { cache: "no-store" });
      if (!stopped && res.ok) replaceSnapshot((await res.json()) as LiveSnapshot, event);
    } catch {
      /* sin conexión: se reintenta en el siguiente ciclo */
    }
  };
  const interval = setInterval(() => refresh(), 45_000);

  let cleanup = () => {};
  import("@supabase/supabase-js").then(({ createClient }) => {
    if (stopped) return;
    const client = createClient(supabaseUrl, supabasePublishableKey);
    const channel = client
      .channel("ecosistema")
      .on("broadcast", { event: "cambio" }, ({ payload }) => {
        const p = payload as Partial<LiveEvent> & { kind?: LiveEvent["kind"] };
        refresh(
          p.kind
            ? {
                id: crypto.randomUUID(),
                at: new Date().toISOString(),
                kind: p.kind,
                orgSlug: p.orgSlug ?? "",
                orgName: p.orgName ?? "Organización del ecosistema",
                territory: p.territory ?? null,
                lat: p.lat ?? null,
                lng: p.lng ?? null,
                indicator: p.indicator,
                delta: p.delta,
              }
            : undefined,
        );
      })
      .subscribe();
    cleanup = () => void client.removeChannel(channel);
  });

  return () => {
    stopped = true;
    clearInterval(interval);
    cleanup();
  };
}

// `focusSlug`: en el panel, ~40 % de los eventos simulados son de la propia organización.
function startSimulator(snapshot: LiveSnapshot, focusSlug?: string) {
  const orgs = snapshot.orgs.filter((o) => o.lat != null && o.lng != null);
  if (!orgs.length) return () => {};
  let timer: ReturnType<typeof setTimeout>;

  const focus = focusSlug ? orgs.find((o) => o.slug === focusSlug) : undefined;
  const tick = () => {
    const org = focus && Math.random() < 0.4 ? focus : orgs[Math.floor(Math.random() * orgs.length)];
    const roll = Math.random();
    let event: LiveEvent;
    if (roll < 0.14) {
      const other = orgs[Math.floor(Math.random() * orgs.length)];
      event = {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        kind: "conexion",
        orgSlug: org.slug,
        orgName: org.name,
        territory: org.territory,
        lat: org.lat,
        lng: org.lng,
        targetName: other.name,
        targetLat: other.lat,
        targetLng: other.lng,
      };
    } else {
      const indicator = roll < 0.7 ? "conectados" : roll < 0.93 ? "fortalecidos" : "transformados";
      const delta = indicator === "conectados" ? 5 + Math.floor(Math.random() * 40) : indicator === "fortalecidos" ? 3 + Math.floor(Math.random() * 18) : 1 + Math.floor(Math.random() * 5);
      event = {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        kind: "reporte",
        orgSlug: org.slug,
        orgName: org.name,
        territory: org.territory,
        lat: org.lat,
        lng: org.lng,
        indicator,
        delta,
      };
    }
    pushEvent(event);
    timer = setTimeout(tick, 4500 + Math.random() * 3500);
  };

  timer = setTimeout(tick, 3500);
  return () => clearTimeout(timer);
}
