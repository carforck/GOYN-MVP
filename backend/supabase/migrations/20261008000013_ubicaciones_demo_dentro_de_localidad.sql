-- 013 · Ubicaciones de prueba dentro de su localidad (antes una caía en el mar y otras en la localidad vecina).
-- Solo afecta organizaciones de demostración (is_demo); las reales se ubican en el centro de su zona.
-- Fundación Semillas del Caribe
update public.location set geom = extensions.st_setsrid(extensions.st_makepoint(-74.79093, 10.98412), 4326)::extensions.geography
where organization_id = '8d790d05-f30c-4ff8-aad6-9d1937f3e578' and is_primary and organization_id in (select id from public.organization where is_demo);
-- Universidad Ribera del Magdalena
update public.location set geom = extensions.st_setsrid(extensions.st_makepoint(-74.79953, 10.98504), 4326)::extensions.geography
where organization_id = '63d50713-5efe-4bc4-a74d-7514702d7299' and is_primary and organization_id in (select id from public.organization where is_demo);
-- Agencia de Empleo Oportunidad Costa
update public.location set geom = extensions.st_setsrid(extensions.st_makepoint(-74.95784, 10.99075), 4326)::extensions.geography
where organization_id = '7e97d341-c072-475f-a297-b3af79fd1419' and is_primary and organization_id in (select id from public.organization where is_demo);
-- Corporación Sabanagrande Emprende
update public.location set geom = extensions.st_setsrid(extensions.st_makepoint(-74.81605, 10.94959), 4326)::extensions.geography
where organization_id = '5ab4c8d5-5fd3-41a0-a8ff-db55205e7428' and is_primary and organization_id in (select id from public.organization where is_demo);
-- Fundación Salud Mental Costa
update public.location set geom = extensions.st_setsrid(extensions.st_makepoint(-74.8006, 10.94027), 4326)::extensions.geography
where organization_id = '847d9d73-abfa-46dd-a7f6-af2a691b8ef7' and is_primary and organization_id in (select id from public.organization where is_demo);
-- Fundación Rutas de Vida
update public.location set geom = extensions.st_setsrid(extensions.st_makepoint(-74.79983, 10.93224), 4326)::extensions.geography
where organization_id = '1a4e05bb-913c-41cc-a1a9-b906f20f5505' and is_primary and organization_id in (select id from public.organization where is_demo);
