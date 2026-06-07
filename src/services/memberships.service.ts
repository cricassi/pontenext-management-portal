import { getMembershipPlanById } from "@/services/membership-plans.service";
import { getMemberById } from "@/services/members.service";
import { getSupabaseServerClientOrThrow } from "@/services/supabase.service";
import {
  MEMBERSHIP_STATUS,
  type Membership,
  type MembershipFilters,
  type MembershipFormValues,
  type MembershipStatus,
} from "@/types/membership";
import type { PaymentStatus } from "@/types/payment";
import { parseCurrencyInput } from "@/utils/currency";
import { addDaysToDateInputValue, getTodayDateInputValue } from "@/utils/date";
import { readOptionalString, readRequiredString } from "@/utils/form";

type MembershipRow = {
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
  notes: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  members: {
    id: string;
    first_name: string;
    last_name: string;
    archived_at: string | null;
  } | null;
  membership_plans: {
    id: string;
    name: string;
    archived_at: string | null;
  } | null;
};

type MembershipValidationResult =
  | { ok: true; values: MembershipFormValues }
  | { ok: false; errors: Record<string, string>; message: string };

const membershipSelect =
  "id, member_id, membership_plan_id, start_date, end_date, minimum_fee, expected_fee, paid_amount, payment_status, status, notes, created_at, updated_at, archived_at, members(id, first_name, last_name, archived_at), membership_plans(id, name, archived_at)";

function toNumber(value: number | string) {
  return typeof value === "string" ? Number.parseFloat(value) : value;
}

function getEffectiveMembershipStatus(
  status: MembershipStatus,
  endDate: string,
): MembershipStatus {
  if (status === MEMBERSHIP_STATUS.CANCELLED) {
    return MEMBERSHIP_STATUS.CANCELLED;
  }

  return endDate < getTodayDateInputValue()
    ? MEMBERSHIP_STATUS.EXPIRED
    : MEMBERSHIP_STATUS.ACTIVE;
}

function mapMembership(row: MembershipRow): Membership {
  const memberName = row.members
    ? `${row.members.first_name} ${row.members.last_name}`
    : "Socio non disponibile";

  return {
    id: row.id,
    memberId: row.member_id,
    memberName,
    membershipPlanId: row.membership_plan_id,
    membershipPlanName: row.membership_plans?.name ?? null,
    startDate: row.start_date,
    endDate: row.end_date,
    minimumFee: toNumber(row.minimum_fee),
    expectedFee: toNumber(row.expected_fee),
    paidAmount: toNumber(row.paid_amount),
    paymentStatus: row.payment_status,
    status: getEffectiveMembershipStatus(row.status, row.end_date),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

function membershipMatchesQuery(membership: Membership, query: string) {
  const normalizedQuery = query.toLowerCase();
  const searchable = [
    membership.memberName,
    membership.membershipPlanName,
    membership.notes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchable.includes(normalizedQuery);
}

function getStoredMembershipStatus(endDate: string): MembershipStatus {
  return endDate < getTodayDateInputValue()
    ? MEMBERSHIP_STATUS.EXPIRED
    : MEMBERSHIP_STATUS.ACTIVE;
}

export function validateMembershipFormData(
  formData: FormData,
): MembershipValidationResult {
  const memberId = readRequiredString(formData, "memberId");
  const membershipPlanId = readOptionalString(formData, "membershipPlanId");
  const startDate = readRequiredString(formData, "startDate");
  const endDate = readRequiredString(formData, "endDate");
  const minimumFee = parseCurrencyInput(readRequiredString(formData, "minimumFee"));
  const expectedFee = parseCurrencyInput(
    readRequiredString(formData, "expectedFee"),
  );
  const notes = readOptionalString(formData, "notes");
  const errors: Record<string, string> = {};

  if (!memberId) {
    errors.memberId = "Seleziona un socio.";
  }

  if (!startDate) {
    errors.startDate = "Inserisci la data di inizio.";
  }

  if (!endDate) {
    errors.endDate = "Inserisci la data di fine.";
  }

  if (startDate && endDate && endDate < startDate) {
    errors.endDate = "La data di fine deve essere successiva o uguale all'inizio.";
  }

  if (!Number.isFinite(minimumFee) || minimumFee < 0) {
    errors.minimumFee = "Inserisci una quota minima maggiore o uguale a 0.";
  }

  if (!Number.isFinite(expectedFee) || expectedFee < 0) {
    errors.expectedFee = "Inserisci una quota prevista maggiore o uguale a 0.";
  }

  if (Number.isFinite(expectedFee) && expectedFee === 0 && !notes) {
    errors.notes = "Indica nelle note il motivo della quota prevista pari a 0.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      errors,
      message: "Controlla i dati dell'iscrizione.",
    };
  }

  return {
    ok: true,
    values: {
      memberId,
      membershipPlanId,
      startDate,
      endDate,
      minimumFee,
      expectedFee,
      notes,
    },
  };
}

export async function getMemberships(filters: MembershipFilters = {}) {
  const supabase = await getSupabaseServerClientOrThrow();
  let query = supabase
    .from("memberships")
    .select(membershipSelect)
    .is("archived_at", null)
    .order("end_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.paymentStatus && filters.paymentStatus !== "all") {
    query = query.eq("payment_status", filters.paymentStatus);
  }

  const { data, error } = await query.returns<MembershipRow[]>();

  if (error) {
    throw new Error("Impossibile caricare le iscrizioni.");
  }

  let memberships = data.map(mapMembership);

  if (filters.status && filters.status !== "all") {
    memberships = memberships.filter(
      (membership) => membership.status === filters.status,
    );
  }

  if (filters.query) {
    memberships = memberships.filter((membership) =>
      membershipMatchesQuery(membership, filters.query ?? ""),
    );
  }

  return memberships;
}

export async function getMembershipById(membershipId: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("memberships")
    .select(membershipSelect)
    .eq("id", membershipId)
    .is("archived_at", null)
    .maybeSingle<MembershipRow>();

  if (error) {
    throw new Error("Impossibile caricare l'iscrizione.");
  }

  return data ? mapMembership(data) : null;
}

export async function getMembershipsByMemberId(memberId: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("memberships")
    .select(membershipSelect)
    .eq("member_id", memberId)
    .is("archived_at", null)
    .order("end_date", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<MembershipRow[]>();

  if (error) {
    throw new Error("Impossibile caricare lo storico iscrizioni.");
  }

  return data.map(mapMembership);
}

export async function getNextMembershipStartDate(memberId: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("memberships")
    .select("end_date")
    .eq("member_id", memberId)
    .is("archived_at", null)
    .neq("status", MEMBERSHIP_STATUS.CANCELLED)
    .order("end_date", { ascending: false })
    .limit(1)
    .maybeSingle<{ end_date: string }>();

  if (error) {
    throw new Error("Impossibile calcolare la prossima data di iscrizione.");
  }

  if (!data) {
    return getTodayDateInputValue();
  }

  return addDaysToDateInputValue(data.end_date, 1);
}

export async function createMembership(values: MembershipFormValues) {
  const [member, plan] = await Promise.all([
    getMemberById(values.memberId),
    values.membershipPlanId
      ? getMembershipPlanById(values.membershipPlanId)
      : Promise.resolve(null),
  ]);

  if (!member) {
    throw new Error("Socio non trovato.");
  }

  if (values.membershipPlanId && (!plan || !plan.isActive)) {
    throw new Error("Piano iscrizione non selezionabile.");
  }

  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("memberships")
    .insert({
      member_id: values.memberId,
      membership_plan_id: values.membershipPlanId,
      start_date: values.startDate,
      end_date: values.endDate,
      minimum_fee: values.minimumFee,
      expected_fee: values.expectedFee,
      notes: values.notes,
      status: getStoredMembershipStatus(values.endDate),
    })
    .select(membershipSelect)
    .single<MembershipRow>();

  if (error) {
    throw new Error("Impossibile creare l'iscrizione.");
  }

  return mapMembership(data);
}

export async function renewMembership(values: MembershipFormValues) {
  return createMembership(values);
}

export async function cancelMembership(membershipId: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { error } = await supabase
    .from("memberships")
    .update({ status: MEMBERSHIP_STATUS.CANCELLED })
    .eq("id", membershipId)
    .is("archived_at", null);

  if (error) {
    throw new Error("Impossibile annullare l'iscrizione.");
  }
}

export async function archiveMembership(membershipId: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { error } = await supabase
    .from("memberships")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", membershipId)
    .is("archived_at", null);

  if (error) {
    throw new Error("Impossibile archiviare l'iscrizione.");
  }
}
