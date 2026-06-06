"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/Field";
import { FormSubmitButton } from "@/components/ui/FormSubmitButton";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { emptyFormState, type FormState } from "@/types/form";
import type { Role } from "@/types/role";

type RoleFormProps = {
  role?: Role;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
};

function fieldError(state: FormState, key: string) {
  return state.errors?.[key] ? (
    <p className="text-sm text-destructive">{state.errors[key]}</p>
  ) : null;
}

export function RoleForm({ role, action, submitLabel }: RoleFormProps) {
  const [state, formAction] = useActionState(action, emptyFormState);

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="flex flex-col gap-5">
          {state.message ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {state.message}
            </div>
          ) : null}

          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="name">Nome ruolo</FieldLabel>
              <Input
                id="name"
                name="name"
                defaultValue={role?.name ?? ""}
                required
              />
              {fieldError(state, "name")}
            </Field>

            <Field>
              <FieldLabel htmlFor="sortOrder">Ordinamento</FieldLabel>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min={0}
                step={1}
                defaultValue={role?.sortOrder ?? 0}
                required
              />
              {fieldError(state, "sortOrder")}
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel htmlFor="description">Descrizione</FieldLabel>
              <Textarea
                id="description"
                name="description"
                defaultValue={role?.description ?? ""}
              />
            </Field>

            <label className="flex items-center gap-3 text-sm md:col-span-2">
              <input
                type="checkbox"
                name="isDefault"
                defaultChecked={role?.isDefault ?? false}
                className="size-4 rounded border-input"
              />
              Ruolo base
            </label>
          </FieldGroup>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {role ? (
              <Button asChild variant="outline">
                <Link href="/settings/roles">Annulla</Link>
              </Button>
            ) : null}
            <FormSubmitButton>{submitLabel}</FormSubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
