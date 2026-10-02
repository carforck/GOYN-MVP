import type { Metadata } from "next";
import { loadDraft } from "@/app/panel/registro/actions";
import { RegistrationWizard } from "@/app/panel/registro/registration-wizard";
import { isDemoSession } from "@/lib/auth";
import { listOrganizations } from "@/lib/data";

export const metadata: Metadata = { title: "Registro de organización" };

export default async function RegistroPanelPage() {
  const [draft, orgs] = await Promise.all([loadDraft(), listOrganizations()]);
  return (
    <RegistrationWizard
      demo={await isDemoSession()}
      initial={draft}
      organizations={orgs.map((o) => ({ id: o.id, name: o.name }))}
    />
  );
}
