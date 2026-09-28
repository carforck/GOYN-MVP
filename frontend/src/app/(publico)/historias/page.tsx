import type { Metadata } from "next";
import { ComingSoon } from "@/components/ecosystem/coming-soon";

export const metadata: Metadata = { title: "Historias · Próximamente" };

export default function HistoriasPage() {
  return (
    <ComingSoon
      title="Historias que humanizan los datos"
      phase="Fase 2 · 2027"
      image="/images/fotos/pilar-liderazgo.webp"
      description="Casos de éxito, testimonios y narrativas de impacto con rostro humano, vinculados a las organizaciones y programas del ecosistema (propuesta de la Mesa 5)."
      features={[
        "Historias asociadas a actores, jóvenes y programas.",
        "Fotos y video con consentimiento explícito de quienes aparecen.",
        "Cada tablero de impacto enlazado con las historias que lo explican.",
      ]}
    />
  );
}
