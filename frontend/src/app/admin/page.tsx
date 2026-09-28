import { AlertTriangleIcon, ArrowRightIcon, InboxIcon, MapPinOffIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { KpiCard } from "@/components/ecosystem/kpi-card";
import { PageHeader } from "@/components/ecosystem/page-header";
import { catalogs, label, shortTerritory } from "@/lib/catalogs";
import { getEcosystemStats, listChangeRequests, listOrganizations } from "@/lib/data";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Consola GOYN" };

const SIX_MONTHS = 1000 * 60 * 60 * 24 * 182;
const NOW = new Date("2026-09-28T12:00:00Z").getTime();

export default async function AdminHome() {
  const [stats, requests, orgs] = await Promise.all([getEcosystemStats(), listChangeRequests(), listOrganizations()]);
  const pending = requests.filter((r) => r.status === "enviada");
  const stale = orgs.filter((o) => NOW - new Date(o.updated_at).getTime() > SIX_MONTHS * 0.5); // demo: umbral 3 meses para mostrar casos
  const coverage = catalogs.territories
    .filter((t) => t.lat != null)
    .map((t) => ({ code: t.code, count: orgs.filter((o) => o.territory_codes.includes(t.code)).length }))
    .sort((a, b) => a.count - b.count);

  return (
    <div className="space-y-6">
      <PageHeader title="Tablero de administración" description="Lo que requiere atención del equipo GOYN: solicitudes pendientes, perfiles desactualizados y huecos de cobertura." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Organizaciones publicadas" value={stats.organizations} color="#060A28" />
        <KpiCard label="Solicitudes pendientes" value={pending.length} color="#FE5200" />
        <KpiCard label="Programas" value={stats.programs} color="#0AA066" />
        <KpiCard label="Conexiones" value={stats.connections} color="#00A0CC" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border bg-white p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-goyn-navy"><InboxIcon className="size-5 text-goyn-naranja" aria-hidden /> Pendientes de validación</h2>
            <Link href="/admin/solicitudes" className="inline-flex items-center gap-1 text-sm font-bold text-goyn-violeta hover:underline">Ir a la bandeja <ArrowRightIcon className="size-4" aria-hidden /></Link>
          </div>
          <ul className="divide-y">
            {pending.map((r) => (
              <li key={r.id}>
                <Link href={`/admin/solicitudes/${r.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-goyn-violeta">
                  <span>
                    <span className="block font-semibold text-goyn-navy">{r.organization_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {r.kind === "alta" ? "Registro nuevo" : r.kind === "actualizacion" ? "Actualización de perfil" : "Reporte de indicador"} · {label("orgTypes", r.org_type_code)}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDateTime(r.submitted_at)}</span>
                </Link>
              </li>
            ))}
            {pending.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">No hay solicitudes pendientes.</li>}
          </ul>
        </section>

        <section className="rounded-2xl border bg-white p-5">
          <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-bold text-goyn-navy"><MapPinOffIcon className="size-5 text-goyn-magenta" aria-hidden /> Huecos de cobertura</h2>
          <ul className="space-y-2">
            {coverage.slice(0, 5).map((c) => (
              <li key={c.code} className="flex items-center justify-between text-sm">
                <Link href={`/mapa?territorio=${c.code}`} className="font-semibold text-goyn-navy hover:underline">{shortTerritory(c.code)}</Link>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold">{c.count} org.</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-2xl border bg-white p-5">
        <h2 className="mb-1 flex items-center gap-2 font-heading text-lg font-bold text-goyn-navy"><AlertTriangleIcon className="size-5 text-goyn-naranja" aria-hidden /> Perfiles por actualizar</h2>
        <p className="mb-4 text-sm text-muted-foreground">La regla es enviar recordatorio a los 6 meses sin cambios (en la demostración se usa un umbral menor para ver ejemplos).</p>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {stale.slice(0, 9).map((o) => (
            <li key={o.id} className="rounded-xl border p-3 text-sm">
              <Link href={`/actores/${o.slug}`} className="font-semibold text-goyn-navy hover:underline">{o.name}</Link>
              <p className="text-xs text-muted-foreground">Última actualización {formatDateTime(o.updated_at)}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
