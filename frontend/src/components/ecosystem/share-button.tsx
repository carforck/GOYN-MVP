"use client";

import { Share2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ShareButton({ title }: { title: string }) {
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Enlace del perfil copiado");
  };
  return (
    <Button variant="outline" onClick={share} className="h-11 rounded-full bg-card px-5 font-semibold">
      <Share2Icon aria-hidden /> Compartir
    </Button>
  );
}
