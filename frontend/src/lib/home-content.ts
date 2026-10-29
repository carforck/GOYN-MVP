// Contenido del inicio según el diseño "Home Plataforma" (reunión 08-oct-2026).
// Lo marcado con `pendiente` espera el texto definitivo del equipo GOYN.

export const hero = {
  titulo: "Te damos la bienvenida al mapa de actores y resultados del",
  tituloResaltado: "Ecosistema de Oportunidades para Jóvenes en Barranquilla A.M.",
  subtitulo:
    "Una herramienta para visibilizar, en un solo lugar, a los actores que conforman esta red y las acciones que están desarrollando para promover el bienestar multidimensional de los jóvenes en Barranquilla y su área metropolitana.",
};

// Ajuste 05 (cliente, oct-2026).
export const porQueReunidos = {
  titulo: "¿Por qué estamos reunidos?",
  cifras: [
    { valor: "1 de cada 4", texto: "habitantes de Barranquilla A.M. son jóvenes" },
    { valor: "36%", texto: "de los jóvenes permanecen desconectados de oportunidades de educación o empleo formal" },
  ],
  cta: {
    label: "Conoce más sobre el panorama y la realidad de los jóvenes con potencial",
    href: "https://goynbarranquilla.com/informes-y-estudios-sobre-juventud-goyn-barranquilla/",
  },
};

// Ajuste 06 (cliente, oct-2026).
export const quienesSomos = {
  intro: "Este desafío no debemos enfrentarlo solos, los jóvenes necesitan que todos, incluidos ellos, estemos más articulados:",
  bloques: [
    {
      titulo: "¿Quiénes somos?",
      texto:
        "Somos una red de organizaciones, instituciones y jóvenes de Barranquilla y su área metropolitana que trabajamos juntos para que más jóvenes encuentren oportunidades. Construimos una visión y una agenda común, y la construimos con ellos, no solo para ellos.",
    },
    {
      titulo: "Visión compartida",
      texto:
        "Fortalecer la capacidad de los jóvenes para ser agentes de cambio en la generación de oportunidades educativas, de empleo formal, emprendimiento e inclusión, con el apoyo de un conjunto de organizaciones aliadas, trabajando para derribar barreras y sesgos e impulsar sus capacidades, talentos y pasiones, enmarcando estas acciones dentro de un proceso de cambio sistémico que transforme de manera sostenible las oportunidades para la juventud.",
    },
  ],
};

export const acerca = {
  porQue:
    "Porque en Barranquilla y su área metropolitana muchas organizaciones trabajan por los jóvenes, pero cada una lo hace por su lado. Sin un lugar común para ver ese trabajo junto, es difícil saber qué se está haciendo, dónde, con quién, y qué necesidades del territorio siguen sin atenderse.",
  paraQuien:
    "Para todas las organizaciones públicas, privadas, académicas, sociales y comunitarias, y para los colectivos y liderazgos juveniles, que trabajan con y para los jóvenes de Barranquilla y su área metropolitana y que creen que, articulándonos, las oportunidades pueden llegar a más jóvenes y a los territorios donde más se necesitan.",
  paraQue: [
    "Visibilizar las acciones y los resultados que cada actor del ecosistema desarrolla por y para los jóvenes.",
    "Facilitar decisiones basadas en evidencia compartida entre los actores del ecosistema.",
    "Acceder a información que promueva y facilite una mayor articulación entre las organizaciones.",
    "Construir una visión colectiva del impacto del ecosistema de oportunidades para los jóvenes en Barranquilla A.M.",
  ],
};

export const proposito =
  "Buscamos construir, entre todos los actores del ecosistema, una mirada compartida sobre las acciones y los resultados que se generan por la juventud en Barranquilla y su área metropolitana, para tomar mejores decisiones, fortalecer alianzas y avanzar juntos hacia más y mejores oportunidades para los jóvenes con potencial del territorio.";

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

export type GlosarioItem = { term: string; text: string; niveles?: { title: string; text: string }[] };

// Ajuste 12 (cliente, oct-2026).
export const glosario: GlosarioItem[] = [
  {
    term: "Impacto Colectivo",
    text: "Enfoque de trabajo colaborativo en el que actores de distintos sectores articulan sus esfuerzos alrededor de una agenda común para abordar problemas sociales complejos y generar cambios sistémicos, a partir de cinco principios: agenda común, medición compartida, actividades que se refuerzan mutuamente, comunicación continua y una estructura de apoyo coordinadora.",
  },
  {
    term: "Visión Compartida",
    text: "Es el futuro que, como red de organizaciones, instituciones y jóvenes, queremos construir para la juventud de Barranquilla y su área metropolitana. Funciona como una brújula: aunque cada actor trabaje desde su propio lugar, todos avanzamos en la misma dirección.",
  },
  {
    term: "Jóvenes conectados, fortalecidos y transformados",
    text: "Son los tres niveles con los que medimos lo que logramos con los jóvenes, del primer contacto al cambio más profundo:",
    niveles: [
      { title: "Conectados", text: "jóvenes que participan en alguna actividad, programa, taller u oportunidad que ofrecen las organizaciones e instituciones de la red." },
      { title: "Fortalecidos", text: "jóvenes que mejoran sus habilidades técnicas, socioemocionales o de emprendimiento en procesos de formación de más de cinco horas." },
      { title: "Transformados", text: "jóvenes que logran un cambio estable en su vida laboral o económica, como conseguir un empleo formal, formalizar su emprendimiento o mejorar sus ingresos de forma sostenida." },
    ],
  },
  {
    term: "Jóvenes con potencial",
    text: "Son jóvenes que no estudian ni trabajan, o que trabajan en condiciones informales o precarias. Los llamamos así porque no los vemos como un problema, sino como personas con talento y capacidades que necesitan que el ecosistema les abra las oportunidades adecuadas.",
  },
  {
    term: "Bienestar multidimensional",
    text: "Es entender que el bienestar de un joven no depende de una sola cosa. Además del estudio y el empleo, influyen su salud física y mental, su entorno familiar y comunitario, su acceso a la tecnología, su participación en las decisiones que lo afectan y la claridad que tenga sobre su proyecto de vida. Por eso trabajamos sobre siete áreas de impacto que, juntas, buscan el desarrollo integral de los jóvenes.",
  },
];

// Ajuste 13 (cliente, oct-2026). El ícono se asigna en el componente.
export const tiposConexion = [
  { code: "socio", label: "Socios", text: "Hay una relación de financiación y toma de decisión conjunta de las estrategias." },
  { code: "aliado", label: "Aliados", text: "Trabajan de manera conjunta y constante a través de proyectos o espacios colaborativos específicos." },
  { code: "colaborador", label: "Colaborador", text: "Ya están conectados y realizan acciones muy puntuales en coyunturas específicas." },
] as const;

export const areasIntro =
  "Definimos siete dimensiones para entender de forma integral las necesidades de los jóvenes con potencial en Barranquilla A.M. y el trabajo que hace el ecosistema alrededor de cada una.";

// Ajuste 14 (cliente, oct-2026).
export const ctaRegistro = {
  titulo: "Tu trabajo también cuenta. Súmalo aquí.",
  texto:
    "Si trabajas con y para los jóvenes de Barranquilla y su área metropolitana, este mapa también es tuyo. Registra tu organización y haz visible lo que haces.",
};
