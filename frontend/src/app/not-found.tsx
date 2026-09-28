import Link from "next/link";
import { ProductLogo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center p-6 text-center">
      <div className="space-y-4">
        <ProductLogo className="justify-center" />
        <h1 className="text-3xl font-extrabold text-foreground">Esta página no existe</h1>
        <p className="text-muted-foreground">Vuelve al inicio para explorar el ecosistema juvenil de Barranquilla.</p>
        <Link href="/" className={cn(buttonVariants(), "h-11 rounded-full px-6 font-bold")}>Ir al inicio</Link>
      </div>
    </main>
  );
}
