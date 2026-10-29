"use client";

import {
  BriefcaseIcon,
  FactoryIcon,
  FlagIcon,
  GraduationCapIcon,
  HeartHandshakeIcon,
  HouseIcon,
  LandmarkIcon,
  UserSearchIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { RoleIcon } from "@/components/ecosystem/role-badge";
import { catalogs } from "@/lib/catalogs";
import { cn } from "@/lib/utils";
import { type ChartOrg, ORG_TYPE_COLORS, nf, packCircles, pct } from "./shared";

// B) "¿Quiénes son las organizaciones que promueven el bienestar juvenil?"
// Círculos empaquetados: un círculo por categoría, área ∝ número de organizaciones.

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

type View = "rol" | "tipo";
type Group = { code: string; label: string; color: string; orgs: ChartOrg[] };

const W = 400; // ancho virtual del lienzo
const SMALL = 0.075; // radio relativo bajo el cual solo se muestra el ícono

function CategoryIcon({ view, code, color, className }: { view: View; code: string; color: string; className?: string }) {
  if (view === "rol") {
    return (
      <span className={cn("block", className)}>
        <RoleIcon code={code} size={64} className="h-full w-full" />
      </span>
    );
  }
  const Icon = TYPE_ICONS[code] ?? UsersIcon;
  return <Icon className={className} style={{ color }} aria-hidden />;
}

export function WhoCircles({ orgs }: { orgs: ChartOrg[] }) {
  const [view, setView] = useState<View>("rol");
  const [active, setActive] = useState<string | null>(null);
  const total = orgs.length;

  const groups: Group[] = useMemo(() => {
    const list =
      view === "rol"
        ? catalogs.roles.map((r) => ({ code: r.code, label: r.label, color: r.color ?? "#9B00FF", orgs: orgs.filter((o) => o.primary_role_code === r.code) }))
        : catalogs.orgTypes.map((t) => ({ code: t.code, label: t.label, color: ORG_TYPE_COLORS[t.code] ?? "#9B00FF", orgs: orgs.filter((o) => o.org_type_code === t.code) }));
    return list.filter((g) => g.orgs.length > 0).sort((a, b) => b.orgs.length - a.orgs.length);
  }, [orgs, view]);

  const layout = useMemo(() => {
    if (!groups.length) return { circles: [], h: 0 };
    // Radio ∝ √n para que el ÁREA sea proporcional al número de organizaciones.
    const raw = packCircles(groups.map((g) => Math.sqrt(g.orgs.length)), 0.12);
    const minX = Math.min(...raw.map((c) => c.x - c.r));
    const maxX = Math.max(...raw.map((c) => c.x + c.r));
    const minY = Math.min(...raw.map((c) => c.y - c.r));
    const maxY = Math.max(...raw.map((c) => c.y + c.r));
    const pad = 4;
    const k = (W - pad * 2) / (maxX - minX);
    const h = (maxY - minY) * k + pad * 2;
    return {
      h,
      circles: raw.map((c) => ({ x: (c.x - minX) * k + pad, y: (c.y - minY) * k + pad, r: c.r * k })),
    };
  }, [groups]);

  const activeIdx = groups.findIndex((g) => g.code === active);
  const tipGroup = activeIdx >= 0 ? groups[activeIdx] : null;
  const tipCircle = activeIdx >= 0 ? layout.circles[activeIdx] : null;

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
                  setActive(null);
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
              onMouseLeave={() => setActive(null)}
            >
              {groups.map((g, i) => {
                const c = layout.circles[i];
                const small = c.r / W < SMALL;
                return (
                  <button
                    key={g.code}
                    type="button"
                    onMouseEnter={() => setActive(g.code)}
                    onFocus={() => setActive(g.code)}
                    onClick={() => setActive((a) => (a === g.code ? null : g.code))}
                    aria-label={`${g.label}: ${g.orgs.length} organizaciones`}
                    className={cn(
                      "absolute flex flex-col items-center justify-center rounded-full border-2 transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-goyn-violeta",
                      active === g.code && "z-10 scale-[1.04]",
                    )}
                    style={{
                      left: `${((c.x - c.r) / W) * 100}%`,
                      top: `${((c.y - c.r) / layout.h) * 100}%`,
                      width: `${((2 * c.r) / W) * 100}%`,
                      height: `${((2 * c.r) / layout.h) * 100}%`,
                      borderColor: g.color,
                      backgroundColor: `${g.color}1F`,
                    }}
                  >
                    <CategoryIcon view={view} code={g.code} color={g.color} className={small ? "size-[55%]" : "size-[34%]"} />
                    {!small && (
                      <span className="font-heading leading-none font-bold text-foreground" style={{ fontSize: `${Math.max(2.6, (c.r / W) * 38)}cqw` }}>
                        {g.orgs.length}
                      </span>
                    )}
                  </button>
                );
              })}

              {tipGroup && tipCircle && (
                <div
                  role="tooltip"
                  className="pointer-events-none absolute z-20 w-64 max-w-[80vw] -translate-x-1/2 -translate-y-full rounded-xl border bg-card px-3 py-2 text-xs shadow-xl"
                  style={{
                    left: `${Math.min(80, Math.max(20, (tipCircle.x / W) * 100))}%`,
                    top: `calc(${((tipCircle.y - tipCircle.r) / layout.h) * 100}% - 6px)`,
                  }}
                >
                  <p className="font-bold text-foreground">{tipGroup.label}</p>
                  <p className="text-muted-foreground">
                    {tipGroup.orgs.length} de {total} organizaciones · {pct(tipGroup.orgs.length, total)}%
                  </p>
                  <ul className="mt-1 max-h-40 list-disc space-y-0.5 overflow-hidden pl-4 text-foreground">
                    {tipGroup.orgs.slice(0, 12).map((o) => (
                      <li key={o.slug}>{o.name}</li>
                    ))}
                    {tipGroup.orgs.length > 12 && <li className="list-none text-muted-foreground">y {tipGroup.orgs.length - 12} más…</li>}
                  </ul>
                </div>
              )}
            </div>
          )}

          <ul className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
            {groups.map((g) => (
              <li
                key={g.code}
                className="flex items-center gap-2"
                onMouseEnter={() => setActive(g.code)}
                onMouseLeave={() => setActive(null)}
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2" style={{ borderColor: g.color, backgroundColor: `${g.color}1F` }}>
                  <CategoryIcon view={view} code={g.code} color={g.color} className="size-4" />
                </span>
                <span className="min-w-0 flex-1 text-foreground">{g.label}</span>
                <span className="font-bold text-foreground">{g.orgs.length}</span>
              </li>
            ))}
          </ul>
        </div>

        <aside className="space-y-3 text-sm leading-relaxed text-muted-foreground lg:border-l lg:pl-6">
          <h3 className="text-lg font-bold text-foreground">Un ecosistema que se reconoce</h3>
          <p>
            <strong className="text-foreground">{nf.format(total)} organizaciones</strong> hacen parte de la red y aportan, desde distintos lugares, al bienestar de
            las juventudes de Barranquilla y su área metropolitana.
          </p>
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
          <p className="text-xs">El tamaño de cada círculo es proporcional al número de organizaciones. Pasa el cursor (o toca) un círculo para ver quiénes lo componen.</p>
        </aside>
      </div>
    </section>
  );
}
