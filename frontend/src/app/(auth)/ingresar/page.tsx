import { Building2Icon, ShieldCheckIcon, SparklesIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { enterDemo } from "@/app/(auth)/actions";
import { LoginForms } from "@/app/(auth)/ingresar/login-forms";
import { ProductLogo } from "@/components/brand/logo";
import { Shape } from "@/components/brand/shape";
import { isDemoMode } from "@/lib/config";

export const metadata: Metadata = { title: "Ingresar" };

const demoRoles = [
  { role: "organizacion", title: "Organización", text: "Registro guiado, mi panel, programas e indicadores.", icon: Building2Icon },
  { role: "admin_goyn", title: "Equipo GOYN", text: "Bandeja de validación, organizaciones, exportación y auditoría.", icon: ShieldCheckIcon },
  { role: "superadmin", title: "Superadministración", text: "Todo lo anterior más catálogos y editor de contenido.", icon: SparklesIcon },
];

export default async function IngresarPage(props: PageProps<"/ingresar">) {
  const sp = await props.searchParams;
  const siguiente = typeof sp.siguiente === "string" ? sp.siguiente : "";

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-goyn-violeta lg:block">
        <Image src="/images/fotos/ilustracion-165.webp" alt="" fill sizes="50vw" className="object-cover opacity-80" priority />
        <div className="absolute inset-0 bg-linear-to-t from-goyn-navy/90 via-goyn-violeta/30 to-transparent" />
        <Shape name="asterisco" size={100} className="top-10 right-10" />
        <div className="absolute inset-x-0 bottom-0 space-y-3 p-12 text-white">
          <p className="font-marker text-3xl text-goyn-magenta">El futuro es joven</p>
          <p className="max-w-md text-2xl font-extrabold">Juntos vemos, conectamos y medimos lo que hacemos por las juventudes de Barranquilla.</p>
        </div>
      </div>

      <div className="flex flex-col px-4 py-8 sm:px-10">
        <ProductLogo />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="text-3xl font-extrabold text-goyn-navy">Ingresa a GOYN Conecta</h1>
          <p className="mt-2 text-muted-foreground">Accede al panel de tu organización o a la consola del equipo GOYN.</p>

          {isDemoMode ? (
            <div className="mt-8 space-y-3">
              <p className="rounded-xl bg-goyn-naranja/15 p-3 text-sm text-goyn-navy">
                <strong>Modo demostración.</strong> Aún no hay base de datos conectada: elige un rol para recorrer las pantallas.
              </p>
              {demoRoles.map((r) => (
                <form key={r.role} action={enterDemo}>
                  <input type="hidden" name="role" value={r.role} />
                  <input type="hidden" name="siguiente" value={siguiente} />
                  <button className="flex w-full items-start gap-4 rounded-2xl border bg-white p-4 text-left transition-colors hover:border-goyn-violeta hover:bg-goyn-lila/40">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-goyn-lila text-goyn-violeta">
                      <r.icon className="size-5" aria-hidden />
                    </span>
                    <span>
                      <span className="block font-heading font-bold text-goyn-navy">Entrar como {r.title}</span>
                      <span className="block text-sm text-muted-foreground">{r.text}</span>
                    </span>
                  </button>
                </form>
              ))}
            </div>
          ) : (
            <LoginForms siguiente={siguiente} />
          )}
        </div>
      </div>
    </div>
  );
}
