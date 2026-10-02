import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DecisionPanel } from "@/app/admin/solicitudes/[id]/decision-panel";
import { statusStyle } from "@/lib/requests";
import { label } from "@/lib/catalogs";
import { getChangeRequestDetail } from "@/lib/data";
import { isDemoSession } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Revisar solicitud" };

// Filas de ejemplo para el modo demo (en modo conectado salen del payload de la solicitud).
const newOrgFields = (name: string, type: string) => [
  { field: "Nombre", before: "", after: name },
  { field: "Tipo de organización", before: "", after: label("orgTypes", type) },
  { field: "Rol principal", before: "", after: "Implementador" },
  { field: "Descripción", before: "", after: "Organización que acompaña a jóvenes en rutas de empleabilidad y emprendimiento en el área metropolitana." },
  { field: "Territorios", before: "", after: "AMB – Soledad, BAQ – Sur Oriente" },
  { field: "Proyectos", before: "", after: "Primer empleo Soledad (presencial, meta 2026: 180 jóvenes)" },
  { field: "Resultados declarados", before: "", after: "120 atendidos · 80 fortalecidos · 25 con empleo o emprendimiento" },
];

export default async function SolicitudPage(props: PageProps<"/admin/solicitudes/[id]">) {
  const { id } = await props.params;
  const request = await getChangeRequestDetail(id);
  if (!request) notFound();

  const changes = request.changes.length || !(await isDemoSession()) ? request.changes : newOrgFields(request.organization_name, request.org_type_code);
  const isNew = request.kind !== "actualizacion";

  return (
    <div className="space-y-6">
      <Link href="/admin/solicitudes" className="inline-flex items-center gap-1.5 text-sm font-semibold text-goyn-violeta hover:underline">
        <ArrowLeftIcon className="size-4" aria-hidden /> Bandeja de validación
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">{isNew ? "Registro nuevo" : request.kind === "actualizacion" ? "Actualización de perfil" : "Reporte de indicador"} · enviada {formatDateTime(request.submitted_at)}</p>
          <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">{request.organization_name}</h1>
        </div>
        <span className={cn("rounded-full px-3 py-1 text-sm font-bold", statusStyle[request.status]?.className)}>{statusStyle[request.status]?.label}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="overflow-hidden rounded-2xl border bg-card" aria-labelledby="cambios">
          <h2 id="cambios" className="border-b p-5 font-heading text-lg font-bold text-foreground">
            {isNew ? "Información propuesta" : "Solo lo que cambió frente a lo publicado"}
          </h2>
          <div className="divide-y">
            {changes.map((c) => (
              <div key={c.field} className="grid gap-3 p-5 md:grid-cols-[160px_1fr]">
                <p className="text-xs font-bold text-muted-foreground uppercase">{c.field}</p>
                {isNew ? (
                  <p className="text-sm text-foreground">{c.after}</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <p className="rounded-xl bg-destructive/5 p-3 text-sm text-foreground/80 line-through decoration-destructive/40">{c.before}</p>
                    <p className="rounded-xl bg-goyn-lila p-3 text-sm text-foreground">{c.after}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
        <DecisionPanel id={request.id} fields={changes.map((c) => c.field)} disabled={request.status !== "enviada"} kind={request.kind} />
      </div>
    </div>
  );
}
