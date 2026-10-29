"use client";

import { Loader2Icon, SendIcon } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { submitIndicatorReport } from "@/app/panel/indicadores/actions";
import { Field } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const selectClass = "h-11 w-full rounded-lg border border-input bg-card px-3 text-sm";
const INDICATORS = [
  { code: "conectados", label: "Jóvenes conectados" },
  { code: "fortalecidos", label: "Jóvenes fortalecidos" },
  { code: "transformados", label: "Jóvenes transformados" },
];

type ProgramOption = { id: string; name: string; start_date: string | null; year: string };

// Captura de un reporte (FR-011, ajustes 26/28): por programa y AÑO (el de la fecha de inicio del
// programa), sin trimestre. Queda "enviado" y el equipo GOYN lo revisa en su bandeja.
export function IndicatorReportForm({ programs }: { programs: ProgramOption[] }) {
  const [open, setOpen] = useState(false);
  const [programId, setProgramId] = useState(programs[0]?.id ?? "");
  const [state, action, pending] = useActionState(submitIndicatorReport, null);
  const selected = programs.find((p) => p.id === programId) ?? programs[0];

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(`Reporte ${state.year} enviado a revisión del equipo GOYN (${state.count} indicador${state.count === 1 ? "" : "es"}).`);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- cerrar el formulario tras la respuesta del servidor
      setOpen(false);
    } else toast.error(state.error);
  }, [state]);

  if (!programs.length) {
    return <p className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">Agrega un programa para reportar sus resultados.</p>;
  }
  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="h-10 rounded-full px-5 font-bold">
        Reportar resultados del año
      </Button>
    );
  }
  return (
    <form action={action} className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-3">
      <Field label="Programa" required htmlFor="rp-program">
        <select id="rp-program" name="program" required className={selectClass} value={selected?.id} onChange={(e) => setProgramId(e.target.value)}>
          {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>
      <Field label="Año" htmlFor="rp-year" hint="Se toma de la fecha de inicio del programa.">
        <Input id="rp-year" value={selected?.year ?? ""} readOnly className="h-11 bg-muted" />
        <input type="hidden" name="start_date" value={selected?.start_date ?? ""} />
      </Field>
      <Field label="Fuente del dato" required htmlFor="rp-source" hint="Ej.: listas de asistencia, sistema de monitoreo.">
        <Input id="rp-source" name="source" required className="h-11" />
      </Field>
      {INDICATORS.map((i) => (
        <div key={i.code} className="grid gap-3 rounded-xl bg-muted/40 p-3">
          <Field label={i.label} htmlFor={`rp-${i.code}`}>
            <Input id={`rp-${i.code}`} name={i.code} inputMode="numeric" pattern="[0-9]*" className="h-11 bg-card" placeholder="0 es un dato; vacío si no aplica" />
          </Field>
          <Field label="De ellos, mujeres" htmlFor={`rp-${i.code}-mujeres`}>
            <Input id={`rp-${i.code}-mujeres`} name={`${i.code}_mujeres`} inputMode="numeric" pattern="[0-9]*" className="h-11 bg-card" placeholder="Opcional" />
          </Field>
        </div>
      ))}
      <p className="text-xs text-muted-foreground md:col-span-3">
        Reporta la cantidad acumulada del año. Si vuelves a cargar el mismo programa y año, el dato se actualiza y queda registrada la fecha de actualización.
      </p>
      <div className="flex gap-2 md:col-span-3">
        <Button type="submit" disabled={pending} className="h-11 rounded-full px-5 font-bold">
          {pending ? <Loader2Icon className="animate-spin" aria-hidden /> : <SendIcon aria-hidden />} Enviar a revisión
        </Button>
        <Button type="button" variant="ghost" className="h-11 rounded-full" onClick={() => setOpen(false)}>Cancelar</Button>
      </div>
    </form>
  );
}
