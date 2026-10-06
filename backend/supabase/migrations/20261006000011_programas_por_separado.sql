-- 011 · Programas por separado (ajustes visuales del 06-oct-2026)
-- La organización edita o agrega un programa sin rehacer todo el registro, y decide qué
-- programas mostrar en su perfil público.
--   · program.is_visible + set_program_visibility(): ocultar/mostrar no pasa por validación
--     (solo reduce lo publicado) y queda en la auditoría.
--   · Solicitudes de tipo 'programa': el payload es solo el programa; GOYN las valida en la
--     misma bandeja y apply_program_payload() las publica.

alter table public.program add column is_visible boolean not null default true;

-- La vista pública deja fuera los programas ocultos (mismas columnas que en 006).
create or replace view public.v_public_program as
select
  p.id,
  p.organization_id,
  o.slug as organization_slug,
  o.name as organization_name,
  p.name,
  p.description,
  p.modality_code,
  p.primary_area_code,
  coalesce((select array_agg(x.area_code) from public.program_area x where x.program_id = p.id), '{}') as area_codes,
  coalesce((select array_agg(x.population_code) from public.program_population x where x.program_id = p.id), '{}') as population_codes,
  coalesce((select array_agg(x.territory_code) from public.program_territory x where x.program_id = p.id), '{}') as territory_codes,
  p.start_date,
  p.end_date,
  p.annual_goal,
  p.link,
  p.updated_at
from public.program p
join public.organization o on o.id = p.organization_id and o.status = 'publicado'
where p.status = 'publicado' and p.is_visible;

-- ─── Ocultar / mostrar ───────────────────────────────────────────────────────
create or replace function public.set_program_visibility(p_program uuid, p_visible boolean)
returns public.program
language plpgsql
security definer
set search_path = ''
as $$
declare
  prog public.program;
begin
  select * into prog from public.program where id = p_program for update;
  if prog.id is null or prog.status <> 'publicado' then raise exception 'Programa no encontrado'; end if;
  if not (public.is_admin() or public.is_member(prog.organization_id)) then
    raise exception 'Solo la organización puede cambiar la visibilidad de sus programas';
  end if;
  update public.program set is_visible = p_visible where id = p_program returning * into prog;
  perform public.write_audit(
    case when p_visible then 'programa.mostrar' else 'programa.ocultar' end,
    'programa', prog.id, null, jsonb_build_object('is_visible', p_visible)
  );
  return prog;
end;
$$;
grant execute on function public.set_program_visibility(uuid, boolean) to authenticated;

-- ─── Aplicar una solicitud de programa ───────────────────────────────────────
-- payload: { name, description, modality_code, primary_area_code, area_codes[], population_codes[],
--            territory_codes[], start_date, end_date?, annual_goal?, link? }
create or replace function public.apply_program_payload(p_request public.change_request)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  p jsonb := p_request.payload;
  prog_id uuid := p_request.entity_id;
begin
  if p_request.organization_id is null then raise exception 'La solicitud de programa no tiene organización'; end if;

  if prog_id is not null then
    update public.program set
      name = p ->> 'name', description = p ->> 'description',
      modality_code = p ->> 'modality_code', primary_area_code = p ->> 'primary_area_code',
      start_date = (p ->> 'start_date')::date, end_date = nullif(p ->> 'end_date', '')::date,
      annual_goal = nullif(p ->> 'annual_goal', '')::int, link = nullif(p ->> 'link', ''),
      status = 'publicado', version = version + 1
    where id = prog_id and organization_id = p_request.organization_id;
    if not found then raise exception 'El programa no pertenece a la organización'; end if;
  else
    insert into public.program (organization_id, name, description, modality_code, primary_area_code, start_date, end_date, annual_goal, link)
    values (
      p_request.organization_id, p ->> 'name', p ->> 'description', p ->> 'modality_code', p ->> 'primary_area_code',
      (p ->> 'start_date')::date, nullif(p ->> 'end_date', '')::date,
      nullif(p ->> 'annual_goal', '')::int, nullif(p ->> 'link', '')
    )
    returning id into prog_id;
  end if;

  delete from public.program_area where program_id = prog_id;
  insert into public.program_area (program_id, area_code)
  select prog_id, unnest(public.jsonb_text_array(p -> 'area_codes')) on conflict do nothing;
  delete from public.program_population where program_id = prog_id;
  insert into public.program_population (program_id, population_code)
  select prog_id, unnest(public.jsonb_text_array(p -> 'population_codes')) on conflict do nothing;
  delete from public.program_territory where program_id = prog_id;
  insert into public.program_territory (program_id, territory_code)
  select prog_id, unnest(public.jsonb_text_array(p -> 'territory_codes')) on conflict do nothing;

  update public.organization set updated_at = now() where id = p_request.organization_id;
  return prog_id;
end;
$$;
revoke all on function public.apply_program_payload(public.change_request) from public, anon, authenticated;

-- ─── Envío: una solicitud de programa exige ser miembro de la organización ───
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
  if req.entity_type = 'programa' and (req.organization_id is null or not public.is_member(req.organization_id)) then
    raise exception 'Solo la organización puede proponer cambios a sus programas';
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

-- ─── Decisión: suma el tipo 'programa' ───────────────────────────────────────
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
  prog_id uuid;
  current_version int;
  is_program boolean;
begin
  if not public.is_admin() then
    raise exception 'Solo el equipo GOYN puede decidir solicitudes';
  end if;

  select * into req from public.change_request where id = p_id for update;
  if req.id is null then raise exception 'Solicitud no encontrada'; end if;
  if req.status <> 'enviada' then raise exception 'La solicitud no está pendiente (estado %)', req.status; end if;
  is_program := req.entity_type = 'programa';

  if p_decision = 'aprobar' then
    -- Bloqueo optimista: si la versión publicada cambió desde la propuesta, exigir recarga.
    if req.entity_id is not null then
      if is_program then
        select version into current_version from public.program where id = req.entity_id for update;
      else
        select version into current_version from public.organization where id = req.entity_id for update;
      end if;
      if req.base_version is not null and current_version <> req.base_version then
        raise exception 'El registro cambió desde que se creó la propuesta (versión % → %). Recargar.',
          req.base_version, current_version;
      end if;
    end if;

    if req.entity_type = 'organizacion' then
      org_id := public.apply_organization_payload(req);
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
    elsif is_program then
      prog_id := public.apply_program_payload(req);
      update public.change_request
      set status = 'aprobada', reviewer_id = auth.uid(), decided_at = now(), decision_reason = p_reason, entity_id = prog_id
      where id = p_id
      returning * into req;
      insert into public.entity_version (entity_type, entity_id, version, snapshot, change_request_id, author_id, reason)
      select 'programa', prog_id, pr.version, req.payload, req.id, auth.uid(), p_reason
      from public.program pr where pr.id = prog_id;
      perform public.write_audit('solicitud.aprobar', 'programa', prog_id, null, req.payload, p_reason);
      insert into public.notification (user_id, kind, title, link)
      values (req.requested_by, 'solicitud_aprobada', 'Tu programa fue publicado en GOYN Conecta BAQ', '/panel/programas');
    else
      raise exception 'Tipo de solicitud % aún no soportado', req.entity_type;
    end if;

  elsif p_decision = 'ajustes' then
    update public.change_request
    set status = 'ajustes_solicitados', reviewer_id = auth.uid(), decided_at = now(),
        decision_reason = p_reason, field_comments = coalesce(p_field_comments, '{}'::jsonb)
    where id = p_id
    returning * into req;
    perform public.write_audit('solicitud.ajustes', req.entity_type::text, req.id, null, p_field_comments, p_reason);
    insert into public.notification (user_id, kind, title, body, link)
    values (req.requested_by, 'solicitud_ajustes',
            case when is_program then 'El equipo GOYN solicitó ajustes a tu programa' else 'El equipo GOYN solicitó ajustes a tu registro' end,
            p_reason, case when is_program then '/panel/programas' else '/panel/registro' end);

  elsif p_decision = 'rechazar' then
    if nullif(trim(p_reason), '') is null then raise exception 'El rechazo requiere un motivo'; end if;
    update public.change_request
    set status = 'rechazada', reviewer_id = auth.uid(), decided_at = now(), decision_reason = p_reason
    where id = p_id
    returning * into req;
    perform public.write_audit('solicitud.rechazar', req.entity_type::text, req.id, null, null, p_reason);
    insert into public.notification (user_id, kind, title, body, link)
    values (req.requested_by, 'solicitud_rechazada', 'Tu solicitud no fue aprobada', p_reason,
            case when is_program then '/panel/programas' else '/panel' end);
  else
    raise exception 'Decisión no válida: %', p_decision;
  end if;

  return req;
end;
$$;
