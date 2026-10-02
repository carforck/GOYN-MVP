"use server";

import { revalidatePath } from "next/cache";
import { getViewer, isDemoSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: true; count: number } | { ok: false; error: string };

// "2026-T3" → 1 de julio a 30 de septiembre de 2026.
function periodDates(label: string) {
  const m = /^(\d{4})-T([1-4])$/.exec(label);
  if (!m) return null;
  const year = Number(m[1]);
  const q = Number(m[2]);
  const start = new Date(Date.UTC(year, (q - 1) * 3, 1));
  const end = new Date(Date.UTC(year, q * 3, 0));
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

// FR-011: la organización reporta resultados por programa y periodo. Quedan "enviados" y solo
// suman al tablero cuando el equipo GOYN los aprueba (review_indicator_report).
export async function submitIndicatorReport(_: unknown, formData: FormData): Promise<Result> {
  const programId = String(formData.get("program") ?? "");
  const period = String(formData.get("period") ?? "");
  const source = String(formData.get("source") ?? "").trim();
  const dates = periodDates(period);
  if (!programId || !dates) return { ok: false, error: "Selecciona el programa y el periodo." };
  if (!source) return { ok: false, error: "Indica la fuente del dato." };

  const values = (["conectados", "fortalecidos", "transformados"] as const)
    .map((code) => ({ code, raw: String(formData.get(code) ?? "").trim() }))
    .filter((v) => v.raw !== "");
  if (!values.length) return { ok: false, error: "Reporta al menos un indicador (0 también es un dato)." };
  if (values.some((v) => !/^\d+$/.test(v.raw))) return { ok: false, error: "Los valores deben ser números enteros." };

  if (await isDemoSession()) return { ok: true, count: values.length };

  const viewer = await getViewer();
  const organizationId = viewer.organizationIds[0];
  if (!viewer.userId || !organizationId) return { ok: false, error: "Tu sesión no está asociada a una organización." };

  const supabase = await createClient();
  const { error } = await supabase.from("indicator_report").insert(
    values.map((v) => ({
      organization_id: organizationId,
      program_id: programId,
      indicator_code: v.code,
      period_label: period,
      period_start: dates.start,
      period_end: dates.end,
      value: Number(v.raw),
      source,
      method: "autorreporte",
      status: "enviado",
      reported_by: viewer.userId,
    })),
  );
  if (error) {
    return { ok: false, error: error.code === "23505" ? "Ya existe un reporte de ese programa y periodo en revisión o aprobado." : error.message };
  }
  revalidatePath("/panel/indicadores");
  return { ok: true, count: values.length };
}
