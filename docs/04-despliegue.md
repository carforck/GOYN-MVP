# Despliegue: Supabase + Vercel

## 1. Supabase (backend)

1. Crear un proyecto en Supabase (región sugerida: `us-east-1` o la más cercana acordada con GOYN).
2. Desde `backend/`:
   ```bash
   npx supabase login
   npx supabase link --project-ref <ref-del-proyecto>
   npx supabase db push                 # aplica las 8 migraciones
   npx supabase db push --include-seed  # opcional: carga las 42 organizaciones sintéticas (is_demo = true)
   ```
3. En **Authentication → URL Configuration**, poner como *Site URL* la URL de Vercel y agregar
   `https://<dominio>/auth/callback` en *Redirect URLs*.
4. Crear el primer superadministrador: registrarse en `/ingresar` y luego, en el editor SQL:
   ```sql
   update public.profile set platform_role = 'superadmin' where email = 'correo@goyn.org';
   ```
5. Retirar los datos demo antes del lanzamiento: `delete from public.organization where is_demo;`

## 2. Vercel (frontend)

1. Importar el repositorio `carforck/GOYN-MVP` en Vercel.
2. **Root Directory: `frontend`**. Framework: Next.js (se detecta solo). Node 22 o superior.
3. Variables de entorno (Production y Preview):

   | Variable | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave *publishable* (o *anon*) del proyecto |
   | `NEXT_PUBLIC_SITE_URL` | URL pública del sitio |

   Sin las dos primeras, el despliegue funciona en **modo demo**, útil para mostrar maquetas.
4. Cada pull request genera una URL de vista previa.

## 3. Verificación después de desplegar

- `/` muestra KPIs y el aviso demo desaparece si hay Supabase.
- `/mapa` carga teselas y marcadores (el worker de MapLibre se sirve desde `/maplibre/`).
- Registrar una organización de prueba, aprobarla desde `/admin/solicitudes` y verla en `/mapa`.
- `backend: npm test` pasa antes de cada cambio de migraciones.
