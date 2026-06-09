import Link from "next/link";
import { Archive } from "lucide-react";
import { archiveEmailCampaignAction } from "@/app/(admin)/email/actions";
import { EmailStatusBadge } from "@/components/email/EmailStatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { EmailCampaignListItem } from "@/types/email";
import { formatDateTime } from "@/utils/date";

type EmailCampaignTableProps = {
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

export function EmailCampaignTable({ campaigns }: EmailCampaignTableProps) {
  if (campaigns.length === 0) {
    return (
      <EmptyState
        title="Nessuna campagna email"
        description="Crea una bozza per preparare destinatari, anteprima e invio confermato."
      />
    );
  }

  return (
    <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Campagna</th>
            <th className="px-4 py-3 font-medium">Segmento</th>
            <th className="px-4 py-3 font-medium">Destinatari</th>
            <th className="px-4 py-3 font-medium">Stato</th>
            <th className="px-4 py-3 font-medium">Creata</th>
            <th className="px-4 py-3 text-right font-medium">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((campaign) => (
            <tr key={campaign.id} className="border-b last:border-b-0">
              <td className="px-4 py-3">
                <Link
                  href={`/email/campaigns?campaign=${campaign.id}`}
                  className="font-medium hover:underline"
                >
                  {campaign.subject}
                </Link>
                {campaign.templateName ? (
                  <p className="text-xs text-muted-foreground">
                    Template: {campaign.templateName}
                  </p>
                ) : null}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {audienceLabel(campaign.audienceType)}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {campaign.totalRecipients} totali
              </td>
              <td className="px-4 py-3">
                <EmailStatusBadge status={campaign.status} />
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatDateTime(campaign.createdAt)}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/email/campaigns?campaign=${campaign.id}`}>
                      Apri
                    </Link>
                  </Button>
                  <form
                    action={archiveEmailCampaignAction.bind(null, campaign.id)}
                  >
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
