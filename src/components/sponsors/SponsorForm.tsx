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
import { SPONSOR_STATUS, type Sponsor } from "@/types/sponsor";

type SponsorFormProps = {
  sponsor?: Sponsor;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
};

function fieldError(state: FormState, key: string) {
  return state.errors?.[key] ? (
    <p className="text-sm text-destructive">{state.errors[key]}</p>
  ) : null;
}

export function SponsorForm({
  sponsor,
  action,
  submitLabel,
}: SponsorFormProps) {
  const [state, formAction] = useActionState(action, emptyFormState);

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="flex flex-col gap-6">
          {state.message ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {state.message}
            </div>
          ) : null}

          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="companyName">Ragione sociale</FieldLabel>
              <Input
                id="companyName"
                name="companyName"
                defaultValue={sponsor?.companyName ?? ""}
                required
              />
              {fieldError(state, "companyName")}
            </Field>

            <Field>
              <FieldLabel htmlFor="contactName">Referente</FieldLabel>
              <Input
                id="contactName"
                name="contactName"
                defaultValue={sponsor?.contactName ?? ""}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={sponsor?.email ?? ""}
              />
              {fieldError(state, "email")}
            </Field>

            <Field>
              <FieldLabel htmlFor="phone">Telefono</FieldLabel>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={sponsor?.phone ?? ""}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="website">Sito web</FieldLabel>
              <Input
                id="website"
                name="website"
                type="url"
                placeholder="https://..."
                defaultValue={sponsor?.website ?? ""}
              />
              {fieldError(state, "website")}
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel htmlFor="address">Indirizzo</FieldLabel>
              <Input
                id="address"
                name="address"
                defaultValue={sponsor?.address ?? ""}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="city">Citta</FieldLabel>
              <Input
                id="city"
                name="city"
                defaultValue={sponsor?.city ?? ""}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="status">Stato sponsor</FieldLabel>
              <select
                id="status"
                name="status"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                defaultValue={sponsor?.status ?? SPONSOR_STATUS.ACTIVE}
              >
                <option value={SPONSOR_STATUS.ACTIVE}>Attivo</option>
                <option value={SPONSOR_STATUS.INACTIVE}>Inattivo</option>
                <option value={SPONSOR_STATUS.ARCHIVED}>Archiviato</option>
              </select>
              {fieldError(state, "status")}
            </Field>

            <Field>
              <FieldLabel htmlFor="vatNumber">Partita IVA</FieldLabel>
              <Input
                id="vatNumber"
                name="vatNumber"
                defaultValue={sponsor?.vatNumber ?? ""}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="fiscalCode">Codice fiscale</FieldLabel>
              <Input
                id="fiscalCode"
                name="fiscalCode"
                defaultValue={sponsor?.fiscalCode ?? ""}
              />
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel htmlFor="notes">Note</FieldLabel>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={sponsor?.notes ?? ""}
              />
            </Field>
          </FieldGroup>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button asChild variant="outline">
              <Link href={sponsor ? `/sponsors/${sponsor.id}` : "/sponsors"}>
                Annulla
              </Link>
            </Button>
            <FormSubmitButton>{submitLabel}</FormSubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
