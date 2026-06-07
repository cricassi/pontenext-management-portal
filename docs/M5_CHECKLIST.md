# PonteNext Management Portal - M5 Checklist

## Scope

M5 implementa la gestione sponsor e contributi sponsor.

Project ref Supabase:

```text
uhxfpsamenjhyrfgwckw
```

## Incluso

- [x] Migration `007_sponsors.sql`
- [x] Tabella `sponsors`
- [x] Tabella `sponsor_contributions`
- [x] Nessun `event_id` in `sponsor_contributions`
- [x] Vincoli base su stati sponsor, tipi contributo e importi
- [x] Vincolo `amount > 0` per contributi monetari
- [x] Vincolo `description` obbligatoria per contributi non monetari
- [x] Indici per filtri, join e FK M5
- [x] Trigger `updated_at` su entrambe le tabelle M5
- [x] RLS attiva su entrambe le tabelle M5
- [x] Policy SELECT/INSERT/UPDATE per admin attivi
- [x] Nessuna policy DELETE
- [x] CRUD sponsor
- [x] Archiviazione sponsor
- [x] CRUD contributi sponsor dal dettaglio sponsor
- [x] Archiviazione contributi sponsor
- [x] UI responsive desktop/mobile per sponsor
- [x] UI responsive desktop/mobile per contributi
- [x] Service layer M5
- [x] Validazioni form M5

## Escluso

- [x] Nessuna tabella `events`
- [x] Nessuna tabella `event_sponsors`
- [x] Nessun collegamento sponsor/eventi
- [x] Nessun `event_id` in `sponsor_contributions`
- [x] Nessuna email
- [x] Nessun report
- [x] Nessuna dashboard avanzata
- [x] Nessuna contabilita'
- [x] Nessuna fatturazione
- [x] Nessuna IVA
- [x] Nessuna prima nota

## Regole M5

- [x] Uno sponsor puo' esistere senza contributi
- [x] Uno sponsor puo' avere zero, uno o piu' contributi
- [x] Un contributo appartiene sempre a uno sponsor
- [x] I contributi monetari richiedono `amount > 0`
- [x] I contributi non monetari possono avere `amount = 0`
- [x] I contributi non monetari richiedono `description`
- [x] I contributi non generano logica contabile
- [x] I contributi non generano fatturazione
- [x] I contributi non generano IVA
- [x] I contributi non generano prima nota

## Migration live

- [x] Applicata migration `007_sponsors`
- [x] Nessuna migration `008` o successiva applicata
- [x] Create solo `sponsors` e `sponsor_contributions`
- [x] Tabelle eventi/email/report assenti
- [x] Conteggi finali `sponsors = 0` e `sponsor_contributions = 0` dopo test rollback

## Validazione live Supabase

- [x] Progetto `PonteNext` verificato
- [x] Project ref `uhxfpsamenjhyrfgwckw` verificato
- [x] Migration list verificata
- [x] Colonne M5 verificate
- [x] RLS M5 verificata attiva
- [x] Policy M5 verificate
- [x] Trigger `updated_at` verificati
- [x] Assenza `event_id` verificata
- [x] Assenza tabelle fuori scope M5 verificata
- [x] Test transazionale con rollback completato
- [x] Sponsor senza contributi verificato
- [x] Contributo money con `amount > 0` verificato
- [x] Contributo money con `amount = 0` bloccato
- [x] Contributo non-money con `amount = 0` e `description` verificato
- [x] Contributo non-money senza `description` bloccato

## Route M5

- [x] `/sponsors`
- [x] `/sponsors/new`
- [x] `/sponsors/[id]`
- [x] `/sponsors/[id]/edit`
- [x] Voce navigazione `Sponsor` abilitata

## Test manuale route M5

- [x] `/login` verificata via Browser: heading `Accesso amministratori`, input email e password presenti
- [x] `/sponsors` verificata senza sessione: redirect a `/login`
- [x] `/sponsors/new` verificata senza sessione: redirect a `/login`
- [x] `/sponsors/[id]` presente in build
- [x] `/sponsors/[id]/edit` presente in build
- [x] Browser locale desktop senza errori console
- [x] Browser locale mobile `/sponsors` senza sessione: redirect a `/login`

## Verifiche locali

- [x] `npx tsc --noEmit`
- [x] `npm run lint`
- [x] `npm run build`
- [x] Test browser route protette

Nota build: nel sandbox la build Next.js ha compilato correttamente ma si e'
fermata su `spawn EPERM`. La build e' stata rieseguita fuori sandbox ed e'
terminata con successo.

Nota dev server: il tentativo sandbox e' fallito con `spawn EPERM`; la verifica
browser e' stata completata avviando Next.js fuori sandbox su
`http://127.0.0.1:3004`.

Nota ambiente: `.env.local` non e' presente in questa checkout. La verifica
browser autenticata con admin reale non e' stata eseguita; la protezione route e'
stata verificata senza sessione e la validazione dati live e' stata eseguita via
MCP Supabase sul progetto `PonteNext`.
