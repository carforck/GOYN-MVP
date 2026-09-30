# GOYN Conecta BAQ · MVP

Plataforma de mapeo de actores y acciones conjuntas del **Colaborativo GOYN Barranquilla**, fase **Mapear 2026**.
Permite ver, conectar y medir lo que hacen las organizaciones del ecosistema por las juventudes de Barranquilla
y su área metropolitana.

```
GOYN-MVP/
├── frontend/   Next.js 16 (App Router) + TypeScript + Tailwind 4 + shadcn/ui (Base UI) + three.js (R3F) + MapLibre + Recharts + Motion → Vercel
├── backend/    Supabase: migraciones SQL (PostgreSQL + PostGIS), RLS, flujo editorial, seed demo, pruebas → Supabase
└── docs/       Vistas y rutas, validación PRD ↔ base de datos, identidad de marca, despliegue
```

Frontend y backend están separados: el frontend solo habla con Supabase a través de las **vistas públicas**
(lista blanca de columnas) y de las **funciones del flujo editorial** (`submit_change_request`,
`decide_change_request`). La autorización real vive en la base de datos (RLS), no en la interfaz.

## Arranque rápido

```bash
# Frontend (sin variables de Supabase arranca en MODO DEMO con 42 organizaciones sintéticas)
cd frontend
npm install
npm run dev            # http://localhost:3000

# Backend: probar migraciones + seed + flujo editorial sin Docker (PGlite con PostGIS)
cd backend
npm install
npm test               # 20 pruebas: RLS, publicación, auditoría, roles, tiempo real y líneas de trabajo
```

En modo demo, `/ingresar` permite entrar como **Organización**, **Equipo GOYN** o **Superadministración**
para recorrer el panel y la consola.

## Documentación

| Documento | Contenido |
|---|---|
| [docs/01-vistas-y-rutas.md](docs/01-vistas-y-rutas.md) | Cómo se estructuran las vistas, rutas, roles y componentes |
| [docs/02-validacion-prd-base-de-datos.md](docs/02-validacion-prd-base-de-datos.md) | Matriz Instrumento/PRD → tablas, inconsistencias encontradas y decisiones pendientes |
| [docs/03-identidad-de-marca.md](docs/03-identidad-de-marca.md) | Colores, tipografías, íconos y texturas verificados en los recursos entregados |
| [docs/04-despliegue.md](docs/04-despliegue.md) | Supabase + Vercel paso a paso, variables de entorno |
| [docs/05-api.md](docs/05-api.md) | API REST (Supabase/PostgREST), funciones del flujo editorial, tiempo real y rutas de la app |
| [docs/06-dependencias-y-licencias.md](docs/06-dependencias-y-licencias.md) | Dependencias de terceros, licencias y atribuciones |
| [backend/README.md](backend/README.md) | Modelo de datos, flujo editorial y comandos |

## Fuentes

PRD v1.0, Informe de hallazgos S1-042026 (Inngenios), presentación del Colaborativo S1-042026, Instrumento de mapeo
de actores, flujo de usuario, backlog del MVP, documentos de arquitectura (20-sep-2026), formulario Polaris (GOYN
Bogotá) y recursos gráficos de GOYN Barranquilla. Las fotos provienen de goynbarranquilla.com, convertidas a WebP.
