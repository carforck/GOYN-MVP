import Link from "next/link";
import { ProductLogo } from "@/components/brand/logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NavLink } from "@/components/layout/nav-link";
import { SoonMenu } from "@/components/layout/soon-menu";
import { buttonVariants } from "@/components/ui/button";
import { getViewer, isAdminRole } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const publicNav = [
  { href: "/mapa", label: "Mapa" },
  { href: "/actores", label: "Actores" },
  { href: "/impacto", label: "Impacto" },
  { href: "/oportunidades", label: "Oportunidades", soon: true, phase: "MVP opcional" },
  { href: "/conexiones", label: "Conexiones", soon: true, phase: "Fase 2" },
  { href: "/historias", label: "Historias", soon: true, phase: "Fase 2" },
];

export async function SiteHeader() {
  const viewer = await getViewer();
  const account =
    viewer.role === "visitante"
      ? { href: "/ingresar", label: "Ingresar" }
      : isAdminRole(viewer.role)
        ? { href: "/admin", label: "Consola GOYN" }
        : { href: "/panel", label: "Mi panel" };

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-white/90 backdrop-blur supports-backdrop-filter:bg-white/75">
      <div className="goyn-container flex h-16 items-center justify-between gap-4">
        <ProductLogo />
        <nav aria-label="Principal" className="hidden items-center gap-0.5 lg:flex">
          {publicNav.filter((item) => !item.soon).map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.label}
            </NavLink>
          ))}
          <SoonMenu items={publicNav.filter((item) => item.soon).map(({ href, label, phase }) => ({ href, label, phase: phase ?? "" }))} />
        </nav>
        <div className="flex items-center gap-2">
          <Link href={account.href} className={cn(buttonVariants({ variant: "ghost" }), "hidden h-10 px-4 font-semibold sm:inline-flex")}>
            {account.label}
          </Link>
          <Link
            href="/registro"
            className={cn(buttonVariants(), "hidden h-10 rounded-full bg-goyn-magenta px-5 font-bold text-white hover:bg-goyn-magenta/90 md:inline-flex")}
          >
            Registra tu organización
          </Link>
          <MobileNav items={publicNav} account={account} />
        </div>
      </div>
    </header>
  );
}
