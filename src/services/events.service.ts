import { getSupabaseServerClientOrThrow } from "@/services/supabase.service";
import {
  EVENT_STATUS,
  type Event,
  type EventContribution,
  type EventFilters,
  type EventFormValues,
  type EventListItem,
  type EventSponsor,
  type EventSponsorFormValues,
  type EventSponsorOption,
  type EventStatus,
  type SponsorLinkedEventOption,
} from "@/types/event";
import type { SponsorContributionType } from "@/types/sponsor";
import { readOptionalString, readRequiredString } from "@/utils/form";
import { isUuid } from "@/utils/id";

type Relation<T> = T | T[] | null;

type EventRow = {
  id: string;
  name: string;
  description: string | null;
  start_datetime: string;
  end_datetime: string | null;
  location: string | null;
  status: EventStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

type EventSponsorRow = {
  id: string;
  event_id: string;
  sponsor_id: string;
  sponsorship_level: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  sponsors: Relation<{
    company_name: string;
  }>;
};

type EventContributionRow = {
  id: string;
  event_id: string;
  sponsor_id: string;
  contribution_date: string;
  amount: number | string;
  contribution_type: SponsorContributionType;
  description: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  sponsors: Relation<{
    company_name: string;
  }>;
};

type SponsorOptionRow = {
  id: string;
  company_name: string;
};

type EventValidationResult =
  | { ok: true; values: EventFormValues }
  | { ok: false; errors: Record<string, string>; message: string };

type EventSponsorValidationResult =
  | { ok: true; values: EventSponsorFormValues }
  | { ok: false; errors: Record<string, string>; message: string };

const eventSelect =
  "id, name, description, start_datetime, end_datetime, location, status, notes, created_at, updated_at, archived_at";

const eventSponsorSelect =
  "id, event_id, sponsor_id, sponsorship_level, notes, created_at, updated_at, archived_at, sponsors(company_name)";

const eventContributionSelect =
  "id, event_id, sponsor_id, contribution_date, amount, contribution_type, description, notes, created_at, updated_at, archived_at, sponsors(company_name)";

function one<T>(relation: Relation<T>) {
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

function toNumber(value: number | string) {
  return typeof value === "string" ? Number.parseFloat(value) : value;
}

function mapEvent(row: EventRow): Event {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    startDatetime: row.start_datetime,
    endDatetime: row.end_datetime,
    location: row.location,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

function mapEventSponsor(row: EventSponsorRow): EventSponsor {
  return {
    id: row.id,
    eventId: row.event_id,
    sponsorId: row.sponsor_id,
    sponsorCompanyName: one(row.sponsors)?.company_name ?? "Sponsor",
    sponsorshipLevel: row.sponsorship_level,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

function mapEventContribution(row: EventContributionRow): EventContribution {
  return {
    id: row.id,
    eventId: row.event_id,
    sponsorId: row.sponsor_id,
    sponsorCompanyName: one(row.sponsors)?.company_name ?? "Sponsor",
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

function isEventStatus(value: string): value is EventStatus {
  return Object.values(EVENT_STATUS).includes(value as EventStatus);
}

function isValidDateTime(value: string) {
  return value.length > 0 && !Number.isNaN(new Date(value).getTime());
}

function eventMatchesQuery(event: Event, query: string) {
  const normalizedQuery = query.toLowerCase();
  const searchable = [event.name, event.location, event.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchable.includes(normalizedQuery);
}

export function validateEventFormData(formData: FormData): EventValidationResult {
  const name = readRequiredString(formData, "name");
  const description = readOptionalString(formData, "description");
  const startDatetime = readRequiredString(formData, "startDatetime");
  const endDatetime = readOptionalString(formData, "endDatetime");
  const location = readOptionalString(formData, "location");
  const status = readRequiredString(formData, "status");
  const notes = readOptionalString(formData, "notes");
  const errors: Record<string, string> = {};

  if (!name) {
    errors.name = "Inserisci il nome dell'evento.";
  }

  if (!isValidDateTime(startDatetime)) {
    errors.startDatetime = "Inserisci data e ora di inizio.";
  }

  if (endDatetime && !isValidDateTime(endDatetime)) {
    errors.endDatetime = "Inserisci una data e ora di fine valida.";
  }

  if (
    isValidDateTime(startDatetime) &&
    endDatetime &&
    isValidDateTime(endDatetime) &&
    new Date(endDatetime) < new Date(startDatetime)
  ) {
    errors.endDatetime = "La fine evento non puo' precedere l'inizio.";
  }

  if (!isEventStatus(status)) {
    errors.status = "Seleziona uno stato evento valido.";
  }

  if (
    Object.keys(errors).length > 0 ||
    !isEventStatus(status) ||
    !isValidDateTime(startDatetime)
  ) {
    return {
      ok: false,
      errors,
      message: "Controlla i dati dell'evento.",
    };
  }

  return {
    ok: true,
    values: {
      name,
      description,
      startDatetime: new Date(startDatetime).toISOString(),
      endDatetime: endDatetime ? new Date(endDatetime).toISOString() : null,
      location,
      status,
      notes,
    },
  };
}

export function validateEventSponsorFormData(
  formData: FormData,
): EventSponsorValidationResult {
  const sponsorId = readRequiredString(formData, "sponsorId");
  const sponsorshipLevel = readOptionalString(formData, "sponsorshipLevel");
  const notes = readOptionalString(formData, "notes");
  const errors: Record<string, string> = {};

  if (!isUuid(sponsorId)) {
    errors.sponsorId = "Seleziona uno sponsor valido.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      errors,
      message: "Controlla il collegamento sponsor-evento.",
    };
  }

  return {
    ok: true,
    values: {
      sponsorId,
      sponsorshipLevel,
      notes,
    },
  };
}

export async function getEvents(filters: EventFilters = {}) {
  const supabase = await getSupabaseServerClientOrThrow();
  let query = supabase
    .from("events")
    .select(eventSelect)
    .is("archived_at", null)
    .order("start_datetime", { ascending: false });

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query.returns<EventRow[]>();

  if (error) {
    throw new Error("Impossibile caricare gli eventi.");
  }

  let events = data.map(mapEvent);

  if (filters.query) {
    events = events.filter((event) =>
      eventMatchesQuery(event, filters.query ?? ""),
    );
  }

  const eventIds = events.map((event) => event.id);
  const [sponsorCounts, contributionSummaries] = await Promise.all([
    getEventSponsorCounts(eventIds),
    getEventContributionSummaries(eventIds),
  ]);

  return events.map<EventListItem>((event) => ({
    ...event,
    sponsorCount: sponsorCounts.get(event.id) ?? 0,
    contributionCount:
      contributionSummaries.get(event.id)?.contributionCount ?? 0,
    totalMoneyAmount: contributionSummaries.get(event.id)?.totalMoneyAmount ?? 0,
  }));
}

export async function getEventById(eventId: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("events")
    .select(eventSelect)
    .eq("id", eventId)
    .is("archived_at", null)
    .maybeSingle<EventRow>();

  if (error) {
    throw new Error("Impossibile caricare l'evento.");
  }

  return data ? mapEvent(data) : null;
}

export async function createEvent(values: EventFormValues) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("events")
    .insert(mapEventValues(values))
    .select(eventSelect)
    .single<EventRow>();

  if (error) {
    throw new Error("Impossibile creare l'evento.");
  }

  return mapEvent(data);
}

export async function updateEvent(eventId: string, values: EventFormValues) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("events")
    .update(mapEventValues(values))
    .eq("id", eventId)
    .is("archived_at", null)
    .select(eventSelect)
    .single<EventRow>();

  if (error) {
    throw new Error("Impossibile aggiornare l'evento.");
  }

  return mapEvent(data);
}

export async function archiveEvent(eventId: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { error } = await supabase
    .from("events")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", eventId)
    .is("archived_at", null);

  if (error) {
    throw new Error("Impossibile archiviare l'evento.");
  }
}

export async function getEventSponsors(eventId: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("event_sponsors")
    .select(eventSponsorSelect)
    .eq("event_id", eventId)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .returns<EventSponsorRow[]>();

  if (error) {
    throw new Error("Impossibile caricare gli sponsor evento.");
  }

  return data.map(mapEventSponsor);
}

export async function getEventSponsorById(eventId: string, linkId: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("event_sponsors")
    .select(eventSponsorSelect)
    .eq("id", linkId)
    .eq("event_id", eventId)
    .is("archived_at", null)
    .maybeSingle<EventSponsorRow>();

  if (error) {
    throw new Error("Impossibile caricare il collegamento sponsor.");
  }

  return data ? mapEventSponsor(data) : null;
}

export async function linkSponsorToEvent(
  eventId: string,
  values: EventSponsorFormValues,
) {
  await ensureActiveEvent(eventId);
  await ensureActiveSponsor(values.sponsorId);

  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("event_sponsors")
    .insert({
      event_id: eventId,
      sponsor_id: values.sponsorId,
      sponsorship_level: values.sponsorshipLevel,
      notes: values.notes,
    })
    .select(eventSponsorSelect)
    .single<EventSponsorRow>();

  if (error) {
    throw new Error("Impossibile collegare lo sponsor all'evento.");
  }

  return mapEventSponsor(data);
}

export async function updateEventSponsor(
  eventId: string,
  linkId: string,
  values: EventSponsorFormValues,
) {
  await ensureActiveEvent(eventId);
  await ensureActiveSponsor(values.sponsorId);

  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("event_sponsors")
    .update({
      sponsor_id: values.sponsorId,
      sponsorship_level: values.sponsorshipLevel,
      notes: values.notes,
    })
    .eq("id", linkId)
    .eq("event_id", eventId)
    .is("archived_at", null)
    .select(eventSponsorSelect)
    .single<EventSponsorRow>();

  if (error) {
    throw new Error("Impossibile aggiornare il collegamento sponsor.");
  }

  return mapEventSponsor(data);
}

export async function archiveEventSponsor(eventId: string, linkId: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { error } = await supabase
    .from("event_sponsors")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", linkId)
    .eq("event_id", eventId)
    .is("archived_at", null);

  if (error) {
    throw new Error("Impossibile archiviare il collegamento sponsor.");
  }
}

export async function getAvailableSponsorsForEvent(eventId: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const [sponsorsResult, linksResult] = await Promise.all([
    supabase
      .from("sponsors")
      .select("id, company_name")
      .eq("status", "active")
      .is("archived_at", null)
      .order("company_name", { ascending: true })
      .returns<SponsorOptionRow[]>(),
    supabase
      .from("event_sponsors")
      .select("sponsor_id")
      .eq("event_id", eventId)
      .is("archived_at", null)
      .returns<{ sponsor_id: string }[]>(),
  ]);

  if (sponsorsResult.error || linksResult.error) {
    throw new Error("Impossibile caricare gli sponsor disponibili.");
  }

  const linkedSponsorIds = new Set(
    linksResult.data.map((link) => link.sponsor_id),
  );

  return sponsorsResult.data
    .filter((sponsor) => !linkedSponsorIds.has(sponsor.id))
    .map<EventSponsorOption>((sponsor) => ({
      id: sponsor.id,
      companyName: sponsor.company_name,
    }));
}

export async function getEventContributions(eventId: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("sponsor_contributions")
    .select(eventContributionSelect)
    .eq("event_id", eventId)
    .is("archived_at", null)
    .order("contribution_date", { ascending: false })
    .returns<EventContributionRow[]>();

  if (error) {
    throw new Error("Impossibile caricare i contributi evento.");
  }

  return data.map(mapEventContribution);
}

export async function getLinkedEventOptionsForSponsor(sponsorId: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data: links, error: linksError } = await supabase
    .from("event_sponsors")
    .select("event_id")
    .eq("sponsor_id", sponsorId)
    .is("archived_at", null)
    .returns<{ event_id: string }[]>();

  if (linksError) {
    throw new Error("Impossibile caricare gli eventi collegati.");
  }

  const eventIds = links.map((link) => link.event_id);

  if (eventIds.length === 0) {
    return [];
  }

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, name, start_datetime")
    .in("id", eventIds)
    .is("archived_at", null)
    .order("start_datetime", { ascending: false })
    .returns<Pick<EventRow, "id" | "name" | "start_datetime">[]>();

  if (eventsError) {
    throw new Error("Impossibile caricare gli eventi collegati.");
  }

  return events.map<SponsorLinkedEventOption>((event) => ({
    id: event.id,
    name: event.name,
    startDatetime: event.start_datetime,
  }));
}

export async function getSponsorEvents(sponsorId: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("event_sponsors")
    .select(`${eventSponsorSelect}, events(${eventSelect})`)
    .eq("sponsor_id", sponsorId)
    .is("archived_at", null)
    .returns<(EventSponsorRow & { events: Relation<EventRow> })[]>();

  if (error) {
    throw new Error("Impossibile caricare gli eventi dello sponsor.");
  }

  return data
    .map((row) => one(row.events))
    .filter((event): event is EventRow => Boolean(event))
    .filter((event) => event.archived_at === null)
    .map(mapEvent);
}

async function getEventSponsorCounts(eventIds: string[]) {
  const counts = new Map<string, number>();

  if (eventIds.length === 0) {
    return counts;
  }

  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("event_sponsors")
    .select("event_id")
    .in("event_id", eventIds)
    .is("archived_at", null)
    .returns<{ event_id: string }[]>();

  if (error) {
    throw new Error("Impossibile calcolare gli sponsor evento.");
  }

  for (const row of data) {
    counts.set(row.event_id, (counts.get(row.event_id) ?? 0) + 1);
  }

  return counts;
}

async function getEventContributionSummaries(eventIds: string[]) {
  const summaries = new Map<
    string,
    {
      contributionCount: number;
      totalMoneyAmount: number;
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
    const current = summaries.get(row.event_id) ?? {
      contributionCount: 0,
      totalMoneyAmount: 0,
    };

    current.contributionCount += 1;

    if (row.contribution_type === "money") {
      current.totalMoneyAmount += toNumber(row.amount);
    }

    summaries.set(row.event_id, current);
  }

  return summaries;
}

async function ensureActiveEvent(eventId: string) {
  const event = await getEventById(eventId);

  if (!event) {
    throw new Error("Evento non trovato.");
  }
}

async function ensureActiveSponsor(sponsorId: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("sponsors")
    .select("id")
    .eq("id", sponsorId)
    .eq("status", "active")
    .is("archived_at", null)
    .maybeSingle<{ id: string }>();

  if (error || !data) {
    throw new Error("Sponsor non trovato o non attivo.");
  }
}

function mapEventValues(values: EventFormValues) {
  return {
    name: values.name,
    description: values.description,
    start_datetime: values.startDatetime,
    end_datetime: values.endDatetime,
    location: values.location,
    status: values.status,
    notes: values.notes,
  };
}
