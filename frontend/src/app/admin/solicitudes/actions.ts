"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

export type Decision = "aprobar" | "ajustes" | "rechazar";

// La autorización la impone la función decide_change_request (solo admin GOYN).
export async function decideRequest(id: string, decision: Decision, reason: string, fieldComments: Record<string, string>) {
  if (decision === "rechazar" && !reason.trim()) return { ok: false as const, error: "El rechazo requiere un motivo." };
  if (decision === "ajustes" && !Object.keys(fieldComments).length && !reason.trim())
    return { ok: false as const, error: "Indica qué debe ajustar la organización." };
  if (!isSupabaseConfigured) return { ok: true as const };

  const supabase = await createClient();
  const { error } = await supabase.rpc("decide_change_request", {
    p_id: id,
    p_decision: decision,
    p_reason: reason || null,
    p_field_comments: fieldComments,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/solicitudes");
  revalidatePath("/", "layout");
  return { ok: true as const };
}
