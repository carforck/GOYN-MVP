# MAR · Mapa de Actores y Resultados

**Mapa de Actores y Resultados (MAR)** es la plataforma del **Colaborativo GOYN Barranquilla** para ver, conectar
y medir lo que hacen las organizaciones del ecosistema por las juventudes de **Barranquilla y su área
metropolitana**. Durante el desarrollo se llamó "GOYN Conecta BAQ"; ese nombre todavía aparece en algunos
identificadores técnicos (nombre de paquetes, `project_id` local de Supabase, comentarios de migraciones).

| Entorno | URL | Datos |
|---|---|---|
| **Oficial** | https://mar.goynbarranquilla.com | Datos reales del ecosistema. Sin datos sintéticos ni cuentas de prueba |
| **Demo** | https://goyn-mar-demo.vercel.app (también https://goyn-conecta-baq.vercel.app) | Datos sintéticos y cuentas de prueba visibles en `/ingresar` |

Los dos entornos salen **del mismo código** (rama `main`). Cada uno tiene su propio proyecto de Supabase; la
única diferencia entre ellos son las variables de entorno.

## Arquitectura

```
GOYN-MVP/
├── frontend/           Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS 4 + shadcn/ui (Base UI)
│                       + MapLibre GL + Recharts + Motion + Supabase SSR  → Vercel (Root Directory: frontend)
├── backend/supabase/   Migraciones SQL 001–018 (PostgreSQL 17 + PostGIS), RLS, vistas públicas v_public_*,
│                       flujo editorial, seed sintético                    → Supabase (un proyecto por entorno)
├── backend/tests/      Pruebas de migraciones + seed + flujo editorial en PGlite (sin Docker)
└── docs/               Vistas y rutas, validación PRD ↔ base de datos, marca, despliegue, API, licencias
```

- El frontend solo lee lo público a través de las **vistas `v_public_*`** (lista blanca de columnas) y escribe
  mediante las **funciones del flujo editorial** (`submit_change_request`, `decide_change_request`, …).
- La autorización real vive en la base de datos (**RLS** + funciones `security definer`). El `proxy.ts` y los
  layouts solo evitan mostrar pantallas a quien no tiene sesión o rol.
- **Despliegue continuo:** Vercel está conectado al repositorio. Cada `git push` a `main` despliega
  **automáticamente los dos entornos** (oficial y demo). No se usa `vercel deploy` manual.

## Roles

| Rol | Qué ve y qué hace |
|---|---|
| **Visitante** (sin sesión) | Inicio, mapa, directorio, hojas de vida resumidas e impacto. No ve sitio web, redes ni correo de contacto (migración 015) |
| **Organización** (`platform_role = usuario`) | `/panel`: registra su organización, propone cambios, gestiona programas (hasta 3 destacados), reporta indicadores por año y ve conexiones. Los cambios quedan pendientes hasta que GOYN los apruebe. Dentro de cada organización hay membresías **titular** (además administra las membresías) y **editor** |
| **Equipo GOYN** (`admin_goyn`) | `/admin`: bandeja de solicitudes (aprobar, pedir ajustes por campo o rechazar con motivo), revisión de reportes, organizaciones, exportaciones CSV/XLSX y auditoría. Lee todos los datos, incluidos los privados |
| **Superadministración** (`superadmin`) | Todo lo de GOYN, más catálogos del marco común (`/admin/catalogos`) y cambio de roles de plataforma |

## Arranque rápido

```bash
cd frontend
cp .env.example .env.local   # completar con la URL y la clave publishable del proyecto demo
npm install
npm run dev                  # http://localhost:3000
```

Sin variables de Supabase la app arranca en **modo demo local** (datos sintéticos desde JSON y recorrido por
roles sin cuenta). Para el detalle de requisitos, variables y base de datos ver
[frontend/README.md](frontend/README.md), [backend/README.md](backend/README.md) y
[docs/04-despliegue.md](docs/04-despliegue.md).

```bash
cd backend
npm install
npm test                     # migraciones + seed + pruebas de RLS y flujo editorial en PGlite
```

## Flujo de trabajo

1. Trabajar en local contra la base **demo** (nunca contra la oficial).
2. Si hay cambios de base de datos: nueva migración en `backend/supabase/migrations`, `npm test` en `backend/`, y
   aplicarla **a los dos proyectos de Supabase** antes del push (ver [backend/README.md](backend/README.md)).
3. `npm run lint` y `npm run build` en `frontend/`.
4. `git push origin main` → Vercel despliega oficial y demo.
5. Revisar primero la demo y luego https://mar.goynbarranquilla.com.

## Documentación

| Documento | Contenido |
|---|---|
| [frontend/README.md](frontend/README.md) | Requisitos, variables de entorno, autenticación, scripts y estructura del frontend |
| [backend/README.md](backend/README.md) | Migraciones 001–018, flujo editorial, cómo crear y aplicar migraciones en cada entorno |
| [docs/01-vistas-y-rutas.md](docs/01-vistas-y-rutas.md) | Vistas, rutas, roles y componentes |
| [docs/02-validacion-prd-base-de-datos.md](docs/02-validacion-prd-base-de-datos.md) | Matriz Instrumento/PRD → tablas, inconsistencias y decisiones |
| [docs/03-identidad-de-marca.md](docs/03-identidad-de-marca.md) | Colores, tipografías, íconos y texturas |
| [docs/04-despliegue.md](docs/04-despliegue.md) | Entornos, Vercel, Supabase, Auth/SMTP y checklist de despliegue |
| [docs/05-api.md](docs/05-api.md) | API REST (Supabase/PostgREST), funciones del flujo editorial, tiempo real y rutas de la app |
| [docs/06-dependencias-y-licencias.md](docs/06-dependencias-y-licencias.md) | Dependencias de terceros, licencias y atribuciones |

## Fuentes

PRD v1.0, Informe de hallazgos S1-042026 (Inngenios), presentación del Colaborativo S1-042026, Instrumento de mapeo
de actores, flujo de usuario, backlog del MVP, documentos de arquitectura (20-sep-2026), formulario Polaris (GOYN
Bogotá) y recursos gráficos de GOYN Barranquilla. Las fotos provienen de goynbarranquilla.com, convertidas a WebP.
