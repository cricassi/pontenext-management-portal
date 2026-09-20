export const FULL_EXPORT_FORMAT = "pontenext-full-export-v1";
export const FULL_EXPORT_PROJECT_REF = "uhxfpsamenjhyrfgwckw";
export const FULL_EXPORT_SCHEMA_VERSION = "20260607195558_010_email";
export const FULL_EXPORT_MAX_ROWS = 10_000;
export const FULL_EXPORT_MAX_DATA_BYTES = 10 * 1024 * 1024;
export const FULL_EXPORT_MAX_FILE_BYTES = 3 * 1024 * 1024;
export const FULL_EXPORT_PAGE_SIZE = 250;
export const FULL_EXPORT_TIMEOUT_MS = 25_000;

export type ExportColumnType = "text" | "number" | "money" | "boolean" | "date" | "timestamp";
export type ExportColumn = { key: string; type: ExportColumnType };
export type ExportTable = { name: string; columns: readonly ExportColumn[] };

const fields = (type: ExportColumnType, ...keys: string[]): ExportColumn[] =>
  keys.map((key) => ({ key, type }));
const text = (...keys: string[]) => fields("text", ...keys);
const timestamps = fields("timestamp", "created_at", "updated_at", "archived_at");

// Explicit allowlist: additions to the database never enter the file automatically.
export const FULL_EXPORT_TABLES: readonly ExportTable[] = [
  { name: "members", columns: [
    ...text("id", "first_name", "last_name", "email", "phone", "address", "city", "postal_code", "province", "country"),
    ...fields("date", "birth_date"), ...text("fiscal_code", "profession", "notes", "status"), ...timestamps,
  ] },
  { name: "roles", columns: [
    ...text("id", "name", "description"), ...fields("boolean", "is_default"), ...fields("number", "sort_order"), ...timestamps,
  ] },
  { name: "member_roles", columns: [
    ...text("id", "member_id", "role_id"), ...fields("date", "start_date", "end_date"), ...text("notes"), ...timestamps,
  ] },
  { name: "membership_plans", columns: [
    ...text("id", "name", "description"), ...fields("money", "minimum_fee"), ...fields("number", "default_duration_months"),
    ...fields("boolean", "is_active"), ...fields("number", "sort_order"), ...timestamps,
  ] },
  { name: "memberships", columns: [
    ...text("id", "member_id", "membership_plan_id"), ...fields("date", "start_date", "end_date"),
    ...fields("money", "minimum_fee", "expected_fee", "paid_amount"), ...text("payment_status", "status", "notes"), ...timestamps,
  ] },
  { name: "payments", columns: [
    ...text("id", "membership_id"), ...fields("date", "payment_date"), ...fields("money", "amount"),
    ...text("method", "reference", "notes", "created_by"), ...timestamps,
  ] },
  { name: "sponsors", columns: [
    ...text("id", "company_name", "contact_name", "email", "phone", "website", "address", "city", "vat_number", "fiscal_code", "notes", "status"), ...timestamps,
  ] },
  { name: "sponsor_contributions", columns: [
    ...text("id", "sponsor_id"), ...fields("date", "contribution_date"), ...fields("money", "amount"),
    ...text("contribution_type", "description", "notes"), ...timestamps, ...text("event_id"),
  ] },
  { name: "events", columns: [
    ...text("id", "name", "description"), ...fields("timestamp", "start_datetime", "end_datetime"),
    ...text("location", "status", "notes"), ...timestamps,
  ] },
  { name: "event_sponsors", columns: [
    ...text("id", "event_id", "sponsor_id", "sponsorship_level", "notes"), ...timestamps,
  ] },
  { name: "email_templates", columns: [
    ...text("id", "name", "subject", "body", "audience"), ...fields("boolean", "is_active"), ...text("created_by"), ...timestamps,
  ] },
  { name: "email_campaigns", columns: [
    ...text("id", "template_id", "subject", "body", "audience_type", "status", "provider"),
    ...fields("timestamp", "recipient_snapshot_generated_at", "send_confirmed_at", "sent_at", "failed_at"),
    ...text("error_message", "created_by", "sent_by"), ...timestamps,
  ] },
  { name: "email_campaign_recipients", columns: [
    ...text("id", "campaign_id", "recipient_type", "member_id", "sponsor_id", "email", "recipient_name", "status", "skip_reason", "provider_message_id", "error_message"),
    ...fields("timestamp", "sent_at", "opted_out_at"), ...text("consent_basis_snapshot"),
    ...fields("timestamp", "created_at", "updated_at"),
  ] },
];
