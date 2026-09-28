export default async function (db) {
  const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) process.exitCode = 1; };
  await db.exec(`
    grant usage on schema public, extensions to anon, authenticated;
    grant select, insert, update, delete on all tables in schema public to anon, authenticated;
    grant usage, select on all sequences in schema public to anon, authenticated;
    insert into auth.users (id, email) values
      ('11111111-1111-1111-1111-111111111111', 'org@demo.co'),
      ('22222222-2222-2222-2222-222222222222', 'admin@goyn.co'),
      ('33333333-3333-3333-3333-333333333333', 'otra@demo.co');
    update public.profile set platform_role = 'admin_goyn' where email = 'admin@goyn.co';
  `);
  const as = async (uid, sql, params) => {
    await db.exec(uid ? `set role authenticated; select set_config('request.jwt.claim.sub', '${uid}', false);` : `set role anon; select set_config('request.jwt.claim.sub', '', false);`);
    try { return await db.query(sql, params); } finally { await db.exec("reset role;"); }
  };
  const ORG = "11111111-1111-1111-1111-111111111111", ADM = "22222222-2222-2222-2222-222222222222", OTRA = "33333333-3333-3333-3333-333333333333";

  let r = await as(null, "select count(*)::int n from public.organization");
  ok(r.rows[0].n === 0, "anon no lee la tabla base organization (RLS)");
  r = await as(null, "select count(*)::int n from public.v_public_organization");
  ok(r.rows[0].n === 42, `anon lee la vista pública (${r.rows[0].n} organizaciones)`);
  r = await as(null, "select * from public.v_ecosystem_stats");
  ok(r.rows[0].conectados > 0, `KPIs agregados: ${JSON.stringify(r.rows[0])}`);
  r = await as(null, "select count(*)::int n from public.organization_private");
  ok(r.rows[0].n === 0, "anon no lee contactos privados");

  const payload = {
    identificacion: { name: "Fundación Prueba Flujo", description: "Organización creada por la prueba del flujo.", has_nit: true, nit: "900123456-7", contact_email_public: "hola@prueba.co" },
    contacto: { name: "Ana Pérez", position: "Directora", phone: "3001234567", email: "ana@prueba.co", address: "Cra 50 # 70-10" },
    caracterizacion: { org_type_code: "privado_fundacion", primary_role_code: "implementador", role_codes: ["implementador", "articulador"], scope_code: "local" },
    territorio: { territory_codes: ["baq_suroriente", "amb_soledad"], location_territory_code: "baq_suroriente", municipality: "Barranquilla" },
    enfoque: { area_codes: ["ingresos"], problem_codes: ["ing_barreras_mercado_laboral"], problem_other: { ingresos: "Informalidad" } },
    relaciones: [{ relation_type_code: "aliado", target_org_id: "", target_name_free: "Aliado sin registrar" }],
    fortalecimiento: { tenure_code: "1a_2a", goyn_space_codes: ["mesas_tecnicas"], alliances: 8, design_capacity: 7, visibility: 9, youth_involvement: 6, shared_vision: 8 },
    acciones: { social_investment_cop: "150000000" },
    programas: [{ name: "Empleo joven prueba", description: "Programa de prueba", modality_code: "presencial", primary_area_code: "ingresos", area_codes: ["ingresos"], population_codes: ["general", "mujeres"], territory_codes: ["baq_suroriente"], start_date: "2026-02-01", annual_goal: 200,
      resultados: { atendidos: 120, atendidos_mujeres: 70, fortalecidos: 80, fortalecidos_mujeres: 45, empleo: 20, empleo_mujeres: 11, emprendimiento: 5, emprendimiento_mujeres: 3 } }],
    gestion_datos: "administrativa",
    consentimiento: { accepted: true, version: "2026-09" },
  };
  r = await as(ORG, "insert into public.change_request (entity_type, payload, requested_by, status) values ('organizacion', $1, $2, 'borrador') returning id", [payload, ORG]);
  const reqId = r.rows[0].id;
  ok(!!reqId, "organización crea borrador de registro");

  r = await as(OTRA, "select count(*)::int n from public.change_request");
  ok(r.rows[0].n === 0, "otro usuario no ve el borrador ajeno");

  let err = null;
  try { await as(ORG, "update public.change_request set status = 'aprobada' where id = $1", [reqId]); } catch (e) { err = e.message; }
  ok(!!err, "el solicitante no puede autoaprobarse");

  await as(ORG, "select public.submit_change_request($1)", [reqId]);
  err = null;
  try { await as(ORG, "select public.decide_change_request($1, 'aprobar')", [reqId]); } catch (e) { err = e.message; }
  ok(err && err.includes("Solo el equipo GOYN"), "organización no puede decidir");

  r = await as(null, "select count(*)::int n from public.v_public_organization where name = 'Fundación Prueba Flujo'");
  ok(r.rows[0].n === 0, "pendiente NO aparece en la vista pública");

  await as(ADM, "select public.decide_change_request($1, 'ajustes', 'Ampliar descripción', '{\"descripcion\":\"Más detalle\"}')", [reqId]);
  await as(ORG, "update public.change_request set payload = jsonb_set(payload, '{identificacion,description}', '\"Descripción ampliada tras ajustes.\"') where id = $1", [reqId]);
  await as(ORG, "select public.submit_change_request($1)", [reqId]);
  await as(ADM, "select public.decide_change_request($1, 'aprobar', 'Datos verificados')", [reqId]);

  r = await as(null, "select slug, description, role_codes, lat, location_precision, programs_count from public.v_public_organization where name = 'Fundación Prueba Flujo'");
  ok(r.rows.length === 1, `aprobada y publicada: ${JSON.stringify(r.rows[0])}`);
  r = await as(null, "select indicator_code, value from public.v_public_indicator_report where organization_slug = 'fundacion-prueba-flujo' order by 1");
  ok(r.rows.length === 3 && r.rows.find((x) => x.indicator_code === "transformados").value == 25, `indicadores derivados del registro: ${JSON.stringify(r.rows)}`);
  r = await as(ORG, "select count(*)::int n from public.organization_member where user_id = $1 and role = 'titular'", [ORG]);
  ok(r.rows[0].n === 1, "el solicitante queda como titular de la organización");
  r = await as(ORG, "select contact_phone from public.organization_private");
  ok(r.rows.length === 1 && r.rows[0].contact_phone === "3001234567", "titular ve su contacto privado");
  r = await as(OTRA, "select count(*)::int n from public.organization_private");
  ok(r.rows[0].n === 0, "otro usuario no ve contactos privados");
  r = await as(ADM, "select action from public.audit_log order by id");
  ok(r.rows.map((x) => x.action).join() === "solicitud.enviar,solicitud.ajustes,solicitud.enviar,solicitud.aprobar", `auditoría: ${r.rows.map((x) => x.action).join(" → ")}`);
  r = await as(ORG, "select count(*)::int n from public.audit_log");
  ok(r.rows[0].n === 0, "organización no lee la auditoría");
  err = null;
  try { await as(ORG, "update public.profile set platform_role = 'superadmin' where id = $1", [ORG]); } catch (e) { err = e.message; }
  ok(!!err, "nadie se autoasigna superadmin");
}
