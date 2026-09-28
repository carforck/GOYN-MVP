// MapLibre v6 carga su web worker como módulo ES relativo a su propio archivo; al empaquetarse
// con Next.js esa ruta se pierde. Copiamos el worker y su módulo compartido a public/maplibre/
// y los apuntamos con setWorkerUrl() (ver src/components/ecosystem/ecosystem-map.tsx).
import { copyFileSync, mkdirSync } from "node:fs";

const from = new URL("../node_modules/maplibre-gl/dist/", import.meta.url);
const to = new URL("../public/maplibre/", import.meta.url);
mkdirSync(to, { recursive: true });
for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) copyFileSync(new URL(file, from), new URL(file, to));
console.log("maplibre worker copiado a public/maplibre/");
