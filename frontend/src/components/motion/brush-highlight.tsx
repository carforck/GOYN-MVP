"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Resaltado en "brochazo": la franja magenta se pinta de izquierda a derecha cada vez que el
// texto entra en pantalla (y se borra al salir, para repetirse en la siguiente pasada).
// Con varias líneas, cada línea recibe su propio trazo (box-decoration-break: clone).
export function BrushHighlight({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [painted, setPainted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setPainted(entry.isIntersecting), { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <span ref={ref} data-painted={painted} className={cn("goyn-brush", className)}>
      {children}
    </span>
  );
}
