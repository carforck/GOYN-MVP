-- GOYN Conecta BAQ · 016 · Reportes de indicador por AÑO (ajustes GOYN 26 y 28, 2026-10-29).
--
-- Los reportes dejan de ser trimestrales. El año de cada reporte es el de la FECHA DE INICIO del
-- programa; el panel guarda por programa y año la cantidad de conectados/fortalecidos/transformados
-- (y mujeres) con su fecha de actualización. El esquema no cambia de forma: `period_label` sigue
-- siendo obligatorio y guarda el año ("2025"), con period_start/period_end = 1 ene / 31 dic.
-- Los reportes trimestrales existentes ("2025-T1"…) se conservan tal cual; el frontend los agrupa
-- por el año de inicio del programa (o por el año de su periodo si no hay programa).
--
-- Esta migración:
-- 1. Agrega al final de v_public_indicator_report `program_start_date` y `updated_at` (mismas
--    columnas y orden que antes; v_ecosystem_stats no cambia).
-- 2. Permite que la organización ACTUALICE un reporte enviado que aún no se revisa (nueva carga
--    sobre el mismo programa/año/indicador), además de los borradores y rechazados.
-- 3. Separa la regla anti duplicado: un solo reporte aprobado y un solo reporte en revisión por
--    organización/programa/indicador/periodo. Así una nueva carga puede esperar revisión mientras el
--    dato aprobado anterior sigue publicado.
-- 4. Al aprobar, el reporte nuevo REEMPLAZA al aprobado anterior del mismo programa/indicador/periodo
--    (el anterior queda en la auditoría como "antes").

-- ─── 1. Vista pública con año de inicio del programa y fecha de actualización ─
create or replace view public.v_public_indicator_report as
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
  ir.reviewed_at,
  p.start_date as program_start_date,
  ir.updated_at
from public.indicator_report ir
join public.organization o on o.id = ir.organization_id and o.status = 'publicado'
left join public.program p on p.id = ir.program_id
where ir.status = 'aprobado' and ir.value is not null;

grant select on public.v_public_indicator_report to anon, authenticated;

-- ─── 2. La organización puede corregir un reporte en revisión ───────────────
drop policy if exists "miembro edita reporte no aprobado" on public.indicator_report;
create policy "miembro edita reporte no aprobado" on public.indicator_report for update to authenticated
  using (public.is_member(organization_id) and status in ('borrador', 'enviado', 'rechazado'))
  with check (public.is_member(organization_id) and status in ('borrador', 'enviado'));

-- ─── 3. Un aprobado y un pendiente por clave ────────────────────────────────
drop index if exists public.indicator_report_dedupe;
create unique index indicator_report_dedupe on public.indicator_report (
  organization_id, coalesce(program_id, '00000000-0000-0000-0000-000000000000'::uuid), indicator_code, period_label
) where status = 'aprobado';
create unique index indicator_report_dedupe_pendiente on public.indicator_report (
  organization_id, coalesce(program_id, '00000000-0000-0000-0000-000000000000'::uuid), indicator_code, period_label
) where status = 'enviado';

-- ─── 4. Aprobar reemplaza el dato aprobado anterior ─────────────────────────
create or replace function public.review_indicator_report(p_id uuid, p_approve boolean, p_comment text default null)
returns public.indicator_report
language plpgsql
security definer
set search_path = ''
as $$
declare
  rep public.indicator_report;
  prev public.indicator_report;
begin
  if not public.is_admin() then raise exception 'Solo el equipo GOYN revisa indicadores'; end if;
  select * into rep from public.indicator_report where id = p_id and status = 'enviado' for update;
  if rep.id is null then raise exception 'Reporte no encontrado o no está enviado'; end if;

  if p_approve then
    -- Nueva carga del mismo programa/indicador/año: el dato aprobado anterior se reemplaza.
    delete from public.indicator_report x
    where x.status = 'aprobado'
      and x.organization_id = rep.organization_id
      and coalesce(x.program_id, '00000000-0000-0000-0000-000000000000'::uuid)
          = coalesce(rep.program_id, '00000000-0000-0000-0000-000000000000'::uuid)
      and x.indicator_code = rep.indicator_code
      and x.period_label = rep.period_label
    returning * into prev;
  end if;

  update public.indicator_report
  set status = case when p_approve then 'aprobado'::public.report_status else 'rechazado'::public.report_status end,
      reviewed_by = auth.uid(), reviewed_at = now(), review_comment = p_comment
  where id = p_id
  returning * into rep;

  perform public.write_audit(case when p_approve then 'indicador.aprobar' else 'indicador.rechazar' end,
    'reporte_indicador', rep.id, case when prev.id is null then null else to_jsonb(prev) end, to_jsonb(rep), p_comment);
  return rep;
end;
$$;
grant execute on function public.review_indicator_report(uuid, boolean, text) to authenticated;
