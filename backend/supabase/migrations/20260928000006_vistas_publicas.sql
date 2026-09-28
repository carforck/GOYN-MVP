-- GOYN Conecta BAQ · 006 · Proyección pública (almacén D4 de los flujogramas).
-- Lista blanca explícita de columnas: nunca se serializa la entidad interna para ocultar campos
-- en el navegador. Las vistas se ejecutan con permisos del propietario (no security_invoker)
-- precisamente para que el público lea SOLO estas columnas y SOLO lo publicado.

create view public.v_public_organization as
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
      and (re.source_org_id = o.id or re.target_org_id = o.id))::int as connections_count
from public.organization o
join public.cat_org_type t on t.code = o.org_type_code
join public.cat_role r on r.code = o.primary_role_code
left join public.location l on l.organization_id = o.id and l.is_primary
where o.status = 'publicado';

create view public.v_public_program as
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
where p.status = 'publicado';

-- Solo conexiones existentes entre organizaciones publicadas: no se mezcla evidencia con aspiración.
create view public.v_public_relation as
select
  re.id,
  re.source_org_id,
  s.slug as source_slug,
  s.name as source_name,
  re.target_org_id,
  t.slug as target_slug,
  t.name as target_name,
  re.relation_type_code,
  re.intensity,
  re.since
from public.relation re
join public.organization s on s.id = re.source_org_id and s.status = 'publicado'
join public.organization t on t.id = re.target_org_id and t.status = 'publicado'
where re.status = 'publicado' and re.state = 'existente';

-- Reportes aprobados: base del tablero de impacto. Se rotula como suma de reportes, no personas únicas.
create view public.v_public_indicator_report as
select
  ir.id,
  ir.organization_id,
  o.slug as organization_slug,
  o.org_type_code,
  ir.program_id,
  p.primary_area_code,
  coalesce(
    (select array_agg(x.territory_code) from public.program_territory x where x.program_id = ir.program_id),
    (select array_agg(x.territory_code) from public.organization_territory x where x.organization_id = ir.organization_id),
    '{}'
  ) as territory_codes,
  ir.indicator_code,
  ir.indicator_version,
  ir.period_label,
  ir.period_start,
  ir.period_end,
  ir.value,
  ir.value_women,
  ir.source,
  ir.reviewed_at
from public.indicator_report ir
join public.organization o on o.id = ir.organization_id and o.status = 'publicado'
left join public.program p on p.id = ir.program_id
where ir.status = 'aprobado' and ir.value is not null;

create view public.v_ecosystem_stats as
select
  (select count(*) from public.organization where status = 'publicado')::int as organizations,
  (select count(*) from public.program p join public.organization o on o.id = p.organization_id
     where p.status = 'publicado' and o.status = 'publicado')::int as programs,
  (select count(*) from public.v_public_relation)::int as connections,
  (select coalesce(sum(value), 0) from public.v_public_indicator_report where indicator_code = 'conectados')::bigint as conectados,
  (select coalesce(sum(value), 0) from public.v_public_indicator_report where indicator_code = 'fortalecidos')::bigint as fortalecidos,
  (select coalesce(sum(value), 0) from public.v_public_indicator_report where indicator_code = 'transformados')::bigint as transformados,
  (select max(reviewed_at) from public.v_public_indicator_report) as indicators_updated_at;

grant select on public.v_public_organization, public.v_public_program, public.v_public_relation,
  public.v_public_indicator_report, public.v_ecosystem_stats to anon, authenticated;
