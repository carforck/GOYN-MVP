import type { Metadata } from "next";
import { PageHeader } from "@/components/ecosystem/page-header";
import { IndicatorReportForm } from "@/app/panel/indicadores/report-form";
import { label } from "@/lib/catalogs";
import { getViewer } from "@/lib/auth";
import { getOwnOrganization, listIndicatorReports, listPrograms } from "@/lib/data";
import { formatNumber, formatPeriod } from "@/lib/format";

export const metadata: Metadata = { title: "Indicadores" };

export default async function IndicadoresPage() {
  const viewer = await getViewer();
  const org = await getOwnOrganization(viewer.organizationIds);
  const [programs, reports] = org ? await Promise.all([listPrograms(org.id), listIndicatorReports(org.id)]) : [[], []];

  // Tabla programa × periodo con los tres indicadores.
  const periods = [...new Set(reports.map((r) => r.period_label))].sort().reverse();
  const rows = programs.flatMap((p) =>
    periods.map((period) => {
      const of = (code: string) => reports.find((r) => r.program_id === p.id && r.period_label === period && r.indicator_code === code)?.value;
      return { key: `${p.id}-${period}`, program: p.name, period, conectados: of("conectados"), fortalecidos: of("fortalecidos"), transformados: of("transformados") };
    }),
  ).filter((r) => r.conectados !== undefined);

  return (
    <div className="space-y-6">
      <PageHeader title="Indicadores por programa y periodo" description="Reporta resultados de tus programas. Cada reporte pasa por la revisión del equipo GOYN (regla anti doble conteo) antes de sumar al tablero de impacto." />
      <IndicatorReportForm programs={programs.map((p) => ({ id: p.id, name: p.name }))} />
      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-muted text-left text-xs font-bold text-muted-foreground uppercase">
            <tr>
              <th className="p-4">Programa</th>
              <th className="p-4">Periodo</th>
              <th className="p-4 text-right">{label("indicators", "conectados")}</th>
              <th className="p-4 text-right">{label("indicators", "fortalecidos")}</th>
              <th className="p-4 text-right">{label("indicators", "transformados")}</th>
              <th className="p-4">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr key={r.key}>
                <td className="p-4 font-semibold text-foreground">{r.program}</td>
                <td className="p-4">{formatPeriod(r.period)}</td>
                <td className="p-4 text-right tabular-nums">{r.conectados !== undefined ? formatNumber(r.conectados) : "—"}</td>
                <td className="p-4 text-right tabular-nums">{r.fortalecidos !== undefined ? formatNumber(r.fortalecidos) : "—"}</td>
                <td className="p-4 text-right tabular-nums">{r.transformados !== undefined ? formatNumber(r.transformados) : "—"}</td>
                <td className="p-4"><span className="rounded-full bg-goyn-lila px-2.5 py-1 text-xs font-bold text-goyn-violeta">Aprobado</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
