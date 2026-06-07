import { getSupabaseServerClientOrThrow } from "@/services/supabase.service";
import {
  SPONSOR_CONTRIBUTION_TYPE,
  SPONSOR_STATUS,
  type Sponsor,
  type SponsorContribution,
  type SponsorContributionFormValues,
  type SponsorContributionType,
  type SponsorFilters,
  type SponsorFormValues,
  type SponsorListItem,
  type SponsorStatus,
} from "@/types/sponsor";
import { parseCurrencyInput } from "@/utils/currency";
import { getTodayDateInputValue } from "@/utils/date";
import { readOptionalString, readRequiredString } from "@/utils/form";
import { isUuid } from "@/utils/id";

type Relation<T> = T | T[] | null;

type SponsorRow = {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  vat_number: string | null;
  fiscal_code: string | null;
  notes: string | null;
  status: SponsorStatus;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

type SponsorContributionRow = {
  id: string;
  sponsor_id: string;
  event_id: string | null;
  contribution_date: string;
  amount: number | string;
  contribution_type: SponsorContributionType;
  description: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  events: Relation<{
    name: string;
    start_datetime: string;
  }>;
};

type SponsorValidationResult =
  | { ok: true; values: SponsorFormValues }
  | { ok: false; errors: Record<string, string>; message: string };

type SponsorContributionValidationResult =
  | { ok: true; values: SponsorContributionFormValues }
  | { ok: false; errors: Record<string, string>; message: string };

const sponsorSelect =
  "id, company_name, contact_name, email, phone, website, address, city, vat_number, fiscal_code, notes, status, created_at, updated_at, archived_at";

const sponsorContributionSelect =
  "id, sponsor_id, event_id, contribution_date, amount, contribution_type, description, notes, created_at, updated_at, archived_at, events(name, start_datetime)";

function toNumber(value: number | string) {
  return typeof value === "string" ? Number.parseFloat(value) : value;
}

function one<T>(relation: Relation<T>) {
  return Array.isArray(relation) ? (relation[0] ?? null) : relation;
}

function mapSponsor(row: SponsorRow): Sponsor {
  return {
    id: row.id,
    companyName: row.company_name,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone,
    website: row.website,
    address: row.address,
    city: row.city,
    vatNumber: row.vat_number,
    fiscalCode: row.fiscal_code,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

function mapSponsorContribution(
  row: SponsorContributionRow,
): SponsorContribution {
  const event = one(row.events);

  return {
    id: row.id,
    sponsorId: row.sponsor_id,
    eventId: row.event_id,
    eventName: event?.name ?? null,
    eventStartDatetime: event?.start_datetime ?? null,
    contributionDate: row.contribution_date,
    amount: toNumber(row.amount),
    contributionType: row.contribution_type,
    description: row.description,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

function isSponsorStatus(value: string): value is SponsorStatus {
  return Object.values(SPONSOR_STATUS).includes(value as SponsorStatus);
}

function isContributionType(value: string): value is SponsorContributionType {
  return Object.values(SPONSOR_CONTRIBUTION_TYPE).includes(
    value as SponsorContributionType,
  );
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function sponsorMatchesQuery(sponsor: Sponsor, query: string) {
  const normalizedQuery = query.toLowerCase();
  const searchable = [
    sponsor.companyName,
    sponsor.contactName,
    sponsor.email,
    sponsor.phone,
    sponsor.city,
    sponsor.vatNumber,
    sponsor.fiscalCode,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchable.includes(normalizedQuery);
}

export function validateSponsorFormData(
  formData: FormData,
): SponsorValidationResult {
  const companyName = readRequiredString(formData, "companyName");
  const contactName = readOptionalString(formData, "contactName");
  const email = readOptionalString(formData, "email")?.toLowerCase() ?? null;
  const phone = readOptionalString(formData, "phone");
  const website = readOptionalString(formData, "website");
  const address = readOptionalString(formData, "address");
  const city = readOptionalString(formData, "city");
  const vatNumber = readOptionalString(formData, "vatNumber");
  const fiscalCode =
    readOptionalString(formData, "fiscalCode")?.toUpperCase() ?? null;
  const notes = readOptionalString(formData, "notes");
  const status = readRequiredString(formData, "status");
  const errors: Record<string, string> = {};

  if (!companyName) {
    errors.companyName = "Inserisci la ragione sociale.";
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Inserisci un indirizzo email valido.";
  }

  if (website && !isHttpUrl(website)) {
    errors.website = "Inserisci un URL valido con http o https.";
  }

  if (!isSponsorStatus(status)) {
    errors.status = "Seleziona uno stato sponsor valido.";
  }

  if (Object.keys(errors).length > 0 || !isSponsorStatus(status)) {
    return {
      ok: false,
      errors,
      message: "Controlla i dati dello sponsor.",
    };
  }

  return {
    ok: true,
    values: {
      companyName,
      contactName,
      email,
      phone,
      website,
      address,
      city,
      vatNumber,
      fiscalCode,
      notes,
      status,
    },
  };
}

export function validateSponsorContributionFormData(
  formData: FormData,
): SponsorContributionValidationResult {
  const contributionDate =
    readRequiredString(formData, "contributionDate") || getTodayDateInputValue();
  const amount = parseCurrencyInput(readRequiredString(formData, "amount") || "0");
  const contributionType = readRequiredString(formData, "contributionType");
  const eventId = readOptionalString(formData, "eventId");
  const description = readOptionalString(formData, "description");
  const notes = readOptionalString(formData, "notes");
  const errors: Record<string, string> = {};

  if (!contributionDate) {
    errors.contributionDate = "Inserisci la data del contributo.";
  }

  if (!isContributionType(contributionType)) {
    errors.contributionType = "Seleziona un tipo contributo valido.";
  }

  if (!Number.isFinite(amount) || amount < 0) {
    errors.amount = "Inserisci un importo maggiore o uguale a 0.";
  }

  if (eventId && !isUuid(eventId)) {
    errors.eventId = "Seleziona un evento valido.";
  }

  if (
    contributionType === SPONSOR_CONTRIBUTION_TYPE.MONEY &&
    (!Number.isFinite(amount) || amount <= 0)
  ) {
    errors.amount = "I contributi monetari richiedono un importo maggiore di 0.";
  }

  if (
    isContributionType(contributionType) &&
    contributionType !== SPONSOR_CONTRIBUTION_TYPE.MONEY &&
    !description
  ) {
    errors.description =
      "Descrivi il contributo non monetario ricevuto dallo sponsor.";
  }

  if (
    Object.keys(errors).length > 0 ||
    !isContributionType(contributionType)
  ) {
    return {
      ok: false,
      errors,
      message: "Controlla i dati del contributo.",
    };
  }

  return {
    ok: true,
    values: {
      contributionDate,
      amount,
      contributionType,
      eventId,
      description,
      notes,
    },
  };
}

export async function getSponsors(filters: SponsorFilters = {}) {
  const supabase = await getSupabaseServerClientOrThrow();
  let query = supabase
    .from("sponsors")
    .select(sponsorSelect)
    .is("archived_at", null)
    .order("company_name", { ascending: true });

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query.returns<SponsorRow[]>();

  if (error) {
    throw new Error("Impossibile caricare gli sponsor.");
  }

  let sponsors = data.map(mapSponsor);

  if (filters.query) {
    sponsors = sponsors.filter((sponsor) =>
      sponsorMatchesQuery(sponsor, filters.query ?? ""),
    );
  }

  const summaries = await getContributionSummariesBySponsorIds(
    sponsors.map((sponsor) => sponsor.id),
  );

  return sponsors.map<SponsorListItem>((sponsor) => ({
    ...sponsor,
    contributionCount: summaries.get(sponsor.id)?.contributionCount ?? 0,
    totalMoneyAmount: summaries.get(sponsor.id)?.totalMoneyAmount ?? 0,
    latestContributionDate:
      summaries.get(sponsor.id)?.latestContributionDate ?? null,
  }));
}

export async function getSponsorById(sponsorId: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("sponsors")
    .select(sponsorSelect)
    .eq("id", sponsorId)
    .is("archived_at", null)
    .maybeSingle<SponsorRow>();

  if (error) {
    throw new Error("Impossibile caricare lo sponsor.");
  }

  return data ? mapSponsor(data) : null;
}

export async function createSponsor(values: SponsorFormValues) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("sponsors")
    .insert(mapSponsorValues(values))
    .select(sponsorSelect)
    .single<SponsorRow>();

  if (error) {
    throw new Error("Impossibile creare lo sponsor.");
  }

  return mapSponsor(data);
}

export async function updateSponsor(
  sponsorId: string,
  values: SponsorFormValues,
) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("sponsors")
    .update(mapSponsorValues(values))
    .eq("id", sponsorId)
    .is("archived_at", null)
    .select(sponsorSelect)
    .single<SponsorRow>();

  if (error) {
    throw new Error("Impossibile aggiornare lo sponsor.");
  }

  return mapSponsor(data);
}

export async function archiveSponsor(sponsorId: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { error } = await supabase
    .from("sponsors")
    .update({
      status: SPONSOR_STATUS.ARCHIVED,
      archived_at: new Date().toISOString(),
    })
    .eq("id", sponsorId)
    .is("archived_at", null);

  if (error) {
    throw new Error("Impossibile archiviare lo sponsor.");
  }
}

export async function getSponsorContributions(sponsorId: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("sponsor_contributions")
    .select(sponsorContributionSelect)
    .eq("sponsor_id", sponsorId)
    .is("archived_at", null)
    .order("contribution_date", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<SponsorContributionRow[]>();

  if (error) {
    throw new Error("Impossibile caricare i contributi sponsor.");
  }

  return data.map(mapSponsorContribution);
}

export async function getSponsorContributionById(
  sponsorId: string,
  contributionId: string,
) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("sponsor_contributions")
    .select(sponsorContributionSelect)
    .eq("id", contributionId)
    .eq("sponsor_id", sponsorId)
    .is("archived_at", null)
    .maybeSingle<SponsorContributionRow>();

  if (error) {
    throw new Error("Impossibile caricare il contributo sponsor.");
  }

  return data ? mapSponsorContribution(data) : null;
}

export async function createSponsorContribution(
  sponsorId: string,
  values: SponsorContributionFormValues,
) {
  const sponsor = await getSponsorById(sponsorId);

  if (!sponsor) {
    throw new Error("Sponsor non trovato.");
  }

  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("sponsor_contributions")
    .insert({
      sponsor_id: sponsorId,
      ...mapSponsorContributionValues(values),
    })
    .select(sponsorContributionSelect)
    .single<SponsorContributionRow>();

  if (error) {
    throw new Error("Impossibile creare il contributo sponsor.");
  }

  return mapSponsorContribution(data);
}

export async function updateSponsorContribution(
  sponsorId: string,
  contributionId: string,
  values: SponsorContributionFormValues,
) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("sponsor_contributions")
    .update(mapSponsorContributionValues(values))
    .eq("id", contributionId)
    .eq("sponsor_id", sponsorId)
    .is("archived_at", null)
    .select(sponsorContributionSelect)
    .single<SponsorContributionRow>();

  if (error) {
    throw new Error("Impossibile aggiornare il contributo sponsor.");
  }

  return mapSponsorContribution(data);
}

export async function archiveSponsorContribution(
  sponsorId: string,
  contributionId: string,
) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { error } = await supabase
    .from("sponsor_contributions")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", contributionId)
    .eq("sponsor_id", sponsorId)
    .is("archived_at", null);

  if (error) {
    throw new Error("Impossibile archiviare il contributo sponsor.");
  }
}

async function getContributionSummariesBySponsorIds(sponsorIds: string[]) {
  const summaries = new Map<
    string,
    {
      contributionCount: number;
      totalMoneyAmount: number;
      latestContributionDate: string | null;
    }
  >();

  if (sponsorIds.length === 0) {
    return summaries;
  }

  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("sponsor_contributions")
    .select("sponsor_id, contribution_date, amount, contribution_type")
    .in("sponsor_id", sponsorIds)
    .is("archived_at", null)
    .returns<
      Pick<
        SponsorContributionRow,
        "sponsor_id" | "contribution_date" | "amount" | "contribution_type"
      >[]
    >();

  if (error) {
    throw new Error("Impossibile calcolare i contributi sponsor.");
  }

  for (const row of data) {
    const current = summaries.get(row.sponsor_id) ?? {
      contributionCount: 0,
      totalMoneyAmount: 0,
      latestContributionDate: null,
    };

    current.contributionCount += 1;

    if (row.contribution_type === SPONSOR_CONTRIBUTION_TYPE.MONEY) {
      current.totalMoneyAmount += toNumber(row.amount);
    }

    if (
      !current.latestContributionDate ||
      row.contribution_date > current.latestContributionDate
    ) {
      current.latestContributionDate = row.contribution_date;
    }

    summaries.set(row.sponsor_id, current);
  }

  return summaries;
}

function mapSponsorValues(values: SponsorFormValues) {
  return {
    company_name: values.companyName,
    contact_name: values.contactName,
    email: values.email,
    phone: values.phone,
    website: values.website,
    address: values.address,
    city: values.city,
    vat_number: values.vatNumber,
    fiscal_code: values.fiscalCode,
    notes: values.notes,
    status: values.status,
  };
}

function mapSponsorContributionValues(values: SponsorContributionFormValues) {
  return {
    contribution_date: values.contributionDate,
    amount: values.amount,
    contribution_type: values.contributionType,
    event_id: values.eventId,
    description: values.description,
    notes: values.notes,
  };
}
