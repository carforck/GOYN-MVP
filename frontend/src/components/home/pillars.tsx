"use client";

import Image from "next/image";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { pilares, type Pillar } from "@/lib/home-content";

// Pilares del Colaborativo: al tocar uno se abre su definición (diseño 08-oct).
export function Pillars() {
  const [open, setOpen] = useState<Pillar | null>(null);
  return (
    <>
      <ul className="mx-auto flex max-w-3xl flex-wrap justify-center gap-x-6 gap-y-8 sm:gap-x-12">
        {pilares.map((p) => (
          <li key={p.code} className="w-32 sm:w-36">
            <button
              type="button"
              onClick={() => setOpen(p)}
              className="group flex w-full flex-col items-center gap-3 rounded-2xl p-1 text-center focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              aria-haspopup="dialog"
            >
              <Image
                src={`/images/pilares/${p.code}.svg`}
                alt=""
                width={96}
                height={96}
                className="size-20 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 sm:size-24"
              />
              <span className="text-sm leading-snug font-semibold text-foreground group-hover:text-goyn-magenta-a11y">{p.title}</span>
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-md gap-5 rounded-3xl p-6 sm:max-w-md sm:p-8">
          {open && (
            <>
              <div className="flex items-center gap-4 pr-6">
                <Image src={`/images/pilares/${open.code}.svg`} alt="" width={72} height={72} className="size-16 shrink-0" />
                <DialogTitle className="font-heading text-2xl leading-tight font-bold text-goyn-magenta-a11y">{open.title}</DialogTitle>
              </div>
              <ul className="space-y-2.5">
                {open.points.map((t) => (
                  <li key={t} className="flex gap-2.5 text-sm leading-relaxed text-foreground/85">
                    <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-goyn-violeta" />
                    {t}
                  </li>
                ))}
              </ul>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
