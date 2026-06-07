"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveAdmin } from "@/services/admin-auth.service";
import {
  archiveMembershipPlan,
  createMembershipPlan,
  updateMembershipPlan,
  validateMembershipPlanFormData,
} from "@/services/membership-plans.service";
import type { FormState } from "@/types/form";

export async function createMembershipPlanAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireActiveAdmin();
  const validation = validateMembershipPlanFormData(formData);

  if (!validation.ok) {
    return {
      message: validation.message,
      errors: validation.errors,
    };
  }

  try {
    await createMembershipPlan(validation.values);
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "Errore salvataggio piano iscrizione.",
      errors: {},
    };
  }

  revalidatePath("/settings/membership-plans");
  revalidatePath("/memberships/new");
  redirect("/settings/membership-plans");
}

export async function updateMembershipPlanAction(
  planId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireActiveAdmin();
  const validation = validateMembershipPlanFormData(formData);

  if (!validation.ok) {
    return {
      message: validation.message,
      errors: validation.errors,
    };
  }

  try {
    await updateMembershipPlan(planId, validation.values);
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "Errore salvataggio piano iscrizione.",
      errors: {},
    };
  }

  revalidatePath("/settings/membership-plans");
  revalidatePath("/memberships");
  revalidatePath("/memberships/new");
  redirect("/settings/membership-plans");
}

export async function archiveMembershipPlanAction(planId: string) {
  await requireActiveAdmin();
  await archiveMembershipPlan(planId);
  revalidatePath("/settings/membership-plans");
  revalidatePath("/memberships/new");
}
