import { cn } from "@/lib/utils";

// Versión vectorial de la textura de líneas topográficas del manual (textura-06, la misma del hero
// de la home): se dibuja con SVG para que se vea nítida a cualquier tamaño y no pese como un raster.
// Cada línea es una horizontal desplazada por unas "colinas" gaussianas; se calcula una sola vez al
// cargar el módulo (sin aleatoriedad, así servidor y cliente coinciden).

const W = 1000;
const H = 1100;
const LINES = 42;
const STEPS = 40;

// [centro x, centro y, radio x, radio y, amplitud] — imitan los pliegues de la textura original.
const HILLS: [number, number, number, number, number][] = [
  [300, 640, 90, 300, 210],
  [620, 420, 110, 300, -190],
  [880, 460, 200, 220, 110],
  [120, 1100, 180, 200, -170],
  [520, 120, 200, 150, 70],
  [760, 950, 160, 160, -90],
];

function displacement(x: number, y: number) {
  let d = 0;
  for (const [cx, cy, rx, ry, a] of HILLS) d += a * Math.exp(-(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2));
  return d;
}

const r = (n: number) => Math.round(n * 10) / 10;

// Curva suave (Catmull-Rom → Bézier cúbica) por los puntos muestreados de cada línea.
const PATHS = Array.from({ length: LINES }, (_, i) => {
  const base = -80 + (i * (H + 160)) / (LINES - 1);
  const pts = Array.from({ length: STEPS + 1 }, (_, s) => {
    const x = -20 + (s * (W + 40)) / STEPS;
    return [x, base + displacement(x, base)] as const;
  });
  let d = `M${r(pts[0][0])} ${r(pts[0][1])}`;
  for (let k = 0; k < STEPS; k++) {
    const [x0, y0] = pts[Math.max(k - 1, 0)];
    const [x1, y1] = pts[k];
    const [x2, y2] = pts[k + 1];
    const [x3, y3] = pts[Math.min(k + 2, STEPS)];
    d += `C${r(x1 + (x2 - x0) / 6)} ${r(y1 + (y2 - y0) / 6)} ${r(x2 - (x3 - x1) / 6)} ${r(y2 - (y3 - y1) / 6)} ${r(x2)} ${r(y2)}`;
  }
  return d;
});

// Fondo de marca: degradado violeta del hero + líneas en blanco con un vaivén lento (se detiene con
// "reducir movimiento"). Decorativo; el contenedor padre debe ser `relative`.
export function WaveLinesBackground({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden bg-linear-to-br from-goyn-violeta via-[#7a00cc] to-[#4b0a8f]", className)} aria-hidden>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 size-full text-white opacity-30 motion-safe:animate-[kenburns_24s_ease-in-out_infinite_alternate]"
      >
        <g fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          {PATHS.map((d, i) => (
            <path key={i} d={d} vectorEffect="non-scaling-stroke" />
          ))}
        </g>
      </svg>
      <div className="absolute inset-0 bg-radial-[at_15%_40%] from-[#4b0a8f]/60 via-transparent to-transparent" />
    </div>
  );
}
