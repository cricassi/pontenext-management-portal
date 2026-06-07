# PonteNext Management Portal

Portale web gestionale responsive per l'amministrazione dell'associazione Ponte Next.

## Obiettivo

Centralizzare la gestione amministrativa dell'associazione attraverso una piattaforma web unica accessibile da browser desktop, tablet e smartphone.

La piattaforma consente progressivamente la gestione di:

- soci e ruoli associativi;
- iscrizioni, rinnovi, quote e pagamenti non contabili;
- sponsor e contributi;
- eventi;
- comunicazioni email;
- reportistica CSV/XLSX.

## Stack

- Next.js App Router
- TypeScript strict
- Tailwind CSS
- shadcn/ui
- Supabase Auth
- Supabase PostgreSQL
- Vercel

## Stato progetto

Fase corrente:

```text
M7 - Email & Campaigns
```

Milestone completate o avviate:

- M0/M0.x: infrastruttura, Supabase Auth, `admin_users`, route protette e bootstrap `super_admin`;
- M1: soci, ruoli e assegnazione ruoli;
- M2: piani iscrizione, iscrizioni storiche e pagamenti non contabili;
- M3: scadenze, filtri 30/60/90 giorni e rinnovo rapido.
- M4: dashboard operativa con KPI e widget basati sui dati M1-M3.
- M5: sponsor e contributi sponsor monetari/non monetari.
- M6: eventi, sponsor evento e contributi sponsor collegati opzionalmente a eventi.
- M7: template email, campagne, destinatari storicizzati e invio confermato tramite Resend.

M2 include:

- route `/memberships`, `/memberships/new`, `/memberships/[id]`;
- route `/settings/membership-plans`;
- storico iscrizioni nella scheda socio;
- migration `membership_plans`, `memberships`, `payments`;
- seed piani iscrizione base.

M3 include:

- route `/expirations`;
- filtri scaduti, entro 30, 60 e 90 giorni;
- pannello scadenza nella scheda socio;
- rinnovo rapido precompilato.

M4 ha lasciato fuori scope sponsor, eventi, email, report e dashboard direzionale.

M3 non introduce nuove migration: scadenze e rinnovi rapidi derivano dalle tabelle M2.

M4 non introduce nuove migration: la dashboard legge in sola lettura `members`,
`memberships`, `payments` e le scadenze derivate da M3.

M5 introduce:

- route `/sponsors`, `/sponsors/new`, `/sponsors/[id]`, `/sponsors/[id]/edit`;
- tabelle `sponsors` e `sponsor_contributions`;
- CRUD sponsor e archiviazione sponsor;
- CRUD contributi sponsor e archiviazione contributi;
- contributi monetari con `amount > 0`;
- contributi non monetari con `description` obbligatoria e `amount` anche pari a `0`.

M5 non introduce eventi, collegamenti sponsor/eventi, email, report, dashboard
avanzata, contabilita', fatturazione, IVA o prima nota.

M6 introduce:

- route `/events`, `/events/new`, `/events/[id]`, `/events/[id]/edit`;
- tabelle `events` e `event_sponsors`;
- colonna nullable `sponsor_contributions.event_id`;
- CRUD eventi e archiviazione eventi;
- collegamento sponsor-eventi;
- visualizzazione contributi collegati a evento;
- integrazione scheda sponsor con eventi collegati.

M6 non introduce email, report, dashboard avanzata, pagamenti online,
contabilita', fatturazione, IVA o prima nota.

M7 introduce:

- route `/email`, `/email/templates`, `/email/campaigns`;
- tabelle `email_templates`, `email_campaigns`, `email_campaign_recipients`;
- template email attivi/archiviati;
- campagne `draft`, `sent`, `failed`;
- snapshot destinatari per soci, soci attivi, soci scaduti, sponsor e destinatari custom;
- invio email con conferma admin esplicita tramite Resend server-side.

M7 non introduce report, dashboard avanzata, area soci, automazioni schedulate,
contabilita', fatturazione, IVA o prima nota.

## Setup locale

### 1. Installazione dipendenze

```bash
npm install
```

### 2. Variabili ambiente

Copiare `.env.example` in `.env.local` e valorizzare:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
RESEND_API_KEY=
EMAIL_FROM=
```

`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` sono usate dal client browser, dal middleware e dal server client Supabase.

`SUPABASE_SERVICE_ROLE_KEY` non deve essere usata nel browser. Serve solo per operazioni server controllate o bootstrap operativo fuori dalla UI. Se il bootstrap viene fatto dal Supabase SQL editor, la chiave service role non serve al runtime locale.

`RESEND_API_KEY` e `EMAIL_FROM` sono usate solo lato server per M7. Non usare il
prefisso `NEXT_PUBLIC_`, non stampare la chiave nei log e non committare valori
reali. `EMAIL_FROM` deve corrispondere a un mittente autorizzato/verificato in
Resend prima dell'invio reale.

### 3. Database fino a M7

Applicare le migration in ordine:

```text
database/migrations/001_extensions.sql
database/migrations/002_admin_users.sql
database/migrations/003_harden_admin_functions.sql
database/migrations/004_members_roles.sql
database/migrations/005_membership_plans.sql
database/migrations/006_memberships_payments.sql
database/migrations/007_sponsors.sql
database/migrations/008_events.sql
database/migrations/009_sponsor_contributions.sql
database/migrations/010_email.sql
```

Applicare poi i seed richiesti dalle milestone:

```text
database/seeds/roles.sql
database/seeds/membership_plans.sql
```

La migration `007_sponsors.sql` crea sia `sponsors` sia
`sponsor_contributions`, senza `event_id`.

La migration `008_events.sql` crea `events` ed `event_sponsors`.

La migration `009_sponsor_contributions.sql` aggiunge
`sponsor_contributions.event_id` nullable per collegare opzionalmente un
contributo sponsor a un evento.

La migration `010_email.sql` crea le tabelle email M7 e abilita RLS admin-only.

Le migration `011` e successive sono placeholder per milestone future e non
vanno applicate durante M7.

### 4. Bootstrap primo super_admin

Creare prima l'utente in Supabase Auth, poi inserire il profilo applicativo con privilegi owner/service role:

```sql
insert into public.admin_users (
  auth_user_id,
  full_name,
  email,
  role,
  status
)
select
  id,
  'Nome Cognome',
  email,
  'super_admin',
  'active'
from auth.users
where email = 'admin@example.com'
on conflict (auth_user_id) do update
set
  full_name = excluded.full_name,
  email = excluded.email,
  role = excluded.role,
  status = excluded.status,
  archived_at = null;
```

Questa operazione non passa dalla UI M0. Va eseguita solo in fase di bootstrap iniziale da Supabase SQL editor, CLI o script controllato con service role.

La procedura completa di verifica Supabase e' documentata in `docs/SUPABASE_SETUP.md`.

### 5. Avvio

```bash
npm run dev
```

Aprire:

```text
http://localhost:3000/login
```

## Script

```bash
npm run dev
npm run build
npm run lint
npx tsc --noEmit
npm run start
```

### Lint

Il progetto usa Next.js 16. La command storica `next lint` non e' utilizzata: il lint passa dalla ESLint CLI configurata con `eslint.config.mjs`.

```bash
npm run lint
```

Lo script esegue:

```bash
eslint --max-warnings=0 src middleware.ts next.config.mjs tailwind.config.ts postcss.config.js
```

## Struttura

```text
docs/
database/
  migrations/
  seeds/
src/
  app/
  components/
  hooks/
  lib/
  services/
  types/
  utils/
scripts/
```

## Documentazione

La documentazione progettuale e' in `docs/`.

Documenti principali:

- `docs/PRD.md`
- `docs/MASTER_DEVELOPMENT_PLAN.md`
- `docs/ADR-001_ARCHITECTURE.md`
- `docs/DATABASE_DESIGN.md`
- `docs/SCREEN_FLOW.md`
- `docs/UI_GUIDELINES.md`
- `docs/NAMING_CONVENTIONS.md`
- `docs/CODEX_INSTRUCTIONS.md`
- `docs/M0_CHECKLIST.md`
- `docs/M0_5_CHECKLIST.md`
- `docs/M1_IMPLEMENTATION_PLAN.md`
- `docs/M1_CHECKLIST.md`
- `docs/M2_IMPLEMENTATION_PLAN.md`
- `docs/M2_CHECKLIST.md`
- `docs/M3_IMPLEMENTATION_PLAN.md`
- `docs/M3_CHECKLIST.md`
- `docs/M4_IMPLEMENTATION_PLAN.md`
- `docs/M4_CHECKLIST.md`
- `docs/M5_IMPLEMENTATION_PLAN.md`
- `docs/M5_CHECKLIST.md`
- `docs/M6_IMPLEMENTATION_PLAN.md`
- `docs/M6_CHECKLIST.md`
- `docs/M7_IMPLEMENTATION_PLAN.md`
- `docs/M7_CHECKLIST.md`
- `docs/SUPABASE_SETUP.md`
- `docs/SUPABASE_VALIDATION_REPORT.md`

## Fuori scope

Non implementare:

- contabilita';
- fatturazione;
- IVA;
- bilanci;
- prima nota;
- area riservata soci;
- app mobile nativa;
- pagamenti online.
