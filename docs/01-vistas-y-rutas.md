# Vistas y rutas

La aplicación tiene **tres áreas** con layouts distintos, una por tipo de usuario del flujo de usuario (D1–D3).
Todas comparten el mismo repositorio de datos (`src/lib/data`) y los mismos catálogos (`src/lib/catalogs.ts`).

## Mapa de rutas

| Área | Ruta | Vista | Requisito | Estado |
|---|---|---|---|---|
| **Pública** · `app/(publico)` | `/` | Inicio: KPIs, navegación por intención, territorios, roles, fases, aliados, CTA registro | FR-010 | MVP |
| | `/mapa` | Mapa georreferenciado con clústeres + lista accesible + filtros | FR-001–003 | MVP |
| | `/actores` | Directorio filtrable (mismos filtros que el mapa) | FR-005 | MVP |
| | `/actores/[slug]` | Hoja de vida: perfil, enfoque, programas, resultados, conexiones, contacto | FR-004, 008, 014 | MVP |
| | `/impacto` | Tablero: conectados/fortalecidos/transformados por periodo, área, territorio y tipo | FR-010 | MVP |
| | `/registro` | "¿Aún no te ves reflejado?" — explica el proceso y lleva al formulario | FR-006 | MVP |
| | `/oportunidades` | Vitrina para jóvenes | FR-009 | **Próximamente** |
| | `/conexiones` | Grafo de red | FR-014/015 | **Próximamente · Fase 2** |
| | `/historias` | Casos de éxito | FR-017 | **Próximamente · Fase 2** |
| **Acceso** · `app/(auth)` | `/ingresar` | Ingreso, creación de cuenta, enlace por correo (modo demo: elegir rol) | FR-007 | MVP |
| | `/auth/callback` | Confirmación de correo de Supabase | — | MVP |
| **Organización** · `app/panel` | `/panel` | Resumen: estado de publicación, frescura (6 meses), KPIs propios | — | MVP |
| | `/panel/registro` | Formulario por pasos de 9 módulos con guardado automático | FR-006 | MVP |
| | `/panel/programas` | Programas publicados | FR-008 | MVP |
| | `/panel/indicadores` | Reportes por programa y periodo + captura nueva | FR-011 | MVP (captura en maqueta) |
| | `/panel/relaciones` | Socios, aliados, colaboradores | FR-013 | MVP |
| **Consola GOYN** · `app/admin` | `/admin` | Tablero: pendientes, huecos de cobertura, perfiles por actualizar | — | MVP |
| | `/admin/solicitudes` | Bandeja de validación con filtros | FR-007 | MVP |
| | `/admin/solicitudes/[id]` | Vista de cambios + decisión (aprobar / ajustes por campo / rechazar con motivo) | FR-007 | MVP |
| | `/admin/organizaciones` | Listado con origen real/sintético | — | MVP |
| | `/admin/exportar` | Descargas CSV/XLSX | FR-012 | MVP |
| | `/admin/auditoria` | Registro de auditoría | RNF seguridad | MVP |
| | `/admin/catalogos` | Catálogos del marco común (solo superadmin) | — | MVP (lectura) |
| | `/admin/contenido` | Editor visual por bloques (solo superadmin) | ADR 006 | **Próximamente** |

## Regla de tres clics

`/` → tarjeta "Quiero ver el ecosistema" (1) → marcador del mapa (2) → "Ver hoja de vida" (3).
Por directorio: `/` → "Quiero conectar" (1) → tarjeta de organización (2). Los filtros viajan en la URL
(`/mapa?tipo=colectivo_juvenil&territorio=amb_soledad`) y se conservan al cambiar entre Mapa y Lista.

## Roles y protección

| Rol | Cómo se obtiene | Ve |
|---|---|---|
| Visitante | Sin sesión | Área pública |
| Organización | Cuenta creada en `/ingresar`; queda **titular** al aprobarse su registro | Público + `/panel` (solo su organización, por RLS) |
| Admin GOYN | `profile.platform_role = 'admin_goyn'` (lo asigna un superadmin) | Público + `/admin` |
| Superadmin | `platform_role = 'superadmin'` (primer usuario: asignar por SQL) | Todo + catálogos + contenido |

Tres capas: `src/proxy.ts` exige sesión en `/panel` y `/admin`; cada `layout.tsx` verifica el rol; la base de datos
aplica RLS y las funciones `security definer` validan el rol antes de escribir. Ocultar un botón no es autorización.

## Estructura del frontend

```
src/
├── app/
│   ├── (publico)/         layout con encabezado, pie y aviso demo; páginas públicas
│   ├── (auth)/            ingresar, callback y acciones de sesión (server actions)
│   ├── panel/             layout AppShell "Panel de organización" + páginas + acciones de registro
│   └── admin/             layout AppShell "Consola GOYN" + páginas + ruta de exportación
├── components/
│   ├── brand/             logo del producto, logo institucional, formas de textura
│   ├── layout/            encabezado, menú móvil, "Próximamente", pie, AppShell, navegación lateral
│   ├── ecosystem/         tarjeta de organización, insignia de rol, filtros, mapa, gráficas, KPI, "Próximamente"
│   ├── forms/             campos, selección por chips, escala 1–10
│   └── ui/                componentes shadcn/ui (Base UI)
├── lib/
│   ├── data/              repositorio único: Supabase (vistas públicas) o JSON demo
│   ├── supabase/          clientes de servidor y navegador
│   ├── demo/              catalogs.json (cliente) y demo-data.json (solo servidor), generados por el backend
│   ├── auth.ts            quién navega y con qué rol
│   ├── catalogs.ts        etiquetas y colores por código
│   ├── filters.ts         filtros compartidos mapa/directorio ↔ URL
│   ├── impact.ts          agregación del tablero (suma de reportes validados)
│   ├── registration.ts    pasos, tipos y validación del formulario
│   └── export.ts          conjuntos exportables
└── proxy.ts               refresco de sesión y protección de rutas
```

## Modo demo y modo conectado

`src/lib/config.ts` detecta si hay `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

- **Sin variables** → modo demo: datos sintéticos, rol por cookie, borradores en el navegador y un aviso naranja fijo.
- **Con variables** → modo conectado: las mismas pantallas leen las vistas públicas, el registro crea
  `change_request`, la consola llama `decide_change_request` y la auditoría lee `audit_log`.

Las vistas no cambian entre modos; solo cambia la implementación de `src/lib/data`.
