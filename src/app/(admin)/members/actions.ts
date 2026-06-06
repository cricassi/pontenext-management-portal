"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  archiveMember,
  createMember,
  updateMember,
  validateMemberFormData,
} from "@/services/members.service";
import {
  archiveMemberRoleAssignment,
  assignRoleToMember,
  endMemberRoleAssignment,
  validateMemberRoleFormData,
} from "@/services/member-roles.service";
import { requireActiveAdmin } from "@/services/admin-auth.service";
import type { FormState } from "@/types/form";

export async function createMemberAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireActiveAdmin();
  const validation = validateMemberFormData(formData);

  if (!validation.ok) {
    return {
      message: validation.message,
      errors: validation.errors,
    };
  }

  let memberId = "";

  try {
    const member = await createMember(validation.values);
    memberId = member.id;
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Errore salvataggio socio.",
      errors: {},
    };
  }

  revalidatePath("/members");
  redirect(`/members/${memberId}`);
}

export async function updateMemberAction(
  memberId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireActiveAdmin();
  const validation = validateMemberFormData(formData);

  if (!validation.ok) {
    return {
      message: validation.message,
      errors: validation.errors,
    };
  }

  try {
    await updateMember(memberId, validation.values);
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Errore salvataggio socio.",
      errors: {},
    };
  }

  revalidatePath("/members");
  revalidatePath(`/members/${memberId}`);
  redirect(`/members/${memberId}`);
}

export async function archiveMemberAction(memberId: string) {
  await requireActiveAdmin();
  await archiveMember(memberId);
  revalidatePath("/members");
  redirect("/members");
}

export async function assignRoleToMemberAction(
  memberId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireActiveAdmin();
  const validation = validateMemberRoleFormData(formData);

  if (!validation.ok) {
    return {
      message: validation.message,
      errors: validation.errors,
    };
  }

  try {
    await assignRoleToMember(memberId, validation.values);
  } catch (error) {
    return {
      message:
        error instanceof Error ? error.message : "Errore assegnazione ruolo.",
      errors: {},
    };
  }

  revalidatePath("/members");
  revalidatePath(`/members/${memberId}`);
  return { errors: {} };
}

export async function endMemberRoleAssignmentAction(
  memberId: string,
  assignmentId: string,
) {
  await requireActiveAdmin();
  await endMemberRoleAssignment(assignmentId);
  revalidatePath("/members");
  revalidatePath(`/members/${memberId}`);
}

export async function archiveMemberRoleAssignmentAction(
  memberId: string,
  assignmentId: string,
) {
  await requireActiveAdmin();
  await archiveMemberRoleAssignment(assignmentId);
  revalidatePath("/members");
  revalidatePath(`/members/${memberId}`);
}
