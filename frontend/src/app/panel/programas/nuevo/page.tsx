import type { Metadata } from "next";
import { ProgramForm } from "@/app/panel/programas/program-form";
import { PageHeader } from "@/components/ecosystem/page-header";

export const metadata: Metadata = { title: "Nuevo programa" };

export default function NuevoProgramaPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Nuevo programa" description="Agrega un programa sin volver a llenar el registro. El equipo GOYN lo revisa antes de publicarlo en tu perfil." />
      <ProgramForm
        programId={null}
        initial={{ name: "", description: "", modality_code: "", primary_area_code: "", area_codes: [], population_codes: [], territory_codes: [], start_date: "", end_date: "", annual_goal: "", link: "" }}
      />
    </div>
  );
}
