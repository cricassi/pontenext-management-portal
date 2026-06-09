import type { EmailCampaignAudienceType, EmailCampaignStatus } from "@/types/email";
import type { EventStatus } from "@/types/event";
import type { MemberStatus } from "@/types/member";
import type { MembershipStatus } from "@/types/membership";
import type { PaymentMethod, PaymentStatus } from "@/types/payment";
import type { SponsorContributionType, SponsorStatus } from "@/types/sponsor";

export const REPORT_TYPE = {
  MEMBERS: "members",
  MEMBERSHIPS: "memberships",
  PAYMENTS: "payments",
  EXPIRATIONS: "expirations",
  SPONSORS: "sponsors",
  SPONSOR_CONTRIBUTIONS: "sponsor_contributions",
  EVENTS: "events",
  EMAIL_CAMPAIGNS: "email_campaigns",
} as const;

export const REPORT_EXPORT_FORMAT = {
  CSV: "csv",
  XLSX: "xlsx",
} as const;

export const REPORT_EXPIRATION_WINDOW = {
  EXPIRED: "expired",
  WITHIN_30: "30",
  WITHIN_60: "60",
  WITHIN_90: "90",
  CUSTOM: "custom",
} as const;

export type ReportType = (typeof REPORT_TYPE)[keyof typeof REPORT_TYPE];

export type ReportExportFormat =
  (typeof REPORT_EXPORT_FORMAT)[keyof typeof REPORT_EXPORT_FORMAT];

export type ReportExpirationWindow =
  (typeof REPORT_EXPIRATION_WINDOW)[keyof typeof REPORT_EXPIRATION_WINDOW];

export type ReportColumn = {
  key: string;
  label: string;
  align?: "left" | "right";
};

export type ReportCellValue = string | number | null;

export type ReportRow = Record<string, ReportCellValue>;

export type ReportFilterOption = {
  value: string;
  label: string;
};

export type ReportFilterConfig = {
  queryLabel?: string;
  dateFromLabel?: string;
  dateToLabel?: string;
  statusLabel?: string;
  statusOptions?: ReportFilterOption[];
  membershipStatusOptions?: ReportFilterOption[];
  paymentStatusOptions?: ReportFilterOption[];
  paymentMethodOptions?: ReportFilterOption[];
  contributionTypeOptions?: ReportFilterOption[];
  audienceTypeOptions?: ReportFilterOption[];
  expirationWindowOptions?: ReportFilterOption[];
};

export type ReportDefinition = {
  type: ReportType;
  label: string;
  description: string;
  dateFieldLabel?: string;
  columns: ReportColumn[];
  filters: ReportFilterConfig;
};

export type ReportFilters = {
  reportType: ReportType;
  query?: string;
  status?:
    | MemberStatus
    | MembershipStatus
    | SponsorStatus
    | EventStatus
    | EmailCampaignStatus
    | "all";
  membershipStatus?: MembershipStatus | "without_membership" | "all";
  paymentStatus?: PaymentStatus | "all";
  paymentMethod?: PaymentMethod | "all";
  contributionType?: SponsorContributionType | "all";
  audienceType?: EmailCampaignAudienceType | "all";
  expirationWindow?: ReportExpirationWindow;
  dateFrom?: string;
  dateTo?: string;
  includeArchived: boolean;
};

export type ReportResult = {
  definition: ReportDefinition;
  filters: ReportFilters;
  rows: ReportRow[];
  generatedAt: string;
};

export type ReportPreview = ReportResult & {
  previewRows: ReportRow[];
  totalRows: number;
  previewLimit: number;
};

export type ReportExportRequest = {
  filters: ReportFilters;
  format: ReportExportFormat;
};
