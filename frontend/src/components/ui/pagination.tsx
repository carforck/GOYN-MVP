import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Paginador reutilizable (componente de servidor, solo enlaces): conserva todos los searchParams
// actuales y cambia únicamente el parámetro de página (por defecto ?pagina=N).

export type SearchParamsRecord = Record<string, string | string[] | undefined>;

/** Lee la página pedida en la URL (1 si no hay, no es número o es menor que 1). */
export function readPage(sp: SearchParamsRecord, param = "pagina"): number {
  const raw = sp[param];
  const n = Number.parseInt(Array.isArray(raw) ? raw[0] ?? "" : raw ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** Ajusta la página al rango válido y devuelve los índices [from, to) para slice() o range(). */
export function pageBounds(requested: number, pageSize: number, total: number) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, requested), pageCount);
  const from = (page - 1) * pageSize;
  return { page, pageCount, from, to: Math.min(from + pageSize, total) };
}

/** Pagina una lista en memoria a partir de los searchParams. */
export function paginate<T>(items: T[], sp: SearchParamsRecord, pageSize: number, param = "pagina") {
  const bounds = pageBounds(readPage(sp, param), pageSize, items.length);
  return { ...bounds, total: items.length, pageSize, items: items.slice(bounds.from, bounds.to) };
}

/** Números de página con elipsis: 1 … 4 5 6 … 12 */
function pageList(page: number, pageCount: number): (number | "…")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (page >= pageCount - 2) [pageCount - 3, pageCount - 2, pageCount - 1].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
}

function hrefFor(pathname: string, sp: SearchParamsRecord, param: string, page: number) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (key === param || value == null) continue;
    for (const v of Array.isArray(value) ? value : [value]) qs.append(key, v);
  }
  if (page > 1) qs.set(param, String(page));
  const s = qs.toString();
  return s ? `${pathname}?${s}` : pathname;
}

const itemBase =
  "inline-flex h-11 min-w-11 items-center justify-center gap-1 rounded-full px-3 text-sm font-semibold transition-colors sm:h-10 sm:min-w-10";

export function Pagination({
  pathname,
  searchParams,
  page,
  pageSize,
  total,
  param = "pagina",
  itemLabel = "resultados",
  label = "Paginación",
  className,
}: {
  pathname: string;
  searchParams: SearchParamsRecord;
  page: number;
  pageSize: number;
  total: number;
  param?: string;
  /** Sustantivo plural para "Mostrando X–Y de N …" */
  itemLabel?: string;
  /** aria-label del <nav>; cambiarlo si hay más de un paginador en la página. */
  label?: string;
  className?: string;
}) {
  if (total === 0) return null;
  const { page: current, pageCount, from, to } = pageBounds(page, pageSize, total);
  const summary = (
    <p className="text-sm text-muted-foreground" aria-live="polite">
      Mostrando <strong className="font-semibold text-foreground tabular-nums">{from + 1}–{to}</strong> de{" "}
      <strong className="font-semibold text-foreground tabular-nums">{total}</strong> {itemLabel}
    </p>
  );
  if (pageCount <= 1) return <div className={cn("flex flex-wrap items-center gap-3", className)}>{summary}</div>;

  const link = (p: number) => hrefFor(pathname, searchParams, param, p);
  const disabled = "pointer-events-none opacity-40";
  const idle = "border bg-card text-foreground hover:bg-muted";

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      {summary}
      <nav aria-label={label}>
        <ul className="flex flex-wrap items-center gap-1.5">
          <li>
            {current > 1 ? (
              <Link href={link(current - 1)} rel="prev" className={cn(itemBase, idle)}>
                <ChevronLeftIcon className="size-4" aria-hidden /> <span>Anterior</span>
              </Link>
            ) : (
              <span aria-disabled="true" className={cn(itemBase, idle, disabled)}>
                <ChevronLeftIcon className="size-4" aria-hidden /> <span>Anterior</span>
              </span>
            )}
          </li>
          {pageList(current, pageCount).map((p, i) =>
            p === "…" ? (
              <li key={`e${i}`} aria-hidden className="hidden px-1 text-muted-foreground sm:block">…</li>
            ) : (
              <li key={p} className={cn(p !== current && p !== 1 && p !== pageCount && "hidden sm:block")}>
                <Link
                  href={link(p)}
                  aria-current={p === current ? "page" : undefined}
                  aria-label={`Página ${p}`}
                  className={cn(itemBase, "tabular-nums", p === current ? "bg-goyn-navy text-white dark:bg-goyn-violeta" : idle)}
                >
                  {p}
                </Link>
              </li>
            ),
          )}
          <li>
            {current < pageCount ? (
              <Link href={link(current + 1)} rel="next" className={cn(itemBase, idle)}>
                <span>Siguiente</span> <ChevronRightIcon className="size-4" aria-hidden />
              </Link>
            ) : (
              <span aria-disabled="true" className={cn(itemBase, idle, disabled)}>
                <span>Siguiente</span> <ChevronRightIcon className="size-4" aria-hidden />
              </span>
            )}
          </li>
        </ul>
      </nav>
    </div>
  );
}
