"use client";

import {
  ArrowLeftIcon,
  BriefcaseIcon,
  ChartColumnIcon,
  FactoryIcon,
  FlagIcon,
  GraduationCapIcon,
  HandCoinsIcon,
  HeartHandshakeIcon,
  HouseIcon,
  LandmarkIcon,
  LightbulbIcon,
  MegaphoneIcon,
  NetworkIcon,
  ScaleIcon,
  UserSearchIcon,
  UsersIcon,
  UsersRoundIcon,
  WrenchIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { RoleIcon } from "@/components/ecosystem/role-badge";
import { catalogs, item } from "@/lib/catalogs";
import { cn } from "@/lib/utils";
import { type ChartOrg, colorRol, colorTipoOrg, nf, packCircles, pct, solidSwatch } from "./shared";

// B) "¿Quiénes son las organizaciones que promueven el bienestar juvenil?"
// Círculos empaquetados: un círculo por categoría, área ∝ número de organizaciones. Relleno sólido con
// el color del rol/tipo (oscurecido o con contenido navy cuando hace falta para contraste AA). Al
// seleccionar un círculo o un ítem de la leyenda, el panel derecho muestra el detalle del grupo.

const TYPE_ICONS: Record<string, LucideIcon> = {
  privado_fundacion: HeartHandshakeIcon,
  privado_empresa: BriefcaseIcon,
  privado_gremio: FactoryIcon,
  publico_local: LandmarkIcon,
  publico_nacional: FlagIcon,
  educativa: GraduationCapIcon,
  bolsa_empleo: UserSearchIcon,
  colectivo_juvenil: UsersIcon,
  comunitaria: HouseIcon,
};

// Respaldo de línea por si un rol no tiene ícono de marca en el catálogo.
const ROLE_ICONS: Record<string, LucideIcon> = {
  articulador: NetworkIcon,
  implementador: WrenchIcon,
  financiador: HandCoinsIcon,
  tomador_decision: ScaleIcon,
  evaluador: ChartColumnIcon,
  generador_conocimiento: LightbulbIcon,
  juventud: UsersRoundIcon,
  embajador: MegaphoneIcon,
};

// Definiciones de los tipos de organización (el catálogo solo trae la de "comunitaria").
const TYPE_DESCRIPTIONS: Record<string, string> = {
  privado_empresa: "Empresas del sector privado que aportan empleo, formación, recursos o alianzas para que los jóvenes accedan a oportunidades.",
  privado_gremio: "Gremios y asociaciones empresariales que representan a un sector productivo e inciden en sus agendas de empleo y formación.",
  privado_fundacion: "Fundaciones de origen privado (empresariales o familiares) que financian u operan programas de inversión social para jóvenes.",
  publico_local: "Entidades de la Alcaldía, la Gobernación u otros organismos territoriales que definen e implementan políticas y programas para la juventud.",
  publico_nacional: "Entidades del Gobierno nacional con presencia o programas en el territorio que inciden en la educación, el empleo y el bienestar juvenil.",
  educativa: "Colegios, instituciones de educación superior, técnica y tecnológica y centros de formación para el trabajo.",
  bolsa_empleo: "Servicios de empleo y entidades que conectan a los jóvenes con vacantes, orientación ocupacional y procesos de selección.",
  colectivo_juvenil: "Grupos y organizaciones conformados y liderados por jóvenes que trabajan por sus comunidades y sus pares.",
};

type View = "rol" | "tipo";
type Group = { code: string; label: string; color: string; fill: string; ink: string; description: string; orgs: ChartOrg[] };

const W = 400; // ancho virtual del lienzo
const SMALL = 0.075; // radio relativo bajo el cual solo se muestra el ícono

function CategoryIcon({ view, code, color, className }: { view: View; code: string; color: string; className?: string }) {
  // Roles: ícono de marca GOYN (RECURSOS GRAFICOS/ICONOS/ROLES, disco del color del rol + pictograma blanco).
  const brand = view === "rol" ? item("roles", code)?.icon : null;
  if (brand) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`/images/roles/${brand}.webp`} alt="" className={cn("aspect-square object-contain", className)} aria-hidden />;
  }
  const Icon = (view === "rol" ? ROLE_ICONS[code] : TYPE_ICONS[code]) ?? UsersIcon;
  return <Icon className={className} style={{ color }} aria-hidden />;
}

export function WhoCircles({ orgs }: { orgs: ChartOrg[] }) {
  const [view, setView] = useState<View>("rol");
  // `selected`: grupo fijado con clic/teclado (muestra el detalle). `hover`: solo resalta.
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const total = orgs.length;

  const groups: Group[] = useMemo(() => {
    const list =
      view === "rol"
        ? catalogs.roles.map((r) => ({
            code: r.code,
            label: r.label,
            color: colorRol(r.code),
            description: r.description ?? "",
            orgs: orgs.filter((o) => o.primary_role_code === r.code),
          }))
        : catalogs.orgTypes.map((t) => ({
            code: t.code,
            label: t.label,
            color: colorTipoOrg(t.code),
            description: TYPE_DESCRIPTIONS[t.code] ?? t.description ?? "",
            orgs: orgs.filter((o) => o.org_type_code === t.code),
          }));
    return list
      .filter((g) => g.orgs.length > 0)
      .sort((a, b) => b.orgs.length - a.orgs.length)
      .map((g) => {
        const sw = solidSwatch(g.color);
        return view === "rol" ? { ...g, ...sw, fill: g.color } : { ...g, ...sw };
      });
  }, [orgs, view]);

  const layout = useMemo(() => {
    if (!groups.length) return { circles: [], h: 0 };
    // Radio ∝ √n para que el ÁREA sea proporcional al número de organizaciones.
    const raw = packCircles(groups.map((g) => Math.sqrt(g.orgs.length)), 0.12);
    const minX = Math.min(...raw.map((c) => c.x - c.r));
    const maxX = Math.max(...raw.map((c) => c.x + c.r));
    const minY = Math.min(...raw.map((c) => c.y - c.r));
    const maxY = Math.max(...raw.map((c) => c.y + c.r));
    const pad = 6;
    const k = (W - pad * 2) / (maxX - minX);
    const h = (maxY - minY) * k + pad * 2;
    return {
      h,
      circles: raw.map((c) => ({ x: (c.x - minX) * k + pad, y: (c.y - minY) * k + pad, r: c.r * k })),
    };
  }, [groups]);

  const sel = groups.find((g) => g.code === selected) ?? null;
  const lit = hover ?? selected; // grupo resaltado (los demás se atenúan)
  const toggle = (code: string) => setSelected((cur) => (cur === code ? null : code));
  const sortedSel = useMemo(() => (sel ? [...sel.orgs].sort((a, b) => a.name.localeCompare(b.name, "es")) : []), [sel]);

  return (
    <section aria-labelledby="actores-quienes" className="space-y-4">
      <h2 id="actores-quienes" className="text-2xl font-bold text-foreground">
        ¿Quiénes son las organizaciones que promueven el bienestar juvenil?
      </h2>
      <div className="grid gap-6 rounded-2xl border bg-card p-4 shadow-sm sm:p-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-muted-foreground">Ver por:</span>
            {(
              [
                ["rol", "Rol en el ecosistema juvenil"],
                ["tipo", "Tipo de Organización"],
              ] as const
            ).map(([v, l]) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => {
                  setView(v);
                  setSelected(null);
                  setHover(null);
                }}
                className={cn(
                  "rounded-full border px-3 py-1 font-semibold transition-colors",
                  view === v ? "border-transparent bg-goyn-violeta text-white" : "bg-card text-foreground hover:bg-muted",
                )}
              >
                {l}
              </button>
            ))}
          </div>

          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay organizaciones con los filtros actuales.</p>
          ) : (
            <div
              className="relative mx-auto w-full max-w-[520px]"
              style={{ aspectRatio: `${W} / ${layout.h}`, containerType: "inline-size" }}
              onMouseLeave={() => setHover(null)}
            >
              {groups.map((g, i) => {
                const c = layout.circles[i];
                const small = c.r / W < SMALL;
                const on = lit === g.code;
                return (
                  <button
                    key={g.code}
                    type="button"
                    aria-pressed={selected === g.code}
                    aria-controls="actores-quienes-panel"
                    onMouseEnter={() => setHover(g.code)}
                    onClick={() => toggle(g.code)}
                    aria-label={`${g.label}: ${g.orgs.length} organizaciones`}
                    title={g.label}
                    className={cn(
                      "absolute flex cursor-pointer flex-col items-center justify-center rounded-full transition-[transform,opacity,box-shadow] duration-200 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-goyn-violeta",
                      on && "z-10 scale-[1.05] shadow-lg",
                      selected === g.code && "ring-4 ring-foreground/70 ring-offset-2 ring-offset-card",
                      lit && !on && "opacity-35",
                    )}
                    style={{
                      left: `${((c.x - c.r) / W) * 100}%`,
                      top: `${((c.y - c.r) / layout.h) * 100}%`,
                      width: `${((2 * c.r) / W) * 100}%`,
                      height: `${((2 * c.r) / layout.h) * 100}%`,
                      backgroundColor: g.fill,
                      color: g.ink,
                    }}
                  >
                    <CategoryIcon view={view} code={g.code} color={g.ink} className={small ? "size-[50%]" : "size-[32%]"} />
                    {!small && (
                      <span className="font-heading leading-none font-bold" style={{ fontSize: `${Math.max(2.6, (c.r / W) * 38)}cqw` }}>
                        {g.orgs.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <ul className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2" aria-label="Leyenda">
            {groups.map((g) => {
              const on = lit === g.code;
              return (
                <li key={g.code}>
                  <button
                    type="button"
                    aria-pressed={selected === g.code}
                    aria-controls="actores-quienes-panel"
                    onClick={() => toggle(g.code)}
                    onMouseEnter={() => setHover(g.code)}
                    onMouseLeave={() => setHover(null)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left transition-[opacity,background-color] hover:bg-muted focus-visible:outline-2 focus-visible:outline-goyn-violeta",
                      selected === g.code && "bg-muted",
                      lit && !on && "opacity-50",
                    )}
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: g.fill }}>
                      <CategoryIcon view={view} code={g.code} color={g.ink} className="size-4" />
                    </span>
                    <span className={cn("min-w-0 flex-1 text-foreground", selected === g.code && "font-bold")}>{g.label}</span>
                    <span className="font-bold text-foreground">{g.orgs.length}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <aside id="actores-quienes-panel" className="min-w-0 space-y-3 text-sm leading-relaxed text-muted-foreground lg:border-l lg:pl-6">
          <h3 className="text-lg font-bold text-foreground">Un ecosistema que se reconoce</h3>
          <p>
            Esta visualización reúne en una sola imagen a las <strong className="text-foreground">{nf.format(total)} organizaciones</strong> que hacen parte del
            ecosistema. Verlas juntas nos permite reconocer que el trabajo por los jóvenes de Barranquilla A.M. es el resultado de una red con capacidades distintas que
            se complementan.
          </p>

          <div aria-live="polite" className="space-y-3">
            {sel ? (
              <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  {view === "rol" ? (
                    <RoleIcon code={sel.code} size={44} className="size-11" />
                  ) : (
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: sel.fill }}>
                      <CategoryIcon view={view} code={sel.code} color={sel.ink} className="size-6" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold tracking-wider uppercase">{view === "rol" ? "Rol en el ecosistema" : "Tipo de organización"}</p>
                    <h4 className="text-base leading-snug font-bold text-foreground">{sel.label}</h4>
                  </div>
                </div>
                {sel.description && <p>{sel.description}</p>}
                <p className="text-foreground">
                  <strong className="font-heading text-2xl">{nf.format(sel.orgs.length)}</strong>{" "}
                  {sel.orgs.length === 1 ? "organización" : "organizaciones"} · {pct(sel.orgs.length, total)}% del ecosistema
                </p>
                <ul className={cn("max-h-72 overflow-y-auto pr-1 leading-snug", sortedSel.length > 8 && "sm:columns-2 sm:gap-x-5")}>
                  {sortedSel.map((o) => (
                    <li key={o.slug} className="mb-1 break-inside-avoid">
                      <Link href={`/actores/${o.slug}`} className="text-foreground underline decoration-goyn-violeta/40 underline-offset-2 hover:decoration-goyn-violeta">
                        {o.name}
                      </Link>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-goyn-violeta"
                >
                  <ArrowLeftIcon className="size-3.5" aria-hidden /> Ver todo el ecosistema
                </button>
              </div>
            ) : (
              <>
                {view === "rol" ? (
                  <p>
                    Vista por rol, cada organización se ubica según lo que aporta a la red: quienes implementan acciones en el territorio, quienes articulan, financian,
                    generan conocimiento o toman decisiones. Reconocer estos roles facilita saber a quién acudir según la necesidad y dónde hacen falta más capacidades.
                  </p>
                ) : (
                  <p>
                    Vista por tipo de organización, se hace visible la diversidad de sectores que participan: fundaciones, organizaciones comunitarias, empresas,
                    entidades públicas y colectivos juveniles. Esa mezcla de naturalezas y miradas es la base de la acción colectiva por los jóvenes.
                  </p>
                )}
                <p>
                  Cada círculo reúne a las organizaciones que comparten un mismo rol o tipo, y su tamaño muestra cuántas son. Adentro van el ícono del grupo y su número
                  de organizaciones; la leyenda dice su nombre. Haz clic en un círculo (o en la leyenda) para ver aquí su definición y el listado de sus organizaciones.
                </p>
              </>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
