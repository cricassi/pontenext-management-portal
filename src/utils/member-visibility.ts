import { FIELD_VISIBILITY_REGISTRY } from "@/config/field-visibility-registry";
import type { ResolvedVisibilityScreen } from "@/types/field-visibility";
import type { Member, MemberFormValues } from "@/types/member";

export type MemberScreenKey = "members.list" | "members.create" | "members.edit" | "members.detail";
export type MemberVisibility = Readonly<Record<string, boolean>>;
export type MemberFormView = Pick<Member, "id" | "firstName" | "lastName" | "country" | "status"> & Partial<MemberFormValues>;

export class MemberSubmissionError extends Error {
  constructor(message = "I campi del modulo non sono validi o la visibilita' e' cambiata. Ricarica la pagina.") { super(message); }
}

export function memberVisibility(screen: ResolvedVisibilityScreen): MemberVisibility {
  return Object.fromEntries(screen.fields.map((field) => [field.formKey, !field.configurable || field.isVisible]));
}

export function memberFormView(member: Member, visibility: MemberVisibility): MemberFormView {
  const view: MemberFormView = { id: member.id, firstName: member.firstName, lastName: member.lastName, country: member.country, status: member.status };
  for (const field of FIELD_VISIBILITY_REGISTRY["members.edit"].fields) {
    const key = field.formKey as keyof MemberFormValues;
    if (field.configurable && visibility[key] !== false) Object.assign(view, { [key]: member[key] });
  }
  return view;
}

export function prepareMemberSubmission(formData: FormData, screen: ResolvedVisibilityScreen, current?: Member) {
  const definition = FIELD_VISIBILITY_REGISTRY[current ? "members.edit" : "members.create"];
  if (screen.screenKey !== (current ? "members.edit" : "members.create")) throw new MemberSubmissionError();
  const visibility = memberVisibility(screen);
  const fields = new Map(definition.fields.map((field) => [field.formKey, field]));
  const submitted = new Set<keyof MemberFormValues>();
  const merged = new FormData();
  if (current) for (const field of definition.fields) {
    const key = field.formKey as keyof MemberFormValues;
    merged.set(key, current[key] ?? "");
  }
  for (const [key, value] of formData.entries()) {
    // React's native form transport adds action metadata; it is never a business field.
    if (key.startsWith("$ACTION_")) continue;
    if (!fields.has(key) || typeof value !== "string" || submitted.has(key as keyof MemberFormValues) || visibility[key] === false) throw new MemberSubmissionError();
    submitted.add(key as keyof MemberFormValues);
    merged.set(key, value);
  }
  for (const field of definition.fields) {
    if (field.isRequired && (!submitted.has(field.formKey as keyof MemberFormValues) || !String(merged.get(field.formKey) ?? "").trim())) throw new MemberSubmissionError("Compila nome, cognome, paese e stato del socio.");
  }
  return { formData: merged, submitted };
}

export function memberUpdatePatch(values: MemberFormValues, submitted: ReadonlySet<keyof MemberFormValues>, current: Member) {
  const patch: Record<string, string | null> = {};
  for (const field of FIELD_VISIBILITY_REGISTRY["members.edit"].fields) {
    const key = field.formKey as keyof MemberFormValues;
    if (submitted.has(key) && values[key] !== current[key]) patch[field.fieldKey] = values[key];
  }
  return patch;
}
