# Backend · Supabase

PostgreSQL 17 + PostGIS gestionado por Supabase. Todo el comportamiento de datos vive en migraciones versionadas.

## Migraciones (`supabase/migrations`)

| # | Archivo | Contenido |
|---|---|---|
| 001 | `extensiones_y_tipos` | PostGIS, pgcrypto, unaccent, enums de estados, `slugify` |
| 002 | `catalogos` | 11 catálogos + territorios con centroide + definiciones de indicador (generado) |
| 003 | `nucleo` | perfil, organización (+ privado), membresías, ubicaciones, programas, relaciones, reportes, oportunidades, banderas |
| 004 | `gobierno` | solicitudes de cambio, versiones, auditoría, notificaciones, bloques de contenido, exportaciones |
| 005 | `seguridad_rls` | `is_admin`, `is_member`, protección de roles y políticas RLS en todas las tablas |
| 006 | `vistas_publicas` | `v_public_organization`, `v_public_program`, `v_public_relation`, `v_public_indicator_report`, `v_ecosystem_stats` |
| 007 | `flujo_editorial` | `submit_change_request`, `decide_change_request`, `review_indicator_report` |
| 008 | `almacenamiento` | buckets `logos` (público), `evidencias` y `exportaciones` (privados) |

## Flujo editorial

```
Organización: borrador ──submit──▶ enviada ──decide(aprobar)──▶ aprobada → publicado + versión + auditoría
                     ▲                 │
                     └── ajustes ◀─────┤ decide(ajustes, comentarios por campo)
                                       └ decide(rechazar, motivo obligatorio) → rechazada
```

- Las tablas núcleo guardan **solo lo publicado**; la propuesta vive en `change_request.payload`.
- Aprobar aplica la propuesta en una sola transacción, crea `entity_version` y escribe `audit_log`.
- Bloqueo optimista: si la versión publicada cambió desde la propuesta, la aprobación falla y pide recargar.
- El sitio público lee únicamente las vistas `v_public_*`.

## Comandos

```bash
npm install
npm test               # migraciones + seed + 17 pruebas en PGlite (sin Docker)
npm run build:seed     # regenera seed.sql y los JSON demo del frontend
npm run build:catalogs # regenera la migración 002 desde scripts/catalogs.mjs (solo antes del primer push)
npm run db:push        # aplica migraciones al proyecto vinculado
npm run db:types       # genera tipos TypeScript para el frontend
```

`scripts/catalogs.mjs` es la **fuente única** de catálogos: de ahí salen la migración 002, el `seed.sql` y
`frontend/src/lib/demo/catalogs.json`. Cuando un catálogo ya esté en producción, los cambios van en una migración
nueva: los códigos usados no se borran, se desactivan.

## Escalar después

El modelo es PostgreSQL estándar. Si más adelante se migra fuera de Supabase, se reemplazan `auth.users`/`auth.uid()`
y `storage.*` por el proveedor elegido; tablas, vistas, RLS y funciones se conservan.
