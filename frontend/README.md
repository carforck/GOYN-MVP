# Frontend · MAR (Mapa de Actores y Resultados)

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui (Base UI) ·
MapLibre GL 6 · Recharts · Motion · Supabase SSR (`@supabase/ssr`).

Se despliega en Vercel con **Root Directory `frontend`**. Cada push a `main` despliega automáticamente el entorno
oficial (https://mar.goynbarranquilla.com) y la demo (https://goyn-mar-demo.vercel.app). Ver
[../docs/04-despliegue.md](../docs/04-despliegue.md).

## Requisitos

- **Node.js 22 o superior** (`engines` en `package.json`; `@supabase/supabase-js` también lo recomienda).
  Node 20 arranca, pero muestra advertencias de versión.
- npm.

## Desarrollo local

```bash
cp .env.example .env.local   # completar (ver abajo); nunca versionar .env.local
npm install                  # postinstall copia el worker de MapLibre a public/maplibre
npm run dev                  # http://localhost:3000
```

Para trabajar con datos, apunta `.env.local` a la **base demo** (URL y clave *publishable* del proyecto Supabase
de la demo, `NEXT_PUBLIC_DATOS_SINTETICOS=1`). No uses la base oficial en desarrollo. Sin variables de Supabase la
app corre en **modo demo local**: lee `src/lib/demo/*.json` y permite recorrer panel y consola eligiendo un rol, sin
escribir en ninguna base.

| Script | Para qué |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Compilación de producción y servidor |
| `npm run lint` | ESLint |
| `npm run typecheck` | `next typegen` + `tsc --noEmit` |
| `node scripts/copy-maplibre-worker.mjs` | Copia el worker de MapLibre (lo corre `postinstall`) |
| `node scripts/crear-usuarios-prueba.mjs` | Crea/rota las cuentas de prueba de la **demo** (requiere la llave secreta en `SUPABASE_SERVICE_ROLE_KEY`, solo por variable de entorno; ver cabecera del script) |
| `scripts/crear-usuarios-prueba.sql` | Alternativa SQL para asignar los roles de esas cuentas |

Si aparecen errores de tipos en rutas (`PageProps`, `LayoutProps`, `RouteContext`, enlaces tipados), regenera los
tipos con `npx next typegen`.

## Variables de entorno

Plantilla en [`.env.example`](.env.example). Todas son públicas (`NEXT_PUBLIC_*`, llegan al navegador): **nunca**
pongas aquí llaves secretas (`service_role` / `sb_secret_…`).

| Variable | Oficial | Demo | Para qué |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | sí | sí | URL del proyecto Supabase del entorno. Vacía → modo demo local |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | sí | sí | Clave *publishable* (o *anon*) del mismo proyecto. Se acepta `NEXT_PUBLIC_SUPABASE_ANON_KEY` como alternativa heredada |
| `NEXT_PUBLIC_SITE_URL` | sí | sí | URL pública del sitio: `metadataBase` y respaldo del origen en los enlaces de correo |
| `NEXT_PUBLIC_DATOS_SINTETICOS` | no | `1` | `"1"` activa el modo demo con base conectada: franja de datos sintéticos y recorrido por roles |
| `NEXT_PUBLIC_CUENTAS_PRUEBA` | no | sí | JSON con las cuentas de prueba que se muestran en `/ingresar`. Formato en `src/app/(auth)/cuentas-prueba.ts`. Si existe, `/ingresar` muestra solo esas cuentas en lugar del formulario |

`src/lib/config.ts` y `src/proxy.ts` son los únicos lugares que leen estas variables (más `layout.tsx` para
`NEXT_PUBLIC_SITE_URL` y `cuentas-prueba.ts`). En Vercel se definen por proyecto (oficial y demo por separado).

## Autenticación

- **Ingreso** con correo y contraseña (`signIn` en `src/app/(auth)/actions.ts`). En la demo también se acepta el
  usuario corto de las cuentas de prueba.
- **Crear cuenta** exige marcar la casilla de la **Política de tratamiento de datos** (Fundación Corona); la fecha
  de aceptación queda en `user_metadata`.
- **Cambio de clave obligatorio en el primer ingreso:** las cuentas creadas por el equipo con clave inicial llevan
  `user_metadata.must_change_password = true`. Se redirige a `/cambiar-clave` desde tres puntos: `proxy.ts`,
  `signIn` y los layouts de `/panel` y `/admin`. Al guardar, la marca pasa a `false`.
- **¿Olvidaste tu contraseña?** envía un correo de restablecimiento. Las plantillas de correo usan enlaces con
  `token_hash` hacia **`/auth/confirm`** (`verifyOtp`), por lo que funcionan aunque se abran en otro dispositivo o
  navegador. Un enlace vencido o ya usado vuelve a `/ingresar` con un aviso.
- **`/auth/callback`** atiende el flujo con `code` (PKCE, mismo navegador).
- Los correos de Auth salen por **SMTP propio** (buzón no-reply del dominio de GOYN, en Hostinger) con plantillas en
  español. El SMTP y las plantillas se configuran en el panel de Supabase de cada entorno, **no en este repo**.

## Estructura

```
src/
├── app/
│   ├── (publico)/   inicio, mapa, actores, impacto, registro y páginas "Próximamente"
│   ├── (auth)/      ingresar, cambiar-clave, auth/confirm, auth/callback, acciones de sesión, cuentas de prueba
│   ├── panel/       panel de organización (registro, programas, indicadores, relaciones)
│   ├── admin/       consola GOYN (solicitudes, organizaciones, exportar, auditoría, catálogos)
│   └── api/         /api/ecosistema (instantánea en vivo) y /api/salud (monitoreo)
├── components/      marca, layout, ecosistema (mapa, gráficas, fichas), formularios, ui (shadcn)
├── lib/             config, auth, repositorio de datos (Supabase o JSON demo), clientes Supabase, métricas
└── proxy.ts         refresco de sesión, protección de /panel y /admin, cambio de clave obligatorio
scripts/             worker de MapLibre y cuentas de prueba de la demo
public/              imágenes, tipografías de respaldo del mapa, texturas del globo
```

Más detalle en [../docs/01-vistas-y-rutas.md](../docs/01-vistas-y-rutas.md).
