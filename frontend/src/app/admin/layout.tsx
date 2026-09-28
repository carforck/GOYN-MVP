import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import type { AppNavItem } from "@/components/layout/app-nav";
import { getViewer, isAdminRole } from "@/lib/auth";
import { listChangeRequests } from "@/lib/data";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const viewer = await getViewer();
  if (!isAdminRole(viewer.role)) redirect("/ingresar?siguiente=/admin");
  const pending = (await listChangeRequests()).filter((r) => r.status === "enviada").length;

  const nav: AppNavItem[] = [
    { href: "/admin", label: "Tablero", icon: "dashboard" },
    { href: "/admin/solicitudes", label: "Bandeja de validación", icon: "bandeja", badge: pending || undefined },
    { href: "/admin/organizaciones", label: "Organizaciones", icon: "organizaciones" },
    { href: "/admin/exportar", label: "Exportar datos", icon: "exportar" },
    { href: "/admin/auditoria", label: "Auditoría", icon: "auditoria" },
    ...(viewer.role === "superadmin"
      ? ([
          { href: "/admin/catalogos", label: "Catálogos", icon: "catalogos" },
          { href: "/admin/contenido", label: "Editor de contenido", icon: "contenido", soon: true },
        ] as AppNavItem[])
      : []),
  ];

  return (
    <AppShell area="admin" viewer={viewer} nav={nav}>
      {children}
    </AppShell>
  );
}
