"use client";

import { Loader2Icon, SendIcon } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { submitIndicatorReport } from "@/app/panel/indicadores/actions";
import { Field } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const selectClass = "h-11 w-full rounded-lg border border-input bg-card px-3 text-sm";
const PERIODS = ["2026-T3", "2026-T2", "2026-T1", "2025-T4"];
const INDICATORS = [
  { code: "conectados", label: "Jóvenes conectados" },
  { code: "fortalecidos", label: "Jóvenes fortalecidos" },
  { code: "transformados", label: "Jóvenes transformados" },
];

// Captura de un reporte (FR-011): queda "enviado" y el equipo GOYN lo revisa en su bandeja.
export function IndicatorReportForm({ programs }: { programs: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(submitIndicatorReport, null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(`Reporte enviado a revisión del equipo GOYN (${state.count} indicador${state.count === 1 ? "" : "es"}).`);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- cerrar el formulario tras la respuesta del servidor
      setOpen(false);
    } else toast.error(state.error);
  }, [state]);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="h-10 rounded-full px-5 font-bold">
        Reportar nuevo periodo
      </Button>
    );
  }
  return (
    <form action={action} className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-3">
      <Field label="Programa" required htmlFor="rp-program">
        <select id="rp-program" name="program" required className={selectClass}>
          {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>
      <Field label="Periodo" required htmlFor="rp-period">
        <select id="rp-period" name="period" required className={selectClass} defaultValue={PERIODS[0]}>
          {PERIODS.map((p) => <option key={p}>{p}</option>)}
        </select>
      </Field>
      <Field label="Fuente del dato" required htmlFor="rp-source" hint="Ej.: listas de asistencia, sistema de monitoreo.">
        <Input id="rp-source" name="source" required className="h-11" />
      </Field>
      {INDICATORS.map((i) => (
        <Field key={i.code} label={i.label} htmlFor={`rp-${i.code}`}>
          <Input id={`rp-${i.code}`} name={i.code} inputMode="numeric" pattern="[0-9]*" className="h-11" placeholder="0 es un dato; vacío si no aplica" />
        </Field>
      ))}
      <div className="flex gap-2 md:col-span-3">
        <Button type="submit" disabled={pending} className="h-11 rounded-full px-5 font-bold">
          {pending ? <Loader2Icon className="animate-spin" aria-hidden /> : <SendIcon aria-hidden />} Enviar a revisión
        </Button>
        <Button type="button" variant="ghost" className="h-11 rounded-full" onClick={() => setOpen(false)}>Cancelar</Button>
      </div>
    </form>
  );
}
