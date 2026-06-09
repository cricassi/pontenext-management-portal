import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmailCampaignCardList } from "@/components/email/EmailCampaignCardList";
import { EmailCampaignDetail } from "@/components/email/EmailCampaignDetail";
import { EmailCampaignForm } from "@/components/email/EmailCampaignForm";
import { EmailCampaignTable } from "@/components/email/EmailCampaignTable";
import { Button } from "@/components/ui/Button";
import {
  createEmailCampaignAction,
  generateCampaignRecipientsAction,
  sendEmailCampaignAction,
  updateEmailCampaignAction,
} from "@/app/(admin)/email/actions";
import { requireActiveAdmin } from "@/services/admin-auth.service";
import {
  getEmailCampaignById,
  getEmailCampaigns,
  previewCampaignSegment,
} from "@/services/email-campaigns.service";
import { getCampaignRecipients } from "@/services/email-recipients.service";
import { getEmailProviderStatus } from "@/services/email-provider.service";
import {
  getActiveEmailTemplates,
  getEmailTemplateById,
} from "@/services/email-templates.service";
import { EMAIL_CAMPAIGN_STATUS } from "@/types/email";
import { isUuid } from "@/utils/id";

export const dynamic = "force-dynamic";

type EmailCampaignsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function EmailCampaignsPage({
  searchParams,
}: EmailCampaignsPageProps) {
  await requireActiveAdmin();
  const params = (await searchParams) ?? {};
  const campaignId = readSearchParam(params, "campaign");
  const templateId = readSearchParam(params, "template");
  const [campaigns, templates, selectedCampaign, selectedTemplate] =
    await Promise.all([
      getEmailCampaigns(),
      getActiveEmailTemplates(),
      campaignId && isUuid(campaignId) ? getEmailCampaignById(campaignId) : null,
      templateId && isUuid(templateId) ? getEmailTemplateById(templateId) : null,
    ]);
  const recipients = selectedCampaign
    ? await getCampaignRecipients(selectedCampaign.id)
    : [];
  const providerStatus = getEmailProviderStatus();
  const segmentPreview =
    selectedCampaign &&
    selectedCampaign.status === EMAIL_CAMPAIGN_STATUS.DRAFT &&
    recipients.length === 0
      ? await previewCampaignSegment(selectedCampaign)
      : null;
  const formAction =
    selectedCampaign?.status === EMAIL_CAMPAIGN_STATUS.DRAFT
      ? updateEmailCampaignAction.bind(null, selectedCampaign.id)
      : createEmailCampaignAction;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Campagne email"
        description="Bozze, snapshot destinatari, anteprima e invio con conferma admin."
        action={
          selectedCampaign ? (
            <Button asChild>
              <Link href="/email/campaigns">Nuova bozza</Link>
            </Button>
          ) : null
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px]">
        <div className="flex flex-col gap-4">
          <EmailCampaignTable campaigns={campaigns} />
          <EmailCampaignCardList campaigns={campaigns} />

          {selectedCampaign ? (
            <EmailCampaignDetail
              campaign={selectedCampaign}
              recipients={recipients}
              providerStatus={providerStatus}
              segmentPreview={segmentPreview}
              generateAction={generateCampaignRecipientsAction.bind(
                null,
                selectedCampaign.id,
              )}
              sendAction={sendEmailCampaignAction.bind(
                null,
                selectedCampaign.id,
              )}
            />
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          {selectedCampaign?.status === EMAIL_CAMPAIGN_STATUS.DRAFT ||
          !selectedCampaign ? (
            <EmailCampaignForm
              campaign={selectedCampaign}
              selectedTemplate={selectedTemplate}
              templates={templates}
              action={formAction}
              submitLabel={
                selectedCampaign ? "Aggiorna bozza" : "Crea bozza"
              }
            />
          ) : (
            <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
              Le campagne inviate o fallite restano storiche e non sono
              modificabili. Crea una nuova bozza per un nuovo invio.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
