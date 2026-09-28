-- GOYN Conecta BAQ · 004 · Gobierno de datos: solicitudes, versiones, auditoría y contenido.
-- Control central (flujogramas §Conclusión): la organización produce propuestas, GOYN decide,
-- una aprobación crea versión pública; las consultas públicas nunca leen propuestas.

create table public.change_request (
  id uuid primary key default gen_random_uuid(),
  entity_type public.request_entity not null,
  entity_id uuid,                                   -- null = alta nueva
  organization_id uuid references public.organization (id) on delete cascade,
  base_version int,                                 -- versión publicada sobre la que se propone
  payload jsonb not null,                           -- propuesta completa normalizada
  status public.request_status not null default 'borrador',
  current_step smallint not null default 1,         -- paso del formulario para retomar
  field_comments jsonb not null default '{}'::jsonb,-- { "descripcion": "Ampliar la misión" }
  decision_reason text,
  idempotency_key text unique,
  requested_by uuid not null references public.profile (id),
  submitted_at timestamptz,
  reviewer_id uuid references public.profile (id),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint change_request_reason check (status <> 'rechazada' or decision_reason is not null)
);
create index change_request_status_idx on public.change_request (status, submitted_at);
create index change_request_requester_idx on public.change_request (requested_by);
-- Solo una propuesta activa por entidad existente.
create unique index change_request_one_active on public.change_request (entity_type, entity_id)
  where entity_id is not null and status in ('borrador', 'enviada', 'ajustes_solicitados');
create trigger change_request_updated_at before update on public.change_request
  for each row execute function public.set_updated_at();

-- Historial inmutable de versiones publicadas.
create table public.entity_version (
  id bigint generated always as identity primary key,
  entity_type public.request_entity not null,
  entity_id uuid not null,
  version int not null,
  snapshot jsonb not null,
  change_request_id uuid references public.change_request (id),
  author_id uuid references public.profile (id),
  reason text,
  created_at timestamptz not null default now(),
  unique (entity_type, entity_id, version)
);

-- Auditoría: quién, qué, cuándo, antes y después (arquitectura §4).
create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profile (id),
  action text not null,           -- solicitud.enviar | solicitud.aprobar | exportacion.generar | ...
  entity_type text not null,
  entity_id uuid,
  before jsonb,
  after jsonb,
  reason text,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_entity_idx on public.audit_log (entity_type, entity_id, created_at desc);
create index audit_log_actor_idx on public.audit_log (actor_id, created_at desc);

create or replace function public.write_audit(
  p_action text, p_entity_type text, p_entity_id uuid,
  p_before jsonb default null, p_after jsonb default null, p_reason text default null,
  p_context jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_log (actor_id, action, entity_type, entity_id, before, after, reason, context)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, p_before, p_after, p_reason, p_context);
$$;
revoke all on function public.write_audit from public, anon, authenticated;

-- Notificaciones internas (correo se despacha por Edge Function a partir de esta tabla).
create table public.notification (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profile (id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  email_status text not null default 'pendiente',    -- pendiente | enviado | fallido
  email_attempts int not null default 0,
  created_at timestamptz not null default now()
);
create index notification_user_idx on public.notification (user_id, created_at desc);

-- Editor visual del superadministrador: bloques tipados y versionados (ADR 006).
create table public.content_block (
  id uuid primary key default gen_random_uuid(),
  page text not null,            -- home | impacto | registro ...
  region text not null,          -- hero | intencion | cta ...
  block_type text not null check (block_type in ('hero', 'texto', 'imagen', 'cifras', 'accesos', 'logos', 'banner', 'seccion')),
  content jsonb not null,
  sort_order int not null default 0,
  visible boolean not null default true,
  status text not null default 'borrador' check (status in ('borrador', 'publicado')),
  version int not null default 1,
  updated_by uuid references public.profile (id),
  updated_at timestamptz not null default now()
);
create index content_block_page_idx on public.content_block (page, region, sort_order);

-- Registro de exportaciones (el archivo caduca; los metadatos se conservan).
create table public.export_job (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references public.profile (id),
  format text not null check (format in ('csv', 'xlsx')),
  dataset text not null,
  filters jsonb not null default '{}'::jsonb,
  storage_path text,
  status text not null default 'pendiente' check (status in ('pendiente', 'listo', 'fallido', 'caducado')),
  expires_at timestamptz not null default now() + interval '48 hours',
  created_at timestamptz not null default now()
);
