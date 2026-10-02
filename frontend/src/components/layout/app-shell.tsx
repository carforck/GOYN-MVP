import { LogOutIcon } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";
import { ProductLogo } from "@/components/brand/logo";
import { AppNav, MobileAppNav, type AppNavItem } from "@/components/layout/app-nav";
import { DemoBanner } from "@/components/layout/demo-banner";
import { LiveProvider } from "@/components/live/live-provider";
import { AccountThemeProvider } from "@/components/theme/theme-provider";
import { getLiveSnapshot } from "@/lib/data";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import type { Viewer } from "@/lib/auth";

// Armazón de las áreas con sesión: /panel (organización) y /admin (equipo GOYN).
export async function AppShell({
  area,
  viewer,
  nav,
  focusSlug,
  children,
}: {
  area: "panel" | "admin";
  viewer: Viewer;
  nav: AppNavItem[];
  focusSlug?: string;
  children: React.ReactNode;
}) {
  const areaLabel = area === "admin" ? "Consola GOYN" : "Panel de organización";
  const snapshot = await getLiveSnapshot();
  return (
    <AccountThemeProvider>
    <LiveProvider snapshot={snapshot} focusSlug={focusSlug}>
    <div className="flex min-h-screen flex-col">
      <DemoBanner session={viewer.demo && viewer.role !== "visitante"} />
      <div className="flex flex-1 bg-sidebar">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
          <div className="border-b border-sidebar-border p-5">
            <ProductLogo inverted />
            <p className="mt-3 text-xs font-bold tracking-widest text-goyn-magenta uppercase">{areaLabel}</p>
          </div>
          <AppNav items={nav} />
          <div className="mt-auto border-t border-sidebar-border p-4 text-sm">
            <p className="truncate font-semibold">{viewer.name ?? viewer.email}</p>
            <p className="truncate text-xs text-sidebar-foreground/60">{viewer.email}</p>
            <form action={signOut} className="mt-3">
              {/* type="submit" explícito: el Button de Base UI es type="button" por defecto y no enviaría el formulario. */}
              <Button type="submit" variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-white">
                <LogOutIcon aria-hidden /> Cerrar sesión
              </Button>
            </form>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-muted">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b bg-card px-4 lg:hidden">
            <ProductLogo />
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <MobileAppNav items={nav} areaLabel={areaLabel} userName={viewer.name ?? viewer.email} userEmail={viewer.email} />
            </div>
          </header>
          <div className="hidden h-14 items-center justify-end gap-4 border-b bg-card px-8 text-sm lg:flex">
            <span className="mr-auto inline-flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
              <span className="goyn-live-dot" aria-hidden /> Datos en vivo
            </span>
            <Link href="/" className="font-semibold text-goyn-violeta hover:underline">Ver sitio público</Link>
            <ThemeToggle />
          </div>
          <main id="contenido" className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
    </LiveProvider>
    </AccountThemeProvider>
  );
}
