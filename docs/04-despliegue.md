# Despliegue: Vercel + Supabase

MAR tiene **dos entornos** que salen del mismo código (rama `main` de `carforck/GOYN-MVP`). Cada uno es un proyecto
de Vercel distinto, conectado al repositorio, con **Root Directory `frontend`** y su propio proyecto de Supabase.

| Entorno | Sitio | Supabase | Variables propias |
|---|---|---|---|
| **Oficial** | https://mar.goynbarranquilla.com | Proyecto de GOYN con datos reales | Sin `NEXT_PUBLIC_DATOS_SINTETICOS` ni `NEXT_PUBLIC_CUENTAS_PRUEBA` |
| **Demo** | https://goyn-mar-demo.vercel.app y https://goyn-conecta-baq.vercel.app | Proyecto demo con seed sintético | `NEXT_PUBLIC_DATOS_SINTETICOS=1` y `NEXT_PUBLIC_CUENTAS_PRUEBA` |

La diferencia entre entornos es **solo de variables de entorno**. No hay ramas ni código específico por entorno.

## 1. Despliegue continuo (Vercel)

- Cada `git push` a `main` despliega **automáticamente los dos sitios**. No se usa `vercel deploy --prod` manual.
- Framework Next.js (se detecta solo), Node 22 o superior.
- Variables de entorno por proyecto (Production y Preview); la tabla completa está en
  [../frontend/README.md](../frontend/README.md#variables-de-entorno):
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL` en ambos;
  `NEXT_PUBLIC_DATOS_SINTETICOS` y `NEXT_PUBLIC_CUENTAS_PRUEBA` solo en la demo.
- Las variables `NEXT_PUBLIC_*` se incrustan en la compilación: después de cambiarlas hay que **redesplegar**.
- El dominio `mar.goynbarranquilla.com` apunta a Vercel desde el DNS del dominio de GOYN.

## 2. Supabase

1. Esquema: migraciones 001–018 de `backend/supabase/migrations`, aplicadas en **ambos** proyectos. Procedimiento
   para crear y aplicar una migración en cada entorno: [../backend/README.md](../backend/README.md#crear-y-aplicar-una-migración-nueva).
2. Datos: la demo usa `seed.sql` (42 organizaciones sintéticas, `is_demo = true`). **Nunca** cargar el seed en el
   proyecto oficial.
3. **Authentication → URL Configuration** de cada proyecto: *Site URL* = el sitio del entorno; en *Redirect URLs*
   el dominio del entorno con `/**` (cubre `/auth/confirm` y `/auth/callback`) y `http://localhost:3000/**` solo en
   la demo.
4. **Correo de Auth:** SMTP propio (buzón no-reply del dominio de GOYN, en Hostinger) y plantillas en español con
   enlaces `token_hash` hacia `/auth/confirm` (sirven en otro dispositivo). Se configuran en el panel de Supabase,
   no en el repositorio. Sin SMTP propio Supabase limita mucho los envíos y los correos de restablecer pueden no
   llegar.
5. **Cuentas:**
   - Organizaciones del oficial: las crea el equipo con una clave inicial y `user_metadata.must_change_password = true`;
     en el primer ingreso la app obliga a cambiarla en `/cambiar-clave`. La clave inicial se entrega por canal
     privado y nunca se escribe en el repositorio.
   - Equipo GOYN / superadministración: una vez creada la cuenta, en el editor SQL:
     ```sql
     update public.profile set platform_role = 'admin_goyn' where email = '<correo>';  -- o 'superadmin'
     ```
   - Cuentas de prueba (solo demo): `frontend/scripts/crear-usuarios-prueba.mjs` y la variable
     `NEXT_PUBLIC_CUENTAS_PRUEBA` del proyecto demo en Vercel.

## 3. Checklist de despliegue

Antes del push:

- [ ] `backend: npm test` pasa (si hubo cambios de base de datos).
- [ ] Migraciones nuevas aplicadas en **demo y oficial** (`npx supabase migration list` en cada uno).
- [ ] `frontend: npm run lint` y `npm run build` sin errores.
- [ ] `git status` limpio de secretos: nada de `.env.local`, llaves, claves iniciales ni datos personales (el repo es público).

Después del push (Vercel despliega ambos):

- [ ] Revisar primero la **demo**: `/`, `/mapa`, `/actores`, `/impacto`, `/ingresar` con una cuenta de prueba, `/panel` y `/admin`.
- [ ] Revisar el **oficial**: https://mar.goynbarranquilla.com responde 200, sin franja de datos sintéticos y sin cuentas de prueba en `/ingresar`.
- [ ] `GET /api/salud` devuelve `ok` en ambos.
- [ ] Si algo falla, en Vercel se puede volver al despliegue anterior (*Instant Rollback*) mientras se corrige.

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
