"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";

// Aparición suave al entrar en pantalla. `delay` permite escalonar tarjetas de una grilla.
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  as = "div",
  ...rest
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "li" | "section";
} & Omit<HTMLMotionProps<"div">, "children">) {
  const reduce = useReducedMotion();
  const Component = motion[as] as typeof motion.div;
  return (
    <Component
      className={className}
      // El estado inicial es el mismo en servidor y cliente (evita el desajuste de hidratación);
      // con "reducir movimiento" el cambio es instantáneo.
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={reduce ? { duration: 0 } : { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      {...rest}
    >
      {children}
    </Component>
  );
}
