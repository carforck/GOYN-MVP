"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

const subscribe = () => () => {};

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  // El tema real solo se conoce en el navegador; evita el desajuste de hidratación.
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const dark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={dark ? "Modo claro" : "Modo oscuro"}
      className={cn(
        "relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full border bg-card text-foreground transition-colors hover:border-goyn-violeta hover:text-goyn-violeta",
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={dark ? "luna" : "sol"}
          initial={{ y: 14, rotate: -90, opacity: 0 }}
          animate={{ y: 0, rotate: 0, opacity: 1 }}
          exit={{ y: -14, rotate: 90, opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {dark ? <MoonIcon className="size-4.5" aria-hidden /> : <SunIcon className="size-4.5" aria-hidden />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
