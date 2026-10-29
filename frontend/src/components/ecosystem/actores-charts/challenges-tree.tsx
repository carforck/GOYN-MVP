"use client";

import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useState } from "react";
import { catalogs } from "@/lib/catalogs";
import { cn } from "@/lib/utils";
import type { ChartOrg } from "./shared";

// D) "Retos por área de impacto": árbol horizontal desplegable
// raíz → área (n orgs) → problemática/barrera (n orgs) → organizaciones.
// Usa la misma selección de zonas del radar. "No aplica" no se muestra.

type Node = { id: string; label: string; sub?: string; count?: number; color?: string; icon?: string; href?: string; children?: Node[] };

const isNoAplica = (code: string, label: string) => /no[_ ]aplica/i.test(code) || /no aplica/i.test(label);

function buildTree(orgs: ChartOrg[], selName: string): Node {
  const areas: Node[] = catalogs.impactAreas
    .map((a) => {
      // Mismo criterio que el radar: organizaciones que marcaron el área.
      const inArea = orgs.filter((o) => o.area_codes.includes(a.code));
      const problems: Node[] = catalogs.problems
        .filter((p) => p.area === a.code && !isNoAplica(p.code, p.label))
        .map((p) => {
          const withProblem = orgs.filter((o) => o.problem_codes.includes(p.code));
          return {
            id: `${a.code}/${p.code}`,
            label: p.label,
            count: withProblem.length,
            color: a.color,
            children: [...withProblem]
              .sort((x, y) => x.name.localeCompare(y.name, "es"))
              .map((o) => ({ id: `${a.code}/${p.code}/${o.slug}`, label: o.name, href: `/actores/${o.slug}` })),
          };
        })
        .filter((p) => (p.count ?? 0) > 0)
        .sort((x, y) => (y.count ?? 0) - (x.count ?? 0) || x.label.localeCompare(y.label, "es"));
      return { id: a.code, label: a.label, count: inArea.length, color: a.color, icon: `/images/areas/${a.code}.svg`, children: problems };
    })
    .filter((a) => (a.count ?? 0) > 0)
    .sort((x, y) => (y.count ?? 0) - (x.count ?? 0) || x.label.localeCompare(y.label, "es"));
  return { id: "root", label: "Áreas de impacto", sub: selName, count: orgs.length, children: areas };
}

export function ChallengesTree({ orgs, selName, children }: { orgs: ChartOrg[]; selName: string | null; children?: ReactNode }) {
  const tree = buildTree(orgs, selName ?? "Toda la red");
  const [open, setOpen] = useState<Set<string>>(() => new Set(["root"]));
  const toggle = (id: string) =>
    setOpen((s) => {
      const next = new Set(s);
      if (next.has(id)) {
        // Al cerrar un recuadro se cierran también sus descendientes; cerrar la raíz vuelve al inicio.
        if (id === "root") return new Set();
        for (const k of next) if (k === id || k.startsWith(`${id}/`)) next.delete(k);
      } else next.add(id);
      return next;
    });
  const btn = "rounded-full border bg-card px-3 py-1 text-xs font-semibold text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-goyn-violeta";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-0.5">
          <h3 className="text-lg font-bold text-foreground">Retos por área de impacto</h3>
          <p className="text-sm text-foreground" aria-live="polite">
            {selName ? `${orgs.length} organizaciones con presencia en ${selName}` : `${orgs.length} organizaciones de toda la red`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setOpen(new Set(["root", ...(tree.children ?? []).map((a) => a.id)]))} className={btn}>
            Expandir áreas
          </button>
          <button type="button" onClick={() => setOpen(new Set(["root"]))} className={btn}>
            Contraer todo
          </button>
        </div>
      </div>
      <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
        Toca un recuadro con <b className="text-foreground">›</b> para desplegar el siguiente nivel: área de impacto, barreras que atienden las organizaciones y
        organizaciones que trabajan cada barrera. El número es la cantidad de organizaciones.
      </p>
      {children}
      <p className="text-[11px] font-semibold text-goyn-violeta sm:hidden">Desliza para ver todo el árbol →</p>
      <div className="overflow-x-auto pb-2">
        <div className="w-max min-w-full py-1">
          <TreeNode node={tree} depth={0} open={open} toggle={toggle} />
        </div>
      </div>
    </div>
  );
}

function TreeNode({ node, depth, open, toggle }: { node: Node; depth: number; open: Set<string>; toggle: (id: string) => void }) {
  const hasChildren = !!node.children?.length;
  const isOpen = hasChildren && open.has(node.id);
  const box = cn(
    "flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-left text-xs shadow-sm",
    depth === 0 && "bg-goyn-navy text-sm font-bold text-white",
    depth === 1 && "w-60 font-bold text-foreground",
    depth === 2 && "w-72 text-foreground",
    depth === 3 && "w-60 py-1.5 text-foreground",
  );
  const style = node.color && depth > 0 ? { borderLeftColor: node.color, borderLeftWidth: 4 } : undefined;
  const content = (
    <>
      {node.icon && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={node.icon} alt="" width={22} height={22} className="size-5.5 shrink-0" />
      )}
      <span className="min-w-0 flex-1 leading-snug">
        {node.label}
        {node.sub && <small className="block text-[10px] font-semibold text-white/75">{node.sub}</small>}
      </span>
      {node.count != null && (
        <span
          className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums", depth === 0 ? "bg-white/15 text-white" : "bg-muted text-foreground")}
          aria-label={`${node.count} organizaciones`}
        >
          {node.count}
        </span>
      )}
      {hasChildren && <ChevronRightIcon className={cn("size-4 shrink-0 transition-transform", isOpen && "rotate-180")} aria-hidden />}
    </>
  );

  return (
    <div className="flex items-start">
      {hasChildren ? (
        <button type="button" aria-expanded={isOpen} onClick={() => toggle(node.id)} className={cn(box, "hover:ring-2 hover:ring-goyn-violeta/30")} style={style}>
          {content}
        </button>
      ) : node.href ? (
        <Link href={node.href} className={cn(box, "hover:text-goyn-violeta hover:underline")} style={style}>
          {content}
        </Link>
      ) : (
        <div className={box} style={style}>
          {content}
        </div>
      )}
      {isOpen && (
        <div className="relative ml-6 flex flex-col gap-2 border-l-2 border-border pl-4 before:absolute before:top-4 before:-left-6 before:h-0.5 before:w-6 before:bg-border">
          {node.children!.map((child) => (
            <div key={child.id} className="relative before:absolute before:top-4 before:-left-4 before:h-0.5 before:w-4 before:bg-border">
              <TreeNode node={child} depth={depth + 1} open={open} toggle={toggle} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
