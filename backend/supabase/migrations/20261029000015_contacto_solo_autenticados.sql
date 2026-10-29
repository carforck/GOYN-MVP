-- GOYN Conecta BAQ · 015 · Contacto solo para usuarios autenticados (decisión GOYN, 2026-10-29).
-- "Sin registro se mantienen visibles los campos que hoy muestra la plataforma (mapa y directorio),
-- pero NO la hoja de vida completa ni el contacto."
--
-- v_public_organization se ejecuta con permisos del propietario (no security_invoker) y está
-- concedida a anon y authenticated. Hasta ahora devolvía correo, sitio web y redes a cualquiera
-- con la llave anónima. Se recrea la vista con las MISMAS columnas, en el MISMO orden y con los
-- MISMOS tipos (create or replace lo exige), pero esas tres columnas solo traen datos cuando la
-- petición lleva un JWT de usuario (auth.uid() no nulo). Para anon:
--   website              -> null
--   social               -> '{}'::jsonb  (la columna base es not null default '{}')
--   contact_email_public -> null
-- Así el frontend (select "*") sigue funcionando sin cambios y los usuarios con sesión siguen
-- viendo el contacto en la hoja de vida. auth.uid() lee request.jwt.claims de la petición, por lo
-- que funciona aunque la vista corra con los permisos del propietario.
--
-- Nota: la sesión demo por cookie (goyn_demo_role) consulta como anon; con Supabase configurado
-- verá el contacto vacío. Es lo esperado: el recorrido demo no es una cuenta real.

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
  case when (select auth.uid()) is not null then o.website end as website,
  case when (select auth.uid()) is not null then o.social else '{}'::jsonb end as social,
  o.logo_path,
  case when (select auth.uid()) is not null then o.contact_email_public end as contact_email_public,
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

comment on view public.v_public_organization is
  'Proyección pública de organizaciones publicadas. website, social y contact_email_public solo para usuarios autenticados (015).';

-- Los permisos se conservan con create or replace; se reafirman por claridad.
grant select on public.v_public_organization to anon, authenticated;
