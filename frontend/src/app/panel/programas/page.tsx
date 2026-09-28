import { PencilIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ecosystem/page-header";
import { buttonVariants } from "@/components/ui/button";
import { label, shortTerritory } from "@/lib/catalogs";
import { getViewer } from "@/lib/auth";
import { getOwnOrganization, listPrograms } from "@/lib/data";
import { formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Programas" };

export default async function ProgramasPage() {
  const viewer = await getViewer();
  const org = await getOwnOrganization(viewer.organizationIds);
  const programs = org ? await listPrograms(org.id) : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Programas y proyectos" description="Los proyectos que tu organización ejecuta directamente con jóvenes. Los cambios se validan antes de publicarse.">
        <Link href="/panel/registro" className={cn(buttonVariants(), "h-10 rounded-full px-5 font-bold")}>
          <PencilIcon aria-hidden /> Proponer cambios
        </Link>
      </PageHeader>
      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted text-left text-xs font-bold text-muted-foreground uppercase">
            <tr>
              <th className="p-4">Programa</th>
              <th className="p-4">Área principal</th>
              <th className="p-4">Territorio</th>
              <th className="p-4">Modalidad</th>
              <th className="p-4">Vigencia</th>
              <th className="p-4 text-right">Meta 2026</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {programs.map((p) => (
              <tr key={p.id}>
                <td className="p-4 font-semibold text-foreground">{p.name}</td>
                <td className="p-4">{label("impactAreas", p.primary_area_code)}</td>
                <td className="p-4">{p.territory_codes.map(shortTerritory).join(", ")}</td>
                <td className="p-4">{label("modalities", p.modality_code)}</td>
                <td className="p-4">{formatDate(p.start_date)} – {p.end_date ? formatDate(p.end_date) : "sin cierre"}</td>
                <td className="p-4 text-right tabular-nums">{p.annual_goal ? formatNumber(p.annual_goal) : "—"}</td>
              </tr>
            ))}
            {programs.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Aún no hay programas publicados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
