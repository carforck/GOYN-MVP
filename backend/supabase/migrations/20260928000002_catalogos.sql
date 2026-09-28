-- GOYN Conecta BAQ · 002 · Catálogos del marco común (generado por scripts/build-catalog-migration.mjs).
-- Fuente: Instrumento de mapeo de actores (preguntas 10–43) y PRD v1.0 §7.2.
-- Regla: los códigos son estables; un valor usado no se borra, se desactiva (active = false).

create table public.cat_org_type (
  code text primary key,
  label text not null,
  description text,
  sort_order int not null default 0,
  active boolean not null default true
);
insert into public.cat_org_type (code, label, description, sort_order) values
  ('privado_empresa', 'Sector privado: Empresas', null, 1),
  ('privado_gremio', 'Sector privado: Gremios', null, 2),
  ('privado_fundacion', 'Sector privado: Fundación', null, 3),
  ('publico_local', 'Entidad pública local / departamental', null, 4),
  ('publico_nacional', 'Entidad pública nacional', null, 5),
  ('educativa', 'Instituciones educativas', null, 6),
  ('bolsa_empleo', 'Bolsa de empleo / Intermediario laboral', null, 7),
  ('colectivo_juvenil', 'Colectivo juvenil', null, 8),
  ('comunitaria', 'Organización comunitaria', 'Fundaciones, asociaciones, corporaciones y colectivos no juveniles', 9);

create table public.cat_role (
  code text primary key,
  label text not null,
  description text,
  icon text,
  color text,
  sort_order int not null default 0,
  active boolean not null default true
);
insert into public.cat_role (code, label, description, icon, color, sort_order) values
  ('articulador', 'Articulador', 'Facilita la conexión, coordinación y alineación entre actores para que los esfuerzos individuales se integren en una estrategia común.', 'rol-21', '#E8531D', 1),
  ('implementador', 'Implementador', 'Ejecuta acciones en el territorio: programas, proyectos o servicios que impactan directamente a jóvenes.', 'rol-22', '#E1378B', 2),
  ('financiador', 'Financiador', 'Aporta recursos económicos, técnicos o en especie y acompaña la definición estratégica.', 'rol-23', '#634494', 3),
  ('tomador_decision', 'Tomador de decisión', 'Define políticas, lineamientos institucionales o decisiones gremiales que habilitan condiciones y escala.', 'rol-17', '#E20613', 4),
  ('evaluador', 'Evaluador / Gestor de conocimiento', 'Mide el impacto, sistematiza aprendizajes y aporta evidencia para la mejora continua del Colaborativo.', 'rol-16', '#70B52C', 5),
  ('generador_conocimiento', 'Generador de conocimiento', 'Produce investigación, datos, metodologías o formación que fortalecen el ecosistema.', 'rol-20', '#FABB2C', 6),
  ('juventud', 'Juventud', 'Participa activamente en el diseño, validación y ejecución de soluciones desde su experiencia y voz.', 'rol-18', '#07A067', 7),
  ('embajador', 'Embajador', 'Moviliza voluntades, abre puertas y posiciona temas clave en la agenda pública o privada.', 'rol-19', '#0A9ECB', 8);

create table public.cat_scope (
  code text primary key,
  label text not null,
  description text,
  sort_order int not null default 0,
  active boolean not null default true
);
insert into public.cat_scope (code, label, description, sort_order) values
  ('local', 'Local', null, 1),
  ('departamental', 'Departamental', null, 2),
  ('nacional', 'Nacional', 'Presencia en 2 o más ciudades', 3),
  ('internacional', 'Internacional', null, 4);

create table public.cat_impact_area (
  code text primary key,
  label text not null,
  description text,
  color text,
  sort_order int not null default 0,
  active boolean not null default true
);
insert into public.cat_impact_area (code, label, description, color, sort_order) values
  ('educacion', 'Educación y formación', 'Barreras que limitan el acceso y la continuidad de los jóvenes en trayectorias educativas pertinentes y de calidad.', '#9B00FF', 1),
  ('ingresos', 'Generación de ingresos', 'Factores que limitan la inserción laboral, la empleabilidad y el emprendimiento de los jóvenes.', '#FF01A2', 2),
  ('participacion', 'Participación e incidencia juvenil', 'Desafíos para participar en la toma de decisiones, ejercer liderazgo y fortalecer la agencia juvenil.', '#00A0CC', 3),
  ('orientacion', 'Orientación socio-ocupacional', 'Desafíos para construir identidad, definir proyecto de vida y decidir sobre el futuro educativo y laboral.', '#FE5200', 4),
  ('entornos', 'Entornos seguros y comunidad', 'Entornos familiares y comunitarios que afectan el bienestar, el desarrollo y el acceso a oportunidades.', '#0AA066', 5),
  ('bienestar', 'Bienestar y salud', 'Barreras de acceso a servicios de salud física, socioemocional y reproductiva.', '#FFBD25', 6),
  ('inclusion_digital', 'Inclusión digital', 'Limitaciones de acceso y uso de tecnología en educación, empleo y otros espacios sociales.', '#060A28', 7);

create table public.cat_problem (
  code text primary key,
  label text not null,
  description text,
  area_code text not null references public.cat_impact_area(code),
  sort_order int not null default 0,
  active boolean not null default true
);
insert into public.cat_problem (code, label, description, area_code, sort_order) values
  ('edu_desconexion_media', 'Desconexión de la educación media y secundaria', null, 'educacion', 1),
  ('edu_desconexion_posmedia', 'Desconexión de la educación posmedia', null, 'educacion', 2),
  ('edu_calidad_pertinencia', 'Calidad y pertinencia en la formación', null, 'educacion', 3),
  ('ing_desconexion_sector_productivo', 'Desconexión entre instituciones educativas y sector productivo', null, 'ingresos', 4),
  ('ing_barreras_mercado_laboral', 'Barreras para el acceso al mercado laboral (habilidades / experiencia / información)', null, 'ingresos', 5),
  ('ing_barreras_emprendimiento', 'Barreras para la ideación, formalización y desarrollo de emprendimientos sostenibles', null, 'ingresos', 6),
  ('par_liderazgo', 'Limitadas oportunidades para desarrollo de habilidades de liderazgo', null, 'participacion', 7),
  ('par_espacios_decision', 'Falta de espacios de participación en toma de decisiones', null, 'participacion', 8),
  ('par_recursos_iniciativas', 'Falta de recursos para iniciativas', null, 'participacion', 9),
  ('ori_rutas_empleabilidad', 'Desconocimiento de rutas de empleabilidad ajustadas a intereses', null, 'orientacion', 10),
  ('ori_rutas_formacion', 'Desconocimiento de rutas de formación ajustadas a intereses', null, 'orientacion', 11),
  ('ori_identidad_plan_vida', 'Retos en consolidar identidad y establecer plan de vida', null, 'orientacion', 12),
  ('ent_cultura_deporte_ocio', 'Limitado acceso a experiencias de cultura, deporte y ocio', null, 'entornos', 13),
  ('ent_violencia_identidad', 'Violencia en jóvenes (identidad, género, origen)', null, 'entornos', 14),
  ('ent_altas_tasas_violencia', 'Altas tasas de violencia', null, 'entornos', 15),
  ('bie_maternidad_temprana', 'Maternidades y paternidades tempranas', null, 'bienestar', 16),
  ('bie_spa', 'Consumo de sustancias psicoactivas', null, 'bienestar', 17),
  ('bie_salud_mental', 'Barreras en el acceso a servicios de salud mental', null, 'bienestar', 18),
  ('dig_acceso_internet', 'Falta de acceso a internet en el hogar', null, 'inclusion_digital', 19),
  ('dig_competencias', 'Falta de competencias y habilidades digitales', null, 'inclusion_digital', 20),
  ('dig_costos', 'Costos elevados de conectividad y equipos tecnológicos', null, 'inclusion_digital', 21);

create table public.cat_population (
  code text primary key,
  label text not null,
  description text,
  sort_order int not null default 0,
  active boolean not null default true
);
insert into public.cat_population (code, label, description, sort_order) values
  ('general', 'Población joven en general (14 a 28 años)', null, 1),
  ('migrantes', 'Jóvenes migrantes', null, 2),
  ('mujeres', 'Jóvenes mujeres', null, 3),
  ('discapacidad', 'Jóvenes con discapacidad', null, 4),
  ('lgbtiq', 'Jóvenes LGBTIQ+', null, 5),
  ('afro', 'Jóvenes afrodescendientes', null, 6),
  ('indigenas', 'Jóvenes indígenas', null, 7),
  ('victimas', 'Jóvenes víctimas del conflicto armado', null, 8),
  ('srpa', 'Jóvenes del Sistema de Responsabilidad Penal para Adolescentes (SRPA)', null, 9);

create table public.cat_relation_type (
  code text primary key,
  label text not null,
  description text,
  sort_order int not null default 0,
  active boolean not null default true
);
insert into public.cat_relation_type (code, label, description, sort_order) values
  ('socio', 'Socio', 'Relación de financiación y toma de decisión conjunta de las estrategias.', 1),
  ('aliado', 'Aliado', 'Trabajo conjunto y constante a través de proyectos o espacios colaborativos específicos.', 2),
  ('colaborador', 'Colaborador', 'Conectados para acciones puntuales en coyunturas específicas.', 3);

create table public.cat_modality (
  code text primary key,
  label text not null,
  description text,
  sort_order int not null default 0,
  active boolean not null default true
);
insert into public.cat_modality (code, label, description, sort_order) values
  ('presencial', 'Presencial', null, 1),
  ('virtual', 'Virtual', null, 2),
  ('hibrido', 'Híbrido', null, 3),
  ('no_aplica', 'No aplica', null, 4);

create table public.cat_data_management (
  code text primary key,
  label text not null,
  description text,
  sort_order int not null default 0,
  active boolean not null default true
);
insert into public.cat_data_management (code, label, description, sort_order) values
  ('informal', 'Gestión informal', 'Estimaciones internas no documentadas o reportes no sistematizados (ej. listados físicos).', 1),
  ('administrativa', 'Gestión administrativa', 'Registros administrativos básicos (ej. formularios, Excel).', 2),
  ('sistematizada', 'Gestión sistematizada', 'Sistema o plataforma especializada de monitoreo.', 3);

create table public.cat_tenure (
  code text primary key,
  label text not null,
  description text,
  sort_order int not null default 0,
  active boolean not null default true
);
insert into public.cat_tenure (code, label, description, sort_order) values
  ('menos_6m', 'Menos de 6 meses', null, 1),
  ('6m_1a', 'Entre 6 meses y 1 año', null, 2),
  ('1a_2a', 'Más de un año y hasta 2 años', null, 3),
  ('mas_2a', 'Más de 2 años', null, 4);

create table public.cat_goyn_space (
  code text primary key,
  label text not null,
  description text,
  sort_order int not null default 0,
  active boolean not null default true
);
insert into public.cat_goyn_space (code, label, description, sort_order) values
  ('mesas_tecnicas', 'Mesas técnicas (Empleabilidad, Emprendimiento, Cambio de narrativa, Conexión juvenil, Datos)', null, 1),
  ('liderazgo_juvenil', 'Espacios de liderazgo o participación juvenil', null, 2),
  ('sesiones_colaborativo', 'Sesiones del colaborativo', null, 3),
  ('evento_anual', 'Evento anual GOYN', null, 4);

create table public.cat_territory (
  code text primary key,
  label text not null,
  municipality text,
  centroid extensions.geography(point, 4326),
  sort_order int not null default 0,
  active boolean not null default true
);
insert into public.cat_territory (code, label, municipality, centroid, sort_order) values
  ('baq_riomar', 'BAQ – Riomar', 'Barranquilla', extensions.st_setsrid(extensions.st_makepoint(-74.8262, 11.0137), 4326)::extensions.geography, 1),
  ('baq_norte_centro', 'BAQ – Norte-Centro Histórico', 'Barranquilla', extensions.st_setsrid(extensions.st_makepoint(-74.7936, 10.9905), 4326)::extensions.geography, 2),
  ('baq_suroccidente', 'BAQ – Sur Occidente', 'Barranquilla', extensions.st_setsrid(extensions.st_makepoint(-74.8213, 10.9538), 4326)::extensions.geography, 3),
  ('baq_suroriente', 'BAQ – Sur Oriente', 'Barranquilla', extensions.st_setsrid(extensions.st_makepoint(-74.7818, 10.9567), 4326)::extensions.geography, 4),
  ('baq_metropolitana', 'BAQ – Metropolitana', 'Barranquilla', extensions.st_setsrid(extensions.st_makepoint(-74.8047, 10.9337), 4326)::extensions.geography, 5),
  ('amb_galapa', 'AMB – Galapa', 'Galapa', extensions.st_setsrid(extensions.st_makepoint(-74.8858, 10.8968), 4326)::extensions.geography, 6),
  ('amb_soledad', 'AMB – Soledad', 'Soledad', extensions.st_setsrid(extensions.st_makepoint(-74.7672, 10.9124), 4326)::extensions.geography, 7),
  ('amb_puerto_colombia', 'AMB – Puerto Colombia', 'Puerto Colombia', extensions.st_setsrid(extensions.st_makepoint(-74.9547, 10.9878), 4326)::extensions.geography, 8),
  ('amb_malambo', 'AMB – Malambo', 'Malambo', extensions.st_setsrid(extensions.st_makepoint(-74.7739, 10.8595), 4326)::extensions.geography, 9),
  ('cobertura_general', 'Presencia no focalizada / Cobertura general', null, null, 10);

-- Definiciones versionadas de indicadores (arquitectura de datos §3).
create table public.indicator_definition (
  code text not null,
  version int not null default 1,
  label text not null,
  definition text not null,
  unit text not null,
  color text,
  periodicity text not null default 'trimestral',
  valid_from date not null default current_date,
  valid_to date,
  primary key (code, version)
);
insert into public.indicator_definition (code, version, label, definition, unit, color) values
  ('conectados', 1, 'Jóvenes conectados', 'Jóvenes que interactúan o se vinculan con actividades, oportunidades, programas, talleres o sesiones de organizaciones del Colaborativo.', 'jóvenes', '#9B00FF'),
  ('fortalecidos', 1, 'Jóvenes fortalecidos', 'Jóvenes que mejoran habilidades técnicas, socioemocionales o emprendedoras mediante procesos de formación mayores a 5 horas.', 'jóvenes', '#00A0CC'),
  ('transformados', 1, 'Jóvenes transformados', 'Jóvenes con mejora sostenible laboral o económica: empleo formal con permanencia mínima, formalización de emprendimiento o mejora estable de ingresos.', 'jóvenes', '#FF01A2');
