import { getSupabaseServerClientOrThrow } from "@/services/supabase.service";
import {
  EMAIL_TEMPLATE_AUDIENCE,
  type EmailTemplate,
  type EmailTemplateAudience,
  type EmailTemplateFormValues,
} from "@/types/email";
import { readBoolean, readRequiredString } from "@/utils/form";

type EmailTemplateRow = {
  id: string;
  name: string;
  subject: string;
  body: string;
  audience: EmailTemplateAudience;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

type EmailTemplateValidationResult =
  | { ok: true; values: EmailTemplateFormValues }
  | { ok: false; errors: Record<string, string>; message: string };

const emailTemplateSelect =
  "id, name, subject, body, audience, is_active, created_by, created_at, updated_at, archived_at";

function mapEmailTemplate(row: EmailTemplateRow): EmailTemplate {
  return {
    id: row.id,
    name: row.name,
    subject: row.subject,
    body: row.body,
    audience: row.audience,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

function isEmailTemplateAudience(value: string): value is EmailTemplateAudience {
  return Object.values(EMAIL_TEMPLATE_AUDIENCE).includes(
    value as EmailTemplateAudience,
  );
}

function mapTemplateValues(values: EmailTemplateFormValues) {
  return {
    name: values.name,
    subject: values.subject,
    body: values.body,
    audience: values.audience,
    is_active: values.isActive,
  };
}

export function validateEmailTemplateFormData(
  formData: FormData,
): EmailTemplateValidationResult {
  const name = readRequiredString(formData, "name");
  const subject = readRequiredString(formData, "subject");
  const body = readRequiredString(formData, "body");
  const audience = readRequiredString(formData, "audience");
  const isActive = readBoolean(formData, "isActive");
  const errors: Record<string, string> = {};

  if (!name) {
    errors.name = "Inserisci il nome template.";
  }

  if (!subject) {
    errors.subject = "Inserisci l'oggetto.";
  }

  if (!body) {
    errors.body = "Inserisci il corpo email.";
  }

  if (!isEmailTemplateAudience(audience)) {
    errors.audience = "Seleziona un pubblico valido.";
  }

  if (Object.keys(errors).length > 0 || !isEmailTemplateAudience(audience)) {
    return {
      ok: false,
      errors,
      message: "Controlla i dati del template.",
    };
  }

  return {
    ok: true,
    values: {
      name,
      subject,
      body,
      audience,
      isActive,
    },
  };
}

export async function getEmailTemplates() {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("email_templates")
    .select(emailTemplateSelect)
    .is("archived_at", null)
    .order("name", { ascending: true })
    .returns<EmailTemplateRow[]>();

  if (error) {
    throw new Error("Impossibile caricare i template email.");
  }

  return data.map(mapEmailTemplate);
}

export async function getActiveEmailTemplates() {
  const templates = await getEmailTemplates();

  return templates.filter((template) => template.isActive);
}

export async function getEmailTemplateById(templateId: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("email_templates")
    .select(emailTemplateSelect)
    .eq("id", templateId)
    .is("archived_at", null)
    .maybeSingle<EmailTemplateRow>();

  if (error) {
    throw new Error("Impossibile caricare il template email.");
  }

  return data ? mapEmailTemplate(data) : null;
}

export async function createEmailTemplate(
  values: EmailTemplateFormValues,
  adminId: string,
) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("email_templates")
    .insert({
      ...mapTemplateValues(values),
      created_by: adminId,
    })
    .select(emailTemplateSelect)
    .single<EmailTemplateRow>();

  if (error) {
    throw new Error("Impossibile creare il template email.");
  }

  return mapEmailTemplate(data);
}

export async function updateEmailTemplate(
  templateId: string,
  values: EmailTemplateFormValues,
) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("email_templates")
    .update(mapTemplateValues(values))
    .eq("id", templateId)
    .is("archived_at", null)
    .select(emailTemplateSelect)
    .single<EmailTemplateRow>();

  if (error) {
    throw new Error("Impossibile aggiornare il template email.");
  }

  return mapEmailTemplate(data);
}

export async function archiveEmailTemplate(templateId: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { error } = await supabase
    .from("email_templates")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", templateId)
    .is("archived_at", null);

  if (error) {
    throw new Error("Impossibile archiviare il template email.");
  }
}

export function getEmailTemplateSelect() {
  return emailTemplateSelect;
}

export function mapEmailTemplateRow(row: EmailTemplateRow) {
  return mapEmailTemplate(row);
}

export type { EmailTemplateRow };
