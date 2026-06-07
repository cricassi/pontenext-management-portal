"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveAdmin } from "@/services/admin-auth.service";
import {
  archiveSponsor,
  archiveSponsorContribution,
  createSponsor,
  createSponsorContribution,
  updateSponsor,
  updateSponsorContribution,
  validateSponsorContributionFormData,
  validateSponsorFormData,
} from "@/services/sponsors.service";
import type { FormState } from "@/types/form";

function revalidateSponsorPaths(sponsorId?: string) {
  revalidatePath("/sponsors");

  if (sponsorId) {
    revalidatePath(`/sponsors/${sponsorId}`);
  }
}

export async function createSponsorAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireActiveAdmin();
  const validation = validateSponsorFormData(formData);

  if (!validation.ok) {
    return {
      message: validation.message,
      errors: validation.errors,
    };
  }

  let sponsorId = "";

  try {
    const sponsor = await createSponsor(validation.values);
    sponsorId = sponsor.id;
  } catch (error) {
    return {
      message:
        error instanceof Error ? error.message : "Errore salvataggio sponsor.",
      errors: {},
    };
  }

  revalidateSponsorPaths(sponsorId);
  redirect(`/sponsors/${sponsorId}`);
}

export async function updateSponsorAction(
  sponsorId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireActiveAdmin();
  const validation = validateSponsorFormData(formData);

  if (!validation.ok) {
    return {
      message: validation.message,
      errors: validation.errors,
    };
  }

  try {
    await updateSponsor(sponsorId, validation.values);
  } catch (error) {
    return {
      message:
        error instanceof Error ? error.message : "Errore salvataggio sponsor.",
      errors: {},
    };
  }

  revalidateSponsorPaths(sponsorId);
  redirect(`/sponsors/${sponsorId}`);
}

export async function archiveSponsorAction(sponsorId: string) {
  await requireActiveAdmin();
  await archiveSponsor(sponsorId);
  revalidateSponsorPaths(sponsorId);
  redirect("/sponsors");
}

export async function createSponsorContributionAction(
  sponsorId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireActiveAdmin();
  const validation = validateSponsorContributionFormData(formData);

  if (!validation.ok) {
    return {
      message: validation.message,
      errors: validation.errors,
    };
  }

  try {
    await createSponsorContribution(sponsorId, validation.values);
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "Errore salvataggio contributo sponsor.",
      errors: {},
    };
  }

  revalidateSponsorPaths(sponsorId);
  redirect(`/sponsors/${sponsorId}`);
}

export async function updateSponsorContributionAction(
  sponsorId: string,
  contributionId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireActiveAdmin();
  const validation = validateSponsorContributionFormData(formData);

  if (!validation.ok) {
    return {
      message: validation.message,
      errors: validation.errors,
    };
  }

  try {
    await updateSponsorContribution(
      sponsorId,
      contributionId,
      validation.values,
    );
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "Errore salvataggio contributo sponsor.",
      errors: {},
    };
  }

  revalidateSponsorPaths(sponsorId);
  redirect(`/sponsors/${sponsorId}`);
}

export async function archiveSponsorContributionAction(
  sponsorId: string,
  contributionId: string,
) {
  await requireActiveAdmin();
  await archiveSponsorContribution(sponsorId, contributionId);
  revalidateSponsorPaths(sponsorId);
}
