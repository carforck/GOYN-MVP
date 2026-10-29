-- GOYN Conecta BAQ · Alternativa SQL a crear-usuarios-prueba.mjs (#15, prueba 2026-10-30).
-- Para Supabase → SQL Editor del proyecto GoynMvp. NO contiene contraseñas.
--
-- 1) Crear las 3 cuentas SIN depender de correo: Supabase → Authentication → Users → "Add user"
--    → "Create new user", marcar "Auto Confirm User", con una contraseña generada en tu equipo
--    (p. ej. `openssl rand -base64 18`). El trigger on_auth_user_created crea public.profile.
-- 2) Reemplaza DOMINIO abajo y ejecuta este bloque para asignar los roles.
--    En el SQL Editor auth.uid() es nulo, así que guard_platform_role permite el cambio.

update public.profile p
set platform_role = v.role::public.platform_role,
    full_name = coalesce(p.full_name, v.full_name)
from (values
  ('prueba.organizacion@DOMINIO', 'usuario',    'Prueba Organización'),
  ('prueba.goyn@DOMINIO',         'admin_goyn', 'Prueba Equipo GOYN'),
  ('prueba.superadmin@DOMINIO',   'superadmin', 'Prueba Superadministración')
) as v(email, role, full_name)
where lower(p.email) = lower(v.email);

-- 3) Verificación (solo lectura).
select p.email, p.platform_role, u.email_confirmed_at is not null as correo_confirmado,
       (select string_agg(o.name || ' (' || m.role || '/' || m.status || ')', ', ')
          from public.organization_member m join public.organization o on o.id = m.organization_id
         where m.user_id = p.id) as membresias
from public.profile p
join auth.users u on u.id = p.id
where p.email ilike 'prueba.%@DOMINIO'
order by p.email;

-- 4) Después de la prueba: ver la organización registrada (debe salir con lat/lng para el mapa).
-- select id, slug, name, is_demo, lat, lng, location_precision
-- from public.v_public_organization where not is_demo order by updated_at desc;

-- 5) Limpieza OPCIONAL al terminar (no se ejecuta sola; revisar antes):
--    a) organización de prueba (borra en cascada ubicación, programas, membresías, reportes):
--       delete from public.organization where slug = '<slug-de-la-org-de-prueba>' and not is_demo;
--    b) solicitudes de la cuenta de prueba:
--       delete from public.change_request where requested_by in
--         (select id from public.profile where email ilike 'prueba.%@DOMINIO');
--    c) las 3 cuentas: Authentication → Users → Delete user (borra profile en cascada).
--       Ojo: audit_log/entity_version pueden referenciar al usuario; si el borrado falla por FK,
--       deja las cuentas y solo bájales el rol: update public.profile set platform_role = 'usuario' where ...
