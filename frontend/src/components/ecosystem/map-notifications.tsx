"use client";

import { BellIcon, MapPinIcon, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useLive } from "@/components/live/live-provider";
import { describeEvent } from "@/components/live/live-ticker";
import { shortTerritory } from "@/lib/catalogs";
import { formatDateTime } from "@/lib/format";
import type { LiveEvent } from "@/lib/live/types";
import { cn } from "@/lib/utils";

const kindLabel = { registro: "Nueva organización", conexion: "Nueva conexión", reporte: "Nuevo reporte" } as const;
const pastLabel = { registro: "Organización publicada", conexion: "Conexión", reporte: "Reporte validado" } as const;
const kindColor = { registro: "#DB0089", conexion: "#FE5200", reporte: "#9B00FF" } as const;

// Campana de novedades del mapa (reemplaza el panel "Actividad en vivo"): cuenta lo nuevo,
// avisa cuando se registra una organización y lleva cada novedad a su lugar en el mapa.
export function MapNotifications({ onLocate }: { onLocate: (e: LiveEvent) => void }) {
  const live = useLive();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<Set<string>>(() => new Set());
  const [toast, setToast] = useState<LiveEvent | null>(null);

  const fresh = useMemo(() => live.events.filter((e) => !e.historic), [live.events]);
  const unread = fresh.filter((e) => !seen.has(e.id)).length;
  const list = live.events.slice(0, 8);

  // Aviso emergente solo para organizaciones nuevas (lo más relevante para quien mira el mapa).
  const last = live.lastEvent;
  useEffect(() => {
    if (!last || last.historic || last.kind !== "registro") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reacciona a un evento externo (tiempo real)
    setToast(last);
    const id = setTimeout(() => setToast(null), 8000);
    return () => clearTimeout(id);
  }, [last]);

  const toggle = () => {
    setOpen((o) => !o);
    setSeen(new Set(live.events.map((e) => e.id)));
  };

  const locate = (e: LiveEvent) => {
    onLocate(e);
    setOpen(false);
    setToast(null);
  };

  return (
    <div data-tour="feed" className="absolute right-3 bottom-8 z-10 flex flex-col items-end gap-2">
      <AnimatePresence>
        {toast && !open && (
          <motion.div
            key={toast.id}
            role="status"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            className="w-72 rounded-2xl border border-goyn-magenta-a11y/30 bg-white/95 p-3 shadow-xl shadow-goyn-violeta/15 backdrop-blur"
          >
            <div className="flex items-start gap-2">
              <span className="mt-1 size-2.5 shrink-0 animate-ping rounded-full bg-goyn-magenta-a11y" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold tracking-wider text-goyn-magenta-a11y uppercase">Nueva organización</p>
                <p className="truncate font-heading text-sm font-bold">{toast.orgName}</p>
                <p className="text-xs text-goyn-navy/70">{toast.territory ? shortTerritory(toast.territory) : "Barranquilla A.M."}</p>
              </div>
              <button type="button" aria-label="Cerrar aviso" onClick={() => setToast(null)} className="grid size-6 place-items-center rounded-full text-goyn-navy/50 hover:bg-goyn-lila">
                <XIcon className="size-3.5" aria-hidden />
              </button>
            </div>
            {toast.lat != null && (
              <button type="button" onClick={() => locate(toast)} className="mt-2 inline-flex items-center gap-1 rounded-full bg-goyn-magenta-a11y px-3 py-1 text-xs font-bold text-white hover:bg-goyn-magenta-a11y/90">
                <MapPinIcon className="size-3.5" aria-hidden /> Ver en el mapa
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-goyn-navy/10 bg-white/95 shadow-xl shadow-goyn-violeta/15 backdrop-blur"
          >
            <p className="flex items-center gap-2 border-b border-goyn-navy/10 px-4 py-2.5 text-xs font-bold tracking-wider text-goyn-navy/70 uppercase">
              <span className="goyn-live-dot" aria-hidden /> Novedades {live.source === "demo" && "· simulación"}
            </p>
            <ul className="max-h-80 divide-y divide-goyn-navy/5 overflow-y-auto">
              {list.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    disabled={e.lat == null}
                    onClick={() => locate(e)}
                    className="flex w-full items-start gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-goyn-lila/50 disabled:cursor-default"
                  >
                    <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full" style={{ backgroundColor: kindColor[e.kind] }} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] font-bold tracking-wide text-goyn-navy/60 uppercase">{e.historic ? pastLabel[e.kind] : kindLabel[e.kind]}</span>
                      <span className="block truncate text-sm font-semibold">{e.orgName}</span>
                      <span className="block text-xs text-goyn-navy/65">
                        {describeEvent(e)} · {e.territory ? shortTerritory(e.territory) : "Barranquilla A.M."}
                      </span>
                      <span className="block text-[11px] text-goyn-navy/45">{formatDateTime(e.at)}</span>
                    </span>
                    {e.lat != null && <MapPinIcon className="mt-1 size-4 shrink-0 text-goyn-violeta" aria-hidden />}
                  </button>
                </li>
              ))}
              {list.length === 0 && <li className="px-4 py-6 text-center text-sm text-goyn-navy/60">Sin novedades por ahora.</li>}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={unread ? `Novedades del ecosistema: ${unread} sin ver` : "Novedades del ecosistema"}
        className={cn(
          "relative grid size-12 place-items-center rounded-full border border-goyn-navy/10 bg-white text-goyn-violeta shadow-lg shadow-goyn-violeta/20 transition-colors hover:bg-goyn-lila",
          open && "bg-goyn-lila",
        )}
      >
        <BellIcon className={cn("size-5", unread > 0 && "motion-safe:animate-[wiggle_1.2s_ease-in-out_infinite]")} aria-hidden />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-goyn-magenta-a11y px-1 text-[11px] font-bold text-white ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </div>
  );
}
