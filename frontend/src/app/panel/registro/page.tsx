import { ClipboardCheckIcon, ShieldAlertIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { loadDraft } from "@/app/panel/registro/actions";
import { RegistrationWizard } from "@/app/panel/registro/registration-wizard";
import { buttonVariants } from "@/components/ui/button";
import { getViewer, isAdminRole } from "@/lib/auth";
import { listOrganizations } from "@/lib/data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Registro de organización" };

function Notice({ icon, title, children, href, cta }: { icon: React.ReactNode; title: string; children: React.ReactNode; href: string; cta: string }) {
  return (
    <div className="mx-auto max-w-2xl rounded-3xl border bg-card p-8 text-center sm:p-12">
      {icon}
      <h1 className="mt-4 text-2xl font-extrabold text-foreground">{title}</h1>
      <p className="mt-2 text-muted-foreground">{children}</p>
      <Link href={href} className={cn(buttonVariants(), "mt-6 h-11 rounded-full px-6 font-bold")}>{cta}</Link>
    </div>
  );
}

export default async function RegistroPanelPage() {
  const viewer = await getViewer();
  const [draft, orgs] = await Promise.all([loadDraft(), listOrganizations()]);

  // El equipo GOYN no registra organizaciones desde aquí: solo ve su propio borrador si lo tuviera.
  if (!draft && !viewer.demo && isAdminRole(viewer.role)) {
    return (
      <Notice icon={<ShieldAlertIcon className="mx-auto size-12 text-goyn-violeta" aria-hidden />} title="Estás con una cuenta del equipo GOYN"
        href="/admin/solicitudes" cta="Ir a la bandeja de solicitudes">
        Este formulario es para que cada organización registre sus datos. Las solicitudes enviadas por las organizaciones se revisan y aprueban desde la consola de administración.
      </Notice>
    );
  }

  // Organización ya publicada y sin solicitud activa: el asistente crearía una organización NUEVA
  // (aún no carga los datos publicados para editarlos), así que se evita un duplicado.
  if (!draft && !viewer.demo && viewer.organizationIds.length > 0) {
    return (
      <Notice icon={<ClipboardCheckIcon className="mx-auto size-12 text-goyn-violeta" aria-hidden />} title="Tu organización ya está registrada"
        href="/panel/programas" cta="Gestionar mis programas">
        Tu organización ya fue validada y está publicada. Puedes agregar o editar tus programas y reportar indicadores desde el panel. Para cambiar otros datos del perfil, escribe al equipo GOYN Barranquilla.
      </Notice>
    );
  }

  return (
    <RegistrationWizard
      demo={viewer.demo}
      initial={draft}
      organizations={orgs.map((o) => ({ id: o.id, name: o.name }))}
    />
  );
}
