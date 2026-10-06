"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { setProgramVisibility } from "@/app/panel/programas/actions";
import { Button } from "@/components/ui/button";

export function VisibilityButton({ id, visible, name }: { id: string; visible: boolean; name: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      aria-label={`${visible ? "Ocultar" : "Mostrar"} ${name} en el perfil público`}
      className="h-8 rounded-full px-2.5 text-muted-foreground hover:text-foreground"
      onClick={() =>
        start(async () => {
          const res = await setProgramVisibility(id, !visible);
          if (!res.ok) return void toast.error(res.error);
          toast.success(res.demo ? "Recorrido de demostración: el cambio no se guardó." : visible ? "Programa oculto en tu perfil público." : "Programa visible en tu perfil público.");
        })
      }
    >
      {visible ? <EyeOffIcon aria-hidden /> : <EyeIcon aria-hidden />} {visible ? "Ocultar" : "Mostrar"}
    </Button>
  );
}
