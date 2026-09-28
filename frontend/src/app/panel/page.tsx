import { AlertTriangleIcon, ArrowRightIcon, CheckCircle2Icon, ClipboardListIcon, ExternalLinkIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { KpiCard } from "@/components/ecosystem/kpi-card";
import { buttonVariants } from "@/components/ui/button";
import { getViewer } from "@/lib/auth";
import { getOwnOrganization, listIndicatorReports, listPrograms, listRelations } from "@/lib/data";
import { formatDate, isStale } from "@/lib/format";
import { totals } from "@/lib/impact";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Mi panel" };


export default async function PanelPage() {
  const viewer = await getViewer();
  const org = await getOwnOrganization(viewer.organizationIds);

  if (!org) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border bg-white p-8 text-center sm:p-12">
        <ClipboardListIcon className="mx-auto size-12 text-goyn-violeta" aria-hidden />
        <h1 className="mt-4 text-2xl font-extrabold text-goyn-navy">Registra tu organización</h1>
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Hola, {viewer.name ?? "equipo"}</p>
          <h1 className="text-2xl font-extrabold text-goyn-navy sm:text-3xl">{org.name}</h1>
        </div>
        <Link href={`/actores/${org.slug}`} className={cn(buttonVariants({ variant: "outline" }), "h-10 rounded-full bg-white")}>
          Ver mi perfil público <ExternalLinkIcon aria-hidden />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex items-start gap-3 rounded-2xl border bg-white p-5">
          <CheckCircle2Icon className="size-6 shrink-0 text-goyn-violeta" aria-hidden />
          <div>
            <p className="font-heading font-bold text-goyn-navy">Publicada y verificada</p>
            <p className="text-sm text-muted-foreground">Visible en el mapa y el directorio desde el {formatDate(org.verified_at)}. Última actualización: {formatDate(org.updated_at)}.</p>
          </div>
        </div>
        <div className={cn("flex items-start gap-3 rounded-2xl border p-5", stale ? "border-goyn-naranja bg-goyn-naranja/10" : "bg-white")}>
          <AlertTriangleIcon className={cn("size-6 shrink-0", stale ? "text-goyn-naranja" : "text-muted-foreground")} aria-hidden />
          <div>
            <p className="font-heading font-bold text-goyn-navy">{stale ? "Tu perfil necesita actualización" : "Mantén tu perfil al día"}</p>
            <p className="text-sm text-muted-foreground">Te recordaremos actualizar si pasan 6 meses sin cambios. Los cambios pasan por validación antes de publicarse.</p>
            <Link href="/panel/registro" className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-goyn-violeta hover:underline">
              Proponer actualización <ArrowRightIcon className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Jóvenes conectados" value={t.conectados} color="#9B00FF" />
        <KpiCard label="Jóvenes fortalecidos" value={t.fortalecidos} color="#00A0CC" />
        <KpiCard label="Jóvenes transformados" value={t.transformados} color="#FF01A2" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { href: "/panel/programas", title: "Programas", value: programs.length, text: "activos en tu perfil" },
          { href: "/panel/relaciones", title: "Relaciones", value: relations.length, text: "socios, aliados y colaboradores" },
          { href: "/panel/indicadores", title: "Reportes de indicador", value: reports.length, text: "validados por GOYN" },
        ].map((c) => (
          <Link key={c.href} href={c.href} className="rounded-2xl border bg-white p-5 transition-colors hover:border-goyn-violeta">
            <p className="text-sm font-bold text-muted-foreground">{c.title}</p>
            <p className="mt-1 font-heading text-3xl font-extrabold text-goyn-navy">{c.value}</p>
            <p className="text-sm text-muted-foreground">{c.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
