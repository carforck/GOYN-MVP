"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Fotografías de goynbarranquilla.com (jóvenes y actividades del Colaborativo).
const backgrounds = [
  { src: "/images/fotos/hero-jovenes.webp", alt: "Jóvenes del Colaborativo con camisetas rosadas", position: "50% 30%" },
  { src: "/images/fotos/sesion-colaborativo-2026.webp", alt: "Sesión de co-creación del Colaborativo, 9 de abril de 2026", position: "50% 40%" },
  { src: "/images/fotos/jovenes-grupo.webp", alt: "Jóvenes de Barranquilla sonriendo", position: "50% 35%" },
  { src: "/images/fotos/nosotros-banner.webp", alt: "Encuentro de jóvenes y organizaciones", position: "50% 50%" },
  { src: "/images/fotos/pilar-territorio.webp", alt: "Grupo de jóvenes en el territorio", position: "50% 40%" },
];

const columnA = ["enfoque-1", "pilar-liderazgo", "enfoque-3", "pilar-datos", "blog-2", "pilar-aprendizaje"];
const columnB = ["enfoque-2", "pilar-equidad", "banner-trabajo", "pilar-financiacion", "enfoque-4", "blog-3"];

// Fondo: fundido entre fotos con Ken Burns, en duotono morado (Manual §7 Fotografía).
export function HeroBackground({ interval = 6000 }: { interval?: number }) {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % backgrounds.length), interval);
    return () => clearInterval(id);
  }, [interval, reduce]);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-goyn-violeta" aria-hidden>
      <AnimatePresence initial={false}>
        <motion.div
          key={index}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.6, ease: "easeInOut" }}
        >
          <Image
            src={backgrounds[index].src}
            alt=""
            fill
            priority={index === 0}
            sizes="100vw"
            className="object-cover opacity-80 mix-blend-multiply grayscale motion-safe:animate-[kenburns_9s_ease-out_forwards]"
            style={{ objectPosition: backgrounds[index].position }}
          />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-linear-to-r from-goyn-violeta via-goyn-violeta/75 to-goyn-magenta/25" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-goyn-violeta/80 to-transparent" />
      <div className="absolute bottom-24 left-1/2 flex -translate-x-1/2 gap-2 sm:left-8 sm:translate-x-0 lg:left-[max(2rem,calc((100vw-80rem)/2+2rem))]">
        {backgrounds.map((b, i) => (
          <span key={b.src} className={cn("h-1.5 rounded-full bg-white transition-all duration-700", i === index ? "w-8 opacity-100" : "w-3 opacity-40")} />
        ))}
      </div>
    </div>
  );
}

function PhotoColumn({ photos, reverse = false, duration = 38 }: { photos: string[]; reverse?: boolean; duration?: number }) {
  return (
    <div className="relative h-full overflow-hidden">
      <div
        className="flex flex-col gap-4 motion-safe:animate-[marquee-y_linear_infinite]"
        style={{ animationDuration: `${duration}s`, animationDirection: reverse ? "reverse" : "normal" }}
      >
        {[...photos, ...photos].map((p, i) => (
          <div
            key={`${p}-${i}`}
            className={cn(
              "group relative aspect-[4/5] w-full shrink-0 overflow-hidden rounded-3xl border-4 shadow-2xl shadow-black/30",
              i % 3 === 0 ? "border-goyn-magenta" : i % 3 === 1 ? "border-white/80" : "border-goyn-amarillo",
            )}
          >
            <Image src={`/images/fotos/${p}.webp`} alt="" fill sizes="220px" className="object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-goyn-violeta/25 mix-blend-multiply transition-opacity group-hover:opacity-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Collage vivo del lado derecho del hero (solo pantallas grandes).
export function HeroPhotoRail() {
  return (
    <div aria-hidden className="pointer-events-auto absolute inset-y-0 right-[max(1rem,calc((100vw-80rem)/2+1rem))] hidden w-[440px] rotate-[4deg] grid-cols-2 gap-4 [mask-image:linear-gradient(transparent,black_12%,black_88%,transparent)] lg:grid xl:w-[500px]">
      <PhotoColumn photos={columnA} duration={42} />
      <PhotoColumn photos={columnB} duration={36} reverse />
    </div>
  );
}
