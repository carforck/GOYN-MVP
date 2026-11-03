"use client";

import { useActionState } from "react";
import { changePassword, type AuthState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangePasswordForm({ siguiente }: { siguiente: string }) {
  const [state, action, saving] = useActionState<AuthState, FormData>(changePassword, {});
  return (
    <form action={action} className="mt-8 space-y-4">
      <input type="hidden" name="siguiente" value={siguiente} />
      <div className="space-y-1.5">
        <Label htmlFor="password">Nueva contraseña</Label>
        <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="h-11" />
        <p className="text-xs text-muted-foreground">Mínimo 8 caracteres, con letras y números.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm">Repite la contraseña</Label>
        <Input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className="h-11" />
      </div>
      {state.error && <p role="alert" className="text-sm font-semibold text-destructive">{state.error}</p>}
      <Button type="submit" disabled={saving} className="h-11 w-full rounded-full font-bold">
        {saving ? "Guardando…" : "Guardar y continuar"}
      </Button>
    </form>
  );
}
