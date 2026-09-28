// Genera supabase/migrations/..._catalogos.sql desde scripts/catalogs.mjs.
// Solo debe regenerarse antes de aplicar la migración por primera vez; después,
// los cambios de catálogo van en una migración nueva (los códigos usados no se borran).
import { writeFileSync } from "node:fs";
import * as c from "./catalogs.mjs";

const q = (v) => (v === null || v === undefined ? "null" : `'${String(v).replaceAll("'", "''")}'`);
const rows = (list, fn) => list.map((x, i) => `  (${fn(x, i + 1).join(", ")})`).join(",\n");

const simple = (table, list, extra = []) => `
create table public.${table} (
  code text primary key,
  label text not null,
  description text,
${extra.map((e) => `  ${e.ddl},\n`).join("")}  sort_order int not null default 0,
  active boolean not null default true
);
insert into public.${table} (code, label, description${extra.map((e) => `, ${e.col}`).join("")}, sort_order) values
${rows(list, (x, i) => [q(x.code), q(x.label), q(x.description), ...extra.map((e) => e.val(x)), i])};
`;

let sql = `-- GOYN Conecta BAQ · 002 · Catálogos del marco común (generado por scripts/build-catalog-migration.mjs).
-- Fuente: Instrumento de mapeo de actores (preguntas 10–43) y PRD v1.0 §7.2.
-- Regla: los códigos son estables; un valor usado no se borra, se desactiva (active = false).
`;
sql += simple("cat_org_type", c.orgTypes);
sql += simple("cat_role", c.roles, [
  { col: "icon", ddl: "icon text", val: (x) => q(x.icon) },
  { col: "color", ddl: "color text", val: (x) => q(x.color) },
]);
sql += simple("cat_scope", c.scopes);
sql += simple("cat_impact_area", c.impactAreas, [{ col: "color", ddl: "color text", val: (x) => q(x.color) }]);
sql += simple("cat_problem", c.problems, [
  { col: "area_code", ddl: "area_code text not null references public.cat_impact_area(code)", val: (x) => q(x.area) },
]);
sql += simple("cat_population", c.populations);
sql += simple("cat_relation_type", c.relationTypes);
sql += simple("cat_modality", c.modalities);
sql += simple("cat_data_management", c.dataManagementLevels);
sql += simple("cat_tenure", c.collaborativeTenure);
sql += simple("cat_goyn_space", c.goynSpaces);

sql += `
create table public.cat_territory (
  code text primary key,
  label text not null,
  municipality text,
  centroid extensions.geography(point, 4326),
  sort_order int not null default 0,
  active boolean not null default true
);
insert into public.cat_territory (code, label, municipality, centroid, sort_order) values
${rows(c.territories, (x, i) => [
  q(x.code), q(x.label), q(x.municipality),
  x.lat == null ? "null" : `extensions.st_setsrid(extensions.st_makepoint(${x.lng}, ${x.lat}), 4326)::extensions.geography`,
  i,
])};

-- Definiciones versionadas de indicadores (arquitectura de datos §3).
create table public.indicator_definition (
  code text not null,
  version int not null default 1,
  label text not null,
  definition text not null,
  unit text not null,
  color text,
  periodicity text not null default 'trimestral',
  valid_from date not null default current_date,
  valid_to date,
  primary key (code, version)
);
insert into public.indicator_definition (code, version, label, definition, unit, color) values
${rows(c.indicators, (x) => [q(x.code), "1", q(x.label), q(x.definition), q(x.unit), q(x.color)])};
`;

const out = "supabase/migrations/20260928000002_catalogos.sql";
writeFileSync(out, sql);
console.log("escrito", out);
