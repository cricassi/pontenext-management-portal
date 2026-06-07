# M5 Post-Merge Verification Report

Data verifica: 2026-06-07

Repository: `cricassi/pontenext-management-portal`

Branch verificata: `main`, aggiornata con `git pull origin main`

Commit verificato: `5abc8b92ebac342ac1b5d0e3be30cdd01de60c00`

Progetto Supabase verificato: `PonteNext` (`uhxfpsamenjhyrfgwckw`)

Modalita': verifica post-merge richiesta per M5. Non sono stati modificati codice applicativo, migration o database Supabase. Le query Supabase sono state eseguite in sola lettura.

## Esito

Esito complessivo: non superato.

Motivo bloccante: il repository `main` aggiornato non contiene il codice M5 della PR #22.

Evidenza Git:

- `git pull origin main`: `Already up to date`
- `main` e' fermo al merge della PR #21 (`5abc8b9`)
- i commit M5 `c713129`, `3b13fd2` e `62491f6` risultano presenti solo sulla branch `codex/m5-sponsors`
- `src/app/(admin)/sponsors/*` non e' presente su `main`
- `src/services/sponsors.service.ts` non e' presente su `main`
- `src/types/sponsor.ts` non e' presente su `main`
- `docs/M5_CHECKLIST.md` e `docs/M5_REVIEW_REPORT.md` non sono presenti su `main`
- `docs/DATABASE_DESIGN.md` su `main` cita ancora `event_id` dentro `sponsor_contributions`, quindi la documentazione post-M5 non risulta aggiornata in questa branch

Il database live Supabase risulta invece gia' aggiornato a M5. Questo crea disallineamento tra repository `main` e database live.

## Verifica Repository

### Migration 007

Esito repository: non superato.

Il file `database/migrations/007_sponsors.sql` presente su `main` e' ancora un placeholder:

```sql
-- 007_sponsors.sql
-- Migration placeholder for PonteNext Management Portal.
-- Generate this incrementally with Codex following /docs/DATABASE_DESIGN.md.
```

Esito Supabase live: superato.

La migration live applicata risulta:

- `20260607132737` - `007_sponsors`

### Route M5

Esito: non superato.

Route assenti su `main`:

- `/sponsors`
- `/sponsors/new`
- `/sponsors/[id]`
- `/sponsors/[id]/edit`

Browser check locale su `http://127.0.0.1:3007`:

- `/login`: render corretto
- `/sponsors`: `404`, non redirect a `/login`
- `/sponsors/new`: `404`, non redirect a `/login`
- console browser: nessun errore rilevante

La verifica "route presenti e protette" non passa perche' le route non esistono nel repository `main`.

### Service Layer e Tipi

Esito: non superato.

Assenti su `main`:

- `src/services/sponsors.service.ts`
- `src/types/sponsor.ts`

Di conseguenza non sono presenti nel repository `main`:

- validazioni form sponsor
- validazioni contributi sponsor
- funzioni CRUD sponsor
- funzioni CRUD contributi sponsor
- funzioni di archiviazione sponsor/contributi

### Soft Delete

Esito repository: non superato.

Il codice applicativo M5 non e' presente su `main`, quindi non esistono service/action UI che archivino sponsor e contributi tramite `archived_at`.

Esito Supabase live: superato.

Le tabelle live includono:

- `sponsors.archived_at`
- `sponsor_contributions.archived_at`

## Verifica Supabase Live

Progetto: `PonteNext`

Project ref: `uhxfpsamenjhyrfgwckw`

Stato progetto: `ACTIVE_HEALTHY`

Database: PostgreSQL `17.6.1.127`

### Migration Applicate

Migration live rilevate:

- `001_extensions`
- `002_admin_users`
- `003_harden_admin_functions`
- `004_members_roles`
- `005_membership_plans`
- `006_memberships_payments`
- `007_sponsors`

Esito: superato.

### Tabelle Presenti

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

Esito M5:

- `sponsors`: presente
- `sponsor_contributions`: presente
- `events`: assente
- `event_sponsors`: assente
- `email_templates`: assente
- `email_campaigns`: assente
- `email_campaign_recipients`: assente
- `reports`: assente

### Colonne Sponsor

`sponsors` live contiene:

- `id`
- `company_name`
- `contact_name`
- `email`
- `phone`
- `website`
- `address`
- `city`
- `vat_number`
- `fiscal_code`
- `notes`
- `status`
- `created_at`
- `updated_at`
- `archived_at`

### Colonne Sponsor Contributions

`sponsor_contributions` live contiene:

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

Esito `event_id`: superato.

`event_id` non e' presente in `sponsor_contributions`.

### RLS e Policy

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

Esito: superato.

### Vincoli M5 Live

Vincoli live rilevati:

- `sponsors_company_name_not_blank`
- `sponsors_status_check`
- `sponsor_contributions_sponsor_id_fkey`
- `sponsor_contributions_amount_check`
- `sponsor_contributions_type_check`
- `sponsor_contributions_money_amount_check`
- `sponsor_contributions_non_money_description_check`

Validazioni garantite dal database live:

- sponsor `company_name` non vuoto
- contributi `money` con `amount > 0`
- contributi `goods`, `service`, `other` con `description` obbligatoria
- contributi non monetari con `amount = 0` ammessi
- contributi sempre collegati a uno sponsor

Esito Supabase: superato.

Esito repository: non superato, per assenza del service layer M5 su `main`.

### Trigger

Trigger live rilevati:

- `set_sponsors_updated_at`
- `set_sponsor_contributions_updated_at`

Esito: superato.

## Nessuna Logica Contabile/Fiscale

Supabase live:

- nessuna tabella contabile introdotta
- nessuna tabella fatture
- nessuna tabella IVA
- nessuna prima nota
- nessun metodo di pagamento sponsor
- nessuna relazione con `payments`

Repository `main`:

- nessun codice M5 presente, quindi nessuna logica contabile/fiscale M5 introdotta

Esito: superato per assenza di elementi fuori scope, ma il modulo M5 applicativo e' assente.

## Verifiche CLI

Eseguite su branch `codex/m5-post-merge-verification` derivata da `main` aggiornato.

- `npm run lint`: superato
- `npx tsc --noEmit`: superato dopo pulizia della cache generata `.next` rimasta dalla branch M5 precedente
- `npm run build`: superato fuori sandbox

Nota build:

- la prima build in sandbox ha compilato correttamente ma si e' fermata su `spawn EPERM`
- la riesecuzione fuori sandbox e' passata
- l'output build non include route `/sponsors`

Route presenti nell'output build:

- `/dashboard`
- `/expirations`
- `/login`
- `/members`
- `/members/[id]`
- `/members/[id]/edit`
- `/members/new`
- `/memberships`
- `/memberships/[id]`
- `/memberships/new`
- `/settings`
- `/settings/membership-plans`
- `/settings/roles`

Route `/sponsors`: assenti.

## Checklist Richiesta

| Verifica | Esito | Note |
| --- | --- | --- |
| migration `007_sponsors` applicata | OK live / KO repo | Live applicata, file repo ancora placeholder |
| tabelle `sponsors` e `sponsor_contributions` presenti | OK live | Presenti su Supabase |
| nessun `event_id` in `sponsor_contributions` | OK live | Colonna assente |
| nessuna tabella `events`/`event_sponsors` | OK live | Tabelle assenti |
| nessuna tabella email/report | OK live | Tabelle assenti |
| RLS attiva su `sponsors` e `sponsor_contributions` | OK live | RLS attiva |
| nessuna policy `DELETE` | OK live | Nessuna policy DELETE rilevata |
| route `/sponsors` e `/sponsors/new` presenti e protette | KO | Route assenti su `main`, browser restituisce 404 |
| validazioni M5 presenti | OK live / KO repo | Vincoli DB presenti, service/app assenti |
| soft delete presente | OK live / KO repo | Colonne live presenti, service/app assenti |
| nessuna logica contabile/fiscale | OK | Nessun elemento fuori scope rilevato |
| lint/build/typecheck validi | OK | Build passata fuori sandbox |

## Problemi Bloccanti

1. La PR #22 non risulta mergiata in `main` al momento della verifica.
2. Il repository `main` non contiene l'implementazione M5 applicativa.
3. Il file `database/migrations/007_sponsors.sql` su `main` e' ancora placeholder, mentre Supabase live contiene gia' la migration M5 applicata.
4. Le route `/sponsors` e `/sponsors/new` non sono presenti e non sono protette: restituiscono `404`.
5. La documentazione `DATABASE_DESIGN.md` su `main` non recepisce ancora la decisione M5 definitiva su `sponsor_contributions` senza `event_id`.

## Rischi

- Disallineamento tra database live e repository `main`.
- Un nuovo ambiente creato da `main` non potrebbe ricostruire lo schema M5, perche' la migration locale e' ancora placeholder.
- La UI non espone il modulo sponsor anche se le tabelle live esistono.
- La verifica post-merge non puo' essere considerata valida finche' PR #22 non viene mergiata o finche' `main` non contiene gli stessi cambiamenti.

## Decisione Finale

Esito: non superato.

M5 non puo' essere considerata verificata post-merge su `main` perche' il merge effettivo della PR #22 non risulta presente nel repository aggiornato.

Prossimo passo consigliato:

1. Verificare lo stato della PR #22 su GitHub.
2. Se appropriato, eseguire il merge della PR #22.
3. Ripetere la M5 Post-Merge Verification su `main` dopo il merge effettivo.
