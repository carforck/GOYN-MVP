import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { allowsDemoRoles, DEMO_ROLE_COOKIE, isSupabaseConfigured } from "@/lib/config";
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
const demoViewer = async (): Promise<Viewer | null> => {
  const role = (await cookies()).get(DEMO_ROLE_COOKIE)?.value as AppRole | undefined;
  if (!role || role === "visitante") return null;
  const names: Record<AppRole, string> = {
    visitante: "",
    organizacion: "Fundación Semillas del Caribe",
    admin_goyn: "Equipo GOYN",
    superadmin: "Superadministración",
  };
  return { role, userId: "demo", email: `${role}@demo.goyn`, name: names[role], organizationIds: [], demo: true };
};

export const getViewer = cache(async (): Promise<Viewer> => {
  if (!isSupabaseConfigured) return (await demoViewer()) ?? { ...anonymous, demo: true };

  // Una cuenta real siempre tiene prioridad sobre el recorrido demo.
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return (allowsDemoRoles && (await demoViewer())) || anonymous;

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

// ¿Esta petición debe usar los datos de ejemplo y no escribir en la base?
export const isDemoSession = cache(async () => (await getViewer()).demo);

export const isAdminRole = (role: AppRole) => role === "admin_goyn" || role === "superadmin";
