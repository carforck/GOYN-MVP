import { Building2Icon, HandCoinsIcon } from "lucide-react";
import { nf } from "./shared";

// A) "Los actores en cifras": número de organizaciones y recursos movilizados (P38).
export function FiguresCards({ organizations, investment }: { organizations: number; investment: { totalCop: number | null; reported: number } }) {
  const millions = investment.totalCop != null ? Math.round(investment.totalCop / 1_000_000) : null;
  return (
    <section aria-labelledby="actores-cifras" className="space-y-3">
      <h2 id="actores-cifras" className="text-2xl font-bold text-foreground">
        Los actores en cifras
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-goyn-violeta uppercase">
            <Building2Icon className="size-4" aria-hidden /> Número de organizaciones
          </div>
          <p className="mt-2 font-heading text-5xl font-bold text-foreground">{nf.format(organizations)}</p>
          <p className="mt-2 text-sm text-muted-foreground">Organizaciones que hacen parte del ecosistema y diligenciaron la caracterización.</p>
        </article>
        <article className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold tracking-wider text-goyn-violeta uppercase">
            <HandCoinsIcon className="size-4" aria-hidden /> Recursos movilizados
            {millions == null && (
              <span className="rounded-full bg-goyn-amarillo/25 px-2 py-0.5 text-[10px] font-bold tracking-normal text-foreground normal-case">
                Por recolectar · P38
              </span>
            )}
          </div>
          {millions != null ? (
            <>
              <p className="mt-2 font-heading text-5xl font-bold text-foreground">
                ${nf.format(millions)} <span className="text-xl font-semibold text-muted-foreground">millones</span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Inversión social reportada por {nf.format(investment.reported)} {investment.reported === 1 ? "organización" : "organizaciones"} en la caracterización.
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 font-heading text-5xl font-bold text-muted-foreground">—</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Inversión social de las organizaciones en millones de pesos. Se mostrará cuando las organizaciones reporten este dato.
              </p>
            </>
          )}
        </article>
      </div>
    </section>
  );
}
