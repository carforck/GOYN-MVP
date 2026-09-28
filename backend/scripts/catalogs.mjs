// Fuente única de los catálogos del marco común del Colaborativo GOYN Barranquilla.
// Origen: "INSTRUMENTO DE MAPEO DE ACTORES Y ACCIONES DEL COLABORATIVO" (preguntas 10–43)
// y PRD v1.0 §7.2. Los códigos son estables: si cambia una etiqueta, el código se conserva.
// `npm run build:seed` genera a partir de aquí la migración de catálogos y los datos demo.

export const orgTypes = [
  { code: "privado_empresa", label: "Sector privado: Empresas" },
  { code: "privado_gremio", label: "Sector privado: Gremios" },
  { code: "privado_fundacion", label: "Sector privado: Fundación" },
  { code: "publico_local", label: "Entidad pública local / departamental" },
  { code: "publico_nacional", label: "Entidad pública nacional" },
  { code: "educativa", label: "Instituciones educativas" },
  { code: "bolsa_empleo", label: "Bolsa de empleo / Intermediario laboral" },
  { code: "colectivo_juvenil", label: "Colectivo juvenil" },
  {
    code: "comunitaria",
    label: "Organización comunitaria",
    description: "Fundaciones, asociaciones, corporaciones y colectivos no juveniles",
  },
];

// El Instrumento lista 7 roles; el PRD y la propuesta de datos agregan "Generador de conocimiento".
// Se conservan los 8 porque existen 8 íconos de rol en los recursos gráficos.
// `icon` = archivo en RECURSOS GRAFICOS/ICONOS/ROLES (mapeo inferido por iconografía, por confirmar con GOYN).
export const roles = [
  { code: "articulador", label: "Articulador", icon: "rol-21", color: "#E8531D",
    description: "Facilita la conexión, coordinación y alineación entre actores para que los esfuerzos individuales se integren en una estrategia común." },
  { code: "implementador", label: "Implementador", icon: "rol-22", color: "#E1378B",
    description: "Ejecuta acciones en el territorio: programas, proyectos o servicios que impactan directamente a jóvenes." },
  { code: "financiador", label: "Financiador", icon: "rol-23", color: "#634494",
    description: "Aporta recursos económicos, técnicos o en especie y acompaña la definición estratégica." },
  { code: "tomador_decision", label: "Tomador de decisión", icon: "rol-17", color: "#E20613",
    description: "Define políticas, lineamientos institucionales o decisiones gremiales que habilitan condiciones y escala." },
  { code: "evaluador", label: "Evaluador / Gestor de conocimiento", icon: "rol-16", color: "#70B52C",
    description: "Mide el impacto, sistematiza aprendizajes y aporta evidencia para la mejora continua del Colaborativo." },
  { code: "generador_conocimiento", label: "Generador de conocimiento", icon: "rol-20", color: "#FABB2C",
    description: "Produce investigación, datos, metodologías o formación que fortalecen el ecosistema." },
  { code: "juventud", label: "Juventud", icon: "rol-18", color: "#07A067",
    description: "Participa activamente en el diseño, validación y ejecución de soluciones desde su experiencia y voz." },
  { code: "embajador", label: "Embajador", icon: "rol-19", color: "#0A9ECB",
    description: "Moviliza voluntades, abre puertas y posiciona temas clave en la agenda pública o privada." },
];

export const scopes = [
  { code: "local", label: "Local" },
  { code: "departamental", label: "Departamental" },
  { code: "nacional", label: "Nacional", description: "Presencia en 2 o más ciudades" },
  { code: "internacional", label: "Internacional" },
];

// Zonas de Barranquilla A.M. (pregunta 13). Coordenadas = centroide aproximado de referencia
// para ubicar marcadores cuando no hay dirección exacta; se rotulan como "aproximadas".
export const territories = [
  { code: "baq_riomar", label: "BAQ – Riomar", municipality: "Barranquilla", lat: 11.0137, lng: -74.8262 },
  { code: "baq_norte_centro", label: "BAQ – Norte-Centro Histórico", municipality: "Barranquilla", lat: 10.9905, lng: -74.7936 },
  { code: "baq_suroccidente", label: "BAQ – Sur Occidente", municipality: "Barranquilla", lat: 10.9538, lng: -74.8213 },
  { code: "baq_suroriente", label: "BAQ – Sur Oriente", municipality: "Barranquilla", lat: 10.9567, lng: -74.7818 },
  { code: "baq_metropolitana", label: "BAQ – Metropolitana", municipality: "Barranquilla", lat: 10.9337, lng: -74.8047 },
  { code: "amb_galapa", label: "AMB – Galapa", municipality: "Galapa", lat: 10.8968, lng: -74.8858 },
  { code: "amb_soledad", label: "AMB – Soledad", municipality: "Soledad", lat: 10.9124, lng: -74.7672 },
  { code: "amb_puerto_colombia", label: "AMB – Puerto Colombia", municipality: "Puerto Colombia", lat: 10.9878, lng: -74.9547 },
  { code: "amb_malambo", label: "AMB – Malambo", municipality: "Malambo", lat: 10.8595, lng: -74.7739 },
  { code: "cobertura_general", label: "Presencia no focalizada / Cobertura general", municipality: null, lat: null, lng: null },
];

export const impactAreas = [
  { code: "educacion", label: "Educación y formación", color: "#9B00FF",
    description: "Barreras que limitan el acceso y la continuidad de los jóvenes en trayectorias educativas pertinentes y de calidad." },
  { code: "ingresos", label: "Generación de ingresos", color: "#FF01A2",
    description: "Factores que limitan la inserción laboral, la empleabilidad y el emprendimiento de los jóvenes." },
  { code: "participacion", label: "Participación e incidencia juvenil", color: "#00A0CC",
    description: "Desafíos para participar en la toma de decisiones, ejercer liderazgo y fortalecer la agencia juvenil." },
  { code: "orientacion", label: "Orientación socio-ocupacional", color: "#FE5200",
    description: "Desafíos para construir identidad, definir proyecto de vida y decidir sobre el futuro educativo y laboral." },
  { code: "entornos", label: "Entornos seguros y comunidad", color: "#0AA066",
    description: "Entornos familiares y comunitarios que afectan el bienestar, el desarrollo y el acceso a oportunidades." },
  { code: "bienestar", label: "Bienestar y salud", color: "#FFBD25",
    description: "Barreras de acceso a servicios de salud física, socioemocional y reproductiva." },
  { code: "inclusion_digital", label: "Inclusión digital", color: "#060A28",
    description: "Limitaciones de acceso y uso de tecnología en educación, empleo y otros espacios sociales." },
];

// Preguntas 15–21: problemáticas por área de impacto. "otra" permite texto libre en la organización.
export const problems = [
  { code: "edu_desconexion_media", area: "educacion", label: "Desconexión de la educación media y secundaria" },
  { code: "edu_desconexion_posmedia", area: "educacion", label: "Desconexión de la educación posmedia" },
  { code: "edu_calidad_pertinencia", area: "educacion", label: "Calidad y pertinencia en la formación" },
  { code: "ing_desconexion_sector_productivo", area: "ingresos", label: "Desconexión entre instituciones educativas y sector productivo" },
  { code: "ing_barreras_mercado_laboral", area: "ingresos", label: "Barreras para el acceso al mercado laboral (habilidades / experiencia / información)" },
  { code: "ing_barreras_emprendimiento", area: "ingresos", label: "Barreras para la ideación, formalización y desarrollo de emprendimientos sostenibles" },
  { code: "par_liderazgo", area: "participacion", label: "Limitadas oportunidades para desarrollo de habilidades de liderazgo" },
  { code: "par_espacios_decision", area: "participacion", label: "Falta de espacios de participación en toma de decisiones" },
  { code: "par_recursos_iniciativas", area: "participacion", label: "Falta de recursos para iniciativas" },
  { code: "ori_rutas_empleabilidad", area: "orientacion", label: "Desconocimiento de rutas de empleabilidad ajustadas a intereses" },
  { code: "ori_rutas_formacion", area: "orientacion", label: "Desconocimiento de rutas de formación ajustadas a intereses" },
  { code: "ori_identidad_plan_vida", area: "orientacion", label: "Retos en consolidar identidad y establecer plan de vida" },
  { code: "ent_cultura_deporte_ocio", area: "entornos", label: "Limitado acceso a experiencias de cultura, deporte y ocio" },
  { code: "ent_violencia_identidad", area: "entornos", label: "Violencia en jóvenes (identidad, género, origen)" },
  { code: "ent_altas_tasas_violencia", area: "entornos", label: "Altas tasas de violencia" },
  { code: "bie_maternidad_temprana", area: "bienestar", label: "Maternidades y paternidades tempranas" },
  { code: "bie_spa", area: "bienestar", label: "Consumo de sustancias psicoactivas" },
  { code: "bie_salud_mental", area: "bienestar", label: "Barreras en el acceso a servicios de salud mental" },
  { code: "dig_acceso_internet", area: "inclusion_digital", label: "Falta de acceso a internet en el hogar" },
  { code: "dig_competencias", area: "inclusion_digital", label: "Falta de competencias y habilidades digitales" },
  { code: "dig_costos", area: "inclusion_digital", label: "Costos elevados de conectividad y equipos tecnológicos" },
];

export const populations = [
  { code: "general", label: "Población joven en general (14 a 28 años)" },
  { code: "migrantes", label: "Jóvenes migrantes" },
  { code: "mujeres", label: "Jóvenes mujeres" },
  { code: "discapacidad", label: "Jóvenes con discapacidad" },
  { code: "lgbtiq", label: "Jóvenes LGBTIQ+" },
  { code: "afro", label: "Jóvenes afrodescendientes" },
  { code: "indigenas", label: "Jóvenes indígenas" },
  { code: "victimas", label: "Jóvenes víctimas del conflicto armado" },
  { code: "srpa", label: "Jóvenes del Sistema de Responsabilidad Penal para Adolescentes (SRPA)" },
];

// Preguntas 22–27. "potencial" permite registrar aspiración sin mezclarla con evidencia (PRD §6.1).
export const relationTypes = [
  { code: "socio", label: "Socio", description: "Relación de financiación y toma de decisión conjunta de las estrategias." },
  { code: "aliado", label: "Aliado", description: "Trabajo conjunto y constante a través de proyectos o espacios colaborativos específicos." },
  { code: "colaborador", label: "Colaborador", description: "Conectados para acciones puntuales en coyunturas específicas." },
];

export const modalities = [
  { code: "presencial", label: "Presencial" },
  { code: "virtual", label: "Virtual" },
  { code: "hibrido", label: "Híbrido" },
  { code: "no_aplica", label: "No aplica" },
];

// Pregunta de cierre del bloque de proyectos.
export const dataManagementLevels = [
  { code: "informal", label: "Gestión informal", description: "Estimaciones internas no documentadas o reportes no sistematizados (ej. listados físicos)." },
  { code: "administrativa", label: "Gestión administrativa", description: "Registros administrativos básicos (ej. formularios, Excel)." },
  { code: "sistematizada", label: "Gestión sistematizada", description: "Sistema o plataforma especializada de monitoreo." },
];

export const collaborativeTenure = [
  { code: "menos_6m", label: "Menos de 6 meses" },
  { code: "6m_1a", label: "Entre 6 meses y 1 año" },
  { code: "1a_2a", label: "Más de un año y hasta 2 años" },
  { code: "mas_2a", label: "Más de 2 años" },
];

export const goynSpaces = [
  { code: "mesas_tecnicas", label: "Mesas técnicas (Empleabilidad, Emprendimiento, Cambio de narrativa, Conexión juvenil, Datos)" },
  { code: "liderazgo_juvenil", label: "Espacios de liderazgo o participación juvenil" },
  { code: "sesiones_colaborativo", label: "Sesiones del colaborativo" },
  { code: "evento_anual", label: "Evento anual GOYN" },
];

// PRD §7.3. Mapeo al bloque de proyecto del Instrumento:
// conectados = "jóvenes atendidos a la fecha"; fortalecidos = "evidenciaron fortalecimiento";
// transformados = "accedieron a empleo" + "iniciaron o mejoraron emprendimiento" (solo área ingresos).
export const indicators = [
  { code: "conectados", label: "Jóvenes conectados", unit: "jóvenes", color: "#9B00FF",
    definition: "Jóvenes que interactúan o se vinculan con actividades, oportunidades, programas, talleres o sesiones de organizaciones del Colaborativo." },
  { code: "fortalecidos", label: "Jóvenes fortalecidos", unit: "jóvenes", color: "#00A0CC",
    definition: "Jóvenes que mejoran habilidades técnicas, socioemocionales o emprendedoras mediante procesos de formación mayores a 5 horas." },
  { code: "transformados", label: "Jóvenes transformados", unit: "jóvenes", color: "#FF01A2",
    definition: "Jóvenes con mejora sostenible laboral o económica: empleo formal con permanencia mínima, formalización de emprendimiento o mejora estable de ingresos." },
];

export const allCatalogs = {
  orgTypes, roles, scopes, territories, impactAreas, problems, populations,
  relationTypes, modalities, dataManagementLevels, collaborativeTenure, goynSpaces, indicators,
};
