# Validación PRD ↔ Instrumento ↔ base de datos

El modelo se construyó desde el **Instrumento de mapeo de actores** (lo que realmente se va a capturar), contrastado
con el PRD v1.0 §6–7 y con la arquitectura de datos del 20-sep-2026.

## Matriz de trazabilidad

| Instrumento | Dato | Tabla · columna | Visibilidad |
|---|---|---|---|
| P1 | Nombre | `organization.name` | Pública |
| P2 | Descripción (≤200 palabras) | `organization.description` | Pública |
| P3–P4 | ¿Tiene NIT? / NIT | `organization.has_nit`, `nit` (único) · sin NIT → `internal_code` GOYN-00001 | NIT no se publica |
| P5–P6 | Contacto estratégico, cargo | `organization_private.contact_name`, `contact_position` | Solo miembros y GOYN |
| P7 | Celular | `organization_private.contact_phone` | Solo miembros y GOYN |
| P8–P9 | Correo de contacto | `organization.contact_email_public` | Pública |
| P10 | Tipo de organización | `organization.org_type_code` → `cat_org_type` | Pública |
| P11 | Rol principal | `organization.primary_role_code` → `cat_role` | Pública |
| P12 | Otros roles | `organization_role` | Pública |
| — | Alcance territorial (propuesta de datos) | `organization.scope_code` → `cat_scope` | Pública |
| P13 | Zonas de incidencia | `organization_territory` → `cat_territory` | Pública |
| — | Sede / ubicación | `location` (PostGIS, precisión exacta/aproximada) | Pública |
| P14 | Áreas de impacto | `organization_area` → `cat_impact_area` | Pública |
| P15–P21 | Problemáticas por área + "otra" | `organization_problem`, `organization_problem_other` | Pública / interna |
| P22–P27 | Socio / aliado / colaborador | `relation` (con `target_name_free` para no registrados) | Pública si existe y ambas publicadas |
| P28 | Antigüedad en el Colaborativo | `organization.collaborative_tenure_code` | Interna |
| P29 | Espacios GOYN | `organization_goyn_space` | Interna |
| P30–P34 | Escalas 1–10 | `organization_assessment` | Interna |
| P35–P37 | Cambio de narrativas | `organization_assessment.narrative` (jsonb) | Interna · **preguntas por definir** |
| P38 | Inversión social COP | `organization.social_investment_cop` | Interna |
| P39–P40 | Incidencia en política | `organization.policy_contribution` | Interna |
| P41–P42 + bloque | Proyectos (máx. 3) | `program`, `program_area`, `program_population`, `program_territory` | Pública |
| Bloque · resultados | Atendidos / fortalecidos / empleo / emprendimiento (+ mujeres) | `indicator_report` (conectados, fortalecidos, transformados) | Agregada pública |
| Cierre bloque | Gestión de la información | `organization.data_management_code` | Interna |
| P43 | Autorización de datos | `organization_private.data_consent_at`, `data_consent_text_version` | Interna |

Mapeo a indicadores del PRD §7.3: **conectados** = jóvenes atendidos; **fortalecidos** = evidenciaron fortalecimiento;
**transformados** = accedieron a empleo + iniciaron o mejoraron emprendimiento (solo área Generación de ingresos).
El tablero muestra la **suma de reportes validados, no personas únicas** (ADR 007).

## Inconsistencias encontradas en los documentos

| # | Dónde | Hallazgo | Cómo quedó |
|---|---|---|---|
| 1 | Instrumento P11 vs PRD §7.2 | El Instrumento tiene 7 roles; el PRD y la propuesta de datos agregan **Generador de conocimiento** | Se usan 8 roles (hay 8 íconos). Confirmar con GOYN |
| 2 | Instrumento P4 | La pregunta "NIT" tiene opciones Sí/No y la lógica de P3 copiada | Se modeló como texto con validación |
| 3 | Instrumento P42 | Dice "jóvenes en **Bogotá**" (copiado de Polaris) | Debe decir Barranquilla A.M. |
| 4 | Instrumento P33–P37 | El subtítulo "1 = No se han fortalecido" no corresponde a esas preguntas | Revisar redacción |
| 5 | Instrumento vs arquitectura | Máximo 3 proyectos vs "no limitar el modelo a tres programas" | La base no limita; el formulario sí (3) |
| 6 | PRD vs arquitectura vs backlog | Oportunidades: "Should MVP" / "fuera del núcleo" / "opcional" | Tabla `opportunity` creada; vista **Próximamente** |
| 7 | PRD §7.2 vs Instrumento | Los tipos de organización difieren (PRD "Fundación/ONG"; Instrumento separa "Sector privado: Fundación" y "Organización comunitaria") | Se usa el Instrumento |
| 8 | Instrumento P43 | NIT de Fundación Corona 860.008.052-1 vs Polaris 860.008.051-1 | Verificar con jurídica |
| 9 | Prototipo Lovable | Tipos ("Red", "Cooperativa") y áreas ("Deporte", "Tecnología") inventados; KPIs ficticios | No se reutilizan |
| 10 | Módulo 7 | Tres preguntas "por definir por parte de GOYN" | Campo jsonb flexible; UI muestra aviso |

## Decisiones tomadas para avanzar (confirmar con GOYN)

- **Cuenta primero** (opción A del flujo D2): se necesita sesión para guardar el borrador con dueño y retomarlo.
- **Ubicación aproximada por zona** cuando no hay coordenadas; se rotula como aproximada en el mapa y el perfil.
- **Relaciones declaradas** por una organización se publican al aprobar su solicitud; las no registradas quedan como texto.
- **Resultados del registro** se convierten en reportes del año en curso, aprobados junto con la solicitud.
- **Intensidad de relación** (PRD §12.2): columna `relation.intensity` 1–5 opcional, sin fórmula aún.

## Pendientes del PRD §12.2 que siguen abiertos

Nombre final y dominio · nivel de apertura de datos · frecuencia oficial de indicadores · criterios de "destacado" ·
responsable y tiempos de validación · matriz de cambios de bajo riesgo · regla definitiva de doble conteo.
