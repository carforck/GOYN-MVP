"use server";

import { revalidatePath } from "next/cache";
import { getViewer, isDemoSession } from "@/lib/auth";
import { reportYear } from "@/lib/impact";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: true; count: number; year: string } | { ok: false; error: string };

const CODES = ["conectados", "fortalecidos", "transformados"] as const;

// FR-011 + ajustes 26/28 (2026-10-29): la organización reporta por PROGRAMA y AÑO, sin trimestre.
// El año es el de la fecha de inicio del programa. Cada carga guarda la cantidad (y mujeres) y su
// fecha de actualización (updated_at). Si ya hay un reporte sin aprobar del mismo programa, año e
// indicador, se actualiza; si no, se crea uno nuevo "enviado". Solo suma al tablero cuando el
// equipo GOYN lo aprueba (review_indicator_report, que reemplaza el dato aprobado anterior).
export async function submitIndicatorReport(_: unknown, formData: FormData): Promise<Result> {
  const programId = String(formData.get("program") ?? "");
  const source = String(formData.get("source") ?? "").trim();
  if (!programId) return { ok: false, error: "Selecciona el programa." };
  if (!source) return { ok: false, error: "Indica la fuente del dato." };

  const values = CODES.map((code) => ({
    code,
    raw: String(formData.get(code) ?? "").trim(),
    rawWomen: String(formData.get(`${code}_mujeres`) ?? "").trim(),
  })).filter((v) => v.raw !== "");
  if (!values.length) return { ok: false, error: "Reporta al menos un indicador (0 también es un dato)." };
  if (values.some((v) => !/^\d+$/.test(v.raw) || (v.rawWomen !== "" && !/^\d+$/.test(v.rawWomen)))) {
    return { ok: false, error: "Los valores deben ser números enteros." };
  }
  if (values.some((v) => v.rawWomen !== "" && Number(v.rawWomen) > Number(v.raw))) {
    return { ok: false, error: "Las mujeres no pueden superar el total del indicador." };
  }

  // Recorrido demo: solo lectura. El año sale de la fecha de inicio que envía el formulario.
  if (await isDemoSession()) {
    return { ok: true, count: values.length, year: reportYear(String(formData.get("start_date") ?? ""), String(new Date().getFullYear())) };
  }

  const viewer = await getViewer();
  const organizationId = viewer.organizationIds[0];
  if (!viewer.userId || !organizationId) return { ok: false, error: "Tu sesión no está asociada a una organización." };

  const supabase = await createClient();
  const { data: program } = await supabase
    .from("program")
    .select("id, start_date")
    .eq("id", programId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!program) return { ok: false, error: "El programa no pertenece a tu organización." };

  // El esquema exige periodo: se guarda el año ("2025") con su rango 1 ene – 31 dic.
  const year = reportYear(program.start_date, String(new Date().getFullYear()));
  const period = { period_label: year, period_start: `${year}-01-01`, period_end: `${year}-12-31` };

  for (const v of values) {
    const row = {
      value: Number(v.raw),
      value_women: v.rawWomen === "" ? null : Number(v.rawWomen),
      null_reason: null,
      source,
      method: "autorreporte",
      status: "enviado" as const,
      reported_by: viewer.userId,
    };
    const { data: existing } = await supabase
      .from("indicator_report")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("program_id", programId)
      .eq("indicator_code", v.code)
      .eq("period_label", year)
      .in("status", ["borrador", "enviado", "rechazado"])
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { data: updated, error } = await supabase.from("indicator_report").update(row).eq("id", existing.id).select("id");
      if (error) return { ok: false, error: error.message };
      if (!updated?.length) return { ok: false, error: `Ya hay un reporte de ${v.code} para ${year} en revisión; espera la decisión del equipo GOYN.` };
    } else {
      const { error } = await supabase
        .from("indicator_report")
        .insert({ organization_id: organizationId, program_id: programId, indicator_code: v.code, ...period, ...row });
      if (error) {
        return {
          ok: false,
          error: error.code === "23505" ? `Ya existe un reporte aprobado de ${v.code} para ${year}; la nueva carga requiere la actualización de la base (migración 016).` : error.message,
        };
      }
    }
  }
  revalidatePath("/panel/indicadores");
  revalidatePath("/panel");
  return { ok: true, count: values.length, year };
}
