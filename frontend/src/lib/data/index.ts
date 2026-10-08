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
  OwnProgram,
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

// Supabase (PostgREST) entrega como máximo 1.000 filas por consulta: se pagina para no perder datos
// en silencio (hay más de 1.000 reportes de indicador). `build` arma la consulta para cada página.
const PAGE = 1000;
async function fetchAll<T>(build: () => { range: (from: number, to: number) => PromiseLike<{ data: unknown; error: unknown }> }): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build().range(from, from + PAGE - 1);
    if (error) throw error;
    const page = (data ?? []) as T[];
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
}

export const listOrganizations = cache(async (filters: EcosystemFilters = {}): Promise<PublicOrganization[]> => {
  if (!isSupabaseConfigured) {
    const { organizations } = await loadDemo();
    return organizations.filter((o) => matchesFilters(o, filters)).sort((a, b) => a.name.localeCompare(b.name, "es"));
  }
  const supabase = await createClient();
  return fetchAll<PublicOrganization>(() => {
    let query = supabase.from("v_public_organization").select("*").order("name").order("id");
    if (filters.q) query = query.or(`name.ilike.%${filters.q.replace(/[%,()]/g, "")}%,description.ilike.%${filters.q.replace(/[%,()]/g, "")}%`);
  if (filters.tipo?.length) query = query.in("org_type_code", filters.tipo);
  if (filters.rol?.length) query = query.overlaps("role_codes", filters.rol);
  if (filters.area?.length) query = query.overlaps("area_codes", filters.area);
  if (filters.poblacion?.length) query = query.overlaps("population_codes", filters.poblacion);
  if (filters.territorio?.length) query = query.overlaps("territory_codes", filters.territorio);
  if (filters.linea?.length) query = query.overlaps("work_line_codes", filters.linea);
    return query;
  });
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
  return fetchAll<PublicProgram>(() => {
    const query = supabase.from("v_public_program").select("*").order("name").order("id");
    return organizationId ? query.eq("organization_id", organizationId) : query;
  });
});

export const listRelations = cache(async (organizationId?: string): Promise<PublicRelation[]> => {
  if (!isSupabaseConfigured) {
    const { relations } = await loadDemo();
    return organizationId
      ? relations.filter((r) => r.source_org_id === organizationId || r.target_org_id === organizationId)
      : relations;
  }
  const supabase = await createClient();
  return fetchAll<PublicRelation>(() => {
    const query = supabase.from("v_public_relation").select("*").order("id");
    return organizationId ? query.or(`source_org_id.eq.${organizationId},target_org_id.eq.${organizationId}`) : query;
  });
});

export const listIndicatorReports = cache(async (organizationId?: string): Promise<IndicatorReport[]> => {
  if (!isSupabaseConfigured) {
    const { reports } = await loadDemo();
    return organizationId ? reports.filter((r) => r.organization_id === organizationId) : reports;
  }
  const supabase = await createClient();
  return fetchAll<IndicatorReport>(() => {
    const query = supabase.from("v_public_indicator_report").select("*").order("period_start").order("id");
    return organizationId ? query.eq("organization_id", organizationId) : query;
  });
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
      .select("id, entity_type, status, submitted_at, entity_id, payload, organization:organization(name, org_type_code)")
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
  const requests: ChangeRequestSummary[] = (data ?? []).map((r) => {
    const org = r.organization as unknown as { name: string; org_type_code: string } | null;
    const program = r.entity_type === "programa";
    return {
      id: r.id,
      entity_type: r.entity_type,
      status: r.status,
      submitted_at: r.submitted_at,
      organization_name: program ? `${org?.name ?? "Organización"} · ${r.payload?.name ?? "Programa"}` : (r.payload?.identificacion?.name ?? "Sin nombre"),
      org_type_code: program ? (org?.org_type_code ?? "") : (r.payload?.caracterizacion?.org_type_code ?? ""),
      territory: r.payload?.territorio?.location_territory_code ?? "",
      kind: r.entity_type === "reporte_indicador" ? "indicador" : program ? "programa" : r.entity_id ? "actualizacion" : "alta",
    };
  });
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

  const { data: req } = await supabase.from("change_request").select("payload, entity_id, entity_type").eq("id", id).single();

  // Programa: compara con la versión publicada del programa (o muestra todo si es nuevo).
  if (req?.entity_type === "programa") {
    const p = req.payload ?? {};
    const { data: cur } = req.entity_id
      ? await supabase.from("program").select("*, program_area(area_code), program_population(population_code), program_territory(territory_code)").eq("id", req.entity_id).maybeSingle()
      : { data: null };
    const codes = (rows: Record<string, string>[] | undefined, key: string) => (rows ?? []).map((x) => x[key]);
    const fields: FieldChange[] = [
      { field: "Nombre del programa", before: cur?.name ?? "", after: p.name ?? "" },
      { field: "Descripción", before: cur?.description ?? "", after: p.description ?? "" },
      { field: "Modalidad", before: cur ? catalogLabel("modalities", cur.modality_code) : "", after: catalogLabel("modalities", p.modality_code) },
      { field: "Área principal", before: cur ? catalogLabel("impactAreas", cur.primary_area_code) : "", after: catalogLabel("impactAreas", p.primary_area_code) },
      { field: "Otras áreas", before: cur ? list(codes(cur.program_area, "area_code"), "impactAreas") : "", after: list(p.area_codes, "impactAreas") },
      { field: "Población", before: cur ? list(codes(cur.program_population, "population_code"), "populations") : "", after: list(p.population_codes, "populations") },
      { field: "Territorios", before: cur ? list(codes(cur.program_territory, "territory_code"), "territories") : "", after: list(p.territory_codes, "territories") },
      { field: "Vigencia", before: cur ? `${cur.start_date} – ${cur.end_date ?? "sin cierre"}` : "", after: `${p.start_date ?? ""} – ${p.end_date || "sin cierre"}` },
      { field: "Meta anual", before: cur?.annual_goal != null ? String(cur.annual_goal) : "", after: p.annual_goal != null && p.annual_goal !== "" ? String(p.annual_goal) : "" },
      { field: "Enlace", before: cur?.link ?? "", after: p.link ?? "" },
    ];
    return { ...summary, changes: cur ? fields.filter((c) => c.before !== c.after) : fields.filter((c) => c.after && c.after !== "—") };
  }
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

// Programas de la organización para su panel: incluye los ocultos y si hay un cambio en revisión.
export const listOwnPrograms = cache(async (organizationId: string): Promise<OwnProgram[]> => {
  if (await usePrivateDemo()) {
    const { programs } = await loadDemo();
    return programs.filter((p) => p.organization_id === organizationId).map((p) => ({ ...p, is_visible: true, pending: false, version: 1 }));
  }
  const supabase = await createClient();
  const [{ data, error }, { data: pending }] = await Promise.all([
    supabase
      .from("program")
      .select("id, organization_id, name, description, modality_code, primary_area_code, start_date, end_date, annual_goal, link, is_visible, version, program_area(area_code), program_population(population_code), program_territory(territory_code)")
      .eq("organization_id", organizationId)
      .eq("status", "publicado")
      .order("name"),
    supabase.from("change_request").select("entity_id").eq("entity_type", "programa").eq("organization_id", organizationId).in("status", ["borrador", "enviada", "ajustes_solicitados"]),
  ]);
  if (error) throw error;
  const inReview = new Set((pending ?? []).map((r) => r.entity_id));
  return (data ?? []).map((p) => ({
    id: p.id,
    organization_id: p.organization_id,
    organization_slug: "",
    organization_name: "",
    name: p.name,
    description: p.description,
    modality_code: p.modality_code,
    primary_area_code: p.primary_area_code,
    area_codes: (p.program_area ?? []).map((x: { area_code: string }) => x.area_code),
    population_codes: (p.program_population ?? []).map((x: { population_code: string }) => x.population_code),
    territory_codes: (p.program_territory ?? []).map((x: { territory_code: string }) => x.territory_code),
    start_date: p.start_date,
    end_date: p.end_date,
    annual_goal: p.annual_goal,
    link: p.link,
    is_visible: p.is_visible,
    version: p.version,
    pending: inReview.has(p.id),
  }));
});

// Programas nuevos propuestos que aún esperan validación (se listan aparte en el panel).
export const listPendingNewPrograms = cache(async (organizationId: string): Promise<{ id: string; name: string; status: string }[]> => {
  if (await usePrivateDemo()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("change_request")
    .select("id, payload, status")
    .eq("entity_type", "programa")
    .eq("organization_id", organizationId)
    .is("entity_id", null)
    .in("status", ["borrador", "enviada", "ajustes_solicitados"]);
  return (data ?? []).map((r) => ({ id: r.id, name: r.payload?.name ?? "Programa nuevo", status: r.status }));
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
