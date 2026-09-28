"use client";

import { ChevronDownIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Agrupa en el encabezado los módulos previstos para fases posteriores.
export function SoonMenu({ items }: { items: { href: string; label: string; phase: string }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const active = items.some((i) => pathname.startsWith(i.href));

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-colors",
          active ? "bg-goyn-lila text-goyn-violeta" : "text-goyn-navy/70 hover:bg-muted hover:text-goyn-navy",
        )}
      >
        <SparklesIcon className="size-4 text-goyn-magenta" aria-hidden /> Próximamente
        <ChevronDownIcon className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div role="menu" className="absolute top-12 right-0 w-72 rounded-2xl border bg-white p-2 shadow-xl">
          {items.map((i) => (
            <Link key={i.href} role="menuitem" href={i.href} onClick={() => setOpen(false)} className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-muted">
              <span className="text-sm font-semibold text-goyn-navy">{i.label}</span>
              <span className="rounded-full bg-goyn-rosa px-2 py-0.5 text-[11px] font-bold text-accent-foreground">{i.phase}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
