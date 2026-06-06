import { getMemberById } from "@/services/members.service";
import { getRoleById } from "@/services/roles.service";
import { getSupabaseServerClientOrThrow } from "@/services/supabase.service";
import type { MemberRoleAssignment } from "@/types/member";
import { readOptionalString, readRequiredString } from "@/utils/form";

type MemberRoleRow = {
  id: string;
  member_id: string;
  role_id: string;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  archived_at: string | null;
  roles: {
    id: string;
    name: string;
    sort_order: number;
    archived_at: string | null;
  } | null;
};

type MemberRoleValidationResult =
  | {
      ok: true;
      values: {
        roleId: string;
        startDate: string;
        endDate: string | null;
        notes: string | null;
      };
    }
  | { ok: false; errors: Record<string, string>; message: string };

function mapMemberRole(row: MemberRoleRow): MemberRoleAssignment | null {
  if (!row.roles) {
    return null;
  }

  return {
    id: row.id,
    memberId: row.member_id,
    roleId: row.role_id,
    roleName: row.roles.name,
    roleSortOrder: row.roles.sort_order,
    startDate: row.start_date,
    endDate: row.end_date,
    notes: row.notes,
    archivedAt: row.archived_at,
  };
}

export function validateMemberRoleFormData(
  formData: FormData,
): MemberRoleValidationResult {
  const roleId = readRequiredString(formData, "roleId");
  const startDate = readRequiredString(formData, "startDate");
  const endDate = readOptionalString(formData, "endDate");
  const notes = readOptionalString(formData, "notes");
  const errors: Record<string, string> = {};

  if (!roleId) {
    errors.roleId = "Seleziona un ruolo.";
  }

  if (!startDate) {
    errors.startDate = "Inserisci la data di inizio.";
  }

  if (startDate && endDate && endDate < startDate) {
    errors.endDate = "La data di fine deve essere successiva o uguale all'inizio.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      errors,
      message: "Controlla i dati dell'assegnazione.",
    };
  }

  return {
    ok: true,
    values: {
      roleId,
      startDate,
      endDate,
      notes,
    },
  };
}

export async function getMemberRoleAssignments(memberId: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("member_roles")
    .select(
      "id, member_id, role_id, start_date, end_date, notes, archived_at, roles(id, name, sort_order, archived_at)",
    )
    .eq("member_id", memberId)
    .is("archived_at", null)
    .order("start_date", { ascending: false })
    .returns<MemberRoleRow[]>();

  if (error) {
    throw new Error("Impossibile caricare le assegnazioni ruolo.");
  }

  return data
    .map(mapMemberRole)
    .filter((assignment): assignment is MemberRoleAssignment =>
      Boolean(assignment),
    );
}

export async function assignRoleToMember(
  memberId: string,
  values: {
    roleId: string;
    startDate: string;
    endDate: string | null;
    notes: string | null;
  },
) {
  const [member, role] = await Promise.all([
    getMemberById(memberId),
    getRoleById(values.roleId),
  ]);

  if (!member) {
    throw new Error("Socio non trovato.");
  }

  if (!role) {
    throw new Error("Ruolo non assegnabile.");
  }

  const supabase = await getSupabaseServerClientOrThrow();
  const { data: duplicate } = await supabase
    .from("member_roles")
    .select("id")
    .eq("member_id", memberId)
    .eq("role_id", values.roleId)
    .is("archived_at", null)
    .is("end_date", null)
    .maybeSingle<{ id: string }>();

  if (duplicate) {
    throw new Error("Questo ruolo e' gia' assegnato al socio.");
  }

  const { error } = await supabase.from("member_roles").insert({
    member_id: memberId,
    role_id: values.roleId,
    start_date: values.startDate,
    end_date: values.endDate,
    notes: values.notes,
  });

  if (error) {
    throw new Error("Impossibile assegnare il ruolo al socio.");
  }
}

export async function endMemberRoleAssignment(assignmentId: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error: fetchError } = await supabase
    .from("member_roles")
    .select("id, start_date")
    .eq("id", assignmentId)
    .is("archived_at", null)
    .maybeSingle<{ id: string; start_date: string }>();

  if (fetchError || !data) {
    throw new Error("Assegnazione ruolo non trovata.");
  }

  const today = new Date().toISOString().slice(0, 10);
  const endDate = today < data.start_date ? data.start_date : today;
  const { error } = await supabase
    .from("member_roles")
    .update({ end_date: endDate })
    .eq("id", assignmentId)
    .is("archived_at", null);

  if (error) {
    throw new Error("Impossibile terminare l'assegnazione ruolo.");
  }
}

export async function archiveMemberRoleAssignment(assignmentId: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { error } = await supabase
    .from("member_roles")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", assignmentId)
    .is("archived_at", null);

  if (error) {
    throw new Error("Impossibile archiviare l'assegnazione ruolo.");
  }
}
