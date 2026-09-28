import { ArrowRightIcon, CheckCircle2Icon, ClockIcon, SaveIcon, ShieldCheckIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Shape } from "@/components/brand/shape";
import { buttonVariants } from "@/components/ui/button";
import { registrationSteps } from "@/lib/registration";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Registra tu organización" };

const flow = [
  { title: "Registra tu organización", text: "Completa el formulario guiado. Se guarda solo y puedes retomarlo cuando quieras." },
  { title: "GOYN valida", text: "El equipo GOYN revisa la información y puede pedirte ajustes puntuales." },
  { title: "Apareces en el mapa", text: "Tu perfil se publica en el mapa y el directorio, y puedes actualizarlo desde tu panel." },
];

export default function RegistroPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-goyn-violeta text-white">
        <Image src="/images/fotos/como-funciona.webp" alt="" fill sizes="100vw" className="-z-10 object-cover opacity-20" />
        <Shape name="rompecabezas" size={130} className="right-[6%] bottom-6 hidden brightness-0 invert md:block" />
        <div className="goyn-container py-14 sm:py-20">
          <span className="goyn-eyebrow bg-goyn-magenta">Únete al mapa del Colaborativo</span>
          <h1 className="mt-4 max-w-3xl text-4xl font-black sm:text-5xl">¿Aún no te ves reflejado?</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/85">
            Si tu organización trabaja con y para jóvenes de Barranquilla y su área metropolitana, regístrala para que el ecosistema sepa quién eres, qué haces y con quién te conectas.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/panel/registro" className={cn(buttonVariants(), "h-12 rounded-full bg-white px-6 text-base font-bold text-goyn-violeta hover:bg-white/90")}>
              Empezar el registro <ArrowRightIcon aria-hidden />
            </Link>
            <Link href="/ingresar?siguiente=/panel" className={cn(buttonVariants({ variant: "outline" }), "h-12 rounded-full border-white/40 bg-transparent px-6 text-base font-bold text-white hover:bg-white/10 hover:text-white")}>
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>

      <section className="goyn-container grid gap-10 py-14 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-extrabold text-foreground">Así funciona</h2>
          <ol className="mt-6 space-y-5">
            {flow.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-goyn-magenta font-heading font-extrabold text-white">{i + 1}</span>
                <div>
                  <p className="font-heading font-bold text-foreground">{s.title}</p>
                  <p className="text-muted-foreground">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <ul className="mt-8 grid gap-3 sm:grid-cols-3">
            <li className="rounded-2xl bg-muted p-4 text-sm"><ClockIcon className="mb-2 size-5 text-goyn-violeta" aria-hidden />Unos 15 a 20 minutos</li>
            <li className="rounded-2xl bg-muted p-4 text-sm"><SaveIcon className="mb-2 size-5 text-goyn-violeta" aria-hidden />Guardado automático por paso</li>
            <li className="rounded-2xl bg-muted p-4 text-sm"><ShieldCheckIcon className="mb-2 size-5 text-goyn-violeta" aria-hidden />Tu celular nunca se publica</li>
          </ul>
        </div>
        <div className="rounded-3xl border bg-card p-6 sm:p-8">
          <h2 className="text-lg font-extrabold text-foreground">Lo que te vamos a preguntar</h2>
          <ol className="mt-4 space-y-3">
            {registrationSteps.map((s, i) => (
              <li key={s.id} className="flex items-start gap-3">
                <CheckCircle2Icon className="mt-0.5 size-5 shrink-0 text-goyn-violeta" aria-hidden />
                <div>
                  <p className="font-semibold text-foreground">{i + 1}. {s.title}</p>
                  <p className="text-sm text-muted-foreground">{s.summary}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
