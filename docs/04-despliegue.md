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

## Resistencia del mapa y monitoreo

El mapa está diseñado para funcionar aunque fallen servicios externos:

| Falla | Qué pasa |
|---|---|
| OpenFreeMap no responde (5 s) | El mapa base cambia a CARTO dark-matter |
| OpenFreeMap y CARTO caídos | Fondo azul de la marca con el aviso "Calles no disponibles"; organizaciones, clústeres, alianzas y territorios siguen visibles |
| Sin WebGL en el navegador | Mensaje explicativo y lista de organizaciones (sin intro del globo) |
| Texturas del globo no cargan | El globo se dibuja como esfera de color de marca |
| Error inesperado en el mapa o el globo | Se aísla con un límite de error; la página y la lista siguen en pie. Pantallas `error.tsx` con la marca |
| Cámara en estado inválido | Vigilante que reubica el mapa en Barranquilla |

Nota: el vuelo de llegada usa `easeTo`. En MapLibre 6.11.2, `flyTo` con proyección de globo deja el zoom en NaN según el alto del contenedor (11 de 72 tamaños probados) y congela el mapa.

Las tipografías de respaldo (Noto Sans, OFL) están en `frontend/public/fonts`.

**Monitoreo:** `GET /api/salud` devuelve `ok`, `degradado` (el mapa está en respaldo) o `caido` (503). `docs/monitoreo/salud.yml` (copiarlo a `.github/workflows/` para activarlo; requiere un token con permiso `workflow` o crearlo desde la web de GitHub) lo revisa cada 30 minutos junto con las páginas principales; si falla, GitHub avisa por correo. Para apuntar a otro dominio, define la variable de repositorio `SITE_URL`.
