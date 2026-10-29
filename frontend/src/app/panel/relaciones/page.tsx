import { PencilIcon, SparklesIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ecosystem/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Pagination, paginate } from "@/components/ui/pagination";
import { catalogs } from "@/lib/catalogs";
import { getViewer } from "@/lib/auth";
import { getOwnOrganization, listRelations } from "@/lib/data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Relaciones" };

const PAGE_SIZE = 10;
const TITLES: Record<string, string> = { socio: "Socios", aliado: "Aliados", colaborador: "Colaboradores" };

// Cada columna (socios, aliados, colaboradores) se pagina por separado con su propio parámetro.
export default async function RelacionesPage(props: PageProps<"/panel/relaciones">) {
  const sp = await props.searchParams;
  const viewer = await getViewer();
  const org = await getOwnOrganization(viewer.organizationIds);
  const relations = org ? await listRelations(org.id) : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Relaciones con otros actores" description="Socios, aliados y colaboradores registrados. Solo se publican conexiones existentes; las potenciales se registran aparte.">
        <Link href="/panel/registro" className={cn(buttonVariants(), "h-10 rounded-full px-5 font-bold")}>
          <PencilIcon aria-hidden /> Proponer cambios
        </Link>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-3">
        {catalogs.relationTypes.map((type) => {
          const all = relations.filter((r) => r.relation_type_code === type.code);
          const param = `pagina_${type.code}`;
          const page = paginate(all, sp, PAGE_SIZE, param);
          return (
            <section key={type.code} className="rounded-2xl border bg-card p-5">
              <h2 className="font-heading text-lg font-bold text-foreground">{TITLES[type.code]} <span className="text-muted-foreground">· {all.length}</span></h2>
              <p className="mb-3 text-xs text-muted-foreground">{type.description}</p>
              <ul className="space-y-2">
                {page.items.map((r) => {
                  const other = r.source_org_id === org?.id ? { slug: r.target_slug, name: r.target_name } : { slug: r.source_slug, name: r.source_name };
                  return (
                    <li key={r.id}>
                      <Link href={`/actores/${other.slug}`} className="text-sm font-semibold text-foreground hover:text-goyn-violeta hover:underline">{other.name}</Link>
                    </li>
                  );
                })}
                {all.length === 0 && <li className="text-sm text-muted-foreground">Sin registros.</li>}
              </ul>
              {page.pageCount > 1 && (
                <Pagination
                  className="mt-4 flex-col items-start"
                  pathname="/panel/relaciones"
                  searchParams={sp}
                  param={param}
                  page={page.page}
                  pageSize={PAGE_SIZE}
                  total={page.total}
                  itemLabel={TITLES[type.code]?.toLowerCase()}
                  label={`Paginación de ${TITLES[type.code]?.toLowerCase()}`}
                />
              )}
            </section>
          );
        })}
      </div>
      <p className="flex items-center gap-2 rounded-2xl border border-dashed bg-card p-4 text-sm text-muted-foreground">
        <SparklesIcon className="size-4 text-goyn-magenta" aria-hidden /> Sugerencias de aliados por complementariedad y grafo de red: Fase 2 · 2027.
      </p>
    </div>
  );
}
