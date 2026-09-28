-- GOYN Conecta BAQ · 009 · Avisos en tiempo real.
-- Cuando se PUBLICA algo (organización, relación o reporte aprobado), la base de datos emite un
-- mensaje en el canal público de Supabase Realtime "ecosistema" (evento "cambio"). El frontend lo
-- escucha y vuelve a pedir la instantánea pública (/api/ecosistema). El mensaje solo lleva datos
-- que ya son públicos; nunca contactos ni borradores.

create or replace function public.notify_ecosystem_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  payload jsonb;
  org public.organization;
begin
  if tg_table_name = 'indicator_report' then
    if new.status <> 'aprobado' or (tg_op = 'UPDATE' and old.status = 'aprobado') then
      return new;
    end if;
    select * into org from public.organization where id = new.organization_id;
    payload := jsonb_build_object('kind', 'reporte', 'indicator', new.indicator_code, 'delta', new.value);
  elsif tg_table_name = 'relation' then
    if new.status <> 'publicado' or new.state <> 'existente' then return new; end if;
    select * into org from public.organization where id = new.source_org_id;
    payload := jsonb_build_object('kind', 'conexion');
  else
    if new.status <> 'publicado' then return new; end if;
    org := new;
    payload := jsonb_build_object('kind', 'registro');
  end if;

  if org.id is null or org.status <> 'publicado' then return new; end if;

  payload := payload || jsonb_build_object(
    'orgSlug', org.slug,
    'orgName', org.name,
    'territory', (select territory_code from public.location where organization_id = org.id and is_primary),
    'lat', (select extensions.st_y(geom::extensions.geometry) from public.location where organization_id = org.id and is_primary),
    'lng', (select extensions.st_x(geom::extensions.geometry) from public.location where organization_id = org.id and is_primary)
  );

  begin
    perform realtime.send(payload, 'cambio', 'ecosistema', false);
  exception when others then
    -- Un fallo del aviso nunca debe impedir publicar.
    raise warning 'No se pudo emitir el aviso en tiempo real: %', sqlerrm;
  end;
  return new;
end;
$$;

create trigger indicator_report_realtime after insert or update of status on public.indicator_report
  for each row execute function public.notify_ecosystem_change();

create trigger relation_realtime after insert on public.relation
  for each row execute function public.notify_ecosystem_change();

create trigger organization_realtime after insert or update of status, version on public.organization
  for each row execute function public.notify_ecosystem_change();
