-- GOYN Conecta BAQ · 008 · Almacenamiento de archivos (almacén D5).
-- logos: público (se muestran en perfiles). evidencias y exportaciones: privados con URL temporal.
-- Convención de rutas: <organization_id>/<archivo>. Exportaciones: <user_id>/<job_id>.<ext>.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('logos', 'logos', true, 2 * 1024 * 1024, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
  ('evidencias', 'evidencias', false, 10 * 1024 * 1024, array['application/pdf', 'image/png', 'image/jpeg', 'image/webp']),
  ('exportaciones', 'exportaciones', false, 50 * 1024 * 1024,
    array['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do nothing;

create policy "logos lectura pública" on storage.objects for select to anon, authenticated
  using (bucket_id = 'logos');

create policy "logos carga por miembros" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'logos'
    and (public.is_admin() or public.is_member(((storage.foldername(name))[1])::uuid))
  );

create policy "logos reemplazo por miembros" on storage.objects for update to authenticated
  using (bucket_id = 'logos' and (public.is_admin() or public.is_member(((storage.foldername(name))[1])::uuid)));

create policy "evidencias miembros y admin" on storage.objects for all to authenticated
  using (bucket_id = 'evidencias' and (public.is_admin() or public.is_member(((storage.foldername(name))[1])::uuid)))
  with check (bucket_id = 'evidencias' and (public.is_admin() or public.is_member(((storage.foldername(name))[1])::uuid)));

create policy "exportaciones solo admin propietario" on storage.objects for select to authenticated
  using (bucket_id = 'exportaciones' and public.is_admin() and (storage.foldername(name))[1] = auth.uid()::text);
