"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveAdmin } from "@/services/admin-auth.service";
import {
  archiveEvent,
  archiveEventSponsor,
  createEvent,
  linkSponsorToEvent,
  updateEvent,
  updateEventSponsor,
  validateEventFormData,
  validateEventSponsorFormData,
} from "@/services/events.service";
import type { FormState } from "@/types/form";

function revalidateEventPaths(eventId?: string) {
  revalidatePath("/events");
  revalidatePath("/sponsors");

  if (eventId) {
    revalidatePath(`/events/${eventId}`);
  }
}

export async function createEventAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireActiveAdmin();
  const validation = validateEventFormData(formData);

  if (!validation.ok) {
    return {
      message: validation.message,
      errors: validation.errors,
    };
  }

  let eventId = "";

  try {
    const event = await createEvent(validation.values);
    eventId = event.id;
  } catch (error) {
    return {
      message:
        error instanceof Error ? error.message : "Errore salvataggio evento.",
      errors: {},
    };
  }

  revalidateEventPaths(eventId);
  redirect(`/events/${eventId}`);
}

export async function updateEventAction(
  eventId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireActiveAdmin();
  const validation = validateEventFormData(formData);

  if (!validation.ok) {
    return {
      message: validation.message,
      errors: validation.errors,
    };
  }

  try {
    await updateEvent(eventId, validation.values);
  } catch (error) {
    return {
      message:
        error instanceof Error ? error.message : "Errore salvataggio evento.",
      errors: {},
    };
  }

  revalidateEventPaths(eventId);
  redirect(`/events/${eventId}`);
}

export async function archiveEventAction(eventId: string) {
  await requireActiveAdmin();
  await archiveEvent(eventId);
  revalidateEventPaths(eventId);
  redirect("/events");
}

export async function linkSponsorToEventAction(
  eventId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireActiveAdmin();
  const validation = validateEventSponsorFormData(formData);

  if (!validation.ok) {
    return {
      message: validation.message,
      errors: validation.errors,
    };
  }

  try {
    await linkSponsorToEvent(eventId, validation.values);
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "Errore collegamento sponsor-evento.",
      errors: {},
    };
  }

  revalidateEventPaths(eventId);
  redirect(`/events/${eventId}`);
}

export async function updateEventSponsorAction(
  eventId: string,
  linkId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireActiveAdmin();
  const validation = validateEventSponsorFormData(formData);

  if (!validation.ok) {
    return {
      message: validation.message,
      errors: validation.errors,
    };
  }

  try {
    await updateEventSponsor(eventId, linkId, validation.values);
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "Errore collegamento sponsor-evento.",
      errors: {},
    };
  }

  revalidateEventPaths(eventId);
  redirect(`/events/${eventId}`);
}

export async function archiveEventSponsorAction(eventId: string, linkId: string) {
  await requireActiveAdmin();
  await archiveEventSponsor(eventId, linkId);
  revalidateEventPaths(eventId);
}
