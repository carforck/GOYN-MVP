// Estructura del formulario de registro: los 9 módulos del Instrumento de mapeo agrupados en
// pasos (flujo de usuario D2). El payload resultante cumple el contrato documentado en
// backend/supabase/migrations/..._flujo_editorial.sql.

export const registrationSteps = [
  { id: "identificacion", title: "Identificación y contacto", summary: "Nombre, descripción, NIT (opcional) y contacto estratégico.", modules: "Módulo 1 · P1–P9" },
  { id: "caracterizacion", title: "Rol y características", summary: "Tipo de organización, rol principal, otros roles, alcance y líneas de trabajo.", modules: "Módulo 2 · P10–P12" },
  { id: "territorio", title: "Territorio", summary: "Zonas de Barranquilla A.M. donde tienes incidencia y tu sede.", modules: "Módulo 2 · P13" },
  { id: "enfoque", title: "Enfoque estratégico", summary: "Áreas de impacto y problemáticas que atiendes.", modules: "Módulo 3 · P14–P21" },
  { id: "relaciones", title: "Alianzas", summary: "Con quién trabajas como socio, aliado o colaborador.", modules: "Módulo 4 · P22–P27" },
  { id: "programas", title: "Proyectos y resultados", summary: "Hasta 3 proyectos activos con población, metas y resultados.", modules: "Módulo 9" },
  { id: "fortalecimiento", title: "Fortalecimiento y visión", summary: "Tu experiencia en el Colaborativo (escala 1 a 10).", modules: "Módulos 5–7 · P28–P37" },
  { id: "acciones", title: "Acciones del ecosistema", summary: "Inversión social estimada e incidencia en política.", modules: "Módulo 8 · P38–P40" },
  { id: "consentimiento", title: "Revisión y autorización", summary: "Revisa todo, autoriza el tratamiento de datos y envía.", modules: "P43" },
] as const;

export type StepId = (typeof registrationSteps)[number]["id"];

export type ProgramDraft = {
  id?: string;
  name: string;
  description: string;
  modality_code: string;
  primary_area_code: string;
  area_codes: string[];
  population_codes: string[];
  territory_codes: string[];
  start_date: string;
  end_date: string;
  annual_goal: string;
  resultados: {
    atendidos: string;
    atendidos_mujeres: string;
    fortalecidos: string;
    fortalecidos_mujeres: string;
    empleo: string;
    empleo_mujeres: string;
    emprendimiento: string;
    emprendimiento_mujeres: string;
  };
};

export type RegistrationPayload = {
  identificacion: {
    name: string;
    description: string;
    mission: string;
    has_nit: boolean | null;
    nit: string;
    website: string;
    contact_email_public: string;
    social: { instagram?: string; linkedin?: string; facebook?: string };
  };
  contacto: { name: string; position: string; phone: string; email: string; address: string };
  caracterizacion: { org_type_code: string; primary_role_code: string; role_codes: string[]; scope_code: string; work_line_codes: string[] };
  territorio: { territory_codes: string[]; location_territory_code: string; municipality: string };
  enfoque: { area_codes: string[]; problem_codes: string[]; problem_other: Record<string, string> };
  relaciones: { relation_type_code: string; target_org_id: string; target_name_free: string }[];
  programas: ProgramDraft[];
  fortalecimiento: {
    tenure_code: string;
    goyn_space_codes: string[];
    alliances: number | null;
    design_capacity: number | null;
    visibility: number | null;
    youth_involvement: number | null;
    shared_vision: number | null;
  };
  acciones: { social_investment_cop: string; policy_contribution: string; policy_flag: "si" | "no" | "no_sabe" | "" };
  gestion_datos: string;
  consentimiento: { accepted: boolean; version: string };
};

export const emptyProgram = (): ProgramDraft => ({
  name: "",
  description: "",
  modality_code: "",
  primary_area_code: "",
  area_codes: [],
  population_codes: [],
  territory_codes: [],
  start_date: "",
  end_date: "",
  annual_goal: "",
  resultados: {
    atendidos: "", atendidos_mujeres: "", fortalecidos: "", fortalecidos_mujeres: "",
    empleo: "", empleo_mujeres: "", emprendimiento: "", emprendimiento_mujeres: "",
  },
});

export const emptyPayload = (): RegistrationPayload => ({
  identificacion: { name: "", description: "", mission: "", has_nit: null, nit: "", website: "", contact_email_public: "", social: {} },
  contacto: { name: "", position: "", phone: "", email: "", address: "" },
  caracterizacion: { org_type_code: "", primary_role_code: "", role_codes: [], scope_code: "", work_line_codes: [] },
  territorio: { territory_codes: [], location_territory_code: "", municipality: "" },
  enfoque: { area_codes: [], problem_codes: [], problem_other: {} },
  relaciones: [],
  programas: [emptyProgram()],
  fortalecimiento: { tenure_code: "", goyn_space_codes: [], alliances: null, design_capacity: null, visibility: null, youth_involvement: null, shared_vision: null },
  acciones: { social_investment_cop: "", policy_contribution: "", policy_flag: "" },
  gestion_datos: "",
  consentimiento: { accepted: false, version: "2026-09" },
});

// Validación por paso: devuelve { campo: mensaje }. Un borrador puede estar incompleto;
// el envío exige todos los pasos válidos (arquitectura de datos §7 "Completitud").
export function validateStep(step: StepId, p: RegistrationPayload): Record<string, string> {
  const e: Record<string, string> = {};
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  switch (step) {
    case "identificacion":
      if (!p.identificacion.name.trim()) e.name = "Escribe el nombre de la organización.";
      if (!p.identificacion.description.trim()) e.description = "Cuéntanos quiénes son y qué hacen.";
      else if (p.identificacion.description.trim().split(/\s+/).length > 200) e.description = "Máximo 200 palabras.";
      if (p.identificacion.has_nit === null) e.has_nit = "Indica si la organización tiene NIT.";
      if (p.identificacion.has_nit && !/^[0-9.\-]{6,15}$/.test(p.identificacion.nit)) e.nit = "Escribe un NIT válido (solo números, puntos o guion).";
      if (!p.contacto.name.trim()) e.contact_name = "Escribe el nombre del contacto estratégico.";
      if (!p.contacto.position.trim()) e.contact_position = "Escribe el cargo.";
      if (!/^[0-9+ ]{7,20}$/.test(p.contacto.phone)) e.contact_phone = "Escribe un celular válido (solo números).";
      if (!email.test(p.identificacion.contact_email_public)) e.contact_email_public = "Escribe un correo válido.";
      break;
    case "caracterizacion":
      if (!p.caracterizacion.org_type_code) e.org_type_code = "Selecciona el tipo de organización.";
      if (!p.caracterizacion.primary_role_code) e.primary_role_code = "Selecciona el rol principal.";
      break;
    case "territorio":
      if (!p.territorio.territory_codes.length) e.territory_codes = "Selecciona al menos una zona.";
      if (!p.territorio.location_territory_code) e.location_territory_code = "Indica la zona de tu sede principal.";
      break;
    case "enfoque":
      if (!p.enfoque.area_codes.length) e.area_codes = "Selecciona al menos un área de impacto.";
      break;
    case "programas":
      p.programas.forEach((prog, i) => {
        const k = `programas.${i}`;
        if (!prog.name.trim()) e[`${k}.name`] = "Nombre del proyecto requerido.";
        if (!prog.description.trim()) e[`${k}.description`] = "Describe el proyecto.";
        if (!prog.population_codes.length) e[`${k}.population_codes`] = "Selecciona la población objetivo.";
        if (!prog.territory_codes.length) e[`${k}.territory_codes`] = "Selecciona dónde se implementa.";
        if (!prog.modality_code) e[`${k}.modality_code`] = "Selecciona la modalidad.";
        if (!prog.primary_area_code) e[`${k}.primary_area_code`] = "Selecciona el área principal.";
        if (!prog.start_date) e[`${k}.start_date`] = "Indica la fecha de inicio.";
        if (prog.end_date && prog.start_date && prog.end_date < prog.start_date) e[`${k}.end_date`] = "La fecha de cierre no puede ser anterior al inicio.";
        const n = (v: string) => (v === "" ? 0 : Number(v));
        if (n(prog.resultados.atendidos_mujeres) > n(prog.resultados.atendidos)) e[`${k}.atendidos_mujeres`] = "No puede superar el total atendido.";
        if (n(prog.resultados.fortalecidos) > n(prog.resultados.atendidos)) e[`${k}.fortalecidos`] = "No puede superar el total atendido.";
      });
      break;
    case "fortalecimiento":
      if (!p.fortalecimiento.tenure_code) e.tenure_code = "Indica hace cuánto participas en el Colaborativo.";
      break;
    case "consentimiento":
      if (!p.consentimiento.accepted) e.accepted = "Debes autorizar el tratamiento de datos para enviar.";
      break;
  }
  return e;
}
