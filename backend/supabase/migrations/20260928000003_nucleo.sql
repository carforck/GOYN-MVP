-- GOYN Conecta BAQ · 003 · Modelo núcleo (arquitectura de datos §1–3).
-- La organización es la raíz operativa; programas, ubicaciones, relaciones e indicadores
-- tienen identidad propia. Estas tablas guardan SOLO la versión publicada: las propuestas
-- viven en change_request (migración 004) y se aplican al aprobarse.

-- ─── Usuarios ────────────────────────────────────────────────────────────────
create table public.profile (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text not null,
  platform_role public.platform_role not null default 'usuario',
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index profile_email_key on public.profile (lower(email));
create trigger profile_updated_at before update on public.profile
  for each row execute function public.set_updated_at();

-- Crea el perfil al registrarse un usuario en Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profile (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Organización ────────────────────────────────────────────────────────────
-- Organizaciones sin NIT reciben un código interno (nota técnica pregunta 3 del Instrumento).
create sequence public.organization_code_seq start 1;

create table public.organization (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  internal_code text not null unique
    default 'GOYN-' || lpad(nextval('public.organization_code_seq')::text, 5, '0'),
  name text not null,
  has_nit boolean not null default false,
  nit text,
  description text not null check (char_length(description) <= 2000),
  mission text,
  org_type_code text not null references public.cat_org_type (code),
  primary_role_code text not null references public.cat_role (code),
  scope_code text references public.cat_scope (code),
  website text,
  social jsonb not null default '{}'::jsonb,    -- { "instagram": "...", "linkedin": "..." }
  logo_path text,                                -- ruta en storage bucket "logos"
  -- Contacto estratégico: correo público (P9); nombre/cargo/celular solo GOYN (P5–P8).
  contact_email_public text,
  collaborative_tenure_code text references public.cat_tenure (code),
  social_investment_cop numeric(18, 2) check (social_investment_cop >= 0),
  policy_contribution text,                      -- P39–P40
  data_management_code text references public.cat_data_management (code),
  is_demo boolean not null default false,        -- conjunto de demostración (arquitectura de datos §9)
  status public.publish_status not null default 'publicado',
  version int not null default 1,
  verified_at timestamptz,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_nit_when_declared check (not has_nit or nit is not null)
);
create unique index organization_nit_key on public.organization (nit) where nit is not null;
create index organization_type_idx on public.organization (org_type_code);
create index organization_role_idx on public.organization (primary_role_code);
create index organization_search_idx on public.organization using gin (to_tsvector('spanish', name || ' ' || description));
create trigger organization_updated_at before update on public.organization
  for each row execute function public.set_updated_at();

-- Datos de contacto restringidos: nunca se exponen en vistas públicas.
create table public.organization_private (
  organization_id uuid primary key references public.organization (id) on delete cascade,
  contact_name text,
  contact_position text,
  contact_phone text check (contact_phone ~ '^[0-9+ ]{7,20}$'),
  contact_email text,
  address text,
  data_consent_at timestamptz,          -- P43 autorización de tratamiento de datos
  data_consent_text_version text,
  updated_at timestamptz not null default now()
);
create trigger organization_private_updated_at before update on public.organization_private
  for each row execute function public.set_updated_at();

create table public.organization_role (
  organization_id uuid not null references public.organization (id) on delete cascade,
  role_code text not null references public.cat_role (code),
  primary key (organization_id, role_code)
);

create table public.organization_territory (
  organization_id uuid not null references public.organization (id) on delete cascade,
  territory_code text not null references public.cat_territory (code),
  primary key (organization_id, territory_code)
);

create table public.organization_area (
  organization_id uuid not null references public.organization (id) on delete cascade,
  area_code text not null references public.cat_impact_area (code),
  primary key (organization_id, area_code)
);

create table public.organization_problem (
  organization_id uuid not null references public.organization (id) on delete cascade,
  problem_code text not null references public.cat_problem (code),
  primary key (organization_id, problem_code)
);
-- Respuestas "Otras: ¿cuál?" por área.
create table public.organization_problem_other (
  organization_id uuid not null references public.organization (id) on delete cascade,
  area_code text not null references public.cat_impact_area (code),
  text text not null,
  primary key (organization_id, area_code)
);

create table public.organization_goyn_space (
  organization_id uuid not null references public.organization (id) on delete cascade,
  space_code text not null references public.cat_goyn_space (code),
  primary key (organization_id, space_code)
);

-- Autopercepción del fortalecimiento (módulos 5–7): escala 1–10. No es público.
create table public.organization_assessment (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete cascade,
  period_label text not null,                      -- ej. "2026"
  alliances_strengthened smallint check (alliances_strengthened between 1 and 10),     -- P30
  design_capacity smallint check (design_capacity between 1 and 10),                  -- P31
  visibility smallint check (visibility between 1 and 10),                             -- P32
  youth_involvement smallint check (youth_involvement between 1 and 10),               -- P33
  shared_vision smallint check (shared_vision between 1 and 10),                       -- P34
  narrative jsonb not null default '{}'::jsonb,    -- P35–P37 (preguntas por definir por GOYN)
  created_at timestamptz not null default now(),
  unique (organization_id, period_label)
);

-- ─── Membresías ──────────────────────────────────────────────────────────────
create table public.organization_member (
  organization_id uuid not null references public.organization (id) on delete cascade,
  user_id uuid not null references public.profile (id) on delete cascade,
  role public.member_role not null default 'editor',
  status public.member_status not null default 'activo',
  invited_by uuid references public.profile (id),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);
create index organization_member_user_idx on public.organization_member (user_id);

-- ─── Ubicaciones ─────────────────────────────────────────────────────────────
create table public.location (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete cascade,
  label text not null default 'Sede principal',
  is_primary boolean not null default false,
  address text,
  municipality text,
  territory_code text references public.cat_territory (code),
  geom extensions.geography(point, 4326),
  precision public.location_precision not null default 'aproximada',
  source text not null default 'registro',          -- registro | geocodificador | centroide | manual
  created_at timestamptz not null default now(),
  constraint location_geom_when_precise check (precision = 'no_disponible' or geom is not null)
);
create index location_geom_gix on public.location using gist (geom);
create unique index location_one_primary on public.location (organization_id) where is_primary;

-- ─── Programas / proyectos (bloque de proyecto, módulo 9) ────────────────────
create table public.program (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete cascade,
  name text not null,
  description text not null,
  modality_code text not null references public.cat_modality (code),
  primary_area_code text not null references public.cat_impact_area (code),
  start_date date not null,
  end_date date,
  annual_goal int check (annual_goal >= 0),       -- meta de atención del año (0 = no sabe)
  link text,
  status public.publish_status not null default 'publicado',
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint program_dates check (end_date is null or end_date >= start_date)
);
create index program_org_idx on public.program (organization_id);
create trigger program_updated_at before update on public.program
  for each row execute function public.set_updated_at();

create table public.program_area (
  program_id uuid not null references public.program (id) on delete cascade,
  area_code text not null references public.cat_impact_area (code),
  primary key (program_id, area_code)
);
create table public.program_population (
  program_id uuid not null references public.program (id) on delete cascade,
  population_code text not null references public.cat_population (code),
  primary key (program_id, population_code)
);
create table public.program_territory (
  program_id uuid not null references public.program (id) on delete cascade,
  territory_code text not null references public.cat_territory (code),
  primary key (program_id, territory_code)
);

-- ─── Relaciones entre organizaciones (módulo 4) ──────────────────────────────
create table public.relation (
  id uuid primary key default gen_random_uuid(),
  source_org_id uuid not null references public.organization (id) on delete cascade,
  target_org_id uuid references public.organization (id) on delete cascade,
  target_name_free text,                               -- P23/P25/P27: actor no registrado
  relation_type_code text not null references public.cat_relation_type (code),
  state public.relation_state not null default 'existente',
  intensity smallint check (intensity between 1 and 5), -- definición pendiente (PRD §12.2)
  description text,
  evidence text,
  since date,
  status public.publish_status not null default 'publicado',
  created_at timestamptz not null default now(),
  constraint relation_target check (target_org_id is not null or target_name_free is not null),
  constraint relation_not_self check (source_org_id <> target_org_id)
);
-- Evita equivalentes para el mismo par y tipo, sin importar la dirección.
create unique index relation_pair_key on public.relation (
  least(source_org_id, target_org_id), greatest(source_org_id, target_org_id), relation_type_code
) where target_org_id is not null;

-- ─── Reportes de indicador ───────────────────────────────────────────────────
-- Suma de reportes validados, NO personas únicas (ADR 007). Cero es dato; nulo requiere motivo.
create table public.indicator_report (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete cascade,
  program_id uuid references public.program (id) on delete cascade,
  indicator_code text not null,
  indicator_version int not null default 1,
  period_label text not null,            -- ej. "2026-T1"
  period_start date not null,
  period_end date not null,
  value numeric(12, 0) check (value >= 0),
  value_women numeric(12, 0) check (value_women >= 0),
  null_reason text,
  source text,
  method text,
  status public.report_status not null default 'borrador',
  reported_by uuid references public.profile (id),
  reviewed_by uuid references public.profile (id),
  reviewed_at timestamptz,
  review_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (indicator_code, indicator_version) references public.indicator_definition (code, version),
  constraint indicator_report_period check (period_end >= period_start),
  constraint indicator_report_null_reason check (value is not null or null_reason is not null),
  constraint indicator_report_women check (value_women is null or value is null or value_women <= value)
);
create index indicator_report_lookup on public.indicator_report (indicator_code, period_label, status);
create unique index indicator_report_dedupe on public.indicator_report (
  organization_id, coalesce(program_id, '00000000-0000-0000-0000-000000000000'::uuid), indicator_code, period_label
) where status in ('enviado', 'aprobado');
create trigger indicator_report_updated_at before update on public.indicator_report
  for each row execute function public.set_updated_at();

-- ─── Oportunidades (Próximamente · FR-009) ───────────────────────────────────
-- El modelo queda listo; la vitrina pública se habilita con la bandera "oportunidades".
create table public.opportunity (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete cascade,
  program_id uuid references public.program (id) on delete set null,
  type public.opportunity_type not null,
  title text not null,
  description text,
  requirements text,
  modality_code text references public.cat_modality (code),
  starts_on date,
  ends_on date,
  seats int check (seats >= 0),
  link text,
  status public.publish_status not null default 'publicado',
  created_at timestamptz not null default now()
);

-- ─── Banderas de funcionalidad (módulos "Próximamente") ──────────────────────
create table public.feature_flag (
  code text primary key,
  enabled boolean not null default false,
  label text not null,
  phase text not null
);
insert into public.feature_flag (code, enabled, label, phase) values
  ('oportunidades', false, 'Oportunidades para jóvenes', 'MVP opcional'),
  ('historias', false, 'Historias de éxito', 'Fase 2 · 2027'),
  ('conexiones_grafo', false, 'Red de conexiones', 'Fase 2 · 2027'),
  ('conocimiento', false, 'Gestión del conocimiento', 'Fase 2 · 2027'),
  ('asistente_ia', false, 'Asistente IA', 'Fase 3 · 2028');
