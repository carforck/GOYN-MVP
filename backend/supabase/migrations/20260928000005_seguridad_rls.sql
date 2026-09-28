-- GOYN Conecta BAQ · 005 · Autorización: RBAC + pertenencia a organización (arquitectura §4).
-- Regla: el sitio público NO lee tablas base; usa vistas con lista blanca (migración 006).
-- Las escrituras sobre datos publicados ocurren solo mediante funciones del flujo editorial (007).

-- ─── Funciones de apoyo (security definer para no recursar en RLS) ───────────
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profile
    where id = auth.uid() and platform_role in ('admin_goyn', 'superadmin')
  );
$$;

create or replace function public.is_superadmin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profile where id = auth.uid() and platform_role = 'superadmin');
$$;

create or replace function public.is_member(org uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.organization_member
    where organization_id = org and user_id = auth.uid() and status = 'activo'
  );
$$;

create or replace function public.is_titular(org uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.organization_member
    where organization_id = org and user_id = auth.uid() and status = 'activo' and role = 'titular'
  );
$$;

-- Nadie cambia su propio rol de plataforma. Solo superadmin (o SQL/servicio, auth.uid() nulo).
create or replace function public.guard_platform_role()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.platform_role is distinct from old.platform_role
     and auth.uid() is not null and not public.is_superadmin() then
    raise exception 'Solo un superadministrador puede cambiar roles de plataforma';
  end if;
  return new;
end;
$$;
create trigger profile_guard_role before update on public.profile
  for each row execute function public.guard_platform_role();

-- ─── Catálogos: lectura pública, escritura superadmin ───────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'cat_org_type', 'cat_role', 'cat_scope', 'cat_impact_area', 'cat_problem', 'cat_population',
    'cat_relation_type', 'cat_modality', 'cat_data_management', 'cat_tenure', 'cat_goyn_space',
    'cat_territory', 'indicator_definition', 'feature_flag'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%s lectura pública" on public.%I for select to anon, authenticated using (true)', t, t);
    execute format('create policy "%s gestión superadmin" on public.%I for all to authenticated using (public.is_superadmin()) with check (public.is_superadmin())', t, t);
  end loop;
end;
$$;

-- ─── Perfil ──────────────────────────────────────────────────────────────────
alter table public.profile enable row level security;
create policy "perfil propio o admin" on public.profile for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy "editar perfil propio" on public.profile for update to authenticated
  using (id = auth.uid() or public.is_superadmin()) with check (id = auth.uid() or public.is_superadmin());

-- ─── Datos publicados: lectura para miembros y GOYN; escritura por flujo ─────
alter table public.organization enable row level security;
create policy "organizacion miembros y admin" on public.organization for select to authenticated
  using (public.is_admin() or public.is_member(id));

alter table public.organization_private enable row level security;
create policy "privado miembros y admin" on public.organization_private for select to authenticated
  using (public.is_admin() or public.is_member(organization_id));

do $$
declare t text;
begin
  foreach t in array array[
    'organization_role', 'organization_territory', 'organization_area', 'organization_problem',
    'organization_problem_other', 'organization_goyn_space', 'organization_assessment', 'location',
    'program', 'opportunity'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%s miembros y admin" on public.%I for select to authenticated using (public.is_admin() or public.is_member(organization_id))', t, t);
  end loop;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['program_area', 'program_population', 'program_territory'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "%s miembros y admin" on public.%I for select to authenticated using (
         exists (select 1 from public.program p where p.id = program_id and (public.is_admin() or public.is_member(p.organization_id))))',
      t, t);
  end loop;
end;
$$;

alter table public.relation enable row level security;
create policy "relacion miembros y admin" on public.relation for select to authenticated
  using (public.is_admin() or public.is_member(source_org_id) or public.is_member(target_org_id));

-- ─── Membresías ──────────────────────────────────────────────────────────────
alter table public.organization_member enable row level security;
create policy "ver membresias" on public.organization_member for select to authenticated
  using (user_id = auth.uid() or public.is_admin() or public.is_titular(organization_id));
create policy "titular o admin gestiona membresias" on public.organization_member for all to authenticated
  using (public.is_admin() or public.is_titular(organization_id))
  with check (public.is_admin() or public.is_titular(organization_id));

-- ─── Solicitudes de cambio ───────────────────────────────────────────────────
alter table public.change_request enable row level security;
create policy "ver solicitudes propias, de mi organización o admin" on public.change_request for select to authenticated
  using (requested_by = auth.uid() or public.is_admin()
         or (organization_id is not null and public.is_member(organization_id)));
create policy "crear borrador propio" on public.change_request for insert to authenticated
  with check (
    requested_by = auth.uid()
    and status in ('borrador', 'enviada')
    and (organization_id is null or public.is_member(organization_id))
  );
-- El solicitante edita, envía o retira mientras la solicitud está en sus manos. Decidir es solo por RPC.
create policy "editar borrador propio" on public.change_request for update to authenticated
  using (requested_by = auth.uid() and status in ('borrador', 'ajustes_solicitados'))
  with check (requested_by = auth.uid() and status in ('borrador', 'enviada', 'ajustes_solicitados', 'retirada'));

-- ─── Reportes de indicador ───────────────────────────────────────────────────
alter table public.indicator_report enable row level security;
create policy "ver reportes miembros y admin" on public.indicator_report for select to authenticated
  using (public.is_admin() or public.is_member(organization_id));
create policy "miembro crea reporte" on public.indicator_report for insert to authenticated
  with check (public.is_member(organization_id) and status in ('borrador', 'enviado') and reported_by = auth.uid());
create policy "miembro edita reporte no aprobado" on public.indicator_report for update to authenticated
  using (public.is_member(organization_id) and status in ('borrador', 'rechazado'))
  with check (public.is_member(organization_id) and status in ('borrador', 'enviado'));

-- ─── Historial, auditoría, exportaciones: solo GOYN ─────────────────────────
alter table public.entity_version enable row level security;
create policy "versiones admin" on public.entity_version for select to authenticated using (public.is_admin());

alter table public.audit_log enable row level security;
create policy "auditoria admin" on public.audit_log for select to authenticated using (public.is_admin());

alter table public.export_job enable row level security;
create policy "exportaciones admin" on public.export_job for all to authenticated
  using (public.is_admin()) with check (public.is_admin() and requested_by = auth.uid());

-- ─── Notificaciones propias ─────────────────────────────────────────────────
alter table public.notification enable row level security;
create policy "notificaciones propias" on public.notification for select to authenticated using (user_id = auth.uid());
create policy "marcar leida" on public.notification for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─── Contenido visual ────────────────────────────────────────────────────────
alter table public.content_block enable row level security;
create policy "contenido publicado visible" on public.content_block for select to anon, authenticated
  using ((status = 'publicado' and visible) or public.is_superadmin());
create policy "contenido superadmin" on public.content_block for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());
