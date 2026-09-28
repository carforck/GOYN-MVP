import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="goyn-container py-24 text-center">
      <h1 className="text-3xl font-extrabold text-foreground">No encontramos esta organización</h1>
      <p className="mt-3 text-muted-foreground">Puede que aún no esté publicada o que el enlace haya cambiado.</p>
      <Link href="/actores" className={cn(buttonVariants(), "mt-6 h-11 rounded-full px-5 font-bold")}>Ver el directorio</Link>
    </div>
  );
}
