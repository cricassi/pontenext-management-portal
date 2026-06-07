import { getMembershipById } from "@/services/memberships.service";
import { getSupabaseServerClientOrThrow } from "@/services/supabase.service";
import {
  PAYMENT_METHOD,
  type Payment,
  type PaymentFormValues,
  type PaymentMethod,
} from "@/types/payment";
import { parseCurrencyInput } from "@/utils/currency";
import { getTodayDateInputValue } from "@/utils/date";
import { readOptionalString, readRequiredString } from "@/utils/form";

type PaymentRow = {
  id: string;
  membership_id: string;
  payment_date: string;
  amount: number | string;
  method: PaymentMethod;
  reference: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

type PaymentValidationResult =
  | { ok: true; values: PaymentFormValues }
  | { ok: false; errors: Record<string, string>; message: string };

const paymentSelect =
  "id, membership_id, payment_date, amount, method, reference, notes, created_by, created_at, updated_at, archived_at";

function toNumber(value: number | string) {
  return typeof value === "string" ? Number.parseFloat(value) : value;
}

function mapPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    membershipId: row.membership_id,
    paymentDate: row.payment_date,
    amount: toNumber(row.amount),
    method: row.method,
    reference: row.reference,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

function isPaymentMethod(value: string): value is PaymentMethod {
  return Object.values(PAYMENT_METHOD).includes(value as PaymentMethod);
}

export function validatePaymentFormData(
  formData: FormData,
): PaymentValidationResult {
  const paymentDate =
    readRequiredString(formData, "paymentDate") || getTodayDateInputValue();
  const amount = parseCurrencyInput(readRequiredString(formData, "amount"));
  const method = readRequiredString(formData, "method");
  const reference = readOptionalString(formData, "reference");
  const notes = readOptionalString(formData, "notes");
  const errors: Record<string, string> = {};

  if (!paymentDate) {
    errors.paymentDate = "Inserisci la data pagamento.";
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    errors.amount = "Inserisci un importo maggiore di 0.";
  }

  if (!isPaymentMethod(method)) {
    errors.method = "Seleziona un metodo valido.";
  }

  if (Object.keys(errors).length > 0 || !isPaymentMethod(method)) {
    return {
      ok: false,
      errors,
      message: "Controlla i dati del pagamento.",
    };
  }

  return {
    ok: true,
    values: {
      paymentDate,
      amount,
      method,
      reference,
      notes,
    },
  };
}

export async function getPaymentsByMembershipId(membershipId: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("payments")
    .select(paymentSelect)
    .eq("membership_id", membershipId)
    .is("archived_at", null)
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<PaymentRow[]>();

  if (error) {
    throw new Error("Impossibile caricare i pagamenti.");
  }

  return data.map(mapPayment);
}

export async function createPayment(
  membershipId: string,
  values: PaymentFormValues,
  adminId: string,
) {
  const membership = await getMembershipById(membershipId);

  if (!membership) {
    throw new Error("Iscrizione non trovata.");
  }

  const supabase = await getSupabaseServerClientOrThrow();
  const { data, error } = await supabase
    .from("payments")
    .insert({
      membership_id: membershipId,
      payment_date: values.paymentDate,
      amount: values.amount,
      method: values.method,
      reference: values.reference,
      notes: values.notes,
      created_by: adminId,
    })
    .select(paymentSelect)
    .single<PaymentRow>();

  if (error) {
    throw new Error("Impossibile registrare il pagamento.");
  }

  return mapPayment(data);
}

export async function archivePayment(paymentId: string) {
  const supabase = await getSupabaseServerClientOrThrow();
  const { error } = await supabase
    .from("payments")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", paymentId)
    .is("archived_at", null);

  if (error) {
    throw new Error("Impossibile archiviare il pagamento.");
  }
}
