// Estructura del formulario de registro: los 9 módulos del Instrumento de mapeo agrupados en
// pasos (flujo de usuario D2). El payload resultante cumple el contrato documentado en
// backend/supabase/migrations/..._flujo_editorial.sql.

export const registrationSteps = [
  { id: "identificacion", title: "Identificación y contacto", summary: "Nombre, descripción, NIT (opcional) y contacto estratégico.", modules: "Módulo 1 · P1–P9" },
  { id: "caracterizacion", title: "Rol y características", summary: "Tipo de organización, rol principal, otros roles y alcance.", modules: "Módulo 2 · P10–P12" },
  { id: "territorio", title: "Territorio", summary: "Zonas de Barranquilla y su área metropolitana donde tienes incidencia y tu sede.", modules: "Módulo 2 · P13" },
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
  caracterizacion: { org_type_code: string; primary_role_code: string; role_codes: string[]; scope_code: string; work_line_codes?: string[] };
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
  consentimiento: { accepted: false, version: CONSENT_VERSION },
});

// Versión del texto de autorización (P43). "2026-10-29": texto oficial completo entregado por GOYN
// (Fundación Corona, NIT 860.008.052-1). Se fija al enviar, para que quede la versión aceptada.
export const CONSENT_VERSION = "2026-10-29";

// Límites de la base (backend/supabase/migrations/..._nucleo.sql): si el formulario no los respeta,
// la aprobación de GOYN falla con un error de restricción.
const MAX_DESCRIPTION_CHARS = 2000; // organization.description check (char_length <= 2000)
const MAX_RESULT_DIGITS = 12; // indicator_report.value numeric(12, 0)
const MAX_GOAL = 2_147_483_647; // program.annual_goal int
const MAX_INVESTMENT_DIGITS = 16; // organization.social_investment_cop numeric(18, 2)

export const isIngresosProgram = (prog: ProgramDraft) => prog.primary_area_code === "ingresos";

// Ajusta el payload antes de enviarlo (cliente y servidor):
// · las preguntas de empleo/emprendimiento solo aplican al área "ingresos" (si el área cambió,
//   los valores ocultos no deben sumar "transformados" ni romper la validación);
// · el correo privado de contacto usa el público si se deja vacío (organization_private.contact_email);
// · registra la versión vigente del texto de autorización.
export function normalizePayload(input: RegistrationPayload): RegistrationPayload {
  const p = structuredClone(input);
  p.contacto.email = (p.contacto.email ?? "").trim() || p.identificacion.contact_email_public.trim();
  p.identificacion.contact_email_public = p.identificacion.contact_email_public.trim();
  p.identificacion.nit = p.identificacion.has_nit ? p.identificacion.nit.trim() : "";
  p.relaciones = p.relaciones.filter((r) => r.relation_type_code && (r.target_org_id || r.target_name_free?.trim()));
  p.programas = p.programas.map((prog) =>
    isIngresosProgram(prog)
      ? prog
      : { ...prog, resultados: { ...prog.resultados, empleo: "", empleo_mujeres: "", emprendimiento: "", emprendimiento_mujeres: "" } },
  );
  if (p.consentimiento.accepted) p.consentimiento.version = CONSENT_VERSION;
  return p;
}

// Valida todos los pasos; devuelve los errores y el primer paso con problemas (o -1).
export function validateAll(p: RegistrationPayload): { errors: Record<string, string>; firstStep: number } {
  let firstStep = -1;
  const errors: Record<string, string> = {};
  registrationSteps.forEach((s, i) => {
    const e = validateStep(s.id, p);
    if (Object.keys(e).length && firstStep < 0) firstStep = i;
    Object.assign(errors, e);
  });
  return { errors, firstStep };
}

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
      else if (p.identificacion.description.trim().length > MAX_DESCRIPTION_CHARS) e.description = `Máximo ${MAX_DESCRIPTION_CHARS} caracteres (hoy tiene ${p.identificacion.description.trim().length}).`;
      if (p.identificacion.has_nit === null) e.has_nit = "Indica si la organización tiene NIT.";
      if (p.identificacion.has_nit && !/^[0-9.\-]{6,15}$/.test(p.identificacion.nit.trim())) e.nit = "Escribe un NIT válido (solo números, puntos o guion).";
      if (!p.contacto.name.trim()) e.contact_name = "Escribe el nombre del contacto estratégico.";
      if (!p.contacto.position.trim()) e.contact_position = "Escribe el cargo.";
      if (!/^[0-9+ ]{7,20}$/.test(p.contacto.phone)) e.contact_phone = "Escribe un celular válido (solo números).";
      if (!email.test(p.identificacion.contact_email_public.trim())) e.contact_email_public = "Escribe un correo válido.";
      if ((p.contacto.email ?? "").trim() && !email.test(p.contacto.email.trim())) e.contact_email = "Escribe un correo válido o déjalo vacío.";
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
    case "relaciones":
      p.relaciones.forEach((r, i) => {
        if (!r.relation_type_code || !(r.target_org_id || r.target_name_free?.trim())) e[`relaciones.${i}`] = "Hay una alianza sin organización: quítala y vuelve a agregarla.";
      });
      break;
    case "programas":
      if (!p.programas.length) e.programas = "Registra al menos un proyecto.";
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
        const iso = /^\d{4}-\d{2}-\d{2}$/;
        if (prog.start_date && !iso.test(prog.start_date)) e[`${k}.start_date`] = "Fecha no válida.";
        if (prog.end_date && !iso.test(prog.end_date)) e[`${k}.end_date`] = "Fecha no válida.";
        if (prog.annual_goal !== "" && (!/^\d+$/.test(prog.annual_goal) || Number(prog.annual_goal) > MAX_GOAL)) e[`${k}.annual_goal`] = "Escribe solo números enteros (0 si no sabes).";
        const r = prog.resultados;
        // Cada valor: entero ≥ 0 de hasta 12 dígitos (indicator_report.value numeric(12,0), check >= 0).
        const keys = ["atendidos", "atendidos_mujeres", "fortalecidos", "fortalecidos_mujeres",
          ...(isIngresosProgram(prog) ? (["empleo", "empleo_mujeres", "emprendimiento", "emprendimiento_mujeres"] as const) : [])] as const;
        for (const key of keys) {
          const v = r[key] ?? "";
          if (v !== "" && !new RegExp(`^\\d{1,${MAX_RESULT_DIGITS}}$`).test(v)) e[`${k}.${key}`] = "Escribe solo números enteros.";
        }
        const n = (v: string | undefined) => (!v ? 0 : Number(v));
        // "Mujeres" nunca puede superar el total de su fila (constraint indicator_report_women).
        const women = (total: keyof ProgramDraft["resultados"], part: keyof ProgramDraft["resultados"], msg: string) => {
          if (!e[`${k}.${part}`] && n(r[part]) > n(r[total])) e[`${k}.${part}`] = msg;
        };
        women("atendidos", "atendidos_mujeres", "Las mujeres no pueden superar el total de jóvenes atendidos.");
        women("fortalecidos", "fortalecidos_mujeres", "Las mujeres no pueden superar el total de jóvenes fortalecidos.");
        if (isIngresosProgram(prog)) {
          women("empleo", "empleo_mujeres", "Las mujeres no pueden superar el total que accedió a empleo.");
          women("emprendimiento", "emprendimiento_mujeres", "Las mujeres no pueden superar el total de emprendimientos.");
        }
        if (!e[`${k}.fortalecidos`] && n(r.fortalecidos) > n(r.atendidos)) e[`${k}.fortalecidos`] = "No puede superar el total de jóvenes atendidos.";
      });
      break;
    case "fortalecimiento":
      if (!p.fortalecimiento.tenure_code) e.tenure_code = "Indica hace cuánto participas en el Colaborativo.";
      for (const key of ["alliances", "design_capacity", "visibility", "youth_involvement", "shared_vision"] as const) {
        const v = p.fortalecimiento[key];
        if (v !== null && !(Number.isInteger(v) && v >= 1 && v <= 10)) e[key] = "Elige un valor de 1 a 10.";
      }
      break;
    case "acciones":
      if (p.acciones.social_investment_cop && !new RegExp(`^\\d{1,${MAX_INVESTMENT_DIGITS}}$`).test(p.acciones.social_investment_cop))
        e.social_investment_cop = "Escribe solo números, sin puntos ni signos.";
      break;
    case "consentimiento":
      if (!p.consentimiento.accepted) e.accepted = "Debes autorizar el tratamiento de datos para enviar.";
      break;
  }
  return e;
}
