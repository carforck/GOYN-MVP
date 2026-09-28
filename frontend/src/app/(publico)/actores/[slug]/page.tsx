import { ArrowLeftIcon, BadgeCheckIcon, CalendarIcon, GlobeIcon, MailIcon, MapPinIcon, SparklesIcon, UsersIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Shape } from "@/components/brand/shape";
import { KpiCard } from "@/components/ecosystem/kpi-card";
import { OrgInitials } from "@/components/ecosystem/org-card";
import { RoleBadge } from "@/components/ecosystem/role-badge";
import { ShareButton } from "@/components/ecosystem/share-button";
import { buttonVariants } from "@/components/ui/button";
import { catalogs, item, label, shortTerritory } from "@/lib/catalogs";
import { getOrganization, listIndicatorReports, listPrograms, listRelations } from "@/lib/data";
import { formatDate, formatNumber } from "@/lib/format";
import { totals } from "@/lib/impact";
import { cn } from "@/lib/utils";

const plural: Record<string, string> = { socio: "Socios", aliado: "Aliados", colaborador: "Colaboradores" };

export async function generateMetadata(props: PageProps<"/actores/[slug]">): Promise<Metadata> {
  const org = await getOrganization((await props.params).slug);
  return org ? { title: org.name, description: org.description.slice(0, 160) } : { title: "Organización no encontrada" };
}

export default async function ActorPage(props: PageProps<"/actores/[slug]">) {
  const { slug } = await props.params;
  const org = await getOrganization(slug);
  if (!org) notFound();

  const [programs, relations, reports] = await Promise.all([listPrograms(org.id), listRelations(org.id), listIndicatorReports(org.id)]);
  const t = totals(reports);
  const problemsByArea = org.area_codes.map((area) => ({
    area,
    problems: catalogs.problems.filter((p) => p.area === area && org.problem_codes.includes(p.code)),
  }));
  const connections = catalogs.relationTypes.map((type) => ({
    type,
    items: relations
      .filter((r) => r.relation_type_code === type.code)
      .map((r) => (r.source_org_id === org.id ? { slug: r.target_slug, name: r.target_name } : { slug: r.source_slug, name: r.source_name })),
  }));

  return (
    <article>
      {/* Encabezado */}
      <header className="relative overflow-hidden border-b bg-goyn-lila/50">
        <Shape name="malla_puntos" size={260} className="-top-10 -right-10 opacity-20" />
        <div className="goyn-container relative space-y-6 py-8 sm:py-12">
          <Link href="/actores" className="inline-flex items-center gap-1.5 text-sm font-semibold text-goyn-violeta hover:underline">
            <ArrowLeftIcon className="size-4" aria-hidden /> Directorio de actores
          </Link>
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4 sm:gap-5">
              <OrgInitials name={org.name} className="size-16 rounded-3xl text-xl sm:size-20 sm:text-2xl" />
              <div className="space-y-3">
                <p className="text-sm font-bold tracking-wider text-muted-foreground uppercase">{org.org_type_label}</p>
                <h1 className="text-3xl font-black text-goyn-navy sm:text-4xl">{org.name}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <RoleBadge code={org.primary_role_code} primary />
                  {org.role_codes.filter((r) => r !== org.primary_role_code).map((r) => <RoleBadge key={r} code={r} />)}
                </div>
                <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {org.verified_at && (
                    <span className="inline-flex items-center gap-1 font-semibold text-goyn-violeta">
                      <BadgeCheckIcon className="size-4" aria-hidden /> Verificado por GOYN
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <CalendarIcon className="size-4" aria-hidden /> Actualizado el {formatDate(org.updated_at)}
                  </span>
                  {org.scope_code && <span>Alcance {label("scopes", org.scope_code).toLowerCase()}</span>}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {org.contact_email_public && (
                <a href={`mailto:${org.contact_email_public}`} className={cn(buttonVariants(), "h-11 rounded-full px-5 font-bold")}>
                  <MailIcon aria-hidden /> Contactar
                </a>
              )}
              <ShareButton title={org.name} />
            </div>
          </div>
        </div>
      </header>

      <div className="goyn-container grid gap-8 py-10 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-10">
          <section aria-labelledby="quienes">
            <h2 id="quienes" className="mb-3 text-xl font-extrabold text-goyn-navy">¿Quiénes son y qué hacen?</h2>
            <p className="text-lg leading-relaxed text-goyn-navy/85">{org.description}</p>
            {org.mission && <p className="mt-3 text-muted-foreground"><strong className="text-goyn-navy">Misión:</strong> {org.mission}</p>}
          </section>

          <section aria-labelledby="enfoque">
            <h2 id="enfoque" className="mb-4 text-xl font-extrabold text-goyn-navy">Enfoque estratégico</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {problemsByArea.map(({ area, problems }) => {
                const a = item("impactAreas", area);
                return (
                  <div key={area} className="rounded-2xl border bg-white p-4" style={{ borderTopColor: a?.color, borderTopWidth: 4 }}>
                    <p className="font-heading font-bold text-goyn-navy">{a?.label}</p>
                    {problems.length > 0 ? (
                      <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                        {problems.map((p) => <li key={p.code} className="flex gap-2"><span aria-hidden>•</span>{p.label}</li>)}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">{a?.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="programas">
            <h2 id="programas" className="mb-4 text-xl font-extrabold text-goyn-navy">
              Programas y proyectos <span className="text-muted-foreground">({programs.length})</span>
            </h2>
            <ul className="space-y-3">
              {programs.map((p) => (
                <li key={p.id} className="rounded-2xl border bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-heading text-lg font-bold text-goyn-navy">{p.name}</p>
                      <p className="text-sm text-muted-foreground">{p.description}</p>
                    </div>
                    <span className="rounded-full bg-goyn-lila px-3 py-1 text-xs font-bold text-goyn-violeta">{label("modalities", p.modality_code)}</span>
                  </div>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-xs font-bold text-muted-foreground uppercase">Población</dt>
                      <dd className="mt-0.5 text-goyn-navy">{p.population_codes.map((c) => label("populations", c).replace(/ \(.+\)$/, "")).join(", ")}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold text-muted-foreground uppercase">Territorio</dt>
                      <dd className="mt-0.5 text-goyn-navy">{p.territory_codes.map(shortTerritory).join(", ")}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold text-muted-foreground uppercase">Vigencia</dt>
                      <dd className="mt-0.5 text-goyn-navy">
                        Desde {formatDate(p.start_date)}{p.end_date ? ` hasta ${formatDate(p.end_date)}` : " · sin fecha de cierre"}
                      </dd>
                    </div>
                  </dl>
                  {p.annual_goal ? <p className="mt-3 text-xs text-muted-foreground">Meta de atención 2026: {formatNumber(p.annual_goal)} jóvenes</p> : null}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="resultados">
            <h2 id="resultados" className="mb-1 text-xl font-extrabold text-goyn-navy">Resultados reportados</h2>
            <p className="mb-4 text-sm text-muted-foreground">Suma de reportes validados por GOYN, todos los periodos.</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <KpiCard label="Conectados" value={t.conectados} color="#9B00FF" />
              <KpiCard label="Fortalecidos" value={t.fortalecidos} color="#00A0CC" />
              <KpiCard label="Transformados" value={t.transformados} color="#FF01A2" />
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border bg-white p-5">
            <h2 className="mb-3 font-heading font-bold text-goyn-navy">Dónde trabaja</h2>
            <p className="flex items-start gap-2 text-sm text-goyn-navy">
              <MapPinIcon className="mt-0.5 size-4 shrink-0 text-goyn-violeta" aria-hidden />
              Sede en {org.location_territory_code ? label("territories", org.location_territory_code) : "zona no georreferenciada"}
              {org.location_precision === "aproximada" && " (ubicación aproximada)"}
            </p>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {org.territory_codes.map((c) => (
                <li key={c}>
                  <Link href={`/mapa?territorio=${c}`} className="inline-block rounded-full border px-2.5 py-1 text-xs font-semibold hover:border-goyn-violeta">
                    {shortTerritory(c)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <h2 className="mb-3 flex items-center gap-2 font-heading font-bold text-goyn-navy">
              <UsersIcon className="size-4 text-goyn-violeta" aria-hidden /> Conexiones en el ecosistema
            </h2>
            <div className="space-y-4">
              {connections.map(({ type, items }) => (
                <div key={type.code}>
                  <p className="text-xs font-bold text-muted-foreground uppercase" title={type.description}>
                    {plural[type.code] ?? type.label} · {items.length}
                  </p>
                  {items.length > 0 ? (
                    <ul className="mt-1.5 space-y-1">
                      {items.map((c) => (
                        <li key={c.slug}>
                          <Link href={`/actores/${c.slug}`} className="text-sm font-semibold text-goyn-navy hover:text-goyn-violeta hover:underline">
                            {c.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">Sin registros.</p>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-4 flex items-center gap-1.5 rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
              <SparklesIcon className="size-3.5 shrink-0 text-goyn-magenta" aria-hidden />
              Grafo de red y sugerencias de aliados: Fase 2 · 2027.
            </p>
          </div>

          {(org.website || org.contact_email_public) && (
            <div className="rounded-2xl border bg-white p-5 text-sm">
              <h2 className="mb-3 font-heading font-bold text-goyn-navy">Contacto</h2>
              {org.contact_email_public && (
                <a href={`mailto:${org.contact_email_public}`} className="flex items-center gap-2 break-all text-goyn-violeta hover:underline">
                  <MailIcon className="size-4 shrink-0" aria-hidden /> {org.contact_email_public}
                </a>
              )}
              {org.website && (
                <a href={org.website} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 break-all text-goyn-violeta hover:underline">
                  <GlobeIcon className="size-4 shrink-0" aria-hidden /> {org.website}
                </a>
              )}
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}
