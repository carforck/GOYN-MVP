import { DemoBanner } from "@/components/layout/demo-banner";
import { LiveProvider } from "@/components/live/live-provider";
import { PublicThemeProvider } from "@/components/theme/theme-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getLiveSnapshot } from "@/lib/data";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const snapshot = await getLiveSnapshot();
  return (
    <PublicThemeProvider>
    <LiveProvider snapshot={snapshot}>
      <a href="#contenido" className="sr-only z-50 rounded-md bg-card p-3 focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Saltar al contenido
      </a>
      <DemoBanner />
      <SiteHeader />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </LiveProvider>
    </PublicThemeProvider>
  );
}
