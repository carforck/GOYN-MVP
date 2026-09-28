import { LogOutIcon } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";
import { ProductLogo } from "@/components/brand/logo";
import { AppNav, MobileAppNav, type AppNavItem } from "@/components/layout/app-nav";
import { DemoBanner } from "@/components/layout/demo-banner";
import { Button } from "@/components/ui/button";
import type { Viewer } from "@/lib/auth";

// Armazón de las áreas con sesión: /panel (organización) y /admin (equipo GOYN).
export function AppShell({
  area,
  viewer,
  nav,
  children,
}: {
  area: "panel" | "admin";
  viewer: Viewer;
  nav: AppNavItem[];
  children: React.ReactNode;
}) {
  const areaLabel = area === "admin" ? "Consola GOYN" : "Panel de organización";
  return (
    <div className="flex min-h-screen flex-col">
      <DemoBanner />
      <div className="flex flex-1 bg-sidebar">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
          <div className="border-b border-sidebar-border p-5">
            <ProductLogo inverted />
            <p className="mt-3 text-xs font-bold tracking-widest text-sidebar-primary uppercase">{areaLabel}</p>
          </div>
          <AppNav items={nav} />
          <div className="mt-auto border-t border-sidebar-border p-4 text-sm">
            <p className="truncate font-semibold">{viewer.name ?? viewer.email}</p>
            <p className="truncate text-xs text-sidebar-foreground/60">{viewer.email}</p>
            <form action={signOut} className="mt-3">
              <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-white">
                <LogOutIcon aria-hidden /> Cerrar sesión
              </Button>
            </form>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-muted/60">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b bg-white px-4 lg:hidden">
            <ProductLogo />
            <MobileAppNav items={nav} areaLabel={areaLabel} />
          </header>
          <div className="hidden h-14 items-center justify-end gap-4 border-b bg-white px-8 text-sm lg:flex">
            <Link href="/" className="font-semibold text-goyn-violeta hover:underline">Ver sitio público</Link>
          </div>
          <main id="contenido" className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
