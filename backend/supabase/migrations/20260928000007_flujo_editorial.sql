-- GOYN Conecta BAQ · 007 · Flujo editorial (flujogramas §2): borrador → enviada → decisión → publicación.
--
-- Contrato del payload de una solicitud de tipo 'organizacion' (lo produce el formulario de registro):
-- {
--   "identificacion":  { name, description, mission, has_nit, nit, website, social{}, contact_email_public },
--   "contacto":        { name, position, phone, email, address },                 -- privado
--   "caracterizacion": { org_type_code, primary_role_code, role_codes[], scope_code },
--   "territorio":      { territory_codes[], location_territory_code, municipality, lat, lng },
--   "enfoque":         { area_codes[], problem_codes[], problem_other{ area_code: texto } },
--   "relaciones":      [ { relation_type_code, target_org_id | null, target_name_free } ],
--   "fortalecimiento": { tenure_code, goyn_space_codes[], alliances, design_capacity, visibility,
--                        youth_involvement, shared_vision },
--   "acciones":        { social_investment_cop, policy_contribution },
--   "programas":       [ { id?, name, description, modality_code, primary_area_code, area_codes[],
--                          population_codes[], territory_codes[], start_date, end_date, annual_goal,
--                          resultados{ atendidos, atendidos_mujeres, fortalecidos, fortalecidos_mujeres,
--                                      empleo, empleo_mujeres, emprendimiento, emprendimiento_mujeres } } ],
--   "gestion_datos":   data_management_code,
--   "consentimiento":  { accepted: true, version }
-- }

create or replace function public.jsonb_text_array(value jsonb)
returns text[] language sql immutable set search_path = '' as $$
  select coalesce(array(select jsonb_array_elements_text(coalesce(value, '[]'::jsonb))), '{}');
$$;

-- Slug único: "nombre", "nombre-2", "nombre-3"...
create or replace function public.unique_org_slug(p_name text, p_exclude uuid default null)
returns text language plpgsql stable set search_path = '' as $$
declare
  base text := nullif(public.slugify(p_name), '');
  candidate text;
  n int := 1;
begin
  base := coalesce(base, 'organizacion');
  candidate := base;
  while exists (select 1 from public.organization where slug = candidate and id is distinct from p_exclude) loop
    n := n + 1;
    candidate := base || '-' || n;
  end loop;
  return candidate;
end;
$$;

-- ─── Aplicar una propuesta de organización a las tablas publicadas ───────────
create or replace function public.apply_organization_payload(p_request public.change_request)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  p jsonb := p_request.payload;
  ident jsonb := p -> 'identificacion';
  carac jsonb := p -> 'caracterizacion';
  terr jsonb := p -> 'territorio';
  enf jsonb := p -> 'enfoque';
  fort jsonb := p -> 'fortalecimiento';
  org_id uuid := p_request.entity_id;
  prog jsonb;
  prog_id uuid;
  kept_programs uuid[] := '{}';
  rel jsonb;
  res jsonb;
  geo extensions.geography;
  loc_precision public.location_precision;
  loc_source text;
  year_start date := date_trunc('year', now())::date;
  year_label text := to_char(now(), 'YYYY');
begin
  if org_id is null then
    insert into public.organization (
      slug, name, has_nit, nit, description, mission, org_type_code, primary_role_code, scope_code,
      website, social, contact_email_public, collaborative_tenure_code, social_investment_cop,
      policy_contribution, data_management_code, verified_at
    ) values (
      public.unique_org_slug(ident ->> 'name'),
      ident ->> 'name',
      coalesce((ident ->> 'has_nit')::boolean, false),
      nullif(ident ->> 'nit', ''),
      ident ->> 'description',
      ident ->> 'mission',
      carac ->> 'org_type_code',
      carac ->> 'primary_role_code',
      nullif(carac ->> 'scope_code', ''),
      nullif(ident ->> 'website', ''),
      coalesce(ident -> 'social', '{}'::jsonb),
      nullif(ident ->> 'contact_email_public', ''),
      nullif(fort ->> 'tenure_code', ''),
      nullif(p -> 'acciones' ->> 'social_investment_cop', '')::numeric,
      nullif(p -> 'acciones' ->> 'policy_contribution', ''),
      nullif(p ->> 'gestion_datos', ''),
      now()
    )
    returning id into org_id;

    insert into public.organization_member (organization_id, user_id, role, status)
    values (org_id, p_request.requested_by, 'titular', 'activo')
    on conflict do nothing;
  else
    update public.organization set
      slug = case when name = ident ->> 'name' then slug else public.unique_org_slug(ident ->> 'name', org_id) end,
      name = ident ->> 'name',
      has_nit = coalesce((ident ->> 'has_nit')::boolean, false),
      nit = nullif(ident ->> 'nit', ''),
      description = ident ->> 'description',
      mission = ident ->> 'mission',
      org_type_code = carac ->> 'org_type_code',
      primary_role_code = carac ->> 'primary_role_code',
      scope_code = nullif(carac ->> 'scope_code', ''),
      website = nullif(ident ->> 'website', ''),
      social = coalesce(ident -> 'social', '{}'::jsonb),
      contact_email_public = nullif(ident ->> 'contact_email_public', ''),
      collaborative_tenure_code = nullif(fort ->> 'tenure_code', ''),
      social_investment_cop = nullif(p -> 'acciones' ->> 'social_investment_cop', '')::numeric,
      policy_contribution = nullif(p -> 'acciones' ->> 'policy_contribution', ''),
      data_management_code = nullif(p ->> 'gestion_datos', ''),
      version = version + 1,
      verified_at = now(),
      published_at = now()
    where id = org_id;
  end if;

  -- Contacto privado.
  insert into public.organization_private (
    organization_id, contact_name, contact_position, contact_phone, contact_email, address,
    data_consent_at, data_consent_text_version
  ) values (
    org_id,
    p -> 'contacto' ->> 'name',
    p -> 'contacto' ->> 'position',
    nullif(p -> 'contacto' ->> 'phone', ''),
    p -> 'contacto' ->> 'email',
    p -> 'contacto' ->> 'address',
    case when (p -> 'consentimiento' ->> 'accepted')::boolean then now() end,
    p -> 'consentimiento' ->> 'version'
  )
  on conflict (organization_id) do update set
    contact_name = excluded.contact_name,
    contact_position = excluded.contact_position,
    contact_phone = excluded.contact_phone,
    contact_email = excluded.contact_email,
    address = excluded.address,
    data_consent_at = coalesce(excluded.data_consent_at, public.organization_private.data_consent_at),
    data_consent_text_version = coalesce(excluded.data_consent_text_version, public.organization_private.data_consent_text_version);

  -- Tablas puente: se reemplazan completas con la versión aprobada.
  delete from public.organization_role where organization_id = org_id;
  insert into public.organization_role (organization_id, role_code)
  select org_id, unnest(public.jsonb_text_array(carac -> 'role_codes')) on conflict do nothing;

  delete from public.organization_territory where organization_id = org_id;
  insert into public.organization_territory (organization_id, territory_code)
  select org_id, unnest(public.jsonb_text_array(terr -> 'territory_codes')) on conflict do nothing;

  delete from public.organization_area where organization_id = org_id;
  insert into public.organization_area (organization_id, area_code)
  select org_id, unnest(public.jsonb_text_array(enf -> 'area_codes')) on conflict do nothing;

  delete from public.organization_problem where organization_id = org_id;
  insert into public.organization_problem (organization_id, problem_code)
  select org_id, unnest(public.jsonb_text_array(enf -> 'problem_codes')) on conflict do nothing;

  delete from public.organization_problem_other where organization_id = org_id;
  insert into public.organization_problem_other (organization_id, area_code, text)
  select org_id, key, value from jsonb_each_text(coalesce(enf -> 'problem_other', '{}'::jsonb))
  where nullif(trim(value), '') is not null;

  delete from public.organization_goyn_space where organization_id = org_id;
  insert into public.organization_goyn_space (organization_id, space_code)
  select org_id, unnest(public.jsonb_text_array(fort -> 'goyn_space_codes')) on conflict do nothing;

  if fort ? 'alliances' then
    insert into public.organization_assessment (
      organization_id, period_label, alliances_strengthened, design_capacity, visibility, youth_involvement, shared_vision
    ) values (
      org_id, year_label,
      nullif(fort ->> 'alliances', '')::smallint, nullif(fort ->> 'design_capacity', '')::smallint,
      nullif(fort ->> 'visibility', '')::smallint, nullif(fort ->> 'youth_involvement', '')::smallint,
      nullif(fort ->> 'shared_vision', '')::smallint
    )
    on conflict (organization_id, period_label) do update set
      alliances_strengthened = excluded.alliances_strengthened, design_capacity = excluded.design_capacity,
      visibility = excluded.visibility, youth_involvement = excluded.youth_involvement,
      shared_vision = excluded.shared_vision;
  end if;

  -- Ubicación principal: coordenadas declaradas o centroide del territorio (rotulado aproximado).
  if terr ? 'lat' and nullif(terr ->> 'lat', '') is not null then
    geo := extensions.st_setsrid(extensions.st_makepoint((terr ->> 'lng')::float8, (terr ->> 'lat')::float8), 4326)::extensions.geography;
    loc_precision := 'exacta';
    loc_source := 'registro';
  else
    select centroid into geo from public.cat_territory where code = terr ->> 'location_territory_code';
    loc_precision := case when geo is null then 'no_disponible' else 'aproximada' end;
    loc_source := 'centroide';
  end if;

  delete from public.location where organization_id = org_id and is_primary;
  insert into public.location (organization_id, is_primary, address, municipality, territory_code, geom, precision, source)
  values (
    org_id, true, p -> 'contacto' ->> 'address', terr ->> 'municipality',
    nullif(terr ->> 'location_territory_code', ''), geo, loc_precision, loc_source
  );

  -- Programas: se actualizan por id; los que ya no vienen se archivan (no se borran).
  for prog in select * from jsonb_array_elements(coalesce(p -> 'programas', '[]'::jsonb)) loop
    prog_id := nullif(prog ->> 'id', '')::uuid;
    if prog_id is not null and exists (select 1 from public.program where id = prog_id and organization_id = org_id) then
      update public.program set
        name = prog ->> 'name', description = prog ->> 'description',
        modality_code = prog ->> 'modality_code', primary_area_code = prog ->> 'primary_area_code',
        start_date = (prog ->> 'start_date')::date, end_date = nullif(prog ->> 'end_date', '')::date,
        annual_goal = nullif(prog ->> 'annual_goal', '')::int, link = nullif(prog ->> 'link', ''),
        status = 'publicado', version = version + 1
      where id = prog_id;
    else
      insert into public.program (organization_id, name, description, modality_code, primary_area_code, start_date, end_date, annual_goal, link)
      values (
        org_id, prog ->> 'name', prog ->> 'description', prog ->> 'modality_code', prog ->> 'primary_area_code',
        (prog ->> 'start_date')::date, nullif(prog ->> 'end_date', '')::date,
        nullif(prog ->> 'annual_goal', '')::int, nullif(prog ->> 'link', '')
      )
      returning id into prog_id;
    end if;
    kept_programs := kept_programs || prog_id;

    delete from public.program_area where program_id = prog_id;
    insert into public.program_area (program_id, area_code)
    select prog_id, unnest(public.jsonb_text_array(prog -> 'area_codes')) on conflict do nothing;
    delete from public.program_population where program_id = prog_id;
    insert into public.program_population (program_id, population_code)
    select prog_id, unnest(public.jsonb_text_array(prog -> 'population_codes')) on conflict do nothing;
    delete from public.program_territory where program_id = prog_id;
    insert into public.program_territory (program_id, territory_code)
    select prog_id, unnest(public.jsonb_text_array(prog -> 'territory_codes')) on conflict do nothing;

    -- Resultados declarados del año → reportes de indicador aprobados con esta decisión.
    res := prog -> 'resultados';
    if res is not null then
      delete from public.indicator_report
      where program_id = prog_id and period_label = year_label and status in ('borrador', 'enviado', 'aprobado');
      insert into public.indicator_report (
        organization_id, program_id, indicator_code, period_label, period_start, period_end,
        value, value_women, source, method, status, reported_by, reviewed_by, reviewed_at
      )
      select org_id, prog_id, v.code, year_label, year_start, (year_start + interval '1 year - 1 day')::date,
             v.value, v.women, 'Autorreporte en registro', coalesce(p ->> 'gestion_datos', 'no_declarado'),
             'aprobado', p_request.requested_by, auth.uid(), now()
      from (values
        ('conectados', nullif(res ->> 'atendidos', '')::numeric, nullif(res ->> 'atendidos_mujeres', '')::numeric),
        ('fortalecidos', nullif(res ->> 'fortalecidos', '')::numeric, nullif(res ->> 'fortalecidos_mujeres', '')::numeric),
        ('transformados',
          nullif(coalesce(nullif(res ->> 'empleo', '')::numeric, 0) + coalesce(nullif(res ->> 'emprendimiento', '')::numeric, 0), 0),
          nullif(coalesce(nullif(res ->> 'empleo_mujeres', '')::numeric, 0) + coalesce(nullif(res ->> 'emprendimiento_mujeres', '')::numeric, 0), 0))
      ) as v(code, value, women)
      where v.value is not null;
    end if;
  end loop;

  update public.program set status = 'archivado'
  where organization_id = org_id and status = 'publicado' and not (id = any (kept_programs));

  -- Relaciones declaradas por esta organización.
  delete from public.relation where source_org_id = org_id;
  for rel in select * from jsonb_array_elements(coalesce(p -> 'relaciones', '[]'::jsonb)) loop
    insert into public.relation (source_org_id, target_org_id, target_name_free, relation_type_code, state)
    values (
      org_id, nullif(rel ->> 'target_org_id', '')::uuid, nullif(rel ->> 'target_name_free', ''),
      rel ->> 'relation_type_code', coalesce((rel ->> 'state')::public.relation_state, 'existente')
    )
    on conflict do nothing;
  end loop;

  return org_id;
end;
$$;
revoke all on function public.apply_organization_payload from public, anon, authenticated;

-- ─── Enviar a validación ─────────────────────────────────────────────────────
create or replace function public.submit_change_request(p_id uuid)
returns public.change_request
language plpgsql
security definer
set search_path = ''
as $$
declare
  req public.change_request;
begin
  select * into req from public.change_request where id = p_id for update;
  if req.id is null or req.requested_by <> auth.uid() then
    raise exception 'Solicitud no encontrada';
  end if;
  if req.status not in ('borrador', 'ajustes_solicitados') then
    raise exception 'La solicitud ya fue enviada (estado %)', req.status;
  end if;
  if req.entity_type = 'organizacion' and not coalesce((req.payload -> 'consentimiento' ->> 'accepted')::boolean, false) then
    raise exception 'Falta la autorización de tratamiento de datos';
  end if;

  update public.change_request
  set status = 'enviada', submitted_at = now(), field_comments = '{}'::jsonb
  where id = p_id
  returning * into req;

  perform public.write_audit('solicitud.enviar', req.entity_type::text, req.id, null, req.payload);

  insert into public.notification (user_id, kind, title, link)
  select id, 'solicitud_pendiente', 'Nueva solicitud pendiente de validación', '/admin/solicitudes/' || req.id
  from public.profile where platform_role in ('admin_goyn', 'superadmin');

  return req;
end;
$$;

-- ─── Decisión del equipo GOYN ────────────────────────────────────────────────
create or replace function public.decide_change_request(
  p_id uuid,
  p_decision text,                        -- 'aprobar' | 'ajustes' | 'rechazar'
  p_reason text default null,
  p_field_comments jsonb default '{}'::jsonb
)
returns public.change_request
language plpgsql
security definer
set search_path = ''
as $$
declare
  req public.change_request;
  org_id uuid;
  current_version int;
begin
  if not public.is_admin() then
    raise exception 'Solo el equipo GOYN puede decidir solicitudes';
  end if;

  select * into req from public.change_request where id = p_id for update;
  if req.id is null then raise exception 'Solicitud no encontrada'; end if;
  if req.status <> 'enviada' then raise exception 'La solicitud no está pendiente (estado %)', req.status; end if;

  if p_decision = 'aprobar' then
    -- Bloqueo optimista: si la versión publicada cambió desde la propuesta, exigir recarga.
    if req.entity_id is not null then
      select version into current_version from public.organization where id = req.entity_id for update;
      if req.base_version is not null and current_version <> req.base_version then
        raise exception 'La organización cambió desde que se creó la propuesta (versión % → %). Recargar.',
          req.base_version, current_version;
      end if;
    end if;

    if req.entity_type = 'organizacion' then
      org_id := public.apply_organization_payload(req);
    else
      raise exception 'Tipo de solicitud % aún no soportado', req.entity_type;
    end if;

    update public.change_request
    set status = 'aprobada', reviewer_id = auth.uid(), decided_at = now(), decision_reason = p_reason,
        entity_id = org_id, organization_id = org_id
    where id = p_id
    returning * into req;

    insert into public.entity_version (entity_type, entity_id, version, snapshot, change_request_id, author_id, reason)
    select 'organizacion', org_id, o.version, req.payload, req.id, auth.uid(), p_reason
    from public.organization o where o.id = org_id;

    perform public.write_audit('solicitud.aprobar', 'organizacion', org_id, null, req.payload, p_reason);
    insert into public.notification (user_id, kind, title, link)
    values (req.requested_by, 'solicitud_aprobada', 'Tu organización fue publicada en GOYN Conecta BAQ', '/panel');

  elsif p_decision = 'ajustes' then
    update public.change_request
    set status = 'ajustes_solicitados', reviewer_id = auth.uid(), decided_at = now(),
        decision_reason = p_reason, field_comments = coalesce(p_field_comments, '{}'::jsonb)
    where id = p_id
    returning * into req;
    perform public.write_audit('solicitud.ajustes', req.entity_type::text, req.id, null, p_field_comments, p_reason);
    insert into public.notification (user_id, kind, title, body, link)
    values (req.requested_by, 'solicitud_ajustes', 'El equipo GOYN solicitó ajustes a tu registro', p_reason, '/panel/registro');

  elsif p_decision = 'rechazar' then
    if nullif(trim(p_reason), '') is null then raise exception 'El rechazo requiere un motivo'; end if;
    update public.change_request
    set status = 'rechazada', reviewer_id = auth.uid(), decided_at = now(), decision_reason = p_reason
    where id = p_id
    returning * into req;
    perform public.write_audit('solicitud.rechazar', req.entity_type::text, req.id, null, null, p_reason);
    insert into public.notification (user_id, kind, title, body, link)
    values (req.requested_by, 'solicitud_rechazada', 'Tu solicitud no fue aprobada', p_reason, '/panel');
  else
    raise exception 'Decisión no válida: %', p_decision;
  end if;

  return req;
end;
$$;

grant execute on function public.submit_change_request(uuid) to authenticated;
grant execute on function public.decide_change_request(uuid, text, text, jsonb) to authenticated;

-- ─── Revisión de reportes de indicador sueltos (panel → indicadores) ─────────
create or replace function public.review_indicator_report(p_id uuid, p_approve boolean, p_comment text default null)
returns public.indicator_report
language plpgsql
security definer
set search_path = ''
as $$
declare
  rep public.indicator_report;
begin
  if not public.is_admin() then raise exception 'Solo el equipo GOYN revisa indicadores'; end if;
  update public.indicator_report
  set status = case when p_approve then 'aprobado'::public.report_status else 'rechazado'::public.report_status end,
      reviewed_by = auth.uid(), reviewed_at = now(), review_comment = p_comment
  where id = p_id and status = 'enviado'
  returning * into rep;
  if rep.id is null then raise exception 'Reporte no encontrado o no está enviado'; end if;
  perform public.write_audit(case when p_approve then 'indicador.aprobar' else 'indicador.rechazar' end,
    'reporte_indicador', rep.id, null, to_jsonb(rep), p_comment);
  return rep;
end;
$$;
grant execute on function public.review_indicator_report(uuid, boolean, text) to authenticated;
