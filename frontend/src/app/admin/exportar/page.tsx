import { ShieldAlertIcon } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ecosystem/page-header";
import { ExportForm } from "@/app/admin/exportar/export-form";
import { listIndicatorReports } from "@/lib/data";
import { datasets } from "@/lib/export";

export const metadata: Metadata = { title: "Exportar datos" };

export default async function ExportarPage() {
  const periods = [...new Set((await listIndicatorReports()).map((r) => r.period_label))].sort().reverse();
  return (
    <div className="space-y-6">
      <PageHeader title="Exportar datos" description="Descarga los datos publicados en CSV o XLSX, filtrados como necesites, para análisis y reportes. Cada exportación queda registrada." />
      <ExportForm datasets={{ ...datasets }} periods={periods} />
      <p className="flex items-start gap-2 rounded-2xl border border-dashed bg-card p-4 text-sm text-muted-foreground">
        <ShieldAlertIcon className="mt-0.5 size-4 shrink-0 text-goyn-naranja" aria-hidden />
        Las exportaciones no incluyen celulares, direcciones ni autoevaluaciones. Los archivos generados en el almacenamiento caducan a las 48 horas.
      </p>
    </div>
  );
}
