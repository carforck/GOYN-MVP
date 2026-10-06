import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProgramForm } from "@/app/panel/programas/program-form";
import { PageHeader } from "@/components/ecosystem/page-header";
import { getViewer } from "@/lib/auth";
import { getOwnOrganization, listOwnPrograms } from "@/lib/data";

export const metadata: Metadata = { title: "Editar programa" };

export default async function EditarProgramaPage(props: PageProps<"/panel/programas/[id]">) {
  const { id } = await props.params;
  const viewer = await getViewer();
  const org = await getOwnOrganization(viewer.organizationIds);
  const program = org ? (await listOwnPrograms(org.id)).find((p) => p.id === id) : undefined;
  if (!program) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title={`Editar «${program.name}»`} description="Cambia solo este programa. Lo demás de tu perfil queda igual; el equipo GOYN valida el cambio antes de publicarlo." />
      {program.pending ? (
        <p className="rounded-2xl border border-goyn-naranja bg-goyn-naranja/10 p-4 text-sm text-foreground">
          Este programa ya tiene un cambio en revisión. Podrás editarlo de nuevo cuando el equipo GOYN lo decida.
        </p>
      ) : (
        <ProgramForm
          programId={program.id}
          initial={{
            name: program.name,
            description: program.description,
            modality_code: program.modality_code,
            primary_area_code: program.primary_area_code,
            area_codes: program.area_codes.filter((a) => a !== program.primary_area_code),
            population_codes: program.population_codes,
            territory_codes: program.territory_codes,
            start_date: program.start_date,
            end_date: program.end_date ?? "",
            annual_goal: program.annual_goal != null ? String(program.annual_goal) : "",
            link: program.link ?? "",
          }}
        />
      )}
    </div>
  );
}
