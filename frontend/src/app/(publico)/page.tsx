import { ArrowRightIcon, BarChart3Icon, CompassIcon, MapIcon, SparklesIcon, UsersIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Shape } from "@/components/brand/shape";
import { RoleIcon } from "@/components/ecosystem/role-badge";
import { buttonVariants } from "@/components/ui/button";
import { catalogs, shortTerritory } from "@/lib/catalogs";
import { getEcosystemStats, listOrganizations } from "@/lib/data";
import { formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const intents = [
  { href: "/mapa", eyebrow: "Quiero ver", title: "El ecosistema", text: "Mapa georreferenciado de actores por territorio, rol y área de impacto.", icon: MapIcon, color: "bg-goyn-violeta" },
  { href: "/actores", eyebrow: "Quiero conectar", title: "Con otros actores", text: "Directorio filtrable y hojas de vida verificadas de las organizaciones.", icon: UsersIcon, color: "bg-goyn-cian" },
  { href: "/impacto", eyebrow: "Quiero medir", title: "El impacto colectivo", text: "Jóvenes conectados, fortalecidos y transformados por periodo y territorio.", icon: BarChart3Icon, color: "bg-goyn-magenta" },
  { href: "/oportunidades", eyebrow: "Quiero encontrar", title: "Oportunidades", text: "Estudiar, trabajar, emprender o participar. Muy pronto para jóvenes.", icon: CompassIcon, color: "bg-goyn-naranja", soon: true },
];

const phases = [
  { year: "2026", name: "Mapear", text: "Visibilizar actores, acciones y resultados del ecosistema juvenil.", active: true },
  { year: "2027", name: "Potenciar", text: "Promover y activar nuevas acciones conjuntas: conexiones, historias y participación juvenil." },
  { year: "2028", name: "Medir", text: "Medir el impacto colectivo en trayectorias juveniles priorizadas." },
];

export default async function HomePage() {
  const [stats, orgs] = await Promise.all([getEcosystemStats(), listOrganizations()]);
  const byTerritory = catalogs.territories
    .filter((t) => t.lat != null)
    .map((t) => ({ ...t, count: orgs.filter((o) => o.territory_codes.includes(t.code)).length }));
  const byRole = catalogs.roles.map((r) => ({ ...r, count: orgs.filter((o) => o.role_codes.includes(r.code)).length }));

  return (
    <>
      {/* Hero */}
      {/* Duotono morado sobre fotografía, como las piezas del Manual de identidad (§7 Fotografía). */}
      <section className="relative isolate overflow-hidden bg-goyn-violeta">
        <Image src="/images/fotos/hero-jovenes.webp" alt="Jóvenes del Colaborativo GOYN Barranquilla con camisetas rosadas" fill priority sizes="100vw" className="-z-10 object-cover object-[50%_30%] opacity-80 mix-blend-multiply grayscale" />
        <div className="absolute inset-0 -z-10 bg-linear-to-r from-goyn-violeta via-goyn-violeta/80 to-goyn-magenta/30" />
        <Shape name="asterisco" size={110} className="top-10 right-[8%] hidden opacity-90 md:block" />
        <Shape name="aro_rayado" size={200} className="-bottom-20 left-[45%] hidden opacity-60 md:block" />
        <div className="goyn-container relative py-20 sm:py-28 lg:py-32">
          <div className="max-w-3xl space-y-6">
            <span className="goyn-eyebrow bg-goyn-magenta">Colaborativo GOYN Barranquilla · Fase Mapear 2026</span>
            <h1 className="text-4xl leading-[1.05] font-bold tracking-tight text-white uppercase sm:text-6xl">
              El espejo digital del{" "}
              <span className="bg-goyn-magenta box-decoration-clone px-2 leading-[1.25]">ecosistema juvenil</span> de Barranquilla
            </h1>
            <p className="max-w-2xl text-lg text-white/85 sm:text-xl">
              Ver, conectar y medir lo que hacen las organizaciones del Colaborativo por las juventudes de Barranquilla y su área metropolitana.
            </p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Link href="/mapa" className={cn(buttonVariants(), "h-12 rounded-full bg-goyn-magenta px-6 text-base font-bold text-white hover:bg-goyn-magenta/90")}>
                <MapIcon aria-hidden /> Explorar el mapa
              </Link>
              <Link href="/registro" className={cn(buttonVariants({ variant: "outline" }), "h-12 rounded-full border-white/40 bg-transparent px-6 text-base font-bold text-white hover:bg-white/10 hover:text-white")}>
                ¿Aún no te ves reflejado? Regístrate <ArrowRightIcon aria-hidden />
              </Link>
            </div>
            <p className="font-marker text-2xl text-white">El futuro es joven</p>
          </div>
        </div>
      </section>

      {/* KPIs del ecosistema */}
      <section aria-labelledby="kpis" className="relative -mt-10 pb-4">
        <div className="goyn-container">
          <h2 id="kpis" className="sr-only">Cifras del ecosistema</h2>
          <div className="grid grid-cols-2 gap-3 rounded-3xl border bg-white p-3 shadow-xl shadow-goyn-violeta/10 sm:p-4 lg:grid-cols-6">
            {[
              { label: "Organizaciones", value: stats.organizations, color: "#060A28" },
              { label: "Programas", value: stats.programs, color: "#0AA066" },
              { label: "Conexiones", value: stats.connections, color: "#FE5200" },
              { label: "Jóvenes conectados", value: stats.conectados, color: "#9B00FF" },
              { label: "Jóvenes fortalecidos", value: stats.fortalecidos, color: "#00A0CC" },
              { label: "Jóvenes transformados", value: stats.transformados, color: "#FF01A2" },
            ].map((k) => (
              <Link key={k.label} href={k.label.startsWith("Jóvenes") ? "/impacto" : "/actores"} className="rounded-2xl p-3 transition-colors hover:bg-muted sm:p-4">
                <span aria-hidden className="mb-3 block h-1.5 w-10 rounded-full" style={{ backgroundColor: k.color }} />
                <p className="font-heading text-2xl font-extrabold text-goyn-navy tabular-nums sm:text-3xl">{formatNumber(k.value)}</p>
                <p className="mt-1 text-xs font-semibold text-muted-foreground sm:text-sm">{k.label}</p>
              </Link>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Cifras de jóvenes = suma de reportes validados por GOYN (no personas únicas) · Corte {formatDate(stats.indicators_updated_at)}
          </p>
        </div>
      </section>

      {/* Navegación por intención */}
      <section aria-labelledby="intencion" className="goyn-container py-16 sm:py-20">
        <div className="mb-8 space-y-3">
          <span className="goyn-eyebrow">Navegación por intención</span>
          <h2 id="intencion" className="text-3xl font-extrabold text-goyn-navy sm:text-4xl">¿Qué necesitas hoy?</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {intents.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "group relative flex flex-col gap-4 overflow-hidden rounded-3xl border bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-goyn-violeta/10",
                it.soon && "border-dashed",
              )}
            >
              <span className={cn("grid size-12 place-items-center rounded-2xl text-white", it.color)}>
                <it.icon className="size-6" aria-hidden />
              </span>
              <div>
                <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">{it.eyebrow}</p>
                <p className="mt-1 font-heading text-xl font-extrabold text-goyn-navy">{it.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{it.text}</p>
              </div>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-goyn-violeta">
                {it.soon ? (<><SparklesIcon className="size-4" aria-hidden /> Próximamente</>) : (<>Entrar <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-1" aria-hidden /></>)}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Territorio */}
      <section aria-labelledby="territorio" className="bg-goyn-lila/50 py-16 sm:py-20">
        <div className="goyn-container grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div className="space-y-4">
            <span className="goyn-eyebrow bg-goyn-cian text-goyn-navy">El mapa es el corazón</span>
            <h2 id="territorio" className="text-3xl font-extrabold text-goyn-navy sm:text-4xl">¿Quién está dónde y qué hace?</h2>
            <p className="text-lg text-muted-foreground">
              Presencia de las organizaciones en las zonas de Barranquilla y su área metropolitana. Toca una zona para verla en el mapa.
            </p>
            <Link href="/mapa" className={cn(buttonVariants(), "h-11 rounded-full px-5 font-bold")}>
              Abrir el mapa completo <ArrowRightIcon aria-hidden />
            </Link>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {byTerritory.map((t) => (
              <li key={t.code}>
                <Link href={`/mapa?territorio=${t.code}`} className="flex h-full flex-col justify-between rounded-2xl border bg-white p-4 transition-colors hover:border-goyn-violeta">
                  <span className="text-xs font-bold text-muted-foreground uppercase">{t.municipality}</span>
                  <span className="mt-1 font-heading font-bold text-goyn-navy">{shortTerritory(t.code)}</span>
                  <span className="mt-3 font-heading text-2xl font-extrabold text-goyn-violeta">{t.count}</span>
                  <span className="text-xs text-muted-foreground">organizaciones</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Roles */}
      <section aria-labelledby="roles" className="goyn-container py-16 sm:py-20">
        <div className="mb-8 space-y-3">
          <span className="goyn-eyebrow">Marco común</span>
          <h2 id="roles" className="text-3xl font-extrabold text-goyn-navy sm:text-4xl">Roles en el ecosistema</h2>
          <p className="max-w-2xl text-muted-foreground">Cada organización declara un rol principal y otros roles que cumple en el territorio.</p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {byRole.map((r) => (
            <li key={r.code}>
              <Link href={`/actores?rol=${r.code}`} className="flex h-full items-start gap-4 rounded-2xl border bg-white p-4 transition-colors hover:border-goyn-violeta/50">
                <RoleIcon code={r.code} size={52} />
                <div>
                  <p className="font-heading font-bold text-goyn-navy">{r.label}</p>
                  <p className="text-sm text-muted-foreground">{r.count} organizaciones</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Reto colectivo */}
      <section className="relative isolate overflow-hidden bg-goyn-magenta py-20 text-white">
        <Image src="/images/fotos/sesion-colaborativo-2026.webp" alt="" fill sizes="100vw" className="-z-10 object-cover opacity-40 mix-blend-multiply grayscale" />
        <Shape name="rayo" size={90} className="top-8 left-[6%] hidden opacity-90 brightness-0 invert md:block" />
        <div className="goyn-container max-w-4xl text-center">
          <p className="text-sm font-bold tracking-widest text-white/70 uppercase">Diagnóstico del Colaborativo · Sesión S1-042026</p>
          <blockquote className="mt-4 font-heading text-3xl leading-tight font-black sm:text-5xl">
            “El reto no es la falta de acción, es la falta de una forma compartida de ver, conectar y medir lo que hacemos.”
          </blockquote>
          <p className="mt-6 text-white/80">76+ organizaciones · 10 mesas de co-creación · 9 de abril de 2026</p>
        </div>
      </section>

      {/* Fases */}
      <section aria-labelledby="fases" className="goyn-container py-16 sm:py-20">
        <div className="mb-8 space-y-3">
          <span className="goyn-eyebrow">Horizonte 2026 — 2028</span>
          <h2 id="fases" className="text-3xl font-extrabold text-goyn-navy sm:text-4xl">Una plataforma que evoluciona con el ecosistema</h2>
        </div>
        <ol className="grid gap-4 md:grid-cols-3">
          {phases.map((p, i) => (
            <li key={p.name} className={cn("relative rounded-3xl border p-6", p.active ? "border-goyn-violeta bg-goyn-lila/60" : "bg-white")}>
              <div className="flex items-center justify-between">
                <span className="font-heading text-5xl font-black text-goyn-violeta/20">0{i + 1}</span>
                <span className={cn("rounded-full px-3 py-1 text-xs font-bold", p.active ? "bg-goyn-violeta text-white" : "bg-muted text-muted-foreground")}>
                  {p.year} {p.active && "· en curso"}
                </span>
              </div>
              <p className="mt-2 font-heading text-2xl font-extrabold text-goyn-navy">{p.name}</p>
              <p className="mt-2 text-muted-foreground">{p.text}</p>
            </li>
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
            <ul className="flex w-max animate-[marquee_60s_linear_infinite] gap-10 motion-reduce:animate-none">
              {[...Array(2)].flatMap((_, k) =>
                Array.from({ length: 40 }, (_, i) => (
                  <li key={`${k}-${i}`} className="shrink-0" aria-hidden={k === 1}>
                    <Image src={`/images/aliados/aliado-${String(i + 1).padStart(2, "0")}.webp`} alt="" width={150} height={75} className="h-14 w-auto object-contain" />
                  </li>
                )),
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA registro */}
      <section className="goyn-container py-16 sm:py-20">
        <div className="relative grid overflow-hidden rounded-3xl bg-goyn-magenta text-white lg:grid-cols-2">
          <div className="relative space-y-5 p-8 sm:p-12">
            <Shape name="mas" size={70} className="top-6 right-6 opacity-40 brightness-0 invert" />
            <h2 className="text-3xl font-black sm:text-4xl">¿Aún no te ves reflejado?</h2>
            <p className="max-w-md text-lg text-white/90">
              Registra tu organización, cuéntanos qué haces por las juventudes y aparece en el mapa y el directorio del Colaborativo una vez GOYN valide tu información.
            </p>
            <Link href="/registro" className={cn(buttonVariants(), "h-12 rounded-full bg-goyn-navy px-6 text-base font-bold text-white hover:bg-goyn-navy/90")}>
              Registrar mi organización <ArrowRightIcon aria-hidden />
            </Link>
          </div>
          <div className="relative min-h-64">
            <Image src="/images/fotos/jovenes-grupo.webp" alt="Jóvenes de Barranquilla sonriendo" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
        </div>
      </section>
    </>
  );
}
