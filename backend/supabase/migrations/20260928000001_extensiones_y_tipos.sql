-- GOYN Conecta BAQ · 001 · Extensiones, tipos enumerados y utilidades comunes.

create extension if not exists postgis with schema extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists unaccent with schema extensions;

-- Rol de plataforma (global). El acceso a una organización se da por membresía, no por este rol.
create type public.platform_role as enum ('usuario', 'admin_goyn', 'superadmin');

-- Rol dentro de una organización.
create type public.member_role as enum ('titular', 'editor');
create type public.member_status as enum ('invitado', 'activo', 'suspendido');

-- Ciclo de vida de lo publicado (organización, programa, relación).
create type public.publish_status as enum ('publicado', 'archivado');

-- Ciclo editorial de una solicitud de cambio (arquitectura de datos §5).
create type public.request_status as enum (
  'borrador', 'enviada', 'ajustes_solicitados', 'aprobada', 'rechazada', 'retirada'
);

create type public.request_entity as enum ('organizacion', 'programa', 'relacion', 'reporte_indicador');

create type public.location_precision as enum ('exacta', 'aproximada', 'no_disponible');

create type public.relation_state as enum ('existente', 'potencial');

create type public.report_status as enum ('borrador', 'enviado', 'aprobado', 'rechazado');

create type public.opportunity_type as enum ('estudiar', 'trabajar', 'emprender', 'participar');

-- Fecha de actualización automática.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Slug estable y legible a partir de un nombre ("Fundación Río Verde" -> "fundacion-rio-verde").
create or replace function public.slugify(value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim(both '-' from regexp_replace(lower(extensions.unaccent(coalesce(value, ''))), '[^a-z0-9]+', '-', 'g'));
$$;
