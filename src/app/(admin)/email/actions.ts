"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveAdmin } from "@/services/admin-auth.service";
import {
  archiveEmailCampaign,
  createEmailCampaignDraft,
  generateCampaignRecipientsSnapshot,
  sendEmailCampaign,
  updateEmailCampaignDraft,
  validateEmailCampaignFormData,
} from "@/services/email-campaigns.service";
import {
  archiveEmailTemplate,
  createEmailTemplate,
  updateEmailTemplate,
  validateEmailTemplateFormData,
} from "@/services/email-templates.service";
import type { FormState } from "@/types/form";
import { readOptionalString } from "@/utils/form";

function revalidateEmailPaths() {
  revalidatePath("/email");
  revalidatePath("/email/templates");
  revalidatePath("/email/campaigns");
}

export async function createEmailTemplateAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const { admin } = await requireActiveAdmin();
  const validation = validateEmailTemplateFormData(formData);

  if (!validation.ok) {
    return {
      message: validation.message,
      errors: validation.errors,
    };
  }

  try {
    await createEmailTemplate(validation.values, admin.id);
  } catch (error) {
    return {
      message:
        error instanceof Error ? error.message : "Errore salvataggio template.",
      errors: {},
    };
  }

  revalidateEmailPaths();
  redirect("/email/templates");
}

export async function updateEmailTemplateAction(
  templateId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireActiveAdmin();
  const validation = validateEmailTemplateFormData(formData);

  if (!validation.ok) {
    return {
      message: validation.message,
      errors: validation.errors,
    };
  }

  try {
    await updateEmailTemplate(templateId, validation.values);
  } catch (error) {
    return {
      message:
        error instanceof Error ? error.message : "Errore salvataggio template.",
      errors: {},
    };
  }

  revalidateEmailPaths();
  redirect("/email/templates");
}

export async function archiveEmailTemplateAction(templateId: string) {
  await requireActiveAdmin();
  await archiveEmailTemplate(templateId);
  revalidateEmailPaths();
}

export async function createEmailCampaignAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const { admin } = await requireActiveAdmin();
  const validation = validateEmailCampaignFormData(formData);

  if (!validation.ok) {
    return {
      message: validation.message,
      errors: validation.errors,
    };
  }

  let campaignId = "";

  try {
    const campaign = await createEmailCampaignDraft(validation.values, admin.id);
    campaignId = campaign.id;
  } catch (error) {
    return {
      message:
        error instanceof Error ? error.message : "Errore salvataggio campagna.",
      errors: {},
    };
  }

  revalidateEmailPaths();
  redirect(`/email/campaigns?campaign=${campaignId}`);
}

export async function updateEmailCampaignAction(
  campaignId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireActiveAdmin();
  const validation = validateEmailCampaignFormData(formData);

  if (!validation.ok) {
    return {
      message: validation.message,
      errors: validation.errors,
    };
  }

  try {
    await updateEmailCampaignDraft(campaignId, validation.values);
  } catch (error) {
    return {
      message:
        error instanceof Error ? error.message : "Errore salvataggio campagna.",
      errors: {},
    };
  }

  revalidateEmailPaths();
  redirect(`/email/campaigns?campaign=${campaignId}`);
}

export async function archiveEmailCampaignAction(campaignId: string) {
  await requireActiveAdmin();
  await archiveEmailCampaign(campaignId);
  revalidateEmailPaths();
  redirect("/email/campaigns");
}

export async function generateCampaignRecipientsAction(
  campaignId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireActiveAdmin();
  const customRecipients = readOptionalString(formData, "customRecipients");
  const consentBasisSnapshot = readOptionalString(
    formData,
    "consentBasisSnapshot",
  );

  try {
    const result = await generateCampaignRecipientsSnapshot(
      campaignId,
      customRecipients,
      consentBasisSnapshot,
    );

    revalidateEmailPaths();

    return {
      message: `Snapshot generato: ${result.insertedCount} destinatari, ${result.skippedCount} esclusi.`,
      errors: {},
    };
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "Errore generazione destinatari.",
      errors: {},
    };
  }
}

export async function sendEmailCampaignAction(
  campaignId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const { admin } = await requireActiveAdmin();
  const confirmed = formData.get("confirmSend") === "on";

  try {
    const result = await sendEmailCampaign(campaignId, admin.id, confirmed);
    revalidateEmailPaths();

    return {
      message: `Invio completato: ${result.sentCount} inviate, ${result.failedCount} fallite.`,
      errors: {},
    };
  } catch (error) {
    revalidateEmailPaths();

    return {
      message:
        error instanceof Error ? error.message : "Errore invio campagna.",
      errors: {},
    };
  }
}
