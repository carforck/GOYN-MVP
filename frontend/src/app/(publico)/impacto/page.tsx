import { DownloadIcon, InfoIcon, TriangleAlertIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { TrendChart } from "@/components/ecosystem/impact-charts";
import {
  BlockHead,
  ChartCard,
  ImpactFilters,
  IncomeRoute,
  NewImpactData,
  PendingTag,
  RESULT_COLORS,
  StatCard,
  WhereExplorer,
  WomenBars,
} from "@/components/impact/impacto-charts";
import { buttonVariants } from "@/components/ui/button";
import { catalogs, label } from "@/lib/catalogs";
import { showsSyntheticData } from "@/lib/config";
import { listIndicatorReports, listPrograms } from "@/lib/data";
import { formatNumber } from "@/lib/format";
import { byYear } from "@/lib/impact";
import {
  buildProjectRows,
  byAreaOrder,
  COVERAGE_ZONE,
  filterProjects,
  formatDecimal,
  formatPct,
  INCOME_AREA,
  periodsOf,
  sumMeasure,
  womenShare,
  type ImpactDashboardFilters,
  type Measure,
} from "@/lib/impact-metrics";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Impacto colectivo" };

const womenText = (m: Measure) => {
  const s = womenShare(m);
  return s == null ? null : formatPct(s);
};

export default async function ImpactoPage(props: PageProps<"/impacto">) {
  const sp = await props.searchParams;
  const pick = (k: string) =>
    typeof sp[k] === "string" && sp[k] ? (sp[k] as string) : undefined;
  // `territorio` se acepta por compatibilidad con enlaces anteriores al ajuste 21.
  const filters: ImpactDashboardFilters = {
    zona: pick("zona") ?? pick("territorio"),
    area: pick("area"),
    poblacion: pick("poblacion"),
    periodo: pick("periodo"),
  };

  const [programs, reports] = await Promise.all([
    listPrograms(),
    listIndicatorReports(),
  ]);
  const all = buildProjectRows(programs, reports, filters.periodo);
  const P = filterProjects(all, filters);
  const con = sumMeasure(P, "conectados");
  const fort = sumMeasure(P, "fortalecidos");

  // Bloque 2: solo proyectos con área principal Generación de ingresos.
  const incomeLabel = label("impactAreas", INCOME_AREA);
  const showIncome = !filters.area || filters.area === INCOME_AREA;
  const G = P.filter((p) => p.area === INCOME_AREA);
  const gCon = sumMeasure(G, "conectados");
  const gFort = sumMeasure(G, "fortalecidos");
  const gTrans = sumMeasure(G, "transformados");

  // Catálogos para filtros y mapa de calor: áreas en el orden de la propuesta; "Cobertura general" al final.
  const areas = [...catalogs.impactAreas].sort(byAreaOrder);
  const zonesAll = [...catalogs.territories].sort(
    (a, b) =>
      Number(a.code === COVERAGE_ZONE) - Number(b.code === COVERAGE_ZONE),
  );
  const opt = (x: { code: string; label: string }) => ({
    code: x.code,
    label: x.label,
  });
  const heatZones = zonesAll
    .filter((z) => !filters.zona || z.code === filters.zona)
    .map(opt);
  const heatAreas = areas
    .filter((a) => !filters.area || a.code === filters.area)
    .map(opt);

  // Serie por año (ajustes 26/28: el año de inicio de cada programa; antes era por trimestre) con los proyectos filtrados.
  const ids = new Set(P.map((p) => p.id));
  const trend = byYear(
    reports.filter(
      (r) =>
        r.program_id &&
        ids.has(r.program_id) &&
        (!filters.periodo || r.year === filters.periodo),
    ),
  );
  const orgCount = new Set(
    programs.filter((p) => ids.has(p.id)).map((p) => p.organization_id),
  ).size;

  return (
    <div>
      <section className="relative isolate overflow-hidden bg-goyn-violeta text-white">
        <Image
          src="/images/fotos/pilar-equidad.webp"
          alt=""
          fill
          sizes="100vw"
          className="-z-10 object-cover opacity-50 mix-blend-multiply grayscale"
        />
        <div className="goyn-container py-12 sm:py-16">
          <span className="goyn-eyebrow bg-goyn-magenta-a11y">
            Quiero medir el impacto
          </span>
          <h1 className="mt-4 text-3xl font-bold uppercase sm:text-5xl">
            Impacto colectivo del ecosistema
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-white/80">
            Lo que logramos juntos: jóvenes conectados, fortalecidos y
            transformados por organizaciones del ecosistema de oportunidades
            para los jóvenes en Barranquilla A.M.
          </p>
        </div>
      </section>

      <div className="goyn-container space-y-10 py-8">
        {/* Pin 1: encabezado y filtros */}
        <section aria-labelledby="resultados" className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-2">
            <h2
              id="resultados"
              className="font-heading text-2xl font-bold text-foreground sm:text-3xl"
            >
              Resultados con jóvenes
            </h2>
            <span className="text-sm text-muted-foreground">
              Dashboard de resultados del ecosistema
            </span>
          </div>
          {showsSyntheticData && (
            <p
              role="note"
              className="flex items-start gap-2 rounded-2xl border border-goyn-amarillo/60 bg-goyn-amarillo/15 p-4 text-sm text-foreground"
            >
              <TriangleAlertIcon
                className="mt-0.5 size-4 shrink-0"
                aria-hidden
              />
              <span>
                <strong>Datos de ejemplo.</strong> Las cifras de esta sección
                son sintéticas, sobre {formatNumber(programs.length)} programas
                de demostración, para mostrar cómo funcionará el dashboard. Se
                alimentará con el bloque de registro de proyectos del nuevo
                instrumento.
              </span>
            </p>
          )}
          <ImpactFilters
            values={filters}
            zones={zonesAll.map(opt)}
            areas={areas.map(opt)}
            populations={catalogs.populations.map(opt)}
            periods={periodsOf(reports)}
          />
        </section>

        {/* Bloque 1 — pines 2 y 3 */}
        <section aria-labelledby="bloque-1" className="space-y-5">
          <BlockHead id="bloque-1" badge="1" title="Conectados y fortalecidos">
            Resultados de todos los proyectos de la red: jóvenes que participan
            y jóvenes que evidencian un fortalecimiento de sus habilidades
            técnicas, socioemocionales y de autonomía.
          </BlockHead>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Proyectos activos"
              value={formatNumber(P.length)}
              description="Proyectos que cumplen los filtros seleccionados."
              color="#060A28"
            />
            <StatCard
              label="Jóvenes conectados"
              value={formatNumber(con.total)}
              description="Jóvenes atendidos a la fecha en los proyectos."
              women={womenText(con)}
              color={RESULT_COLORS.conectados.base}
            />
            <StatCard
              label="Jóvenes fortalecidos"
              value={formatNumber(fort.total)}
              description="Jóvenes que evidenciaron fortalecimiento de habilidades técnicas, socioemocionales y de autonomía."
              women={womenText(fort)}
              color={RESULT_COLORS.fortalecidos.base}
            />
            <StatCard
              label="De cada 10 conectados"
              value={
                con.total ? formatDecimal((fort.total / con.total) * 10) : "0"
              }
              description="se fortalecen. Relación entre fortalecidos y conectados."
              color={RESULT_COLORS.fortalecidos.solid}
            />
          </div>
          <ChartCard
            id="mujeres"
            title="Jóvenes alcanzados y participación de mujeres"
            subtitle="La barra completa es el total de jóvenes; la parte oscura, cuántas son mujeres."
          >
            <WomenBars
              rows={[
                { key: "conectados", label: "Conectados", m: con },
                { key: "fortalecidos", label: "Fortalecidos", m: fort },
              ]}
            />
          </ChartCard>
        </section>

        {/* Pines 4 y 5 */}
        <section aria-labelledby="donde" className="space-y-5">
          <BlockHead
            id="donde"
            badge="◎"
            title="¿Dónde están ocurriendo los programas?"
          >
            Los proyectos reportan un total de jóvenes y varias zonas, sin el
            detalle por zona. Por eso el mapa de calor no reparte jóvenes:
            muestra cuántos programas hay en cada zona según su área principal.
            Al lado, los programas con mejores resultados.
          </BlockHead>
          <WhereExplorer
            key={JSON.stringify(filters)}
            rows={P}
            zones={heatZones}
            areas={heatAreas}
            incomeLabel={incomeLabel}
          />
        </section>

        {/* Bloque 2 — pines 6 y 7 */}
        <section
          aria-labelledby="bloque-2"
          className="relative space-y-5 overflow-hidden rounded-2xl border bg-card/60 p-5 sm:p-6"
        >
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-1.5 bg-goyn-magenta"
          />
          <BlockHead id="bloque-2" badge="2" title="Transformados">
            Complemento para los proyectos cuya área principal es{" "}
            <strong className="text-foreground">{incomeLabel}</strong>: jóvenes
            que, tras fortalecerse, accedieron a un empleo o iniciaron o
            mejoraron un emprendimiento.
          </BlockHead>
          {showIncome ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label={`Proyectos de ${incomeLabel}`}
                  value={formatNumber(G.length)}
                  description={`De ${formatNumber(P.length)} proyectos en la vista.`}
                  color="#060A28"
                />
                <StatCard
                  label="Jóvenes transformados"
                  value={formatNumber(gTrans.total)}
                  description="Accedieron a un empleo o iniciaron o mejoraron un emprendimiento."
                  women={womenText(gTrans)}
                  color={RESULT_COLORS.transformados.base}
                />
                <StatCard
                  label="Accedieron a un empleo"
                  value={<PendingTag />}
                  description="Según el seguimiento del proyecto. El reporte actual no separa empleo de emprendimiento."
                  women={null}
                  color={RESULT_COLORS.transformados.solid}
                />
                <StatCard
                  label="Iniciaron o mejoraron un emprendimiento"
                  value={<PendingTag />}
                  description="Según el seguimiento del proyecto. El reporte actual no separa empleo de emprendimiento."
                  women={null}
                  color="#FFBD25"
                />
              </div>
              <ChartCard
                id="ruta"
                title={`Ruta de los jóvenes en ${incomeLabel}`}
                subtitle={`Solo proyectos de ${incomeLabel}. Entre cada paso, el porcentaje que avanza.`}
              >
                <IncomeRoute
                  steps={[
                    {
                      key: "conectados",
                      label: "Conectados",
                      value: gCon.total,
                    },
                    {
                      key: "fortalecidos",
                      label: "Fortalecidos",
                      value: gFort.total,
                    },
                    {
                      key: "transformados",
                      label: "Transformados",
                      value: gTrans.total,
                    },
                  ]}
                />
              </ChartCard>
            </>
          ) : (
            <p className="rounded-xl border-2 border-dashed p-4 text-sm text-muted-foreground">
              <strong className="text-foreground">
                No aplica para {label("impactAreas", filters.area)}.
              </strong>{" "}
              El resultado de transformados solo se pregunta en proyectos cuya
              área principal es {incomeLabel}. Elige “Todas las áreas” o “
              {incomeLabel}” para verlo.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Es un zoom sobre parte del bloque 1, no una población adicional: no
            se suma con él. Si un joven logró empleo y emprendimiento, se cuenta
            dos veces.
          </p>
        </section>

        <section
          className="rounded-2xl border bg-card p-5"
          aria-labelledby="serie"
        >
          <h2
            id="serie"
            className="mb-4 font-heading text-lg font-bold text-foreground"
          >
            Evolución por año
          </h2>
          <p className="-mt-2 mb-4 text-sm text-muted-foreground">
            Resultados consolidados según el año de inicio de cada programa.
          </p>
          <TrendChart data={trend} />
        </section>

        <p className="flex items-start gap-2 rounded-2xl bg-goyn-lila/60 p-4 text-sm text-foreground">
          <InfoIcon
            className="mt-0.5 size-4 shrink-0 text-goyn-violeta"
            aria-hidden
          />
          <span>
            <strong>Metodología:</strong> las cifras son la suma de reportes
            validados por el equipo GOYN de {formatNumber(P.length)} proyectos
            de {formatNumber(orgCount)} organizaciones, no personas únicas: un
            mismo joven puede participar en varios programas. El porcentaje de
            mujeres se calcula sobre los reportes que traen ese dato.
          </span>
        </p>

        {/* Pin 8 */}
        <NewImpactData />

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed p-5">
          <p className="text-sm text-muted-foreground">
            ¿Necesitas los datos? La descarga en CSV/XLSX está disponible para
            el equipo GOYN y aliados autorizados.
          </p>
          <a
            href="/ingresar"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-10 rounded-full",
            )}
          >
            <DownloadIcon aria-hidden /> Solicitar descarga
          </a>
        </div>
      </div>
    </div>
  );
}
