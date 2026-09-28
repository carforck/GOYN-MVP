import { ArrowLeftIcon, SparklesIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Shape } from "@/components/brand/shape";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Pantalla de módulo previsto pero fuera del MVP: se muestra la intención y la fase,
// sin simular funcionalidad (flujo de usuario: "borde punteado = fase posterior").
export function ComingSoon({
  title,
  phase,
  description,
  features,
  image,
}: {
  title: string;
  phase: string;
  description: string;
  features: string[];
  image: string;
}) {
  return (
    <section className="goyn-container py-12 sm:py-16">
      <div className="relative grid overflow-hidden rounded-3xl border-2 border-dashed border-goyn-violeta/30 bg-goyn-lila/40 lg:grid-cols-2">
        <Shape name="asterisco" size={90} className="top-6 right-6 hidden opacity-80 lg:block" />
        <div className="relative space-y-6 p-8 sm:p-12">
          <span className="goyn-eyebrow bg-goyn-magenta">
            <SparklesIcon className="size-3.5" aria-hidden /> Próximamente · {phase}
          </span>
          <h1 className="text-3xl font-extrabold text-foreground sm:text-5xl">{title}</h1>
          <p className="max-w-xl text-lg text-foreground/80">{description}</p>
          <ul className="space-y-2.5">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-3 text-foreground">
                <span aria-hidden className="mt-2 size-2 shrink-0 rounded-full bg-goyn-magenta" />
                {f}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "h-11 rounded-full px-5 font-semibold")}>
              <ArrowLeftIcon aria-hidden /> Volver al inicio
            </Link>
            <Link href="/actores" className={cn(buttonVariants(), "h-11 rounded-full px-5 font-bold")}>
              Explorar actores del ecosistema
            </Link>
          </div>
        </div>
        <div className="relative min-h-72 lg:min-h-full">
          <Image src={image} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover grayscale-[35%]" />
          <div className="absolute inset-0 bg-linear-to-t from-goyn-violeta/60 via-goyn-violeta/10 to-transparent lg:bg-linear-to-r" />
        </div>
      </div>
    </section>
  );
}
