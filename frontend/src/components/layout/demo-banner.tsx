import { FlaskConicalIcon } from "lucide-react";
import { showsSyntheticData } from "@/lib/config";

// Aviso permanente mientras la plataforma use el conjunto sintético (arquitectura de datos §9).
export function DemoBanner() {
  if (!showsSyntheticData) return null;
  return (
    <div className="bg-goyn-naranja text-goyn-navy">
      <p className="goyn-container flex items-center justify-center gap-2 py-1.5 text-center text-xs font-semibold">
        <FlaskConicalIcon className="size-3.5 shrink-0" aria-hidden />
        Versión de demostración: las organizaciones y cifras que ves son sintéticas.
      </p>
    </div>
  );
}
