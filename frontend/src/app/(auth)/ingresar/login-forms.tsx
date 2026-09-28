"use client";

import { useActionState, useState } from "react";
import { sendMagicLink, signIn, signUp, type AuthState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Mode = "ingresar" | "crear" | "enlace";

export function LoginForms({ siguiente }: { siguiente: string }) {
  const [mode, setMode] = useState<Mode>("ingresar");
  const [signInState, signInAction, signingIn] = useActionState<AuthState, FormData>(signIn, {});
  const [signUpState, signUpAction, signingUp] = useActionState<AuthState, FormData>(signUp, {});
  const [linkState, linkAction, sendingLink] = useActionState<AuthState, FormData>(sendMagicLink, {});
  const state = mode === "ingresar" ? signInState : mode === "crear" ? signUpState : linkState;

  return (
    <div className="mt-8 space-y-5">
      <div className="grid grid-cols-3 rounded-full bg-muted p-1 text-sm font-semibold" role="tablist">
        {(["ingresar", "crear", "enlace"] as Mode[]).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cn("h-9 rounded-full", mode === m ? "bg-white text-goyn-violeta shadow-sm" : "text-muted-foreground")}
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
          <Label htmlFor="email">Correo electrónico</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" className="h-11" />
        </div>
        {mode !== "enlace" && (
          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" name="password" type="password" required minLength={8} autoComplete={mode === "crear" ? "new-password" : "current-password"} className="h-11" />
          </div>
        )}
        {state.error && <p role="alert" className="text-sm font-semibold text-destructive">{state.error}</p>}
        {state.message && <p role="status" className="rounded-xl bg-goyn-lila p-3 text-sm text-goyn-navy">{state.message}</p>}
        <Button type="submit" disabled={signingIn || signingUp || sendingLink} className="h-11 w-full rounded-full font-bold">
          {mode === "ingresar" ? "Ingresar" : mode === "crear" ? "Crear cuenta" : "Enviarme el enlace"}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">
        Al crear tu cuenta podrás registrar tu organización. El equipo GOYN valida cada registro antes de publicarlo.
      </p>
    </div>
  );
}
