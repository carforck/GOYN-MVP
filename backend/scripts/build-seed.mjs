// Genera el conjunto de demostración (arquitectura de datos §9, paso 6):
//   - supabase/seed.sql                         → carga en Supabase (is_demo = true)
//   - ../frontend/src/lib/demo/demo-data.json   → modo demo del frontend (sin Supabase)
// Todas las organizaciones son SINTÉTICAS: nombres, cifras y relaciones inventados.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import * as cat from "./catalogs.mjs";

// Contornos oficiales (OSM) de las localidades: cada punto de prueba debe caer DENTRO de la suya
// (antes una organización quedaba en el mar y otras en la localidad vecina).
const LOCALITIES = JSON.parse(
  readFileSync(fileURLToPath(new URL("../../frontend/public/geo/localidades.geojson", import.meta.url)), "utf8"),
);
const inRing = (x, y, r) => {
  let c = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i], [xj, yj] = r[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const inLocality = (code, lng, lat) => {
  const f = LOCALITIES.features.find((x) => x.properties.code === code);
  return !f || f.geometry.coordinates.some((poly) => inRing(lng, lat, poly[0]));
};
// Desplazamiento aleatorio alrededor del centro; si sale del contorno se acerca al centro.
function insideLocality(home, dLat, dLng) {
  for (let k = 1; k > 0.02; k *= 0.6) {
    const lat = +(home.lat + dLat * k).toFixed(5), lng = +(home.lng + dLng * k).toFixed(5);
    if (inLocality(home.code, lng, lat)) return { lat, lng };
  }
  return { lat: home.lat, lng: home.lng };
}

// PRNG determinista para que el seed sea reproducible.
let seed = 20260409;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (list) => list[Math.floor(rand() * list.length)];
const sample = (list, min, max) => {
  const n = min + Math.floor(rand() * (max - min + 1));
  return [...list].sort(() => rand() - 0.5).slice(0, Math.min(n, list.length));
};
const int = (a, b) => a + Math.floor(rand() * (b - a + 1));
const uuid = (key) => {
  const h = createHash("sha1").update("goyn-demo:" + key).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
const slugify = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// [nombre, tipo, rol principal]
const orgSeeds = [
  ["Fundación Semillas del Caribe", "privado_fundacion", "implementador"],
  ["Fundación Puerta de Oro Joven", "privado_fundacion", "financiador"],
  ["Corporación Manos que Tejen", "comunitaria", "implementador"],
  ["Colectivo Voces de la Arenosa", "colectivo_juvenil", "juventud"],
  ["Colectivo Tambó Urbano", "colectivo_juvenil", "juventud"],
  ["Red Juvenil Bocas de Ceniza", "colectivo_juvenil", "embajador"],
  ["Grupo Empresarial Brisas del Río", "privado_empresa", "financiador"],
  ["Logística Costa Norte S.A.S.", "privado_empresa", "implementador"],
  ["Tecnologías Cayena", "privado_empresa", "implementador"],
  ["Cámara Gremial del Atlántico", "privado_gremio", "articulador"],
  ["Asociación de Industriales del Caribe", "privado_gremio", "tomador_decision"],
  ["Secretaría Distrital de Juventud (demo)", "publico_local", "tomador_decision"],
  ["Oficina Departamental de Empleo (demo)", "publico_local", "articulador"],
  ["Agencia Nacional de Formación (demo)", "publico_nacional", "implementador"],
  ["Institución Educativa Rebolo Futuro", "educativa", "implementador"],
  ["Universidad Ribera del Magdalena", "educativa", "generador_conocimiento"],
  ["Instituto Técnico Mar Caribe", "educativa", "implementador"],
  ["Centro de Investigación Juventud y Territorio", "educativa", "evaluador"],
  ["Agencia de Empleo Oportunidad Costa", "bolsa_empleo", "articulador"],
  ["Bolsa de Talento Barrio Abajo", "bolsa_empleo", "implementador"],
  ["Fundación Mar Abierto", "privado_fundacion", "implementador"],
  ["Fundación Luz de la Ciénaga", "privado_fundacion", "implementador"],
  ["Corporación Sabanagrande Emprende", "comunitaria", "implementador"],
  ["Asociación Mujeres del Suroriente", "comunitaria", "embajador"],
  ["Corporación Deporte y Paz Soledad", "comunitaria", "implementador"],
  ["Colectivo Cine Barrial Malambo", "colectivo_juvenil", "juventud"],
  ["Colectivo Hip Hop La Chinita", "colectivo_juvenil", "juventud"],
  ["Fundación Palabra y Territorio", "privado_fundacion", "generador_conocimiento"],
  ["Observatorio Caribe Joven", "educativa", "evaluador"],
  ["Fundación Pescadores de Sueños", "privado_fundacion", "implementador"],
  ["Cooperativa Galapa Produce", "comunitaria", "implementador"],
  ["Fundación Salud Mental Costa", "privado_fundacion", "implementador"],
  ["Laboratorio Digital Puerto", "privado_empresa", "implementador"],
  ["Red de Orientadores del Atlántico", "comunitaria", "articulador"],
  ["Fundación Casa del Barrio", "privado_fundacion", "implementador"],
  ["Mesa Empresarial por la Juventud", "privado_gremio", "embajador"],
  ["Fondo Social Caribe Próspero", "privado_fundacion", "financiador"],
  ["Colectivo Ciencia en la Calle", "colectivo_juvenil", "generador_conocimiento"],
  ["Escuela de Oficios Villa Carolina", "educativa", "implementador"],
  ["Fundación Rutas de Vida", "privado_fundacion", "implementador"],
  ["Plataforma Emprende Joven BAQ", "privado_empresa", "articulador"],
  ["Consejo Distrital de Juventud (demo)", "publico_local", "juventud"],
];

const programNames = {
  educacion: ["Ruta de nivelación académica", "Aulas que conectan", "Bachillerato flexible joven"],
  ingresos: ["Primer empleo Caribe", "Emprende en tu barrio", "Talento para la industria", "Incubadora juvenil"],
  participacion: ["Escuela de liderazgo juvenil", "Jóvenes que deciden", "Laboratorio de incidencia"],
  orientacion: ["Brújula vocacional", "Mi proyecto de vida", "Ferias de rutas formativas"],
  entornos: ["Cancha segura", "Arte y convivencia", "Barrios en paz"],
  bienestar: ["Mente sana joven", "Salud en tu parche", "Acompañamiento psicosocial"],
  inclusion_digital: ["Código Caribe", "Conectados al futuro", "Habilidades digitales para el empleo"],
};

const territoriesGeo = cat.territories.filter((t) => t.lat != null);
const areaCodes = cat.impactAreas.map((a) => a.code);
const periods = [
  ["2025-T1", "2025-01-01", "2025-03-31"], ["2025-T2", "2025-04-01", "2025-06-30"],
  ["2025-T3", "2025-07-01", "2025-09-30"], ["2025-T4", "2025-10-01", "2025-12-31"],
  ["2026-T1", "2026-01-01", "2026-03-31"], ["2026-T2", "2026-04-01", "2026-06-30"],
];

const organizations = [];
const programs = [];
const reports = [];

for (const [name, type, primaryRole] of orgSeeds) {
  const id = uuid(name);
  const home = pick(territoriesGeo);
  const extraTerr = sample(cat.territories.map((t) => t.code).filter((c) => c !== home.code), 0, 3);
  const areas = sample(areaCodes, 1, 3);
  const problems = cat.problems.filter((p) => areas.includes(p.area)).filter(() => rand() > 0.45).map((p) => p.code);
  const roleCodes = [primaryRole, ...sample(cat.roles.map((r) => r.code).filter((r) => r !== primaryRole), 0, 2)];
  // Líneas de trabajo coherentes con las áreas de impacto de la organización.
  const linesByArea = {
    educacion: ["formacion_cultura"], ingresos: ["empleo_juvenil", "emprendimiento_juvenil"], participacion: ["agencia_juvenil", "narrativas"],
    orientacion: ["orientacion_socio_ocupacional"], entornos: ["conexion_directa"], bienestar: ["conexion_directa"], inclusion_digital: ["formacion_cultura"],
  };
  const workLineCodes = [...new Set([...areas.flatMap((a) => linesByArea[a] ?? []), ...(primaryRole === "evaluador" || primaryRole === "generador_conocimiento" ? ["investigacion_mercado"] : [])])];
  const updated = new Date(Date.UTC(2026, int(3, 8), int(1, 27))).toISOString();
  const org = {
    id,
    slug: slugify(name),
    name,
    description: `${name} es una organización de demostración del ecosistema juvenil de Barranquilla y su área metropolitana. Trabaja en ${areas
      .map((a) => cat.impactAreas.find((x) => x.code === a).label.toLowerCase())
      .join(", ")} con jóvenes de ${home.label.replace(/^(BAQ|AMB) – /, "")}.`,
    mission: "Abrir oportunidades reales para jóvenes con potencial mediante trabajo articulado con el Colaborativo.",
    org_type_code: type,
    primary_role_code: primaryRole,
    role_codes: [...new Set(roleCodes)],
    territory_codes: [home.code, ...extraTerr],
    area_codes: areas,
    problem_codes: problems,
    work_line_codes: workLineCodes,
    scope_code: pick(["local", "local", "departamental", "nacional"]),
    website: null,
    social: {},
    logo_path: null,
    contact_email_public: `contacto@${slugify(name).slice(0, 18)}.demo`,
    is_demo: true,
    verified_at: updated,
    updated_at: updated,
    location_territory_code: home.code,
    municipality: home.municipality,
    ...insideLocality(home, (rand() - 0.5) * 0.022, (rand() - 0.5) * 0.022),
    location_precision: "aproximada",
  };
  organizations.push(org);

  const nProg = type.startsWith("publico") || primaryRole === "financiador" ? int(1, 2) : int(1, 3);
  for (let i = 0; i < nProg; i++) {
    const area = i === 0 ? areas[0] : pick(areas);
    const pname = pick(programNames[area]);
    const pid = uuid(name + ":" + pname + i);
    const goal = int(4, 60) * 10;
    programs.push({
      id: pid,
      organization_id: id,
      organization_slug: org.slug,
      organization_name: name,
      name: pname,
      description: `Programa de demostración de ${cat.impactAreas.find((a) => a.code === area).label.toLowerCase()} para jóvenes de 14 a 28 años.`,
      modality_code: pick(["presencial", "presencial", "hibrido", "virtual"]),
      primary_area_code: area,
      area_codes: [...new Set([area, ...sample(areas, 0, 1)])],
      population_codes: [...new Set(["general", ...sample(cat.populations.map((p) => p.code).slice(1), 0, 2)])],
      territory_codes: sample(org.territory_codes, 1, 2),
      start_date: `202${int(3, 5)}-0${int(1, 9)}-01`,
      end_date: rand() > 0.5 ? "2026-12-15" : null,
      annual_goal: goal,
      link: null,
      updated_at: updated,
    });
    for (const [label, start, end] of periods) {
      const connected = Math.round((goal / 4) * (0.6 + rand() * 0.8));
      const strengthened = Math.round(connected * (0.3 + rand() * 0.35));
      const transformed = area === "ingresos" || area === "orientacion" ? Math.round(strengthened * (0.15 + rand() * 0.3)) : 0;
      for (const [code, value] of [["conectados", connected], ["fortalecidos", strengthened], ["transformados", transformed]]) {
        if (code === "transformados" && value === 0) continue;
        reports.push({
          id: uuid(pid + label + code),
          organization_id: id,
          organization_slug: org.slug,
          org_type_code: type,
          program_id: pid,
          primary_area_code: area,
          territory_codes: programs.at(-1).territory_codes,
          indicator_code: code,
          period_label: label,
          period_start: start,
          period_end: end,
          value,
          value_women: Math.round(value * (0.45 + rand() * 0.15)),
          source: "Dato sintético de demostración",
        });
      }
    }
  }
}

const relations = [];
const seen = new Set();
for (let i = 0; i < 70; i++) {
  const a = pick(organizations);
  const b = pick(organizations);
  const type = pick(["socio", "aliado", "aliado", "colaborador", "colaborador"]);
  const key = [a.id, b.id].sort().join() + type;
  if (a.id === b.id || seen.has(key)) continue;
  seen.add(key);
  relations.push({
    id: uuid("rel" + key),
    source_org_id: a.id, source_slug: a.slug, source_name: a.name,
    target_org_id: b.id, target_slug: b.slug, target_name: b.name,
    relation_type_code: type,
    intensity: type === "socio" ? int(4, 5) : type === "aliado" ? int(2, 4) : int(1, 2),
    since: `202${int(2, 5)}-0${int(1, 9)}-01`,
  });
}

// Solicitudes de ejemplo para maquetar la bandeja del equipo GOYN en modo demo.
const sampleRequests = [
  { id: uuid("req1"), entity_type: "organizacion", status: "enviada", organization_name: "Fundación Nuevo Amanecer Caribe",
    org_type_code: "privado_fundacion", territory: "amb_soledad", submitted_at: "2026-09-24T15:20:00Z", kind: "alta" },
  { id: uuid("req2"), entity_type: "organizacion", status: "enviada", organization_name: organizations[3].name,
    org_type_code: organizations[3].org_type_code, territory: organizations[3].location_territory_code, submitted_at: "2026-09-26T10:05:00Z", kind: "actualizacion",
    changes: [
      { field: "Descripción", before: organizations[3].description, after: organizations[3].description + " Desde 2026 lidera la mesa de conexión juvenil del suroriente." },
      { field: "Territorios", before: "BAQ – Sur Oriente", after: "BAQ – Sur Oriente, AMB – Soledad" },
    ] },
  { id: uuid("req3"), entity_type: "organizacion", status: "ajustes_solicitados", organization_name: "Colectivo Olas de Puerto",
    org_type_code: "colectivo_juvenil", territory: "amb_puerto_colombia", submitted_at: "2026-09-18T09:40:00Z", kind: "alta" },
  { id: uuid("req4"), entity_type: "reporte_indicador", status: "enviada", organization_name: organizations[0].name,
    org_type_code: organizations[0].org_type_code, territory: organizations[0].location_territory_code, submitted_at: "2026-09-27T17:12:00Z", kind: "indicador" },
];

// ─── Salidas ────────────────────────────────────────────────────────────────
const q = (v) => (v === null || v === undefined ? "null" : typeof v === "number" ? String(v) : `'${String(v).replaceAll("'", "''")}'`);
const arr = (a) => `array[${a.map(q).join(",")}]::text[]`;
let sql = `-- GOYN Conecta BAQ · Conjunto de DEMOSTRACIÓN (sintético). Generado por scripts/build-seed.mjs.
-- Todas las filas llevan is_demo = true. Para retirarlo: delete from public.organization where is_demo;
begin;
`;
for (const o of organizations) {
  sql += `insert into public.organization (id, slug, name, description, mission, org_type_code, primary_role_code, scope_code, contact_email_public, is_demo, verified_at, updated_at)
values (${q(o.id)}, ${q(o.slug)}, ${q(o.name)}, ${q(o.description)}, ${q(o.mission)}, ${q(o.org_type_code)}, ${q(o.primary_role_code)}, ${q(o.scope_code)}, ${q(o.contact_email_public)}, true, ${q(o.verified_at)}, ${q(o.updated_at)});
insert into public.organization_role select ${q(o.id)}, unnest(${arr(o.role_codes)});
insert into public.organization_territory select ${q(o.id)}, unnest(${arr(o.territory_codes)});
insert into public.organization_area select ${q(o.id)}, unnest(${arr(o.area_codes)});
${o.problem_codes.length ? `insert into public.organization_problem select ${q(o.id)}, unnest(${arr(o.problem_codes)});\n` : ""}${o.work_line_codes.length ? `insert into public.organization_work_line select ${q(o.id)}, unnest(${arr(o.work_line_codes)});\n` : ""}insert into public.location (organization_id, is_primary, municipality, territory_code, geom, precision, source)
values (${q(o.id)}, true, ${q(o.municipality)}, ${q(o.location_territory_code)}, extensions.st_setsrid(extensions.st_makepoint(${o.lng}, ${o.lat}), 4326)::extensions.geography, 'aproximada', 'demo');
`;
}
for (const p of programs) {
  sql += `insert into public.program (id, organization_id, name, description, modality_code, primary_area_code, start_date, end_date, annual_goal)
values (${q(p.id)}, ${q(p.organization_id)}, ${q(p.name)}, ${q(p.description)}, ${q(p.modality_code)}, ${q(p.primary_area_code)}, ${q(p.start_date)}, ${q(p.end_date)}, ${p.annual_goal});
insert into public.program_area select ${q(p.id)}, unnest(${arr(p.area_codes)});
insert into public.program_population select ${q(p.id)}, unnest(${arr(p.population_codes)});
insert into public.program_territory select ${q(p.id)}, unnest(${arr(p.territory_codes)});
`;
}
for (const r of relations) {
  sql += `insert into public.relation (id, source_org_id, target_org_id, relation_type_code, intensity, since) values (${q(r.id)}, ${q(r.source_org_id)}, ${q(r.target_org_id)}, ${q(r.relation_type_code)}, ${r.intensity}, ${q(r.since)}) on conflict do nothing;\n`;
}
for (const r of reports) {
  sql += `insert into public.indicator_report (id, organization_id, program_id, indicator_code, period_label, period_start, period_end, value, value_women, source, method, status, reviewed_at) values (${q(r.id)}, ${q(r.organization_id)}, ${q(r.program_id)}, ${q(r.indicator_code)}, ${q(r.period_label)}, ${q(r.period_start)}, ${q(r.period_end)}, ${r.value}, ${r.value_women}, ${q(r.source)}, 'demo', 'aprobado', '2026-09-01T12:00:00Z');\n`;
}
sql += "commit;\n";

writeFileSync(new URL("../supabase/seed.sql", import.meta.url), sql);

// Contadores de conexiones y programas como los calcula v_public_organization.
for (const o of organizations) {
  o.programs_count = programs.filter((p) => p.organization_id === o.id).length;
  o.connections_count = relations.filter((r) => r.source_org_id === o.id || r.target_org_id === o.id).length;
  o.population_codes = [...new Set(programs.filter((p) => p.organization_id === o.id).flatMap((p) => p.population_codes))];
  const t = cat.orgTypes.find((x) => x.code === o.org_type_code);
  const r = cat.roles.find((x) => x.code === o.primary_role_code);
  o.org_type_label = t.label;
  o.primary_role_label = r.label;
}

const demoDir = fileURLToPath(new URL("../../frontend/src/lib/demo/", import.meta.url));
mkdirSync(demoDir, { recursive: true });
// catalogs.json es liviano y lo usan componentes cliente; demo-data.json solo se lee en el servidor.
writeFileSync(demoDir + "catalogs.json", JSON.stringify(cat.allCatalogs, null, 1));
writeFileSync(demoDir + "demo-data.json", JSON.stringify({ generatedAt: "2026-09-28", organizations, programs, relations, reports, sampleRequests }));
console.log(`organizaciones ${organizations.length} · programas ${programs.length} · relaciones ${relations.length} · reportes ${reports.length}`);
