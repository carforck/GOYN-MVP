import { ArrowRightIcon, BarChart3Icon, CompassIcon, MapIcon, SparklesIcon, UsersIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { RoleIcon } from "@/components/ecosystem/role-badge";
import { LiveGlobe } from "@/components/globe/live-globe";
import { HeroBackground, HeroPhotoRail } from "@/components/home/hero-slideshow";
import { LiveBigStats, LiveKpiStrip } from "@/components/live/live-kpis";
import { LiveFeed } from "@/components/live/live-ticker";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { FloatingShape } from "@/components/motion/floating-shape";
import { Reveal } from "@/components/motion/reveal";
import { buttonVariants } from "@/components/ui/button";
import { catalogs, shortTerritory } from "@/lib/catalogs";
import { listOrganizations } from "@/lib/data";
import { cn } from "@/lib/utils";

const intents = [
  { href: "/mapa", eyebrow: "Quiero ver", title: "El ecosistema", text: "Mapa georreferenciado de actores por territorio, rol y área de impacto.", icon: MapIcon, color: "#9B00FF" },
  { href: "/actores", eyebrow: "Quiero conectar", title: "Con otros actores", text: "Directorio filtrable y hojas de vida verificadas de las organizaciones.", icon: UsersIcon, color: "#00A0CC" },
  { href: "/impacto", eyebrow: "Quiero medir", title: "El impacto colectivo", text: "Jóvenes conectados, fortalecidos y transformados por periodo y territorio.", icon: BarChart3Icon, color: "#FF01A2" },
  { href: "/oportunidades", eyebrow: "Quiero encontrar", title: "Oportunidades", text: "Estudiar, trabajar, emprender o participar. Muy pronto para jóvenes.", icon: CompassIcon, color: "#FE5200", soon: true },
];

const phases = [
  { year: "2026", name: "Mapear", text: "Visibilizar actores, acciones y resultados del ecosistema juvenil.", active: true },
  { year: "2027", name: "Potenciar", text: "Promover y activar nuevas acciones conjuntas: conexiones, historias y participación juvenil." },
  { year: "2028", name: "Medir", text: "Medir el impacto colectivo en trayectorias juveniles priorizadas." },
];

export default async function HomePage() {
  const orgs = await listOrganizations();
  const byTerritory = catalogs.territories
    .filter((t) => t.lat != null)
    .map((t) => ({ ...t, count: orgs.filter((o) => o.territory_codes.includes(t.code)).length }));
  const byRole = catalogs.roles.map((r) => ({ ...r, count: orgs.filter((o) => o.role_codes.includes(r.code)).length }));

  return (
    <>
      {/* Hero: carrusel de fotos en duotono + collage en movimiento + formas de la marca */}
      <section className="relative isolate overflow-hidden text-white">
        <HeroBackground />
        <HeroPhotoRail />
        <FloatingShape name="asterisco" size={96} white className="top-10 left-[46%] hidden md:block" spin={360} duration={9} />
        <FloatingShape name="rayo" size={70} white className="bottom-32 left-[4%] hidden opacity-90 md:block" float={18} delay={0.4} />
        <FloatingShape name="aro_rayado" size={190} className="-bottom-16 left-[38%] hidden opacity-70 md:block" parallax={120} delay={0.2} />
        <FloatingShape name="mas" size={54} white className="top-24 right-[5%] opacity-80 lg:hidden" float={10} />
        <div className="goyn-container relative py-20 sm:py-28 lg:py-36">
          <div className="max-w-2xl space-y-6 xl:max-w-3xl">
            <div className="goyn-enter" style={{ ["--d" as string]: "0.05s" }}>
              <span className="goyn-eyebrow bg-goyn-magenta">
                <span className="goyn-live-dot bg-white" aria-hidden /> Colaborativo GOYN Barranquilla · Fase Mapear 2026
              </span>
            </div>
            <div className="goyn-enter" style={{ ["--d" as string]: "0.15s" }}>
              <h1 className="text-4xl leading-[1.05] font-bold tracking-tight uppercase sm:text-6xl">
                El espejo digital del{" "}
                <span className="bg-goyn-magenta box-decoration-clone px-2 leading-[1.25]">ecosistema juvenil</span> de Barranquilla
              </h1>
            </div>
            <div className="goyn-enter" style={{ ["--d" as string]: "0.3s" }}>
              <p className="max-w-xl text-lg text-white/85 sm:text-xl">
                Ver, conectar y medir lo que hacen las organizaciones del Colaborativo por las juventudes de Barranquilla y su área metropolitana.
              </p>
            </div>
            <div className="goyn-enter flex flex-col gap-3 pt-2 sm:flex-row" style={{ ["--d" as string]: "0.42s" }}>
              <Link href="/mapa" className={cn(buttonVariants(), "h-12 rounded-full bg-goyn-magenta px-6 text-base font-bold text-white shadow-lg shadow-goyn-magenta/40 transition-transform hover:scale-[1.03] hover:bg-goyn-magenta/90")}>
                <MapIcon aria-hidden /> Explorar el mapa
              </Link>
              <Link href="/registro" className={cn(buttonVariants({ variant: "outline" }), "h-12 rounded-full border-white/40 bg-white/5 px-6 text-base font-bold text-white backdrop-blur hover:bg-white/15 hover:text-white")}>
                ¿Aún no te ves reflejado? Regístrate <ArrowRightIcon aria-hidden />
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

      {/* Navegación por intención */}
      <section aria-labelledby="intencion" className="goyn-container py-16 sm:py-20">
        <Reveal className="mb-8 space-y-3">
          <span className="goyn-eyebrow">Navegación por intención</span>
          <h2 id="intencion" className="text-3xl font-bold text-foreground sm:text-4xl">¿Qué necesitas hoy?</h2>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {intents.map((it, i) => (
            <Reveal key={it.href} delay={i * 0.08}>
              <Link
                href={it.href}
                className={cn(
                  "group relative flex h-full flex-col gap-4 overflow-hidden rounded-3xl border bg-card p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl",
                  it.soon && "border-dashed",
                )}
                style={{ ["--c" as string]: it.color }}
              >
                <span aria-hidden className="absolute -top-20 -right-20 size-44 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-40" style={{ backgroundColor: it.color }} />
                <span className="grid size-12 place-items-center rounded-2xl text-white transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" style={{ backgroundColor: it.color }}>
                  <it.icon className="size-6" aria-hidden />
                </span>
                <div className="relative">
                  <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">{it.eyebrow}</p>
                  <p className="mt-1 font-heading text-xl font-bold text-foreground">{it.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{it.text}</p>
                </div>
                <span className="relative mt-auto inline-flex items-center gap-1 text-sm font-bold text-goyn-violeta">
                  {it.soon ? (<><SparklesIcon className="size-4" aria-hidden /> Próximamente</>) : (<>Entrar <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-1" aria-hidden /></>)}
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* El ecosistema en vivo: globo 3D + cifras y actividad en tiempo real */}
      <section aria-labelledby="en-vivo" className="relative isolate overflow-hidden bg-goyn-navy text-white">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_70%_50%,rgba(155,0,255,0.35),transparent_60%)]" />
        <div className="goyn-container grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-[1fr_1.15fr]">
          <div className="relative z-10 space-y-8">
            <Reveal className="space-y-3">
              <span className="goyn-eyebrow bg-goyn-magenta">
                <span className="goyn-live-dot bg-white" aria-hidden /> En vivo
              </span>
              <h2 id="en-vivo" className="text-3xl font-bold uppercase sm:text-5xl">De lo global a nuestro territorio</h2>
              <p className="max-w-lg text-white/75">
                Somos parte de la Global Opportunity Youth Network. Aquí ves, en tiempo real, lo que el Colaborativo logra por las juventudes de Barranquilla y su área metropolitana.
              </p>
            </Reveal>
            <LiveBigStats dark compact />
            <LiveFeed limit={4} dark />
            <Link href="/mapa" className={cn(buttonVariants(), "h-12 rounded-full bg-goyn-violeta px-6 text-base font-bold text-white hover:bg-goyn-violeta/90")}>
              Entrar al mapa en vivo <ArrowRightIcon aria-hidden />
            </Link>
          </div>
          <LiveGlobe variant="home" className="h-[420px] sm:h-[560px] lg:h-[680px] lg:-mr-24" />
        </div>
      </section>

      {/* Territorio */}
      <section aria-labelledby="territorio" className="bg-goyn-lila/50 py-16 sm:py-20">
        <div className="goyn-container grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <Reveal className="space-y-4">
            <span className="goyn-eyebrow bg-goyn-cian text-goyn-navy">El mapa es el corazón</span>
            <h2 id="territorio" className="text-3xl font-bold text-foreground sm:text-4xl">¿Quién está dónde y qué hace?</h2>
            <p className="text-lg text-muted-foreground">
              Presencia de las organizaciones en las zonas de Barranquilla y su área metropolitana. Toca una zona para verla en el mapa.
            </p>
            <Link href="/mapa" className={cn(buttonVariants(), "h-11 rounded-full px-5 font-bold")}>
              Abrir el mapa completo <ArrowRightIcon aria-hidden />
            </Link>
          </Reveal>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {byTerritory.map((t, i) => (
              <Reveal as="li" key={t.code} delay={i * 0.05}>
                <Link href={`/mapa?territorio=${t.code}`} className="group flex h-full flex-col justify-between rounded-2xl border bg-card p-4 transition-all hover:-translate-y-1 hover:border-goyn-violeta hover:shadow-lg">
                  <span className="text-xs font-bold text-muted-foreground uppercase">{t.municipality}</span>
                  <span className="mt-1 font-heading font-bold text-foreground">{shortTerritory(t.code)}</span>
                  <AnimatedNumber value={t.count} className="mt-3 font-heading text-3xl font-bold text-goyn-violeta" />
                  <span className="text-xs text-muted-foreground">organizaciones</span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Roles */}
      <section aria-labelledby="roles" className="goyn-container py-16 sm:py-20">
        <Reveal className="mb-8 space-y-3">
          <span className="goyn-eyebrow">Marco común</span>
          <h2 id="roles" className="text-3xl font-bold text-foreground sm:text-4xl">Roles en el ecosistema</h2>
          <p className="max-w-2xl text-muted-foreground">Cada organización declara un rol principal y otros roles que cumple en el territorio.</p>
        </Reveal>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {byRole.map((r, i) => (
            <Reveal as="li" key={r.code} delay={(i % 4) * 0.06}>
              <Link href={`/actores?rol=${r.code}`} className="group flex h-full items-start gap-4 rounded-2xl border bg-card p-4 transition-all hover:-translate-y-1 hover:shadow-lg" style={{ borderColor: undefined }}>
                <span className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                  <RoleIcon code={r.code} size={52} />
                </span>
                <div>
                  <p className="font-heading font-bold text-foreground">{r.label}</p>
                  <p className="text-sm text-muted-foreground">
                    <AnimatedNumber value={r.count} /> organizaciones
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* Reto colectivo */}
      <section className="relative isolate overflow-hidden bg-goyn-magenta py-20 text-white">
        <Image src="/images/fotos/sesion-colaborativo-2026.webp" alt="" fill sizes="100vw" className="-z-10 object-cover opacity-40 mix-blend-multiply grayscale" />
        <FloatingShape name="rayo" size={90} white className="top-8 left-[6%] hidden md:block" float={16} />
        <FloatingShape name="asterisco" size={70} white className="right-[8%] bottom-10 hidden md:block" spin={360} duration={10} />
        <Reveal className="goyn-container max-w-4xl text-center">
          <p className="text-sm font-bold tracking-widest text-white/80 uppercase">Diagnóstico del Colaborativo · Sesión S1-042026</p>
          <blockquote className="mt-4 font-heading text-3xl leading-tight font-bold sm:text-5xl">
            “El reto no es la falta de acción, es la falta de una forma compartida de ver, conectar y medir lo que hacemos.”
          </blockquote>
          <p className="mt-6 text-white/85">76+ organizaciones · 10 mesas de co-creación · 9 de abril de 2026</p>
        </Reveal>
      </section>

      {/* Fases */}
      <section aria-labelledby="fases" className="goyn-container py-16 sm:py-20">
        <Reveal className="mb-8 space-y-3">
          <span className="goyn-eyebrow">Horizonte 2026 — 2028</span>
          <h2 id="fases" className="text-3xl font-bold text-foreground sm:text-4xl">Una plataforma que evoluciona con el ecosistema</h2>
        </Reveal>
        <ol className="grid gap-4 md:grid-cols-3">
          {phases.map((p, i) => (
            <Reveal as="li" key={p.name} delay={i * 0.1} className={cn("relative overflow-hidden rounded-3xl border p-6", p.active ? "border-goyn-violeta bg-goyn-lila/60" : "bg-card")}>
              {p.active && <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 goyn-stripe" />}
              <div className="flex items-center justify-between">
                <span className="font-heading text-5xl font-bold text-goyn-violeta/25">0{i + 1}</span>
                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold", p.active ? "bg-goyn-violeta text-white" : "bg-muted text-muted-foreground")}>
                  {p.active && <span className="goyn-live-dot bg-white" aria-hidden />}
                  {p.year} {p.active && "· en curso"}
                </span>
              </div>
              <p className="mt-2 font-heading text-2xl font-bold text-foreground">{p.name}</p>
              <p className="mt-2 text-muted-foreground">{p.text}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Aliados */}
      <section aria-labelledby="aliados" className="border-y bg-muted/60 py-12">
        <div className="goyn-container">
          <h2 id="aliados" className="mb-6 text-center text-sm font-bold tracking-widest text-muted-foreground uppercase">
            Algunas organizaciones que hacen parte del Colaborativo
          </h2>
          <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
            <ul className="flex w-max animate-[marquee_60s_linear_infinite] gap-10 hover:[animation-play-state:paused] motion-reduce:animate-none">
              {[...Array(2)].flatMap((_, k) =>
                Array.from({ length: 40 }, (_, i) => (
                  <li key={`${k}-${i}`} className="shrink-0 rounded-xl bg-white px-3 py-1" aria-hidden={k === 1}>
                    <Image src={`/images/aliados/aliado-${String(i + 1).padStart(2, "0")}.webp`} alt="" width={150} height={75} className="h-12 w-auto object-contain" />
                  </li>
                )),
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA registro */}
      <section className="goyn-container py-16 sm:py-20">
        <Reveal className="relative grid overflow-hidden rounded-3xl bg-goyn-magenta text-white lg:grid-cols-2">
          <div className="relative space-y-5 p-8 sm:p-12">
            <FloatingShape name="mas" size={70} white className="top-6 right-6 opacity-50" float={10} />
            <h2 className="text-3xl font-bold uppercase sm:text-4xl">¿Aún no te ves reflejado?</h2>
            <p className="max-w-md text-lg text-white/90">
              Registra tu organización, cuéntanos qué haces por las juventudes y aparece en el mapa y el directorio del Colaborativo una vez GOYN valide tu información.
            </p>
            <Link href="/registro" className={cn(buttonVariants(), "h-12 rounded-full bg-goyn-navy px-6 text-base font-bold text-white hover:bg-goyn-navy/90")}>
              Registrar mi organización <ArrowRightIcon aria-hidden />
            </Link>
          </div>
          <div className="relative min-h-64 overflow-hidden">
            <Image src="/images/fotos/jovenes-grupo.webp" alt="Jóvenes de Barranquilla sonriendo" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover transition-transform duration-[2s] hover:scale-105" />
          </div>
        </Reveal>
      </section>
    </>
  );
}
