import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ecosystem/page-header";
import { getViewer } from "@/lib/auth";
import { catalogs } from "@/lib/catalogs";

export const metadata: Metadata = { title: "Catálogos" };

const families = [
  { key: "orgTypes", title: "Tipos de organización", source: "Instrumento P10" },
  { key: "roles", title: "Roles en el ecosistema", source: "Instrumento P11–P12 + PRD §7.2" },
  { key: "scopes", title: "Alcance territorial", source: "Propuesta de uso de datos" },
  { key: "territories", title: "Territorios", source: "Instrumento P13" },
  { key: "impactAreas", title: "Áreas de impacto", source: "Instrumento P14" },
  { key: "problems", title: "Problemáticas", source: "Instrumento P15–P21" },
  { key: "populations", title: "Poblaciones objetivo", source: "Instrumento · bloque de proyecto" },
  { key: "relationTypes", title: "Tipos de conexión", source: "Instrumento P22–P27" },
  { key: "indicators", title: "Indicadores", source: "PRD §7.3" },
] as const;

export default async function CatalogosPage() {
  const viewer = await getViewer();
  if (viewer.role !== "superadmin") redirect("/admin");
  return (
    <div className="space-y-6">
      <PageHeader
        title="Catálogos del marco común"
        description="Códigos estables compartidos por el formulario, los filtros, la base de datos y los indicadores. Un valor usado no se borra: se desactiva."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {families.map((f) => {
          const items = catalogs[f.key] as { code: string; label: string }[];
          return (
            <section key={f.key} className="rounded-2xl border bg-white p-5">
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <h2 className="font-heading text-lg font-bold text-goyn-navy">{f.title}</h2>
                <span className="text-xs text-muted-foreground">{items.length} · {f.source}</span>
              </div>
              <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
                {items.map((i) => (
                  <li key={i.code} className="flex justify-between gap-3 border-b border-dashed py-1.5 last:border-0">
                    <span className="text-goyn-navy">{i.label}</span>
                    <code className="shrink-0 text-xs text-muted-foreground">{i.code}</code>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
