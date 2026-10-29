-- 018 · Programas destacados en el perfil (decisión GOYN, correo 21-oct-2026)
-- "Tres programas visibles: cada organización elige sus tres programas más relevantes para
-- mostrar en su perfil. Los resultados de los programas que no se muestren deben seguir sumando
-- en las cifras del ecosistema."
--   · program.featured (default false) + máximo 3 por organización (trigger con bloqueo por
--     organización para que dos marcas simultáneas no pasen de 3).
--   · set_program_featured(): solo miembros de la organización o admins GOYN. No pasa por
--     validación (no cambia contenido, solo qué se muestra) y queda en la auditoría.
--   · v_public_program expone `featured` AL FINAL (mismas columnas y orden que en 011).
--   · Las cifras NO dependen de esto: v_public_indicator_report y v_ecosystem_stats no filtran
--     por programa destacado (ni por visible), así que todos los programas siguen sumando.
--   · Si una organización no elige ninguno, la app muestra por defecto sus 3 programas con más
--     jóvenes conectados (desempate: inicio más reciente). No hace falta migrar datos.

alter table public.program add column if not exists featured boolean not null default false;

create index if not exists program_featured_idx on public.program (organization_id) where featured;

-- ─── Máximo 3 destacados por organización ────────────────────────────────────
create or replace function public.check_program_featured_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.featured and (tg_op = 'INSERT' or not old.featured or new.organization_id <> old.organization_id) then
    -- Serializa por organización: evita que dos transacciones marquen el 3.º y el 4.º a la vez.
    perform pg_advisory_xact_lock(hashtext('program_featured:' || new.organization_id::text));
    if (select count(*) from public.program
        where organization_id = new.organization_id and featured and id <> new.id) >= 3 then
      raise exception 'Solo puedes destacar 3 programas en tu perfil. Quita uno antes de elegir otro.'
        using errcode = 'P0001', hint = 'max_featured';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists program_featured_limit on public.program;
create trigger program_featured_limit before insert or update of featured, organization_id on public.program
  for each row execute function public.check_program_featured_limit();

-- ─── Marcar / desmarcar ──────────────────────────────────────────────────────
-- La tabla program no tiene política de UPDATE para usuarios: la escritura pasa solo por aquí.
create or replace function public.set_program_featured(p_program uuid, p_featured boolean)
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
    raise exception 'Solo la organización puede elegir los programas destacados de su perfil';
  end if;
  if p_featured and not prog.is_visible then
    raise exception 'Primero muestra el programa en tu perfil para poder destacarlo';
  end if;
  if prog.featured = p_featured then return prog; end if;
  update public.program set featured = p_featured where id = p_program returning * into prog;
  perform public.write_audit(
    case when p_featured then 'programa.destacar' else 'programa.quitar_destacado' end,
    'programa', prog.id, null, jsonb_build_object('featured', p_featured)
  );
  return prog;
end;
$$;
revoke all on function public.set_program_featured(uuid, boolean) from public, anon;
grant execute on function public.set_program_featured(uuid, boolean) to authenticated;

-- Ocultar un programa también le quita el destacado (un destacado siempre es visible).
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
  update public.program
  set is_visible = p_visible, featured = case when p_visible then featured else false end
  where id = p_program returning * into prog;
  perform public.write_audit(
    case when p_visible then 'programa.mostrar' else 'programa.ocultar' end,
    'programa', prog.id, null, jsonb_build_object('is_visible', p_visible)
  );
  return prog;
end;
$$;
grant execute on function public.set_program_visibility(uuid, boolean) to authenticated;

-- ─── Vista pública: `featured` al final ──────────────────────────────────────
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
  p.updated_at,
  p.featured
from public.program p
join public.organization o on o.id = p.organization_id and o.status = 'publicado'
where p.status = 'publicado' and p.is_visible;

grant select on public.v_public_program to anon, authenticated;
