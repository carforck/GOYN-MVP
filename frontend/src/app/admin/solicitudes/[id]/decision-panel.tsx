"use client";

import { CheckIcon, Loader2Icon, MessageSquareIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { decideRequest, type Decision } from "@/app/admin/solicitudes/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function DecisionPanel({ id, fields, disabled }: { id: string; fields: string[]; disabled: boolean }) {
  const router = useRouter();
  const [decision, setDecision] = useState<Decision>("aprobar");
  const [reason, setReason] = useState("");
  const [comments, setComments] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const send = () =>
    startTransition(async () => {
      const clean = Object.fromEntries(Object.entries(comments).filter(([, v]) => v.trim()));
      const res = await decideRequest(id, decision, reason, clean);
      if (!res.ok) return void toast.error(res.error);
      toast.success(decision === "aprobar" ? "Aprobada y publicada. Se notificó a la organización." : decision === "ajustes" ? "Se solicitaron ajustes." : "Solicitud rechazada.");
      router.push("/admin/solicitudes");
    });

  const options: { value: Decision; label: string; icon: typeof CheckIcon; className: string }[] = [
    { value: "aprobar", label: "Aprobar", icon: CheckIcon, className: "data-[on=true]:border-goyn-violeta data-[on=true]:bg-goyn-lila" },
    { value: "ajustes", label: "Pedir ajustes", icon: MessageSquareIcon, className: "data-[on=true]:border-goyn-cian data-[on=true]:bg-goyn-cian/10" },
    { value: "rechazar", label: "Rechazar", icon: XIcon, className: "data-[on=true]:border-destructive data-[on=true]:bg-destructive/5" },
  ];

  return (
    <aside className="h-fit space-y-5 rounded-2xl border bg-card p-5 lg:sticky lg:top-20">
      <h2 className="font-heading text-lg font-bold text-foreground">Decisión</h2>
      {disabled && <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">Esta solicitud ya no está pendiente.</p>}
      <div role="radiogroup" className="grid grid-cols-3 gap-2">
        {options.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={decision === o.value} data-on={decision === o.value} disabled={disabled}
            onClick={() => setDecision(o.value)}
            className={cn("flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-bold text-foreground disabled:opacity-50", o.className)}>
            <o.icon className="size-5" aria-hidden /> {o.label}
          </button>
        ))}
      </div>

      {decision === "ajustes" && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Comentario por campo</p>
          {fields.map((f) => (
            <label key={f} className="block space-y-1 text-xs font-bold text-muted-foreground">
              {f}
              <Textarea rows={2} value={comments[f] ?? ""} onChange={(e) => setComments({ ...comments, [f]: e.target.value })} className="text-sm font-normal text-foreground" />
            </label>
          ))}
        </div>
      )}

      <label className="block space-y-1.5 text-sm font-bold text-foreground">
        {decision === "rechazar" ? "Motivo del rechazo (obligatorio)" : "Nota para la organización (opcional)"}
        <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className="font-normal" />
      </label>

      <Button onClick={send} disabled={pending || disabled} className={cn("h-11 w-full rounded-full font-bold", decision === "rechazar" && "bg-destructive hover:bg-destructive/90")}>
        {pending && <Loader2Icon className="animate-spin" aria-hidden />}
        {decision === "aprobar" ? "Aprobar y publicar" : decision === "ajustes" ? "Enviar solicitud de ajustes" : "Rechazar solicitud"}
      </Button>
      <p className="text-xs text-muted-foreground">Cada decisión queda en el registro de auditoría con fecha, responsable y motivo.</p>
    </aside>
  );
}
