import { NextResponse } from "next/server";
import { getLiveSnapshot } from "@/lib/data";

// Instantánea pública del ecosistema (solo datos publicados). La consultan los clientes cuando
// Supabase Realtime avisa de un cambio, y cada cierto tiempo como respaldo.
export async function GET() {
  const snapshot = await getLiveSnapshot();
  return NextResponse.json(snapshot, { headers: { "cache-control": "no-store" } });
}
