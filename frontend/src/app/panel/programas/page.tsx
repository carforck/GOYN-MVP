import { ClockIcon, EyeOffIcon, PencilIcon, PlusIcon, StarIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { FeaturedButton } from "@/app/panel/programas/featured-button";
import { VisibilityButton } from "@/app/panel/programas/visibility-button";
import { PageHeader } from "@/components/ecosystem/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Pagination, paginate } from "@/components/ui/pagination";
import { label, shortTerritory } from "@/lib/catalogs";
import { getViewer } from "@/lib/auth";
import { getOwnFeaturedSelection, getOwnOrganization, listOwnPrograms, listPendingNewPrograms } from "@/lib/data";
import { formatDate, formatNumber } from "@/lib/format";
import { MAX_FEATURED_PROGRAMS, type FeaturedSelection } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Programas" };

// Cada programa se edita u oculta por separado; agregar uno no exige volver al formulario completo.
const PAGE_SIZE = 15;

export default async function ProgramasPage(props: PageProps<"/panel/programas">) {
  const sp = await props.searchParams;
  const viewer = await getViewer();
  const org = await getOwnOrganization(viewer.organizationIds);
  const [programs, pendingNew, featured] = org
    ? await Promise.all([listOwnPrograms(org.id), listPendingNewPrograms(org.id), getOwnFeaturedSelection(org.id)])
    : [[], [], { ids: [], chosen: false, supported: false } satisfies FeaturedSelection];
  const featuredIds = new Set(featured.ids);
  const chosenCount = featured.chosen ? featured.ids.length : 0;
  const visibles = programs.filter((p) => p.is_visible).length;
  const page = paginate(programs, sp, PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Programas y proyectos"
        description={`Los proyectos que tu organización ejecuta directamente con jóvenes. Tú decides cuáles se ven en tu perfil (${visibles} de ${programs.length} visibles). Los cambios se validan antes de publicarse.`}
      >
        <Link href="/panel/programas/nuevo" className={cn(buttonVariants(), "h-10 rounded-full px-5 font-bold")}>
          <PlusIcon aria-hidden /> Nuevo programa
        </Link>
      </PageHeader>

      {programs.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-goyn-violeta/30 bg-goyn-lila/40 p-4 text-sm">
          <StarIcon className="mt-0.5 size-4 shrink-0 fill-goyn-naranja text-goyn-naranja" aria-hidden />
          <div className="space-y-1">
            <p className="font-semibold text-foreground">
              Programas destacados en tu perfil: {featured.chosen ? `${chosenCount} de ${MAX_FEATURED_PROGRAMS} elegidos` : "aún no eliges"}
            </p>
            <p className="text-muted-foreground">
              Marca con la estrella hasta {MAX_FEATURED_PROGRAMS} programas para mostrarlos en tu perfil público.
              {!featured.chosen && ` Mientras no elijas, mostramos por defecto los ${MAX_FEATURED_PROGRAMS} con más jóvenes conectados.`}{" "}
              Los demás programas no se muestran en el perfil, pero <strong className="text-foreground">sus resultados siguen sumando en las cifras del ecosistema</strong>.
            </p>
          </div>
        </div>
      )}

      {pendingNew.length > 0 && (
        <ul className="space-y-2">
          {pendingNew.map((p) => (
            <li key={p.id} className="flex items-center gap-2 rounded-2xl border border-goyn-naranja/40 bg-goyn-naranja/10 p-3 text-sm">
              <ClockIcon className="size-4 text-goyn-naranja" aria-hidden />
              <span><strong>{p.name}</strong> · programa nuevo en revisión del equipo GOYN</span>
            </li>
          ))}
        </ul>
      )}

      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-muted text-left text-xs font-bold text-muted-foreground uppercase">
            <tr>
              <th className="p-4">Programa</th>
              <th className="p-4">Área principal</th>
              <th className="p-4">Territorio</th>
              <th className="p-4">Modalidad</th>
              <th className="p-4">Vigencia</th>
              <th className="p-4 text-right">Meta 2026</th>
              <th className="relative p-4 text-right"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {page.items.map((p) => (
              <tr key={p.id} className={cn(!p.is_visible && "bg-muted/40")}>
                <td className="p-4">
                  <p className={cn("font-semibold text-foreground", !p.is_visible && "text-muted-foreground")}>{p.name}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {!p.is_visible && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        <EyeOffIcon className="size-3" aria-hidden /> Oculto en tu perfil
                      </span>
                    )}
                    {featuredIds.has(p.id) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-goyn-lila px-2 py-0.5 text-[11px] font-semibold text-goyn-violeta">
                        <StarIcon className="size-3 fill-goyn-naranja text-goyn-naranja" aria-hidden /> {featured.chosen ? "Visible en mi perfil" : "Visible en mi perfil (por defecto)"}
                      </span>
                    )}
                    {p.pending && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-goyn-naranja/15 px-2 py-0.5 text-[11px] font-semibold text-foreground">
                        <ClockIcon className="size-3 text-goyn-naranja" aria-hidden /> Cambio en revisión
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4">{label("impactAreas", p.primary_area_code)}</td>
                <td className="p-4">{p.territory_codes.map(shortTerritory).join(", ")}</td>
                <td className="p-4">{label("modalities", p.modality_code)}</td>
                <td className="p-4">{formatDate(p.start_date)} – {p.end_date ? formatDate(p.end_date) : "sin cierre"}</td>
                <td className="p-4 text-right tabular-nums">{p.annual_goal ? formatNumber(p.annual_goal) : "—"}</td>
                <td className="p-4">
                  <div className="flex justify-end gap-1">
                    {p.pending ? (
                      <span className="inline-flex h-8 items-center px-2.5 text-xs text-muted-foreground">En revisión</span>
                    ) : (
                      <Link href={`/panel/programas/${p.id}`} aria-label={`Editar ${p.name}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 rounded-full px-3 font-semibold")}>
                        <PencilIcon aria-hidden /> Editar
                      </Link>
                    )}
                    <FeaturedButton
                      id={p.id}
                      name={p.name}
                      featured={featured.chosen && featuredIds.has(p.id)}
                      byDefault={!featured.chosen && featuredIds.has(p.id)}
                      chosenCount={chosenCount}
                      visible={p.is_visible}
                    />
                    <VisibilityButton id={p.id} visible={p.is_visible} name={p.name} />
                  </div>
                </td>
              </tr>
            ))}
            {programs.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  Aún no hay programas publicados. <Link href="/panel/programas/nuevo" className="font-semibold text-goyn-violeta hover:underline">Agrega el primero</Link>.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination pathname="/panel/programas" searchParams={sp} page={page.page} pageSize={PAGE_SIZE} total={page.total} itemLabel="programas" />
    </div>
  );
}
