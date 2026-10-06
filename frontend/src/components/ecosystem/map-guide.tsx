"use client";

import { ArrowLeftIcon, ArrowRightIcon, CompassIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Guía visual del mapa: ilumina cada zona (data-tour="…") y explica qué se puede hacer con ella.
// Se abre sola la primera vez y queda el botón "¿Cómo usar el mapa?" para repetirla.
const STEPS = [
  { target: "mapa", title: "Así se lee el mapa", text: "Cada punto es una organización y cada zona delimitada es una localidad. Los círculos con número agrupan organizaciones cercanas: tócalos para acercarte. Toca un punto para ver su ficha y su hoja de vida." },
  { target: "cifras", title: "Cifras que cambian el mapa", text: "Elige una localidad para ir a ella, o tócala directamente en el mapa. Toca una cifra (organizaciones o jóvenes conectados, fortalecidos, transformados) y el mapa la dibuja por localidad: más grande = más." },
  { target: "filtros", title: "Filtra lo que ves", text: "Muestra solo las organizaciones que te interesan: por tipo, rol, área, población, territorio o línea de trabajo. El mapa, las cifras y las gráficas se actualizan con tus filtros." },
  { target: "capas", title: "Suma capas", text: "Ve organizaciones una a una o agrupadas por localidad, coloréalas por rol o por área y enciende las conexiones (socios, aliados, colaboradores) cuando las necesites." },
  { target: "buscar", title: "Busca o cambia de vista", text: "Escribe el nombre de una organización o un tema. Con «Vista lista» ves los mismos resultados como directorio." },
  { target: "feed", title: "Novedades en vivo", text: "La campana te avisa cuando se registra una organización, llega un reporte o nace una conexión. Ábrela y toca una novedad para verla en el mapa: se marca con ondas." },
  { target: "graficas", title: "Lo que el mapa no muestra", text: "Más abajo encuentras dónde falta oferta, quién colabora con quién y qué organizaciones articulan el ecosistema." },
] as const;

const KEY = "goyn-guia-mapa-v1";
type Rect = { top: number; left: number; width: number; height: number };

function findTarget(name: string) {
  const el = document.querySelector<HTMLElement>(`[data-tour="${name}"]`);
  if (!el) return null;
  if (el instanceof HTMLDetailsElement) el.open = true;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 ? el : null;
}

export function MapGuide({ autoStart }: { autoStart: boolean }) {
  const [step, setStep] = useState<number | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const card = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setStep(null);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* sin almacenamiento */
    }
  }, []);

  // Pasa al siguiente paso visible (en celular algunas zonas no existen y se saltan).
  const go = useCallback(
    (from: number, dir: 1 | -1) => {
      for (let i = from; i >= 0 && i < STEPS.length; i += dir) if (findTarget(STEPS[i].target)) return setStep(i);
      if (dir === 1) close();
    },
    [close],
  );

  useEffect(() => {
    if (!autoStart) return;
    let seen = false;
    try {
      seen = localStorage.getItem(KEY) === "1";
    } catch {
      /* sin almacenamiento */
    }
    if (seen || window.matchMedia("(max-width: 767px)").matches) return;
    const id = setTimeout(() => go(0, 1), 900);
    return () => clearTimeout(id);
  }, [autoStart, go]);

  // Medir el objetivo del paso actual (y seguirlo si la página se desplaza o cambia de tamaño).
  useEffect(() => {
    if (step === null) return;
    const el = findTarget(STEPS[step].target);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    const measure = () => {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    measure();
    const t = setTimeout(measure, 450);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    card.current?.focus();
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step]);

  useEffect(() => {
    if (step === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(step + 1, 1);
      if (e.key === "ArrowLeft") go(step - 1, -1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, go, close]);

  const trigger = (
    <button
      type="button"
      onClick={() => go(0, 1)}
      aria-label="¿Cómo usar el mapa?"
      className="absolute top-[11.5rem] right-3 z-10 inline-flex size-10 items-center justify-center gap-1.5 rounded-full border border-goyn-navy/10 bg-white/95 text-sm font-bold text-goyn-violeta shadow-lg shadow-goyn-violeta/15 backdrop-blur transition-colors hover:bg-goyn-lila md:top-3 md:right-14 md:size-auto md:px-3.5 md:py-2"
    >
      <CompassIcon className="size-4" aria-hidden /> <span className="hidden md:inline">¿Cómo usar el mapa?</span>
    </button>
  );

  if (step === null || !rect) return trigger;

  const pad = 8;
  const s = STEPS[step];
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardW = Math.min(340, vw - 32);
  // Tarjeta a la derecha del objetivo si cabe; si no, debajo o encima.
  let left = rect.left + rect.width + 16;
  let top = rect.top;
  if (left + cardW > vw - 16) {
    left = Math.min(Math.max(16, rect.left), vw - cardW - 16);
    top = rect.top + rect.height + 16 + 220 < vh ? rect.top + rect.height + 16 : Math.max(16, rect.top - 236);
  }
  top = Math.min(Math.max(16, top), vh - 240);

  return (
    <>
      {trigger}
      {createPortal(
        <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-labelledby="guia-titulo">
          <div className="absolute inset-0" onClick={close} />
          <div
            aria-hidden
            className="pointer-events-none absolute rounded-2xl ring-4 ring-goyn-magenta transition-all duration-300"
            style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, boxShadow: "0 0 0 9999px rgba(6,10,40,0.62)" }}
          />
          <div
            ref={card}
            tabIndex={-1}
            className="absolute rounded-2xl bg-white p-5 text-goyn-navy shadow-2xl outline-none"
            style={{ top, left, width: cardW }}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-bold tracking-widest text-goyn-violeta uppercase">Paso {step + 1} de {STEPS.length}</p>
              <button type="button" onClick={close} aria-label="Cerrar la guía" className="-mt-1 -mr-1 grid size-7 place-items-center rounded-full text-goyn-navy/60 hover:bg-goyn-lila">
                <XIcon className="size-4" aria-hidden />
              </button>
            </div>
            <h2 id="guia-titulo" className="mt-1 font-heading text-lg font-bold">{s.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-goyn-navy/80">{s.text}</p>
            <div className="mt-3 flex gap-1" aria-hidden>
              {STEPS.map((_, i) => (
                <span key={i} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-goyn-violeta" : "bg-goyn-lila")} />
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between gap-2">
              <button type="button" onClick={close} className="text-sm font-semibold text-goyn-navy/60 hover:text-goyn-navy">Saltar guía</button>
              <div className="flex gap-2">
                {step > 0 && (
                  <Button type="button" variant="outline" size="sm" className="h-9 rounded-full" onClick={() => go(step - 1, -1)}>
                    <ArrowLeftIcon aria-hidden /> Atrás
                  </Button>
                )}
                <Button type="button" size="sm" className="h-9 rounded-full px-4 font-bold" onClick={() => go(step + 1, 1)}>
                  {step === STEPS.length - 1 ? "¡Listo!" : <>Siguiente <ArrowRightIcon aria-hidden /></>}
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
