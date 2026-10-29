"use server";

import { isDemoSession } from "@/lib/auth";
import { normalizePayload, registrationSteps, validateAll, type RegistrationPayload } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";

type Result =
  | { ok: true; id: string | null }
  | { ok: false; error: string; fieldErrors?: Record<string, string>; step?: number };

// Traduce errores técnicos de la base a mensajes que la organización entienda.
function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("jwt") || m.includes("session")) return "Tu sesión expiró. Vuelve a ingresar y retoma el registro.";
  if (m.includes("row-level security") || m.includes("permission denied")) return "No tienes permiso para modificar esta solicitud. Recarga la página.";
  if (m.includes("ya fue enviada")) return "Esta solicitud ya fue enviada y está en revisión del equipo GOYN.";
  if (m.includes("autorización")) return "Falta la autorización de tratamiento de datos.";
  if (m.includes("fetch failed") || m.includes("network")) return "No hay conexión con el servidor. Intenta de nuevo en un momento.";
  return `No se pudo completar la acción (${message}). Si persiste, escribe al equipo GOYN.`;
}

async function currentUserId() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  return { supabase, userId: claims?.claims?.sub ?? null };
}

// Guarda el borrador (paso a paso). En modo demo el borrador vive en el navegador.
export async function saveDraft(id: string | null, payload: RegistrationPayload, step: number): Promise<Result> {
  if (await isDemoSession()) return { ok: true, id };
  const { supabase, userId } = await currentUserId();
  if (!userId) return { ok: false, error: "Tu sesión expiró. Vuelve a ingresar." };

  if (id) {
    // Solo el borrador propio y editable: si no se actualiza ninguna fila, no se dice "guardado".
    const { data, error } = await supabase
      .from("change_request")
      .update({ payload, current_step: step })
      .eq("id", id)
      .eq("requested_by", userId)
      .in("status", ["borrador", "ajustes_solicitados"])
      .select("id");
    if (error) return { ok: false, error: friendlyError(error.message) };
    if (!data?.length) return { ok: false, error: "No se guardó: este borrador ya fue enviado o no es tuyo. Recarga la página." };
    return { ok: true, id };
  }
  const { data, error } = await supabase
    .from("change_request")
    .insert({ entity_type: "organizacion", payload, current_step: step, requested_by: userId, status: "borrador" })
    .select("id")
    .single();
  return error ? { ok: false, error: friendlyError(error.message) } : { ok: true, id: data.id };
}

export async function submitRegistration(id: string | null, raw: RegistrationPayload): Promise<Result> {
  const payload = normalizePayload(raw);
  // Validación en servidor: las mismas reglas del formulario, que reflejan las restricciones de la
  // base. Así la aprobación de GOYN no falla por un dato inválido.
  const { errors, firstStep } = validateAll(payload);
  if (firstStep >= 0) {
    return {
      ok: false,
      error: `Revisa el paso "${registrationSteps[firstStep].title}": ${Object.values(errors)[0]}`,
      fieldErrors: errors,
      step: firstStep,
    };
  }
  if (await isDemoSession()) return { ok: true, id };

  const { supabase, userId } = await currentUserId();
  if (!userId) return { ok: false, error: "Tu sesión expiró. Vuelve a ingresar." };

  // NIT único (índice organization_nit_key). Requiere la migración 017; si no existe, se omite.
  if (payload.identificacion.has_nit && payload.identificacion.nit) {
    const { data: taken, error } = await supabase.rpc("registration_nit_taken", { p_nit: payload.identificacion.nit });
    if (!error && taken === true) {
      const msg = "Ya hay una organización registrada con este NIT. Si es la tuya, escribe al equipo GOYN para que te vincule.";
      return { ok: false, error: msg, fieldErrors: { nit: msg }, step: 0 };
    }
  }

  const saved = await saveDraft(id, payload, registrationSteps.length);
  if (!saved.ok || !saved.id) return saved.ok ? { ok: false, error: "No se pudo guardar el borrador antes de enviarlo." } : saved;
  const { error } = await supabase.rpc("submit_change_request", { p_id: saved.id });
  return error ? { ok: false, error: friendlyError(error.message) } : { ok: true, id: saved.id };
}

// Borrador activo DEL USUARIO ACTUAL para retomar donde quedó. Se filtra por requested_by porque
// un admin (o un co-miembro) puede leer solicitudes ajenas por RLS.
export async function loadDraft(): Promise<{ id: string; payload: RegistrationPayload; step: number; status: string; comments: Record<string, string> } | null> {
  if (await isDemoSession()) return null;
  const { supabase, userId } = await currentUserId();
  if (!userId) return null;
  const { data } = await supabase
    .from("change_request")
    .select("id, payload, current_step, status, field_comments")
    .eq("entity_type", "organizacion")
    .eq("requested_by", userId)
    .in("status", ["borrador", "ajustes_solicitados", "enviada"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  // current_step se guarda 1-based (paso + 1); el asistente usa el índice 0-based.
  const step = Math.min(Math.max((data.current_step ?? 1) - 1, 0), registrationSteps.length - 1);
  return { id: data.id, payload: data.payload, step, status: data.status, comments: data.field_comments ?? {} };
}
