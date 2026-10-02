import "server-only";
import { cache } from "react";
import { isDemoSession } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { label as catalogLabel, type CatalogName } from "@/lib/catalogs";
import { matchesFilters } from "@/lib/filters";
import type { LiveEvent, LiveSnapshot, TerritoryTotals } from "@/lib/live/types";
import { createClient } from "@/lib/supabase/server";
import type {
  ChangeRequestSummary,
  EcosystemFilters,
  EcosystemStats,
  IndicatorReport,
  PublicOrganization,
  PublicProgram,
  PublicRelation,
} from "@/lib/types";

// Repositorio único para las vistas. Con Supabase configurado consulta las vistas públicas
// (lista blanca, solo publicado); sin él, lee el conjunto sintético de demostración.
// Las vistas nunca importan Supabase ni el JSON demo directamente: siempre pasan por aquí.

const loadDemo = cache(async () => {
  const data = (await import("@/lib/demo/demo-data.json")).default;
  return data as unknown as {
    organizations: PublicOrganization[];
    programs: PublicProgram[];
    relations: PublicRelation[];
    reports: IndicatorReport[];
    sampleRequests: ChangeRequestSummary[];
  };
});

export const listOrganizations = cache(async (filters: EcosystemFilters = {}): Promise<PublicOrganization[]> => {
  if (!isSupabaseConfigured) {
    const { organizations } = await loadDemo();
    return organizations.filter((o) => matchesFilters(o, filters)).sort((a, b) => a.name.localeCompare(b.name, "es"));
  }
  const supabase = await createClient();
  let query = supabase.from("v_public_organization").select("*").order("name");
  if (filters.q) query = query.or(`name.ilike.%${filters.q.replace(/[%,()]/g, "")}%,description.ilike.%${filters.q.replace(/[%,()]/g, "")}%`);
  if (filters.tipo?.length) query = query.in("org_type_code", filters.tipo);
  if (filters.rol?.length) query = query.overlaps("role_codes", filters.rol);
  if (filters.area?.length) query = query.overlaps("area_codes", filters.area);
  if (filters.poblacion?.length) query = query.overlaps("population_codes", filters.poblacion);
  if (filters.territorio?.length) query = query.overlaps("territory_codes", filters.territorio);
  if (filters.linea?.length) query = query.overlaps("work_line_codes", filters.linea);
  const { data, error } = await query;
  if (error) throw error;
  return data as PublicOrganization[];
});

export const getOrganization = cache(async (slug: string) => {
  if (!isSupabaseConfigured) {
    const { organizations } = await loadDemo();
    return organizations.find((o) => o.slug === slug) ?? null;
  }
  const supabase = await createClient();
  const { data } = await supabase.from("v_public_organization").select("*").eq("slug", slug).maybeSingle();
  return (data as PublicOrganization | null) ?? null;
});

export const listPrograms = cache(async (organizationId?: string): Promise<PublicProgram[]> => {
  if (!isSupabaseConfigured) {
    const { programs } = await loadDemo();
    return organizationId ? programs.filter((p) => p.organization_id === organizationId) : programs;
  }
  const supabase = await createClient();
  let query = supabase.from("v_public_program").select("*").order("name");
  if (organizationId) query = query.eq("organization_id", organizationId);
  const { data, error } = await query;
  if (error) throw error;
  return data as PublicProgram[];
});

export const listRelations = cache(async (organizationId?: string): Promise<PublicRelation[]> => {
  if (!isSupabaseConfigured) {
    const { relations } = await loadDemo();
    return organizationId
      ? relations.filter((r) => r.source_org_id === organizationId || r.target_org_id === organizationId)
      : relations;
  }
  const supabase = await createClient();
  let query = supabase.from("v_public_relation").select("*");
  if (organizationId) query = query.or(`source_org_id.eq.${organizationId},target_org_id.eq.${organizationId}`);
  const { data, error } = await query;
  if (error) throw error;
  return data as PublicRelation[];
});

export const listIndicatorReports = cache(async (organizationId?: string): Promise<IndicatorReport[]> => {
  if (!isSupabaseConfigured) {
    const { reports } = await loadDemo();
    return organizationId ? reports.filter((r) => r.organization_id === organizationId) : reports;
  }
  const supabase = await createClient();
  let query = supabase.from("v_public_indicator_report").select("*").order("period_start");
  if (organizationId) query = query.eq("organization_id", organizationId);
  const { data, error } = await query;
  if (error) throw error;
  return data as IndicatorReport[];
});

export const getEcosystemStats = cache(async (): Promise<EcosystemStats> => {
  if (!isSupabaseConfigured) {
    const { organizations, programs, relations, reports } = await loadDemo();
    const sum = (code: string) => reports.filter((r) => r.indicator_code === code).reduce((n, r) => n + r.value, 0);
    return {
      organizations: organizations.length,
      programs: programs.length,
      connections: relations.length,
      conectados: sum("conectados"),
      fortalecidos: sum("fortalecidos"),
      transformados: sum("transformados"),
      indicators_updated_at: "2026-09-01T12:00:00Z",
    };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("v_ecosystem_stats").select("*").single();
  if (error) throw error;
  return data as EcosystemStats;
});

// ─── Consola GOYN y panel ────────────────────────────────────────────────────
// Datos privados: en el recorrido demo (o sin base) salen del conjunto de ejemplo.
const usePrivateDemo = async () => !isSupabaseConfigured || (await isDemoSession());

export const listChangeRequests = cache(async (): Promise<ChangeRequestSummary[]> => {
  if (await usePrivateDemo()) return (await loadDemo()).sampleRequests;
  const supabase = await createClient();
  const [{ data, error }, { data: reports }] = await Promise.all([
    supabase
      .from("change_request")
      .select("id, entity_type, status, submitted_at, entity_id, payload")
      .in("status", ["enviada", "ajustes_solicitados"])
      .order("submitted_at", { ascending: true }),
    // Reportes de indicador enviados desde el panel (FR-011): se revisan en la misma bandeja.
    supabase
      .from("indicator_report")
      .select("id, created_at, period_label, organization:organization(name, org_type_code, slug)")
      .eq("status", "enviado")
      .order("created_at", { ascending: true }),
  ]);
  if (error) throw error;
  const requests: ChangeRequestSummary[] = (data ?? []).map((r) => ({
    id: r.id,
    entity_type: r.entity_type,
    status: r.status,
    submitted_at: r.submitted_at,
    organization_name: r.payload?.identificacion?.name ?? "Sin nombre",
    org_type_code: r.payload?.caracterizacion?.org_type_code ?? "",
    territory: r.payload?.territorio?.location_territory_code ?? "",
    kind: r.entity_type === "reporte_indicador" ? "indicador" : r.entity_id ? "actualizacion" : "alta",
  }));
  const pendingReports: ChangeRequestSummary[] = (reports ?? []).map((r) => {
    const org = r.organization as unknown as { name: string; org_type_code: string } | null;
    return {
      id: `rep_${r.id}`,
      entity_type: "reporte_indicador",
      status: "enviada",
      submitted_at: r.created_at,
      organization_name: org?.name ?? "Organización",
      org_type_code: org?.org_type_code ?? "",
      territory: "",
      kind: "indicador",
    };
  });
  return [...requests, ...pendingReports].sort((a, b) => a.submitted_at.localeCompare(b.submitted_at));
});

type FieldChange = { field: string; before: string; after: string };

// Detalle de una solicitud para la vista de cambios (FR-007). En modo conectado compara la
// propuesta con la versión publicada: solo se muestran los campos que cambian.
export const getChangeRequestDetail = cache(async (id: string): Promise<(ChangeRequestSummary & { changes: FieldChange[] }) | null> => {
  const summary = (await listChangeRequests()).find((r) => r.id === id);
  if (!summary) return null;
  if (await usePrivateDemo()) return { ...summary, changes: summary.changes ?? [] };

  const supabase = await createClient();
  const list = (codes: string[] | undefined, catalog: CatalogName) => (codes ?? []).map((c) => catalogLabel(catalog, c)).join(", ") || "—";

  if (id.startsWith("rep_")) {
    const { data } = await supabase.from("indicator_report").select("*, program:program(name)").eq("id", id.slice(4)).single();
    if (!data) return null;
    return {
      ...summary,
      changes: [
        { field: "Programa", before: "", after: (data.program as { name: string } | null)?.name ?? "—" },
        { field: "Indicador", before: "", after: catalogLabel("indicators", data.indicator_code) },
        { field: "Periodo", before: "", after: data.period_label },
        { field: "Valor reportado", before: "", after: String(data.value ?? `Sin dato: ${data.null_reason ?? ""}`) },
        { field: "Fuente", before: "", after: data.source ?? "—" },
      ],
    };
  }

  const { data: req } = await supabase.from("change_request").select("payload, entity_id").eq("id", id).single();
  const p = req?.payload ?? {};
  const current = req?.entity_id ? await getOrganizationById(req.entity_id) : null;
  const proposed: FieldChange[] = [
    { field: "Nombre", before: current?.name ?? "", after: p.identificacion?.name ?? "" },
    { field: "Descripción", before: current?.description ?? "", after: p.identificacion?.description ?? "" },
    { field: "Misión", before: current?.mission ?? "", after: p.identificacion?.mission ?? "" },
    { field: "Correo público", before: current?.contact_email_public ?? "", after: p.identificacion?.contact_email_public ?? "" },
    { field: "Sitio web", before: current?.website ?? "", after: p.identificacion?.website ?? "" },
    { field: "Tipo de organización", before: current ? catalogLabel("orgTypes", current.org_type_code) : "", after: catalogLabel("orgTypes", p.caracterizacion?.org_type_code) },
    { field: "Rol principal", before: current ? catalogLabel("roles", current.primary_role_code) : "", after: catalogLabel("roles", p.caracterizacion?.primary_role_code) },
    { field: "Otros roles", before: current ? list(current.role_codes, "roles") : "", after: list(p.caracterizacion?.role_codes, "roles") },
    { field: "Líneas de trabajo", before: current ? list(current.work_line_codes, "workLines") : "", after: list(p.caracterizacion?.work_line_codes, "workLines") },
    { field: "Territorios", before: current ? list(current.territory_codes, "territories") : "", after: list(p.territorio?.territory_codes, "territories") },
    { field: "Áreas de impacto", before: current ? list(current.area_codes, "impactAreas") : "", after: list(p.enfoque?.area_codes, "impactAreas") },
    {
      field: "Proyectos",
      before: current ? (await listPrograms(current.id)).map((x) => x.name).join(", ") || "—" : "",
      after: (p.programas ?? []).map((x: { name: string }) => x.name).join(", ") || "—",
    },
    { field: "Alianzas declaradas", before: "", after: `${(p.relaciones ?? []).length} relaciones` },
  ];
  // Registro nuevo: se muestra todo lo propuesto. Actualización: solo lo que cambia.
  const changes = current ? proposed.filter((c) => c.before !== c.after) : proposed.filter((c) => c.after && c.after !== "—");
  return { ...summary, changes };
});

export const getOrganizationById = cache(async (id: string): Promise<PublicOrganization | null> => {
  if (!isSupabaseConfigured) return (await loadDemo()).organizations.find((o) => o.id === id) ?? null;
  const supabase = await createClient();
  const { data } = await supabase.from("v_public_organization").select("*").eq("id", id).maybeSingle();
  return (data as PublicOrganization | null) ?? null;
});

// Organización del usuario en sesión (panel). En demo se usa la primera organización sintética.
export const getOwnOrganization = cache(async (organizationIds: string[]): Promise<PublicOrganization | null> => {
  if (await usePrivateDemo()) {
    const { organizations } = await loadDemo();
    return organizations.find((o) => o.slug === "fundacion-semillas-del-caribe") ?? organizations[0];
  }
  if (!organizationIds.length) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("v_public_organization").select("*").eq("id", organizationIds[0]).maybeSingle();
  return (data as PublicOrganization | null) ?? null;
});

// ─── Datos en vivo ──────────────────────────────────────────────────────────
// Instantánea que alimenta contadores, ticker, mapa y globo. En el cliente se mantiene al día
// con el simulador (demo) o con Supabase Realtime + /api/ecosistema (ver src/lib/live).
export const getLiveSnapshot = cache(async (): Promise<LiveSnapshot> => {
  const [stats, orgs, reports] = await Promise.all([getEcosystemStats(), listOrganizations(), listIndicatorReports()]);
  const territories: Record<string, TerritoryTotals> = {};
  const bucket = (code: string) => (territories[code] ??= { orgs: 0, conectados: 0, fortalecidos: 0, transformados: 0 });
  for (const o of orgs) for (const t of o.territory_codes) bucket(t).orgs += 1;
  for (const r of reports) for (const t of r.territory_codes) bucket(t)[r.indicator_code] += r.value;

  const bySlug = new Map(orgs.map((o) => [o.slug, o]));
  const latest = [...reports].sort((a, b) => b.period_start.localeCompare(a.period_start)).slice(0, 12);
  const events: LiveEvent[] = latest.map((r) => {
    const o = bySlug.get(r.organization_slug);
    return {
      id: r.id,
      at: r.period_end,
      kind: "reporte",
      orgSlug: r.organization_slug,
      orgName: o?.name ?? r.organization_slug,
      territory: o?.location_territory_code ?? null,
      lat: o?.lat ?? null,
      lng: o?.lng ?? null,
      indicator: r.indicator_code,
      delta: r.value,
      historic: true,
    };
  });

  return {
    stats,
    territories,
    orgs: orgs.map((o) => ({
      id: o.id,
      slug: o.slug,
      name: o.name,
      territory: o.location_territory_code,
      role: o.primary_role_code,
      lat: o.lat,
      lng: o.lng,
    })),
    events,
    source: isSupabaseConfigured ? "supabase" : "demo",
  };
});
