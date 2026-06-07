# M5 Post-Merge Verification Report

Data verifica: 2026-06-07

Branch verificata: `main`

Commit verificato: `b46a3b45aaec62979a08aa726bc09dbc3c728e95`

PR di riallineamento verificata: #24

Progetto Supabase verificato: `PonteNext` (`uhxfpsamenjhyrfgwckw`)

Modalita': verifica post-merge finale dopo il merge effettivo della PR #24. Non sono stati modificati codice applicativo, migration operative o database Supabase. Le verifiche Supabase sono state eseguite in sola lettura.

## Esito

Esito complessivo: superato.

Il repository `main` e il progetto Supabase live risultano allineati per M5 Sponsors.

## Repository

### Route M5

Esito: superato.

Route presenti nel repository:

- `src/app/(admin)/sponsors/page.tsx`
- `src/app/(admin)/sponsors/new/page.tsx`
- `src/app/(admin)/sponsors/[id]/page.tsx`
- `src/app/(admin)/sponsors/[id]/edit/page.tsx`

Route presenti nell'output `next build`:

- `/sponsors`
- `/sponsors/new`
- `/sponsors/[id]`
- `/sponsors/[id]/edit`

### Service Layer e Types

Esito: superato.

File presenti:

- `src/services/sponsors.service.ts`
- `src/types/sponsor.ts`

Il service layer include:

- lettura elenco sponsor
- lettura dettaglio sponsor
- creazione sponsor
- aggiornamento sponsor
- archiviazione sponsor
- lettura contributi sponsor
- creazione contributi sponsor
- aggiornamento contributi sponsor
- archiviazione contributi sponsor
- validazioni form sponsor
- validazioni form contributi sponsor

### Componenti UI M5

Esito: superato.

Componenti presenti:

- `SponsorCardList.tsx`
- `SponsorContributionCardList.tsx`
- `SponsorContributionForm.tsx`
- `SponsorContributionTable.tsx`
- `SponsorContributionTypeBadge.tsx`
- `SponsorDetail.tsx`
- `SponsorFilters.tsx`
- `SponsorForm.tsx`
- `SponsorStatusBadge.tsx`
- `SponsorTable.tsx`

### Migration 007

Esito: superato.

`database/migrations/007_sponsors.sql` contiene la migration reale M5, non piu' il placeholder.

La migration:

- crea `public.sponsors`
- crea `public.sponsor_contributions`
- non crea `events`
- non crea `event_sponsors`
- non crea tabelle email/report
- non introduce `event_id`
- abilita RLS su entrambe le tabelle
- crea policy `SELECT`, `INSERT`, `UPDATE` per admin attivi tramite `app_private.is_active_admin()`
- non crea policy `DELETE`
- crea trigger `set_updated_at` su entrambe le tabelle

### Scope e Out of Scope

Esito: superato.

Controllo testuale eseguito su migration, route M5, componenti M5, service e types:

- nessun `event_id`
- nessun `event_sponsors`
- nessuna dipendenza da eventi
- nessuna email
- nessun report
- nessuna dashboard avanzata
- nessuna fatturazione
- nessuna prima nota
- nessun metodo pagamento sponsor
- nessuna cancellazione fisica via `.delete()`

Nota: `vat_number` e la label "Partita IVA" sono presenti solo come dati anagrafici opzionali dello sponsor e non introducono logica IVA o fiscale.

## Supabase Live

Progetto:

- nome: `PonteNext`
- project ref: `uhxfpsamenjhyrfgwckw`
- stato: `ACTIVE_HEALTHY`
- database: PostgreSQL `17.6.1.127`

### Migration Applicate

Esito: superato.

Migration live rilevate:

- `001_extensions`
- `002_admin_users`
- `003_harden_admin_functions`
- `004_members_roles`
- `005_membership_plans`
- `006_memberships_payments`
- `007_sponsors`

### Tabelle Live

Esito: superato.

Tabelle `public` rilevate:

- `admin_users`
- `member_roles`
- `members`
- `membership_plans`
- `memberships`
- `payments`
- `roles`
- `sponsor_contributions`
- `sponsors`

Tabelle fuori scope assenti:

- `events`
- `event_sponsors`
- `email_templates`
- `email_campaigns`
- `email_campaign_recipients`
- `reports`

### Sponsor Contributions

Esito: superato.

Colonne live di `sponsor_contributions`:

- `id`
- `sponsor_id`
- `contribution_date`
- `amount`
- `contribution_type`
- `description`
- `notes`
- `created_at`
- `updated_at`
- `archived_at`

`event_id`: assente.

### RLS e Policy

Esito: superato.

RLS live:

- `sponsors`: attiva
- `sponsor_contributions`: attiva

Policy live rilevate:

- `sponsors_select_active_admin`
- `sponsors_insert_active_admin`
- `sponsors_update_active_admin`
- `sponsor_contributions_select_active_admin`
- `sponsor_contributions_insert_active_admin`
- `sponsor_contributions_update_active_admin`

Tutte le policy usano `app_private.is_active_admin()`.

Policy `DELETE`: nessuna policy `DELETE` rilevata.

### Vincoli e Trigger

Esito: superato.

Vincoli live M5 rilevati:

- `sponsors_company_name_not_blank`
- `sponsors_status_check`
- `sponsor_contributions_sponsor_id_fkey`
- `sponsor_contributions_amount_check`
- `sponsor_contributions_type_check`
- `sponsor_contributions_money_amount_check`
- `sponsor_contributions_non_money_description_check`

Trigger live rilevati:

- `set_sponsors_updated_at`
- `set_sponsor_contributions_updated_at`

### Security Advisor

Supabase Security Advisor segnala ancora `auth_leaked_password_protection` disabilitato.

Il warning riguarda la configurazione Supabase Auth, non e' introdotto da M5 e non blocca questa verifica di allineamento repository/schema.

## Route Protette

Esito: superato.

Browser check locale:

- comando dev server: `npm run dev -- --hostname 127.0.0.1 --port 3009`
- URL base: `http://127.0.0.1:3009`

Risultati:

- `/login`: `200`, heading `Accesso amministratori`
- `/sponsors`: redirect a `/login`
- `/sponsors/new`: redirect a `/login`
- `/sponsors/00000000-0000-0000-0000-000000000000`: redirect a `/login`
- `/sponsors/00000000-0000-0000-0000-000000000000/edit`: redirect a `/login`
- nessun `404`
- nessun messaggio `Supabase non configurato`
- nessun overlay framework
- nessun errore console
- nessun errore server

Log dev server:

- `GET /login 200`
- `GET /sponsors 307`
- `GET /sponsors/new 307`
- `GET /sponsors/00000000-0000-0000-0000-000000000000 307`
- `GET /sponsors/00000000-0000-0000-0000-000000000000/edit 307`

## Verifiche CLI

Esito: superato.

- `npm run lint`: superato
- `npx tsc --noEmit`: superato
- `npm run build`: superato fuori sandbox

Nota build:

- la prima esecuzione in sandbox ha compilato correttamente ma si e' fermata su `spawn EPERM`
- la riesecuzione fuori sandbox e' passata
- l'output build include tutte le route M5 richieste

## Checklist Finale

| Verifica | Esito |
| --- | --- |
| route `/sponsors` presente | OK |
| route `/sponsors/new` presente | OK |
| route `/sponsors/[id]` presente | OK |
| route `/sponsors/[id]/edit` presente | OK |
| service M5 presente | OK |
| types M5 presenti | OK |
| componenti UI M5 presenti | OK |
| `007_sponsors.sql` contiene migration reale | OK |
| Supabase live contiene `sponsors` | OK |
| Supabase live contiene `sponsor_contributions` | OK |
| nessun `event_id` in `sponsor_contributions` | OK |
| nessuna tabella `events`/`event_sponsors` | OK |
| nessuna tabella email/report | OK |
| RLS attiva | OK |
| nessuna policy `DELETE` | OK |
| route M5 protette | OK |
| lint valido | OK |
| typecheck valido | OK |
| build valida | OK |

## Decisione Finale

M5 Post-Merge Verification dopo il merge della PR #24: superata.

Il repository `main` e Supabase live risultano allineati per M5 Sponsors. Non sono state introdotte funzionalita' M6, eventi, email, report, dashboard avanzata o logica contabile/fiscale.
