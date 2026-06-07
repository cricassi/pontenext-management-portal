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
import { EVENT_STATUS, type Event } from "@/types/event";
import {
  getCurrentDateTimeInputValue,
  toDateTimeInputValue,
} from "@/utils/date";

type EventFormProps = {
  event?: Event;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
};

function fieldError(state: FormState, key: string) {
  return state.errors?.[key] ? (
    <p className="text-sm text-destructive">{state.errors[key]}</p>
  ) : null;
}

export function EventForm({ event, action, submitLabel }: EventFormProps) {
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
              <FieldLabel htmlFor="name">Nome evento</FieldLabel>
              <Input
                id="name"
                name="name"
                defaultValue={event?.name ?? ""}
                required
              />
              {fieldError(state, "name")}
            </Field>

            <Field>
              <FieldLabel htmlFor="startDatetime">Inizio</FieldLabel>
              <Input
                id="startDatetime"
                name="startDatetime"
                type="datetime-local"
                defaultValue={
                  event
                    ? toDateTimeInputValue(event.startDatetime)
                    : getCurrentDateTimeInputValue()
                }
                required
              />
              {fieldError(state, "startDatetime")}
            </Field>

            <Field>
              <FieldLabel htmlFor="endDatetime">Fine</FieldLabel>
              <Input
                id="endDatetime"
                name="endDatetime"
                type="datetime-local"
                defaultValue={toDateTimeInputValue(event?.endDatetime ?? null)}
              />
              {fieldError(state, "endDatetime")}
            </Field>

            <Field>
              <FieldLabel htmlFor="location">Luogo</FieldLabel>
              <Input
                id="location"
                name="location"
                defaultValue={event?.location ?? ""}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="status">Stato evento</FieldLabel>
              <select
                id="status"
                name="status"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                defaultValue={event?.status ?? EVENT_STATUS.PLANNED}
              >
                <option value={EVENT_STATUS.PLANNED}>Pianificato</option>
                <option value={EVENT_STATUS.CONFIRMED}>Confermato</option>
                <option value={EVENT_STATUS.COMPLETED}>Concluso</option>
                <option value={EVENT_STATUS.CANCELLED}>Annullato</option>
              </select>
              {fieldError(state, "status")}
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel htmlFor="description">Descrizione</FieldLabel>
              <Textarea
                id="description"
                name="description"
                defaultValue={event?.description ?? ""}
              />
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel htmlFor="notes">Note</FieldLabel>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={event?.notes ?? ""}
              />
            </Field>
          </FieldGroup>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button asChild variant="outline">
              <Link href={event ? `/events/${event.id}` : "/events"}>
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
