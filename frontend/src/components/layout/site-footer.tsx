import Link from "next/link";
import { GoynLogo, ProductLogo } from "@/components/brand/logo";
import { Shape } from "@/components/brand/shape";

export function SiteFooter() {
  return (
    <footer className="relative mt-auto overflow-hidden bg-goyn-navy text-white">
      <div aria-hidden className="goyn-stripe h-1.5" />
      <Shape name="aro_rayado" size={220} className="-top-16 -right-16 opacity-30" />
      <div className="goyn-container relative grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <ProductLogo inverted />
          <p className="max-w-sm text-sm text-white/75">
            El espejo digital del ecosistema juvenil de Barranquilla y su área metropolitana: ver, conectar y medir lo que
            hacemos por las juventudes.
          </p>
          <p className="font-marker text-xl text-goyn-magenta">El futuro es joven</p>
        </div>
        <div>
          <h2 className="mb-3 text-xs font-bold tracking-widest text-white/60 uppercase">Explora</h2>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-goyn-magenta" href="/mapa">Mapa del ecosistema</Link></li>
            <li><Link className="hover:text-goyn-magenta" href="/actores">Directorio de actores</Link></li>
            <li><Link className="hover:text-goyn-magenta" href="/impacto">Impacto colectivo</Link></li>
            <li><Link className="hover:text-goyn-magenta" href="/registro">Registra tu organización</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-xs font-bold tracking-widest text-white/60 uppercase">Colaborativo</h2>
          <ul className="space-y-2 text-sm">
            <li><a className="hover:text-goyn-magenta" href="https://goynbarranquilla.com/" target="_blank" rel="noreferrer">goynbarranquilla.com</a></li>
            <li><a className="hover:text-goyn-magenta" href="https://goynbarranquilla.com/colaborativo/" target="_blank" rel="noreferrer">Haz parte del Colaborativo</a></li>
            <li><a className="hover:text-goyn-magenta" href="https://www.fundacioncorona.org/tratamientodedatos" target="_blank" rel="noreferrer">Política de tratamiento de datos</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="goyn-container flex flex-col items-start justify-between gap-4 py-6 sm:flex-row sm:items-center">
          <GoynLogo variant="blanco" className="w-48" />
          <p className="text-xs text-white/60">© 2026 Colaborativo GOYN Barranquilla · GOYN Conecta BAQ · MVP Fase Mapear</p>
        </div>
      </div>
    </footer>
  );
}
