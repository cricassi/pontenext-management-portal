"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/Field";
import { FormSubmitButton } from "@/components/ui/FormSubmitButton";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  EMAIL_TEMPLATE_AUDIENCE,
  type EmailTemplate,
} from "@/types/email";
import { emptyFormState, type FormState } from "@/types/form";

type EmailTemplateFormProps = {
  template?: EmailTemplate | null;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
};

function fieldError(state: FormState, key: string) {
  return state.errors?.[key] ? (
    <p className="text-sm text-destructive">{state.errors[key]}</p>
  ) : null;
}

export function EmailTemplateForm({
  template,
  action,
  submitLabel,
}: EmailTemplateFormProps) {
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

          <FieldGroup className="grid gap-4">
            <Field>
              <FieldLabel htmlFor="name">Nome template</FieldLabel>
              <Input
                id="name"
                name="name"
                defaultValue={template?.name ?? ""}
                required
              />
              {fieldError(state, "name")}
            </Field>

            <Field>
              <FieldLabel htmlFor="audience">Pubblico</FieldLabel>
              <select
                id="audience"
                name="audience"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                defaultValue={template?.audience ?? EMAIL_TEMPLATE_AUDIENCE.BOTH}
              >
                <option value={EMAIL_TEMPLATE_AUDIENCE.BOTH}>Soci e sponsor</option>
                <option value={EMAIL_TEMPLATE_AUDIENCE.MEMBERS}>Solo soci</option>
                <option value={EMAIL_TEMPLATE_AUDIENCE.SPONSORS}>
                  Solo sponsor
                </option>
              </select>
              {fieldError(state, "audience")}
            </Field>

            <Field>
              <FieldLabel htmlFor="subject">Oggetto</FieldLabel>
              <Input
                id="subject"
                name="subject"
                defaultValue={template?.subject ?? ""}
                required
              />
              {fieldError(state, "subject")}
            </Field>

            <Field>
              <FieldLabel htmlFor="body">Corpo email</FieldLabel>
              <Textarea
                id="body"
                name="body"
                defaultValue={template?.body ?? ""}
                rows={10}
                required
              />
              {fieldError(state, "body")}
            </Field>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={template?.isActive ?? true}
                className="size-4 rounded border-input"
              />
              Template attivo
            </label>
          </FieldGroup>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button asChild variant="outline">
              <Link href="/email/templates">Annulla</Link>
            </Button>
            <FormSubmitButton>{submitLabel}</FormSubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
