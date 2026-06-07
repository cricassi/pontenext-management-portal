"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveAdmin } from "@/services/admin-auth.service";
import {
  archiveMembership,
  cancelMembership,
  createMembership,
  getMembershipById,
  renewMembership,
  validateMembershipFormData,
} from "@/services/memberships.service";
import {
  archivePayment,
  createPayment,
  validatePaymentFormData,
} from "@/services/payments.service";
import type { FormState } from "@/types/form";

function revalidateMembershipPaths(memberId?: string, membershipId?: string) {
  revalidatePath("/memberships");
  revalidatePath("/memberships/new");
  revalidatePath("/expirations");

  if (membershipId) {
    revalidatePath(`/memberships/${membershipId}`);
  }

  if (memberId) {
    revalidatePath(`/members/${memberId}`);
  }
}

export async function createMembershipAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireActiveAdmin();
  const validation = validateMembershipFormData(formData);

  if (!validation.ok) {
    return {
      message: validation.message,
      errors: validation.errors,
    };
  }

  let membershipId = "";

  try {
    const membership = await createMembership(validation.values);
    membershipId = membership.id;
  } catch (error) {
    return {
      message:
        error instanceof Error ? error.message : "Errore salvataggio iscrizione.",
      errors: {},
    };
  }

  revalidateMembershipPaths(validation.values.memberId, membershipId);
  redirect(`/memberships/${membershipId}`);
}

export async function renewMembershipAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireActiveAdmin();
  const validation = validateMembershipFormData(formData);

  if (!validation.ok) {
    return {
      message: validation.message,
      errors: validation.errors,
    };
  }

  let membershipId = "";

  try {
    const membership = await renewMembership(validation.values);
    membershipId = membership.id;
  } catch (error) {
    return {
      message:
        error instanceof Error ? error.message : "Errore rinnovo iscrizione.",
      errors: {},
    };
  }

  revalidateMembershipPaths(validation.values.memberId, membershipId);
  redirect(`/memberships/${membershipId}`);
}

export async function cancelMembershipAction(
  memberId: string,
  membershipId: string,
) {
  await requireActiveAdmin();
  await cancelMembership(membershipId);
  revalidateMembershipPaths(memberId, membershipId);
}

export async function archiveMembershipAction(
  memberId: string,
  membershipId: string,
) {
  await requireActiveAdmin();
  await archiveMembership(membershipId);
  revalidateMembershipPaths(memberId, membershipId);
  redirect("/memberships");
}

export async function createPaymentAction(
  membershipId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const { admin } = await requireActiveAdmin();
  const validation = validatePaymentFormData(formData);

  if (!validation.ok) {
    return {
      message: validation.message,
      errors: validation.errors,
    };
  }

  try {
    await createPayment(membershipId, validation.values, admin.id);
  } catch (error) {
    return {
      message:
        error instanceof Error ? error.message : "Errore salvataggio pagamento.",
      errors: {},
    };
  }

  const membership = await getMembershipById(membershipId);
  revalidateMembershipPaths(membership?.memberId, membershipId);
  return { errors: {} };
}

export async function archivePaymentAction(
  membershipId: string,
  paymentId: string,
) {
  await requireActiveAdmin();
  await archivePayment(paymentId);
  const membership = await getMembershipById(membershipId);
  revalidateMembershipPaths(membership?.memberId, membershipId);
}
