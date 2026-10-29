"use client";

import { CheckIcon, CopyIcon, FlaskConicalIcon, LogInIcon } from "lucide-react";
import { useActionState, useState } from "react";
import { signIn, type AuthState } from "@/app/(auth)/actions";
import type { CuentaPrueba } from "@/app/(auth)/cuentas-prueba";
import { Button } from "@/components/ui/button";

// Cuentas de prueba "quemadas" para la prueba GOYN: se muestran solo si NEXT_PUBLIC_CUENTAS_PRUEBA
// tiene contenido (la página no renderiza este bloque sin cuentas). Para apagarlo, quitar la variable.
export function TestAccounts({ cuentas, siguiente }: { cuentas: CuentaPrueba[]; siguiente: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, {});
  const [submitting, setSubmitting] = useState<string | null>(null);
  if (cuentas.length === 0) return null;

  return (
    <section aria-labelledby="cuentas-prueba-titulo" className="mt-8 rounded-2xl border-2 border-goyn-naranja/60 bg-goyn-naranja/10 p-4 sm:p-5">
      <h2 id="cuentas-prueba-titulo" className="flex items-center gap-2 font-heading text-lg font-extrabold text-goyn-navy">
        <FlaskConicalIcon className="size-5 shrink-0 text-goyn-naranja" aria-hidden />
        Cuentas de prueba
      </h2>
      <p className="mt-2 text-sm text-goyn-navy">
        Cuentas de prueba para validar el flujo de la plataforma (registro, validación y visualización por rol). Los datos que veas son
        de demostración y lo que registres puede borrarse después de la prueba.{" "}
        <strong>No ingreses información real o sensible.</strong>
      </p>

      <ul className="mt-4 space-y-3">
        {cuentas.map((c) => (
          <li key={c.usuario} className="rounded-xl border bg-card p-3">
            <p className="font-heading font-bold text-foreground">{c.rol}</p>
            <dl className="mt-2 grid gap-1.5 text-sm">
              <Credential label="Usuario" value={c.usuario} rol={c.rol} />
              <Credential label="Contraseña" value={c.clave} rol={c.rol} />
            </dl>
            <form action={action} onSubmit={() => setSubmitting(c.usuario)} className="mt-3">
              <input type="hidden" name="email" value={c.email} />
              <input type="hidden" name="password" value={c.clave} />
              <input type="hidden" name="siguiente" value={siguiente} />
              <Button type="submit" disabled={pending} className="h-10 w-full rounded-full font-bold">
                <LogInIcon className="size-4" aria-hidden />
                {pending && submitting === c.usuario ? "Ingresando…" : `Entrar como ${c.rol}`}
              </Button>
            </form>
          </li>
        ))}
      </ul>
      {state.error && (
        <p role="alert" className="mt-3 text-sm font-semibold text-destructive">
          {state.error}
        </p>
      )}
    </section>
  );
}

function Credential({ label, value, rol }: { label: string; value: string; rol: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Sin permiso de portapapeles: el texto sigue visible y seleccionable.
    }
  };
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="flex min-w-0 items-center gap-1">
        <code className="truncate rounded bg-muted px-2 py-0.5 font-mono text-foreground select-all">{value}</code>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copiar ${label.toLowerCase()} de ${rol}`}
          className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-goyn-violeta"
        >
          {copied ? <CheckIcon className="size-4 text-goyn-violeta" aria-hidden /> : <CopyIcon className="size-4" aria-hidden />}
        </button>
        <span className="sr-only" aria-live="polite">
          {copied ? `${label} copiada` : ""}
        </span>
      </dd>
    </div>
  );
}
