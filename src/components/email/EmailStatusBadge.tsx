import { Badge } from "@/components/ui/Badge";
import {
  EMAIL_CAMPAIGN_STATUS,
  EMAIL_RECIPIENT_STATUS,
  type EmailCampaignStatus,
  type EmailRecipientStatus,
} from "@/types/email";

type EmailStatusBadgeProps = {
  status: EmailCampaignStatus | EmailRecipientStatus;
};

const labels: Record<EmailCampaignStatus | EmailRecipientStatus, string> = {
  [EMAIL_CAMPAIGN_STATUS.DRAFT]: "Bozza",
  [EMAIL_CAMPAIGN_STATUS.SENT]: "Inviata",
  [EMAIL_CAMPAIGN_STATUS.FAILED]: "Fallita",
  [EMAIL_RECIPIENT_STATUS.PENDING]: "In attesa",
  [EMAIL_RECIPIENT_STATUS.SKIPPED]: "Escluso",
};

export function EmailStatusBadge({ status }: EmailStatusBadgeProps) {
  if (status === "sent") {
    return <Badge variant="success">{labels[status]}</Badge>;
  }

  if (status === "failed") {
    return <Badge variant="warning">{labels[status]}</Badge>;
  }

  if (status === "draft" || status === "pending") {
    return <Badge variant="secondary">{labels[status]}</Badge>;
  }

  return <Badge variant="muted">{labels[status]}</Badge>;
}
