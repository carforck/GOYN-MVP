import { NextResponse } from "next/server";
import { getEcosystemStats } from "@/lib/data";

// Estado del servicio y de los proveedores del mapa base. Lo consulta el monitoreo
// (docs/monitoreo/salud.yml). "ok" = todo bien; "degradado" = el mapa usa un respaldo.
const BASEMAPS = {
  openfreemap: "https://tiles.openfreemap.org/styles/dark",
  carto: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
};

async function probe(url: string) {
  const started = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000), cache: "no-store" });
    return { ok: res.ok, ms: Date.now() - started };
  } catch {
    return { ok: false, ms: Date.now() - started };
  }
}

export async function GET() {
  const [openfreemap, carto, datos] = await Promise.all([
    probe(BASEMAPS.openfreemap),
    probe(BASEMAPS.carto),
    getEcosystemStats().then(
      (s) => ({ ok: true, organizaciones: s.organizations }),
      () => ({ ok: false, organizaciones: 0 }),
    ),
  ]);
  const estado = !datos.ok ? "caido" : openfreemap.ok ? "ok" : "degradado";
  return NextResponse.json(
    { estado, fecha: new Date().toISOString(), datos, mapaBase: { openfreemap, carto, respaldoLocal: true } },
    { status: datos.ok ? 200 : 503, headers: { "cache-control": "no-store" } },
  );
}
