import { DownloadIcon, FileSpreadsheetIcon, ShieldAlertIcon } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ecosystem/page-header";
import { buttonVariants } from "@/components/ui/button";
import { datasets } from "@/lib/export";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Exportar datos" };

export default function ExportarPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Exportar datos" description="Descarga los datos publicados en CSV o XLSX para análisis y reportes. Cada exportación queda auditada." />
      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(datasets).map(([key, title]) => (
          <section key={key} className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
            <FileSpreadsheetIcon className="size-8 text-goyn-violeta" aria-hidden />
            <h2 className="font-heading text-lg font-bold text-foreground">{title}</h2>
            <div className="mt-auto flex gap-2">
              <a href={`/admin/exportar/descargar?dataset=${key}&format=csv`} className={cn(buttonVariants({ variant: "outline" }), "h-10 flex-1 rounded-full")}>
                <DownloadIcon aria-hidden /> CSV
              </a>
              <a href={`/admin/exportar/descargar?dataset=${key}&format=xlsx`} className={cn(buttonVariants(), "h-10 flex-1 rounded-full font-bold")}>
                <DownloadIcon aria-hidden /> XLSX
              </a>
            </div>
          </section>
        ))}
      </div>
      <p className="flex items-start gap-2 rounded-2xl border border-dashed bg-card p-4 text-sm text-muted-foreground">
        <ShieldAlertIcon className="mt-0.5 size-4 shrink-0 text-goyn-naranja" aria-hidden />
        Las exportaciones no incluyen celulares, direcciones ni autoevaluaciones. Los archivos generados en el almacenamiento caducan a las 48 horas.
      </p>
    </div>
  );
}
