import type { EcosystemStats } from "@/lib/types";

export type TerritoryTotals = { orgs: number; conectados: number; fortalecidos: number; transformados: number };

export type LiveOrg = {
  id: string;
  slug: string;
  name: string;
  territory: string | null;
  role: string;
  lat: number | null;
  lng: number | null;
};

// Evento del ecosistema que se muestra en el ticker, pulsa en el mapa y mueve los contadores.
export type LiveEvent = {
  id: string;
  at: string;
  kind: "reporte" | "conexion" | "registro";
  orgSlug: string;
  orgName: string;
  territory: string | null;
  lat: number | null;
  lng: number | null;
  indicator?: "conectados" | "fortalecidos" | "transformados";
  delta?: number;
  targetName?: string;
  targetLat?: number | null;
  targetLng?: number | null;
  // Evento de la instantánea inicial: ya está contado en los totales publicados.
  historic?: boolean;
};

export type LiveSnapshot = {
  stats: EcosystemStats;
  territories: Record<string, TerritoryTotals>;
  orgs: LiveOrg[];
  events: LiveEvent[];
  source: "demo" | "supabase";
};
