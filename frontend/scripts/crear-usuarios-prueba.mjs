#!/usr/bin/env node
// GOYN Conecta BAQ · Usuarios de prueba por rol (#15, prueba GOYN 2026-10-30).
//
// Crea (o reutiliza) 3 cuentas en Supabase Auth con el correo ya confirmado y les asigna el rol de
// plataforma que define el esquema (public.profile.platform_role, migraciones 001/003/005):
//   prueba.organizacion@<dominio>  -> 'usuario'     (se ve como "organización"; se registra como entidad
//                                                    en /panel/registro y queda como titular al aprobarse)
//   prueba.goyn@<dominio>          -> 'admin_goyn'  (bandeja /admin/solicitudes)
//   prueba.superadmin@<dominio>    -> 'superadmin'  (consola completa + catálogos)
//
// Seguridad:
// - La llave service_role / secret se lee SOLO de la variable de entorno SUPABASE_SERVICE_ROLE_KEY.
//   No se guarda en archivos ni se imprime. No la pegues en el chat.
// - Las contraseñas se generan aquí (crypto) y se imprimen UNA vez, al final, en esta terminal.
//   No se escriben en disco. Envíalas a cada persona por canal privado.
//
// Idempotente: si el correo ya existe, no se duplica ni se cambia su contraseña (salvo --rotar);
// solo se confirma el correo y se ajusta el rol.
//
// Uso (desde frontend/):
//   read -rs SUPABASE_SERVICE_ROLE_KEY && export SUPABASE_SERVICE_ROLE_KEY   # pega la llave + Enter (no se ve)
//   node scripts/crear-usuarios-prueba.mjs --dominio=ejemplo.org
//   node scripts/crear-usuarios-prueba.mjs --dominio=ejemplo.org --rotar            # nueva contraseña a las 3
//   node scripts/crear-usuarios-prueba.mjs --dominio=ejemplo.org --rotar=goyn,org   # solo a esas
//   node scripts/crear-usuarios-prueba.mjs --dominio=ejemplo.org --verificar        # solo lectura
//   unset SUPABASE_SERVICE_ROLE_KEY
//
// Opcionales: --prefijo=prueba (parte local del correo), SUPABASE_URL (por defecto el proyecto GoynMvp).

import { randomInt } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const PROJECT_REF = "tdcyyqziuwcztsbbnqtl"; // GoynMvp
const DEFAULT_URL = `https://${PROJECT_REF}.supabase.co`;

// ─── Argumentos ──────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, "").split("=");
    return [k, v.length ? v.join("=") : true];
  }),
);

if (args.help || args.h) {
  console.log("Uso: node scripts/crear-usuarios-prueba.mjs --dominio=<dominio> [--rotar[=org,goyn,superadmin]] [--verificar] [--prefijo=prueba]");
  process.exit(0);
}

const domain = typeof args.dominio === "string" ? args.dominio.trim().toLowerCase().replace(/^@/, "") : "";
if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
  console.error("Falta --dominio=<dominio> válido (ej. --dominio=goynbarranquilla.org).");
  process.exit(1);
}
const prefix = typeof args.prefijo === "string" && args.prefijo ? args.prefijo : "prueba";
const verifyOnly = Boolean(args.verificar);

const ACCOUNTS = [
  { key: "org", email: `${prefix}.organizacion@${domain}`, role: "usuario", name: "Prueba Organización", label: "Organización (usuario normal)" },
  { key: "goyn", email: `${prefix}.goyn@${domain}`, role: "admin_goyn", name: "Prueba Equipo GOYN", label: "Equipo GOYN (admin_goyn)" },
  { key: "superadmin", email: `${prefix}.superadmin@${domain}`, role: "superadmin", name: "Prueba Superadministración", label: "Superadministración (superadmin)" },
];

const rotateAll = args.rotar === true;
const rotateSet = new Set(typeof args.rotar === "string" ? args.rotar.split(",").map((s) => s.trim()) : []);
const shouldRotate = (acc) => rotateAll || rotateSet.has(acc.key);
for (const k of rotateSet) {
  if (!ACCOUNTS.some((a) => a.key === k)) {
    console.error(`--rotar: "${k}" no es válido. Usa org, goyn o superadmin.`);
    process.exit(1);
  }
}

// ─── Llave y proyecto ────────────────────────────────────────────────────────
const url = (process.env.SUPABASE_URL || DEFAULT_URL).replace(/\/$/, "");
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
if (!serviceKey) {
  console.error(
    "Falta SUPABASE_SERVICE_ROLE_KEY en el entorno.\n" +
      "Cópiala de Supabase → proyecto GoynMvp → Project Settings → API Keys (service_role o secret)\n" +
      "y expórtala SOLO en esta terminal:  read -rs SUPABASE_SERVICE_ROLE_KEY && export SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}
if (serviceKey.startsWith("sb_publishable_")) {
  console.error("Esa es la llave publishable (pública). Se necesita la service_role / secret.");
  process.exit(1);
}
if (!url.includes(PROJECT_REF)) {
  console.error(`SUPABASE_URL (${url}) no es el proyecto GoynMvp (${PROJECT_REF}). Abortando.`);
  process.exit(1);
}
// Llave service_role clásica (JWT): comprobar que sea de este proyecto y de rol service_role.
if (serviceKey.split(".").length === 3) {
  try {
    const claims = JSON.parse(Buffer.from(serviceKey.split(".")[1], "base64url").toString("utf8"));
    if (claims.ref && claims.ref !== PROJECT_REF) {
      console.error(`La llave pertenece a otro proyecto (${claims.ref}), no a GoynMvp. Abortando.`);
      process.exit(1);
    }
    if (claims.role && claims.role !== "service_role") {
      console.error(`La llave tiene rol "${claims.role}"; se necesita service_role. Abortando.`);
      process.exit(1);
    }
  } catch {
    /* formato no JWT: se valida con la primera llamada */
  }
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

// ─── Utilidades ──────────────────────────────────────────────────────────────
// 20 caracteres sin ambiguos (0/O, 1/l/I), con al menos una minúscula, mayúscula, dígito y símbolo.
function strongPassword(length = 20) {
  const sets = ["abcdefghijkmnopqrstuvwxyz", "ABCDEFGHJKLMNPQRSTUVWXYZ", "23456789", "-_.!@#%+="];
  const all = sets.join("");
  const chars = sets.map((s) => s[randomInt(s.length)]);
  while (chars.length < length) chars.push(all[randomInt(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

async function findUserByEmail(email) {
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`No se pudo listar usuarios: ${error.message}`);
    const hit = data.users.find((u) => (u.email ?? "").toLowerCase() === email);
    if (hit) return hit;
    if (data.users.length < 1000) return null;
  }
}

async function readProfile(id) {
  const { data, error } = await supabase.from("profile").select("id, email, full_name, platform_role").eq("id", id).maybeSingle();
  if (error) throw new Error(`No se pudo leer public.profile: ${error.message}`);
  return data;
}

async function memberships(userId) {
  const { data, error } = await supabase
    .from("organization_member")
    .select("role, status, organization:organization(name, slug, status)")
    .eq("user_id", userId);
  if (error) return [];
  return data ?? [];
}

// ─── Proceso ─────────────────────────────────────────────────────────────────
const results = [];

for (const acc of ACCOUNTS) {
  const r = { ...acc, action: "", password: null, profileRole: null, orgs: [] };
  let user = await findUserByEmail(acc.email);

  if (verifyOnly) {
    if (!user) {
      r.action = "NO EXISTE";
    } else {
      const prof = await readProfile(user.id);
      r.profileRole = prof?.platform_role ?? "(sin perfil)";
      r.action = user.email_confirmed_at ? "existe · correo confirmado" : "existe · correo SIN confirmar";
      r.orgs = await memberships(user.id);
    }
    results.push(r);
    continue;
  }

  if (!user) {
    r.password = strongPassword();
    const { data, error } = await supabase.auth.admin.createUser({
      email: acc.email,
      password: r.password,
      email_confirm: true,
      user_metadata: { full_name: acc.name },
    });
    if (error) throw new Error(`No se pudo crear ${acc.email}: ${error.message}`);
    user = data.user;
    r.action = "creado";
  } else {
    const update = { email_confirm: true };
    if (shouldRotate(acc)) {
      r.password = strongPassword();
      update.password = r.password;
    }
    const { error } = await supabase.auth.admin.updateUserById(user.id, update);
    if (error) throw new Error(`No se pudo actualizar ${acc.email}: ${error.message}`);
    r.action = r.password ? "ya existía · contraseña rotada" : "ya existía · contraseña SIN cambios";
  }

  // El trigger on_auth_user_created crea public.profile; si faltara, se crea aquí.
  let prof = await readProfile(user.id);
  if (!prof) {
    const { error } = await supabase.from("profile").insert({ id: user.id, email: acc.email, full_name: acc.name, platform_role: acc.role });
    if (error) throw new Error(`No se pudo crear el perfil de ${acc.email}: ${error.message}`);
  } else if (prof.platform_role !== acc.role || !prof.full_name) {
    // Con service_role auth.uid() es nulo: guard_platform_role permite el cambio.
    const { error } = await supabase
      .from("profile")
      .update({ platform_role: acc.role, full_name: prof.full_name || acc.name })
      .eq("id", user.id);
    if (error) throw new Error(`No se pudo asignar el rol a ${acc.email}: ${error.message}`);
  }
  prof = await readProfile(user.id);
  r.profileRole = prof?.platform_role ?? "(sin perfil)";
  r.orgs = await memberships(user.id);
  results.push(r);
}

// ─── Resumen ─────────────────────────────────────────────────────────────────
console.log(`\nProyecto: ${url}\n`);
for (const r of results) {
  const ok = r.profileRole === r.role ? "OK" : `ESPERADO ${r.role}`;
  console.log(`• ${r.label}\n    ${r.email}\n    ${r.action} · platform_role=${r.profileRole ?? "-"} (${ok})`);
  for (const m of r.orgs) {
    console.log(`    membresía: ${m.role}/${m.status} en ${m.organization?.name ?? "?"} (${m.organization?.status ?? "?"})`);
  }
}

const withPasswords = results.filter((r) => r.password);
if (withPasswords.length) {
  console.log("\n──────── CONTRASEÑAS (se muestran una sola vez; no se guardan en ningún archivo) ────────");
  for (const r of withPasswords) console.log(`${r.email}\t${r.password}`);
  console.log("──────────────────────────────────────────────────────────────────────────────────────────");
  console.log("Envíalas por canal privado (una por persona). Luego limpia la pantalla (clear) y ejecuta: unset SUPABASE_SERVICE_ROLE_KEY");
} else if (!verifyOnly) {
  console.log("\nNo se generaron contraseñas nuevas (las cuentas ya existían). Usa --rotar para asignar nuevas.");
}
