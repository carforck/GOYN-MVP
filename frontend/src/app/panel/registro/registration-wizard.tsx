"use client";

import { ArrowLeftIcon, ArrowRightIcon, CheckCircle2Icon, CloudIcon, Loader2Icon, MessageSquareWarningIcon, PlusIcon, SendIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { saveDraft, submitRegistration } from "@/app/panel/registro/actions";
import { ChoiceGroup, Field, Scale } from "@/components/forms/fields";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { catalogs, label } from "@/lib/catalogs";
import {
  emptyPayload,
  emptyProgram,
  registrationSteps,
  validateStep,
  type ProgramDraft,
  type RegistrationPayload,
} from "@/lib/registration";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "goyn-registro-borrador";
const MAX_PROGRAMS = 3; // Instrumento: máximo 3 proyectos (el modelo de datos no limita)

type Draft = { id: string | null; payload: RegistrationPayload; step: number; status?: string; comments?: Record<string, string> };

export function RegistrationWizard({
  initial,
  organizations,
  demo,
}: {
  initial: Draft | null;
  organizations: { id: string; name: string }[];
  demo: boolean;
}) {
  const [draft, setDraft] = useState<Draft>(initial ?? { id: null, payload: emptyPayload(), step: 0 });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [submitted, setSubmitted] = useState(initial?.status === "enviada");
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydrated = useRef(false);

  const p = draft.payload;
  const step = registrationSteps[draft.step];

  // Modo demo: retomar el borrador guardado en este navegador.
  useEffect(() => {
    if (!demo || hydrated.current) return;
    hydrated.current = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // Sincronización única con un almacenamiento externo (localStorage) al montar.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setDraft(JSON.parse(raw));
    } catch {
      /* sin almacenamiento disponible */
    }
  }, [demo]);

  // Guardado automático con espera de 1,2 s tras el último cambio.
  const persist = (next: Draft) => {
    if (timer.current) clearTimeout(timer.current);
    setSaveState("saving");
    timer.current = setTimeout(async () => {
      if (demo) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* ignorar */
        }
        setSaveState("saved");
        return;
      }
      const res = await saveDraft(next.id, next.payload, next.step + 1);
      if (res.ok) {
        setSaveState("saved");
        if (res.id && res.id !== next.id) setDraft((d) => ({ ...d, id: res.id }));
      } else setSaveState("error");
    }, 1200);
  };

  const update = (mutate: (payload: RegistrationPayload) => void) => {
    setDraft((d) => {
      const payload = structuredClone(d.payload);
      mutate(payload);
      const next = { ...d, payload };
      persist(next);
      return next;
    });
  };

  const goTo = (index: number) => {
    setDraft((d) => {
      const next = { ...d, step: index };
      persist(next);
      return next;
    });
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const next = () => {
    const e = validateStep(step.id, p);
    setErrors(e);
    if (Object.keys(e).length) {
      toast.error("Revisa los campos marcados antes de continuar.");
      return;
    }
    goTo(Math.min(draft.step + 1, registrationSteps.length - 1));
  };

  const submit = () => {
    const all = registrationSteps.reduce<Record<string, string>>((acc, s) => ({ ...acc, ...validateStep(s.id, p) }), {});
    if (Object.keys(all).length) {
      setErrors(all);
      const firstBad = registrationSteps.findIndex((s) => Object.keys(validateStep(s.id, p)).length > 0);
      toast.error(`Falta completar: ${registrationSteps[firstBad].title}.`);
      if (firstBad !== draft.step) goTo(firstBad);
      return;
    }
    startTransition(async () => {
      const res = await submitRegistration(draft.id, p);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      if (demo) localStorage.removeItem(STORAGE_KEY);
      setSubmitted(true);
      toast.success("¡Solicitud enviada! El equipo GOYN la revisará.");
    });
  };

  const comments = draft.comments ?? {};
  const progress = ((draft.step + 1) / registrationSteps.length) * 100;

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border bg-white p-8 text-center sm:p-12">
        <CheckCircle2Icon className="mx-auto size-14 text-goyn-violeta" aria-hidden />
        <h1 className="mt-4 text-2xl font-extrabold text-goyn-navy">Tu solicitud está pendiente de validación</h1>
        <p className="mt-2 text-muted-foreground">
          El equipo GOYN revisará la información. Te avisaremos por correo si necesitamos ajustes o cuando tu organización quede publicada en el mapa y el directorio.
        </p>
        <Link href="/panel" className={cn(buttonVariants(), "mt-6 h-11 rounded-full px-6 font-bold")}>Ir a mi panel</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* Índice de pasos */}
      <nav aria-label="Pasos del registro" className="lg:sticky lg:top-6 lg:self-start">
        <div className="mb-3 flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>Paso {draft.step + 1} de {registrationSteps.length}</span>
          <SaveIndicator state={saveState} />
        </div>
        <Progress value={progress} className="mb-4" />
        <ol className="hidden space-y-1 lg:block">
          {registrationSteps.map((s, i) => {
            const done = i < draft.step && Object.keys(validateStep(s.id, p)).length === 0;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-current={i === draft.step ? "step" : undefined}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors",
                    i === draft.step ? "bg-goyn-violeta text-white" : "text-goyn-navy hover:bg-white",
                  )}
                >
                  <span className={cn("grid size-6 shrink-0 place-items-center rounded-full text-xs", i === draft.step ? "bg-white text-goyn-violeta" : done ? "bg-goyn-violeta text-white" : "bg-white text-muted-foreground")}>
                    {done ? <CheckCircle2Icon className="size-4" /> : i + 1}
                  </span>
                  {s.title}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <section className="min-w-0 rounded-3xl border bg-white p-5 sm:p-8" aria-labelledby="paso-titulo">
        <p className="text-xs font-bold tracking-wider text-goyn-violeta uppercase">{step.modules}</p>
        <h1 id="paso-titulo" className="mt-1 text-2xl font-extrabold text-goyn-navy sm:text-3xl">{step.title}</h1>
        <p className="mt-1 text-muted-foreground">{step.summary}</p>

        {Object.keys(comments).length > 0 && (
          <div className="mt-5 flex gap-3 rounded-2xl border border-goyn-naranja bg-goyn-naranja/10 p-4 text-sm">
            <MessageSquareWarningIcon className="size-5 shrink-0 text-goyn-naranja" aria-hidden />
            <div>
              <p className="font-bold text-goyn-navy">El equipo GOYN solicitó ajustes</p>
              <ul className="mt-1 list-disc pl-4 text-goyn-navy/80">
                {Object.entries(comments).map(([k, v]) => <li key={k}><strong>{k}:</strong> {v}</li>)}
              </ul>
            </div>
          </div>
        )}

        <div className="mt-8 space-y-7">
          {step.id === "identificacion" && (
            <>
              <Field label="Nombre de la organización" required error={errors.name} htmlFor="name">
                <Input id="name" value={p.identificacion.name} onChange={(e) => update((x) => void (x.identificacion.name = e.target.value))} className="h-11" />
              </Field>
              <Field label="Descripción de la organización" required error={errors.description} htmlFor="description"
                hint="¿Quiénes son y qué hacen? Será tu perfil para que otras organizaciones te conozcan. Máximo 200 palabras.">
                <Textarea id="description" rows={5} value={p.identificacion.description} onChange={(e) => update((x) => void (x.identificacion.description = e.target.value))} />
                <p className="text-right text-xs text-muted-foreground">{p.identificacion.description.trim() ? p.identificacion.description.trim().split(/\s+/).length : 0}/200 palabras</p>
              </Field>
              <ChoiceGroup
                label="¿Cuenta con personería jurídica (NIT)?"
                required
                multiple={false}
                error={errors.has_nit}
                options={[{ code: "si", label: "Sí" }, { code: "no", label: "No, somos un colectivo o grupo sin NIT" }]}
                value={p.identificacion.has_nit === null ? [] : [p.identificacion.has_nit ? "si" : "no"]}
                onChange={([v]) => update((x) => void (x.identificacion.has_nit = v === "si"))}
              />
              {p.identificacion.has_nit && (
                <Field label="NIT de la organización" required error={errors.nit} htmlFor="nit">
                  <Input id="nit" inputMode="numeric" value={p.identificacion.nit} onChange={(e) => update((x) => void (x.identificacion.nit = e.target.value))} className="h-11 max-w-xs" />
                </Field>
              )}
              {p.identificacion.has_nit === false && (
                <p className="rounded-xl bg-goyn-lila p-3 text-sm text-goyn-navy">Te asignaremos un código interno GOYN para identificar a tu organización.</p>
              )}
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Contacto estratégico (nombre)" required error={errors.contact_name} htmlFor="cname" hint="Primer contacto con los demás actores del ecosistema.">
                  <Input id="cname" value={p.contacto.name} onChange={(e) => update((x) => void (x.contacto.name = e.target.value))} className="h-11" />
                </Field>
                <Field label="Cargo del contacto" required error={errors.contact_position} htmlFor="cpos">
                  <Input id="cpos" value={p.contacto.position} onChange={(e) => update((x) => void (x.contacto.position = e.target.value))} className="h-11" />
                </Field>
                <Field label="Celular del contacto" required error={errors.contact_phone} htmlFor="cphone" hint="No será visible para otras organizaciones: solo para GOYN.">
                  <Input id="cphone" type="tel" inputMode="numeric" value={p.contacto.phone} onChange={(e) => update((x) => void (x.contacto.phone = e.target.value.replace(/[^0-9+ ]/g, "")))} className="h-11" />
                </Field>
                <Field label="Correo de contacto público" required error={errors.contact_email_public} htmlFor="cemail" hint="Donde los demás actores pueden escribirte. Se muestra en tu perfil.">
                  <Input id="cemail" type="email" value={p.identificacion.contact_email_public} onChange={(e) => update((x) => void (x.identificacion.contact_email_public = e.target.value))} className="h-11" />
                </Field>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Sitio web" htmlFor="web">
                  <Input id="web" type="url" placeholder="https://" value={p.identificacion.website} onChange={(e) => update((x) => void (x.identificacion.website = e.target.value))} className="h-11" />
                </Field>
                <Field label="Instagram" htmlFor="ig">
                  <Input id="ig" placeholder="@tuorganizacion" value={p.identificacion.social.instagram ?? ""} onChange={(e) => update((x) => void (x.identificacion.social.instagram = e.target.value))} className="h-11" />
                </Field>
              </div>
            </>
          )}

          {step.id === "caracterizacion" && (
            <>
              <ChoiceGroup label="Tipo de organización" hint="Selecciona el tipo que más se ajusta." required multiple={false} columns describe
                error={errors.org_type_code} options={catalogs.orgTypes}
                value={p.caracterizacion.org_type_code ? [p.caracterizacion.org_type_code] : []}
                onChange={([v]) => update((x) => void (x.caracterizacion.org_type_code = v))} />
              <ChoiceGroup label="¿Cuál es el rol principal que cumple tu organización en el ecosistema?" required multiple={false} columns describe
                error={errors.primary_role_code} options={catalogs.roles}
                value={p.caracterizacion.primary_role_code ? [p.caracterizacion.primary_role_code] : []}
                onChange={([v]) => update((x) => {
                  x.caracterizacion.primary_role_code = v;
                  x.caracterizacion.role_codes = [...new Set([v, ...x.caracterizacion.role_codes.filter((r) => r !== v)])];
                })} />
              <ChoiceGroup label="¿Qué otros roles cumple?" hint="Opcional. Puedes seleccionar varios."
                options={catalogs.roles.filter((r) => r.code !== p.caracterizacion.primary_role_code)}
                value={p.caracterizacion.role_codes.filter((r) => r !== p.caracterizacion.primary_role_code)}
                onChange={(v) => update((x) => void (x.caracterizacion.role_codes = [x.caracterizacion.primary_role_code, ...v].filter(Boolean)))} />
              <ChoiceGroup label="Tipo de alcance territorial" multiple={false} describe options={catalogs.scopes}
                value={p.caracterizacion.scope_code ? [p.caracterizacion.scope_code] : []}
                onChange={([v]) => update((x) => void (x.caracterizacion.scope_code = v))} />
            </>
          )}

          {step.id === "territorio" && (
            <>
              <ChoiceGroup label="¿En qué zonas de Barranquilla A.M. tiene impacto o incidencia tu organización?" required columns
                error={errors.territory_codes} options={catalogs.territories} value={p.territorio.territory_codes}
                onChange={(v) => update((x) => void (x.territorio.territory_codes = v))} />
              <ChoiceGroup label="¿En qué zona está tu sede principal?" hint="Ubicaremos tu organización en el mapa en el centro de esa zona (ubicación aproximada)." required multiple={false} columns
                error={errors.location_territory_code} options={catalogs.territories.filter((t) => t.lat != null)}
                value={p.territorio.location_territory_code ? [p.territorio.location_territory_code] : []}
                onChange={([v]) => update((x) => {
                  x.territorio.location_territory_code = v;
                  x.territorio.municipality = catalogs.territories.find((t) => t.code === v)?.municipality ?? "";
                })} />
              <Field label="Dirección de la sede" hint="Opcional. Solo la ve el equipo GOYN." htmlFor="addr">
                <Input id="addr" value={p.contacto.address} onChange={(e) => update((x) => void (x.contacto.address = e.target.value))} className="h-11" />
              </Field>
            </>
          )}

          {step.id === "enfoque" && (
            <>
              <ChoiceGroup label="¿Qué áreas de impacto aborda tu organización al relacionarse con jóvenes?" required columns describe
                error={errors.area_codes} options={catalogs.impactAreas} value={p.enfoque.area_codes}
                onChange={(v) => update((x) => {
                  x.enfoque.area_codes = v;
                  x.enfoque.problem_codes = x.enfoque.problem_codes.filter((c) => v.includes(catalogs.problems.find((pr) => pr.code === c)?.area ?? ""));
                })} />
              {p.enfoque.area_codes.map((area) => (
                <div key={area} className="rounded-2xl border bg-muted/50 p-4 sm:p-5">
                  <ChoiceGroup label={`¿Qué problemáticas atiendes en ${label("impactAreas", area)}?`} columns
                    options={catalogs.problems.filter((pr) => pr.area === area)}
                    value={p.enfoque.problem_codes}
                    onChange={(v) => update((x) => void (x.enfoque.problem_codes = v))} />
                  <Field label="Otras (¿cuál?)" htmlFor={`otra-${area}`}>
                    <Input id={`otra-${area}`} value={p.enfoque.problem_other[area] ?? ""} onChange={(e) => update((x) => void (x.enfoque.problem_other[area] = e.target.value))} className="h-10 bg-white" />
                  </Field>
                </div>
              ))}
            </>
          )}

          {step.id === "relaciones" && (
            <RelationsStep payload={p} organizations={organizations} update={update} />
          )}

          {step.id === "programas" && (
            <>
              <p className="rounded-xl bg-goyn-lila p-3 text-sm text-goyn-navy">
                Registra hasta {MAX_PROGRAMS} proyectos activos que tu organización ejecute directamente con jóvenes en 2026. Los resultados alimentan los indicadores de impacto colectivo.
              </p>
              {p.programas.map((prog, i) => (
                <ProgramCard key={i} index={i} program={prog} errors={errors}
                  onChange={(mut) => update((x) => mut(x.programas[i]))}
                  onRemove={p.programas.length > 1 ? () => update((x) => void x.programas.splice(i, 1)) : undefined} />
              ))}
              {p.programas.length < MAX_PROGRAMS && (
                <Button type="button" variant="outline" className="h-11 rounded-full" onClick={() => update((x) => void x.programas.push(emptyProgram()))}>
                  <PlusIcon aria-hidden /> Agregar otro proyecto
                </Button>
              )}
              <ChoiceGroup label="¿Cómo gestionan y respaldan la información de los resultados reportados?" multiple={false} describe columns
                options={catalogs.dataManagementLevels} value={p.gestion_datos ? [p.gestion_datos] : []}
                onChange={([v]) => update((x) => void (x.gestion_datos = v))} />
            </>
          )}

          {step.id === "fortalecimiento" && (
            <>
              <ChoiceGroup label="¿Hace cuánto está tu organización involucrada en el Colaborativo GOYN Barranquilla?" required multiple={false}
                error={errors.tenure_code} options={catalogs.collaborativeTenure}
                value={p.fortalecimiento.tenure_code ? [p.fortalecimiento.tenure_code] : []}
                onChange={([v]) => update((x) => void (x.fortalecimiento.tenure_code = v))} />
              <ChoiceGroup label="¿En qué espacios gestionados por GOYN has participado?" columns options={catalogs.goynSpaces}
                value={p.fortalecimiento.goyn_space_codes} onChange={(v) => update((x) => void (x.fortalecimiento.goyn_space_codes = v))} />
              {([
                ["alliances", "¿En qué medida tus alianzas actuales se han fortalecido o generado gracias a GOYN?"],
                ["design_capacity", "¿Cuánto se ha fortalecido tu capacidad para diseñar soluciones para la juventud?"],
                ["visibility", "¿Cuánto ha fortalecido GOYN la visibilidad de tu trabajo?"],
                ["youth_involvement", "¿En qué medida involucras a jóvenes activamente en diagnóstico, diseño, implementación, evaluación y decisiones?"],
                ["shared_vision", "¿En qué medida tu organización incorpora la VISIÓN COMPARTIDA del Colaborativo en su estrategia?"],
              ] as const).map(([key, text]) => (
                <Scale key={key} label={text} value={p.fortalecimiento[key]} onChange={(n) => update((x) => void (x.fortalecimiento[key] = n))} />
              ))}
              <p className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
                Módulo 7 · Cambio de narrativas: las tres preguntas están por definir por parte de GOYN Barranquilla.
              </p>
            </>
          )}

          {step.id === "acciones" && (
            <>
              <Field label="Monto estimado de inversión social en iniciativas para la juventud este año (COP)" htmlFor="inv" hint="Solo números. Este dato no es público.">
                <Input id="inv" inputMode="numeric" value={p.acciones.social_investment_cop} onChange={(e) => update((x) => void (x.acciones.social_investment_cop = e.target.value.replace(/\D/g, "")))} className="h-11 max-w-xs" />
              </Field>
              <ChoiceGroup label="¿Tu organización ha impulsado recientemente alguna propuesta o ajuste de política para la población joven?" multiple={false}
                options={[{ code: "si", label: "Sí" }, { code: "no", label: "No" }, { code: "no_sabe", label: "No sabe" }]}
                value={p.acciones.policy_flag ? [p.acciones.policy_flag] : []}
                onChange={([v]) => update((x) => void (x.acciones.policy_flag = v as "si" | "no" | "no_sabe"))} />
              {p.acciones.policy_flag === "si" && (
                <Field label="Cuéntanos sobre esa propuesta, recomendación o ajuste" htmlFor="pol">
                  <Textarea id="pol" rows={4} value={p.acciones.policy_contribution} onChange={(e) => update((x) => void (x.acciones.policy_contribution = e.target.value))} />
                </Field>
              )}
            </>
          )}

          {step.id === "consentimiento" && <ReviewStep payload={p} errors={errors} update={update} goTo={goTo} />}
        </div>

        <div className="mt-10 flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="ghost" disabled={draft.step === 0} onClick={() => goTo(draft.step - 1)} className="h-11 rounded-full">
            <ArrowLeftIcon aria-hidden /> Anterior
          </Button>
          {draft.step < registrationSteps.length - 1 ? (
            <Button type="button" onClick={next} className="h-11 rounded-full px-6 font-bold">
              Guardar y continuar <ArrowRightIcon aria-hidden />
            </Button>
          ) : (
            <Button type="button" onClick={submit} disabled={pending} className="h-11 rounded-full bg-goyn-magenta px-6 font-bold hover:bg-goyn-magenta/90">
              {pending ? <Loader2Icon className="animate-spin" aria-hidden /> : <SendIcon aria-hidden />} Enviar a validación
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}

function SaveIndicator({ state }: { state: "idle" | "saving" | "saved" | "error" }) {
  if (state === "idle") return null;
  return (
    <span className={cn("inline-flex items-center gap-1", state === "error" && "text-destructive")} role="status">
      {state === "saving" ? <Loader2Icon className="size-3 animate-spin" aria-hidden /> : <CloudIcon className="size-3" aria-hidden />}
      {state === "saving" ? "Guardando…" : state === "saved" ? "Guardado" : "Sin conexión, reintentaremos"}
    </span>
  );
}

function RelationsStep({
  payload,
  organizations,
  update,
}: {
  payload: RegistrationPayload;
  organizations: { id: string; name: string }[];
  update: (m: (p: RegistrationPayload) => void) => void;
}) {
  const [query, setQuery] = useState<Record<string, string>>({});
  return (
    <div className="space-y-6">
      {catalogs.relationTypes.map((type) => {
        const selected = payload.relaciones.filter((r) => r.relation_type_code === type.code);
        const q = (query[type.code] ?? "").toLowerCase();
        const matches = q.length >= 2 ? organizations.filter((o) => o.name.toLowerCase().includes(q) && !selected.some((s) => s.target_org_id === o.id)).slice(0, 6) : [];
        return (
          <div key={type.code} className="rounded-2xl border p-4 sm:p-5">
            <p className="font-heading text-lg font-bold text-goyn-navy">{type.label}</p>
            <p className="text-sm text-muted-foreground">{type.description} ¿Con qué actores tienes una relación tipo {type.label.toUpperCase()}?</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {selected.map((r) => (
                <li key={r.target_org_id || r.target_name_free} className="inline-flex items-center gap-1.5 rounded-full bg-goyn-lila py-1 pr-1 pl-3 text-sm font-semibold text-goyn-navy">
                  {r.target_org_id ? organizations.find((o) => o.id === r.target_org_id)?.name : `${r.target_name_free} (no registrada)`}
                  <button type="button" aria-label="Quitar" className="rounded-full p-1 hover:bg-white"
                    onClick={() =>
                      update((x) => {
                        const idx = x.relaciones.findIndex(
                          (z) => z.relation_type_code === type.code && z.target_org_id === r.target_org_id && z.target_name_free === r.target_name_free,
                        );
                        if (idx >= 0) x.relaciones.splice(idx, 1);
                      })
                    }>
                    <Trash2Icon className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="relative mt-3">
              <Input placeholder="Busca una organización del Colaborativo…" value={query[type.code] ?? ""} onChange={(e) => setQuery({ ...query, [type.code]: e.target.value })} className="h-10" aria-label={`Buscar ${type.label}`} />
              {(matches.length > 0 || q.length >= 3) && (
                <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border bg-white shadow-lg">
                  {matches.map((o) => (
                    <li key={o.id}>
                      <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => { update((x) => void x.relaciones.push({ relation_type_code: type.code, target_org_id: o.id, target_name_free: "" })); setQuery({ ...query, [type.code]: "" }); }}>
                        {o.name}
                      </button>
                    </li>
                  ))}
                  <li>
                    <button type="button" className="w-full border-t px-3 py-2 text-left text-sm font-semibold text-goyn-violeta hover:bg-muted"
                      onClick={() => { update((x) => void x.relaciones.push({ relation_type_code: type.code, target_org_id: "", target_name_free: query[type.code] })); setQuery({ ...query, [type.code]: "" }); }}>
                      + Agregar “{query[type.code]}” (aún no está registrada)
                    </button>
                  </li>
                </ul>
              )}
            </div>
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground">Si no trabajas con ningún actor en alguna modalidad, deja ese bloque vacío.</p>
    </div>
  );
}

function ProgramCard({
  index,
  program,
  errors,
  onChange,
  onRemove,
}: {
  index: number;
  program: ProgramDraft;
  errors: Record<string, string>;
  onChange: (mut: (p: ProgramDraft) => void) => void;
  onRemove?: () => void;
}) {
  const k = `programas.${index}`;
  const numeric = (v: string) => v.replace(/\D/g, "");
  const isIngresos = program.primary_area_code === "ingresos";
  return (
    <div className="space-y-5 rounded-2xl border bg-muted/40 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <p className="font-heading text-lg font-bold text-goyn-navy">Proyecto {index + 1}</p>
        {onRemove && (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="text-destructive">
            <Trash2Icon aria-hidden /> Quitar
          </Button>
        )}
      </div>
      <Field label="Nombre del proyecto" required error={errors[`${k}.name`]} htmlFor={`${k}-name`}>
        <Input id={`${k}-name`} value={program.name} onChange={(e) => onChange((p) => void (p.name = e.target.value))} className="h-11 bg-white" />
      </Field>
      <Field label="Descripción del proyecto" required error={errors[`${k}.description`]} htmlFor={`${k}-desc`}>
        <Textarea id={`${k}-desc`} rows={3} value={program.description} onChange={(e) => onChange((p) => void (p.description = e.target.value))} className="bg-white" />
      </Field>
      <ChoiceGroup label="Población joven objetivo" required columns error={errors[`${k}.population_codes`]} options={catalogs.populations}
        value={program.population_codes} onChange={(v) => onChange((p) => void (p.population_codes = v))} />
      <ChoiceGroup label="¿En qué zonas se implementa?" required columns error={errors[`${k}.territory_codes`]} options={catalogs.territories}
        value={program.territory_codes} onChange={(v) => onChange((p) => void (p.territory_codes = v))} />
      <ChoiceGroup label="Modalidad" required multiple={false} error={errors[`${k}.modality_code`]} options={catalogs.modalities}
        value={program.modality_code ? [program.modality_code] : []} onChange={([v]) => onChange((p) => void (p.modality_code = v))} />
      <ChoiceGroup label="¿A qué área de impacto pertenece principalmente?" required multiple={false} columns error={errors[`${k}.primary_area_code`]}
        options={catalogs.impactAreas} value={program.primary_area_code ? [program.primary_area_code] : []}
        onChange={([v]) => onChange((p) => { p.primary_area_code = v; p.area_codes = [...new Set([v, ...p.area_codes])]; })} />
      <ChoiceGroup label="¿A qué otras dimensiones apunta?" columns options={catalogs.impactAreas.filter((a) => a.code !== program.primary_area_code)}
        value={program.area_codes.filter((a) => a !== program.primary_area_code)}
        onChange={(v) => onChange((p) => void (p.area_codes = [p.primary_area_code, ...v].filter(Boolean)))} />
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Fecha de inicio" required error={errors[`${k}.start_date`]} htmlFor={`${k}-start`}>
          <Input id={`${k}-start`} type="date" value={program.start_date} onChange={(e) => onChange((p) => void (p.start_date = e.target.value))} className="h-11 bg-white" />
        </Field>
        <Field label="Fecha de finalización" hint="Déjala vacía si no tiene." error={errors[`${k}.end_date`]} htmlFor={`${k}-end`}>
          <Input id={`${k}-end`} type="date" value={program.end_date} onChange={(e) => onChange((p) => void (p.end_date = e.target.value))} className="h-11 bg-white" />
        </Field>
        <Field label="Meta de atención 2026" hint="Si no sabes, pon 0." htmlFor={`${k}-goal`}>
          <Input id={`${k}-goal`} inputMode="numeric" value={program.annual_goal} onChange={(e) => onChange((p) => void (p.annual_goal = numeric(e.target.value)))} className="h-11 bg-white" />
        </Field>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <p className="mb-3 text-sm font-bold text-goyn-navy">Resultados a la fecha</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {([
            ["atendidos", "Jóvenes atendidos a la fecha", "→ Conectados"],
            ["atendidos_mujeres", "De ellos, ¿cuántas son mujeres?", ""],
            ["fortalecidos", "Jóvenes que evidenciaron fortalecimiento de habilidades", "→ Fortalecidos"],
            ["fortalecidos_mujeres", "De ellos, ¿cuántas son mujeres?", ""],
            ...(isIngresos
              ? ([
                  ["empleo", "Jóvenes que accedieron a un empleo", "→ Transformados"],
                  ["empleo_mujeres", "De ellos, ¿cuántas son mujeres?", ""],
                  ["emprendimiento", "Jóvenes que iniciaron o mejoraron su emprendimiento", "→ Transformados"],
                  ["emprendimiento_mujeres", "De ellos, ¿cuántas son mujeres?", ""],
                ] as const)
              : []),
          ] as const).map(([key, text, tag]) => (
            <Field key={key} label={text} hint={tag || undefined} error={errors[`${k}.${key}`]} htmlFor={`${k}-${key}`}>
              <Input id={`${k}-${key}`} inputMode="numeric" value={program.resultados[key]} onChange={(e) => onChange((p) => void (p.resultados[key] = numeric(e.target.value)))} className="h-10" />
            </Field>
          ))}
        </div>
        {!isIngresos && <p className="mt-3 text-xs text-muted-foreground">Las preguntas de empleo y emprendimiento aparecen cuando el área principal es Generación de ingresos.</p>}
      </div>
    </div>
  );
}

function ReviewStep({
  payload: p,
  errors,
  update,
  goTo,
}: {
  payload: RegistrationPayload;
  errors: Record<string, string>;
  update: (m: (p: RegistrationPayload) => void) => void;
  goTo: (i: number) => void;
}) {
  const rows = useMemo(
    () => [
      { step: 0, label: "Organización", value: p.identificacion.name || "—" },
      { step: 0, label: "NIT", value: p.identificacion.has_nit ? p.identificacion.nit : "Sin NIT (código interno GOYN)" },
      { step: 0, label: "Contacto", value: `${p.contacto.name} · ${p.contacto.position} · ${p.identificacion.contact_email_public}` },
      { step: 1, label: "Tipo y rol", value: `${label("orgTypes", p.caracterizacion.org_type_code)} · ${label("roles", p.caracterizacion.primary_role_code)}` },
      { step: 2, label: "Territorios", value: p.territorio.territory_codes.map((c) => label("territories", c)).join(", ") || "—" },
      { step: 3, label: "Áreas de impacto", value: p.enfoque.area_codes.map((c) => label("impactAreas", c)).join(", ") || "—" },
      { step: 4, label: "Alianzas", value: `${p.relaciones.length} registradas` },
      { step: 5, label: "Proyectos", value: p.programas.map((x) => x.name || "Sin nombre").join(", ") },
    ],
    [p],
  );
  return (
    <div className="space-y-6">
      <dl className="divide-y rounded-2xl border">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-start sm:gap-4">
            <dt className="w-40 shrink-0 text-xs font-bold text-muted-foreground uppercase">{r.label}</dt>
            <dd className="flex-1 text-sm text-goyn-navy">{r.value}</dd>
            <button type="button" className="text-xs font-bold text-goyn-violeta hover:underline" onClick={() => goTo(r.step)}>Editar</button>
          </div>
        ))}
      </dl>
      <div className={cn("rounded-2xl border p-4 sm:p-5", errors.accepted && "border-destructive")}>
        <label className="flex items-start gap-3 text-sm text-goyn-navy">
          <input type="checkbox" className="mt-1 size-4 accent-[#9B00FF]" checked={p.consentimiento.accepted}
            onChange={(e) => update((x) => void (x.consentimiento.accepted = e.target.checked))} />
          <span>
            <strong>Autorizo el uso de datos.</strong> Con mi registro autorizo expresamente a FUNDACIÓN CORONA, operador del programa GOYN BARRANQUILLA, y a los terceros que contrate para fines operativos, como responsable del tratamiento, a recolectar, registrar, usar, actualizar y almacenar los datos de este formulario para las finalidades descritas en la{" "}
            <a href="https://www.fundacioncorona.org/tratamientodedatos" target="_blank" rel="noreferrer" className="font-semibold text-goyn-violeta underline">política de tratamiento de datos</a>.
            Puedo ejercer mis derechos escribiendo a tratamientodatospersonales@fcorona.org.
          </span>
        </label>
        {errors.accepted && <p role="alert" className="mt-2 text-xs font-semibold text-destructive">{errors.accepted}</p>}
      </div>
    </div>
  );
}
