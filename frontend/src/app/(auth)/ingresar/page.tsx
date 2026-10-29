import { Building2Icon, ShieldCheckIcon, SparklesIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { enterDemo } from "@/app/(auth)/actions";
import { getCuentasPrueba } from "@/app/(auth)/cuentas-prueba";
import { LoginForms } from "@/app/(auth)/ingresar/login-forms";
import { TestAccounts } from "@/components/auth/test-accounts";
import { ProductLogo } from "@/components/brand/logo";
import { Shape } from "@/components/brand/shape";
import { allowsDemoRoles, isDemoMode, isSupabaseConfigured } from "@/lib/config";

export const metadata: Metadata = { title: "Ingresar" };

const demoRoles = [
  { role: "organizacion", title: "Organización", text: "Registro guiado, mi panel, programas e indicadores.", icon: Building2Icon },
  { role: "admin_goyn", title: "Equipo GOYN", text: "Bandeja de validación, organizaciones, exportación y auditoría.", icon: ShieldCheckIcon },
  { role: "superadmin", title: "Superadministración", text: "Todo lo anterior más catálogos y editor de contenido.", icon: SparklesIcon },
];

export default async function IngresarPage(props: PageProps<"/ingresar">) {
  const sp = await props.searchParams;
  const siguiente = typeof sp.siguiente === "string" ? sp.siguiente : "";
  const cuentas = getCuentasPrueba();

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
          <h1 className="text-3xl font-extrabold text-foreground">Ingresa a Mapa de Actores y Resultados</h1>
          <p className="mt-2 text-muted-foreground">Accede al panel de tu organización o a la consola del equipo GOYN.</p>

          {isSupabaseConfigured && <TestAccounts cuentas={cuentas} siguiente={siguiente} />}

          {isSupabaseConfigured && (
            <div className={cuentas.length > 0 ? "mt-8 border-t pt-6" : undefined}>
              {cuentas.length > 0 && <p className="text-sm font-semibold text-foreground">O ingresa con tu correo o usuario</p>}
              <LoginForms siguiente={siguiente} />
            </div>
          )}

          {allowsDemoRoles && (
            <section aria-labelledby="recorrido-titulo" className={isSupabaseConfigured ? "mt-10 border-t pt-6" : "mt-8"}>
              <h2 id="recorrido-titulo" className="text-sm font-semibold text-foreground">
                Recorrido sin cuenta (solo lectura)
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {isDemoMode
                  ? "Aún no hay base de datos conectada: elige un rol para recorrer las pantallas."
                  : "Mira las pantallas por rol con datos de ejemplo, sin iniciar sesión. Nada de lo que hagas en el recorrido se guarda."}
              </p>
              <div className="mt-3 space-y-2">
                {demoRoles.map((r) => (
                  <form key={r.role} action={enterDemo}>
                    <input type="hidden" name="role" value={r.role} />
                    <input type="hidden" name="siguiente" value={siguiente} />
                    <button className="flex w-full items-center gap-3 rounded-xl border border-dashed px-3 py-2 text-left text-sm transition-colors hover:border-goyn-violeta hover:bg-goyn-lila/30">
                      <r.icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                      <span>
                        <span className="font-semibold text-foreground">Recorrido sin cuenta: {r.title}</span>
                        <span className="block text-xs text-muted-foreground">{r.text}</span>
                      </span>
                    </button>
                  </form>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
