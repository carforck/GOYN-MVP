# Identidad de marca

Fuente oficial: **Manual de identidad GOYN Barranquilla 2024** (49 páginas, entregado por el cliente; no se versiona
en el repositorio). Los valores se aplicaron en `frontend/src/app/globals.css` y `backend/scripts/catalogs.mjs`.

## Color (manual §5)

| Token | Hex | Tipo | Uso en la plataforma |
|---|---|---|---|
| `goyn-violeta` | `#9B00FF` · Pantone 2592 C | Principal (≈60 % de uso) | Color primario, botones, enlaces, héroes en duotono, "conectados" |
| `goyn-magenta` | `#FF01A2` · Pantone 213 C | Principal | CTA de registro, cintas de títulos, "transformados" |
| `goyn-navy` | `#060A28` · Pantone 2767 C | Principal | Texto, pie de página, barras laterales |
| `goyn-naranja` | `#FE5200` · Pantone 1655 C | Complementario | Avisos, pendientes, modo demo |
| `goyn-amarillo` | `#FFBD25` · Pantone 123 C | Complementario | Área "Bienestar y salud" |
| `goyn-cian` | `#00A0CC` · Pantone 306 C | Complementario | "Fortalecidos" |
| `goyn-verde` | `#0AA066` · Pantone 3405 C | Complementario | Área "Entornos seguros" |

Reglas del manual: el morado domina (60/40 frente al blanco) y la opacidad mínima es del 10 %.
Contraste sobre blanco: morado 5,5:1 y navy 19:1 (aptos para texto, WCAG AA). Magenta (3,6:1) y los complementarios
solo se usan en texto grande, fondos, bordes, gráficas o decoración.

> La presentación del Colaborativo (Inngenios) usa otra paleta (`#8100E4`, `#00B1D3`, `#FF751F`). Se descartó
> porque no es la oficial del manual.

## Tipografía (manual §6)

| Rol en el manual | Fuente | En la plataforma |
|---|---|---|
| Principal, títulos (Brandon Grotesque Black/Bold) | **Brandon Grotesque** (comercial) | Pendiente de licencia web. Respaldo permitido por el manual: Helvetica |
| Títulos alternos y cuerpos de texto | **Quicksand** (Light/Regular/Bold) | Títulos (bold, mayúsculas en héroes) y todo el texto |
| Elementos destacados | **Permanent Marker** | "El futuro es joven" y acentos |

Cuando GOYN entregue los archivos web de Brandon Grotesque con licencia, se cargan con `next/font/local` y se
asignan a `--font-heading`.

## Logotipo (manual §3–4)

- El logo va siempre con el descriptor "Barranquilla", el eslogan "El futuro es joven" y Aspen Institute.
- Tamaño mínimo digital: **130 × 32 px**. En el pie se usa a 192 px de ancho.
- Versiones: principal (morado/magenta), positivo y negativo (blanco sobre fondos oscuros).
- No estirar, no recolorear parcialmente, no cambiar la tipografía y no ponerlo sobre fondos complejos.
- El símbolo del producto "GOYN Conecta BAQ" (asterisco de las texturas) es un sub-sello del MVP: convive con el
  logo institucional y no lo reemplaza. Debe aprobarse cuando se defina el nombre final.

## Estilo visual (manual §7)

- **Fotografía**: jóvenes reales de Barranquilla con energía y diversidad; duotono magenta o morado sobre las fotos.
- **Elementos gráficos**: aro, aro rayado, círculo, rayo, rayo rayado, rompecabezas, asterisco, cruz, más, ondas y
  puntos, en morado. Están en `public/images/texturas`.
- **Piezas**: bloques planos de morado y magenta, tramas de puntos y franja inferior multicolor
  (verde, morado, naranja, magenta), aplicada en el pie como `.goyn-stripe`.
- **Iconografía**: línea en morado/magenta; la interfaz usa Lucide en esos colores.

## Íconos de rol

Los 8 íconos de `ICONOS/ROLES` no aparecen en el manual. Se asignaron por su dibujo; **el mapeo es inferido y hay
que confirmarlo con GOYN.**

| Archivo | Color | Dibujo | Rol asignado |
|---|---|---|---|
| rol-16 | `#70B52C` | Lupa sobre documentos | Evaluador / Gestor de conocimiento |
| rol-17 | `#E20613` | Persona con ✓/✗ | Tomador de decisión |
| rol-18 | `#07A067` | Personas chocando manos | Juventud |
| rol-19 | `#0A9ECB` | Mano con bandera | Embajador |
| rol-20 | `#FABB2C` | Bombillo con cerebro | Generador de conocimiento |
| rol-21 | `#E8531D` | Red de personas | Articulador |
| rol-22 | `#E1378B` | Plano con engranaje | Implementador |
| rol-23 | `#634494` | Mano con moneda y engranaje | Financiador |

## Recursos en el repositorio (`frontend/public/images`, todo en WebP)

- `marca/`: 5 variantes del logo institucional.
- `texturas/`: 15 elementos gráficos.
- `roles/`: 8 íconos de rol.
- `fotos/`: 24 fotografías de goynbarranquilla.com.
- `aliados/`: 40 logos de organizaciones del Colaborativo publicados en goynbarranquilla.com.
- `/icon.webp`: símbolo del producto.

No se usaron las fotos de Polaris porque son de jóvenes de Bogotá.

## Pendiente de GOYN

Licencia web de Brandon Grotesque · confirmar el mapeo de íconos a roles · fotos propias con autorización de uso
en la plataforma · aprobar el sub-sello "GOYN Conecta BAQ" o el nombre final.
