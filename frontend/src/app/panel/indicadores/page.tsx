import type { Metadata } from "next";
import { PageHeader } from "@/components/ecosystem/page-header";
import { Pagination, paginate } from "@/components/ui/pagination";
import { IndicatorReportForm } from "@/app/panel/indicadores/report-form";
import { label } from "@/lib/catalogs";
import { getViewer } from "@/lib/auth";
import { getOwnOrganization, listOwnIndicatorReports, listPrograms } from "@/lib/data";
import { formatDate, formatNumber } from "@/lib/format";
import { reportYear } from "@/lib/impact";
import type { OwnIndicatorReport } from "@/lib/types";

export const metadata: Metadata = { title: "Indicadores" };

const CODES = ["conectados", "fortalecidos", "transformados"] as const;
type Group = "aprobado" | "revision" | "rechazado";
const STATUS: Record<Group, { text: string; className: string }> = {
  aprobado: { text: "Aprobado", className: "bg-goyn-lila text-goyn-violeta" },
  revision: { text: "En revisión", className: "bg-goyn-amarillo/30 text-foreground" },
  rechazado: { text: "Rechazado", className: "bg-destructive/10 text-destructive" },
};
const groupOf = (s: OwnIndicatorReport["status"]): Group => (s === "aprobado" ? "aprobado" : s === "rechazado" ? "rechazado" : "revision");

const PAGE_SIZE = 20;

export default async function IndicadoresPage(props: PageProps<"/panel/indicadores">) {
  const sp = await props.searchParams;
  const viewer = await getViewer();
  const org = await getOwnOrganization(viewer.organizationIds);
  const [programs, reports] = org ? await Promise.all([listPrograms(org.id), listOwnIndicatorReports(org.id)]) : [[], []];

  // Consolidado programa × año (año de inicio del programa, ajustes 26/28) por estado: suma de
  // las cargas y fecha de la última actualización.
  const rows = programs
    .flatMap((p) => {
      const own = reports.filter((r) => r.program_id === p.id);
      const keys = [...new Set(own.map((r) => `${r.year}|${groupOf(r.status)}`))];
      return keys.map((key) => {
        const [year, group] = key.split("|") as [string, Group];
        const rs = own.filter((r) => r.year === year && groupOf(r.status) === group);
        const sum = (code: string) => {
          const xs = rs.filter((r) => r.indicator_code === code && r.value != null);
          return xs.length ? { total: xs.reduce((n, r) => n + (r.value ?? 0), 0), women: xs.some((r) => r.value_women != null) ? xs.reduce((n, r) => n + (r.value_women ?? 0), 0) : null } : null;
        };
        return {
          key: `${p.id}-${key}`,
          program: p.name,
          year,
          group,
          updated: rs.reduce((m, r) => (r.updated_at > m ? r.updated_at : m), ""),
          values: Object.fromEntries(CODES.map((c) => [c, sum(c)])) as Record<(typeof CODES)[number], ReturnType<typeof sum>>,
        };
      });
    })
    .sort((a, b) => b.year.localeCompare(a.year) || a.program.localeCompare(b.program, "es") || a.group.localeCompare(b.group));

  const page = paginate(rows, sp, PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Indicadores por programa y año"
        description="Reporta los resultados de tus programas por año (el de la fecha de inicio de cada programa). Cada carga guarda la cantidad y su fecha de actualización, y pasa por la revisión del equipo GOYN (regla anti doble conteo) antes de sumar al tablero de impacto."
      />
      <IndicatorReportForm
        programs={programs.map((p) => ({ id: p.id, name: p.name, start_date: p.start_date, year: reportYear(p.start_date, String(new Date().getFullYear())) }))}
      />
      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full min-w-[760px] text-sm">
          <caption className="sr-only">Consolidado de resultados por programa y año</caption>
          <thead className="bg-muted text-left text-xs font-bold text-muted-foreground uppercase">
            <tr>
              <th className="p-4">Programa</th>
              <th className="p-4">Año</th>
              {CODES.map((c) => <th key={c} className="p-4 text-right">{label("indicators", c)}</th>)}
              <th className="p-4">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">Aún no hay resultados reportados.</td>
              </tr>
            )}
            {page.items.map((r) => (
              <tr key={r.key}>
                <td className="p-4 font-semibold text-foreground">{r.program}</td>
                <td className="p-4 tabular-nums">{r.year}</td>
                {CODES.map((c) => {
                  const v = r.values[c];
                  return (
                    <td key={c} className="p-4 text-right tabular-nums">
                      {v ? formatNumber(v.total) : "—"}
                      {v?.women != null && <span className="block text-xs text-muted-foreground">{formatNumber(v.women)} mujeres</span>}
                    </td>
                  );
                })}
                <td className="p-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS[r.group].className}`}>{STATUS[r.group].text}</span>
                  {r.updated && <span className="mt-1.5 block text-xs text-muted-foreground">Actualizado el {formatDate(r.updated)}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination pathname="/panel/indicadores" searchParams={sp} page={page.page} pageSize={PAGE_SIZE} total={page.total} itemLabel="filas del historial" label="Paginación del historial" />
    </div>
  );
}
