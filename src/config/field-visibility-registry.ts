import type { VisibilityField, VisibilityScreen } from "@/types/field-visibility";

export const FIELD_VISIBILITY_REGISTRY_VERSION = 1;
export const FIELD_VISIBILITY_SETTINGS_PATH = "/settings/field-visibility";

type FieldSpec = readonly [key: string, label: string, formKey?: string, description?: string];

function fields(required: readonly FieldSpec[], optional: readonly FieldSpec[], workflow: readonly FieldSpec[] = []): VisibilityField[] {
  return [
    ...required.map(([fieldKey, label, formKey = fieldKey]) => ({
      fieldKey, formKey, label, isRequired: true, configurable: false,
      description: "Campo obbligatorio: non può essere nascosto",
    })),
    ...optional.map(([fieldKey, label, formKey = fieldKey, description = "Dato facoltativo; il valore salvato deve essere preservato."]) => ({
      fieldKey, formKey, label, description, isRequired: false, configurable: true,
    })),
    ...workflow.map(([fieldKey, label, formKey = fieldKey, description = "Sempre visibile: necessario al flusso operativo."]) => ({
      fieldKey, formKey, label, description, isRequired: false, configurable: false,
    })),
  ].map((field, index) => ({ ...field, defaultVisible: true, displayOrder: index + 1 }));
}

function screen(module: string, label: string, route: string, screenFields: VisibilityField[]): VisibilityScreen {
  // A2 enables each screen only after its preservation tests and UI integration.
  return { module, label, route, integrated: false, fields: screenFields };
}

const contacts: FieldSpec[] = [["email", "Email"], ["phone", "Telefono"], ["city", "Citta"]];
const memberRequired: FieldSpec[] = [["first_name", "Nome", "firstName"], ["last_name", "Cognome", "lastName"], ["status", "Stato anagrafico"], ["country", "Paese"]];
const memberOptional: FieldSpec[] = [...contacts, ["address", "Indirizzo"], ["postal_code", "CAP", "postalCode"], ["province", "Provincia"], ["birth_date", "Data di nascita", "birthDate"], ["fiscal_code", "Codice fiscale", "fiscalCode"], ["profession", "Professione"], ["notes", "Note"]];
const roleRequired: FieldSpec[] = [["name", "Nome"], ["sort_order", "Ordinamento", "sortOrder"]];
const roleOptional: FieldSpec[] = [["description", "Descrizione"], ["is_default", "Ruolo predefinito", "isDefault", "Checkbox facoltativa: un controllo assente non deve azzerare il valore."]];
const assignmentRequired: FieldSpec[] = [["role_id", "Ruolo", "roleId"], ["start_date", "Data inizio", "startDate"]];
const assignmentWorkflow: FieldSpec[] = [["end_date", "Data fine", "endDate", "Sempre visibile: delimita il periodo del ruolo."]];
const planRequired: FieldSpec[] = [["name", "Nome"], ["minimum_fee", "Quota minima", "minimumFee"], ["default_duration_months", "Durata predefinita", "defaultDurationMonths"], ["sort_order", "Ordinamento", "sortOrder"]];
const planOptional: FieldSpec[] = [["description", "Descrizione"]];
const planWorkflow: FieldSpec[] = [["is_active", "Piano attivo", "isActive"]];
const membershipRequired: FieldSpec[] = [["start_date", "Data inizio", "startDate"], ["end_date", "Data fine", "endDate"], ["minimum_fee", "Quota minima", "minimumFee"], ["expected_fee", "Quota prevista", "expectedFee"]];
const membershipOptional: FieldSpec[] = [["membership_plan_id", "Piano iscrizione", "membershipPlanId", "Solo la label del piano nelle viste di lettura."]];
const paymentRequired: FieldSpec[] = [["payment_date", "Data pagamento", "paymentDate"], ["amount", "Importo"], ["method", "Metodo"]];
const paymentOptional: FieldSpec[] = [["reference", "Riferimento"], ["notes", "Note", "notes", "Nel riepilogo pagamenti le note sono mostrate solo nella card mobile."]];
const sponsorRequired: FieldSpec[] = [["company_name", "Ragione sociale", "companyName"], ["status", "Stato"]];
const sponsorContact: FieldSpec[] = [["contact_name", "Referente", "contactName"], ...contacts];
const sponsorOptional: FieldSpec[] = [...sponsorContact, ["website", "Sito web"], ["address", "Indirizzo"], ["vat_number", "Partita IVA", "vatNumber"], ["fiscal_code", "Codice fiscale", "fiscalCode"], ["notes", "Note"]];
const contributionRequired: FieldSpec[] = [["contribution_date", "Data contributo", "contributionDate"], ["contribution_type", "Tipo contributo", "contributionType"], ["amount", "Importo"]];
const contributionOptional: FieldSpec[] = [["event_id", "Evento collegato", "eventId", "Associazione facoltativa: nasconderla non deve scollegare l'evento."], ["notes", "Note"]];
const contributionWorkflow: FieldSpec[] = [["description", "Descrizione", "description", "Obbligatoria per beni, servizi e altri contributi non monetari."]];
const eventRequired: FieldSpec[] = [["name", "Nome evento"], ["start_datetime", "Inizio", "startDatetime"], ["status", "Stato"]];
const eventOptional: FieldSpec[] = [["description", "Descrizione"], ["location", "Luogo"], ["notes", "Note"]];
const eventWorkflow: FieldSpec[] = [["end_datetime", "Fine", "endDatetime", "Sempre visibile: estremo del periodo dell'evento."]];
const eventSponsorOptional: FieldSpec[] = [["sponsorship_level", "Livello sponsorizzazione", "sponsorshipLevel"], ["notes", "Note"]];
const templateRequired: FieldSpec[] = [["name", "Nome"], ["subject", "Oggetto"], ["body", "Testo"], ["audience", "Destinatari"]];
const campaignRequired: FieldSpec[] = [["subject", "Oggetto"], ["body", "Testo"], ["audience_type", "Segmento", "audienceType"]];
const campaignOptional: FieldSpec[] = [["template_id", "Template", "templateId", "Associazione facoltativa; modifica consentita solo sulle bozze."]];

export const FIELD_VISIBILITY_REGISTRY = {
  "members.list": screen("Soci", "Elenco soci", "/members", fields(memberRequired.slice(0, 3), contacts)),
  "members.create": screen("Soci", "Nuovo socio", "/members/new", fields(memberRequired, memberOptional)),
  "members.edit": screen("Soci", "Modifica socio", "/members/[id]/edit", fields(memberRequired, memberOptional)),
  "members.detail": screen("Soci", "Dettaglio socio", "/members/[id]", fields(memberRequired, memberOptional)),
  "roles.list": screen("Ruoli", "Elenco ruoli", "/settings/roles", fields(roleRequired, roleOptional)),
  "roles.create": screen("Ruoli", "Nuovo ruolo", "/settings/roles", fields(roleRequired, roleOptional)),
  "roles.edit": screen("Ruoli", "Modifica ruolo", "/settings/roles", fields(roleRequired, roleOptional)),
  "member_roles.create": screen("Ruoli", "Assegna ruolo al socio", "/members/[id]", fields(assignmentRequired, [["notes", "Note"]], assignmentWorkflow)),
  "member_roles.list": screen("Ruoli", "Ruoli del socio", "/members/[id]", fields(assignmentRequired, [["notes", "Note"]], assignmentWorkflow)),
  "membership_plans.list": screen("Piani iscrizione", "Elenco piani", "/settings/membership-plans", fields(planRequired, planOptional, planWorkflow)),
  "membership_plans.create": screen("Piani iscrizione", "Nuovo piano", "/settings/membership-plans", fields(planRequired, planOptional, planWorkflow)),
  "membership_plans.edit": screen("Piani iscrizione", "Modifica piano", "/settings/membership-plans", fields(planRequired, planOptional, planWorkflow)),
  "memberships.list": screen("Iscrizioni", "Elenco iscrizioni", "/memberships", fields(membershipRequired, membershipOptional)),
  "memberships.detail": screen("Iscrizioni", "Dettaglio iscrizione", "/memberships/[id]", fields(membershipRequired, membershipOptional)),
  "memberships.history": screen("Iscrizioni", "Storico iscrizioni del socio", "/members/[id]/memberships", fields(membershipRequired, membershipOptional)),
  "memberships.create": screen("Iscrizioni", "Nuova iscrizione e rinnovo", "/memberships/new", fields(membershipRequired, [], [["membership_plan_id", "Piano", "membershipPlanId"], ["notes", "Motivazione", "notes", "Necessaria per una quota prevista pari a zero."]])),
  "payments.create": screen("Pagamenti", "Registra pagamento", "/memberships/[id]", fields(paymentRequired, paymentOptional)),
  "payments.list": screen("Pagamenti", "Pagamenti iscrizione", "/memberships/[id]", fields(paymentRequired, paymentOptional)),
  "sponsors.list": screen("Sponsor", "Elenco sponsor", "/sponsors", fields(sponsorRequired, sponsorContact)),
  "sponsors.create": screen("Sponsor", "Nuovo sponsor", "/sponsors/new", fields(sponsorRequired, sponsorOptional)),
  "sponsors.edit": screen("Sponsor", "Modifica sponsor", "/sponsors/[id]/edit", fields(sponsorRequired, sponsorOptional)),
  "sponsors.detail": screen("Sponsor", "Dettaglio sponsor", "/sponsors/[id]", fields(sponsorRequired, sponsorOptional)),
  "sponsor_contributions.create": screen("Contributi sponsor", "Nuovo contributo", "/sponsors/[id]", fields(contributionRequired, contributionOptional, contributionWorkflow)),
  "sponsor_contributions.edit": screen("Contributi sponsor", "Modifica contributo", "/sponsors/[id]", fields(contributionRequired, contributionOptional, contributionWorkflow)),
  "sponsor_contributions.list": screen("Contributi sponsor", "Contributi dello sponsor", "/sponsors/[id]", fields(contributionRequired, contributionOptional, contributionWorkflow)),
  "sponsor_contributions.event_list": screen("Contributi sponsor", "Contributi dell'evento", "/events/[id]", fields(contributionRequired, [], contributionWorkflow)),
  "events.list": screen("Eventi", "Elenco eventi", "/events", fields(eventRequired, [["location", "Luogo"]], eventWorkflow)),
  "events.create": screen("Eventi", "Nuovo evento", "/events/new", fields(eventRequired, eventOptional, eventWorkflow)),
  "events.edit": screen("Eventi", "Modifica evento", "/events/[id]/edit", fields(eventRequired, eventOptional, eventWorkflow)),
  "events.detail": screen("Eventi", "Dettaglio evento", "/events/[id]", fields(eventRequired, eventOptional, eventWorkflow)),
  "events.sponsor_list": screen("Eventi", "Eventi dello sponsor", "/sponsors/[id]", fields(eventRequired, [["location", "Luogo"]], eventWorkflow)),
  "event_sponsors.create": screen("Sponsor degli eventi", "Collega sponsor", "/events/[id]", fields([["sponsor_id", "Sponsor", "sponsorId"]], eventSponsorOptional)),
  "event_sponsors.edit": screen("Sponsor degli eventi", "Modifica collegamento sponsor", "/events/[id]", fields([], eventSponsorOptional)),
  "event_sponsors.list": screen("Sponsor degli eventi", "Sponsor collegati", "/events/[id]", fields([], eventSponsorOptional)),
  "email_templates.list": screen("Template email", "Elenco template", "/email/templates", fields([["name", "Nome"], ["subject", "Oggetto"], ["audience", "Destinatari"]], [], [["is_active", "Template attivo", "isActive"]])),
  "email_templates.create": screen("Template email", "Nuovo template", "/email/templates", fields(templateRequired, [], [["is_active", "Template attivo", "isActive"]])),
  "email_templates.edit": screen("Template email", "Modifica template", "/email/templates", fields(templateRequired, [], [["is_active", "Template attivo", "isActive"]])),
  "email_campaigns.list": screen("Campagne email", "Elenco campagne", "/email/campaigns", fields([["subject", "Oggetto"], ["audience_type", "Segmento", "audienceType"]], campaignOptional)),
  "email_campaigns.create": screen("Campagne email", "Nuova campagna", "/email/campaigns", fields(campaignRequired, campaignOptional)),
  "email_campaigns.edit": screen("Campagne email", "Modifica bozza", "/email/campaigns", fields(campaignRequired, campaignOptional)),
  "email_campaigns.detail": screen("Campagne email", "Dettaglio campagna", "/email/campaigns", fields(campaignRequired, campaignOptional)),
  "reports.filters": screen("Report", "Filtri report", "/reports", fields([], [
    ["query", "Ricerca", "q", "Disponibile nei report esistenti; un filtro attivo non va azzerato quando nascosto."],
    ["status", "Stato", "status", "Solo nei report che espongono il filtro di stato."],
    ["membership_status", "Stato associativo", "membershipStatus"],
    ["payment_status", "Stato pagamento", "paymentStatus"],
    ["payment_method", "Metodo pagamento", "paymentMethod"],
    ["contribution_type", "Tipo contributo", "contributionType"],
    ["audience_type", "Segmento", "audienceType"],
  ])),
} satisfies Record<string, VisibilityScreen>;

export type VisibilityScreenKey = keyof typeof FIELD_VISIBILITY_REGISTRY;
export const VISIBILITY_SCREEN_KEYS = Object.keys(FIELD_VISIBILITY_REGISTRY) as VisibilityScreenKey[];

export function isVisibilityScreenKey(key: string): key is VisibilityScreenKey {
  return Object.hasOwn(FIELD_VISIBILITY_REGISTRY, key);
}
