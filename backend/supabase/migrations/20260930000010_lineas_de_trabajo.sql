-- GOYN Conecta BAQ · 010 · Líneas de trabajo (FR-002: filtrar por "línea de trabajo").
-- Fuente: presentación del Colaborativo S1-042026, "Así se compone el Colaborativo · Líneas de trabajo".
-- El Instrumento de mapeo no trae esta pregunta: se agrega como opcional en el paso de
-- caracterización del registro (pendiente de validar con GOYN).

create table public.cat_work_line (
  code text primary key,
  label text not null,
  description text,
  sort_order int not null default 0,
  active boolean not null default true
);
insert into public.cat_work_line (code, label, sort_order) values
  ('emprendimiento_juvenil', 'Emprendimiento juvenil', 1),
  ('empleo_juvenil', 'Empleo juvenil', 2),
  ('orientacion_socio_ocupacional', 'Orientación socio-ocupacional', 3),
  ('conexion_directa', 'Conexión directa con jóvenes', 4),
  ('narrativas', 'Comunicación y cambio de narrativas', 5),
  ('formacion_cultura', 'Formación educativa, idiomas y actividades culturales', 6),
  ('agencia_juvenil', 'Agencia juvenil', 7),
  ('investigacion_mercado', 'Investigación aplicada sobre el mercado laboral juvenil', 8);

alter table public.cat_work_line enable row level security;
create policy "cat_work_line lectura pública" on public.cat_work_line for select to anon, authenticated using (true);
create policy "cat_work_line gestión superadmin" on public.cat_work_line for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());

create table public.organization_work_line (
  organization_id uuid not null references public.organization (id) on delete cascade,
  work_line_code text not null references public.cat_work_line (code),
  primary key (organization_id, work_line_code)
);
alter table public.organization_work_line enable row level security;
create policy "organization_work_line miembros y admin" on public.organization_work_line for select to authenticated
  using (public.is_admin() or public.is_member(organization_id));

-- Al aprobarse una solicitud de organización, se sincronizan sus líneas de trabajo desde el payload
-- (caracterizacion.work_line_codes). Complementa apply_organization_payload sin reescribirla.
create or replace function public.sync_work_lines_on_approval()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'aprobada' and old.status is distinct from 'aprobada'
     and new.entity_type = 'organizacion' and new.entity_id is not null then
    delete from public.organization_work_line where organization_id = new.entity_id;
    insert into public.organization_work_line (organization_id, work_line_code)
    select new.entity_id, unnest(public.jsonb_text_array(new.payload -> 'caracterizacion' -> 'work_line_codes'))
    on conflict do nothing;
  end if;
  return new;
end;
$$;
create trigger change_request_work_lines after update of status on public.change_request
  for each row execute function public.sync_work_lines_on_approval();

-- La vista pública agrega la columna al final (create or replace exige conservar el orden).
create or replace view public.v_public_organization as
select
  o.id,
  o.slug,
  o.name,
  o.description,
  o.mission,
  o.org_type_code,
  t.label as org_type_label,
  o.primary_role_code,
  r.label as primary_role_label,
  coalesce((select array_agg(x.role_code order by x.role_code) from public.organization_role x where x.organization_id = o.id), '{}') as role_codes,
  coalesce((select array_agg(x.territory_code order by x.territory_code) from public.organization_territory x where x.organization_id = o.id), '{}') as territory_codes,
  coalesce((select array_agg(x.area_code order by x.area_code) from public.organization_area x where x.organization_id = o.id), '{}') as area_codes,
  coalesce((select array_agg(x.problem_code order by x.problem_code) from public.organization_problem x where x.organization_id = o.id), '{}') as problem_codes,
  coalesce((
    select array_agg(distinct pp.population_code)
    from public.program p join public.program_population pp on pp.program_id = p.id
    where p.organization_id = o.id and p.status = 'publicado'
  ), '{}') as population_codes,
  o.scope_code,
  o.website,
  o.social,
  o.logo_path,
  o.contact_email_public,
  o.is_demo,
  o.verified_at,
  o.updated_at,
  l.territory_code as location_territory_code,
  l.municipality,
  extensions.st_y(l.geom::extensions.geometry) as lat,
  extensions.st_x(l.geom::extensions.geometry) as lng,
  l.precision as location_precision,
  (select count(*) from public.program p where p.organization_id = o.id and p.status = 'publicado')::int as programs_count,
  (select count(*) from public.relation re
    where re.status = 'publicado' and re.state = 'existente'
      and (re.source_org_id = o.id or re.target_org_id = o.id))::int as connections_count,
  coalesce((select array_agg(x.work_line_code order by x.work_line_code) from public.organization_work_line x where x.organization_id = o.id), '{}') as work_line_codes
from public.organization o
join public.cat_org_type t on t.code = o.org_type_code
join public.cat_role r on r.code = o.primary_role_code
left join public.location l on l.organization_id = o.id and l.is_primary
where o.status = 'publicado';
