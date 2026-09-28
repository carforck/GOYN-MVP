import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import type { AppNavItem } from "@/components/layout/app-nav";
import { getViewer, isAdminRole } from "@/lib/auth";
import { getOwnOrganization } from "@/lib/data";

const nav: AppNavItem[] = [
  { href: "/panel", label: "Resumen", icon: "dashboard" },
  { href: "/panel/registro", label: "Registro / actualización", icon: "registro" },
  { href: "/panel/programas", label: "Programas", icon: "programas" },
  { href: "/panel/indicadores", label: "Indicadores", icon: "indicadores" },
  { href: "/panel/relaciones", label: "Relaciones", icon: "relaciones" },
];

export default async function PanelLayout({ children }: LayoutProps<"/panel">) {
  const viewer = await getViewer();
  if (viewer.role === "visitante") redirect("/ingresar?siguiente=/panel");
  if (isAdminRole(viewer.role) && viewer.demo) redirect("/admin");
  const org = await getOwnOrganization(viewer.organizationIds);
  return (
    <AppShell area="panel" viewer={viewer} nav={nav} focusSlug={org?.slug}>
      {children}
    </AppShell>
  );
}
