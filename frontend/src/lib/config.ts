// Configuración de entorno. Sin variables de Supabase la app corre en MODO DEMO con datos
// sintéticos (src/lib/demo/demo-data.json), útil para maquetar y desplegar vistas previas.

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);
export const isDemoMode = !isSupabaseConfigured;
// La base conectada aún puede tener el conjunto sintético (seed con is_demo = true): el aviso se mantiene.
export const showsSyntheticData = isDemoMode || process.env.NEXT_PUBLIC_DATOS_SINTETICOS === "1";
// Recorrido por roles sin cuenta ("Entrar como…"): solo mientras los datos sean sintéticos.
// Con la base conectada es de solo lectura: las acciones no escriben en Supabase.
export const allowsDemoRoles = showsSyntheticData;

// Módulos visibles en navegación pero no incluidos en el MVP (PRD §5.2, backlog E9–E13).
// Se muestran como "Próximamente" hasta que su bandera se active.
export const comingSoon = {
  oportunidades: { label: "Oportunidades", phase: "MVP opcional", href: "/oportunidades" },
  conexiones: { label: "Conexiones", phase: "Fase 2 · 2027", href: "/conexiones" },
  historias: { label: "Historias", phase: "Fase 2 · 2027", href: "/historias" },
} as const;

export const DEMO_ROLE_COOKIE = "goyn_demo_role";
