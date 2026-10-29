"use client";

import { StarIcon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { setProgramFeatured } from "@/app/panel/programas/actions";
import { Button } from "@/components/ui/button";
import { MAX_FEATURED_PROGRAMS } from "@/lib/types";
import { cn } from "@/lib/utils";

// Estrella "Visible en mi perfil" (máx. 3). `featured` = elegido por la organización;
// `byDefault` = se muestra porque aún no hay elección (los 3 con más jóvenes conectados).
export function FeaturedButton({
  id,
  name,
  featured,
  byDefault,
  chosenCount,
  visible,
}: {
  id: string;
  name: string;
  featured: boolean;
  byDefault: boolean;
  chosenCount: number;
  visible: boolean;
}) {
  const [pending, start] = useTransition();
  const on = featured || byDefault;
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      aria-pressed={featured}
      aria-label={featured ? `Quitar ${name} de los destacados de tu perfil` : `Destacar ${name} en tu perfil`}
      title={byDefault ? "Se muestra por defecto. Márcalo para elegirlo tú." : featured ? "Visible en tu perfil" : "Destacar en tu perfil"}
      className={cn("h-8 rounded-full px-2.5", on ? "font-semibold text-goyn-violeta hover:text-goyn-violeta" : "text-muted-foreground hover:text-foreground")}
      onClick={() => {
        if (!featured && !visible) return void toast.warning("Primero muestra el programa en tu perfil para poder destacarlo.");
        if (!featured && chosenCount >= MAX_FEATURED_PROGRAMS) {
          return void toast.warning(`Ya tienes ${MAX_FEATURED_PROGRAMS} programas destacados`, {
            description: "Quita la estrella de uno para elegir otro. Los demás programas siguen sumando en las cifras del ecosistema.",
          });
        }
        start(async () => {
          const res = await setProgramFeatured(id, !featured);
          if (!res.ok) return void toast.error(res.error);
          toast.success(
            res.demo
              ? "Recorrido de demostración: el cambio no se guardó."
              : featured
                ? "El programa ya no se destaca en tu perfil. Sus resultados siguen sumando en las cifras del ecosistema."
                : "Programa destacado en tu perfil.",
          );
        });
      }}
    >
      <StarIcon aria-hidden className={cn(on && "text-goyn-naranja", featured && "fill-goyn-naranja")} /> {featured ? "Destacado" : byDefault ? "Por defecto" : "Destacar"}
    </Button>
  );
}
