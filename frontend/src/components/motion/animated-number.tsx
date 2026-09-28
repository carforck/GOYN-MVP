"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const fmt = new Intl.NumberFormat("es-CO");
const defaultFormat = (n: number) => fmt.format(Math.round(n));

// Contador: sube desde 0 la primera vez que entra en pantalla y, cuando el dato cambia
// (datos en vivo), anima desde el valor anterior y destella para llamar la atención.
export function AnimatedNumber({
  value,
  duration = 1.8,
  className,
  format = defaultFormat,
}: {
  value: number;
  duration?: number;
  className?: string;
  format?: (n: number) => string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const shown = useRef<number | null>(null);
  const formatRef = useRef(format);
  useEffect(() => {
    formatRef.current = format;
  });

  useEffect(() => {
    const node = ref.current;
    if (!node || !inView) return;
    const format = formatRef.current;
    const from = shown.current ?? 0;
    const isUpdate = shown.current !== null && from !== value;
    shown.current = value;
    if (reduce) {
      node.textContent = format(value);
      return;
    }
    if (isUpdate) {
      node.animate(
        [{ color: "var(--color-goyn-magenta)", transform: "scale(1.06)" }, { color: "inherit", transform: "scale(1)" }],
        { duration: 900, easing: "ease-out" },
      );
    }
    const controls = animate(from, value, {
      duration: isUpdate ? 0.9 : duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => (node.textContent = format(v)),
    });
    return () => controls.stop();
  }, [inView, value, duration, reduce]);

  return (
    <span ref={ref} className={cn("inline-block tabular-nums", className)} aria-label={format(value)}>
      {format(0)}
    </span>
  );
}
