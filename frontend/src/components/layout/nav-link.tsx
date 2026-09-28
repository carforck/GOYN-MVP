"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLink({ href, soon, children, className }: { href: string; soon?: boolean; children: React.ReactNode; className?: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-colors",
        active ? "bg-goyn-lila text-goyn-violeta" : "text-goyn-navy/80 hover:bg-muted hover:text-goyn-navy",
        soon && !active && "text-goyn-navy/55",
        className,
      )}
    >
      {children}
      {soon && (
        <span className="rounded-full bg-goyn-rosa px-1.5 py-0.5 text-[10px] leading-none font-bold text-accent-foreground uppercase">
          Pronto
        </span>
      )}
    </Link>
  );
}
