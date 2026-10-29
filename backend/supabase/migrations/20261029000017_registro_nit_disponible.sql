-- GOYN Conecta BAQ · 017 · Registro: comprobar NIT antes de enviar (prueba GOYN 2026-10-30).
--
-- organization.nit es único (índice organization_nit_key). Si una organización envía un NIT que ya
-- existe, la aprobación de GOYN falla con un error de índice. La tabla organization solo la leen
-- miembros y admin (RLS), así que el formulario no puede comprobarlo: esta función responde solo
-- sí/no (no expone qué organización tiene el NIT). Compara solo dígitos ("900.123.456-7" =
-- "9001234567") para atrapar también variantes de formato.
--
-- Nota: no se modifica decide_change_request ni apply_organization_payload. apply_organization_payload
-- (007) ya copia payload.contacto.email a organization_private.contact_email; el formulario no lo
-- pedía. Desde 2026-10-29 lo pide (opcional) y, si queda vacío, usa el correo público.

create or replace function public.registration_nit_taken(p_nit text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization
    where nit is not null
      and nullif(regexp_replace(p_nit, '\D', '', 'g'), '') is not null
      and regexp_replace(nit, '\D', '', 'g') = regexp_replace(p_nit, '\D', '', 'g')
  );
$$;
revoke all on function public.registration_nit_taken(text) from public, anon;
grant execute on function public.registration_nit_taken(text) to authenticated;
