import type { Metadata } from "next";
import { loadDraft } from "@/app/panel/registro/actions";
import { RegistrationWizard } from "@/app/panel/registro/registration-wizard";
import { isDemoMode } from "@/lib/config";
import { listOrganizations } from "@/lib/data";

export const metadata: Metadata = { title: "Registro de organización" };

export default async function RegistroPanelPage() {
  const [draft, orgs] = await Promise.all([loadDraft(), listOrganizations()]);
  return (
    <RegistrationWizard
      demo={isDemoMode}
      initial={draft}
      organizations={orgs.map((o) => ({ id: o.id, name: o.name }))}
    />
  );
}
