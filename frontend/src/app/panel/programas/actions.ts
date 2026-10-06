"use server";

import { revalidatePath } from "next/cache";
import { getViewer, isDemoSession } from "@/lib/auth";
import { getOwnOrganization } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export type ProgramPayload = {
  name: string;
  description: string;
  modality_code: string;
  primary_area_code: string;
  area_codes: string[];
  population_codes: string[];
  territory_codes: string[];
  start_date: string;
  end_date: string;
  annual_goal: string;
  link: string;
};

type Result = { ok: true; demo?: boolean } | { ok: false; error: string };

function validate(p: ProgramPayload): string | null {
  if (!p.name.trim()) return "Escribe el nombre del programa.";
  if (p.description.trim().length < 20) return "Describe el programa en al menos 20 caracteres.";
  if (!p.modality_code) return "Elige la modalidad.";
  if (!p.primary_area_code) return "Elige el área principal.";
  if (!p.territory_codes.length) return "Elige al menos un territorio.";
  if (!p.population_codes.length) return "Elige al menos una población.";
  if (!p.start_date) return "Indica la fecha de inicio.";
  if (p.end_date && p.end_date < p.start_date) return "La fecha de cierre no puede ser anterior al inicio.";
  if (p.annual_goal && !/^\d+$/.test(p.annual_goal)) return "La meta debe ser un número entero.";
  return null;
}

// Propuesta de un programa (nuevo o editado). Se valida por el equipo GOYN antes de publicarse;
// no exige rehacer el registro completo de la organización.
export async function submitProgram(programId: string | null, payload: ProgramPayload): Promise<Result> {
  const error = validate(payload);
  if (error) return { ok: false, error };
  if (await isDemoSession()) return { ok: true, demo: true };

  const viewer = await getViewer();
  const org = await getOwnOrganization(viewer.organizationIds);
  if (!org || !viewer.userId) return { ok: false, error: "No encontramos tu organización." };

  const supabase = await createClient();
  let baseVersion: number | null = null;
  if (programId) {
    const { data } = await supabase.from("program").select("version").eq("id", programId).eq("organization_id", org.id).maybeSingle();
    if (!data) return { ok: false, error: "No encontramos ese programa." };
    baseVersion = data.version;
  }
  const clean = {
    ...payload,
    name: payload.name.trim(),
    description: payload.description.trim(),
    area_codes: [...new Set([payload.primary_area_code, ...payload.area_codes])],
    annual_goal: payload.annual_goal ? Number(payload.annual_goal) : null,
  };
  const { data: req, error: insertError } = await supabase
    .from("change_request")
    .insert({ entity_type: "programa", entity_id: programId, organization_id: org.id, base_version: baseVersion, payload: clean, requested_by: viewer.userId })
    .select("id")
    .single();
  if (insertError) {
    return { ok: false, error: insertError.code === "23505" ? "Este programa ya tiene un cambio en revisión." : "No pudimos guardar la propuesta. Intenta de nuevo." };
  }
  const { error: submitError } = await supabase.rpc("submit_change_request", { p_id: req.id });
  if (submitError) return { ok: false, error: submitError.message };
  revalidatePath("/panel/programas");
  revalidatePath("/panel");
  return { ok: true };
}

// Ocultar o mostrar un programa en el perfil público: decisión de la organización, sin validación.
export async function setProgramVisibility(programId: string, visible: boolean): Promise<Result> {
  if (await isDemoSession()) return { ok: true, demo: true };
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_program_visibility", { p_program: programId, p_visible: visible });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/panel/programas");
  revalidatePath("/panel");
  return { ok: true };
}
