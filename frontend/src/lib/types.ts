// Tipos de dominio compartidos por las vistas. Reflejan las vistas públicas de Supabase
// (backend/supabase/migrations/..._vistas_publicas.sql) y el JSON de demostración.

export type CatalogItem = {
  code: string;
  label: string;
  description?: string;
  color?: string;
  icon?: string;
};

export type Territory = CatalogItem & { municipality: string | null; lat: number | null; lng: number | null };
export type Problem = CatalogItem & { area: string };

export type Catalogs = {
  orgTypes: CatalogItem[];
  roles: CatalogItem[];
  scopes: CatalogItem[];
  territories: Territory[];
  impactAreas: CatalogItem[];
  problems: Problem[];
  populations: CatalogItem[];
  relationTypes: CatalogItem[];
  modalities: CatalogItem[];
  dataManagementLevels: CatalogItem[];
  collaborativeTenure: CatalogItem[];
  goynSpaces: CatalogItem[];
  indicators: (CatalogItem & { unit: string; definition: string })[];
  workLines: CatalogItem[];
};

export type PublicOrganization = {
  id: string;
  slug: string;
  name: string;
  description: string;
  mission: string | null;
  org_type_code: string;
  org_type_label: string;
  primary_role_code: string;
  primary_role_label: string;
  role_codes: string[];
  territory_codes: string[];
  area_codes: string[];
  problem_codes: string[];
  work_line_codes: string[];
  population_codes: string[];
  scope_code: string | null;
  website: string | null;
  social: Record<string, string>;
  logo_path: string | null;
  contact_email_public: string | null;
  is_demo: boolean;
  verified_at: string | null;
  updated_at: string;
  location_territory_code: string | null;
  municipality: string | null;
  lat: number | null;
  lng: number | null;
  location_precision: "exacta" | "aproximada" | "no_disponible";
  programs_count: number;
  connections_count: number;
};

export type PublicProgram = {
  id: string;
  organization_id: string;
  organization_slug: string;
  organization_name: string;
  name: string;
  description: string;
  modality_code: string;
  primary_area_code: string;
  area_codes: string[];
  population_codes: string[];
  territory_codes: string[];
  start_date: string;
  end_date: string | null;
  annual_goal: number | null;
  link: string | null;
};

export type PublicRelation = {
  id: string;
  source_org_id: string;
  source_slug: string;
  source_name: string;
  target_org_id: string;
  target_slug: string;
  target_name: string;
  relation_type_code: string;
  intensity: number | null;
  since: string | null;
};

export type IndicatorReport = {
  id: string;
  organization_id: string;
  organization_slug: string;
  org_type_code: string;
  program_id: string | null;
  primary_area_code: string | null;
  territory_codes: string[];
  indicator_code: "conectados" | "fortalecidos" | "transformados";
  period_label: string;
  period_start: string;
  period_end: string;
  value: number;
  value_women: number | null;
  source: string | null;
};

export type EcosystemStats = {
  organizations: number;
  programs: number;
  connections: number;
  conectados: number;
  fortalecidos: number;
  transformados: number;
  indicators_updated_at: string | null;
};

export type RequestStatus = "borrador" | "enviada" | "ajustes_solicitados" | "aprobada" | "rechazada" | "retirada";

export type ChangeRequestSummary = {
  id: string;
  entity_type: "organizacion" | "programa" | "relacion" | "reporte_indicador";
  status: RequestStatus;
  organization_name: string;
  org_type_code: string;
  territory: string;
  submitted_at: string;
  kind: "alta" | "actualizacion" | "indicador";
  changes?: { field: string; before: string; after: string }[];
};

// Filtros compartidos entre mapa y directorio (se serializan en la URL).
export type EcosystemFilters = {
  q?: string;
  tipo?: string[];
  rol?: string[];
  area?: string[];
  poblacion?: string[];
  territorio?: string[];
  linea?: string[];
  orden?: "nombre" | "reciente" | "programas" | "conexiones";
};

export type AppRole = "visitante" | "organizacion" | "admin_goyn" | "superadmin";
