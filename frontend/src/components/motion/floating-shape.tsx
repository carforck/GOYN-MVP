"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import type { ShapeName } from "@/components/brand/shape";
import { cn } from "@/lib/utils";

const files: Record<ShapeName, string> = {
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
};

// Elemento gráfico del manual (§7) con vida: flota, gira despacio y se desplaza con el scroll
// (parallax). `white` lo pinta en blanco para usarlo sobre fondos de color.
export function FloatingShape({
  name,
  size = 110,
  className,
  float = 14,
  spin = 0,
  parallax = 60,
  duration = 7,
  delay = 0,
  white = false,
}: {
  name: ShapeName;
  size?: number;
  className?: string;
  float?: number;
  spin?: number;
  parallax?: number;
  duration?: number;
  delay?: number;
  white?: boolean;
}) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 800], [0, reduce ? 0 : -parallax]);

  return (
    <motion.div aria-hidden style={{ y }} className={cn("pointer-events-none absolute select-none", className)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={
          reduce
            ? { opacity: 1, scale: 1 }
            : { opacity: 1, scale: 1, y: [0, -float, 0], rotate: spin ? [0, spin] : [0, 6, 0] }
        }
        transition={{
          opacity: { duration: 0.8, delay },
          scale: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] },
          y: { duration, repeat: Infinity, ease: "easeInOut", delay },
          rotate: spin ? { duration: duration * 4, repeat: Infinity, ease: "linear" } : { duration, repeat: Infinity, ease: "easeInOut", delay },
        }}
      >
        <Image
          src={`/images/texturas/${files[name]}.webp`}
          alt=""
          width={size}
          height={size}
          className={cn("select-none", white && "brightness-0 invert")}
          style={{ width: size, height: size, objectFit: "contain" }}
        />
      </motion.div>
    </motion.div>
  );
}
