-- 012 · Áreas de impacto: nombres, colores y definiciones del nuevo diseño de inicio (08-oct-2026).
-- Los colores coinciden con los íconos oficiales de cada área. Los códigos no cambian.
update public.cat_impact_area set label = 'Educación y formación', color = '#FFBD25',
  description = 'Barreras estructurales y de contexto que limitan el acceso de los jóvenes a trayectorias educativas pertinentes, continuas y de calidad.' where code = 'educacion';
update public.cat_impact_area set label = 'Empleo y generación de ingresos', color = '#00A0CC',
  description = 'Factores estructurales, económicos y sociales que limitan la inserción laboral y el desarrollo productivo de los jóvenes.' where code = 'ingresos';
update public.cat_impact_area set label = 'Participación e incidencia juvenil', color = '#FF01A2',
  description = 'Desafíos que enfrentan los jóvenes para participar en la toma de decisiones y fortalecer su agencia y liderazgo en la construcción de lo público.' where code = 'participacion';
update public.cat_impact_area set label = 'Orientación socio-ocupacional', color = '#0AA066',
  description = 'Retos que enfrentan los jóvenes para construir su identidad y proyectar un plan de vida alineado con sus intereses y su contexto.' where code = 'orientacion';
update public.cat_impact_area set label = 'Entornos seguros y comunidad', color = '#9B00FF',
  description = 'Entornos familiares y comunitarios que afectan el bienestar, el desarrollo y el acceso a oportunidades de los jóvenes.' where code = 'entornos';
update public.cat_impact_area set label = 'Bienestar y salud', color = '#FE5200',
  description = 'Desafíos estructurales, sociales y territoriales que enfrentan los jóvenes para acceder a servicios de salud física, mental y reproductiva.' where code = 'bienestar';
update public.cat_impact_area set label = 'Inclusión digital', color = '#1600CC',
  description = 'Limitaciones materiales que enfrentan los jóvenes para participar en entornos educativos, laborales y sociales donde la tecnología es un habilitador.' where code = 'inclusion_digital';
