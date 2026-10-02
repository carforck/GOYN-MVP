"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ProductLogo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Pantalla de error con la marca (en lugar de la pantalla blanca del navegador).
export function ErrorView({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="grid min-h-[70vh] place-items-center p-6 text-center">
      <div className="max-w-md space-y-4">
        <ProductLogo className="justify-center" />
        <h1 className="text-2xl font-extrabold text-foreground">Algo no cargó como esperábamos</h1>
        <p className="text-muted-foreground">Puede ser un problema momentáneo de conexión. Intenta de nuevo; si sigue pasando, vuelve al inicio.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => retry()} className={cn(buttonVariants(), "h-11 rounded-full px-6 font-bold")}>
            Intentar de nuevo
          </button>
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "h-11 rounded-full px-6 font-bold")}>
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
