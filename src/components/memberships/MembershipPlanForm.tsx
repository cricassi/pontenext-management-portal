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
import type { MembershipPlan } from "@/types/membership";

type MembershipPlanFormProps = {
  plan?: MembershipPlan;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
};

function fieldError(state: FormState, key: string) {
  return state.errors?.[key] ? (
    <p className="text-sm text-destructive">{state.errors[key]}</p>
  ) : null;
}

export function MembershipPlanForm({
  plan,
  action,
  submitLabel,
}: MembershipPlanFormProps) {
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
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="name">Nome piano</FieldLabel>
              <Input
                id="name"
                name="name"
                defaultValue={plan?.name ?? ""}
                required
              />
              {fieldError(state, "name")}
            </Field>

            <Field>
              <FieldLabel htmlFor="minimumFee">Quota minima</FieldLabel>
              <Input
                id="minimumFee"
                name="minimumFee"
                type="number"
                min={0}
                step="0.01"
                defaultValue={plan?.minimumFee ?? 30}
                required
              />
              {fieldError(state, "minimumFee")}
            </Field>

            <Field>
              <FieldLabel htmlFor="defaultDurationMonths">
                Durata default mesi
              </FieldLabel>
              <Input
                id="defaultDurationMonths"
                name="defaultDurationMonths"
                type="number"
                min={1}
                step={1}
                defaultValue={plan?.defaultDurationMonths ?? 12}
                required
              />
              {fieldError(state, "defaultDurationMonths")}
            </Field>

            <Field>
              <FieldLabel htmlFor="sortOrder">Ordinamento</FieldLabel>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min={0}
                step={1}
                defaultValue={plan?.sortOrder ?? 0}
                required
              />
              {fieldError(state, "sortOrder")}
            </Field>

            <label className="flex items-center gap-3 text-sm md:self-end">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={plan?.isActive ?? true}
                className="size-4 rounded border-input"
              />
              Piano selezionabile
            </label>

            <Field className="md:col-span-2">
              <FieldLabel htmlFor="description">Descrizione</FieldLabel>
              <Textarea
                id="description"
                name="description"
                defaultValue={plan?.description ?? ""}
              />
            </Field>
          </FieldGroup>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {plan ? (
              <Button asChild variant="outline">
                <Link href="/settings/membership-plans">Annulla</Link>
              </Button>
            ) : null}
            <FormSubmitButton>{submitLabel}</FormSubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
