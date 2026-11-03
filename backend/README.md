# Backend · Supabase

PostgreSQL 17 + PostGIS gestionado por Supabase. Todo el comportamiento de datos vive en migraciones versionadas
en `supabase/migrations`. MAR tiene **dos proyectos de Supabase**, uno por entorno, con el **mismo esquema**:

| Entorno | Sitio | Datos |
|---|---|---|
| Oficial | https://mar.goynbarranquilla.com | Datos reales. **Nunca** se carga `seed.sql` |
| Demo | https://goyn-mar-demo.vercel.app | Seed sintético (`is_demo = true`) y cuentas de prueba |

La carpeta `backend/` está enlazada (`supabase link`) al proyecto de la **demo**; `supabase/config.toml` refleja la
configuración de Auth de la demo. La configuración de Auth del oficial (Site URL, Redirect URLs, SMTP, plantillas)
se mantiene en su panel de Supabase.

## Migraciones (`supabase/migrations`)

| # | Archivo | Contenido |
|---|---|---|
| 001 | `extensiones_y_tipos` | PostGIS, pgcrypto, unaccent, enums de estados y roles, `slugify` |
| 002 | `catalogos` | 11 catálogos + territorios con centroide + definiciones de indicador (generado) |
| 003 | `nucleo` | perfil, organización (+ privado), membresías (titular/editor), ubicaciones, programas, relaciones, reportes, oportunidades, banderas |
| 004 | `gobierno` | solicitudes de cambio, versiones, auditoría, notificaciones, bloques de contenido, exportaciones |
| 005 | `seguridad_rls` | `is_admin`, `is_superadmin`, `is_member`, `is_titular`, protección de roles de plataforma y RLS en todas las tablas |
| 006 | `vistas_publicas` | `v_public_organization`, `v_public_program`, `v_public_relation`, `v_public_indicator_report`, `v_ecosystem_stats` |
| 007 | `flujo_editorial` | `submit_change_request`, `decide_change_request`, `review_indicator_report` |
| 008 | `almacenamiento` | buckets `logos` (público), `evidencias` y `exportaciones` (privados) |
| 009 | `tiempo_real` | aviso en el canal público de Realtime `ecosistema` al publicar (solo datos públicos) |
| 010 | `lineas_de_trabajo` | catálogo de líneas de trabajo y su columna en la vista pública |
| 011 | `programas_por_separado` | editar/agregar programas sin rehacer el registro; mostrar u ocultar programas |
| 012 | `areas_de_impacto_diseno` | nombres, colores y definiciones de las áreas de impacto |
| 013 | `ubicaciones_demo_dentro_de_localidad` | corrige ubicaciones de organizaciones sintéticas (solo `is_demo`) |
| 014 | `roles_definiciones_narrativa` | definiciones de los roles del ecosistema |
| 015 | `contacto_solo_autenticados` | sitio web, redes y correo de contacto solo para usuarios con sesión |
| 016 | `indicadores_por_anio` | reportes de indicador por año (antes trimestrales) |
| 017 | `registro_nit_disponible` | comprobar que el NIT esté disponible antes de enviar el registro |
| 018 | `programas_destacados` | hasta 3 programas destacados por organización; todos siguen sumando en las cifras |

## Flujo editorial

```
Organización: borrador ──submit──▶ enviada ──decide(aprobar)──▶ aprobada → publicado + versión + auditoría
                     ▲                 │
                     └── ajustes ◀─────┤ decide(ajustes, comentarios por campo)
                                       └ decide(rechazar, motivo obligatorio) → rechazada
```

- Las tablas núcleo guardan **solo lo publicado**; la propuesta vive en `change_request.payload`.
- Aprobar aplica la propuesta en una sola transacción, crea `entity_version` y escribe `audit_log`. Quien envió el
  registro queda como **titular** de la organización.
- Bloqueo optimista: si la versión publicada cambió desde la propuesta, la aprobación falla y pide recargar.
- El sitio público lee únicamente las vistas `v_public_*`.

## Comandos

```bash
npm install
npm test               # migraciones + seed + pruebas de RLS y flujo editorial en PGlite (sin Docker)
npm run build:seed     # regenera seed.sql y los JSON demo del frontend
npm run build:catalogs # regenera la migración 002 desde scripts/catalogs.mjs (solo antes del primer push)
npm run db:push        # = supabase db push, sobre el proyecto enlazado (demo)
npm run db:types       # genera tipos TypeScript para el frontend desde el proyecto enlazado
```

`scripts/catalogs.mjs` es la **fuente única** de catálogos: de ahí salen la migración 002, el `seed.sql` y
`frontend/src/lib/demo/catalogs.json`. Con los catálogos ya en producción, los cambios van en una migración nueva:
los códigos usados no se borran, se desactivan.

## Crear y aplicar una migración nueva

1. Crear el archivo con el siguiente número y una descripción en español:
   ```bash
   npx supabase migration new nombre_descriptivo   # o a mano: supabase/migrations/AAAAMMDD0000NN_nombre.sql
   ```
   Escribirla de forma idempotente cuando se pueda y **sin depender de datos sintéticos** (debe correr igual en la
   base oficial). Si toca RLS o vistas públicas, revisar que no exponga columnas privadas.
2. Probarla: `npm test`.
3. Aplicarla en la **demo** (proyecto enlazado en `backend/`):
   ```bash
   npx supabase db push
   ```
4. Aplicarla en el **oficial** con su propio token y enlace, sin cambiar el enlace de `backend/` (por ejemplo, desde
   una carpeta de trabajo aparte, fuera del repo, que contenga una copia de `supabase/`):
   ```bash
   export SUPABASE_ACCESS_TOKEN=…            # token personal con acceso a la organización de GOYN; no se versiona
   npx supabase link --project-ref <ref-oficial>
   npx supabase db push
   unset SUPABASE_ACCESS_TOKEN
   ```
   Verificar con `npx supabase migration list` que ambos proyectos quedaron en la misma migración.
5. Recién entonces hacer push del código que depende de la migración (el push despliega los dos sitios).

> **Nunca** ejecutar `seed.sql` ni `supabase db push --include-seed` / `npm run db:seed` contra el proyecto
> oficial: carga 42 organizaciones sintéticas. Ese comando es solo para la demo.

## Escalar después

El modelo es PostgreSQL estándar. Si más adelante se migra fuera de Supabase, se reemplazan `auth.users`/`auth.uid()`
y `storage.*` por el proveedor elegido; tablas, vistas, RLS y funciones se conservan.
