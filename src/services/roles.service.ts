import { getSupabaseServerClientOrThrow } from "@/services/supabase.service";
import type { Role, RoleFormValues } from "@/types/role";
import { readBoolean, readOptionalString, readRequiredString } from "@/utils/form";

type RoleRow = {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

type RoleValidationResult =
  | { ok: true; values: RoleFormValues }
  | { ok: false; errors: Record<string, string>; message: string };

function mapRole(row: RoleRow): Role {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isDefault: row.is_default,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

export function validateRoleFormData(formData: FormData): RoleValidationResult {
  const name = readRequiredString(formData, "name");
  const description = readOptionalString(formData, "description");
  const sortOrderValue = readRequiredString(formData, "sortOrder") || "0";
  const sortOrder = Number.parseInt(sortOrderValue, 10);
  const errors: Record<string, string> = {};

  if (!name) {
    errors.name = "Inserisci il nome del ruolo.";
  }

  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    errors.sortOrder = "Inserisci un ordinamento maggiore o uguale a 0.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      errors,
      message: "Controlla i dati del ruolo.",
    };
  }

  return {
    ok: true,
    values: {
      name,
      description,
      isDefault: readBoolean(formData, "isDefault"),
      sortOrder,
    },
  };
}

export async function getRoles(options?: { includeArchived?: boolean }) {
  const supabase = await getSupabaseServerClientOrThrow();
  let query = supabase
    .from("roles")
    .select("id, name, description, is_default, sort_order, created_at, updated_at, archived_at")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (!options?.includeArchived) {
    query = query.is("archived_at", null);
  }

  const { data, error } = await query.returns<RoleRow[]>();

  if (error) {
    throw new Error("Impossibile caricare i ruoli.");
  }

  return data.map(mapRole);
}

export async function getAssignableRoles() {
  return getRoles();
}

export async function getRoleById(roleId: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("roles")
    .select("id, name, description, is_default, sort_order, created_at, updated_at, archived_at")
    .eq("id", roleId)
    .is("archived_at", null)
    .maybeSingle<RoleRow>();

  if (error) {
    throw new Error("Impossibile caricare il ruolo.");
  }

  return data ? mapRole(data) : null;
}

export async function createRole(values: RoleFormValues) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("roles")
    .insert({
      name: values.name,
      description: values.description,
      is_default: values.isDefault,
      sort_order: values.sortOrder,
    })
    .select("id, name, description, is_default, sort_order, created_at, updated_at, archived_at")
    .single<RoleRow>();

  if (error) {
    throw new Error("Impossibile creare il ruolo. Verifica che il nome non sia gia' presente.");
  }

  return mapRole(data);
}

export async function updateRole(roleId: string, values: RoleFormValues) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("roles")
    .update({
      name: values.name,
      description: values.description,
      is_default: values.isDefault,
      sort_order: values.sortOrder,
    })
    .eq("id", roleId)
    .is("archived_at", null)
    .select("id, name, description, is_default, sort_order, created_at, updated_at, archived_at")
    .single<RoleRow>();

  if (error) {
    throw new Error("Impossibile aggiornare il ruolo. Verifica che il nome non sia gia' presente.");
  }

  return mapRole(data);
}

export async function archiveRole(roleId: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { error } = await supabase
    .from("roles")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", roleId)
    .is("archived_at", null);

  if (error) {
    throw new Error("Impossibile archiviare il ruolo.");
  }
}
