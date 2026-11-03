import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProductLogo } from "@/components/brand/logo";
import { getViewer } from "@/lib/auth";
import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = { title: "Cambia tu contraseña", robots: { index: false } };

export default async function CambiarClavePage({ searchParams }: PageProps<"/cambiar-clave">) {
  const viewer = await getViewer();
  if (viewer.role === "visitante" || viewer.demo) redirect("/ingresar?siguiente=/cambiar-clave");
  const raw = (await searchParams).siguiente;
  const next = typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//") && raw !== "/cambiar-clave" ? raw : "/panel";

  return (
    <div className="flex min-h-screen flex-col px-4 py-8 sm:px-10">
      <ProductLogo />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
        <h1 className="text-3xl font-extrabold text-foreground">Crea tu contraseña</h1>
        <p className="mt-2 text-muted-foreground">
          Ingresaste con una contraseña inicial. Por seguridad, elige una propia antes de continuar
          {viewer.email ? <> con <strong className="text-foreground">{viewer.email}</strong></> : null}.
        </p>
        <ChangePasswordForm siguiente={next} />
      </div>
    </div>
  );
}
