import { getSupabaseServerClientOrThrow } from "@/services/supabase.service";
import {
  EMAIL_CAMPAIGN_AUDIENCE_TYPE,
  EMAIL_CAMPAIGN_STATUS,
  EMAIL_RECIPIENT_STATUS,
  type EmailCampaignAudienceType,
  type EmailCampaignStatus,
  type EmailRecipientStatus,
} from "@/types/email";
import { EVENT_STATUS, type EventStatus } from "@/types/event";
import { MEMBER_STATUS, type MemberStatus } from "@/types/member";
import {
  MEMBERSHIP_STATUS,
  type MembershipStatus,
} from "@/types/membership";
import {
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  type PaymentMethod,
  type PaymentStatus,
} from "@/types/payment";
import {
  REPORT_EXPIRATION_WINDOW,
  REPORT_TYPE,
  type ReportColumn,
  type ReportDefinition,
  type ReportFilters,
  type ReportPreview,
  type ReportResult,
  type ReportRow,
  type ReportType,
} from "@/types/report";
import {
  SPONSOR_CONTRIBUTION_TYPE,
  SPONSOR_STATUS,
  type SponsorContributionType,
  type SponsorStatus,
} from "@/types/sponsor";
import { getTodayDateInputValue } from "@/utils/date";
import {
  getMemberStatusLabel,
  getMembershipStatusLabel,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
} from "@/utils/status";

type Relation<T> = T | T[] | null;

const REPORT_PREVIEW_LIMIT = 10;
const REPORT_ROW_LIMIT = 5_000;
const MS_PER_DAY = 86_400_000;

const allOption = { value: "all", label: "Tutti" };

const memberStatusOptions = [
  allOption,
  { value: MEMBER_STATUS.ACTIVE, label: "Attivi" },
  { value: MEMBER_STATUS.INACTIVE, label: "Inattivi" },
  { value: MEMBER_STATUS.ARCHIVED, label: "Archiviati" },
];

const membershipStatusOptions = [
  allOption,
  { value: MEMBERSHIP_STATUS.ACTIVE, label: "Attive" },
  { value: MEMBERSHIP_STATUS.EXPIRED, label: "Scadute" },
  { value: MEMBERSHIP_STATUS.CANCELLED, label: "Annullate" },
];

const memberAssociativeStatusOptions = [
  allOption,
  { value: MEMBERSHIP_STATUS.ACTIVE, label: "Con iscrizione attiva" },
  { value: MEMBERSHIP_STATUS.EXPIRED, label: "Con iscrizione scaduta" },
  { value: "without_membership", label: "Senza iscrizione" },
];

const paymentStatusOptions = [
  allOption,
  { value: PAYMENT_STATUS.UNPAID, label: "Non pagata" },
  { value: PAYMENT_STATUS.PARTIAL, label: "Parziale" },
  { value: PAYMENT_STATUS.PAID, label: "Pagata" },
  { value: PAYMENT_STATUS.OVERPAID, label: "Eccedente" },
];

const paymentMethodOptions = [
  allOption,
  { value: PAYMENT_METHOD.CASH, label: "Contanti" },
  { value: PAYMENT_METHOD.BANK_TRANSFER, label: "Bonifico" },
  { value: PAYMENT_METHOD.POS, label: "POS" },
  { value: PAYMENT_METHOD.OTHER, label: "Altro" },
];

const sponsorStatusOptions = [
  allOption,
  { value: SPONSOR_STATUS.ACTIVE, label: "Attivi" },
  { value: SPONSOR_STATUS.INACTIVE, label: "Inattivi" },
  { value: SPONSOR_STATUS.ARCHIVED, label: "Archiviati" },
];

const contributionTypeOptions = [
  allOption,
  { value: SPONSOR_CONTRIBUTION_TYPE.MONEY, label: "Monetari" },
  { value: SPONSOR_CONTRIBUTION_TYPE.GOODS, label: "Beni" },
  { value: SPONSOR_CONTRIBUTION_TYPE.SERVICE, label: "Servizi" },
  { value: SPONSOR_CONTRIBUTION_TYPE.OTHER, label: "Altro" },
];

const eventStatusOptions = [
  allOption,
  { value: EVENT_STATUS.PLANNED, label: "Pianificati" },
  { value: EVENT_STATUS.CONFIRMED, label: "Confermati" },
  { value: EVENT_STATUS.COMPLETED, label: "Completati" },
  { value: EVENT_STATUS.CANCELLED, label: "Annullati" },
];

const emailCampaignStatusOptions = [
  allOption,
  { value: EMAIL_CAMPAIGN_STATUS.DRAFT, label: "Bozze" },
  { value: EMAIL_CAMPAIGN_STATUS.SENT, label: "Inviate" },
  { value: EMAIL_CAMPAIGN_STATUS.FAILED, label: "Fallite" },
];

const audienceTypeOptions = [
  allOption,
  { value: EMAIL_CAMPAIGN_AUDIENCE_TYPE.ALL_MEMBERS, label: "Tutti i soci" },
  { value: EMAIL_CAMPAIGN_AUDIENCE_TYPE.ACTIVE_MEMBERS, label: "Soci attivi" },
  { value: EMAIL_CAMPAIGN_AUDIENCE_TYPE.EXPIRED_MEMBERS, label: "Soci scaduti" },
  { value: EMAIL_CAMPAIGN_AUDIENCE_TYPE.SPONSORS, label: "Sponsor" },
  { value: EMAIL_CAMPAIGN_AUDIENCE_TYPE.CUSTOM, label: "Custom/manuale" },
];

const expirationWindowOptions = [
  { value: REPORT_EXPIRATION_WINDOW.EXPIRED, label: "Scadute" },
  { value: REPORT_EXPIRATION_WINDOW.WITHIN_30, label: "Entro 30 giorni" },
  { value: REPORT_EXPIRATION_WINDOW.WITHIN_60, label: "Entro 60 giorni" },
  { value: REPORT_EXPIRATION_WINDOW.WITHIN_90, label: "Entro 90 giorni" },
  { value: REPORT_EXPIRATION_WINDOW.CUSTOM, label: "Intervallo date" },
];

const reportDefinitions: ReportDefinition[] = [
  {
    type: REPORT_TYPE.MEMBERS,
    label: "Soci",
    description:
      "Anagrafica soci con ruoli e stato associativo derivato dalle memberships.",
    columns: [
      { key: "member_id", label: "ID socio" },
      { key: "first_name", label: "Nome" },
      { key: "last_name", label: "Cognome" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Telefono" },
      { key: "city", label: "Citta" },
      { key: "province", label: "Provincia" },
      { key: "country", label: "Paese" },
      { key: "birth_date", label: "Data nascita" },
      { key: "fiscal_code", label: "Codice fiscale" },
      { key: "profession", label: "Professione" },
      { key: "member_status", label: "Stato anagrafico" },
      { key: "membership_status_derived", label: "Stato associativo" },
      { key: "latest_membership_start_date", label: "Ultimo inizio" },
      { key: "latest_membership_end_date", label: "Ultima scadenza" },
      { key: "latest_payment_status", label: "Stato pagamento" },
      { key: "roles", label: "Ruoli" },
      { key: "created_at", label: "Creato il" },
      { key: "archived_at", label: "Archiviato il" },
    ],
    filters: {
      queryLabel: "Cerca nome, email, citta o codice fiscale",
      statusLabel: "Stato anagrafico",
      statusOptions: memberStatusOptions,
      membershipStatusOptions: memberAssociativeStatusOptions,
    },
  },
  {
    type: REPORT_TYPE.MEMBERSHIPS,
    label: "Iscrizioni",
    description:
      "Storico iscrizioni e rinnovi, una riga distinta per ogni membership.",
    dateFieldLabel: "Data inizio",
    columns: [
      { key: "membership_id", label: "ID iscrizione" },
      { key: "member_id", label: "ID socio" },
      { key: "member_full_name", label: "Socio" },
      { key: "member_email", label: "Email socio" },
      { key: "membership_plan_name", label: "Piano" },
      { key: "start_date", label: "Inizio" },
      { key: "end_date", label: "Fine" },
      { key: "minimum_fee", label: "Quota minima", align: "right" },
      { key: "expected_fee", label: "Quota prevista", align: "right" },
      { key: "paid_amount", label: "Versato", align: "right" },
      { key: "payment_status", label: "Stato pagamento" },
      { key: "membership_status", label: "Stato iscrizione" },
      { key: "created_at", label: "Creato il" },
      { key: "archived_at", label: "Archiviato il" },
    ],
    filters: {
      queryLabel: "Cerca socio o piano",
      dateFromLabel: "Inizio da",
      dateToLabel: "Inizio a",
      statusLabel: "Stato iscrizione",
      statusOptions: membershipStatusOptions,
      paymentStatusOptions,
    },
  },
  {
    type: REPORT_TYPE.PAYMENTS,
    label: "Quote e pagamenti",
    description:
      "Versamenti associativi non contabili collegati alle iscrizioni.",
    dateFieldLabel: "Data pagamento",
    columns: [
      { key: "payment_id", label: "ID pagamento" },
      { key: "membership_id", label: "ID iscrizione" },
      { key: "member_id", label: "ID socio" },
      { key: "member_full_name", label: "Socio" },
      { key: "payment_date", label: "Data pagamento" },
      { key: "amount", label: "Importo", align: "right" },
      { key: "method", label: "Metodo" },
      { key: "reference", label: "Riferimento" },
      { key: "membership_start_date", label: "Inizio iscrizione" },
      { key: "membership_end_date", label: "Fine iscrizione" },
      { key: "expected_fee", label: "Quota prevista", align: "right" },
      { key: "membership_paid_amount", label: "Versato membership", align: "right" },
      { key: "membership_payment_status", label: "Stato pagamento membership" },
      { key: "created_at", label: "Creato il" },
      { key: "archived_at", label: "Archiviato il" },
    ],
    filters: {
      queryLabel: "Cerca socio o riferimento",
      dateFromLabel: "Pagamento da",
      dateToLabel: "Pagamento a",
      paymentMethodOptions,
      paymentStatusOptions,
    },
  },
  {
    type: REPORT_TYPE.EXPIRATIONS,
    label: "Scadenze",
    description:
      "Ultime membership rinnovabili per socio, filtrate per scadenza.",
    dateFieldLabel: "Data fine",
    columns: [
      { key: "member_id", label: "ID socio" },
      { key: "member_full_name", label: "Socio" },
      { key: "member_email", label: "Email" },
      { key: "member_phone", label: "Telefono" },
      { key: "membership_id", label: "ID iscrizione" },
      { key: "membership_plan_name", label: "Piano" },
      { key: "start_date", label: "Inizio" },
      { key: "end_date", label: "Fine" },
      { key: "days_to_expiration", label: "Giorni alla scadenza", align: "right" },
      { key: "payment_status", label: "Stato pagamento" },
      { key: "expected_fee", label: "Quota prevista", align: "right" },
      { key: "paid_amount", label: "Versato", align: "right" },
    ],
    filters: {
      queryLabel: "Cerca socio, email o piano",
      dateFromLabel: "Fine da",
      dateToLabel: "Fine a",
      expirationWindowOptions,
      paymentStatusOptions,
    },
  },
  {
    type: REPORT_TYPE.SPONSORS,
    label: "Sponsor",
    description:
      "Anagrafica sponsor con riepilogo gestionale dei contributi.",
    columns: [
      { key: "sponsor_id", label: "ID sponsor" },
      { key: "company_name", label: "Ragione sociale" },
      { key: "contact_name", label: "Referente" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Telefono" },
      { key: "website", label: "Sito web" },
      { key: "city", label: "Citta" },
      { key: "status", label: "Stato" },
      { key: "contributions_count", label: "Contributi", align: "right" },
      { key: "money_contributions_total", label: "Totale monetario", align: "right" },
      { key: "non_money_contributions_count", label: "Contributi non monetari", align: "right" },
      { key: "created_at", label: "Creato il" },
      { key: "archived_at", label: "Archiviato il" },
    ],
    filters: {
      queryLabel: "Cerca ragione sociale, referente, email o citta",
      statusLabel: "Stato sponsor",
      statusOptions: sponsorStatusOptions,
    },
  },
  {
    type: REPORT_TYPE.SPONSOR_CONTRIBUTIONS,
    label: "Contributi sponsor",
    description:
      "Contributi monetari e non monetari, con eventuale evento collegato.",
    dateFieldLabel: "Data contributo",
    columns: [
      { key: "contribution_id", label: "ID contributo" },
      { key: "sponsor_id", label: "ID sponsor" },
      { key: "sponsor_company_name", label: "Sponsor" },
      { key: "event_id", label: "ID evento" },
      { key: "event_name", label: "Evento" },
      { key: "contribution_date", label: "Data contributo" },
      { key: "contribution_type", label: "Tipo" },
      { key: "amount", label: "Importo gestionale", align: "right" },
      { key: "description", label: "Descrizione" },
      { key: "notes", label: "Note" },
      { key: "created_at", label: "Creato il" },
      { key: "archived_at", label: "Archiviato il" },
    ],
    filters: {
      queryLabel: "Cerca sponsor, evento o descrizione",
      dateFromLabel: "Contributo da",
      dateToLabel: "Contributo a",
      contributionTypeOptions,
    },
  },
  {
    type: REPORT_TYPE.EVENTS,
    label: "Eventi",
    description:
      "Eventi con sponsor collegati e riepilogo contributi specifici.",
    dateFieldLabel: "Data inizio evento",
    columns: [
      { key: "event_id", label: "ID evento" },
      { key: "name", label: "Evento" },
      { key: "description", label: "Descrizione" },
      { key: "start_datetime", label: "Inizio" },
      { key: "end_datetime", label: "Fine" },
      { key: "location", label: "Luogo" },
      { key: "status", label: "Stato" },
      { key: "sponsors_count", label: "Sponsor", align: "right" },
      { key: "sponsor_names", label: "Sponsor collegati" },
      { key: "linked_contributions_count", label: "Contributi collegati", align: "right" },
      { key: "money_contributions_total", label: "Totale monetario", align: "right" },
      { key: "created_at", label: "Creato il" },
      { key: "archived_at", label: "Archiviato il" },
    ],
    filters: {
      queryLabel: "Cerca evento, luogo o sponsor",
      dateFromLabel: "Inizio da",
      dateToLabel: "Inizio a",
      statusLabel: "Stato evento",
      statusOptions: eventStatusOptions,
    },
  },
  {
    type: REPORT_TYPE.EMAIL_CAMPAIGNS,
    label: "Campagne email",
    description:
      "Storico operativo campagne e destinatari, senza body o segreti provider.",
    dateFieldLabel: "Data creazione",
    columns: [
      { key: "campaign_id", label: "ID campagna" },
      { key: "template_name", label: "Template" },
      { key: "subject", label: "Oggetto" },
      { key: "audience_type", label: "Segmento" },
      { key: "status", label: "Stato" },
      { key: "provider", label: "Provider" },
      { key: "recipient_snapshot_generated_at", label: "Snapshot destinatari" },
      { key: "send_confirmed_at", label: "Conferma invio" },
      { key: "sent_at", label: "Inviata il" },
      { key: "failed_at", label: "Fallita il" },
      { key: "recipients_total", label: "Destinatari", align: "right" },
      { key: "recipients_pending", label: "Pending", align: "right" },
      { key: "recipients_sent", label: "Inviati", align: "right" },
      { key: "recipients_failed", label: "Falliti", align: "right" },
      { key: "recipients_skipped", label: "Saltati", align: "right" },
      { key: "created_at", label: "Creato il" },
      { key: "archived_at", label: "Archiviato il" },
    ],
    filters: {
      queryLabel: "Cerca oggetto o template",
      dateFromLabel: "Creata da",
      dateToLabel: "Creata a",
      statusLabel: "Stato campagna",
      statusOptions: emailCampaignStatusOptions,
      audienceTypeOptions,
    },
  },
];

type MemberReportRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  province: string | null;
  country: string;
  birth_date: string | null;
  fiscal_code: string | null;
  profession: string | null;
  status: MemberStatus;
  created_at: string;
  archived_at: string | null;
};

type RoleReportRow = {
  member_id: string;
  start_date: string;
  end_date: string | null;
  archived_at: string | null;
  roles: Relation<{
    name: string;
    sort_order: number;
    archived_at: string | null;
  }>;
};

type MembershipReportRow = {
  id: string;
  member_id: string;
  membership_plan_id: string | null;
  start_date: string;
  end_date: string;
  minimum_fee: number | string;
  expected_fee: number | string;
  paid_amount: number | string;
  payment_status: PaymentStatus;
  status: MembershipStatus;
  created_at: string;
  archived_at: string | null;
  members: Relation<{
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone?: string | null;
    archived_at: string | null;
  }>;
  membership_plans: Relation<{
    name: string;
    archived_at: string | null;
  }>;
};

type PaymentReportRow = {
  id: string;
  membership_id: string;
  payment_date: string;
  amount: number | string;
  method: PaymentMethod;
  reference: string | null;
  created_at: string;
  archived_at: string | null;
  memberships: Relation<MembershipReportRow>;
};

type SponsorReportRow = {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  city: string | null;
  status: SponsorStatus;
  created_at: string;
  archived_at: string | null;
};

type SponsorContributionReportRow = {
  id: string;
  sponsor_id: string;
  event_id: string | null;
  contribution_date: string;
  amount: number | string;
  contribution_type: SponsorContributionType;
  description: string | null;
  notes: string | null;
  created_at: string;
  archived_at: string | null;
  sponsors: Relation<{
    company_name: string;
    archived_at: string | null;
  }>;
  events: Relation<{
    name: string;
    archived_at: string | null;
  }>;
};

type EventReportRow = {
  id: string;
  name: string;
  description: string | null;
  start_datetime: string;
  end_datetime: string | null;
  location: string | null;
  status: EventStatus;
  created_at: string;
  archived_at: string | null;
};

type EventSponsorReportRow = {
  event_id: string;
  sponsors: Relation<{
    company_name: string;
    archived_at: string | null;
  }>;
};

type EmailCampaignReportRow = {
  id: string;
  subject: string;
  audience_type: EmailCampaignAudienceType;
  status: EmailCampaignStatus;
  provider: "resend";
  recipient_snapshot_generated_at: string | null;
  send_confirmed_at: string | null;
  sent_at: string | null;
  failed_at: string | null;
  created_at: string;
  archived_at: string | null;
  email_templates: Relation<{
    name: string;
    archived_at: string | null;
  }>;
};

type EmailRecipientReportRow = {
  campaign_id: string;
  status: EmailRecipientStatus;
};

function one<T>(relation: Relation<T>) {
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

function toNumber(value: number | string) {
  return typeof value === "string" ? Number.parseFloat(value) : value;
}

function formatAmount(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  const numericValue = toNumber(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(2) : null;
}

function dateOnly(value: string | null | undefined) {
  return value ? value.slice(0, 10) : null;
}

function dateTimeIso(value: string | null | undefined) {
  return value ?? null;
}

function textMatches(values: Array<string | null | undefined>, query?: string) {
  if (!query) {
    return true;
  }

  const normalizedQuery = query.toLowerCase();
  return values
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(normalizedQuery);
}

function dateInputToUtcTime(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function daysUntil(endDate: string) {
  return Math.round(
    (dateInputToUtcTime(endDate) - dateInputToUtcTime(getTodayDateInputValue())) /
      MS_PER_DAY,
  );
}

function effectiveMembershipStatus(status: MembershipStatus, endDate: string) {
  if (status === MEMBERSHIP_STATUS.CANCELLED) {
    return MEMBERSHIP_STATUS.CANCELLED;
  }

  return endDate < getTodayDateInputValue()
    ? MEMBERSHIP_STATUS.EXPIRED
    : MEMBERSHIP_STATUS.ACTIVE;
}

function associativeStatus(row: MembershipReportRow | null) {
  if (!row) {
    return "without_membership" as const;
  }

  return effectiveMembershipStatus(row.status, row.end_date);
}

function associativeStatusLabel(
  status: MembershipStatus | "without_membership",
) {
  if (status === "without_membership") {
    return "Senza iscrizione";
  }

  return getMembershipStatusLabel(status);
}

function dateInRange(value: string, filters: ReportFilters) {
  const date = dateOnly(value);

  if (!date) {
    return false;
  }

  if (filters.dateFrom && date < filters.dateFrom) {
    return false;
  }

  return !(filters.dateTo && date > filters.dateTo);
}

function isRoleActive(row: RoleReportRow) {
  const today = getTodayDateInputValue();
  return (
    row.archived_at === null &&
    row.start_date <= today &&
    (!row.end_date || row.end_date >= today)
  );
}

function sortReportRowsByStringKey(rows: ReportRow[], key: string) {
  return rows.toSorted((left, right) =>
    String(left[key] ?? "").localeCompare(String(right[key] ?? ""), "it"),
  );
}

export function getReportDefinitions() {
  return reportDefinitions;
}

export function getReportDefinition(reportType: ReportType) {
  return (
    reportDefinitions.find((definition) => definition.type === reportType) ??
    reportDefinitions[0]
  );
}

export async function getReportPreview(
  filters: ReportFilters,
): Promise<ReportPreview> {
  const report = await buildReport(filters);

  return {
    ...report,
    previewRows: report.rows.slice(0, REPORT_PREVIEW_LIMIT),
    totalRows: report.rows.length,
    previewLimit: REPORT_PREVIEW_LIMIT,
  };
}

export async function buildReport(
  filters: ReportFilters,
): Promise<ReportResult> {
  const definition = getReportDefinition(filters.reportType);
  const rows = await buildReportRows(filters);

  return {
    definition,
    filters,
    rows,
    generatedAt: new Date().toISOString(),
  };
}

async function buildReportRows(filters: ReportFilters) {
  switch (filters.reportType) {
    case REPORT_TYPE.MEMBERS:
      return buildMembersReport(filters);
    case REPORT_TYPE.MEMBERSHIPS:
      return buildMembershipsReport(filters);
    case REPORT_TYPE.PAYMENTS:
      return buildPaymentsReport(filters);
    case REPORT_TYPE.EXPIRATIONS:
      return buildExpirationsReport(filters);
    case REPORT_TYPE.SPONSORS:
      return buildSponsorsReport(filters);
    case REPORT_TYPE.SPONSOR_CONTRIBUTIONS:
      return buildSponsorContributionsReport(filters);
    case REPORT_TYPE.EVENTS:
      return buildEventsReport(filters);
    case REPORT_TYPE.EMAIL_CAMPAIGNS:
      return buildEmailCampaignsReport(filters);
  }
}

async function buildMembersReport(filters: ReportFilters) {
  const supabase = await getSupabaseServerClientOrThrow();
  let query = supabase
    .from("members")
    .select(
      "id, first_name, last_name, email, phone, city, province, country, birth_date, fiscal_code, profession, status, created_at, archived_at",
    )
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true })
    .limit(REPORT_ROW_LIMIT);

  if (!filters.includeArchived) {
    query = query.is("archived_at", null);
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query.returns<MemberReportRow[]>();

  if (error) {
    throw new Error("Impossibile generare il report soci.");
  }

  let members = data.filter((member) =>
    textMatches(
      [
        member.first_name,
        member.last_name,
        member.email,
        member.city,
        member.fiscal_code,
        member.profession,
      ],
      filters.query,
    ),
  );

  const memberIds = members.map((member) => member.id);
  const [rolesByMemberId, latestMembershipByMemberId] = await Promise.all([
    getRolesByMemberId(memberIds),
    getLatestMembershipByMemberId(memberIds),
  ]);

  if (filters.membershipStatus && filters.membershipStatus !== "all") {
    members = members.filter((member) => {
      const latestMembership = latestMembershipByMemberId.get(member.id) ?? null;
      return associativeStatus(latestMembership) === filters.membershipStatus;
    });
  }

  return members.map<ReportRow>((member) => {
    const latestMembership = latestMembershipByMemberId.get(member.id) ?? null;
    const status = associativeStatus(latestMembership);

    return {
      member_id: member.id,
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      phone: member.phone,
      city: member.city,
      province: member.province,
      country: member.country,
      birth_date: member.birth_date,
      fiscal_code: member.fiscal_code,
      profession: member.profession,
      member_status: getMemberStatusLabel(member.status),
      membership_status_derived: associativeStatusLabel(status),
      latest_membership_start_date: latestMembership?.start_date ?? null,
      latest_membership_end_date: latestMembership?.end_date ?? null,
      latest_payment_status: latestMembership
        ? getPaymentStatusLabel(latestMembership.payment_status)
        : null,
      roles: (rolesByMemberId.get(member.id) ?? []).join(", "),
      created_at: dateOnly(member.created_at),
      archived_at: dateOnly(member.archived_at),
    };
  });
}

async function getRolesByMemberId(memberIds: string[]) {
  const rolesByMemberId = new Map<string, string[]>();

  if (memberIds.length === 0) {
    return rolesByMemberId;
  }

  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("member_roles")
    .select("member_id, start_date, end_date, archived_at, roles(name, sort_order, archived_at)")
    .in("member_id", memberIds)
    .is("archived_at", null)
    .returns<RoleReportRow[]>();

  if (error) {
    throw new Error("Impossibile calcolare i ruoli del report soci.");
  }

  for (const row of data.filter(isRoleActive)) {
    const role = one(row.roles);

    if (!role || role.archived_at) {
      continue;
    }

    const roles = rolesByMemberId.get(row.member_id) ?? [];
    roles.push(role.name);
    rolesByMemberId.set(row.member_id, roles);
  }

  for (const [memberId, roles] of rolesByMemberId.entries()) {
    rolesByMemberId.set(memberId, roles.toSorted((left, right) => left.localeCompare(right, "it")));
  }

  return rolesByMemberId;
}

async function getLatestMembershipByMemberId(memberIds: string[]) {
  const latestByMemberId = new Map<string, MembershipReportRow>();

  if (memberIds.length === 0) {
    return latestByMemberId;
  }

  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("memberships")
    .select(
      "id, member_id, membership_plan_id, start_date, end_date, minimum_fee, expected_fee, paid_amount, payment_status, status, created_at, archived_at, members(id, first_name, last_name, email, phone, archived_at), membership_plans(name, archived_at)",
    )
    .in("member_id", memberIds)
    .is("archived_at", null)
    .neq("status", MEMBERSHIP_STATUS.CANCELLED)
    .order("member_id", { ascending: true })
    .order("end_date", { ascending: false })
    .order("start_date", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<MembershipReportRow[]>();

  if (error) {
    throw new Error("Impossibile calcolare lo stato associativo dei soci.");
  }

  for (const row of data) {
    if (!latestByMemberId.has(row.member_id)) {
      latestByMemberId.set(row.member_id, row);
    }
  }

  return latestByMemberId;
}

async function buildMembershipsReport(filters: ReportFilters) {
  const supabase = await getSupabaseServerClientOrThrow();
  let query = supabase
    .from("memberships")
    .select(
      "id, member_id, membership_plan_id, start_date, end_date, minimum_fee, expected_fee, paid_amount, payment_status, status, created_at, archived_at, members(id, first_name, last_name, email, archived_at), membership_plans(name, archived_at)",
    )
    .order("start_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(REPORT_ROW_LIMIT);

  if (!filters.includeArchived) {
    query = query.is("archived_at", null);
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.paymentStatus && filters.paymentStatus !== "all") {
    query = query.eq("payment_status", filters.paymentStatus);
  }

  if (filters.dateFrom) {
    query = query.gte("start_date", filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte("start_date", filters.dateTo);
  }

  const { data, error } = await query.returns<MembershipReportRow[]>();

  if (error) {
    throw new Error("Impossibile generare il report iscrizioni.");
  }

  return data
    .filter((row) => {
      const member = one(row.members);
      const plan = one(row.membership_plans);
      return textMatches(
        [
          member ? `${member.first_name} ${member.last_name}` : null,
          member?.email,
          plan?.name,
        ],
        filters.query,
      );
    })
    .map<ReportRow>((row) => {
      const member = one(row.members);
      const plan = one(row.membership_plans);

      return {
        membership_id: row.id,
        member_id: row.member_id,
        member_full_name: member
          ? `${member.first_name} ${member.last_name}`
          : "Socio non disponibile",
        member_email: member?.email ?? null,
        membership_plan_name: plan?.name ?? null,
        start_date: row.start_date,
        end_date: row.end_date,
        minimum_fee: formatAmount(row.minimum_fee),
        expected_fee: formatAmount(row.expected_fee),
        paid_amount: formatAmount(row.paid_amount),
        payment_status: getPaymentStatusLabel(row.payment_status),
        membership_status: getMembershipStatusLabel(
          effectiveMembershipStatus(row.status, row.end_date),
        ),
        created_at: dateOnly(row.created_at),
        archived_at: dateOnly(row.archived_at),
      };
    });
}

async function buildPaymentsReport(filters: ReportFilters) {
  const supabase = await getSupabaseServerClientOrThrow();
  let query = supabase
    .from("payments")
    .select(
      "id, membership_id, payment_date, amount, method, reference, created_at, archived_at, memberships(id, member_id, membership_plan_id, start_date, end_date, minimum_fee, expected_fee, paid_amount, payment_status, status, created_at, archived_at, members(id, first_name, last_name, email, archived_at), membership_plans(name, archived_at))",
    )
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(REPORT_ROW_LIMIT);

  if (!filters.includeArchived) {
    query = query.is("archived_at", null);
  }

  if (filters.paymentMethod && filters.paymentMethod !== "all") {
    query = query.eq("method", filters.paymentMethod);
  }

  if (filters.dateFrom) {
    query = query.gte("payment_date", filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte("payment_date", filters.dateTo);
  }

  const { data, error } = await query.returns<PaymentReportRow[]>();

  if (error) {
    throw new Error("Impossibile generare il report quote e pagamenti.");
  }

  return data
    .filter((row) => {
      const membership = one(row.memberships);
      const member = membership ? one(membership.members) : null;
      const matchesPaymentStatus =
        !filters.paymentStatus ||
        filters.paymentStatus === "all" ||
        membership?.payment_status === filters.paymentStatus;

      return (
        matchesPaymentStatus &&
        textMatches(
          [
            member ? `${member.first_name} ${member.last_name}` : null,
            member?.email,
            row.reference,
          ],
          filters.query,
        )
      );
    })
    .map<ReportRow>((row) => {
      const membership = one(row.memberships);
      const member = membership ? one(membership.members) : null;

      return {
        payment_id: row.id,
        membership_id: row.membership_id,
        member_id: membership?.member_id ?? null,
        member_full_name: member
          ? `${member.first_name} ${member.last_name}`
          : "Socio non disponibile",
        payment_date: row.payment_date,
        amount: formatAmount(row.amount),
        method: getPaymentMethodLabel(row.method),
        reference: row.reference,
        membership_start_date: membership?.start_date ?? null,
        membership_end_date: membership?.end_date ?? null,
        expected_fee: formatAmount(membership?.expected_fee),
        membership_paid_amount: formatAmount(membership?.paid_amount),
        membership_payment_status: membership
          ? getPaymentStatusLabel(membership.payment_status)
          : null,
        created_at: dateOnly(row.created_at),
        archived_at: dateOnly(row.archived_at),
      };
    });
}

async function buildExpirationsReport(filters: ReportFilters) {
  const allMemberships = Array.from(
    (await getLatestMembershipByMemberId(await getOperationalMemberIds(filters)))
      .values(),
  );
  const rows = allMemberships
    .filter((row) => row.status !== MEMBERSHIP_STATUS.CANCELLED)
    .filter((row) => {
      const daysToExpiration = daysUntil(row.end_date);
      const window = filters.expirationWindow ?? REPORT_EXPIRATION_WINDOW.EXPIRED;

      if (window === REPORT_EXPIRATION_WINDOW.EXPIRED) {
        return daysToExpiration < 0;
      }

      if (window === REPORT_EXPIRATION_WINDOW.CUSTOM) {
        return dateInRange(row.end_date, filters);
      }

      const windowDays = Number.parseInt(window, 10);
      return daysToExpiration >= 0 && daysToExpiration <= windowDays;
    })
    .filter((row) => {
      const member = one(row.members);
      const plan = one(row.membership_plans);
      const paymentStatusMatches =
        !filters.paymentStatus ||
        filters.paymentStatus === "all" ||
        row.payment_status === filters.paymentStatus;

      return (
        paymentStatusMatches &&
        textMatches(
          [
            member ? `${member.first_name} ${member.last_name}` : null,
            member?.email,
            plan?.name,
          ],
          filters.query,
        )
      );
    })
    .map<ReportRow>((row) => {
      const member = one(row.members);
      const plan = one(row.membership_plans);

      return {
        member_id: row.member_id,
        member_full_name: member
          ? `${member.first_name} ${member.last_name}`
          : "Socio non disponibile",
        member_email: member?.email ?? null,
        member_phone: member?.phone ?? null,
        membership_id: row.id,
        membership_plan_name: plan?.name ?? null,
        start_date: row.start_date,
        end_date: row.end_date,
        days_to_expiration: daysUntil(row.end_date),
        payment_status: getPaymentStatusLabel(row.payment_status),
        expected_fee: formatAmount(row.expected_fee),
        paid_amount: formatAmount(row.paid_amount),
      };
    });

  return sortReportRowsByStringKey(rows, "end_date");
}

async function getOperationalMemberIds(filters: ReportFilters) {
  const supabase = await getSupabaseServerClientOrThrow();
  let query = supabase.from("members").select("id").limit(REPORT_ROW_LIMIT);

  if (!filters.includeArchived) {
    query = query.is("archived_at", null).neq("status", MEMBER_STATUS.ARCHIVED);
  }

  const { data, error } = await query.returns<{ id: string }[]>();

  if (error) {
    throw new Error("Impossibile caricare i soci per il report scadenze.");
  }

  return data.map((member) => member.id);
}

async function buildSponsorsReport(filters: ReportFilters) {
  const supabase = await getSupabaseServerClientOrThrow();
  let query = supabase
    .from("sponsors")
    .select(
      "id, company_name, contact_name, email, phone, website, city, status, created_at, archived_at",
    )
    .order("company_name", { ascending: true })
    .limit(REPORT_ROW_LIMIT);

  if (!filters.includeArchived) {
    query = query.is("archived_at", null);
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query.returns<SponsorReportRow[]>();

  if (error) {
    throw new Error("Impossibile generare il report sponsor.");
  }

  const sponsors = data.filter((sponsor) =>
    textMatches(
      [
        sponsor.company_name,
        sponsor.contact_name,
        sponsor.email,
        sponsor.phone,
        sponsor.city,
      ],
      filters.query,
    ),
  );
  const summaries = await getSponsorContributionSummaries(
    sponsors.map((sponsor) => sponsor.id),
  );

  return sponsors.map<ReportRow>((sponsor) => {
    const summary = summaries.get(sponsor.id);

    return {
      sponsor_id: sponsor.id,
      company_name: sponsor.company_name,
      contact_name: sponsor.contact_name,
      email: sponsor.email,
      phone: sponsor.phone,
      website: sponsor.website,
      city: sponsor.city,
      status: getSponsorStatusLabel(sponsor.status),
      contributions_count: summary?.contributionsCount ?? 0,
      money_contributions_total: formatAmount(summary?.moneyTotal ?? 0),
      non_money_contributions_count: summary?.nonMoneyCount ?? 0,
      created_at: dateOnly(sponsor.created_at),
      archived_at: dateOnly(sponsor.archived_at),
    };
  });
}

async function getSponsorContributionSummaries(sponsorIds: string[]) {
  const summaries = new Map<
    string,
    {
      contributionsCount: number;
      moneyTotal: number;
      nonMoneyCount: number;
    }
  >();

  if (sponsorIds.length === 0) {
    return summaries;
  }

  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("sponsor_contributions")
    .select("sponsor_id, amount, contribution_type")
    .in("sponsor_id", sponsorIds)
    .is("archived_at", null)
    .returns<
      Pick<
        SponsorContributionReportRow,
        "sponsor_id" | "amount" | "contribution_type"
      >[]
    >();

  if (error) {
    throw new Error("Impossibile calcolare i contributi sponsor.");
  }

  for (const row of data) {
    const summary = summaries.get(row.sponsor_id) ?? {
      contributionsCount: 0,
      moneyTotal: 0,
      nonMoneyCount: 0,
    };

    summary.contributionsCount += 1;

    if (row.contribution_type === SPONSOR_CONTRIBUTION_TYPE.MONEY) {
      summary.moneyTotal += toNumber(row.amount);
    } else {
      summary.nonMoneyCount += 1;
    }

    summaries.set(row.sponsor_id, summary);
  }

  return summaries;
}

async function buildSponsorContributionsReport(filters: ReportFilters) {
  const supabase = await getSupabaseServerClientOrThrow();
  let query = supabase
    .from("sponsor_contributions")
    .select(
      "id, sponsor_id, event_id, contribution_date, amount, contribution_type, description, notes, created_at, archived_at, sponsors(company_name, archived_at), events(name, archived_at)",
    )
    .order("contribution_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(REPORT_ROW_LIMIT);

  if (!filters.includeArchived) {
    query = query.is("archived_at", null);
  }

  if (filters.contributionType && filters.contributionType !== "all") {
    query = query.eq("contribution_type", filters.contributionType);
  }

  if (filters.dateFrom) {
    query = query.gte("contribution_date", filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte("contribution_date", filters.dateTo);
  }

  const { data, error } = await query.returns<SponsorContributionReportRow[]>();

  if (error) {
    throw new Error("Impossibile generare il report contributi sponsor.");
  }

  return data
    .filter((row) => {
      const sponsor = one(row.sponsors);
      const event = one(row.events);

      return textMatches(
        [sponsor?.company_name, event?.name, row.description, row.notes],
        filters.query,
      );
    })
    .map<ReportRow>((row) => {
      const sponsor = one(row.sponsors);
      const event = one(row.events);

      return {
        contribution_id: row.id,
        sponsor_id: row.sponsor_id,
        sponsor_company_name: sponsor?.company_name ?? "Sponsor non disponibile",
        event_id: row.event_id,
        event_name: event?.name ?? null,
        contribution_date: row.contribution_date,
        contribution_type: getContributionTypeLabel(row.contribution_type),
        amount: formatAmount(row.amount),
        description: row.description,
        notes: row.notes,
        created_at: dateOnly(row.created_at),
        archived_at: dateOnly(row.archived_at),
      };
    });
}

async function buildEventsReport(filters: ReportFilters) {
  const supabase = await getSupabaseServerClientOrThrow();
  let query = supabase
    .from("events")
    .select(
      "id, name, description, start_datetime, end_datetime, location, status, created_at, archived_at",
    )
    .order("start_datetime", { ascending: false })
    .limit(REPORT_ROW_LIMIT);

  if (!filters.includeArchived) {
    query = query.is("archived_at", null);
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.dateFrom) {
    query = query.gte("start_datetime", filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte("start_datetime", `${filters.dateTo}T23:59:59.999Z`);
  }

  const { data, error } = await query.returns<EventReportRow[]>();

  if (error) {
    throw new Error("Impossibile generare il report eventi.");
  }

  const eventIds = data.map((event) => event.id);
  const [sponsorNamesByEventId, contributionSummariesByEventId] =
    await Promise.all([
      getEventSponsorNames(eventIds),
      getEventContributionSummaries(eventIds),
    ]);

  return data
    .filter((event) =>
      textMatches(
        [
          event.name,
          event.location,
          event.description,
          (sponsorNamesByEventId.get(event.id) ?? []).join(" "),
        ],
        filters.query,
      ),
    )
    .map<ReportRow>((event) => {
      const sponsorNames = sponsorNamesByEventId.get(event.id) ?? [];
      const contributionSummary = contributionSummariesByEventId.get(event.id);

      return {
        event_id: event.id,
        name: event.name,
        description: event.description,
        start_datetime: dateTimeIso(event.start_datetime),
        end_datetime: dateTimeIso(event.end_datetime),
        location: event.location,
        status: getEventStatusLabel(event.status),
        sponsors_count: sponsorNames.length,
        sponsor_names: sponsorNames.join(", "),
        linked_contributions_count: contributionSummary?.contributionsCount ?? 0,
        money_contributions_total: formatAmount(
          contributionSummary?.moneyTotal ?? 0,
        ),
        created_at: dateOnly(event.created_at),
        archived_at: dateOnly(event.archived_at),
      };
    });
}

async function getEventSponsorNames(eventIds: string[]) {
  const namesByEventId = new Map<string, string[]>();

  if (eventIds.length === 0) {
    return namesByEventId;
  }

  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("event_sponsors")
    .select("event_id, sponsors(company_name, archived_at)")
    .in("event_id", eventIds)
    .is("archived_at", null)
    .returns<EventSponsorReportRow[]>();

  if (error) {
    throw new Error("Impossibile calcolare gli sponsor evento.");
  }

  for (const row of data) {
    const sponsor = one(row.sponsors);

    if (!sponsor || sponsor.archived_at) {
      continue;
    }

    const names = namesByEventId.get(row.event_id) ?? [];
    names.push(sponsor.company_name);
    namesByEventId.set(row.event_id, names);
  }

  for (const [eventId, names] of namesByEventId.entries()) {
    namesByEventId.set(eventId, names.toSorted((left, right) => left.localeCompare(right, "it")));
  }

  return namesByEventId;
}

async function getEventContributionSummaries(eventIds: string[]) {
  const summaries = new Map<
    string,
    {
      contributionsCount: number;
      moneyTotal: number;
    }
  >();

  if (eventIds.length === 0) {
    return summaries;
  }

  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("sponsor_contributions")
    .select("event_id, amount, contribution_type")
    .in("event_id", eventIds)
    .is("archived_at", null)
    .returns<
      {
        event_id: string;
        amount: number | string;
        contribution_type: SponsorContributionType;
      }[]
    >();

  if (error) {
    throw new Error("Impossibile calcolare i contributi evento.");
  }

  for (const row of data) {
    const summary = summaries.get(row.event_id) ?? {
      contributionsCount: 0,
      moneyTotal: 0,
    };

    summary.contributionsCount += 1;

    if (row.contribution_type === SPONSOR_CONTRIBUTION_TYPE.MONEY) {
      summary.moneyTotal += toNumber(row.amount);
    }

    summaries.set(row.event_id, summary);
  }

  return summaries;
}

async function buildEmailCampaignsReport(filters: ReportFilters) {
  const supabase = await getSupabaseServerClientOrThrow();
  let query = supabase
    .from("email_campaigns")
    .select(
      "id, subject, audience_type, status, provider, recipient_snapshot_generated_at, send_confirmed_at, sent_at, failed_at, created_at, archived_at, email_templates(name, archived_at)",
    )
    .order("created_at", { ascending: false })
    .limit(REPORT_ROW_LIMIT);

  if (!filters.includeArchived) {
    query = query.is("archived_at", null);
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.audienceType && filters.audienceType !== "all") {
    query = query.eq("audience_type", filters.audienceType);
  }

  if (filters.dateFrom) {
    query = query.gte("created_at", filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte("created_at", `${filters.dateTo}T23:59:59.999Z`);
  }

  const { data, error } = await query.returns<EmailCampaignReportRow[]>();

  if (error) {
    throw new Error("Impossibile generare il report campagne email.");
  }

  const campaigns = data.filter((campaign) => {
    const template = one(campaign.email_templates);
    return textMatches([campaign.subject, template?.name], filters.query);
  });
  const countsByCampaignId = await getEmailRecipientCounts(
    campaigns.map((campaign) => campaign.id),
  );

  return campaigns.map<ReportRow>((campaign) => {
    const template = one(campaign.email_templates);
    const counts = countsByCampaignId.get(campaign.id) ?? {
      total: 0,
      pending: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
    };

    return {
      campaign_id: campaign.id,
      template_name: template?.name ?? null,
      subject: campaign.subject,
      audience_type: getAudienceTypeLabel(campaign.audience_type),
      status: getEmailCampaignStatusLabel(campaign.status),
      provider: campaign.provider,
      recipient_snapshot_generated_at: dateTimeIso(
        campaign.recipient_snapshot_generated_at,
      ),
      send_confirmed_at: dateTimeIso(campaign.send_confirmed_at),
      sent_at: dateTimeIso(campaign.sent_at),
      failed_at: dateTimeIso(campaign.failed_at),
      recipients_total: counts.total,
      recipients_pending: counts.pending,
      recipients_sent: counts.sent,
      recipients_failed: counts.failed,
      recipients_skipped: counts.skipped,
      created_at: dateOnly(campaign.created_at),
      archived_at: dateOnly(campaign.archived_at),
    };
  });
}

async function getEmailRecipientCounts(campaignIds: string[]) {
  const countsByCampaignId = new Map<
    string,
    {
      total: number;
      pending: number;
      sent: number;
      failed: number;
      skipped: number;
    }
  >();

  if (campaignIds.length === 0) {
    return countsByCampaignId;
  }

  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("email_campaign_recipients")
    .select("campaign_id, status")
    .in("campaign_id", campaignIds)
    .returns<EmailRecipientReportRow[]>();

  if (error) {
    throw new Error("Impossibile calcolare i destinatari email.");
  }

  for (const row of data) {
    const counts = countsByCampaignId.get(row.campaign_id) ?? {
      total: 0,
      pending: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
    };

    counts.total += 1;

    if (row.status === EMAIL_RECIPIENT_STATUS.PENDING) {
      counts.pending += 1;
    }

    if (row.status === EMAIL_RECIPIENT_STATUS.SENT) {
      counts.sent += 1;
    }

    if (row.status === EMAIL_RECIPIENT_STATUS.FAILED) {
      counts.failed += 1;
    }

    if (row.status === EMAIL_RECIPIENT_STATUS.SKIPPED) {
      counts.skipped += 1;
    }

    countsByCampaignId.set(row.campaign_id, counts);
  }

  return countsByCampaignId;
}

function getSponsorStatusLabel(status: SponsorStatus) {
  switch (status) {
    case SPONSOR_STATUS.ACTIVE:
      return "Attivo";
    case SPONSOR_STATUS.INACTIVE:
      return "Inattivo";
    case SPONSOR_STATUS.ARCHIVED:
      return "Archiviato";
  }
}

function getContributionTypeLabel(type: SponsorContributionType) {
  switch (type) {
    case SPONSOR_CONTRIBUTION_TYPE.MONEY:
      return "Monetario";
    case SPONSOR_CONTRIBUTION_TYPE.GOODS:
      return "Beni";
    case SPONSOR_CONTRIBUTION_TYPE.SERVICE:
      return "Servizio";
    case SPONSOR_CONTRIBUTION_TYPE.OTHER:
      return "Altro";
  }
}

function getEventStatusLabel(status: EventStatus) {
  switch (status) {
    case EVENT_STATUS.PLANNED:
      return "Pianificato";
    case EVENT_STATUS.CONFIRMED:
      return "Confermato";
    case EVENT_STATUS.COMPLETED:
      return "Completato";
    case EVENT_STATUS.CANCELLED:
      return "Annullato";
  }
}

function getAudienceTypeLabel(audienceType: EmailCampaignAudienceType) {
  switch (audienceType) {
    case EMAIL_CAMPAIGN_AUDIENCE_TYPE.ALL_MEMBERS:
      return "Tutti i soci";
    case EMAIL_CAMPAIGN_AUDIENCE_TYPE.ACTIVE_MEMBERS:
      return "Soci attivi";
    case EMAIL_CAMPAIGN_AUDIENCE_TYPE.EXPIRED_MEMBERS:
      return "Soci scaduti";
    case EMAIL_CAMPAIGN_AUDIENCE_TYPE.SPONSORS:
      return "Sponsor";
    case EMAIL_CAMPAIGN_AUDIENCE_TYPE.CUSTOM:
      return "Custom/manuale";
  }
}

function getEmailCampaignStatusLabel(status: EmailCampaignStatus) {
  switch (status) {
    case EMAIL_CAMPAIGN_STATUS.DRAFT:
      return "Bozza";
    case EMAIL_CAMPAIGN_STATUS.SENT:
      return "Inviata";
    case EMAIL_CAMPAIGN_STATUS.FAILED:
      return "Fallita";
  }
}

export function getReportColumns(reportType: ReportType): ReportColumn[] {
  return getReportDefinition(reportType).columns;
}
