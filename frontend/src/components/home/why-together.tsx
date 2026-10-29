import { ExternalLinkIcon } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { buttonVariants } from "@/components/ui/button";
import { porQueReunidos, quienesSomos } from "@/lib/home-content";
import { cn } from "@/lib/utils";

// Ajuste 05: contexto de la juventud en Barranquilla A.M. con las cifras destacadas.
export function WhyTogether() {
  const [unoDeCuatro, desconectados] = porQueReunidos.cifras;
  return (
    <section aria-labelledby="por-que-reunidos" className="goyn-container py-16 sm:py-20">
      <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
        <Reveal className="space-y-5">
          <h2 id="por-que-reunidos" className="text-3xl font-bold text-foreground sm:text-4xl">{porQueReunidos.titulo}</h2>
          <p className="max-w-2xl text-lg leading-relaxed text-foreground/80">
            Aunque Barranquilla A.M. es un territorio joven (<strong className="text-goyn-magenta-a11y">1 de cada 4</strong> habitantes son jóvenes), esta población aún presenta grandes desafíos en el acceso a oportunidades.{" "}
            <strong className="text-goyn-magenta-a11y">36%</strong> de los jóvenes permanecen desconectados de oportunidades de educación o empleo formal, afectando gravemente sus trayectorias de vida.
          </p>
          <a
            href={porQueReunidos.cta.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants(), "h-auto min-h-12 rounded-full bg-goyn-magenta-a11y px-6 py-3 text-left text-base font-bold whitespace-normal text-white hover:bg-goyn-magenta-a11y/90")}
          >
            {porQueReunidos.cta.label} <ExternalLinkIcon aria-hidden />
            <span className="sr-only"> (se abre en una pestaña nueva)</span>
          </a>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {[unoDeCuatro, desconectados].map((c, i) => (
            <Reveal key={c.valor} delay={i * 0.08} className={cn("rounded-3xl p-6 text-white sm:p-8", i === 0 ? "bg-goyn-violeta" : "bg-goyn-magenta-a11y")}>
              <p className="font-heading text-5xl font-bold text-goyn-amarillo sm:text-6xl">{c.valor}</p>
              <p className="mt-2 text-lg font-medium text-white">{c.texto}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// Ajuste 06: quiénes somos y visión compartida.
export function WhoWeAre() {
  return (
    <section aria-labelledby="quienes-somos" className="bg-goyn-lila/40 py-16 sm:py-20">
      <div className="goyn-container space-y-8">
        <Reveal>
          <p className="max-w-3xl font-heading text-2xl leading-snug font-bold text-goyn-violeta sm:text-3xl">{quienesSomos.intro}</p>
        </Reveal>
        <div className="grid gap-5 md:grid-cols-2">
          {quienesSomos.bloques.map((b, i) => (
            <Reveal key={b.titulo} delay={i * 0.08} className="rounded-3xl border bg-card p-6 sm:p-8">
              <h2 id={i === 0 ? "quienes-somos" : undefined} className="font-heading text-2xl font-bold text-goyn-magenta-a11y">
                {b.titulo}
              </h2>
              <p className="mt-3 leading-relaxed text-foreground/80">{b.texto}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
