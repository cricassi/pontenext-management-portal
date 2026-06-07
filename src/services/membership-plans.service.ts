import { getSupabaseServerClientOrThrow } from "@/services/supabase.service";
import type {
  MembershipPlan,
  MembershipPlanFormValues,
} from "@/types/membership";
import { parseCurrencyInput } from "@/utils/currency";
import { readBoolean, readOptionalString, readRequiredString } from "@/utils/form";

type MembershipPlanRow = {
  id: string;
  name: string;
  description: string | null;
  minimum_fee: number | string;
  default_duration_months: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

type MembershipPlanValidationResult =
  | { ok: true; values: MembershipPlanFormValues }
  | { ok: false; errors: Record<string, string>; message: string };

const membershipPlanSelect =
  "id, name, description, minimum_fee, default_duration_months, is_active, sort_order, created_at, updated_at, archived_at";

function toNumber(value: number | string) {
  return typeof value === "string" ? Number.parseFloat(value) : value;
}

function mapMembershipPlan(row: MembershipPlanRow): MembershipPlan {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    minimumFee: toNumber(row.minimum_fee),
    defaultDurationMonths: row.default_duration_months,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

export function validateMembershipPlanFormData(
  formData: FormData,
): MembershipPlanValidationResult {
  const name = readRequiredString(formData, "name");
  const description = readOptionalString(formData, "description");
  const minimumFee = parseCurrencyInput(
    readRequiredString(formData, "minimumFee"),
  );
  const defaultDurationMonths = Number.parseInt(
    readRequiredString(formData, "defaultDurationMonths"),
    10,
  );
  const sortOrder = Number.parseInt(
    readRequiredString(formData, "sortOrder") || "0",
    10,
  );
  const errors: Record<string, string> = {};

  if (!name) {
    errors.name = "Inserisci il nome del piano.";
  }

  if (!Number.isFinite(minimumFee) || minimumFee < 0) {
    errors.minimumFee = "Inserisci una quota minima maggiore o uguale a 0.";
  }

  if (!Number.isInteger(defaultDurationMonths) || defaultDurationMonths <= 0) {
    errors.defaultDurationMonths = "Inserisci una durata maggiore di 0 mesi.";
  }

  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    errors.sortOrder = "Inserisci un ordinamento maggiore o uguale a 0.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      errors,
      message: "Controlla i dati del piano iscrizione.",
    };
  }

  return {
    ok: true,
    values: {
      name,
      description,
      minimumFee,
      defaultDurationMonths,
      isActive: readBoolean(formData, "isActive"),
      sortOrder,
    },
  };
}

export async function getMembershipPlans(options?: {
  includeArchived?: boolean;
  activeOnly?: boolean;
}) {
  const supabase = await getSupabaseServerClientOrThrow();
  let query = supabase
    .from("membership_plans")
    .select(membershipPlanSelect)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (!options?.includeArchived) {
    query = query.is("archived_at", null);
  }

  if (options?.activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query.returns<MembershipPlanRow[]>();

  if (error) {
    throw new Error("Impossibile caricare i piani iscrizione.");
  }

  return data.map(mapMembershipPlan);
}

export function getActiveMembershipPlans() {
  return getMembershipPlans({ activeOnly: true });
}

export async function getMembershipPlanById(planId: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("membership_plans")
    .select(membershipPlanSelect)
    .eq("id", planId)
    .is("archived_at", null)
    .maybeSingle<MembershipPlanRow>();

  if (error) {
    throw new Error("Impossibile caricare il piano iscrizione.");
  }

  return data ? mapMembershipPlan(data) : null;
}

export async function createMembershipPlan(values: MembershipPlanFormValues) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("membership_plans")
    .insert(mapMembershipPlanValues(values))
    .select(membershipPlanSelect)
    .single<MembershipPlanRow>();

  if (error) {
    throw new Error(
      "Impossibile creare il piano. Verifica che il nome non sia gia' presente.",
    );
  }

  return mapMembershipPlan(data);
}

export async function updateMembershipPlan(
  planId: string,
  values: MembershipPlanFormValues,
) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("membership_plans")
    .update(mapMembershipPlanValues(values))
    .eq("id", planId)
    .is("archived_at", null)
    .select(membershipPlanSelect)
    .single<MembershipPlanRow>();

  if (error) {
    throw new Error(
      "Impossibile aggiornare il piano. Verifica che il nome non sia gia' presente.",
    );
  }

  return mapMembershipPlan(data);
}

export async function archiveMembershipPlan(planId: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { error } = await supabase
    .from("membership_plans")
    .update({
      is_active: false,
      archived_at: new Date().toISOString(),
    })
    .eq("id", planId)
    .is("archived_at", null);

  if (error) {
    throw new Error("Impossibile archiviare il piano iscrizione.");
  }
}

function mapMembershipPlanValues(values: MembershipPlanFormValues) {
  return {
    name: values.name,
    description: values.description,
    minimum_fee: values.minimumFee,
    default_duration_months: values.defaultDurationMonths,
    is_active: values.isActive,
    sort_order: values.sortOrder,
  };
}
