"use client";

import { useActionState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/Field";
import { FormSubmitButton } from "@/components/ui/FormSubmitButton";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { emptyFormState, type FormState } from "@/types/form";
import { PAYMENT_METHOD } from "@/types/payment";
import { getTodayDateInputValue } from "@/utils/date";

type PaymentFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
};

function fieldError(state: FormState, key: string) {
  return state.errors?.[key] ? (
    <p className="text-sm text-destructive">{state.errors[key]}</p>
  ) : null;
}

export function PaymentForm({ action }: PaymentFormProps) {
  const [state, formAction] = useActionState(action, emptyFormState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registra pagamento</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-5">
          {state.message ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {state.message}
            </div>
          ) : null}

          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="paymentDate">Data</FieldLabel>
              <Input
                id="paymentDate"
                name="paymentDate"
                type="date"
                defaultValue={getTodayDateInputValue()}
                required
              />
              {fieldError(state, "paymentDate")}
            </Field>

            <Field>
              <FieldLabel htmlFor="amount">Importo</FieldLabel>
              <Input
                id="amount"
                name="amount"
                type="number"
                min={0.01}
                step="0.01"
                required
              />
              {fieldError(state, "amount")}
            </Field>

            <Field>
              <FieldLabel htmlFor="method">Metodo</FieldLabel>
              <select
                id="method"
                name="method"
                defaultValue={PAYMENT_METHOD.BANK_TRANSFER}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value={PAYMENT_METHOD.CASH}>Contanti</option>
                <option value={PAYMENT_METHOD.BANK_TRANSFER}>Bonifico</option>
                <option value={PAYMENT_METHOD.POS}>POS</option>
                <option value={PAYMENT_METHOD.OTHER}>Altro</option>
              </select>
              {fieldError(state, "method")}
            </Field>

            <Field>
              <FieldLabel htmlFor="reference">Riferimento</FieldLabel>
              <Input id="reference" name="reference" />
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel htmlFor="notes">Note</FieldLabel>
              <Textarea id="notes" name="notes" />
            </Field>
          </FieldGroup>

          <div className="flex justify-end">
            <FormSubmitButton>Registra pagamento</FormSubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
