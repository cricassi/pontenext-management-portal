# M6 Review Report - Events

## Esito

Review tecnica finale della PR #27 eseguita su branch `codex/m6-events`, commit
`1873b62`.

Esito complessivo: superata.

Decisione finale: merge si.

Non sono stati modificati codice applicativo, migration o database durante la
review. Le verifiche Supabase sono state eseguite solo in lettura.

## Problemi bloccanti

Nessuno.

## Problemi non bloccanti

- `npm run build` fallisce dentro sandbox con `spawn EPERM`; eseguita fuori
  sandbox con successo. Il problema e' ambientale e gia' osservato nelle
  milestone precedenti.
- La prima esecuzione di `npx tsc --noEmit`, dopo la build sandbox fallita, ha
  trovato `.next/types` incompleta. Dopo `npm run build` fuori sandbox,
  `npx tsc --noEmit` e' passato.
- Supabase Security Advisor segnala ancora `auth_leaked_password_protection`
  disabilitato. Il warning e' preesistente, riguarda Supabase Auth e non e'
  introdotto da M6.
- Supabase Performance Advisor segnala vari `unused_index`, inclusi indici M6.
  Sono avvisi informativi coerenti con database vuoto o poco usato; gli indici
  sono coerenti con query, filtri e join previsti.
- Non sono stati eseguiti test di scrittura live per vincolo read-only della
  review. La validazione dei contributi collegati a evento e' stata verificata
  tramite definizione trigger, vincoli DB, service layer e UI.

## Scope M6

Verificato:

- `database/migrations/008_events.sql` crea `events` ed `event_sponsors`.
- `database/migrations/009_sponsor_contributions.sql` aggiunge solo
  `sponsor_contributions.event_id` nullable.
- Non sono introdotte tabelle email, report, dashboard avanzata, pagamenti
  online o contabilita'.
- Non sono presenti nuove logiche di fatturazione, IVA o prima nota.
- La navigazione abilita `Eventi`, mentre `Email` e `Report` restano fuori
  scope e disabilitati.

## Modello dati

Verificato:

- `events` puo' esistere senza sponsor: non esiste FK obbligatoria da `events`
  verso sponsor.
- `event_sponsors` rappresenta la relazione molti-a-molti sponsor-evento con
  `event_id` e `sponsor_id` obbligatori.
- `sponsor_contributions.event_id` rappresenta un contributo specifico collegato
  a un evento.
- `sponsor_contributions.event_id` e' nullable sul database live.
- Un contributo senza evento resta valido: la colonna e' nullable e il trigger
  `validate_sponsor_contribution_event_link` ritorna subito se `new.event_id is
  null`.
- Il vincolo FK `sponsor_contributions_event_id_fkey` usa `on delete restrict`,
  coerente con soft delete.
- L'indice unique parziale su `event_sponsors(event_id, sponsor_id)` vale solo
  per collegamenti non archiviati.

## RLS

Verificato su Supabase live `PonteNext` (`uhxfpsamenjhyrfgwckw`):

- RLS attiva su `public.events`.
- RLS attiva su `public.event_sponsors`.
- RLS attiva su `public.sponsor_contributions`.
- Policy `SELECT`, `INSERT`, `UPDATE` basate su
  `app_private.is_active_admin()`.
- Nessuna policy `DELETE` su `events`, `event_sponsors` o
  `sponsor_contributions`.
- Nessuna tabella fuori scope email/report/audit presente.

## Route guard

Verificato:

- `src/app/(admin)/events/page.tsx` chiama `requireActiveAdmin()` prima di
  `getEvents`.
- `src/app/(admin)/events/new/page.tsx` chiama `requireActiveAdmin()` prima del
  render del form.
- `src/app/(admin)/events/[id]/page.tsx` chiama `requireActiveAdmin()` prima di
  validare params e prima di ogni fetch.
- `src/app/(admin)/events/[id]/edit/page.tsx` chiama `requireActiveAdmin()`
  prima di validare params e prima di `getEventById`.
- Le Server Actions M6 chiamano `requireActiveAdmin()` prima di validazioni e
  mutazioni.

Browser check senza sessione:

- `/events` reindirizza a `/login`.
- `/events/new` reindirizza a `/login`.
- `/events/[id]` reindirizza a `/login`.
- `/events/[id]/edit` reindirizza a `/login`.
- Nessun console error rilevato.

## Validazioni

Verificato:

- Nome evento obbligatorio in service e vincolo DB `events_name_not_blank`.
- `status` limitato a `planned`, `confirmed`, `completed`, `cancelled` in
  service e vincolo DB `events_status_check`.
- Date coerenti in service e vincolo DB `events_end_datetime_check`.
- Sponsor collegati validati via UUID nel form service, sponsor attivo/non
  archiviato nel service e FK DB verso `sponsors`.
- Contributi collegati a evento validati dal trigger
  `validate_sponsor_contribution_event_link`: evento non archiviato, sponsor non
  archiviato e collegamento operativo in `event_sponsors`.
- Form contributi sponsor mantiene l'opzione `Nessun evento`, quindi `eventId`
  resta opzionale.

## Soft delete

Verificato:

- `archiveEvent` aggiorna `events.archived_at`.
- `archiveEventSponsor` aggiorna `event_sponsors.archived_at`.
- I service M6 filtrano i record operativi con `archived_at is null`.
- Non sono presenti chiamate `.delete()` nel service eventi o nel percorso M6.
- Le migration M6 non creano policy `DELETE`.

## Coerenza contributi

Verificato:

- I contributi sponsor esistenti senza evento restano validi.
- `SponsorContributionFormValues.eventId` e' `string | null`.
- `validateSponsorContributionFormData` accetta `eventId` vuoto e valida UUID
  solo se valorizzato.
- `mapSponsorContributionValues` salva `event_id` come valore nullable.
- La scheda sponsor offre solo eventi gia' collegati allo sponsor come opzioni
  di collegamento contributo.
- Nessuna logica contabile, fiscale, IVA, fatturazione o prima nota deriva da
  `event_id`.

## Verifiche eseguite

Comandi locali:

```text
npm run lint
npx tsc --noEmit
npm run build
git diff --check
```

Esiti:

- `npm run lint`: OK.
- `npx tsc --noEmit`: OK dopo rigenerazione `.next/types` con build fuori
  sandbox.
- `npm run build`: OK fuori sandbox; output include `/events`, `/events/new`,
  `/events/[id]`, `/events/[id]/edit`.
- `git diff --check`: OK.

Validazione Supabase read-only:

- migration live presenti fino a `008_events` e `009_sponsor_contributions`;
- colonne, vincoli, trigger, indici, RLS e policy M6 confermati da catalogo;
- nessuna policy `DELETE`;
- nessuna tabella email/report/audit fuori scope.

Browser check:

- dev server locale avviato su `http://127.0.0.1:3012`;
- route M6 protette verificate senza sessione;
- redirect a `/login` confermato;
- nessun console error.

## Raccomandazioni

- Mantenere `sponsor_contributions.event_id` nullable anche nelle milestone
  future.
- Non collegare automaticamente contributi quando si collega uno sponsor a un
  evento: il contributo deve restare un'azione esplicita.
- Prima di M7 valutare il warning Auth `auth_leaked_password_protection`, gia'
  noto e non bloccante per M6.
- Non rimuovere gli indici M6 solo per `unused_index` finche' il database non
  avra' traffico operativo sufficiente per valutare l'uso reale.

## Decisione finale

Merge si.

La PR #27 rispetta lo scope M6, mantiene RLS coerente con M0-M5, protegge le
route eventi, usa soft delete, preserva i contributi sponsor M5 senza evento e
non introduce email, report, dashboard avanzata o logica contabile.
