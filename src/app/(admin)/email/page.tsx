import { PageHeader } from "@/components/layout/PageHeader";
import { EmailOverview } from "@/components/email/EmailOverview";
import { requireActiveAdmin } from "@/services/admin-auth.service";
import { getEmailCampaigns } from "@/services/email-campaigns.service";
import { getEmailProviderStatus } from "@/services/email-provider.service";
import { getEmailTemplates } from "@/services/email-templates.service";

export const dynamic = "force-dynamic";

export default async function EmailPage() {
  await requireActiveAdmin();
  const [templates, campaigns] = await Promise.all([
    getEmailTemplates(),
    getEmailCampaigns(),
  ]);
  const providerStatus = getEmailProviderStatus();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Email"
        description="Template, campagne e invii confermati tramite Resend."
      />

      <EmailOverview
        providerStatus={providerStatus}
        templates={templates}
        campaigns={campaigns}
      />
    </div>
  );
}
