import type { Metadata } from "next";
import { PageHeader } from "@/components/ecosystem/page-header";
import { Pagination, pageBounds, readPage } from "@/components/ui/pagination";
import { isDemoSession } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Auditoría" };

type Entry = { id: number | string; created_at: string; actor: string; action: string; entity: string; reason: string | null };

const actionLabel: Record<string, string> = {
  "solicitud.enviar": "Envió una solicitud",
  "solicitud.aprobar": "Aprobó y publicó",
  "solicitud.ajustes": "Solicitó ajustes",
  "solicitud.rechazar": "Rechazó",
  "indicador.aprobar": "Aprobó un indicador",
  "indicador.rechazar": "Rechazó un indicador",
  "exportacion.generar": "Exportó datos",
};

const demoEntries: Entry[] = [
  { id: 1, created_at: "2026-09-27T17:12:00Z", actor: "Fundación Semillas del Caribe", action: "solicitud.enviar", entity: "Reporte de indicador 2026-T3", reason: null },
  { id: 2, created_at: "2026-09-26T10:05:00Z", actor: "Colectivo Voces de la Arenosa", action: "solicitud.enviar", entity: "Actualización de perfil", reason: null },
  { id: 3, created_at: "2026-09-25T16:40:00Z", actor: "Equipo GOYN", action: "exportacion.generar", entity: "Organizaciones (XLSX)", reason: "Informe trimestral" },
  { id: 4, created_at: "2026-09-19T11:02:00Z", actor: "Equipo GOYN", action: "solicitud.ajustes", entity: "Colectivo Olas de Puerto", reason: "Completar la descripción del proyecto" },
  { id: 5, created_at: "2026-09-15T09:30:00Z", actor: "Equipo GOYN", action: "solicitud.aprobar", entity: "Fundación Mar Abierto", reason: "Datos verificados" },
];

const PAGE_SIZE = 30;

// Paginado en la consulta: range() + count exacto, para no traer todo el registro.
async function loadEntries(requested: number): Promise<{ entries: Entry[]; total: number; page: number }> {
  if (await isDemoSession()) {
    const { page, from, to } = pageBounds(requested, PAGE_SIZE, demoEntries.length);
    return { entries: demoEntries.slice(from, to), total: demoEntries.length, page };
  }
  const supabase = await createClient();
  const { count } = await supabase.from("audit_log").select("id", { count: "exact", head: true });
  const total = count ?? 0;
  const { page, from } = pageBounds(requested, PAGE_SIZE, total);
  const { data } = await supabase
    .from("audit_log")
    .select("id, created_at, action, entity_type, reason, actor:profile(full_name, email)")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  const entries = (data ?? []).map((d) => {
    const actor = d.actor as unknown as { full_name: string | null; email: string } | null;
    return { id: d.id, created_at: d.created_at, action: d.action, entity: d.entity_type, reason: d.reason, actor: actor?.full_name ?? actor?.email ?? "Sistema" };
  });
  return { entries, total: Math.max(total, entries.length), page };
}

export default async function AuditoriaPage(props: PageProps<"/admin/auditoria">) {
  const sp = await props.searchParams;
  const { entries, total, page } = await loadEntries(readPage(sp));
  return (
    <div className="space-y-6">
      <PageHeader title="Registro de auditoría" description="Quién hizo qué y cuándo: envíos, decisiones, publicaciones y exportaciones. El registro es inmutable." />
      <ol className="relative space-y-4 border-l-2 border-goyn-lila pl-6">
        {entries.map((e) => (
          <li key={e.id} className="relative rounded-2xl border bg-card p-4">
            <span aria-hidden className="absolute top-5 -left-[33px] size-4 rounded-full border-4 border-background bg-goyn-violeta" />
            <p className="text-xs text-muted-foreground">{formatDateTime(e.created_at)}</p>
            <p className="mt-1 text-sm text-foreground">
              <strong>{e.actor}</strong> · {actionLabel[e.action] ?? e.action} · {e.entity}
            </p>
            {e.reason && <p className="mt-1 text-sm text-muted-foreground">Motivo: {e.reason}</p>}
          </li>
        ))}
      </ol>
      {entries.length === 0 && <p className="rounded-2xl border border-dashed bg-card p-8 text-center text-muted-foreground">Aún no hay eventos registrados.</p>}
      <Pagination pathname="/admin/auditoria" searchParams={sp} page={page} pageSize={PAGE_SIZE} total={total} itemLabel="eventos" />
    </div>
  );
}
