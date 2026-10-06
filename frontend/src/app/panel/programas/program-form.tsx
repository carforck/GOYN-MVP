"use client";

import { ArrowLeftIcon, SendIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { submitProgram, type ProgramPayload } from "@/app/panel/programas/actions";
import { ChoiceGroup, Field } from "@/components/forms/fields";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { catalogs } from "@/lib/catalogs";
import { cn } from "@/lib/utils";

// Formulario corto de un solo programa (nuevo o edición). Evita rehacer todo el registro.
export function ProgramForm({ programId, initial }: { programId: string | null; initial: ProgramPayload }) {
  const router = useRouter();
  const [p, setP] = useState<ProgramPayload>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof ProgramPayload>(key: K, value: ProgramPayload[K]) => setP((x) => ({ ...x, [key]: value }));
  const one = (v: string[]) => v[v.length - 1] ?? "";

  const send = () =>
    start(async () => {
      setError(null);
      const res = await submitProgram(programId, p);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success(res.demo ? "Recorrido de demostración: el programa no se guardó." : "Enviado. El equipo GOYN lo revisará antes de publicarlo.");
      router.push("/panel/programas");
    });

  return (
    <div className="space-y-8 rounded-3xl border bg-card p-5 sm:p-8">
      <Field label="Nombre del programa" required htmlFor="pname">
        <Input id="pname" value={p.name} onChange={(e) => set("name", e.target.value)} className="h-11" />
      </Field>
      <Field label="¿Qué hace el programa y con quién?" required htmlFor="pdesc" hint="Cuéntalo como se lo contarías a otra organización: a quién atiende, qué ofrece y qué resultado busca.">
        <Textarea id="pdesc" value={p.description} onChange={(e) => set("description", e.target.value)} rows={4} />
      </Field>
      <div className="grid gap-8 lg:grid-cols-2">
        <ChoiceGroup label="Modalidad" required multiple={false} options={catalogs.modalities} value={p.modality_code ? [p.modality_code] : []} onChange={(v) => set("modality_code", one(v))} />
        <ChoiceGroup label="Área principal" required multiple={false} columns options={catalogs.impactAreas} value={p.primary_area_code ? [p.primary_area_code] : []} onChange={(v) => set("primary_area_code", one(v))} />
      </div>
      <ChoiceGroup label="¿Aporta también a otras áreas?" hint="Opcional." columns options={catalogs.impactAreas.filter((a) => a.code !== p.primary_area_code)} value={p.area_codes} onChange={(v) => set("area_codes", v)} />
      <ChoiceGroup label="Población que atiende" required columns options={catalogs.populations} value={p.population_codes} onChange={(v) => set("population_codes", v)} />
      <ChoiceGroup label="¿En qué territorios se ejecuta?" required columns options={catalogs.territories} value={p.territory_codes} onChange={(v) => set("territory_codes", v)} />
      <div className="grid gap-6 sm:grid-cols-3">
        <Field label="Inicio" required htmlFor="pstart">
          <Input id="pstart" type="date" value={p.start_date} onChange={(e) => set("start_date", e.target.value)} className="h-11" />
        </Field>
        <Field label="Cierre" htmlFor="pend" hint="Vacío si no tiene fecha de cierre.">
          <Input id="pend" type="date" value={p.end_date} onChange={(e) => set("end_date", e.target.value)} className="h-11" />
        </Field>
        <Field label="Meta de jóvenes este año" htmlFor="pgoal">
          <Input id="pgoal" inputMode="numeric" value={p.annual_goal} onChange={(e) => set("annual_goal", e.target.value.replace(/\D/g, ""))} className="h-11" />
        </Field>
      </div>
      <Field label="Enlace del programa" htmlFor="plink" hint="Opcional: página, convocatoria o red social.">
        <Input id="plink" type="url" value={p.link} onChange={(e) => set("link", e.target.value)} className="h-11" placeholder="https://" />
      </Field>

      {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm font-semibold text-destructive">{error}</p>}

      <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-between">
        <Link href="/panel/programas" className={cn(buttonVariants({ variant: "ghost" }), "h-11 rounded-full")}>
          <ArrowLeftIcon aria-hidden /> Volver a programas
        </Link>
        <Button type="button" onClick={send} disabled={pending} className="h-11 rounded-full bg-goyn-magenta-a11y px-6 font-bold hover:bg-goyn-magenta-a11y/90">
          <SendIcon aria-hidden /> {pending ? "Enviando…" : programId ? "Enviar cambios a revisión" : "Enviar programa a revisión"}
        </Button>
      </div>
    </div>
  );
}
