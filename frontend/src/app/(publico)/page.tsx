import { ArrowRightIcon, MapIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { RoleIcon } from "@/components/ecosystem/role-badge";
import { HeroBackground, HeroPhotoRail } from "@/components/home/hero-slideshow";
import { Pillars } from "@/components/home/pillars";
import { LiveKpiStrip } from "@/components/live/live-kpis";
import { FloatingShape } from "@/components/motion/floating-shape";
import { Reveal } from "@/components/motion/reveal";
import { buttonVariants } from "@/components/ui/button";
import { catalogs } from "@/lib/catalogs";
import { acerca, areasIntro, ctaRegistro, glosario, pilaresIntro, proposito } from "@/lib/home-content";
import { cn } from "@/lib/utils";

export default function HomePage() {

  return (
    <>
      {/* Hero: carrusel de fotos en duotono + collage en movimiento + formas de la marca */}
      <section className="relative isolate overflow-hidden text-white">
        <HeroBackground />
        <HeroPhotoRail />
        <FloatingShape name="asterisco" size={96} white className="top-10 left-[46%] hidden md:block" spin={360} duration={9} />
        <FloatingShape name="mas" size={54} white className="top-24 right-[5%] opacity-80 lg:hidden" float={10} />
        <div className="goyn-container relative py-20 sm:py-28 lg:py-36">
          <div className="max-w-2xl space-y-6 xl:max-w-3xl">
            <div className="goyn-enter" style={{ ["--d" as string]: "0.05s" }}>
              <span className="goyn-eyebrow bg-goyn-magenta-a11y">
                <span className="goyn-live-dot bg-white" aria-hidden /> Colaborativo GOYN Barranquilla · Fase Mapear 2026
              </span>
            </div>
            <div className="goyn-enter" style={{ ["--d" as string]: "0.15s" }}>
              <h1 className="text-3xl leading-[1.1] font-bold tracking-tight sm:text-5xl">
                Te damos la bienvenida al mapeo de acciones y resultados del{" "}
                <span className="text-goyn-amarillo">Colaborativo GOYN Barranquilla</span>
              </h1>
            </div>
            <div className="goyn-enter" style={{ ["--d" as string]: "0.3s" }}>
              <p className="max-w-xl text-lg text-white/85 sm:text-xl">
                Una herramienta para ver, en un solo lugar, todo lo que las organizaciones de nuestro ecosistema están haciendo por las oportunidades de los jóvenes en Barranquilla y su área metropolitana.
              </p>
            </div>
            <div className="goyn-enter flex flex-col gap-3 pt-2 sm:flex-row" style={{ ["--d" as string]: "0.42s" }}>
              <Link href="/mapa" className={cn(buttonVariants(), "h-12 rounded-full bg-goyn-magenta-a11y px-6 text-base font-bold text-white shadow-lg shadow-goyn-magenta/40 transition-transform hover:scale-[1.03] hover:bg-goyn-magenta-a11y/90")}>
                <MapIcon aria-hidden /> Ir a la herramienta
              </Link>
              <Link href="/registro" className={cn(buttonVariants({ variant: "outline" }), "h-12 rounded-full border-white/40 bg-white/5 px-6 text-base font-bold text-white backdrop-blur hover:bg-white/15 hover:text-white")}>
                Registrar mi organización <ArrowRightIcon aria-hidden />
              </Link>
            </div>
            <div className="goyn-enter" style={{ ["--d" as string]: "0.55s" }}>
              <p className="font-marker text-2xl">El futuro es joven</p>
            </div>
          </div>
        </div>
      </section>

      {/* KPIs del ecosistema: contadores en vivo */}
      <section aria-labelledby="kpis" className="relative -mt-12 pb-4">
        <div className="goyn-container">
          <h2 id="kpis" className="sr-only">Cifras del ecosistema</h2>
          <LiveKpiStrip />
        </div>
      </section>

      {/* Acerca de esta herramienta */}
      <section aria-labelledby="acerca" className="goyn-container py-16 sm:py-20">
        <Reveal className="mb-6">
          <span className="goyn-eyebrow">Acerca de esta herramienta</span>
          <h2 id="acerca" className="sr-only">Acerca de esta herramienta</h2>
        </Reveal>
        <div className="grid gap-5 md:grid-cols-2">
          <Reveal className="rounded-3xl border-2 border-goyn-magenta/40 bg-card p-6 sm:p-8">
            <h3 className="font-heading text-2xl font-bold text-goyn-magenta-a11y">¿Por qué existe esta herramienta?</h3>
            <p className="mt-3 text-foreground/80">{acerca.porQue}</p>
          </Reveal>
          <Reveal delay={0.08} className="rounded-3xl border-2 border-goyn-magenta/40 bg-card p-6 sm:p-8">
            <h3 className="font-heading text-2xl font-bold text-goyn-magenta-a11y">¿Para quién es?</h3>
            <ul className="mt-3 space-y-2">
              {acerca.paraQuien.map((x) => (
                <li key={x.title} className="flex gap-2.5 text-foreground/80">
                  <span aria-hidden className="mt-2 size-2 shrink-0 rounded-full bg-goyn-magenta-a11y" />
                  <span><strong className="text-foreground">{x.title}:</strong> {x.text}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.12} className="rounded-3xl border-2 border-goyn-magenta/40 bg-card p-6 sm:p-8 md:col-span-2">
            <h3 className="font-heading text-2xl font-bold text-goyn-magenta-a11y">¿Para qué sirve?</h3>
            <ul className="mt-3 grid gap-x-10 gap-y-2 md:grid-cols-2">
              {acerca.paraQue.map((t) => (
                <li key={t} className="flex gap-2.5 text-foreground/80">
                  <span aria-hidden className="mt-2 size-2 shrink-0 rounded-full bg-goyn-magenta-a11y" />
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Nuestro propósito: texto + foto recortada que sobresale de la banda (diseño 08-oct) */}
      <section aria-labelledby="proposito" className="relative isolate mt-24 bg-linear-to-br from-goyn-violeta via-[#8a00e6] to-[#6a00c2] text-white sm:mt-32">
        <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
          <Image src="/images/texturas/textura-06.webp" alt="" fill sizes="100vw" className="object-cover opacity-[0.08] brightness-0 invert" />
          <div className="absolute -right-24 -bottom-32 size-[28rem] rounded-full bg-goyn-magenta/25 blur-3xl" />
        </div>
        <div className="goyn-container grid items-end gap-6 md:grid-cols-[1.15fr_1fr] md:gap-10">
          <Reveal className="space-y-5 py-14 sm:py-20">
            <span className="goyn-eyebrow bg-white/15 backdrop-blur">Por qué lo hacemos</span>
            <h2 id="proposito" className="text-4xl font-bold sm:text-5xl">Nuestro propósito</h2>
            <p className="max-w-xl text-lg leading-relaxed font-medium text-white sm:text-xl">{proposito}</p>
          </Reveal>
          <div className="relative mx-auto -mt-20 h-[400px] w-full max-w-md sm:-mt-36 sm:h-[540px]">
            {/* Arco de la marca detrás de la persona, apoyado en el borde de la banda: le da profundidad. */}
            <div aria-hidden className="absolute bottom-0 left-1/2 h-[72%] w-[84%] -translate-x-1/2 rounded-t-full bg-linear-to-b from-goyn-magenta to-[#c400b8]" />
            <FloatingShape name="aro_rayado" size={130} className="top-[22%] -right-2 z-0 opacity-80" float={10} parallax={0} />
            <FloatingShape name="asterisco" size={48} white className="top-[34%] left-0 z-20" spin={360} duration={14} parallax={0} />
            <Image
              src="/images/fotos/proposito-silueta.webp"
              alt="Integrante del Colaborativo GOYN Barranquilla"
              fill
              sizes="(min-width: 768px) 32vw, 85vw"
              className="z-10 object-contain object-bottom drop-shadow-[0_18px_30px_rgba(6,10,40,0.35)]"
            />
          </div>
        </div>
      </section>

      {/* Nuestros pilares: popup con la definición */}
      <section aria-labelledby="pilares" className="goyn-container py-16 sm:py-20">
        <Reveal className="mb-10 space-y-3">
          <span className="goyn-eyebrow">Nuestro enfoque</span>
          <h2 id="pilares" className="text-3xl font-bold text-foreground sm:text-4xl">Nuestros pilares</h2>
          <p className="max-w-3xl text-muted-foreground">{pilaresIntro} Toca cada pilar para conocer su definición.</p>
        </Reveal>
        <Pillars />
      </section>

      {/* Glosario */}
      <section aria-labelledby="glosario" className="relative isolate overflow-hidden text-white">
        <Image src="/images/fotos/sesion-colaborativo-2026.webp" alt="" fill sizes="100vw" className="-z-20 object-cover" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-br from-goyn-violeta/95 via-[#c400b8]/90 to-goyn-violeta/95" />
        <div className="goyn-container py-16 sm:py-20">
          <Reveal>
            <h2 id="glosario" className="text-3xl font-bold sm:text-4xl">Glosario</h2>
          </Reveal>
          <dl className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {glosario.map((g, i) => (
              <Reveal key={g.term} delay={(i % 3) * 0.06}>
                <dt className="font-heading text-xl font-bold">{g.term}</dt>
                <dd className={cn("mt-1 font-medium leading-relaxed text-white/90", g.pendiente && "italic text-white/70")}>{g.text}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {/* Áreas de impacto */}
      <section aria-labelledby="areas" className="goyn-container py-16 sm:py-20">
        <Reveal className="mb-10 space-y-3">
          <span className="goyn-eyebrow">Marco común</span>
          <h2 id="areas" className="text-3xl font-bold text-foreground sm:text-4xl">Áreas de impacto del ecosistema juvenil</h2>
          <p className="max-w-3xl text-muted-foreground">{areasIntro}</p>
        </Reveal>
        <ul className="grid gap-x-10 gap-y-7 md:grid-cols-2">
          {catalogs.impactAreas.map((a, i) => (
            <Reveal as="li" key={a.code} delay={(i % 2) * 0.06} className="flex items-start gap-4">
              <Image src={`/images/areas/${a.code}.svg`} alt="" width={64} height={64} className="size-14 shrink-0 sm:size-16" />
              <div>
                <p className="font-heading font-bold text-foreground">{a.label}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{a.description}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* Roles: sin contador, con la definición de cada uno */}
      <section aria-labelledby="roles" className="bg-goyn-lila/40 py-16 sm:py-20">
        <div className="goyn-container">
          <Reveal className="mb-8 space-y-3">
            <h2 id="roles" className="text-3xl font-bold text-foreground sm:text-4xl">Roles en el ecosistema</h2>
            <p className="max-w-2xl text-muted-foreground">Cada organización declara un rol principal y otros roles que cumple en el territorio.</p>
          </Reveal>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {catalogs.roles.map((r, i) => (
              <Reveal as="li" key={r.code} delay={(i % 4) * 0.06}>
                <Link href={`/actores?rol=${r.code}`} className="group flex h-full flex-col gap-3 rounded-2xl border bg-card p-5 transition-all hover:-translate-y-1 hover:shadow-lg">
                  <span className="flex items-center gap-3">
                    <span className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                      <RoleIcon code={r.code} size={48} />
                    </span>
                    <span className="font-heading font-bold text-foreground">{r.label}</span>
                  </span>
                  <span className="text-sm leading-relaxed text-muted-foreground">{r.description}</span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA registro */}
      <section className="goyn-container py-16 sm:py-20">
        <Reveal className="relative grid overflow-hidden rounded-3xl bg-goyn-magenta-a11y text-white lg:grid-cols-2">
          <div className="relative space-y-5 p-8 sm:p-12">
            <h2 className="text-3xl font-bold uppercase sm:text-4xl">¿Aún no te ves reflejado?</h2>
            <p className="max-w-md text-lg text-white">
              {ctaRegistro}
            </p>
            <Link href="/registro" className={cn(buttonVariants(), "h-12 rounded-full bg-goyn-violeta px-6 text-base font-bold text-white hover:bg-goyn-violeta/90")}>
              Registrar mi organización <ArrowRightIcon aria-hidden />
            </Link>
          </div>
          <div className="relative min-h-64 overflow-hidden">
            <Image src="/images/fotos/jovenes-grupo.webp" alt="Jóvenes de Barranquilla sonriendo" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover object-[50%_10%] transition-transform duration-[2s] hover:scale-105" />
          </div>
        </Reveal>
      </section>
    </>
  );
}
