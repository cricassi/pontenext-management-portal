import {
  assertEmailProviderConfigured,
  sendEmailWithProvider,
} from "@/services/email-provider.service";
import {
  buildSegmentRecipients,
  getCampaignRecipients,
  getEmailRecipientSelect,
  getPendingCampaignRecipients,
  insertCampaignRecipients,
  mapEmailRecipientRow,
  type EmailRecipientRow,
} from "@/services/email-recipients.service";
import { getSupabaseServerClientOrThrow } from "@/services/supabase.service";
import {
  EMAIL_CAMPAIGN_AUDIENCE_TYPE,
  EMAIL_CAMPAIGN_STATUS,
  EMAIL_RECIPIENT_STATUS,
  type CampaignRecipientGenerationResult,
  type CampaignSendResult,
  type EmailCampaign,
  type EmailCampaignAudienceType,
  type EmailCampaignFormValues,
  type EmailCampaignListItem,
  type EmailCampaignStatus,
  type EmailRecipient,
} from "@/types/email";
import { readOptionalString, readRequiredString } from "@/utils/form";
import { isUuid } from "@/utils/id";
import { renderEmailHtml, renderEmailText } from "@/utils/email";

type Relation<T> = T | T[] | null;

type EmailCampaignRow = {
  id: string;
  template_id: string | null;
  subject: string;
  body: string;
  audience_type: EmailCampaignAudienceType;
  status: EmailCampaignStatus;
  provider: "resend";
  recipient_snapshot_generated_at: string | null;
  send_confirmed_at: string | null;
  sent_at: string | null;
  failed_at: string | null;
  error_message: string | null;
  created_by: string | null;
  sent_by: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  email_templates: Relation<{
    name: string;
  }>;
};

type EmailCampaignValidationResult =
  | { ok: true; values: EmailCampaignFormValues }
  | { ok: false; errors: Record<string, string>; message: string };

const emailCampaignSelect =
  "id, template_id, subject, body, audience_type, status, provider, recipient_snapshot_generated_at, send_confirmed_at, sent_at, failed_at, error_message, created_by, sent_by, created_at, updated_at, archived_at, email_templates(name)";

function one<T>(relation: Relation<T>) {
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

function mapEmailCampaign(row: EmailCampaignRow): EmailCampaign {
  return {
    id: row.id,
    templateId: row.template_id,
    templateName: one(row.email_templates)?.name ?? null,
    subject: row.subject,
    body: row.body,
    audienceType: row.audience_type,
    status: row.status,
    provider: row.provider,
    recipientSnapshotGeneratedAt: row.recipient_snapshot_generated_at,
    sendConfirmedAt: row.send_confirmed_at,
    sentAt: row.sent_at,
    failedAt: row.failed_at,
    errorMessage: row.error_message,
    createdBy: row.created_by,
    sentBy: row.sent_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

function isEmailCampaignAudienceType(
  value: string,
): value is EmailCampaignAudienceType {
  return Object.values(EMAIL_CAMPAIGN_AUDIENCE_TYPE).includes(
    value as EmailCampaignAudienceType,
  );
}

function mapCampaignValues(values: EmailCampaignFormValues) {
  return {
    template_id: values.templateId,
    subject: values.subject,
    body: values.body,
    audience_type: values.audienceType,
  };
}

function countRecipientsByStatus(recipients: EmailRecipient[]) {
  return recipients.reduce(
    (accumulator, recipient) => {
      accumulator.totalRecipients += 1;

      if (recipient.status === EMAIL_RECIPIENT_STATUS.PENDING) {
        accumulator.pendingCount += 1;
      }

      if (recipient.status === EMAIL_RECIPIENT_STATUS.SENT) {
        accumulator.sentCount += 1;
      }

      if (recipient.status === EMAIL_RECIPIENT_STATUS.FAILED) {
        accumulator.failedCount += 1;
      }

      if (recipient.status === EMAIL_RECIPIENT_STATUS.SKIPPED) {
        accumulator.skippedCount += 1;
      }

      return accumulator;
    },
    {
      pendingCount: 0,
      sentCount: 0,
      failedCount: 0,
      skippedCount: 0,
      totalRecipients: 0,
    },
  );
}

export function validateEmailCampaignFormData(
  formData: FormData,
): EmailCampaignValidationResult {
  const templateId = readOptionalString(formData, "templateId");
  const subject = readRequiredString(formData, "subject");
  const body = readRequiredString(formData, "body");
  const audienceType = readRequiredString(formData, "audienceType");
  const errors: Record<string, string> = {};

  if (templateId && !isUuid(templateId)) {
    errors.templateId = "Seleziona un template valido.";
  }

  if (!subject) {
    errors.subject = "Inserisci l'oggetto campagna.";
  }

  if (!body) {
    errors.body = "Inserisci il corpo campagna.";
  }

  if (!isEmailCampaignAudienceType(audienceType)) {
    errors.audienceType = "Seleziona un segmento valido.";
  }

  if (
    Object.keys(errors).length > 0 ||
    !isEmailCampaignAudienceType(audienceType)
  ) {
    return {
      ok: false,
      errors,
      message: "Controlla i dati della campagna.",
    };
  }

  return {
    ok: true,
    values: {
      templateId,
      subject,
      body,
      audienceType,
    },
  };
}

export async function getEmailCampaigns() {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("email_campaigns")
    .select(emailCampaignSelect)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .returns<EmailCampaignRow[]>();

  if (error) {
    throw new Error("Impossibile caricare le campagne email.");
  }

  const campaigns = data.map(mapEmailCampaign);
  const recipients = await getRecipientsForCampaigns(
    campaigns.map((campaign) => campaign.id),
  );

  return campaigns.map<EmailCampaignListItem>((campaign) => {
    const counts = countRecipientsByStatus(recipients.get(campaign.id) ?? []);

    return {
      ...campaign,
      ...counts,
    };
  });
}

export async function getEmailCampaignById(campaignId: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("email_campaigns")
    .select(emailCampaignSelect)
    .eq("id", campaignId)
    .is("archived_at", null)
    .maybeSingle<EmailCampaignRow>();

  if (error) {
    throw new Error("Impossibile caricare la campagna email.");
  }

  return data ? mapEmailCampaign(data) : null;
}

export async function createEmailCampaignDraft(
  values: EmailCampaignFormValues,
  adminId: string,
) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("email_campaigns")
    .insert({
      ...mapCampaignValues(values),
      provider: "resend",
      status: EMAIL_CAMPAIGN_STATUS.DRAFT,
      created_by: adminId,
    })
    .select(emailCampaignSelect)
    .single<EmailCampaignRow>();

  if (error) {
    throw new Error("Impossibile creare la campagna email.");
  }

  return mapEmailCampaign(data);
}

export async function updateEmailCampaignDraft(
  campaignId: string,
  values: EmailCampaignFormValues,
) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("email_campaigns")
    .update(mapCampaignValues(values))
    .eq("id", campaignId)
    .eq("status", EMAIL_CAMPAIGN_STATUS.DRAFT)
    .is("archived_at", null)
    .select(emailCampaignSelect)
    .single<EmailCampaignRow>();

  if (error) {
    throw new Error("Impossibile aggiornare la campagna email in bozza.");
  }

  return mapEmailCampaign(data);
}

export async function archiveEmailCampaign(campaignId: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { error } = await supabase
    .from("email_campaigns")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", campaignId)
    .is("archived_at", null);

  if (error) {
    throw new Error("Impossibile archiviare la campagna email.");
  }
}

export async function generateCampaignRecipientsSnapshot(
  campaignId: string,
  customRecipientsRaw: string | null,
  consentBasisSnapshot: string | null,
): Promise<CampaignRecipientGenerationResult> {
  const campaign = await getDraftCampaignOrThrow(campaignId);
  const existingRecipients = await getCampaignRecipients(campaignId);

  if (existingRecipients.length > 0) {
    throw new Error("Lo snapshot destinatari e' gia' stato generato.");
  }

  if (
    campaign.audienceType === EMAIL_CAMPAIGN_AUDIENCE_TYPE.CUSTOM &&
    !customRecipientsRaw?.trim()
  ) {
    throw new Error("Inserisci almeno un destinatario manuale.");
  }

  const result = await buildSegmentRecipients(
    campaign.audienceType,
    customRecipientsRaw,
  );

  const insertedCount = await insertCampaignRecipients(
    campaignId,
    result.recipients,
    consentBasisSnapshot,
  );

  const supabase = await getSupabaseServerClientOrThrow();
  const { error } = await supabase
    .from("email_campaigns")
    .update({ recipient_snapshot_generated_at: new Date().toISOString() })
    .eq("id", campaignId)
    .eq("status", EMAIL_CAMPAIGN_STATUS.DRAFT)
    .is("archived_at", null);

  if (error) {
    throw new Error("Impossibile aggiornare lo snapshot destinatari.");
  }

  return {
    insertedCount,
    skippedCount: result.skippedCount,
    duplicateCount: result.duplicateCount,
    optOutCount: result.optOutCount,
  };
}

export async function previewCampaignSegment(campaign: EmailCampaign) {
  if (campaign.audienceType === EMAIL_CAMPAIGN_AUDIENCE_TYPE.CUSTOM) {
    return {
      recipients: [],
      skippedCount: 0,
      duplicateCount: 0,
      optOutCount: 0,
    };
  }

  return buildSegmentRecipients(campaign.audienceType);
}

export async function sendEmailCampaign(
  campaignId: string,
  adminId: string,
  confirmed: boolean,
): Promise<CampaignSendResult> {
  if (!confirmed) {
    throw new Error("Conferma l'invio prima di procedere.");
  }

  const campaign = await getDraftCampaignOrThrow(campaignId);
  const pendingRecipients = await getPendingCampaignRecipients(campaignId);

  if (pendingRecipients.length === 0) {
    await markCampaignFailed(campaignId, "Nessun destinatario pending.");
    throw new Error("Nessun destinatario pending da inviare.");
  }

  await assertProviderOrFailCampaign(campaignId);

  let sentCount = 0;
  let failedCount = 0;
  const skippedCount = 0;

  for (const recipient of pendingRecipients) {
    try {
      const subject = renderEmailText(campaign.subject, {
        campaignSubject: campaign.subject,
        recipientName: recipient.recipientName,
      });
      const html = renderEmailHtml(campaign.body, {
        campaignSubject: campaign.subject,
        recipientName: recipient.recipientName,
      });
      const providerMessageId = await sendEmailWithProvider({
        to: recipient.email,
        subject,
        html,
        idempotencyKey: `pontenext-campaign-${campaign.id}-recipient-${recipient.id}`,
      });

      await updateRecipientAfterSend(recipient.id, {
        status: EMAIL_RECIPIENT_STATUS.SENT,
        provider_message_id: providerMessageId,
        sent_at: new Date().toISOString(),
        error_message: null,
      });
      sentCount += 1;
    } catch (error) {
      await updateRecipientAfterSend(recipient.id, {
        status: EMAIL_RECIPIENT_STATUS.FAILED,
        error_message:
          error instanceof Error ? error.message : "Invio destinatario fallito.",
      });
      failedCount += 1;
    }
  }

  const supabase = await getSupabaseServerClientOrThrow();
  const now = new Date().toISOString();
  const campaignStatus =
    sentCount > 0 ? EMAIL_CAMPAIGN_STATUS.SENT : EMAIL_CAMPAIGN_STATUS.FAILED;
  const { error } = await supabase
    .from("email_campaigns")
    .update({
      status: campaignStatus,
      send_confirmed_at: now,
      sent_at: campaignStatus === EMAIL_CAMPAIGN_STATUS.SENT ? now : null,
      failed_at: campaignStatus === EMAIL_CAMPAIGN_STATUS.FAILED ? now : null,
      error_message:
        campaignStatus === EMAIL_CAMPAIGN_STATUS.FAILED
          ? "Tutti i destinatari sono falliti."
          : null,
      sent_by: adminId,
    })
    .eq("id", campaignId)
    .eq("status", EMAIL_CAMPAIGN_STATUS.DRAFT)
    .is("archived_at", null);

  if (error) {
    throw new Error("Impossibile aggiornare lo stato campagna.");
  }

  return {
    sentCount,
    failedCount,
    skippedCount,
  };
}

async function assertProviderOrFailCampaign(campaignId: string) {
  try {
    assertEmailProviderConfigured();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Provider email non configurato.";
    await markCampaignFailed(campaignId, message);
    throw new Error(message);
  }
}

async function getDraftCampaignOrThrow(campaignId: string) {
  const campaign = await getEmailCampaignById(campaignId);

  if (!campaign) {
    throw new Error("Campagna email non trovata.");
  }

  if (campaign.status !== EMAIL_CAMPAIGN_STATUS.DRAFT) {
    throw new Error("Solo le campagne in bozza possono essere modificate o inviate.");
  }

  return campaign;
}

async function getRecipientsForCampaigns(campaignIds: string[]) {
  const recipientsByCampaign = new Map<string, EmailRecipient[]>();

  if (campaignIds.length === 0) {
    return recipientsByCampaign;
  }

  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("email_campaign_recipients")
    .select(getEmailRecipientSelect())
    .in("campaign_id", campaignIds)
    .returns<EmailRecipientRow[]>();

  if (error) {
    throw new Error("Impossibile calcolare i destinatari campagna.");
  }

  for (const row of data) {
    const recipient = mapEmailRecipientRow(row);
    const current = recipientsByCampaign.get(recipient.campaignId) ?? [];
    current.push(recipient);
    recipientsByCampaign.set(recipient.campaignId, current);
  }

  return recipientsByCampaign;
}

async function updateRecipientAfterSend(
  recipientId: string,
  values: {
    status: "sent" | "failed";
    provider_message_id?: string | null;
    sent_at?: string;
    error_message?: string | null;
  },
) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { error } = await supabase
    .from("email_campaign_recipients")
    .update(values)
    .eq("id", recipientId)
    .eq("status", EMAIL_RECIPIENT_STATUS.PENDING);

  if (error) {
    throw new Error("Impossibile aggiornare il destinatario campagna.");
  }
}

async function markCampaignFailed(campaignId: string, message: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { error } = await supabase
    .from("email_campaigns")
    .update({
      status: EMAIL_CAMPAIGN_STATUS.FAILED,
      failed_at: new Date().toISOString(),
      error_message: message,
    })
    .eq("id", campaignId)
    .eq("status", EMAIL_CAMPAIGN_STATUS.DRAFT)
    .is("archived_at", null);

  if (error) {
    throw new Error("Impossibile marcare la campagna come fallita.");
  }
}
