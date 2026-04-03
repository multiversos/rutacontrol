"use client";

import { useActionState } from "react";

import { signInAction, type LoginFormState } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

type LoginFormProps = {
  disabled?: boolean;
  redirectTo: string;
};

const initialState: LoginFormState = {};

export function LoginForm({ disabled = false, redirectTo }: LoginFormProps) {
  const [state, formAction] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <input name="redirectTo" type="hidden" value={redirectTo} />

      <div className="space-y-2">
        <Label htmlFor="email">Correo</Label>
        <Input
          autoComplete="email"
          defaultValue="admin@rutacontrol.local"
          disabled={disabled}
          id="email"
          name="email"
          placeholder="admin@rutacontrol.local"
          type="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contrasena</Label>
        <Input
          autoComplete="current-password"
          disabled={disabled}
          id="password"
          name="password"
          placeholder="********"
          type="password"
        />
      </div>

      {state.error ? (
        <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      {disabled ? (
        <Button className="w-full" disabled type="button" variant="secondary">
          Completa la configuracion primero
        </Button>
      ) : (
        <SubmitButton className="w-full" pendingLabel="Ingresando...">
          Entrar al dashboard
        </SubmitButton>
      )}
    </form>
  );
}
