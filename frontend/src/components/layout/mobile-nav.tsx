"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ProductLogo } from "@/components/brand/logo";
import { NavLink } from "@/components/layout/nav-link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; soon?: boolean };

export function MobileNav({ items, account }: { items: Item[]; account: { href: string; label: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon-lg" className="lg:hidden" aria-label="Abrir menú" />}>
        <MenuIcon className="size-6" />
      </SheetTrigger>
      <SheetContent side="right" className="w-[86vw] max-w-sm gap-0 p-0">
        <SheetTitle className="sr-only">Menú</SheetTitle>
        <div className="border-b p-4">
          <ProductLogo />
        </div>
        <nav aria-label="Principal móvil" className="flex flex-col gap-1 p-3" onClick={() => setOpen(false)}>
          <NavLink href="/" className="justify-start text-base">Inicio</NavLink>
          {items.map((item) => (
            <NavLink key={item.href} href={item.href} soon={item.soon} className="justify-start text-base">
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2 border-t p-4" onClick={() => setOpen(false)}>
          <Link href={account.href} className={cn(buttonVariants({ variant: "outline" }), "h-11 rounded-full font-semibold")}>
            {account.label}
          </Link>
          <Link href="/registro" className={cn(buttonVariants(), "h-11 rounded-full bg-goyn-magenta-a11y font-bold text-white hover:bg-goyn-magenta-a11y/90")}>
            Registra tu organización
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
