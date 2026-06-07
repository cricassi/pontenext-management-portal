export const SPONSOR_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  ARCHIVED: "archived",
} as const;

export const SPONSOR_CONTRIBUTION_TYPE = {
  MONEY: "money",
  GOODS: "goods",
  SERVICE: "service",
  OTHER: "other",
} as const;

export type SponsorStatus =
  (typeof SPONSOR_STATUS)[keyof typeof SPONSOR_STATUS];

export type SponsorContributionType =
  (typeof SPONSOR_CONTRIBUTION_TYPE)[keyof typeof SPONSOR_CONTRIBUTION_TYPE];

export type Sponsor = {
  id: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  vatNumber: string | null;
  fiscalCode: string | null;
  notes: string | null;
  status: SponsorStatus;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type SponsorFormValues = {
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  vatNumber: string | null;
  fiscalCode: string | null;
  notes: string | null;
  status: SponsorStatus;
};

export type SponsorListItem = Sponsor & {
  contributionCount: number;
  totalMoneyAmount: number;
  latestContributionDate: string | null;
};

export type SponsorFilters = {
  query?: string;
  status?: SponsorStatus | "all";
};

export type SponsorContribution = {
  id: string;
  sponsorId: string;
  eventId: string | null;
  eventName: string | null;
  eventStartDatetime: string | null;
  contributionDate: string;
  amount: number;
  contributionType: SponsorContributionType;
  description: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type SponsorContributionFormValues = {
  contributionDate: string;
  eventId: string | null;
  amount: number;
  contributionType: SponsorContributionType;
  description: string | null;
  notes: string | null;
};
