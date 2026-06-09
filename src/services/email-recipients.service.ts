import { getSupabaseServerClientOrThrow } from "@/services/supabase.service";
import {
  EMAIL_CAMPAIGN_AUDIENCE_TYPE,
  EMAIL_RECIPIENT_TYPE,
  type EmailCampaignAudienceType,
  type EmailRecipient,
  type EmailRecipientStatus,
  type EmailRecipientType,
  type EmailSegmentRecipient,
} from "@/types/email";
import {
  isValidEmail,
  normalizeEmail,
  parseManualRecipients,
} from "@/utils/email";

type Relation<T> = T | T[] | null;

type MemberRecipientRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
};

type MemberRecipientWithArchive = MemberRecipientRow & {
  archived_at: string | null;
};

type MembershipRecipientRow = {
  member_id: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  members: Relation<MemberRecipientWithArchive>;
};

type SponsorRecipientRow = {
  id: string;
  company_name: string;
  email: string | null;
};

type EmailRecipientRow = {
  id: string;
  campaign_id: string;
  recipient_type: EmailRecipientType;
  member_id: string | null;
  sponsor_id: string | null;
  email: string;
  recipient_name: string | null;
  status: EmailRecipientStatus;
  skip_reason: string | null;
  provider_message_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  opt_out_token_hash: string | null;
  opted_out_at: string | null;
  consent_basis_snapshot: string | null;
  created_at: string;
  updated_at: string;
};

export type RecipientBuildResult = {
  recipients: EmailSegmentRecipient[];
  skippedCount: number;
  duplicateCount: number;
  optOutCount: number;
};

const emailRecipientSelect =
  "id, campaign_id, recipient_type, member_id, sponsor_id, email, recipient_name, status, skip_reason, provider_message_id, error_message, sent_at, opt_out_token_hash, opted_out_at, consent_basis_snapshot, created_at, updated_at";

function one<T>(relation: Relation<T>) {
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

function mapEmailRecipient(row: EmailRecipientRow): EmailRecipient {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    recipientType: row.recipient_type,
    memberId: row.member_id,
    sponsorId: row.sponsor_id,
    email: row.email,
    recipientName: row.recipient_name,
    status: row.status,
    skipReason: row.skip_reason,
    providerMessageId: row.provider_message_id,
    errorMessage: row.error_message,
    sentAt: row.sent_at,
    optOutTokenHash: row.opt_out_token_hash,
    optedOutAt: row.opted_out_at,
    consentBasisSnapshot: row.consent_basis_snapshot,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toMemberRecipient(row: MemberRecipientRow): EmailSegmentRecipient | null {
  if (!row.email || !isValidEmail(row.email)) {
    return null;
  }

  return {
    recipientType: EMAIL_RECIPIENT_TYPE.MEMBER,
    memberId: row.id,
    sponsorId: null,
    email: normalizeEmail(row.email),
    recipientName: `${row.first_name} ${row.last_name}`.trim(),
  };
}

function toSponsorRecipient(
  row: SponsorRecipientRow,
): EmailSegmentRecipient | null {
  if (!row.email || !isValidEmail(row.email)) {
    return null;
  }

  return {
    recipientType: EMAIL_RECIPIENT_TYPE.SPONSOR,
    memberId: null,
    sponsorId: row.id,
    email: normalizeEmail(row.email),
    recipientName: row.company_name,
  };
}

function compareMembershipRows(
  first: MembershipRecipientRow,
  second: MembershipRecipientRow,
) {
  return (
    second.end_date.localeCompare(first.end_date) ||
    second.start_date.localeCompare(first.start_date) ||
    second.created_at.localeCompare(first.created_at)
  );
}

function isCurrentMembership(row: MembershipRecipientRow, today: string) {
  return row.start_date <= today && row.end_date >= today;
}

function isExpiredMembership(row: MembershipRecipientRow, today: string) {
  return row.end_date < today;
}

function deduplicateRecipients(
  recipients: EmailSegmentRecipient[],
  optOutEmails: Set<string>,
): RecipientBuildResult {
  const seenEmails = new Set<string>();
  let skippedCount = 0;
  let duplicateCount = 0;
  let optOutCount = 0;
  const deduplicated: EmailSegmentRecipient[] = [];

  for (const recipient of recipients) {
    const normalizedEmail = normalizeEmail(recipient.email);

    if (!isValidEmail(normalizedEmail)) {
      skippedCount += 1;
      continue;
    }

    if (optOutEmails.has(normalizedEmail)) {
      skippedCount += 1;
      optOutCount += 1;
      continue;
    }

    if (seenEmails.has(normalizedEmail)) {
      skippedCount += 1;
      duplicateCount += 1;
      continue;
    }

    seenEmails.add(normalizedEmail);
    deduplicated.push({
      ...recipient,
      email: normalizedEmail,
    });
  }

  return {
    recipients: deduplicated,
    skippedCount,
    duplicateCount,
    optOutCount,
  };
}

export async function getCampaignRecipients(campaignId: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("email_campaign_recipients")
    .select(emailRecipientSelect)
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: true })
    .returns<EmailRecipientRow[]>();

  if (error) {
    throw new Error("Impossibile caricare i destinatari campagna.");
  }

  return data.map(mapEmailRecipient);
}

export async function getPendingCampaignRecipients(campaignId: string) {
  const recipients = await getCampaignRecipients(campaignId);

  return recipients.filter((recipient) => recipient.status === "pending");
}

export async function buildSegmentRecipients(
  audienceType: EmailCampaignAudienceType,
  customRecipientsRaw?: string | null,
) {
  const optOutEmails = await getOptOutEmails();
  const recipients = await buildRecipientsByAudience(
    audienceType,
    customRecipientsRaw,
  );

  return deduplicateRecipients(recipients, optOutEmails);
}

export async function insertCampaignRecipients(
  campaignId: string,
  recipients: EmailSegmentRecipient[],
  consentBasisSnapshot: string | null,
) {
  if (recipients.length === 0) {
    return 0;
  }

  const supabase = await getSupabaseServerClientOrThrow();
  const { error } = await supabase.from("email_campaign_recipients").insert(
    recipients.map((recipient) => ({
      campaign_id: campaignId,
      recipient_type: recipient.recipientType,
      member_id: recipient.memberId,
      sponsor_id: recipient.sponsorId,
      email: recipient.email,
      recipient_name: recipient.recipientName,
      consent_basis_snapshot: consentBasisSnapshot,
    })),
  );

  if (error) {
    throw new Error("Impossibile salvare i destinatari campagna.");
  }

  return recipients.length;
}

async function buildRecipientsByAudience(
  audienceType: EmailCampaignAudienceType,
  customRecipientsRaw?: string | null,
) {
  switch (audienceType) {
    case EMAIL_CAMPAIGN_AUDIENCE_TYPE.ALL_MEMBERS:
      return buildAllMembersRecipients();
    case EMAIL_CAMPAIGN_AUDIENCE_TYPE.ACTIVE_MEMBERS:
      return buildActiveMembersRecipients();
    case EMAIL_CAMPAIGN_AUDIENCE_TYPE.EXPIRED_MEMBERS:
      return buildExpiredMembersRecipients();
    case EMAIL_CAMPAIGN_AUDIENCE_TYPE.SPONSORS:
      return buildSponsorRecipients();
    case EMAIL_CAMPAIGN_AUDIENCE_TYPE.CUSTOM:
      return buildCustomRecipients(customRecipientsRaw ?? "");
    default:
      return [];
  }
}

async function buildAllMembersRecipients() {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("members")
    .select("id, first_name, last_name, email")
    .is("archived_at", null)
    .order("last_name", { ascending: true })
    .returns<MemberRecipientRow[]>();

  if (error) {
    throw new Error("Impossibile caricare i soci destinatari.");
  }

  return data
    .map(toMemberRecipient)
    .filter((recipient): recipient is EmailSegmentRecipient =>
      Boolean(recipient),
    );
}

async function buildActiveMembersRecipients() {
  const latestMemberships = await getLatestMembershipsByMember();
  const today = new Date().toISOString().slice(0, 10);

  return latestMemberships
    .filter((row) => isCurrentMembership(row, today))
    .map((row) => one(row.members))
    .filter((member): member is MemberRecipientWithArchive => Boolean(member))
    .map(toMemberRecipient)
    .filter((recipient): recipient is EmailSegmentRecipient =>
      Boolean(recipient),
    );
}

async function buildExpiredMembersRecipients() {
  const latestMemberships = await getLatestMembershipsByMember();
  const today = new Date().toISOString().slice(0, 10);

  return latestMemberships
    .filter((row) => isExpiredMembership(row, today))
    .map((row) => one(row.members))
    .filter((member): member is MemberRecipientWithArchive => Boolean(member))
    .map(toMemberRecipient)
    .filter((recipient): recipient is EmailSegmentRecipient =>
      Boolean(recipient),
    );
}

async function buildSponsorRecipients() {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("sponsors")
    .select("id, company_name, email")
    .eq("status", "active")
    .is("archived_at", null)
    .order("company_name", { ascending: true })
    .returns<SponsorRecipientRow[]>();

  if (error) {
    throw new Error("Impossibile caricare gli sponsor destinatari.");
  }

  return data
    .map(toSponsorRecipient)
    .filter((recipient): recipient is EmailSegmentRecipient =>
      Boolean(recipient),
    );
}

function buildCustomRecipients(value: string) {
  return parseManualRecipients(value)
    .filter((recipient) => isValidEmail(recipient.email))
    .map<EmailSegmentRecipient>((recipient) => ({
      recipientType: EMAIL_RECIPIENT_TYPE.CUSTOM,
      memberId: null,
      sponsorId: null,
      email: recipient.email,
      recipientName: recipient.recipientName,
    }));
}

async function getLatestMembershipsByMember() {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("memberships")
    .select(
      "member_id, start_date, end_date, status, created_at, members(id, first_name, last_name, email, archived_at)",
    )
    .is("archived_at", null)
    .neq("status", "cancelled")
    .returns<MembershipRecipientRow[]>();

  if (error) {
    throw new Error("Impossibile caricare le iscrizioni destinatari.");
  }

  const latestByMember = new Map<string, MembershipRecipientRow>();

  for (const row of data) {
    const member = one(row.members);

    if (!member || member.archived_at !== null) {
      continue;
    }

    const current = latestByMember.get(row.member_id);

    if (!current || compareMembershipRows(row, current) < 0) {
      latestByMember.set(row.member_id, row);
    }
  }

  return [...latestByMember.values()];
}

async function getOptOutEmails() {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("email_campaign_recipients")
    .select("email")
    .not("opted_out_at", "is", null)
    .returns<{ email: string }[]>();

  if (error) {
    throw new Error("Impossibile caricare gli opt-out email.");
  }

  return new Set(data.map((row) => normalizeEmail(row.email)));
}

export function getEmailRecipientSelect() {
  return emailRecipientSelect;
}

export function mapEmailRecipientRow(row: EmailRecipientRow) {
  return mapEmailRecipient(row);
}

export type { EmailRecipientRow };
