# NAMING_CONVENTIONS.md

# PonteNext Management Portal – Naming Conventions

Versione: 1.0

---

# 1. Obiettivo

Questo documento definisce le convenzioni di naming da usare nel progetto.

Le regole sono vincolanti per:

* database
* migration
* codice TypeScript
* componenti React
* pagine Next.js
* funzioni
* servizi
* file
* cartelle
* variabili ambiente

L'obiettivo è evitare incoerenze tra database, backend, frontend e documentazione.

---

# 2. Regola generale

Usare nomi:

* chiari
* descrittivi
* coerenti
* in inglese tecnico
* senza abbreviazioni inutili

Evitare nomi generici come:

```text
data
item
object
thing
record
info
manager
handler
```

salvo casi strettamente necessari.

---

# 3. Lingua

Il codice deve usare naming in inglese.

Esempi corretti:

```text
members
sponsors
events
payments
membership_plans
```

Esempi da evitare:

```text
soci
sponsor_eventi
pagamenti
scadenze
```

La documentazione può essere in italiano.

---

# 4. Database

## 4.1 Tabelle

Le tabelle PostgreSQL devono usare:

```text
snake_case
plural
```

Esempi corretti:

```text
members
roles
member_roles
membership_plans
memberships
payments
sponsors
sponsor_contributions
events
event_sponsors
email_templates
email_campaigns
email_campaign_recipients
audit_logs
```

Esempi errati:

```text
Member
member
Members
memberRoles
tbl_members
```

---

## 4.2 Campi

I campi devono usare:

```text
snake_case
```

Esempi corretti:

```text
first_name
last_name
created_at
updated_at
archived_at
membership_plan_id
payment_status
start_datetime
end_datetime
created_by
```

Esempi errati:

```text
firstName
LastName
createdAt
membershipPlanId
```

---

## 4.3 Primary Key

Ogni tabella principale deve avere:

```sql
id uuid primary key default gen_random_uuid()
```

Il campo deve chiamarsi sempre:

```text
id
```

Non usare:

```text
member_id
sponsor_id
event_id
```

come primary key della tabella principale.

---

## 4.4 Foreign Key

Le foreign key devono usare:

```text
nome_tabella_singolare_id
```

Esempi corretti:

```text
member_id
role_id
membership_id
membership_plan_id
sponsor_id
event_id
template_id
campaign_id
created_by
actor_admin_id
```

Esempi errati:

```text
members_id
id_member
fk_member
memberId
```

---

## 4.5 Tabelle pivot / molti-a-molti

Le tabelle ponte devono avere il nome composto dalle due entità collegate.

Esempi:

```text
member_roles
event_sponsors
email_campaign_recipients
```

Ordine consigliato:

```text
entità_principale_entità_collegata
```

---

## 4.6 Timestamp

Usare sempre questi nomi:

```text
created_at
updated_at
archived_at
```

Non usare:

```text
created
modified
deleted_at
removed_at
```

`archived_at` indica soft delete.

---

## 4.7 Stati

I campi stato devono chiamarsi:

```text
status
```

oppure, se serve maggiore precisione:

```text
payment_status
email_status
```

I valori devono essere:

```text
lowercase_snake_case
```

Esempi:

```text
active
inactive
archived
unpaid
partial
paid
overpaid
planned
confirmed
completed
cancelled
```

Non usare:

```text
Active
INACTIVE
In Progress
in-progress
```

---

## 4.8 Importi

Gli importi monetari devono terminare preferibilmente con:

```text
_amount
_fee
```

Esempi:

```text
minimum_fee
expected_fee
paid_amount
amount
```

Tipo PostgreSQL:

```sql
numeric(10,2)
```

Non usare `float`.

---

# 5. Migration

I file migration devono usare:

```text
numero_progressivo_descrizione.sql
```

Formato:

```text
001_extensions.sql
002_admin_users.sql
003_harden_admin_functions.sql
004_members_roles.sql
005_membership_plans.sql
006_memberships_payments.sql
007_sponsors.sql
008_events.sql
009_sponsor_contributions.sql
010_email.sql
011_audit_logs.sql
012_views.sql
013_rls_policies.sql
014_seed.sql
```

Regole:

* numerazione a 3 cifre
* descrizione breve
* snake_case
* estensione `.sql`
* non modificare una migration già applicata
* creare una nuova migration per ogni modifica successiva

---

# 6. TypeScript

## 6.1 Variabili

Usare:

```text
camelCase
```

Esempi:

```ts
const memberId = "";
const membershipPlanId = "";
const paymentStatus = "paid";
const selectedSponsor = null;
```

---

## 6.2 Tipi e interfacce

Usare:

```text
PascalCase
```

Esempi:

```ts
type Member = {};
type Sponsor = {};
type MembershipPlan = {};
type EmailCampaign = {};

interface MemberFormValues {}
interface SponsorFormValues {}
```

---

## 6.3 Enum-like constants

Preferire oggetti costanti tipizzati invece di enum TypeScript, salvo necessità specifica.

Esempio:

```ts
export const PAYMENT_STATUS = {
  UNPAID: "unpaid",
  PARTIAL: "partial",
  PAID: "paid",
  OVERPAID: "overpaid",
} as const;
```

---

## 6.4 Funzioni

Usare:

```text
camelCase
```

Verbi chiari.

Esempi:

```ts
getMemberById()
createMember()
updateMember()
archiveMember()
renewMembership()
calculatePaymentStatus()
```

Evitare:

```ts
doStuff()
handleData()
process()
manageMember()
```

---

# 7. React / Next.js

## 7.1 Componenti React

Usare:

```text
PascalCase
```

La convenzione definitiva per i file dei componenti React e':

```text
PascalCase.tsx
```

Esempi:

```text
MemberTable.tsx
MemberForm.tsx
MemberCard.tsx
SponsorTable.tsx
SponsorForm.tsx
DashboardCard.tsx
StatusBadge.tsx
```

---

## 7.2 Componenti UI generici

Componenti riutilizzabili:

```text
components/ui/
```

Esempi:

```text
Button.tsx
Input.tsx
Modal.tsx
DataTable.tsx
StatusBadge.tsx
ConfirmDialog.tsx
```

---

## 7.3 Componenti di dominio

Componenti specifici di modulo:

```text
components/members/
components/sponsors/
components/events/
components/memberships/
components/email/
```

Esempi:

```text
components/members/MemberTable.tsx
components/members/MemberForm.tsx
components/sponsors/SponsorForm.tsx
```

---

# 8. Next.js App Router

Usare App Router.

## 8.1 Route

Le route devono essere in inglese, lowercase e kebab-case quando necessario.

Esempi:

```text
/dashboard
/members
/members/[id]
/members/[id]/memberships
/memberships
/expirations
/sponsors
/sponsors/[id]
/events
/events/[id]
/email
/email/templates
/email/campaigns
/reports
/settings
```

Evitare:

```text
/soci
/GestioneSoci
/memberList
/email_campaigns
```

---

## 8.2 File speciali Next.js

Usare i nomi standard:

```text
page.tsx
layout.tsx
loading.tsx
error.tsx
not-found.tsx
route.ts
```

---

# 9. Cartelle

## 9.1 Struttura src

```text
src/
├── app/
├── components/
├── hooks/
├── lib/
├── services/
├── types/
└── utils/
```

---

## 9.2 Services

I servizi devono essere separati per dominio.

Esempi:

```text
services/members.service.ts
services/sponsors.service.ts
services/events.service.ts
services/memberships.service.ts
services/email-campaigns.service.ts
```

---

## 9.3 Hooks

Hook React:

```text
useNomeFunzione
```

Esempi:

```text
useMembers.ts
useMember.ts
useSponsors.ts
useEvents.ts
useMemberships.ts
```

---

## 9.4 Types

Tipi condivisi:

```text
types/member.ts
types/sponsor.ts
types/event.ts
types/membership.ts
types/email.ts
types/database.ts
```

---

## 9.5 Utils

Funzioni pure e indipendenti.

Esempi:

```text
utils/date.ts
utils/currency.ts
utils/status.ts
utils/validation.ts
```

---

# 10. Supabase

## 10.1 Client

Usare nomi chiari:

```text
supabaseClient
supabaseServerClient
```

File consigliati:

```text
lib/supabase/client.ts
lib/supabase/server.ts
```

---

## 10.2 Tipi generati

File:

```text
types/supabase.ts
```

Non modificare manualmente i tipi generati.

---

## 10.3 Variabili ambiente

Usare:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Regole:

* chiavi pubbliche con prefisso `NEXT_PUBLIC_`
* service role solo server-side
* mai committare `.env.local`

---

# 11. CSS / Tailwind

## 11.1 Classi

Usare Tailwind CSS.

Evitare CSS custom salvo necessità.

## 11.2 Nomi classi custom

Se servono classi custom, usare:

```text
kebab-case
```

Esempio:

```css
.mobile-card-list {}
```

---

# 12. Test

## 12.1 File test

Formato:

```text
nome-file.test.ts
nome-file.test.tsx
```

Esempi:

```text
calculate-payment-status.test.ts
MemberForm.test.tsx
```

---

## 12.2 Cartelle test

```text
tests/
├── unit/
├── integration/
└── e2e/
```

---

# 13. Documentazione

I file documentali devono usare:

```text
UPPER_SNAKE_CASE.md
```

Esempi:

```text
PRD.md
DATABASE_DESIGN.md
BUSINESS_RULES.md
SCREEN_FLOW.md
UI_GUIDELINES.md
NAMING_CONVENTIONS.md
CODEX_INSTRUCTIONS.md
```

Eccezione ammessa:

```text
ADR-001_ARCHITECTURE.md
```

---

# 14. Branch Git

Usare nomi branch in inglese e kebab-case.

Esempi:

```text
feature/m0-setup
feature/m1-members-crud
feature/m2-memberships
fix/member-form-validation
docs/update-database-design
```

---

# 15. Commit

Formato consigliato:

```text
type(scope): description
```

Esempi:

```text
docs(database): add database design
feat(members): add member CRUD
feat(auth): add admin login
fix(payments): update payment status calculation
chore(deps): update dependencies
```

Tipi ammessi:

```text
feat
fix
docs
style
refactor
test
chore
```

---

# 16. Regole per Codex

Codex deve rispettare queste convenzioni.

In caso di dubbio:

1. preferire il naming già presente nel database
2. mantenere coerenza con `DATABASE_DESIGN.md`
3. non introdurre abbreviazioni
4. non mischiare italiano e inglese nel codice
5. non rinominare entità esistenti senza motivazione documentata

---

# 17. Esempi finali corretti

## Database

```text
members
membership_plans
email_campaign_recipients
created_at
archived_at
payment_status
```

## React

```text
MemberTable.tsx
SponsorForm.tsx
DashboardCard.tsx
```

## Route

```text
/members
/sponsors
/email
/email/templates
/email/campaigns
```

## Service

```text
members.service.ts
email-campaigns.service.ts
```

## Hook

```text
useMembers.ts
useMemberships.ts
```
