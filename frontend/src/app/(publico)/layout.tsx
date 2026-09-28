import { DemoBanner } from "@/components/layout/demo-banner";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a href="#contenido" className="sr-only z-50 rounded-md bg-white p-3 focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Saltar al contenido
      </a>
      <DemoBanner />
      <SiteHeader />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
