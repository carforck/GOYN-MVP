import type { Metadata } from "next";
import { ComingSoon } from "@/components/ecosystem/coming-soon";

export const metadata: Metadata = { title: "Conexiones · Próximamente" };

export default function ConexionesPage() {
  return (
    <ComingSoon
      title="Red de conexiones del ecosistema"
      phase="Fase 2 · 2027"
      image="/images/fotos/sesion-colaborativo-2026.webp"
      description="Quién trabaja con quién y con qué intensidad. Hoy las relaciones socio, aliado y colaborador ya se registran y se muestran en cada hoja de vida; la visualización en red llega en Potenciar."
      features={[
        "Grafo de relaciones: el grosor de la línea indica la intensidad; el punteado, alianzas potenciales (propuesta de la Mesa 10).",
        "Sugerencias de aliados según rol, área de impacto, territorio y población.",
        "Evidencia y fecha en cada conexión para no mezclar lo existente con lo aspiracional.",
      ]}
    />
  );
}
