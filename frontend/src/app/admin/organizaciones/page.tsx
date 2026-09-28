import { DownloadIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ecosystem/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { shortTerritory } from "@/lib/catalogs";
import { listOrganizations } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Organizaciones" };

export default async function OrganizacionesAdminPage(props: PageProps<"/admin/organizaciones">) {
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const orgs = await listOrganizations(q ? { q } : {});

  return (
    <div className="space-y-6">
      <PageHeader title="Organizaciones" description={`${orgs.length} organizaciones publicadas. Las ediciones se hacen mediante solicitudes para conservar versiones y auditoría.`}>
        <a href="/admin/exportar/descargar?dataset=organizaciones&format=xlsx" className={cn(buttonVariants({ variant: "outline" }), "h-10 rounded-full bg-white")}>
          <DownloadIcon aria-hidden /> Exportar XLSX
        </a>
      </PageHeader>
      <form className="max-w-md">
        <Input name="q" defaultValue={q} placeholder="Buscar por nombre…" className="h-11 rounded-full bg-white" aria-label="Buscar organización" />
      </form>
      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-muted text-left text-xs font-bold text-muted-foreground uppercase">
            <tr>
              <th className="p-4">Organización</th>
              <th className="p-4">Rol principal</th>
              <th className="p-4">Sede</th>
              <th className="p-4 text-right">Programas</th>
              <th className="p-4 text-right">Conexiones</th>
              <th className="p-4">Actualizado</th>
              <th className="p-4">Origen</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orgs.map((o) => (
              <tr key={o.id} className="hover:bg-muted/50">
                <td className="p-4">
                  <Link href={`/actores/${o.slug}`} className="font-semibold text-goyn-navy hover:underline">{o.name}</Link>
                  <p className="text-xs text-muted-foreground">{o.org_type_label}</p>
                </td>
                <td className="p-4">{o.primary_role_label}</td>
                <td className="p-4">{o.location_territory_code ? shortTerritory(o.location_territory_code) : "—"}</td>
                <td className="p-4 text-right tabular-nums">{o.programs_count}</td>
                <td className="p-4 text-right tabular-nums">{o.connections_count}</td>
                <td className="p-4">{formatDate(o.updated_at)}</td>
                <td className="p-4">
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", o.is_demo ? "bg-goyn-naranja/15 text-[#a3450b]" : "bg-goyn-lila text-goyn-violeta")}>
                    {o.is_demo ? "Sintético" : "Real"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
