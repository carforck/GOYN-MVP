"use client";

import type { LiveEvent, LiveSnapshot } from "@/lib/live/types";

// Almacén del ecosistema en vivo compartido por todos los componentes de la página
// (contadores, ticker, mapa, globo, panel). Se inicializa con la instantánea del servidor.

type State = LiveSnapshot & { lastEvent: LiveEvent | null; version: number };

let state: State | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function initLive(snapshot: LiveSnapshot) {
  // Conserva lo acumulado si ya se inició (navegación entre páginas del mismo layout).
  if (state && state.source === snapshot.source && state.version > 0) return;
  state = { ...snapshot, lastEvent: null, version: 0 };
  emit();
}

// Nueva instantánea del servidor. Las novedades se DEDUCEN comparando con la anterior
// (organizaciones y reportes que no estaban): el aviso de Realtime es solo una señal para
// recargar, así nadie puede inyectar eventos falsos desde el canal público.
export function replaceSnapshot(snapshot: LiveSnapshot) {
  if (!state) return initLive(snapshot);
  const prevOrgs = new Set(state.orgs.map((o) => o.slug));
  const prevEvents = new Set(state.events.map((e) => e.id));
  const now = new Date().toISOString();
  const fresh: LiveEvent[] = [
    ...snapshot.orgs
      .filter((o) => !prevOrgs.has(o.slug))
      .map((o): LiveEvent => ({ id: `registro-${o.id}`, at: now, kind: "registro", orgSlug: o.slug, orgName: o.name, territory: o.territory, lat: o.lat, lng: o.lng })),
    ...snapshot.events.filter((e) => !prevEvents.has(e.id)).map((e) => ({ ...e, historic: false })),
  ];
  const rest = state.events.filter((e) => !e.historic && !fresh.some((f) => f.id === e.id));
  const merged = [...fresh, ...rest, ...snapshot.events.filter((e) => prevEvents.has(e.id) && !rest.some((r) => r.id === e.id))];
  state = {
    ...snapshot,
    events: merged.slice(0, 20),
    lastEvent: fresh.find((e) => e.kind === "registro") ?? fresh[0] ?? state.lastEvent,
    version: state.version + 1,
  };
  emit();
}

// Aplica un evento incremental (simulador o aviso de Realtime con valor conocido).
export function pushEvent(event: LiveEvent) {
  if (!state) return;
  const stats = { ...state.stats };
  const territories = { ...state.territories };
  if (event.kind === "reporte" && event.indicator && event.delta) {
    stats[event.indicator] += event.delta;
    if (event.territory) {
      const t = territories[event.territory] ?? { orgs: 0, conectados: 0, fortalecidos: 0, transformados: 0 };
      territories[event.territory] = { ...t, [event.indicator]: t[event.indicator] + event.delta };
    }
  }
  if (event.kind === "conexion") stats.connections += 1;
  state = {
    ...state,
    stats,
    territories,
    events: [event, ...state.events].slice(0, 20),
    lastEvent: event,
    version: state.version + 1,
  };
  emit();
}

export const subscribeLive = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const getLiveState = () => state;
export type LiveState = State;
