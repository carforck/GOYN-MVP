import { PGlite } from "@electric-sql/pglite";
import { postgis } from "@electric-sql/pglite-postgis";
import { unaccent } from "@electric-sql/pglite/contrib/unaccent";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync, readdirSync } from "node:fs";
// Uso: node tests/run-migrations.mjs <carpeta-migraciones> [seed.sql] [./prueba.mjs]
// Aplica las migraciones sobre PGlite (PostgreSQL + PostGIS en WASM) con stubs mínimos de Supabase.
const dir = process.argv[2];
const db = new PGlite({ extensions: { postgis, unaccent, pgcrypto } });
// Stubs mínimos del entorno Supabase.
await db.exec(`
create schema extensions; create schema auth; create schema storage;
create role anon; create role authenticated; create role service_role;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
create or replace function storage.foldername(name text) returns text[] language sql as $$ select string_to_array(name, '/') $$;
create schema realtime;
create table realtime.sent (id serial primary key, payload jsonb, event text, topic text, private boolean);
create or replace function realtime.send(payload jsonb, event text, topic text, private boolean default true) returns void
  language sql as $$ insert into realtime.sent (payload, event, topic, private) values (payload, event, topic, private) $$;
`);
for (const f of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
  try { await db.exec(readFileSync(`${dir}/${f}`, "utf8")); console.log("OK ", f); }
  catch (e) { console.log("ERR", f, e.message); process.exit(1); }
}
if (process.argv[3]) {
  try { await db.exec(readFileSync(process.argv[3], "utf8")); console.log("OK seed"); } catch (e) { console.log("ERR seed", e.message); process.exit(1); }
}
if (process.argv[4]) { await (await import(new URL(process.argv[4], import.meta.url))).default(db); }
