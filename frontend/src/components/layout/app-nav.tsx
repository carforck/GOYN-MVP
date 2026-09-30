"use client";

import {
  BarChart3Icon,
  BookOpenIcon,
  Building2Icon,
  ClipboardListIcon,
  DownloadIcon,
  FileClockIcon,
  FolderKanbanIcon,
  InboxIcon,
  LayoutDashboardIcon,
  LayoutTemplateIcon,
  MenuIcon,
  Share2Icon,
  UserCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const icons = {
  dashboard: LayoutDashboardIcon,
  registro: ClipboardListIcon,
  perfil: UserCircleIcon,
  programas: FolderKanbanIcon,
  indicadores: BarChart3Icon,
  relaciones: Share2Icon,
  bandeja: InboxIcon,
  organizaciones: Building2Icon,
  catalogos: BookOpenIcon,
  exportar: DownloadIcon,
  auditoria: FileClockIcon,
  contenido: LayoutTemplateIcon,
};

export type AppNavItem = { href: string; label: string; icon: keyof typeof icons; badge?: string | number; soon?: boolean };

export function AppNav({ items, onNavigate }: { items: AppNavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5 p-3" aria-label="Navegación del área">
      {items.map((item) => {
        const Icon = icons[item.icon];
        const exact = item.href === "/panel" || item.href === "/admin";
        const active = exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors",
              active ? "bg-sidebar-primary text-white" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white",
            )}
          >
            <Icon className="size-4.5 shrink-0" aria-hidden />
            <span className="flex-1">{item.label}</span>
            {item.badge ? <span className="rounded-full bg-goyn-naranja px-2 py-0.5 text-[11px] font-bold text-goyn-navy">{item.badge}</span> : null}
            {item.soon && <span className="text-[10px] font-bold tracking-wide text-sidebar-foreground/50 uppercase">Pronto</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileAppNav({ items, areaLabel }: { items: AppNavItem[]; areaLabel: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon-lg" aria-label="Abrir menú del área" />}>
        <MenuIcon className="size-6" />
      </SheetTrigger>
      <SheetContent side="left" className="w-[80vw] max-w-xs bg-sidebar p-0 text-sidebar-foreground">
        <SheetTitle className="p-5 pb-0 text-xs font-bold tracking-widest text-goyn-magenta uppercase">{areaLabel}</SheetTitle>
        <AppNav items={items} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
