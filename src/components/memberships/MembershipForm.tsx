"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/Field";
import { FormSubmitButton } from "@/components/ui/FormSubmitButton";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { emptyFormState, type FormState } from "@/types/form";
import type { MemberListItem } from "@/types/member";
import type { MembershipPlan } from "@/types/membership";
import { addMonthsToDateInputValue } from "@/utils/date";

type MembershipFormDefaults = {
  memberId?: string;
  membershipPlanId?: string;
  startDate: string;
  endDate: string;
  minimumFee: number;
  expectedFee: number;
  notes?: string | null;
};

type MembershipFormContext = {
  title: string;
  description: string;
  sourceHref?: string;
  sourceLabel?: string;
};

type MembershipFormProps = {
  members: MemberListItem[];
  plans: MembershipPlan[];
  defaults: MembershipFormDefaults;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  cancelHref?: string;
  context?: MembershipFormContext;
};

function fieldError(state: FormState, key: string) {
  return state.errors?.[key] ? (
    <p className="text-sm text-destructive">{state.errors[key]}</p>
  ) : null;
}

function formatAmountInput(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function MembershipForm({
  members,
  plans,
  defaults,
  action,
  submitLabel,
  cancelHref = "/memberships",
  context,
}: MembershipFormProps) {
  const [state, formAction] = useActionState(action, emptyFormState);
  const [selectedPlanId, setSelectedPlanId] = useState(
    defaults.membershipPlanId ?? "",
  );
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [minimumFee, setMinimumFee] = useState(
    formatAmountInput(defaults.minimumFee),
  );
  const [expectedFee, setExpectedFee] = useState(
    formatAmountInput(defaults.expectedFee),
  );
  const plansById = useMemo(
    () => new Map(plans.map((plan) => [plan.id, plan])),
    [plans],
  );

  function handlePlanChange(planId: string) {
    const plan = plansById.get(planId);

    setSelectedPlanId(planId);

    if (!plan) {
      return;
    }

    const fee = formatAmountInput(plan.minimumFee);
    setMinimumFee(fee);
    setExpectedFee(fee);
    setEndDate(addMonthsToDateInputValue(startDate, plan.defaultDurationMonths));
  }

  function handleStartDateChange(value: string) {
    const plan = plansById.get(selectedPlanId);

    setStartDate(value);

    if (plan && value) {
      setEndDate(addMonthsToDateInputValue(value, plan.defaultDurationMonths));
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="flex flex-col gap-6">
          {state.message ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {state.message}
            </div>
          ) : null}

          {context ? (
            <div className="grid gap-3 rounded-md border bg-muted/20 p-4 text-sm">
              <div>
                <p className="font-medium text-foreground">{context.title}</p>
                <p className="mt-1 text-muted-foreground">
                  {context.description}
                </p>
              </div>
              {context.sourceHref && context.sourceLabel ? (
                <Button asChild variant="outline" size="sm" className="w-fit">
                  <Link href={context.sourceHref}>{context.sourceLabel}</Link>
                </Button>
              ) : null}
            </div>
          ) : null}

          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="memberId">Socio</FieldLabel>
              <select
                id="memberId"
                name="memberId"
                defaultValue={defaults.memberId ?? ""}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="">Seleziona socio</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                  </option>
                ))}
              </select>
              {fieldError(state, "memberId")}
            </Field>

            <Field>
              <FieldLabel htmlFor="membershipPlanId">Piano</FieldLabel>
              <select
                id="membershipPlanId"
                name="membershipPlanId"
                value={selectedPlanId}
                onChange={(event) => handlePlanChange(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Personalizzato</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field>
              <FieldLabel htmlFor="startDate">Data inizio</FieldLabel>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={startDate}
                onChange={(event) => handleStartDateChange(event.target.value)}
                required
              />
              {fieldError(state, "startDate")}
            </Field>

            <Field>
              <FieldLabel htmlFor="endDate">Data fine</FieldLabel>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                required
              />
              {fieldError(state, "endDate")}
            </Field>

            <Field>
              <FieldLabel htmlFor="minimumFee">Quota minima</FieldLabel>
              <Input
                id="minimumFee"
                name="minimumFee"
                type="number"
                min={0}
                step="0.01"
                value={minimumFee}
                onChange={(event) => setMinimumFee(event.target.value)}
                required
              />
              {fieldError(state, "minimumFee")}
            </Field>

            <Field>
              <FieldLabel htmlFor="expectedFee">Quota prevista</FieldLabel>
              <Input
                id="expectedFee"
                name="expectedFee"
                type="number"
                min={0}
                step="0.01"
                value={expectedFee}
                onChange={(event) => setExpectedFee(event.target.value)}
                required
              />
              {fieldError(state, "expectedFee")}
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel htmlFor="notes">Note</FieldLabel>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={defaults.notes ?? ""}
              />
              <FieldDescription>
                Obbligatorie se quota prevista = 0.
              </FieldDescription>
              {fieldError(state, "notes")}
            </Field>
          </FieldGroup>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button asChild variant="outline">
              <Link href={cancelHref}>Annulla</Link>
            </Button>
            <FormSubmitButton>{submitLabel}</FormSubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
