import Image from "next/image";
import { cn } from "@/lib/utils";

// Formas de las texturas de marca (RECURSOS GRAFICOS/TEXTURAS), siempre decorativas.
const shapes = {
  circulo: "textura-10",
  rompecabezas: "textura-11",
  cruz: "textura-12",
  aro_rayado: "textura-13",
  mas: "textura-14",
  asterisco: "textura-15",
  puntos: "textura-03",
  ondas: "textura-04",
  malla_puntos: "textura-05",
  ondas_2: "textura-06",
  rayo_rayado: "textura-07",
  rayo: "textura-08",
  aro: "textura-09",
} as const;

export type ShapeName = keyof typeof shapes;

export function Shape({ name, className, size = 120 }: { name: ShapeName; className?: string; size?: number }) {
  return (
    <Image
      src={`/images/texturas/${shapes[name]}.webp`}
      alt=""
      aria-hidden
      width={size}
      height={size}
      className={cn("pointer-events-none absolute select-none", className)}
    />
  );
}
