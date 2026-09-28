import type { Metadata } from "next";
import { ComingSoon } from "@/components/ecosystem/coming-soon";

export const metadata: Metadata = { title: "Oportunidades para jóvenes · Próximamente" };

export default function OportunidadesPage() {
  return (
    <ComingSoon
      title="Oportunidades para jóvenes"
      phase="MVP opcional"
      image="/images/fotos/enfoque-1.webp"
      description="Una vitrina de ofertas de formación, empleo, emprendimiento y participación publicadas por las organizaciones del Colaborativo, organizada por lo que cada joven quiere hacer."
      features={[
        "Navegación por intención: ¿quieres estudiar, trabajar, emprender o participar?",
        "Filtros por localidad, área de interés, modalidad y requisitos.",
        "Cada oportunidad con vigencia, responsable, cupos y enlace de contacto.",
        "Redirección a la organización que la ofrece: no es una bolsa de empleo transaccional.",
      ]}
    />
  );
}
