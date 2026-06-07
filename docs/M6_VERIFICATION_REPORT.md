# M6 Post-Merge Verification Report

Data verifica: 2026-06-07

Repository verificato: `cricassi/pontenext-management-portal`
Branch di base: `main`
Commit main verificato: `bd0758a`
Branch documentale: `codex/m6-post-merge-verification`
Progetto Supabase: `PonteNext`
Project ref: `uhxfpsamenjhyrfgwckw`

## Esito

M6 risulta verificata dopo il merge della PR #27.

La verifica e' stata eseguita senza modificare codice applicativo, senza creare migration, senza modificare Supabase e senza avviare M7.

## Scope Verificato

M6 include:

- `events`
- `event_sponsors`
- collegamento sponsor-eventi
- `sponsor_contributions.event_id` nullable

Non sono state rilevate tabelle o funzionalita' fuori scope per email o report.

## Repository

### Migration

File presenti nel repository:

- `database/migrations/008_events.sql`
- `database/migrations/009_sponsor_contributions.sql`

Controlli eseguiti sui file:

- `008_events.sql` crea `public.events`.
- `008_events.sql` crea `public.event_sponsors`.
- `008_events.sql` abilita RLS su `events` e `event_sponsors`.
- `009_sponsor_contributions.sql` aggiunge `event_id uuid null` su `public.sponsor_contributions`.
- Le migration M6 non introducono tabelle email o report.
- Le migration M6 non introducono policy `DELETE`.

### Route

Route M6 presenti:

- `/events`
- `/events/new`
- `/events/[id]`
- `/events/[id]/edit`

File verificati:

- `src/app/(admin)/events/page.tsx`
- `src/app/(admin)/events/new/page.tsx`
- `src/app/(admin)/events/[id]/page.tsx`
- `src/app/(admin)/events/[id]/edit/page.tsx`
- `src/app/(admin)/events/actions.ts`

### Protezione Route

Le pagine M6 chiamano `requireActiveAdmin()` prima del caricamento dati.

Presenze verificate:

- `src/app/(admin)/events/page.tsx`
- `src/app/(admin)/events/new/page.tsx`
- `src/app/(admin)/events/[id]/page.tsx`
- `src/app/(admin)/events/[id]/edit/page.tsx`
- `src/app/(admin)/events/actions.ts`

Browser check locale senza sessione:

- `http://127.0.0.1:3013/events` reindirizza a `/login`.
- `http://127.0.0.1:3013/events/new` reindirizza a `/login`.
- `http://127.0.0.1:3013/events/00000000-0000-0000-0000-000000000000` reindirizza a `/login`.
- `http://127.0.0.1:3013/events/00000000-0000-0000-0000-000000000000/edit` reindirizza a `/login`.

In tutti i casi il form login era visibile e non sono stati rilevati errori console.

## Supabase Live

Validazione eseguita in sola lettura sul progetto `PonteNext`.

### Migration Applicate

Migration M6 presenti nella lista migration live:

- `20260607164703 008_events`
- `20260607164732 009_sponsor_contributions`

### Tabelle

Tabelle M6 presenti:

- `public.events`
- `public.event_sponsors`

### sponsor_contributions.event_id

Colonna verificata:

- tabella: `public.sponsor_contributions`
- colonna: `event_id`
- tipo: `uuid`
- nullable: `YES`
- default: `null`

### RLS

RLS attiva sulle tabelle:

- `public.events`
- `public.event_sponsors`
- `public.sponsor_contributions`

### Policy

Policy rilevate su `events`, `event_sponsors` e `sponsor_contributions`:

- `SELECT` per admin attivi
- `INSERT` per admin attivi
- `UPDATE` per admin attivi

Nessuna policy `DELETE` rilevata.

### Vincoli e Trigger

Vincoli principali confermati:

- `events.name` non vuoto.
- `events.status` limitato a `planned`, `confirmed`, `completed`, `cancelled`.
- `events.end_datetime` nullo oppure maggiore/uguale a `start_datetime`.
- `event_sponsors.event_id` referenzia `events(id)` con `ON DELETE RESTRICT`.
- `event_sponsors.sponsor_id` referenzia `sponsors(id)` con `ON DELETE RESTRICT`.
- `sponsor_contributions.event_id` referenzia `events(id)` con `ON DELETE RESTRICT`.

Trigger confermati:

- `set_events_updated_at`
- `set_event_sponsors_updated_at`
- `set_sponsor_contributions_updated_at`
- `validate_sponsor_contribution_event_link` su `sponsor_contributions` per `INSERT` e `UPDATE`

### Assenza Out Of Scope

Non risultano presenti nello schema pubblico:

- `email`
- `emails`
- `email_templates`
- `email_campaigns`
- `email_campaign_recipients`
- `reports`
- `report_definitions`

## Verifiche Locali

Comandi eseguiti:

- `npm run lint`: superato.
- `npx tsc --noEmit`: superato.
- `npm run build`: superato.

Nota ambientale:

- `npm run build` nel sandbox ha compilato ma ha fallito nella fase TypeScript con `Error: spawn EPERM`.
- Lo stesso comando rieseguito fuori sandbox e' passato.
- Il comportamento e' coerente con un limite ambientale del sandbox, non con un errore applicativo.

Output build rilevante:

- `/events`
- `/events/new`
- `/events/[id]`
- `/events/[id]/edit`

## Decisione

M6 Post-Merge Verification: superata.

La PR documentale puo' essere usata come esito finale della verifica post-merge di M6.

## Note Residue

- La verifica browser ha coperto la protezione delle route senza sessione.
- Non sono state eseguite operazioni di scrittura sul database live.
- Non sono state create o applicate migration.
- Non sono state introdotte modifiche di codice.
