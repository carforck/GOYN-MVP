import { LockKeyholeIcon, LogInIcon, UserPlusIcon } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Ruta de ingreso que, tras iniciar sesión, devuelve al visitante a la hoja de vida.
// /ingresar lee `siguiente` y la acción de ingreso solo acepta rutas internas (safeNext).
export const loginToProfileHref = (slug: string) => `/ingresar?siguiente=${encodeURIComponent(`/actores/${slug}`)}`;

// Aviso para visitantes sin sesión: la hoja de vida completa y el contacto son solo para cuentas registradas.
export function ProfileGate({ slug, name }: { slug: string; name: string }) {
  return (
    <section aria-labelledby="hoja-de-vida-bloqueada" className="rounded-3xl border-2 border-dashed border-goyn-violeta/40 bg-goyn-lila/40 p-6 sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-2xl bg-goyn-violeta text-white">
          <LockKeyholeIcon className="size-6" />
        </span>
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 id="hoja-de-vida-bloqueada" className="text-xl font-extrabold text-foreground">
              Inicia sesión o regístrate para ver la hoja de vida completa
            </h2>
            <p className="text-foreground/80">
              La descripción, los programas, los resultados reportados, las conexiones y los datos de contacto de {name} están disponibles solo para
              organizaciones y personas con cuenta en GOYN Conecta BAQ.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={loginToProfileHref(slug)} className={cn(buttonVariants(), "h-11 rounded-full px-5 font-bold")}>
              <LogInIcon aria-hidden /> Iniciar sesión
            </Link>
            <Link href="/registro" className={cn(buttonVariants({ variant: "outline" }), "h-11 rounded-full px-5 font-bold")}>
              <UserPlusIcon aria-hidden /> Registrar mi organización
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
