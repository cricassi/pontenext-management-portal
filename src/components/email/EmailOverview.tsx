import Link from "next/link";
import { FileText, MailPlus, Send } from "lucide-react";
import { EmailProviderStatus } from "@/components/email/EmailProviderStatus";
import { EmailStatusBadge } from "@/components/email/EmailStatusBadge";
import { Button } from "@/components/ui/Button";
import type {
  EmailCampaignListItem,
  EmailProviderStatus as EmailProviderStatusType,
  EmailTemplate,
} from "@/types/email";

type EmailOverviewProps = {
  providerStatus: EmailProviderStatusType;
  templates: EmailTemplate[];
  campaigns: EmailCampaignListItem[];
};

export function EmailOverview({
  providerStatus,
  templates,
  campaigns,
}: EmailOverviewProps) {
  const activeTemplates = templates.filter((template) => template.isActive);
  const recentCampaigns = campaigns.slice(0, 5);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <EmailProviderStatus status={providerStatus} />

      <div className="rounded-lg border bg-card p-4">
        <h2 className="text-base font-semibold tracking-normal">Azioni</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Button asChild>
            <Link href="/email/campaigns">
              <MailPlus aria-hidden="true" className="mr-2 size-4" />
              Nuova campagna
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/email/templates">
              <FileText aria-hidden="true" className="mr-2 size-4" />
              Template
            </Link>
          </Button>
        </div>
      </div>

      <section className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold tracking-normal">
            Template attivi
          </h2>
          <Button asChild variant="link">
            <Link href="/email/templates">Apri</Link>
          </Button>
        </div>
        <p className="mt-2 text-3xl font-semibold tracking-normal">
          {activeTemplates.length}
        </p>
        <p className="text-sm text-muted-foreground">
          {templates.length} template totali
        </p>
      </section>

      <section className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold tracking-normal">
            Campagne recenti
          </h2>
          <Button asChild variant="link">
            <Link href="/email/campaigns">Apri</Link>
          </Button>
        </div>

        {recentCampaigns.length > 0 ? (
          <ul className="mt-4 divide-y">
            {recentCampaigns.map((campaign) => (
              <li key={campaign.id} className="flex items-center gap-3 py-3">
                <Send aria-hidden="true" className="size-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/email/campaigns?campaign=${campaign.id}`}
                    className="truncate text-sm font-medium hover:underline"
                  >
                    {campaign.subject}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {campaign.totalRecipients} destinatari
                  </p>
                </div>
                <EmailStatusBadge status={campaign.status} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Nessuna campagna creata.
          </p>
        )}
      </section>
    </div>
  );
}
