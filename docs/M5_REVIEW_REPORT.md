# M5 Review Report - Sponsors

Data review: 2026-06-07

Branch/PR: `codex/m5-sponsors` / PR #22

Progetto Supabase validato: `PonteNext` (`uhxfpsamenjhyrfgwckw`)

Modalita': review tecnica finale, con verifica Supabase in sola lettura. Non sono state applicate migration, non sono state create tabelle e non e' stato modificato il database durante questa review.

## Esito

Esito complessivo: positivo.

Decisione finale: merge si'.

Problemi bloccanti: nessuno.

Problemi non bloccanti:

- I grant catalogo Supabase mostrano privilegi ampi per il ruolo `authenticated` su `sponsors` e `sponsor_contributions`, inclusi `DELETE` e `TRUNCATE`. Non risultano policy `DELETE`, RLS e' attiva e il service/UI non usano cancellazioni fisiche; quindi non e' bloccante per M5. Raccomandazione: valutare una migration futura di hardening dei privilegi tabella, se si vuole allineare anche i grant nominali al solo `SELECT`, `INSERT`, `UPDATE`.
- Supabase Security Advisor segnala `auth_leaked_password_protection` disabilitato. Il warning riguarda Auth, non e' introdotto da M5 e non riguarda le tabelle sponsor.

## Scope M5

Verificato.

- La PR introduce la migration `database/migrations/007_sponsors.sql`.
- La migration crea solo:
  - `public.sponsors`
  - `public.sponsor_contributions`
- `sponsor_contributions` non contiene `event_id`.
- Non vengono create tabelle `events` o `event_sponsors`.
- Non vengono introdotte route, service o componenti per email, report o dashboard avanzata.
- La navigazione abilita solo la voce `Sponsor`; eventi, email e report restano voci disabilitate/future.

Nota: i campi `vat_number`/`fiscal_code` e la label UI "Partita IVA" sono dati anagrafici opzionali previsti da `docs/M5_IMPLEMENTATION_PLAN.md` e `docs/DATABASE_DESIGN.md`; non introducono logica IVA, fatturazione o contabilita'.

## RLS

Verificato su Supabase live in sola lettura.

- `public.sponsors`: RLS attiva.
- `public.sponsor_contributions`: RLS attiva.
- Policy presenti per entrambe le tabelle:
  - `SELECT` per `authenticated` con `app_private.is_active_admin()`
  - `INSERT` per `authenticated` con `app_private.is_active_admin()`
  - `UPDATE` per `authenticated` con `app_private.is_active_admin()`
- Nessuna policy `DELETE` rilevata.
- Trigger `set_updated_at` presenti su entrambe le tabelle.

Migration applicate sul progetto live:

- `001_extensions`
- `002_admin_users`
- `003_harden_admin_functions`
- `004_members_roles`
- `005_membership_plans`
- `006_memberships_payments`
- `007_sponsors`

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

Nessuna tabella fuori scope M5 rilevata.

## Route Guard

Verificato nel codice.

- `src/app/(admin)/sponsors/page.tsx` chiama `requireActiveAdmin()` prima di `getSponsors()`.
- `src/app/(admin)/sponsors/new/page.tsx` chiama `requireActiveAdmin()` prima di renderizzare il form.
- `src/app/(admin)/sponsors/[id]/page.tsx` chiama `requireActiveAdmin()` prima di leggere parametri validati e prima di `getSponsorById()`, `getSponsorContributions()` e `getSponsorContributionById()`.
- `src/app/(admin)/sponsors/[id]/edit/page.tsx` chiama `requireActiveAdmin()` prima di `getSponsorById()`.
- Le server action M5 chiamano `requireActiveAdmin()` prima di validazioni e scritture.

Browser check locale:

- Dev server: `npm run dev -- --hostname 127.0.0.1 --port 3006`
- URL base: `http://127.0.0.1:3006`
- `/login`: render corretto, heading `Accesso amministratori`, campi email/password presenti, nessun messaggio di Supabase non configurato.
- `/sponsors` senza sessione: redirect `307` a `/login`.
- `/sponsors/new` senza sessione: redirect `307` a `/login`.
- Console browser: nessun errore o warning rilevante.
- Log dev server: solo `GET /login 200`, `GET /sponsors 307`, `GET /sponsors/new 307`; nessun errore server.

## Validazioni

Verificato nel service layer e nei vincoli database.

Sponsor:

- `company_name` obbligatorio lato DB con check `length(btrim(company_name)) > 0`.
- `companyName` obbligatorio lato service/form.
- `email` opzionale ma validata lato service se presente.
- `website` opzionale ma validato lato service come URL `http` o `https` se presente.
- `status` limitato a `active`, `inactive`, `archived`.

Contributi sponsor:

- `sponsor_id` obbligatorio e FK verso `sponsors(id)` con `ON DELETE RESTRICT`.
- `contribution_type` limitato a `money`, `goods`, `service`, `other`.
- `amount >= 0`.
- Contributo `money`: `amount > 0` richiesto da DB e service.
- Contributi `goods`, `service`, `other`: `description` obbligatoria da DB e service.
- Contributi non monetari con `amount = 0` ammessi.

## Soft Delete

Verificato.

- `archiveSponsor()` aggiorna `status = 'archived'` e `archived_at`.
- `archiveSponsorContribution()` aggiorna `archived_at`.
- Gli elenchi e i dettagli operativi filtrano `archived_at is null`.
- Non sono presenti chiamate `.delete()` nel service M5.
- Non sono presenti policy `DELETE` nella migration M5.
- Non sono presenti azioni UI di cancellazione fisica; le azioni sono di archiviazione.

## Nessuna Logica Contabile

Verificato.

- Nessuna fattura introdotta.
- Nessuna logica IVA introdotta.
- Nessuna prima nota introdotta.
- Nessun metodo di pagamento sponsor introdotto.
- Nessuna relazione con `payments`.
- Nessuna relazione con eventi.
- Gli importi dei contributi sponsor restano dati gestionali interni.

## Verifiche Eseguite

- `npm run lint`: passato.
- `npx tsc --noEmit`: passato.
- `npm run build`: passato fuori sandbox.

Nota build: la prima esecuzione in sandbox ha compilato correttamente ma si e' fermata su `spawn EPERM`, limite ambientale gia' osservato con Next.js/Turbopack. La riesecuzione fuori sandbox e' passata e ha confermato le route:

- `/sponsors`
- `/sponsors/[id]`
- `/sponsors/[id]/edit`
- `/sponsors/new`

## Raccomandazioni

- Valutare hardening dei grant effettivi su `authenticated` per rimuovere privilegi nominali non usati (`DELETE`, `TRUNCATE`, `REFERENCES`, `TRIGGER`) anche se RLS e assenza di policy `DELETE` impediscono la cancellazione tramite API applicativa.
- Valutare in una iterazione UI successiva un dialog di conferma per le azioni di archiviazione, coerente con il piano M5, senza bloccare il merge attuale.

## Decisione Finale

Merge si'.

La PR #22 rispetta lo scope M5, mantiene RLS coerente con M0-M4, protegge le route sponsor, usa soft delete, non introduce tabelle o funzionalita' fuori scope e supera lint, typecheck, build e browser check delle route protette.
