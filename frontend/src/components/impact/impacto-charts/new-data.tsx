import { SparklesIcon } from "lucide-react";

// Pin 8: datos que el nuevo instrumento podrá sumar a esta sección (propuestas pendientes de decisión).
const ITEMS = [
  {
    source: "Meta de atención y atendidos a la fecha",
    title: "Avance frente a la meta",
    text: "Porcentaje de cumplimiento por proyecto, por área principal y para toda la red.",
  },
  {
    source: "Área principal, otras dimensiones y población objetivo",
    title: "Resultados por área principal y por población",
    text: "Jóvenes atendidos por área de impacto y por grupo poblacional, incluida la nueva opción de jóvenes con discapacidad.",
  },
  {
    source: "Bloque de proyecto",
    title: "Modalidad de los proyectos",
    text: "Presencial, virtual o híbrido.",
  },
  {
    source: "P38",
    title: "Inversión social en juventud",
    text: "Tarjeta con la inversión estimada del año en COP; con cuidado, inversión por joven atendido.",
  },
  {
    source: "Gestión de la información",
    title: "Confiabilidad de los resultados",
    text: "Porcentaje de jóvenes reportados con soporte sistematizado, administrativo o informal.",
  },
];

export function NewImpactData() {
  return (
    <section aria-labelledby="impacto-nuevos-datos" className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-2">
        <h2
          id="impacto-nuevos-datos"
          className="font-heading text-2xl font-bold text-foreground"
        >
          Con el nuevo instrumento
        </h2>
        <span className="text-sm text-muted-foreground">
          Otros datos que se podrán sumar a esta sección
        </span>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {ITEMS.map((it) => (
          <li
            key={it.title}
            className="flex flex-col rounded-2xl border-2 border-dashed p-4"
          >
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-goyn-lila/70 px-2 py-0.5 text-[11px] font-bold text-goyn-violeta-oscuro dark:text-foreground">
              <SparklesIcon className="size-3" aria-hidden /> Próximamente
            </span>
            <span className="mt-3 text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
              {it.source}
            </span>
            <h3 className="mt-1 font-heading text-base font-bold text-foreground">
              {it.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{it.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
