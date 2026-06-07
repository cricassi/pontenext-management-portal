import { Resend } from "resend";
import type { EmailProviderStatus } from "@/types/email";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  idempotencyKey?: string;
};

export function getEmailProviderStatus(): EmailProviderStatus {
  const hasApiKey = Boolean(process.env.RESEND_API_KEY);
  const fromAddress = process.env.EMAIL_FROM?.trim() || null;

  return {
    provider: "resend",
    isConfigured: hasApiKey && Boolean(fromAddress),
    hasApiKey,
    hasFromAddress: Boolean(fromAddress),
    fromAddress,
  };
}

export function assertEmailProviderConfigured() {
  const status = getEmailProviderStatus();

  if (!status.hasApiKey) {
    throw new Error("Provider email non configurato: RESEND_API_KEY mancante.");
  }

  if (!status.hasFromAddress) {
    throw new Error("Provider email non configurato: EMAIL_FROM mancante.");
  }

  return status;
}

export async function sendEmailWithProvider(input: SendEmailInput) {
  const status = assertEmailProviderConfigured();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send(
    {
      from: status.fromAddress ?? "",
      to: input.to,
      subject: input.subject,
      html: input.html,
    },
    input.idempotencyKey
      ? {
          idempotencyKey: input.idempotencyKey,
        }
      : undefined,
  );

  if (error) {
    throw new Error(error.message || "Invio email non riuscito.");
  }

  return data?.id ?? null;
}
