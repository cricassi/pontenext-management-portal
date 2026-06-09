import Link from "next/link";
import { Archive } from "lucide-react";
import { archiveEmailCampaignAction } from "@/app/(admin)/email/actions";
import { EmailStatusBadge } from "@/components/email/EmailStatusBadge";
import { Button } from "@/components/ui/Button";
import type { EmailCampaignListItem } from "@/types/email";

type EmailCampaignCardListProps = {
  campaigns: EmailCampaignListItem[];
};

function audienceLabel(audienceType: EmailCampaignListItem["audienceType"]) {
  const labels = {
    all_members: "Tutti i soci",
    active_members: "Soci attivi",
    expired_members: "Soci scaduti",
    sponsors: "Sponsor",
    custom: "Custom/manuale",
  };

  return labels[audienceType];
}

export function EmailCampaignCardList({
  campaigns,
}: EmailCampaignCardListProps) {
  if (campaigns.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 md:hidden">
      {campaigns.map((campaign) => (
        <article key={campaign.id} className="rounded-lg border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="line-clamp-2 text-base font-semibold tracking-normal">
                {campaign.subject}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {audienceLabel(campaign.audienceType)}
              </p>
            </div>
            <EmailStatusBadge status={campaign.status} />
          </div>

          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Destinatari</dt>
              <dd className="text-right">{campaign.totalRecipients}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Inviate</dt>
              <dd className="text-right">{campaign.sentCount}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Fallite</dt>
              <dd className="text-right">{campaign.failedCount}</dd>
            </div>
          </dl>

          <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
            <Button asChild variant="outline">
              <Link href={`/email/campaigns?campaign=${campaign.id}`}>
                Apri
              </Link>
            </Button>
            <form action={archiveEmailCampaignAction.bind(null, campaign.id)}>
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                aria-label={`Archivia ${campaign.subject}`}
              >
                <Archive aria-hidden="true" className="size-4" />
              </Button>
            </form>
          </div>
        </article>
      ))}
    </div>
  );
}
