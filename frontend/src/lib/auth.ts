import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { DEMO_ROLE_COOKIE, isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/types";

export type Viewer = {
  role: AppRole;
  userId: string | null;
  email: string | null;
  name: string | null;
  organizationIds: string[];
  demo: boolean;
};

const anonymous: Viewer = { role: "visitante", userId: null, email: null, name: null, organizationIds: [], demo: false };

// Resuelve quién navega. En modo demo el rol sale de una cookie elegida en /ingresar,
// para poder recorrer las maquetas de panel y consola sin backend.
export const getViewer = cache(async (): Promise<Viewer> => {
  if (!isSupabaseConfigured) {
    const role = (await cookies()).get(DEMO_ROLE_COOKIE)?.value as AppRole | undefined;
    if (!role || role === "visitante") return { ...anonymous, demo: true };
    const names: Record<AppRole, string> = {
      visitante: "",
      organizacion: "Fundación Semillas del Caribe",
      admin_goyn: "Equipo GOYN",
      superadmin: "Superadministración",
    };
    return { role, userId: "demo", email: `${role}@demo.goyn`, name: names[role], organizationIds: [], demo: true };
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return anonymous;

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from("profile").select("full_name, email, platform_role").eq("id", userId).single(),
    supabase.from("organization_member").select("organization_id").eq("user_id", userId).eq("status", "activo"),
  ]);
  const platformRole = profile?.platform_role as "usuario" | "admin_goyn" | "superadmin" | undefined;
  return {
    role: platformRole === "admin_goyn" || platformRole === "superadmin" ? platformRole : "organizacion",
    userId,
    email: profile?.email ?? null,
    name: profile?.full_name ?? null,
    organizationIds: (memberships ?? []).map((m) => m.organization_id),
    demo: false,
  };
});

export const isAdminRole = (role: AppRole) => role === "admin_goyn" || role === "superadmin";
