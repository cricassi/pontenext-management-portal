# M5 Repository Sync Repair Report

Data repair: 2026-06-07

Branch: `codex/m5-sync-repair`

Base: `main` aggiornato con `git pull origin main`

Progetto Supabase verificato: `PonteNext` (`uhxfpsamenjhyrfgwckw`)

Modalita': riallineamento repository allo stato M5 gia' presente su Supabase live. Non sono state applicate migration, non sono state create tabelle, non sono stati modificati dati live e non sono state eseguite operazioni di scrittura su Supabase.

## Esito

Esito complessivo: superato.

Il repository e' stato riallineato allo stato M5 gia' applicato su Supabase live recuperando l'implementazione della PR #22.

## Causa del Repair

La verifica post-merge M5 aveva rilevato un disallineamento:

- Supabase live conteneva gia' `007_sponsors`.
- Supabase live conteneva gia' `sponsors` e `sponsor_contributions`.
- Supabase live aveva RLS e policy M5 attive.
- `main` non conteneva ancora il codice M5.
- `database/migrations/007_sponsors.sql` su `main` era ancora un placeholder.
- Le route `/sponsors` e `/sponsors/new` risultavano assenti su `main`.

## Intervento Eseguito

Sono stati recuperati i commit M5 gia' revisionati dalla PR #22:

- `c713129` - `feat: implement M5 sponsors`
- `3b13fd2` - `fix: harden sponsor route guards`
- `62491f6` - `docs: add M5 review report`

Nel branch repair i commit risultano riapplicati come:

- `a40680d` - `feat: implement M5 sponsors`
- `8fa76b5` - `fix: harden sponsor route guards`
- `4092a79` - `docs: add M5 review report`

## File M5 Ripristinati

Migration:

- `database/migrations/007_sponsors.sql`

Route:

- `src/app/(admin)/sponsors/page.tsx`
- `src/app/(admin)/sponsors/new/page.tsx`
- `src/app/(admin)/sponsors/[id]/page.tsx`
- `src/app/(admin)/sponsors/[id]/edit/page.tsx`
- `src/app/(admin)/sponsors/actions.ts`

Service layer e tipi:

- `src/services/sponsors.service.ts`
- `src/types/sponsor.ts`

Componenti UI:

- `src/components/sponsors/SponsorCardList.tsx`
- `src/components/sponsors/SponsorContributionCardList.tsx`
- `src/components/sponsors/SponsorContributionForm.tsx`
- `src/components/sponsors/SponsorContributionTable.tsx`
- `src/components/sponsors/SponsorContributionTypeBadge.tsx`
- `src/components/sponsors/SponsorDetail.tsx`
- `src/components/sponsors/SponsorFilters.tsx`
- `src/components/sponsors/SponsorForm.tsx`
- `src/components/sponsors/SponsorStatusBadge.tsx`
- `src/components/sponsors/SponsorTable.tsx`

Documentazione ripristinata/aggiornata dalla PR #22:

- `README.md`
- `docs/BUSINESS_RULES.md`
- `docs/CHANGELOG.md`
- `docs/DATABASE_DESIGN.md`
- `docs/M5_CHECKLIST.md`
- `docs/M5_REVIEW_REPORT.md`
- `docs/SCREEN_FLOW.md`
- `docs/SUPABASE_VALIDATION_REPORT.md`

Navigazione:

- `src/components/layout/navigation.ts`

## Migration 007

Esito: riallineata.

`database/migrations/007_sponsors.sql` non e' piu' placeholder e contiene la migration M5 gia' applicata live:

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

## Verifica Scope

Esito: superato.

Il repair introduce solo il perimetro M5:

- sponsor
- contributi sponsor
- CRUD sponsor
- CRUD contributi sponsor
- archiviazione logica
- UI e route admin M5

Non introduce:

- M6
- eventi
- `event_sponsors`
- `event_id`
- email
- report
- dashboard avanzata
- logica contabile
- fatture
- IVA
- prima nota
- metodo pagamento sponsor

Nota: `vat_number` e la label "Partita IVA" restano dati anagrafici opzionali previsti dalla documentazione M5 e non introducono logica IVA o fiscale.

## Verifica Supabase Live Read-Only

Progetto verificato:

- nome: `PonteNext`
- project ref: `uhxfpsamenjhyrfgwckw`
- stato: `ACTIVE_HEALTHY`
- Postgres: `17.6.1.127`

Migration live rilevate:

- `001_extensions`
- `002_admin_users`
- `003_harden_admin_functions`
- `004_members_roles`
- `005_membership_plans`
- `006_memberships_payments`
- `007_sponsors`

Tabelle `public` live:

- `admin_users`
- `member_roles`
- `members`
- `membership_plans`
- `memberships`
- `payments`
- `roles`
- `sponsor_contributions`
- `sponsors`

Assenti live:

- `events`
- `event_sponsors`
- `email_templates`
- `email_campaigns`
- `email_campaign_recipients`
- `reports`

Colonna `event_id`:

- assente in `sponsor_contributions`

RLS:

- `sponsors`: attiva
- `sponsor_contributions`: attiva

Policy M5:

- `sponsors_select_active_admin`
- `sponsors_insert_active_admin`
- `sponsors_update_active_admin`
- `sponsor_contributions_select_active_admin`
- `sponsor_contributions_insert_active_admin`
- `sponsor_contributions_update_active_admin`

Policy `DELETE`:

- nessuna policy `DELETE` rilevata

Vincoli live M5:

- `sponsors_company_name_not_blank`
- `sponsors_status_check`
- `sponsor_contributions_sponsor_id_fkey`
- `sponsor_contributions_amount_check`
- `sponsor_contributions_type_check`
- `sponsor_contributions_money_amount_check`
- `sponsor_contributions_non_money_description_check`

Trigger live:

- `set_sponsors_updated_at`
- `set_sponsor_contributions_updated_at`

## Route Guard

Esito: superato.

Le pagine M5 chiamano `requireActiveAdmin()` prima di ogni fetch:

- `/sponsors`
- `/sponsors/new`
- `/sponsors/[id]`
- `/sponsors/[id]/edit`

Le server action M5 chiamano `requireActiveAdmin()` prima di validazioni e scritture.

Browser check locale su `http://127.0.0.1:3008`:

- `/login`: `200`, heading `Accesso amministratori`
- `/sponsors` senza sessione: redirect a `/login`
- `/sponsors/new` senza sessione: redirect a `/login`
- nessun `404`
- nessun errore console
- nessun errore server

Log dev server:

- `GET /login 200`
- `GET /sponsors 307`
- `GET /sponsors/new 307`

## Validazioni e Soft Delete

Esito: superato.

Validazioni ripristinate:

- sponsor `companyName` obbligatorio
- email valida se presente
- website valida se presente
- contributo `money` con `amount > 0`
- contributi `goods`, `service`, `other` con `description` obbligatoria
- contributi non monetari con `amount = 0` ammessi

Soft delete:

- `archiveSponsor()` aggiorna `status = 'archived'` e `archived_at`
- `archiveSponsorContribution()` aggiorna `archived_at`
- il service filtra di default `archived_at is null`
- non sono presenti chiamate `.delete()` nel service M5
- non sono presenti policy `DELETE`

## Verifiche Eseguite

- `npm run lint`: superato
- `npx tsc --noEmit`: superato
- `npm run build`: superato fuori sandbox
- validazione Supabase: sola lettura, superata
- browser check route protette: superato

Nota build:

- la prima esecuzione in sandbox ha compilato correttamente ma si e' fermata su `spawn EPERM`
- la riesecuzione fuori sandbox e' passata
- l'output build include:
  - `/sponsors`
  - `/sponsors/[id]`
  - `/sponsors/[id]/edit`
  - `/sponsors/new`

## Decisione Finale

Il repair riallinea il repository allo stato live Supabase M5 senza modificare il database.

Esito finale: PR pronta per review e merge.
