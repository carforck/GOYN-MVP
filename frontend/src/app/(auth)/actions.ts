"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { allowsDemoRoles, DEMO_ROLE_COOKIE, isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { resolveLoginEmail } from "@/app/(auth)/cuentas-prueba";

export type AuthState = { error?: string; message?: string };

const safeNext = (value: FormDataEntryValue | null, fallback: string) => {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : fallback;
};

// Modo demo: elegir un rol para recorrer las maquetas de panel y consola.
export async function enterDemo(formData: FormData) {
  if (!allowsDemoRoles) redirect("/ingresar");
  const role = String(formData.get("role"));
  if (!["organizacion", "admin_goyn", "superadmin"].includes(role)) redirect("/ingresar");
  (await cookies()).set(DEMO_ROLE_COOKIE, role, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 8 });
  redirect(safeNext(formData.get("siguiente"), role === "organizacion" ? "/panel" : "/admin"));
}

export async function signIn(_: AuthState, formData: FormData): Promise<AuthState> {
  // El campo acepta correo o usuario corto de las cuentas de prueba (NEXT_PUBLIC_CUENTAS_PRUEBA).
  const email = resolveLoginEmail(String(formData.get("email") ?? ""));
  if (!email) return { error: "Usuario no reconocido. Escribe tu correo electrónico completo." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: String(formData.get("password")),
  });
  if (error) return { error: "Correo o contraseña incorrectos." };
  (await cookies()).delete(DEMO_ROLE_COOKIE);
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

// "¿Olvidaste tu contraseña?": envía un enlace que inicia sesión y lleva a /cambiar-clave.
export async function requestPasswordReset(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email.includes("@")) return { error: "Escribe el correo con el que ingresas." };
  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback?siguiente=/cambiar-clave` });
  // Mismo mensaje exista o no la cuenta, para no revelar qué correos están registrados.
  return { message: "Si ese correo tiene una cuenta, te enviamos un enlace para crear una nueva contraseña. Revisa también la carpeta de spam." };
}

// Primer ingreso con clave inicial (o cambio voluntario): guarda la clave nueva y quita la marca.
export async function changePassword(_: AuthState, formData: FormData): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return { error: "Usa letras y números en la contraseña." };
  if (password !== confirm) return { error: "Las contraseñas no coinciden." };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/ingresar?siguiente=/cambiar-clave");

  const { error } = await supabase.auth.updateUser({ password, data: { must_change_password: false } });
  if (error) {
    if (error.code === "same_password") return { error: "La nueva contraseña debe ser diferente a la inicial." };
    if (error.code === "weak_password") return { error: "La contraseña es muy débil. Prueba con una más larga." };
    return { error: "No pudimos guardar la contraseña. Intenta de nuevo." };
  }
  // Renueva el token para que la marca ya no aparezca en la sesión.
  await supabase.auth.refreshSession();
  redirect(safeNext(formData.get("siguiente"), "/panel"));
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  (await cookies()).delete(DEMO_ROLE_COOKIE);
  redirect("/");
}
