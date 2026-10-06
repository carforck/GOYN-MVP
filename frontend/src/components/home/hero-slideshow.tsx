"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

const columnA = ["enfoque-1", "pilar-liderazgo", "enfoque-3", "pilar-datos", "blog-2", "pilar-aprendizaje"];
const columnB = ["enfoque-2", "pilar-equidad", "banner-trabajo", "pilar-financiacion", "enfoque-4", "blog-3"];

// Fondo del hero con textura de la marca (líneas topográficas del manual) sobre el degradado
// morado: mantiene el movimiento y da mejor legibilidad que una foto (ajustes 06-oct).
export function HeroBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-linear-to-br from-goyn-violeta via-[#7a00cc] to-[#4b0a8f]" aria-hidden>
      <Image
        src="/images/texturas/textura-06.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-25 brightness-0 invert motion-safe:animate-[kenburns_24s_ease-in-out_infinite_alternate]"
      />
      <div className="absolute inset-0 bg-radial-[at_15%_40%] from-[#4b0a8f]/60 via-transparent to-transparent" />
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
