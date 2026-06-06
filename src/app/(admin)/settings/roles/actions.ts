"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveAdmin } from "@/services/admin-auth.service";
import {
  archiveRole,
  createRole,
  updateRole,
  validateRoleFormData,
} from "@/services/roles.service";
import type { FormState } from "@/types/form";

export async function createRoleAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireActiveAdmin();
  const validation = validateRoleFormData(formData);

  if (!validation.ok) {
    return {
      message: validation.message,
      errors: validation.errors,
    };
  }

  try {
    await createRole(validation.values);
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Errore salvataggio ruolo.",
      errors: {},
    };
  }

  revalidatePath("/settings/roles");
  redirect("/settings/roles");
}

export async function updateRoleAction(
  roleId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireActiveAdmin();
  const validation = validateRoleFormData(formData);

  if (!validation.ok) {
    return {
      message: validation.message,
      errors: validation.errors,
    };
  }

  try {
    await updateRole(roleId, validation.values);
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Errore salvataggio ruolo.",
      errors: {},
    };
  }

  revalidatePath("/settings/roles");
  revalidatePath("/members");
  redirect("/settings/roles");
}

export async function archiveRoleAction(roleId: string) {
  await requireActiveAdmin();
  await archiveRole(roleId);
  revalidatePath("/settings/roles");
  revalidatePath("/members");
}
