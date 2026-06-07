export const EMAIL_TEMPLATE_AUDIENCE = {
  MEMBERS: "members",
  SPONSORS: "sponsors",
  BOTH: "both",
} as const;

export const EMAIL_CAMPAIGN_AUDIENCE_TYPE = {
  ALL_MEMBERS: "all_members",
  ACTIVE_MEMBERS: "active_members",
  EXPIRED_MEMBERS: "expired_members",
  SPONSORS: "sponsors",
  CUSTOM: "custom",
} as const;

export const EMAIL_CAMPAIGN_STATUS = {
  DRAFT: "draft",
  SENT: "sent",
  FAILED: "failed",
} as const;

export const EMAIL_RECIPIENT_TYPE = {
  MEMBER: "member",
  SPONSOR: "sponsor",
  CUSTOM: "custom",
} as const;

export const EMAIL_RECIPIENT_STATUS = {
  PENDING: "pending",
  SENT: "sent",
  FAILED: "failed",
  SKIPPED: "skipped",
} as const;

export type EmailTemplateAudience =
  (typeof EMAIL_TEMPLATE_AUDIENCE)[keyof typeof EMAIL_TEMPLATE_AUDIENCE];

export type EmailCampaignAudienceType =
  (typeof EMAIL_CAMPAIGN_AUDIENCE_TYPE)[keyof typeof EMAIL_CAMPAIGN_AUDIENCE_TYPE];

export type EmailCampaignStatus =
  (typeof EMAIL_CAMPAIGN_STATUS)[keyof typeof EMAIL_CAMPAIGN_STATUS];

export type EmailRecipientType =
  (typeof EMAIL_RECIPIENT_TYPE)[keyof typeof EMAIL_RECIPIENT_TYPE];

export type EmailRecipientStatus =
  (typeof EMAIL_RECIPIENT_STATUS)[keyof typeof EMAIL_RECIPIENT_STATUS];

export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  audience: EmailTemplateAudience;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type EmailTemplateFormValues = {
  name: string;
  subject: string;
  body: string;
  audience: EmailTemplateAudience;
  isActive: boolean;
};

export type EmailCampaign = {
  id: string;
  templateId: string | null;
  templateName: string | null;
  subject: string;
  body: string;
  audienceType: EmailCampaignAudienceType;
  status: EmailCampaignStatus;
  provider: "resend";
  recipientSnapshotGeneratedAt: string | null;
  sendConfirmedAt: string | null;
  sentAt: string | null;
  failedAt: string | null;
  errorMessage: string | null;
  createdBy: string | null;
  sentBy: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type EmailCampaignFormValues = {
  templateId: string | null;
  subject: string;
  body: string;
  audienceType: EmailCampaignAudienceType;
};

export type EmailCampaignListItem = EmailCampaign & {
  pendingCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  totalRecipients: number;
};

export type EmailRecipient = {
  id: string;
  campaignId: string;
  recipientType: EmailRecipientType;
  memberId: string | null;
  sponsorId: string | null;
  email: string;
  recipientName: string | null;
  status: EmailRecipientStatus;
  skipReason: string | null;
  providerMessageId: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  optOutTokenHash: string | null;
  optedOutAt: string | null;
  consentBasisSnapshot: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EmailSegmentRecipient = {
  recipientType: EmailRecipientType;
  memberId: string | null;
  sponsorId: string | null;
  email: string;
  recipientName: string | null;
};

export type EmailProviderStatus = {
  provider: "resend";
  isConfigured: boolean;
  hasApiKey: boolean;
  hasFromAddress: boolean;
  fromAddress: string | null;
};

export type CampaignRecipientGenerationResult = {
  insertedCount: number;
  skippedCount: number;
  duplicateCount: number;
  optOutCount: number;
};

export type CampaignSendResult = {
  sentCount: number;
  failedCount: number;
  skippedCount: number;
};
