import { Badge } from "@/components/ui/Badge";
import {
  SPONSOR_CONTRIBUTION_TYPE,
  type SponsorContributionType,
} from "@/types/sponsor";

type SponsorContributionTypeBadgeProps = {
  type: SponsorContributionType;
};

const labels: Record<SponsorContributionType, string> = {
  [SPONSOR_CONTRIBUTION_TYPE.MONEY]: "Monetario",
  [SPONSOR_CONTRIBUTION_TYPE.GOODS]: "Beni",
  [SPONSOR_CONTRIBUTION_TYPE.SERVICE]: "Servizi",
  [SPONSOR_CONTRIBUTION_TYPE.OTHER]: "Altro",
};

export function SponsorContributionTypeBadge({
  type,
}: SponsorContributionTypeBadgeProps) {
  const variant =
    type === SPONSOR_CONTRIBUTION_TYPE.MONEY ? "success" : "secondary";

  return <Badge variant={variant}>{labels[type]}</Badge>;
}
