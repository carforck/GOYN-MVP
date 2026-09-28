import "server-only";
import { label } from "@/lib/catalogs";
import { listIndicatorReports, listOrganizations, listPrograms } from "@/lib/data";

// Conjuntos exportables (FR-012). Solo datos publicados; los contactos privados nunca se exportan
// desde aquí. En modo conectado, cada exportación se registra en export_job y audit_log.
export const datasets = {
  organizaciones: "Organizaciones publicadas",
  programas: "Programas y proyectos",
  indicadores: "Reportes de indicador aprobados",
} as const;
export type Dataset = keyof typeof datasets;

export async function buildRows(dataset: Dataset): Promise<{ columns: string[]; rows: (string | number)[][] }> {
  if (dataset === "organizaciones") {
    const orgs = await listOrganizations();
    return {
      columns: ["Nombre", "Tipo", "Rol principal", "Otros roles", "Áreas de impacto", "Territorios", "Correo público", "Programas", "Conexiones", "Actualizado", "Demo"],
      rows: orgs.map((o) => [
        o.name, o.org_type_label, o.primary_role_label,
        o.role_codes.filter((r) => r !== o.primary_role_code).map((r) => label("roles", r)).join("; "),
        o.area_codes.map((a) => label("impactAreas", a)).join("; "),
        o.territory_codes.map((t) => label("territories", t)).join("; "),
        o.contact_email_public ?? "", o.programs_count, o.connections_count, o.updated_at.slice(0, 10), o.is_demo ? "sí" : "no",
      ]),
    };
  }
  if (dataset === "programas") {
    const programs = await listPrograms();
    return {
      columns: ["Programa", "Organización", "Área principal", "Modalidad", "Poblaciones", "Territorios", "Inicio", "Fin", "Meta anual"],
      rows: programs.map((p) => [
        p.name, p.organization_name, label("impactAreas", p.primary_area_code), label("modalities", p.modality_code),
        p.population_codes.map((c) => label("populations", c)).join("; "), p.territory_codes.map((c) => label("territories", c)).join("; "),
        p.start_date, p.end_date ?? "", p.annual_goal ?? "",
      ]),
    };
  }
  const reports = await listIndicatorReports();
  return {
    columns: ["Organización", "Programa", "Indicador", "Periodo", "Inicio", "Fin", "Valor", "Mujeres", "Fuente"],
    rows: reports.map((r) => [
      r.organization_slug, r.program_id ?? "", label("indicators", r.indicator_code), r.period_label, r.period_start, r.period_end,
      r.value, r.value_women ?? "", r.source ?? "",
    ]),
  };
}

export function toCsv(columns: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",;\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  // BOM para que Excel abra correctamente tildes y eñes.
  return "﻿" + [columns, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
}
