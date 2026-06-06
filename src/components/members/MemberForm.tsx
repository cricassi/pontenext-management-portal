"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/Field";
import { FormSubmitButton } from "@/components/ui/FormSubmitButton";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { emptyFormState, type FormState } from "@/types/form";
import { MEMBER_STATUS, type Member } from "@/types/member";

type MemberFormProps = {
  member?: Member;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
};

function fieldError(state: FormState, key: string) {
  return state.errors?.[key] ? (
    <p className="text-sm text-destructive">{state.errors[key]}</p>
  ) : null;
}

export function MemberForm({ member, action, submitLabel }: MemberFormProps) {
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
            <Field>
              <FieldLabel htmlFor="firstName">Nome</FieldLabel>
              <Input
                id="firstName"
                name="firstName"
                defaultValue={member?.firstName ?? ""}
                required
              />
              {fieldError(state, "firstName")}
            </Field>

            <Field>
              <FieldLabel htmlFor="lastName">Cognome</FieldLabel>
              <Input
                id="lastName"
                name="lastName"
                defaultValue={member?.lastName ?? ""}
                required
              />
              {fieldError(state, "lastName")}
            </Field>

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={member?.email ?? ""}
              />
              {fieldError(state, "email")}
            </Field>

            <Field>
              <FieldLabel htmlFor="phone">Telefono</FieldLabel>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={member?.phone ?? ""}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="birthDate">Data nascita</FieldLabel>
              <Input
                id="birthDate"
                name="birthDate"
                type="date"
                defaultValue={member?.birthDate ?? ""}
              />
              {fieldError(state, "birthDate")}
            </Field>

            <Field>
              <FieldLabel htmlFor="fiscalCode">Codice fiscale</FieldLabel>
              <Input
                id="fiscalCode"
                name="fiscalCode"
                defaultValue={member?.fiscalCode ?? ""}
              />
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel htmlFor="address">Indirizzo</FieldLabel>
              <Input
                id="address"
                name="address"
                defaultValue={member?.address ?? ""}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="city">Citta</FieldLabel>
              <Input
                id="city"
                name="city"
                defaultValue={member?.city ?? ""}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="postalCode">CAP</FieldLabel>
              <Input
                id="postalCode"
                name="postalCode"
                defaultValue={member?.postalCode ?? ""}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="province">Provincia</FieldLabel>
              <Input
                id="province"
                name="province"
                maxLength={2}
                defaultValue={member?.province ?? ""}
              />
              {fieldError(state, "province")}
            </Field>

            <Field>
              <FieldLabel htmlFor="country">Paese</FieldLabel>
              <Input
                id="country"
                name="country"
                defaultValue={member?.country ?? "Italia"}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="profession">Professione</FieldLabel>
              <Input
                id="profession"
                name="profession"
                defaultValue={member?.profession ?? ""}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="status">Stato anagrafico</FieldLabel>
              <select
                id="status"
                name="status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                defaultValue={member?.status ?? MEMBER_STATUS.ACTIVE}
              >
                <option value={MEMBER_STATUS.ACTIVE}>Attivo</option>
                <option value={MEMBER_STATUS.INACTIVE}>Inattivo</option>
                <option value={MEMBER_STATUS.ARCHIVED}>Archiviato</option>
              </select>
              {fieldError(state, "status")}
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel htmlFor="notes">Note</FieldLabel>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={member?.notes ?? ""}
              />
            </Field>
          </FieldGroup>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button asChild variant="outline">
              <Link href={member ? `/members/${member.id}` : "/members"}>
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
