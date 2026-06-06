"use client";

import { useActionState } from "react";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/Field";
import { FormSubmitButton } from "@/components/ui/FormSubmitButton";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { emptyFormState, type FormState } from "@/types/form";
import type { Role } from "@/types/role";
import { getTodayDateInputValue } from "@/utils/date";

type AssignRoleFormProps = {
  roles: Role[];
  action: (state: FormState, formData: FormData) => Promise<FormState>;
};

function fieldError(state: FormState, key: string) {
  return state.errors?.[key] ? (
    <p className="text-sm text-destructive">{state.errors[key]}</p>
  ) : null;
}

export function AssignRoleForm({ roles, action }: AssignRoleFormProps) {
  const [state, formAction] = useActionState(action, emptyFormState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.message ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {state.message}
        </div>
      ) : null}

      <FieldGroup className="grid gap-4 lg:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="roleId">Ruolo</FieldLabel>
          <select
            id="roleId"
            name="roleId"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            required
          >
            <option value="">Seleziona ruolo</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          {fieldError(state, "roleId")}
        </Field>

        <Field>
          <FieldLabel htmlFor="startDate">Data inizio</FieldLabel>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={getTodayDateInputValue()}
            required
          />
          {fieldError(state, "startDate")}
        </Field>

        <Field>
          <FieldLabel htmlFor="endDate">Data fine</FieldLabel>
          <Input id="endDate" name="endDate" type="date" />
          {fieldError(state, "endDate")}
        </Field>

        <Field className="lg:col-span-2">
          <FieldLabel htmlFor="notes">Note ruolo</FieldLabel>
          <Textarea id="notes" name="notes" />
        </Field>
      </FieldGroup>

      <div className="flex justify-end">
        <FormSubmitButton pendingLabel="Assegnazione...">
          Assegna ruolo
        </FormSubmitButton>
      </div>
    </form>
  );
}
