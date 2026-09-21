"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { FIELD_VISIBILITY_SETTINGS_PATH } from "@/config/field-visibility-registry";
import { resetFieldVisibility, saveFieldVisibility } from "@/services/field-visibility.service";
import type { VisibilityActionResult } from "@/types/field-visibility";
import { FieldVisibilityError } from "@/utils/field-visibility";

function invalidateMembers() {
  revalidatePath(FIELD_VISIBILITY_SETTINGS_PATH);
  revalidatePath("/members");
  revalidatePath("/members/new");
  revalidatePath("/members/[id]", "page");
  revalidatePath("/members/[id]/edit", "page");
}

export async function saveFieldVisibilityAction(input: unknown, expected: unknown): Promise<VisibilityActionResult> {
  try {
    await saveFieldVisibility(input, expected);
    invalidateMembers();
    return { ok: true, message: "Configurazione salvata." };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, message: error instanceof FieldVisibilityError ? error.message : new FieldVisibilityError("unavailable").message };
  }
}

export async function resetFieldVisibilityAction(screenKey: unknown, expected: unknown): Promise<VisibilityActionResult> {
  try {
    await resetFieldVisibility(screenKey, expected);
    invalidateMembers();
    return { ok: true, message: "Valori predefiniti ripristinati." };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, message: error instanceof FieldVisibilityError ? error.message : new FieldVisibilityError("unavailable").message };
  }
}
