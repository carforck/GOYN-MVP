"use client";

import { useActionState, useState } from "react";
import { requestPasswordReset, sendMagicLink, signIn, signUp, type AuthState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Mode = "ingresar" | "crear" | "enlace";

const DATA_POLICY_URL = "https://www.fundacioncorona.org/tratamientodedatos";

export function LoginForms({ siguiente }: { siguiente: string }) {
  const [mode, setMode] = useState<Mode>("ingresar");
  const [forgot, setForgot] = useState(false);
  const [signInState, signInAction, signingIn] = useActionState<AuthState, FormData>(signIn, {});
  const [signUpState, signUpAction, signingUp] = useActionState<AuthState, FormData>(signUp, {});
  const [linkState, linkAction, sendingLink] = useActionState<AuthState, FormData>(sendMagicLink, {});
  const [resetState, resetAction, sendingReset] = useActionState<AuthState, FormData>(requestPasswordReset, {});
  const state = mode === "ingresar" ? signInState : mode === "crear" ? signUpState : linkState;

  if (forgot) {
    return (
      <div className="mt-8 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-foreground">Restablecer contraseña</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Escribe el correo con el que ingresas y te enviaremos un enlace para crear una nueva contraseña.
          </p>
        </div>
        <form action={resetAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reset-email">Correo electrónico</Label>
            <Input id="reset-email" name="email" type="email" required autoComplete="email" autoCapitalize="none" spellCheck={false} className="h-11" />
          </div>
          {resetState.error && <p role="alert" className="text-sm font-semibold text-destructive">{resetState.error}</p>}
          {resetState.message && <p role="status" className="rounded-xl bg-goyn-lila p-3 text-sm text-foreground">{resetState.message}</p>}
          <Button type="submit" disabled={sendingReset} className="h-11 w-full rounded-full font-bold">
            {sendingReset ? "Enviando…" : "Enviarme el enlace"}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground">
          Tus datos se tratan según la{" "}
          <a href={DATA_POLICY_URL} target="_blank" rel="noreferrer" className="font-semibold text-goyn-violeta underline">Política de tratamiento de datos</a>{" "}
          de Fundación Corona.
        </p>
        <button type="button" onClick={() => setForgot(false)} className="text-sm font-semibold text-goyn-violeta hover:underline">
          ← Volver a ingresar
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-5">
      <div className="grid grid-cols-3 rounded-full bg-muted p-1 text-sm font-semibold" role="tablist">
        {(["ingresar", "crear", "enlace"] as Mode[]).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cn("h-9 rounded-full", mode === m ? "bg-card text-goyn-violeta shadow-sm" : "text-muted-foreground")}
          >
            {m === "ingresar" ? "Ingresar" : m === "crear" ? "Crear cuenta" : "Enlace por correo"}
          </button>
        ))}
      </div>

      <form action={mode === "ingresar" ? signInAction : mode === "crear" ? signUpAction : linkAction} className="space-y-4">
        <input type="hidden" name="siguiente" value={siguiente} />
        {mode === "crear" && (
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Nombre completo</Label>
            <Input id="full_name" name="full_name" required autoComplete="name" className="h-11" />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">{mode === "ingresar" ? "Correo o usuario" : "Correo electrónico"}</Label>
          {/* En "Ingresar" se acepta también el usuario corto de las cuentas de prueba (sin "@"). */}
          <Input
            key={mode === "ingresar" ? "usuario" : "correo"}
            id="email"
            name="email"
            type={mode === "ingresar" ? "text" : "email"}
            required
            autoComplete={mode === "ingresar" ? "username" : "email"}
            autoCapitalize="none"
            spellCheck={false}
            className="h-11"
          />
        </div>
        {mode !== "enlace" && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="password">Contraseña</Label>
              {mode === "ingresar" && (
                <button type="button" onClick={() => setForgot(true)} className="py-1 text-xs font-semibold text-goyn-violeta hover:underline">
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>
            <Input id="password" name="password" type="password" required minLength={8} autoComplete={mode === "crear" ? "new-password" : "current-password"} className="h-11" />
          </div>
        )}
        {mode === "crear" && (
          <label className="flex items-start gap-3 rounded-xl border p-3 text-sm leading-snug">
            <input type="checkbox" name="acepta_datos" value="si" required className="mt-0.5 size-4 shrink-0 accent-goyn-violeta" />
            <span>
              Acepto la{" "}
              <a href={DATA_POLICY_URL} target="_blank" rel="noreferrer" className="font-semibold text-goyn-violeta underline">
                Política de tratamiento de datos
              </a>{" "}
              de Fundación Corona para el uso de mi nombre y correo en esta plataforma.
            </span>
          </label>
        )}
        {state.error && <p role="alert" className="text-sm font-semibold text-destructive">{state.error}</p>}
        {state.message && <p role="status" className="rounded-xl bg-goyn-lila p-3 text-sm text-foreground">{state.message}</p>}
        <Button type="submit" disabled={signingIn || signingUp || sendingLink} className="h-11 w-full rounded-full font-bold">
          {mode === "ingresar" ? "Ingresar" : mode === "crear" ? "Crear cuenta" : "Enviarme el enlace"}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">
        {mode === "crear"
          ? "Al crear tu cuenta podrás registrar tu organización. El equipo GOYN valida cada registro antes de publicarlo."
          : "Al ingresar aceptas el uso de tus datos según la "}
        {mode !== "crear" && (
          <a href={DATA_POLICY_URL} target="_blank" rel="noreferrer" className="font-semibold text-goyn-violeta underline">
            Política de tratamiento de datos
          </a>
        )}
        {mode !== "crear" && " de Fundación Corona."}
      </p>
    </div>
  );
}
