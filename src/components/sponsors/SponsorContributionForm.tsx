"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/Field";
import { FormSubmitButton } from "@/components/ui/FormSubmitButton";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { emptyFormState, type FormState } from "@/types/form";
import {
  SPONSOR_CONTRIBUTION_TYPE,
  type SponsorContribution,
} from "@/types/sponsor";
import { getTodayDateInputValue } from "@/utils/date";

type SponsorContributionFormProps = {
  contribution?: SponsorContribution;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  cancelHref: string;
  submitLabel: string;
};

function fieldError(state: FormState, key: string) {
  return state.errors?.[key] ? (
    <p className="text-sm text-destructive">{state.errors[key]}</p>
  ) : null;
}

export function SponsorContributionForm({
  contribution,
  action,
  cancelHref,
  submitLabel,
}: SponsorContributionFormProps) {
  const [state, formAction] = useActionState(action, emptyFormState);

  return (
    <Card id="contribution-form">
      <CardHeader>
        <CardTitle>
          {contribution ? "Modifica contributo" : "Registra contributo"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-5">
          {state.message ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {state.message}
            </div>
          ) : null}

          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="contributionDate">Data</FieldLabel>
              <Input
                id="contributionDate"
                name="contributionDate"
                type="date"
                defaultValue={
                  contribution?.contributionDate ?? getTodayDateInputValue()
                }
                required
              />
              {fieldError(state, "contributionDate")}
            </Field>

            <Field>
              <FieldLabel htmlFor="contributionType">Tipo</FieldLabel>
              <select
                id="contributionType"
                name="contributionType"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                defaultValue={
                  contribution?.contributionType ??
                  SPONSOR_CONTRIBUTION_TYPE.MONEY
                }
                required
              >
                <option value={SPONSOR_CONTRIBUTION_TYPE.MONEY}>
                  Monetario
                </option>
                <option value={SPONSOR_CONTRIBUTION_TYPE.GOODS}>Beni</option>
                <option value={SPONSOR_CONTRIBUTION_TYPE.SERVICE}>
                  Servizi
                </option>
                <option value={SPONSOR_CONTRIBUTION_TYPE.OTHER}>Altro</option>
              </select>
              {fieldError(state, "contributionType")}
            </Field>

            <Field>
              <FieldLabel htmlFor="amount">Importo o valore stimato</FieldLabel>
              <Input
                id="amount"
                name="amount"
                type="number"
                min={0}
                step="0.01"
                defaultValue={contribution?.amount ?? 0}
                required
              />
              {fieldError(state, "amount")}
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel htmlFor="description">Descrizione</FieldLabel>
              <Input
                id="description"
                name="description"
                defaultValue={contribution?.description ?? ""}
              />
              {fieldError(state, "description")}
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel htmlFor="notes">Note</FieldLabel>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={contribution?.notes ?? ""}
              />
            </Field>
          </FieldGroup>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button asChild variant="outline">
              <Link href={cancelHref}>Annulla</Link>
            </Button>
            <FormSubmitButton>{submitLabel}</FormSubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
