// Contenido del inicio según el diseño "Home Plataforma" (reunión 08-oct-2026).
// Lo marcado con `pendiente` espera el texto definitivo del equipo GOYN.

export const acerca = {
  porQue: "Porque en Barranquilla trabajan muchas organizaciones por la juventud, pero sin un lugar común para verlas juntas es difícil saber qué se está haciendo, en dónde, y qué necesidades del territorio quedan todavía sin cubrir.",
  paraQuien: [
    { title: "Colaborativo", text: "todas las organizaciones públicas, privadas, sociales y comunitarias que hacen parte del ecosistema GOYN Barranquilla." },
    { title: "Juventud", text: "los jóvenes de Barranquilla y el Grupo Asesor Juvenil (YAG), como protagonistas de esta información." },
  ],
  paraQue: [
    "Visibilizar las acciones y los resultados que cada actor del Colaborativo desarrolla por y para los jóvenes.",
    "Facilitar decisiones basadas en evidencia compartida entre los actores del ecosistema.",
    "Acceder a información que promueva una mayor articulación entre las organizaciones.",
    "Promover una cultura de medición conjunta y de acción articulada entre organizaciones.",
    "Construir una visión colectiva del impacto del Colaborativo GOYN en Barranquilla.",
  ],
};

export const proposito =
  "Buscamos construir, entre todos los actores del ecosistema, una mirada compartida sobre las acciones y los resultados que se generan por la juventud en Barranquilla, para tomar mejores decisiones, fortalecer alianzas y avanzar juntos hacia más y mejores oportunidades para los jóvenes con potencial de la ciudad.";

export type Pillar = { code: string; title: string; text: string; points?: string[] };

// Definiciones oficiales publicadas en goynbarranquilla.com/nosotros ("Nuestros pilares").
// Los puntos de "Articulación basada en el territorio" vienen de la maqueta del 08-oct.
export const pilaresIntro = "Estos pilares orientan nuestra forma de trabajar y articulan las capacidades del ecosistema para generar cambios sostenibles.";

export const pilares: Pillar[] = [
  {
    code: "articulacion_territorio",
    title: "Articulación basada en el territorio",
    text: "Construimos estrategias a partir de las realidades, retos y oportunidades del territorio, articulando a jóvenes, comunidades y actores del ecosistema alrededor de una visión compartida de cambio.",
    points: [
      "Diseñar estrategias coherentes con los retos de los jóvenes y las características de la demanda actual y futura del mercado.",
      "Construir una estructura de colaboración con jóvenes y líderes de la comunidad con una visión compartida de impacto.",
      "Coordinar el ecosistema local de oportunidades para los jóvenes para abordar las barreras estructurales que enfrentan.",
    ],
  },
  {
    code: "movilizacion",
    title: "Movilización colectiva",
    text: "Sumamos nuevos aliados para fortalecer un movimiento que impulse cambios en las mentalidades, prácticas y políticas que afectan las oportunidades de los jóvenes.",
  },
  {
    code: "red_aprendizajes",
    title: "Red de aprendizajes",
    text: "Compartimos investigación, evidencia y aprendizajes para fortalecer las capacidades del ecosistema, promover la innovación y mejorar continuamente las acciones dirigidas a los jóvenes.",
  },
  {
    code: "participacion_liderazgo",
    title: "Participación y liderazgo juvenil",
    text: "Ponemos las voces y perspectivas de los jóvenes en el centro de las soluciones, fortaleciendo su capacidad de agencia y liderazgo para que sean protagonistas de los cambios en sus territorios.",
  },
  {
    code: "financiacion",
    title: "Financiación diversificada",
    text: "Movilizamos fuentes de financiación diversas e innovadoras, locales y globales, para fortalecer las iniciativas que amplían las oportunidades para los jóvenes con potencial.",
  },
  {
    code: "datos_tecnologia",
    title: "Datos y tecnología",
    text: "Fortalecemos el uso de datos, análisis y herramientas tecnológicas para tomar mejores decisiones, comprender las realidades de los jóvenes y desarrollar soluciones con potencial de impacto a escala.",
  },
  {
    code: "equidad_acceso",
    title: "Equidad y acceso a oportunidades",
    text: "Trabajamos para reducir y eliminar las barreras que limitan el acceso de los jóvenes a oportunidades de educación, empleo formal y emprendimiento, promoviendo trayectorias más equitativas.",
  },
];

export const glosario: { term: string; text: string; pendiente?: boolean }[] = [
  { term: "Cambio sistémico", text: "Transformaciones estructurales en políticas, prácticas, flujos de recursos y narrativas, que buscan eliminar las barreras que enfrentan los jóvenes con potencial en Barranquilla." },
  { term: "Teoría del cambio", text: "Marco que explica cómo las acciones del Colaborativo conducen a resultados intermedios y, finalmente, a que los jóvenes con potencial tengan acceso equitativo a oportunidades." },
  { term: "Impacto colectivo", text: "Enfoque que reconoce que los problemas sociales complejos requieren la colaboración coordinada entre múltiples sectores y actores, en lugar de intervenciones aisladas." },
  { term: "Medición conjunta", text: "Sistema de evaluación colaborativa que permite a los diferentes actores del ecosistema compartir datos, metodologías y resultados para medir el impacto colectivo de sus acciones." },
  { term: "Visión compartida", text: "Definición en preparación por el equipo GOYN.", pendiente: true },
];

export const areasIntro =
  "Definimos siete dimensiones para entender de forma integral las necesidades de los jóvenes con potencial en Barranquilla y el trabajo que hace el ecosistema alrededor de cada una.";

export const ctaRegistro =
  "Esta es una mirada colectiva que crece con la participación de cada actor. Si haces parte del ecosistema de oportunidades para la juventud en Barranquilla, te invitamos a registrar tu organización y ser parte de este mapeo.";
