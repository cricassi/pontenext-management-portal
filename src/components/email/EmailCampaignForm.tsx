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
  EMAIL_CAMPAIGN_AUDIENCE_TYPE,
  type EmailCampaign,
  type EmailTemplate,
} from "@/types/email";
import { emptyFormState, type FormState } from "@/types/form";

type EmailCampaignFormProps = {
  campaign?: EmailCampaign | null;
  templates: EmailTemplate[];
  selectedTemplate?: EmailTemplate | null;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
};

function fieldError(state: FormState, key: string) {
  return state.errors?.[key] ? (
    <p className="text-sm text-destructive">{state.errors[key]}</p>
  ) : null;
}

export function EmailCampaignForm({
  campaign,
  templates,
  selectedTemplate,
  action,
  submitLabel,
}: EmailCampaignFormProps) {
  const [state, formAction] = useActionState(action, emptyFormState);
  const subject = campaign?.subject ?? selectedTemplate?.subject ?? "";
  const body = campaign?.body ?? selectedTemplate?.body ?? "";
  const templateId = campaign?.templateId ?? selectedTemplate?.id ?? "";

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
              <FieldLabel htmlFor="templateId">Template</FieldLabel>
              <select
                id="templateId"
                name="templateId"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                defaultValue={templateId}
              >
                <option value="">Nessun template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              {fieldError(state, "templateId")}
            </Field>

            <Field>
              <FieldLabel htmlFor="audienceType">Segmento</FieldLabel>
              <select
                id="audienceType"
                name="audienceType"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                defaultValue={
                  campaign?.audienceType ??
                  EMAIL_CAMPAIGN_AUDIENCE_TYPE.ALL_MEMBERS
                }
              >
                <option value={EMAIL_CAMPAIGN_AUDIENCE_TYPE.ALL_MEMBERS}>
                  Tutti i soci
                </option>
                <option value={EMAIL_CAMPAIGN_AUDIENCE_TYPE.ACTIVE_MEMBERS}>
                  Soci attivi
                </option>
                <option value={EMAIL_CAMPAIGN_AUDIENCE_TYPE.EXPIRED_MEMBERS}>
                  Soci scaduti
                </option>
                <option value={EMAIL_CAMPAIGN_AUDIENCE_TYPE.SPONSORS}>
                  Sponsor
                </option>
                <option value={EMAIL_CAMPAIGN_AUDIENCE_TYPE.CUSTOM}>
                  Custom/manuale
                </option>
              </select>
              {fieldError(state, "audienceType")}
            </Field>

            <Field>
              <FieldLabel htmlFor="subject">Oggetto</FieldLabel>
              <Input
                id="subject"
                name="subject"
                defaultValue={subject}
                required
              />
              {fieldError(state, "subject")}
            </Field>

            <Field>
              <FieldLabel htmlFor="body">Corpo email</FieldLabel>
              <Textarea id="body" name="body" defaultValue={body} rows={12} required />
              {fieldError(state, "body")}
            </Field>
          </FieldGroup>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button asChild variant="outline">
              <Link href="/email/campaigns">Annulla</Link>
            </Button>
            <FormSubmitButton>{submitLabel}</FormSubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
