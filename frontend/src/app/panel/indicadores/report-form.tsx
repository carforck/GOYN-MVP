"use client";

import { SendIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Field } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const selectClass = "h-11 w-full rounded-lg border border-input bg-card px-3 text-sm";

// Captura de un reporte (FR-011). En modo conectado se enviará como reporte 'enviado'
// para revisión GOYN (función review_indicator_report).
export function IndicatorReportForm({ programs }: { programs: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="h-10 rounded-full px-5 font-bold">
        Reportar nuevo periodo
      </Button>
    );
  }
  return (
    <form
      className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault();
        toast.success("Reporte enviado a revisión del equipo GOYN.");
        setOpen(false);
      }}
    >
      <Field label="Programa" required htmlFor="rp-program">
        <select id="rp-program" required className={selectClass}>
          {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>
      <Field label="Periodo" required htmlFor="rp-period">
        <select id="rp-period" required className={selectClass} defaultValue="2026-T3">
          {["2026-T3", "2026-T2", "2026-T1"].map((p) => <option key={p}>{p}</option>)}
        </select>
      </Field>
      <Field label="Fuente del dato" required htmlFor="rp-source" hint="Ej.: listas de asistencia, sistema de monitoreo.">
        <Input id="rp-source" required className="h-11" />
      </Field>
      {["Jóvenes conectados", "Jóvenes fortalecidos", "Jóvenes transformados"].map((l) => (
        <Field key={l} label={l} htmlFor={l}>
          <Input id={l} inputMode="numeric" className="h-11" placeholder="0 es un dato; deja vacío si no aplica" />
        </Field>
      ))}
      <div className="flex gap-2 md:col-span-3">
        <Button type="submit" className="h-11 rounded-full px-5 font-bold"><SendIcon aria-hidden /> Enviar a revisión</Button>
        <Button type="button" variant="ghost" className="h-11 rounded-full" onClick={() => setOpen(false)}>Cancelar</Button>
      </div>
    </form>
  );
}
