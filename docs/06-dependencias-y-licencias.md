# Dependencias de terceros y licencias

Inventario generado con `license-checker --production` (30-sep-2026): **549 paquetes** en el frontend de
producción. Todas las licencias permiten uso comercial.

## Dependencias directas del frontend

| Paquete | Uso | Licencia |
|---|---|---|
| next, react, react-dom | Framework y renderizado | MIT |
| @supabase/supabase-js, @supabase/ssr | Cliente de datos, sesión y tiempo real | MIT |
| three, @react-three/fiber, @react-three/drei | Globo 3D | MIT |
| maplibre-gl | Mapa vectorial | BSD-3-Clause |
| recharts | Gráficas | MIT |
| motion | Animaciones | MIT |
| @base-ui/react | Componentes accesibles (vía shadcn/ui) | MIT |
| next-themes | Modo oscuro de las áreas con cuenta | MIT |
| exceljs | Exportación XLSX | MIT |
| lucide-react | Íconos | ISC |
| zod, clsx, cn, tailwind-merge | Utilidades | MIT |
| class-variance-authority | Variantes de estilos | Apache-2.0 |
| sonner | Notificaciones | MIT |
| tw-animate-css | Animaciones CSS | MIT |
| server-only | Protección de módulos de servidor | MIT |

Herramientas de desarrollo (no van a producción): typescript, eslint, tailwindcss, shadcn (CLI), supabase (CLI),
@electric-sql/pglite (pruebas de base de datos, Apache-2.0).

## Distribución de licencias (transitivas incluidas)

MIT 446 · ISC 50 · Apache-2.0 17 · BSD-3-Clause 13 · BSD-2-Clause 7 · otras 16.

Casos que conviene conocer:

| Paquete | Licencia | Comentario |
|---|---|---|
| @img/sharp-libvips-* | LGPL-3.0-or-later | Binario de libvips que usa Next.js para optimizar imágenes. Se enlaza dinámicamente y no se modifica: uso comercial permitido |
| jszip | MIT o GPL-3.0 (a elección) | Se usa bajo MIT (dependencia de exceljs) |
| caniuse-lite | CC-BY-4.0 | Datos de compatibilidad de navegadores usados en la compilación |
| argparse | Python-2.0 | Permisiva |
| buffers, chainsaw, traverse | MIT / licencia propia permisiva | Dependencias antiguas de exceljs |

## Datos y servicios externos

| Recurso | Licencia / términos | Atribución en la interfaz |
|---|---|---|
| Teselas de OpenFreeMap (datos OpenStreetMap) | ODbL (datos) · servicio gratuito sin llave | "© OpenStreetMap, OpenFreeMap" en el mapa |
| Texturas de la Tierra (NASA Blue Marble / Earth at Night) | Dominio público | "Globo: NASA Blue Marble" en /mapa |
| Tipografías Quicksand y Permanent Marker (Google Fonts) | SIL Open Font License 1.1 | — |
| Fotografías y logos | Propiedad de GOYN Barranquilla y de cada organización aliada | Uso autorizado por el cliente para la plataforma |

## Materiales previos del desarrollador

No se incorporó código desarrollado antes de este proyecto. Los componentes base de `src/components/ui`
provienen de shadcn/ui (MIT) y se generan con su CLI.
