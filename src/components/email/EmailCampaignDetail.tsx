"use client";

import { useActionState } from "react";
import { EmailProviderStatus } from "@/components/email/EmailProviderStatus";
import { EmailRecipientCardList } from "@/components/email/EmailRecipientCardList";
import { EmailRecipientTable } from "@/components/email/EmailRecipientTable";
import { EmailStatusBadge } from "@/components/email/EmailStatusBadge";
import { EmailTemplatePreview } from "@/components/email/EmailTemplatePreview";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Field, FieldLabel } from "@/components/ui/Field";
import { FormSubmitButton } from "@/components/ui/FormSubmitButton";
import { Textarea } from "@/components/ui/Textarea";
import {
  EMAIL_CAMPAIGN_AUDIENCE_TYPE,
  EMAIL_CAMPAIGN_STATUS,
  type EmailCampaign,
  type EmailProviderStatus as EmailProviderStatusType,
  type EmailRecipient,
} from "@/types/email";
import { emptyFormState, type FormState } from "@/types/form";
import { formatDateTime } from "@/utils/date";

type SegmentPreview = {
  recipients: unknown[];
  skippedCount: number;
  duplicateCount: number;
  optOutCount: number;
};

type EmailCampaignDetailProps = {
  campaign: EmailCampaign;
  recipients: EmailRecipient[];
  providerStatus: EmailProviderStatusType;
  segmentPreview?: SegmentPreview | null;
  generateAction: (
    state: FormState,
    formData: FormData,
  ) => Promise<FormState>;
  sendAction: (state: FormState, formData: FormData) => Promise<FormState>;
};

function audienceLabel(audienceType: EmailCampaign["audienceType"]) {
  const labels = {
    all_members: "Tutti i soci",
    active_members: "Soci attivi",
    expired_members: "Soci scaduti",
    sponsors: "Sponsor",
    custom: "Custom/manuale",
  };

  return labels[audienceType];
}

export function EmailCampaignDetail({
  campaign,
  recipients,
  providerStatus,
  segmentPreview,
  generateAction,
  sendAction,
}: EmailCampaignDetailProps) {
  const [generateState, generateFormAction] = useActionState(
    generateAction,
    emptyFormState,
  );
  const [sendState, sendFormAction] = useActionState(sendAction, emptyFormState);
  const isDraft = campaign.status === EMAIL_CAMPAIGN_STATUS.DRAFT;
  const pendingRecipients = recipients.filter(
    (recipient) => recipient.status === "pending",
  );

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>{campaign.subject}</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                Segmento: {audienceLabel(campaign.audienceType)}
              </p>
            </div>
            <EmailStatusBadge status={campaign.status} />
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Template</p>
            <p className="text-sm font-medium">
              {campaign.templateName ?? "Campagna manuale"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Snapshot</p>
            <p className="text-sm font-medium">
              {campaign.recipientSnapshotGeneratedAt
                ? formatDateTime(campaign.recipientSnapshotGeneratedAt)
                : "Non generato"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Invio</p>
            <p className="text-sm font-medium">
              {campaign.sentAt
                ? formatDateTime(campaign.sentAt)
                : campaign.failedAt
                  ? formatDateTime(campaign.failedAt)
                  : "Non inviato"}
            </p>
          </div>
        </CardContent>
      </Card>

      <EmailTemplatePreview subject={campaign.subject} body={campaign.body} />

      <EmailProviderStatus status={providerStatus} />

      {isDraft && recipients.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Destinatari</CardTitle>
          </CardHeader>
          <CardContent>
            {segmentPreview &&
            campaign.audienceType !== EMAIL_CAMPAIGN_AUDIENCE_TYPE.CUSTOM ? (
              <div className="mb-4 rounded-md border bg-muted/20 p-3 text-sm">
                Anteprima segmento: {segmentPreview.recipients.length} validi,{" "}
                {segmentPreview.skippedCount} esclusi.
              </div>
            ) : null}

            <form action={generateFormAction} className="flex flex-col gap-4">
              {generateState.message ? (
                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                  {generateState.message}
                </div>
              ) : null}

              {campaign.audienceType === EMAIL_CAMPAIGN_AUDIENCE_TYPE.CUSTOM ? (
                <Field>
                  <FieldLabel htmlFor="customRecipients">
                    Destinatari manuali
                  </FieldLabel>
                  <Textarea
                    id="customRecipients"
                    name="customRecipients"
                    rows={6}
                    placeholder="Mario Rossi <mario@example.com>"
                    required
                  />
                </Field>
              ) : null}

              <Field>
                <FieldLabel htmlFor="consentBasisSnapshot">
                  Base consenso dichiarata
                </FieldLabel>
                <Textarea
                  id="consentBasisSnapshot"
                  name="consentBasisSnapshot"
                  rows={3}
                  placeholder="Esempio: comunicazione associativa a soci/sponsor con consenso operativo verificato."
                />
              </Field>

              <div className="flex justify-end">
                <FormSubmitButton>Genera destinatari</FormSubmitButton>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Totali</p>
          <p className="mt-1 text-2xl font-semibold tracking-normal">
            {recipients.length}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="mt-1 text-2xl font-semibold tracking-normal">
            {pendingRecipients.length}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Inviate</p>
          <p className="mt-1 text-2xl font-semibold tracking-normal">
            {recipients.filter((recipient) => recipient.status === "sent").length}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Fallite</p>
          <p className="mt-1 text-2xl font-semibold tracking-normal">
            {
              recipients.filter((recipient) => recipient.status === "failed")
                .length
            }
          </p>
        </div>
      </div>

      {isDraft && recipients.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Conferma invio</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={sendFormAction} className="flex flex-col gap-4">
              {sendState.message ? (
                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                  {sendState.message}
                </div>
              ) : null}

              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  name="confirmSend"
                  className="mt-1 size-4 rounded border-input"
                  required
                />
                Confermo l&apos;invio della campagna ai destinatari pending e la
                base consenso per questa comunicazione.
              </label>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={
                    !providerStatus.isConfigured ||
                    pendingRecipients.length === 0
                  }
                >
                  Invia campagna
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <EmailRecipientTable recipients={recipients} />
      <EmailRecipientCardList recipients={recipients} />
    </div>
  );
}
