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

export function replaceSnapshot(snapshot: LiveSnapshot, event?: LiveEvent) {
  if (!state) return initLive(snapshot);
  state = {
    ...snapshot,
    events: event ? [event, ...snapshot.events].slice(0, 20) : snapshot.events,
    lastEvent: event ?? state.lastEvent,
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
