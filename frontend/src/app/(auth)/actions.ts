"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_ROLE_COOKIE, isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string };

const safeNext = (value: FormDataEntryValue | null, fallback: string) => {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : fallback;
};

// Modo demo: elegir un rol para recorrer las maquetas de panel y consola.
export async function enterDemo(formData: FormData) {
  if (isSupabaseConfigured) redirect("/ingresar");
  const role = String(formData.get("role"));
  if (!["organizacion", "admin_goyn", "superadmin"].includes(role)) redirect("/ingresar");
  (await cookies()).set(DEMO_ROLE_COOKIE, role, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 8 });
  redirect(safeNext(formData.get("siguiente"), role === "organizacion" ? "/panel" : "/admin"));
}

export async function signIn(_: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  });
  if (error) return { error: "Correo o contraseña incorrectos." };
  redirect(safeNext(formData.get("siguiente"), "/panel"));
}

export async function signUp(_: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const { error } = await supabase.auth.signUp({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
    options: {
      data: { full_name: String(formData.get("full_name") ?? "") },
      emailRedirectTo: `${origin}/auth/callback?siguiente=/panel/registro`,
    },
  });
  if (error) return { error: error.message };
  return { message: "Te enviamos un correo para confirmar tu cuenta. Después podrás iniciar el registro." };
}

export async function sendMagicLink(_: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const { error } = await supabase.auth.signInWithOtp({
    email: String(formData.get("email")),
    options: { emailRedirectTo: `${origin}/auth/callback?siguiente=${safeNext(formData.get("siguiente"), "/panel")}` },
  });
  if (error) return { error: error.message };
  return { message: "Revisa tu correo: te enviamos un enlace para ingresar." };
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } else {
    (await cookies()).delete(DEMO_ROLE_COOKIE);
  }
  redirect("/");
}
