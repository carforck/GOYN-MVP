# API

La plataforma expone dos capas de API. Ambas respetan los permisos de la base de datos (RLS): nada
que no sea público se puede leer sin sesión y rol.

## 1. API REST de Supabase (PostgREST) — `https://<proyecto>.supabase.co/rest/v1`

Supabase genera automáticamente la especificación **OpenAPI** del esquema en
`GET /rest/v1/` (cabecera `apikey: <clave publishable>`). Los recursos relevantes:

### Lectura pública (anónima)

| Recurso | Método | Contenido |
|---|---|---|
| `v_public_organization` | GET | Organizaciones publicadas: identidad, tipo, roles, territorios, áreas, problemáticas, líneas de trabajo, poblaciones, ubicación, conteos |
| `v_public_program` | GET | Programas publicados con áreas, poblaciones, territorios y vigencia |
| `v_public_relation` | GET | Conexiones existentes entre organizaciones publicadas (socio / aliado / colaborador) |
| `v_public_indicator_report` | GET | Reportes de indicador aprobados (suma de reportes validados, no personas únicas) |
| `v_ecosystem_stats` | GET | Totales del ecosistema para la home |
| `cat_*`, `indicator_definition`, `feature_flag` | GET | Catálogos del marco común |

Filtros de ejemplo: `v_public_organization?territory_codes=ov.{amb_soledad}&org_type_code=eq.colectivo_juvenil&order=name`.

### Escritura autenticada (organización)

| Recurso | Método | Regla |
|---|---|---|
| `change_request` | POST / PATCH | Solo borradores propios (`requested_by = auth.uid()`); no puede autoaprobarse |
| `indicator_report` | POST / PATCH | Solo miembros de la organización, estado `borrador` o `enviado` |
| `rpc/submit_change_request` | POST `{ p_id }` | Envía un borrador a validación (exige la autorización de datos) |

### Decisiones del equipo GOYN (rol `admin_goyn` o `superadmin`)

| Función | Parámetros | Efecto |
|---|---|---|
| `rpc/decide_change_request` | `p_id`, `p_decision` (`aprobar` \| `ajustes` \| `rechazar`), `p_reason`, `p_field_comments` | Aprueba y publica en una transacción, pide ajustes por campo o rechaza con motivo. Queda en auditoría |
| `rpc/review_indicator_report` | `p_id`, `p_approve`, `p_comment` | Aprueba o rechaza un reporte de indicador |

### Tiempo real

Canal público de Supabase Realtime **`ecosistema`**, evento **`cambio`**. Se emite al publicar una
organización, una relación o un reporte aprobado (migración 009). El mensaje solo trae datos públicos:
`kind`, `orgSlug`, `orgName`, `territory`, `lat`, `lng` y, en reportes, `indicator` y `delta`.

## 2. API de la aplicación (Next.js) — `https://<dominio>`

| Ruta | Método | Acceso | Respuesta |
|---|---|---|---|
| `/api/ecosistema` | GET | Público | Instantánea en vivo: `stats`, `territories`, `orgs` (id, slug, nombre, territorio, rol, lat/lng), `events` recientes, `source` (`demo` \| `supabase`) |
| `/admin/exportar/descargar` | GET | Admin GOYN | `?dataset=organizaciones\|programas\|indicadores&format=csv\|xlsx` + filtros opcionales `tipo`, `rol`, `area`, `linea`, `territorio`, `periodo`. Registra la exportación en `export_job` |
| `/auth/callback` | GET | Público | Intercambia el código de confirmación de Supabase Auth por la sesión |

Las acciones de servidor (formularios de registro, captura de indicadores, decisiones de la consola)
llaman a las funciones de la sección 1 con la sesión del usuario.
