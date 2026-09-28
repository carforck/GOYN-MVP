import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Marca del producto: símbolo (asterisco de las texturas GOYN sobre violeta) + nombre de trabajo.
// El logo institucional completo de GOYN Barranquilla se usa como respaldo en el pie de página.
export function ProductLogo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)} aria-label="GOYN Conecta BAQ, inicio">
      <Image src="/icon.webp" alt="" width={36} height={36} className="size-9 transition-transform group-hover:rotate-45" priority />
      <span className={cn("font-heading text-[15px] leading-none font-extrabold tracking-tight whitespace-nowrap", inverted ? "text-white" : "text-goyn-navy")}>
        GOYN <span className={inverted ? "text-goyn-magenta" : "text-goyn-violeta"}>Conecta</span> BAQ
      </span>
    </Link>
  );
}

type Variant = "magenta" | "violeta" | "navy" | "blanco" | "negro";
const files: Record<Variant, string> = {
  magenta: "/images/marca/goyn-principal-magenta.webp",
  violeta: "/images/marca/goyn-principal-violeta.webp",
  navy: "/images/marca/goyn-principal-navy.webp",
  blanco: "/images/marca/goyn-blanco.webp",
  negro: "/images/marca/goyn-negro.webp",
};

export function GoynLogo({ variant = "magenta", className }: { variant?: Variant; className?: string }) {
  return (
    <Image
      src={files[variant]}
      alt="Global Opportunity Youth Network: Barranquilla — El futuro es joven — Aspen Institute"
      width={1200}
      height={311}
      className={cn("h-auto w-56", className)}
    />
  );
}
