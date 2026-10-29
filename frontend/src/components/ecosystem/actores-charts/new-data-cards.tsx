// Pin 11 de la propuesta: "Con el nuevo instrumento". Datos que el nuevo instrumento de mapeo recoge y que
// podrán sumarse a esta sección cuando haya respuestas. En el sitio público se rotulan como "Próximamente".

const NEW_DATA: { title: string; questions: string; text: string }[] = [
  {
    title: "Rol principal y roles complementarios",
    questions: "P11 y P12",
    text: "Los círculos se agrupan por el rol principal declarado (sin la regla del primer rol) y al pasar el cursor se ven los otros roles de cada organización.",
  },
  {
    title: "Antigüedad y participación en el Colaborativo",
    questions: "P28 y P29",
    text: "Distribución por tiempo en el Colaborativo y participación en mesas técnicas, sesiones y eventos GOYN.",
  },
  {
    title: "Fortalecimiento percibido gracias a GOYN",
    questions: "P30 a P32",
    text: "Promedio y distribución de las tres escalas: alianzas, capacidad para diseñar soluciones y visibilidad. Puede leerse como un índice de fortalecimiento.",
  },
  {
    title: "Participación juvenil y visión compartida",
    questions: "P33 y P34",
    text: "Qué tanto involucran a los jóvenes en el ciclo de los proyectos y qué tan alineadas están con la visión del Colaborativo.",
  },
  {
    title: "Incidencia en política pública",
    questions: "P39 y P40",
    text: "Tarjeta con las organizaciones que impulsaron propuestas o ajustes de política, y sus relatos.",
  },
];

export function NewDataCards() {
  return (
    <section aria-labelledby="actores-nuevos-datos" className="space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id="actores-nuevos-datos" className="text-2xl font-bold text-foreground">
          Con el nuevo instrumento
        </h2>
        <span className="text-sm text-muted-foreground">Otros datos que se podrán sumar a esta sección</span>
        <span className="rounded-full border border-goyn-amarillo bg-goyn-amarillo/20 px-2.5 py-0.5 text-xs font-bold text-foreground">Próximamente</span>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {NEW_DATA.map((d) => (
          <li key={d.title} className="flex flex-col gap-2 rounded-2xl border-2 border-dashed bg-card/60 p-4">
            <span className="w-fit rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">{d.questions}</span>
            <h3 className="text-sm font-bold text-foreground">{d.title}</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">{d.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
