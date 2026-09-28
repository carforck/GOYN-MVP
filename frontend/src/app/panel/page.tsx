import {
  AlertTriangleIcon,
  ArrowRightIcon,
  BadgeCheckIcon,
  BarChart3Icon,
  ClipboardListIcon,
  ExternalLinkIcon,
  FolderKanbanIcon,
  PencilIcon,
  Share2Icon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CategoryChart, DonutChart } from "@/components/ecosystem/impact-charts";
import { OrgInitials } from "@/components/ecosystem/org-card";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { FloatingShape } from "@/components/motion/floating-shape";
import { Reveal } from "@/components/motion/reveal";
import { CompletenessRing, PanelActivity, PanelKpis, PanelTrend } from "@/components/panel/panel-live";
import { buttonVariants } from "@/components/ui/button";
import { getViewer } from "@/lib/auth";
import { label } from "@/lib/catalogs";
import { getOwnOrganization, listIndicatorReports, listPrograms, listRelations } from "@/lib/data";
import { formatDate, isStale } from "@/lib/format";
import { byPeriod, totals } from "@/lib/impact";
import type { PublicOrganization } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Mi panel" };

// Completitud del perfil: qué tan completa está la hoja de vida pública.
function completeness(org: PublicOrganization, programs: number, relations: number) {
  const checks = [
    org.description.length > 80,
    !!org.mission,
    !!org.contact_email_public,
    !!org.website || Object.keys(org.social ?? {}).length > 0,
    org.role_codes.length > 1,
    org.area_codes.length > 0,
    org.problem_codes.length > 0,
    org.territory_codes.length > 0,
    programs > 0,
    relations > 0,
    !!org.logo_path,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export default async function PanelPage() {
  const viewer = await getViewer();
  const org = await getOwnOrganization(viewer.organizationIds);

  if (!org) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border bg-card p-8 text-center sm:p-12">
        <ClipboardListIcon className="mx-auto size-12 text-goyn-violeta" aria-hidden />
        <h1 className="mt-4 text-2xl font-bold text-foreground">Registra tu organización</h1>
        <p className="mt-2 text-muted-foreground">Aún no tienes una organización publicada. Completa el registro guiado y el equipo GOYN lo validará.</p>
        <Link href="/panel/registro" className={cn(buttonVariants(), "mt-6 h-11 rounded-full px-6 font-bold")}>
          Empezar el registro <ArrowRightIcon aria-hidden />
        </Link>
      </div>
    );
  }

  const [programs, relations, reports] = await Promise.all([listPrograms(org.id), listRelations(org.id), listIndicatorReports(org.id)]);
  const t = totals(reports);
  const stale = isStale(org.updated_at);
  const complete = completeness(org, programs.length, relations.length);
  const byProgram = programs.map((p) => {
    const r = reports.filter((x) => x.program_id === p.id);
    const sum = (code: string) => r.filter((x) => x.indicator_code === code).reduce((n, x) => n + x.value, 0);
    return { name: p.name, conectados: sum("conectados"), fortalecidos: sum("fortalecidos"), transformados: sum("transformados") };
  });

  return (
    <div className="space-y-6">
      {/* Portada del panel: identidad de la organización, estado y completitud */}
      <Reveal className="relative overflow-hidden rounded-3xl bg-linear-to-br from-goyn-violeta via-[#7a00cc] to-goyn-magenta p-6 text-white shadow-xl shadow-goyn-violeta/25 sm:p-8">
        <FloatingShape name="asterisco" size={80} white className="top-5 right-8 opacity-30" spin={360} duration={12} parallax={0} />
        <FloatingShape name="aro_rayado" size={160} className="-right-10 -bottom-16 opacity-40" parallax={0} />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <OrgInitials name={org.name} className="size-16 rounded-3xl bg-none bg-white/20 text-2xl backdrop-blur" />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white/80">Hola, {viewer.name ?? "equipo"}</p>
              <h1 className="text-2xl font-bold sm:text-3xl">{org.name}</h1>
              <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/85">
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <BadgeCheckIcon className="size-4" aria-hidden /> Publicada y verificada
                </span>
                <span>{org.org_type_label}</span>
                <span>Actualizada el {formatDate(org.updated_at)}</span>
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Link href="/panel/registro" className={cn(buttonVariants(), "h-10 rounded-full bg-white px-4 font-bold text-goyn-violeta hover:bg-white/90")}>
                  <PencilIcon aria-hidden /> Actualizar mis datos
                </Link>
                <Link href={`/actores/${org.slug}`} className={cn(buttonVariants({ variant: "outline" }), "h-10 rounded-full border-white/40 bg-white/10 px-4 font-semibold text-white hover:bg-white/20 hover:text-white")}>
                  Ver perfil público <ExternalLinkIcon aria-hidden />
                </Link>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur">
            <CompletenessRing value={complete} />
            <div className="max-w-44 text-sm text-white/85">
              {complete < 100 ? "Completa tu hoja de vida para aparecer mejor en el mapa y el directorio." : "¡Tu hoja de vida está completa!"}
            </div>
          </div>
        </div>
      </Reveal>

      {stale && (
        <Reveal className="flex items-start gap-3 rounded-2xl border border-goyn-naranja bg-goyn-naranja/10 p-4">
          <AlertTriangleIcon className="size-5 shrink-0 text-goyn-naranja" aria-hidden />
          <p className="text-sm text-foreground">
            <strong>Tu perfil lleva más de 6 meses sin cambios.</strong> Actualízalo para que el ecosistema vea tu información vigente.
          </p>
        </Reveal>
      )}

      {/* KPIs propios en vivo */}
      <PanelKpis slug={org.slug} base={{ conectados: t.conectados, fortalecidos: t.fortalecidos, transformados: t.transformados }} />

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Reveal className="rounded-3xl border bg-card p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-foreground">
              <BarChart3Icon className="size-5 text-goyn-violeta" aria-hidden /> Evolución de tus resultados
            </h2>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <span className="goyn-live-dot" aria-hidden /> En vivo
            </span>
          </div>
          <PanelTrend slug={org.slug} series={byPeriod(reports)} />
        </Reveal>
        <Reveal delay={0.08} className="rounded-3xl border bg-card p-5 sm:p-6">
          <PanelActivity slug={org.slug} />
        </Reveal>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Reveal className="rounded-3xl border bg-card p-5 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-bold text-foreground">
            <FolderKanbanIcon className="size-5 text-goyn-cian" aria-hidden /> Resultados por programa
          </h2>
          <CategoryChart data={byProgram} height={Math.max(220, byProgram.length * 80)} />
        </Reveal>
        <Reveal delay={0.08} className="rounded-3xl border bg-card p-5 sm:p-6">
          <h2 className="mb-2 font-heading text-lg font-bold text-foreground">Mujeres jóvenes conectadas</h2>
          <p className="mb-2 text-sm text-muted-foreground">Proporción sobre el total de jóvenes conectados reportados.</p>
          <DonutChart value={t.mujeresConectadas} total={t.conectados} label="mujeres" />
        </Reveal>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { href: "/panel/programas", title: "Programas", value: programs.length, text: "activos en tu perfil", icon: FolderKanbanIcon, color: "#0AA066" },
          { href: "/panel/relaciones", title: "Relaciones", value: relations.length, text: "socios, aliados y colaboradores", icon: Share2Icon, color: "#FE5200" },
          { href: "/panel/indicadores", title: "Reportes de indicador", value: reports.length, text: "validados por GOYN", icon: BarChart3Icon, color: "#9B00FF" },
        ].map((c, i) => (
          <Reveal key={c.href} delay={i * 0.06}>
            <Link href={c.href} className="group flex items-center gap-4 rounded-3xl border bg-card p-5 transition-all hover:-translate-y-1 hover:shadow-lg">
              <span className="grid size-12 place-items-center rounded-2xl text-white transition-transform group-hover:scale-110 group-hover:-rotate-6" style={{ backgroundColor: c.color }}>
                <c.icon className="size-6" aria-hidden />
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold text-muted-foreground">{c.title}</p>
                <AnimatedNumber value={c.value} className="font-heading text-3xl font-bold text-foreground" />
                <p className="text-xs text-muted-foreground">{c.text}</p>
              </div>
              <ArrowRightIcon className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          </Reveal>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Áreas de impacto: {org.area_codes.map((a) => label("impactAreas", a)).join(" · ")}
      </p>
    </div>
  );
}
