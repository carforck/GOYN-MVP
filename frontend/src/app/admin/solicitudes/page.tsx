import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ecosystem/page-header";
import { label, shortTerritory } from "@/lib/catalogs";
import { listChangeRequests } from "@/lib/data";
import { formatDateTime } from "@/lib/format";
import { statusStyle } from "@/lib/requests";
import type { ChangeRequestSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Bandeja de validación" };

const kindLabel: Record<ChangeRequestSummary["kind"], string> = {
  alta: "Registro nuevo",
  actualizacion: "Actualización",
  indicador: "Indicador",
};

export default async function SolicitudesPage(props: PageProps<"/admin/solicitudes">) {
  const sp = await props.searchParams;
  const tipo = typeof sp.tipo === "string" ? sp.tipo : "";
  const requests = (await listChangeRequests()).filter((r) => !tipo || r.kind === tipo);

  return (
    <div className="space-y-6">
      <PageHeader title="Bandeja de validación" description="Solo se publica información aprobada. La vista de cada solicitud muestra únicamente lo que cambió frente a lo publicado." />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo">
        {[["", "Todas"], ["alta", "Registros nuevos"], ["actualizacion", "Actualizaciones"], ["indicador", "Indicadores"]].map(([value, text]) => (
          <Link key={value} href={value ? `?tipo=${value}` : "?"} aria-current={tipo === value ? "page" : undefined}
            className={cn("rounded-full border px-4 py-2 text-sm font-semibold", tipo === value ? "border-goyn-navy bg-goyn-navy text-white" : "bg-white")}>
            {text}
          </Link>
        ))}
      </div>
      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted text-left text-xs font-bold text-muted-foreground uppercase">
            <tr>
              <th className="p-4">Organización</th>
              <th className="p-4">Tipo</th>
              <th className="p-4">Territorio</th>
              <th className="p-4">Enviada</th>
              <th className="p-4">Estado</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {requests.map((r) => (
              <tr key={r.id} className="hover:bg-muted/50">
                <td className="p-4">
                  <p className="font-semibold text-goyn-navy">{r.organization_name}</p>
                  <p className="text-xs text-muted-foreground">{label("orgTypes", r.org_type_code)}</p>
                </td>
                <td className="p-4">{kindLabel[r.kind]}</td>
                <td className="p-4">{r.territory ? shortTerritory(r.territory) : "—"}</td>
                <td className="p-4">{formatDateTime(r.submitted_at)}</td>
                <td className="p-4">
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", statusStyle[r.status]?.className)}>{statusStyle[r.status]?.label ?? r.status}</span>
                </td>
                <td className="p-4 text-right">
                  <Link href={`/admin/solicitudes/${r.id}`} className="font-bold text-goyn-violeta hover:underline">Revisar</Link>
                </td>
              </tr>
            ))}
            {requests.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No hay solicitudes con este filtro.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
