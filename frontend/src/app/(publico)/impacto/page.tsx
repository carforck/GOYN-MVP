import { DownloadIcon, InfoIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { CategoryChart, TrendChart } from "@/components/ecosystem/impact-charts";
import { KpiCard } from "@/components/ecosystem/kpi-card";
import { buttonVariants } from "@/components/ui/button";
import { catalogs } from "@/lib/catalogs";
import { listIndicatorReports } from "@/lib/data";
import { formatNumber } from "@/lib/format";
import { byArea, byPeriod, byTerritory, filterReports, periodsAvailable, totals, type ImpactFilters } from "@/lib/impact";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Impacto colectivo" };

const selectClass =
  "h-11 w-full rounded-full border border-input bg-white px-4 text-sm font-semibold text-goyn-navy focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

export default async function ImpactoPage(props: PageProps<"/impacto">) {
  const sp = await props.searchParams;
  const pick = (k: string) => (typeof sp[k] === "string" && sp[k] ? (sp[k] as string) : undefined);
  const filters: ImpactFilters = { periodo: pick("periodo"), area: pick("area"), territorio: pick("territorio"), tipo: pick("tipo") };

  const all = await listIndicatorReports();
  const reports = filterReports(all, filters);
  const t = totals(reports);
  const definitions = Object.fromEntries(catalogs.indicators.map((i) => [i.code, i.definition]));

  return (
    <div>
      <section className="relative isolate overflow-hidden bg-goyn-violeta text-white">
        <Image src="/images/fotos/pilar-equidad.webp" alt="" fill sizes="100vw" className="-z-10 object-cover opacity-50 mix-blend-multiply grayscale" />
        <div className="goyn-container py-12 sm:py-16">
          <span className="goyn-eyebrow bg-goyn-magenta">Quiero medir el impacto</span>
          <h1 className="mt-4 text-3xl font-bold uppercase sm:text-5xl">Impacto colectivo del ecosistema</h1>
          <p className="mt-3 max-w-2xl text-lg text-white/80">
            Lo que logramos juntos: jóvenes conectados, fortalecidos y transformados por las organizaciones del Colaborativo.
          </p>
        </div>
      </section>

      <div className="goyn-container space-y-8 py-8">
        <form className="grid gap-3 rounded-2xl border bg-white p-4 sm:grid-cols-2 lg:grid-cols-5" aria-label="Filtrar indicadores">
          <label className="space-y-1 text-xs font-bold text-muted-foreground uppercase">
            Periodo
            <select name="periodo" defaultValue={filters.periodo ?? ""} className={selectClass}>
              <option value="">Todos</option>
              {periodsAvailable(all).map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs font-bold text-muted-foreground uppercase">
            Área de impacto
            <select name="area" defaultValue={filters.area ?? ""} className={selectClass}>
              <option value="">Todas</option>
              {catalogs.impactAreas.map((a) => <option key={a.code} value={a.code}>{a.label}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs font-bold text-muted-foreground uppercase">
            Territorio
            <select name="territorio" defaultValue={filters.territorio ?? ""} className={selectClass}>
              <option value="">Todos</option>
              {catalogs.territories.map((x) => <option key={x.code} value={x.code}>{x.label}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs font-bold text-muted-foreground uppercase">
            Tipo de organización
            <select name="tipo" defaultValue={filters.tipo ?? ""} className={selectClass}>
              <option value="">Todos</option>
              {catalogs.orgTypes.map((x) => <option key={x.code} value={x.code}>{x.label}</option>)}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button type="submit" className={cn(buttonVariants(), "h-11 flex-1 rounded-full font-bold")}>Aplicar</button>
            <a href="/impacto" className={cn(buttonVariants({ variant: "outline" }), "h-11 rounded-full")}>Limpiar</a>
          </div>
        </form>

        <div className="grid gap-4 md:grid-cols-3">
          <KpiCard label="Jóvenes conectados" value={t.conectados} color="#9B00FF" hint={definitions.conectados} />
          <KpiCard label="Jóvenes fortalecidos" value={t.fortalecidos} color="#00A0CC" hint={definitions.fortalecidos} />
          <KpiCard label="Jóvenes transformados" value={t.transformados} color="#FF01A2" hint={definitions.transformados} />
        </div>

        <p className="flex items-start gap-2 rounded-2xl bg-goyn-lila/60 p-4 text-sm text-goyn-navy">
          <InfoIcon className="mt-0.5 size-4 shrink-0 text-goyn-violeta" aria-hidden />
          <span>
            <strong>Metodología:</strong> las cifras son la suma de reportes validados por el equipo GOYN a partir de {formatNumber(t.organizaciones)} organizaciones,
            no personas únicas: un mismo joven puede participar en varios programas. {formatNumber(t.mujeresConectadas)} de los reportes de conexión corresponden a mujeres.
          </span>
        </p>

        <section className="rounded-2xl border bg-white p-5" aria-labelledby="serie">
          <h2 id="serie" className="mb-4 font-heading text-lg font-bold text-goyn-navy">Evolución por trimestre</h2>
          <TrendChart data={byPeriod(reports)} />
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border bg-white p-5" aria-labelledby="por-area">
            <h2 id="por-area" className="mb-4 font-heading text-lg font-bold text-goyn-navy">Por área de impacto</h2>
            <CategoryChart data={byArea(reports)} />
          </section>
          <section className="rounded-2xl border bg-white p-5" aria-labelledby="por-territorio">
            <h2 id="por-territorio" className="mb-1 font-heading text-lg font-bold text-goyn-navy">Por territorio</h2>
            <p className="mb-4 text-xs text-muted-foreground">Un programa que opera en varias zonas suma en cada una.</p>
            <CategoryChart data={byTerritory(reports)} />
          </section>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed p-5">
          <p className="text-sm text-muted-foreground">¿Necesitas los datos? La descarga en CSV/XLSX está disponible para el equipo GOYN y aliados autorizados.</p>
          <a href="/ingresar" className={cn(buttonVariants({ variant: "outline" }), "h-10 rounded-full")}>
            <DownloadIcon aria-hidden /> Solicitar descarga
          </a>
        </div>
      </div>
    </div>
  );
}
