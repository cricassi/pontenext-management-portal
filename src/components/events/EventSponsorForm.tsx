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
import {
  type EventSponsor,
  type EventSponsorOption,
} from "@/types/event";
import { emptyFormState, type FormState } from "@/types/form";

type EventSponsorFormProps = {
  link?: EventSponsor;
  sponsors: EventSponsorOption[];
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  cancelHref: string;
  submitLabel: string;
};

function fieldError(state: FormState, key: string) {
  return state.errors?.[key] ? (
    <p className="text-sm text-destructive">{state.errors[key]}</p>
  ) : null;
}

export function EventSponsorForm({
  link,
  sponsors,
  action,
  cancelHref,
  submitLabel,
}: EventSponsorFormProps) {
  const [state, formAction] = useActionState(action, emptyFormState);
  const canSelectSponsor = sponsors.length > 0 || Boolean(link);

  return (
    <Card id="event-sponsor-form">
      <CardHeader>
        <CardTitle>
          {link ? "Modifica sponsor evento" : "Collega sponsor"}
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
              <FieldLabel htmlFor="sponsorId">Sponsor</FieldLabel>
              <select
                id="sponsorId"
                name="sponsorId"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                defaultValue={link?.sponsorId ?? ""}
                disabled={!canSelectSponsor}
                required
              >
                <option value="">
                  {canSelectSponsor
                    ? "Seleziona sponsor"
                    : "Nessuno sponsor disponibile"}
                </option>
                {sponsors.map((sponsor) => (
                  <option key={sponsor.id} value={sponsor.id}>
                    {sponsor.companyName}
                  </option>
                ))}
              </select>
              {fieldError(state, "sponsorId")}
            </Field>

            <Field>
              <FieldLabel htmlFor="sponsorshipLevel">Livello</FieldLabel>
              <Input
                id="sponsorshipLevel"
                name="sponsorshipLevel"
                defaultValue={link?.sponsorshipLevel ?? ""}
                placeholder="Main sponsor, partner tecnico..."
              />
              {fieldError(state, "sponsorshipLevel")}
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel htmlFor="notes">Note</FieldLabel>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={link?.notes ?? ""}
              />
            </Field>
          </FieldGroup>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button asChild variant="outline">
              <Link href={cancelHref}>Annulla</Link>
            </Button>
            <FormSubmitButton disabled={!canSelectSponsor}>
              {submitLabel}
            </FormSubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
