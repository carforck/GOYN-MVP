import { Building2Icon, HandCoinsIcon } from "lucide-react";
import { nf } from "./shared";

// A) "Los actores en cifras": número de organizaciones y, solo si hay dato (P38), recursos movilizados.
export function FiguresCards({ organizations, investment }: { organizations: number; investment: { totalCop: number | null; reported: number } }) {
  const millions = investment.totalCop != null ? Math.round(investment.totalCop / 1_000_000) : null;
  return (
    <section aria-labelledby="actores-cifras" className="space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id="actores-cifras" className="text-2xl font-bold text-foreground">
          Los actores en cifras
        </h2>
        <span className="text-sm text-muted-foreground">Caracterización de actores</span>
      </div>
      <div className={millions != null ? "grid gap-4 sm:grid-cols-2" : "grid gap-4"}>
        <article className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-goyn-violeta uppercase">
            <Building2Icon className="size-4" aria-hidden /> Número de organizaciones
          </div>
          <p className="mt-2 font-heading text-5xl font-bold text-foreground">{nf.format(organizations)}</p>
          <p className="mt-2 text-sm text-muted-foreground">Organizaciones que hacen parte del ecosistema y diligenciaron la caracterización.</p>
        </article>
        {millions != null && (
          <article className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold tracking-wider text-goyn-violeta uppercase">
              <HandCoinsIcon className="size-4" aria-hidden /> Recursos movilizados
            </div>
            <p className="mt-2 font-heading text-5xl font-bold text-foreground">
              $&nbsp;{nf.format(millions)} <span className="text-xl font-semibold text-muted-foreground">millones</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Inversión social estimada que las organizaciones destinan este año a iniciativas para jóvenes, en millones de pesos. Reportada por{" "}
              {nf.format(investment.reported)} {investment.reported === 1 ? "organización" : "organizaciones"}.
            </p>
          </article>
        )}
      </div>
    </section>
  );
}
