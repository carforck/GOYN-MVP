"use server";

import { isSupabaseConfigured } from "@/lib/config";
import type { RegistrationPayload } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: true; id: string | null } | { ok: false; error: string };

// Guarda el borrador (paso a paso). En modo demo el borrador vive en el navegador.
export async function saveDraft(id: string | null, payload: RegistrationPayload, step: number): Promise<Result> {
  if (!isSupabaseConfigured) return { ok: true, id };
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return { ok: false, error: "Tu sesión expiró. Vuelve a ingresar." };

  if (id) {
    const { error } = await supabase.from("change_request").update({ payload, current_step: step }).eq("id", id);
    return error ? { ok: false, error: error.message } : { ok: true, id };
  }
  const { data, error } = await supabase
    .from("change_request")
    .insert({ entity_type: "organizacion", payload, current_step: step, requested_by: userId, status: "borrador" })
    .select("id")
    .single();
  return error ? { ok: false, error: error.message } : { ok: true, id: data.id };
}

export async function submitRegistration(id: string | null, payload: RegistrationPayload): Promise<Result> {
  if (!isSupabaseConfigured) return { ok: true, id };
  const saved = await saveDraft(id, payload, 9);
  if (!saved.ok || !saved.id) return saved.ok ? { ok: false, error: "No se pudo guardar" } : saved;
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_change_request", { p_id: saved.id });
  return error ? { ok: false, error: error.message } : { ok: true, id: saved.id };
}

// Borrador activo del usuario para retomar donde quedó.
export async function loadDraft(): Promise<{ id: string; payload: RegistrationPayload; step: number; status: string; comments: Record<string, string> } | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("change_request")
    .select("id, payload, current_step, status, field_comments")
    .eq("entity_type", "organizacion")
    .in("status", ["borrador", "ajustes_solicitados", "enviada"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? { id: data.id, payload: data.payload, step: data.current_step, status: data.status, comments: data.field_comments ?? {} } : null;
}
