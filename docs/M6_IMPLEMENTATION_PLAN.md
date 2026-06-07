# M6 - Events Implementation Plan

## Stato di riferimento

Questo piano prepara la milestone M6 senza introdurre codice, migration operative o modifiche al database Supabase.

Validazione Supabase PonteNext eseguita in sola lettura sul progetto `uhxfpsamenjhyrfgwckw`:

- progetto live: `PonteNext`
- stato progetto: `ACTIVE_HEALTHY`
- database: PostgreSQL `17.6.1.127`
- migration applicate: `001_extensions`, `002_admin_users`, `003_harden_admin_functions`, `004_members_roles`, `005_membership_plans`, `006_memberships_payments`, `007_sponsors`
- tabelle presenti in `public`: `admin_users`, `members`, `roles`, `member_roles`, `membership_plans`, `memberships`, `payments`, `sponsors`, `sponsor_contributions`
- RLS attiva sulle tabelle presenti
- tabelle `events` ed `event_sponsors` assenti
- colonna `sponsor_contributions.event_id` assente
- policy M5 presenti solo per admin attivi e senza policy `DELETE`

La documentazione M5 stabiliva che `sponsor_contributions` non dovesse contenere `event_id`. La decisione progettuale M6 aggiorna questo punto: in M6 e' ammesso aggiungere `event_id` a `sponsor_contributions`, purche' nullable e senza rendere obbligatorio il collegamento evento-contributo.

## 1. Scope M6

M6 introduce la gestione operativa degli eventi e il collegamento tra eventi e sponsor.

In scope:

- anagrafica eventi
- CRUD eventi
- archiviazione logica eventi
- collegamento molti-a-molti tra sponsor ed eventi tramite `event_sponsors`
- gestione sponsor associati nel dettaglio evento
- collegamento opzionale di un contributo sponsor a un evento tramite `sponsor_contributions.event_id`
- visualizzazione dei contributi collegati a un evento
- aggiornamento controllato della gestione contributi sponsor per supportare `event_id` nullable
- route admin protette per eventi
- UI responsive desktop/mobile
- service layer dedicato
- RLS coerente con M0-M5

M6 deve includere:

- `events`
- `event_sponsors`
- collegamento sponsor/eventi
- estensione nullable di `sponsor_contributions` con `event_id`

M6 non deve introdurre:

- email
- report
- dashboard avanzata
- pagamenti online
- contabilita'
- fatturazione
- IVA
- prima nota

## 2. Tabelle coinvolte

Tabelle nuove previste:

- `events`
- `event_sponsors`

Tabelle esistenti da usare o estendere:

- `sponsors`
- `sponsor_contributions`

Migration previste nella futura implementazione M6:

- `database/migrations/008_events.sql`: creazione `events`, creazione `event_sponsors`, vincoli, indici, RLS, policy e trigger `updated_at`
- `database/migrations/009_sponsor_contributions.sql`: aggiunta di `sponsor_contributions.event_id` nullable, FK verso `events`, indice dedicato ed eventuale validazione di coerenza evento/sponsor

Le migration sopra sono pianificate, ma non devono essere create o applicate in questa fase documentale.

## 3. Modello dati eventi

Tabella `events` prevista:

- `id` uuid primary key, default `gen_random_uuid()`
- `name` text not null
- `description` text null
- `start_datetime` timestamptz not null
- `end_datetime` timestamptz null
- `location` text null
- `status` text not null, default `planned`
- `notes` text null
- `created_at` timestamptz not null, default `now()`
- `updated_at` timestamptz not null, default `now()`
- `archived_at` timestamptz null

Stati evento previsti:

- `planned`
- `confirmed`
- `completed`
- `cancelled`

Vincoli previsti:

- `name` non vuoto dopo trim
- `status` limitato ai valori previsti
- `end_datetime` null oppure maggiore o uguale a `start_datetime`

Campi canonici:

- `start_datetime` e `end_datetime` sono i soli campi canonici per data e ora evento
- la UI deve derivare data, ora di inizio e ora di fine da questi campi
- non devono essere introdotti campi separati come `event_date`, `start_time` o `end_time`

Soft delete:

- l'archiviazione evento usa `archived_at`
- `status = cancelled` rappresenta un evento annullato ma ancora consultabile
- `archived_at` rappresenta l'esclusione dagli elenchi operativi di default

## 4. Collegamento sponsor-eventi

Il collegamento sponsor-eventi e' rappresentato dalla tabella ponte `event_sponsors`.

Tabella `event_sponsors` prevista:

- `id` uuid primary key, default `gen_random_uuid()`
- `event_id` uuid not null, FK verso `events.id`
- `sponsor_id` uuid not null, FK verso `sponsors.id`
- `sponsorship_level` text null
- `notes` text null
- `created_at` timestamptz not null, default `now()`
- `updated_at` timestamptz not null, default `now()`
- `archived_at` timestamptz null

Regole:

- un evento puo' esistere senza sponsor
- uno sponsor puo' essere collegato a piu' eventi
- un evento puo' avere piu' sponsor
- il collegamento sponsor-evento non implica automaticamente un contributo economico o non monetario
- l'archiviazione di un collegamento non deve archiviare sponsor, evento o contributi

Unicita':

- deve esistere un solo collegamento operativo tra la stessa coppia `event_id` + `sponsor_id`
- la soluzione consigliata e' un indice unique parziale su `(event_id, sponsor_id)` dove `archived_at is null`, cosi' un collegamento archiviato non blocca una futura riattivazione esplicita

## 5. Collegamento contributi sponsor-eventi

In M6 e' ammesso aggiungere `event_id` a `sponsor_contributions`.

Regole del nuovo campo:

- `sponsor_contributions.event_id` deve essere nullable
- un contributo senza evento resta valido
- un contributo con `event_id` rappresenta un contributo specifico collegato a un evento
- un contributo puo' essere collegato al massimo a un evento
- se lo stesso contributo sostiene piu' eventi, devono essere registrati contributi distinti
- il collegamento a un evento non introduce logica contabile, fiscale o di fatturazione

Vincoli consigliati:

- `event_id` FK verso `events.id`
- `event_id` con `on delete restrict`, coerente con soft delete e con il comportamento M5 su `sponsor_id`
- indice su `sponsor_contributions.event_id`
- indice composto opzionale su `(event_id, sponsor_id)` per liste dettaglio evento

Regola di coerenza:

- un contributo collegato a un evento deve appartenere a uno sponsor valido
- il service layer deve verificare che `sponsor_id` punti a uno sponsor non archiviato
- il service layer deve verificare che `event_id`, se valorizzato, punti a un evento non archiviato
- il flusso applicativo deve rendere esplicito il legame sponsor-evento: associare uno sponsor a un evento resta un'azione distinta dal registrare un contributo

Raccomandazione di integrita':

- quando un contributo viene collegato a un evento, il sistema dovrebbe richiedere un collegamento operativo `event_sponsors` tra lo stesso sponsor e lo stesso evento
- se la UI offre una scorciatoia per registrare contributo e collegamento nello stesso flusso, deve mostrarlo come azione esplicita, non come effetto nascosto

## 6. Relazioni tra events, sponsors, event_sponsors e sponsor_contributions

Relazioni M6:

- `events` 1 -> N `event_sponsors`
- `sponsors` 1 -> N `event_sponsors`
- `sponsors` 1 -> N `sponsor_contributions`
- `events` 1 -> N `sponsor_contributions`, solo per contributi con `event_id` valorizzato

Cardinalita':

- un evento puo' avere zero, uno o piu' sponsor tramite `event_sponsors`
- uno sponsor puo' partecipare a zero, uno o piu' eventi tramite `event_sponsors`
- un evento puo' avere zero, uno o piu' contributi collegati
- un contributo appartiene sempre a un solo sponsor
- un contributo puo' essere non collegato ad alcun evento

Interpretazione dei dati:

- `event_sponsors` risponde alla domanda: "quali sponsor sono associati a questo evento?"
- `sponsor_contributions.event_id` risponde alla domanda: "questo contributo e' riferito a quale evento?"
- la presenza di `event_sponsors` non implica contributi
- la presenza di contributi collegati non genera fatture, ricevute, movimenti contabili o pagamenti online

## 7. Regole eventi

Regole operative:

- `name` obbligatorio
- `start_datetime` obbligatorio
- `end_datetime` opzionale, ma se presente deve essere maggiore o uguale a `start_datetime`
- `location` opzionale
- `description` opzionale
- `notes` opzionale
- `status` obbligatorio e limitato agli stati previsti
- eventi archiviati esclusi dagli elenchi operativi di default

Regole stato:

- `planned`: evento pianificato ma non ancora confermato
- `confirmed`: evento confermato
- `completed`: evento concluso
- `cancelled`: evento annullato ma mantenuto nello storico

Regole temporali:

- tutti i filtri calendario/lista devono usare `start_datetime`
- eventuali ordinamenti prossimi eventi devono ordinare per `start_datetime`
- eventi passati, futuri e annullati restano distinguibili tramite stato e data

## 8. Regole sponsor associati a eventi

Regole:

- uno sponsor puo' essere associato a un evento senza contributi
- un evento puo' essere creato e gestito senza sponsor
- un collegamento sponsor-evento richiede sponsor non archiviato ed evento non archiviato
- il collegamento puo' contenere `sponsorship_level` e `notes`
- `sponsorship_level` e' descrittivo, non contabile
- archiviare lo sponsor non deve cancellare eventi o collegamenti storici
- archiviare l'evento non deve cancellare sponsor o collegamenti storici
- archiviare il collegamento non deve cancellare contributi sponsor

Validazioni applicative:

- impedire duplicati operativi della stessa coppia evento/sponsor
- impedire l'associazione a sponsor archiviati negli elenchi operativi
- impedire l'associazione a eventi archiviati negli elenchi operativi
- mostrare sponsor gia' collegati nel dettaglio evento

## 9. Regole contributi collegati a eventi

Regole:

- `event_id` e' opzionale
- contributi esistenti senza `event_id` restano validi
- un contributo collegato a evento deve mantenere `sponsor_id` obbligatorio
- il contributo monetario continua a richiedere `amount > 0`
- i contributi non monetari continuano a poter avere `amount = 0` e richiedono `description`
- l'evento collegato non cambia le regole M5 su tipo contributo, descrizione e importo
- il collegamento evento e' informativo/gestionale, non fiscale

Flussi UI previsti:

- dal dettaglio sponsor: creare o modificare contributo con selezione evento opzionale
- dal dettaglio evento: visualizzare i contributi collegati all'evento
- dal dettaglio evento: permettere il collegamento di contributi solo se lo sponsor e' associato o viene associato esplicitamente all'evento

Comportamenti da evitare:

- non creare automaticamente pagamenti
- non creare fatture
- non creare prima nota
- non sommare contributi in dati contabili
- non rendere `event_id` obbligatorio per i contributi sponsor

## 10. Route previste

Route admin protette previste:

- `/events`
- `/events/new`
- `/events/[id]`
- `/events/[id]/edit`

Gestione sponsor evento:

- collegamento sponsor dal dettaglio evento
- rimozione/archiviazione collegamento dal dettaglio evento
- lista sponsor associati nel dettaglio evento

Gestione contributi evento:

- visualizzazione contributi collegati nel dettaglio evento
- selezione evento opzionale nel form contributo sponsor
- eventuale filtro contributi per evento nel service layer

Integrazioni previste:

- abilitare la voce navigazione `Eventi`
- aggiornare il dettaglio sponsor per mostrare eventi collegati, se coerente con il layout M5
- aggiornare i form contributi sponsor per includere `event_id` opzionale

Non sono previste route M6 per:

- email eventi
- report eventi
- dashboard avanzata eventi
- pagamenti online
- fatturazione

## 11. Componenti UI previsti

Componenti React previsti, con convenzione `PascalCase.tsx`:

- `EventTable`
- `EventCardList`
- `EventFilters`
- `EventStatusBadge`
- `EventForm`
- `EventDetail`
- `EventSummary`
- `EventArchiveDialog`
- `EventSponsorTable`
- `EventSponsorCardList`
- `EventSponsorForm`
- `EventSponsorArchiveDialog`
- `EventContributionTable`
- `EventContributionCardList`
- `EventEmptyState`

Aggiornamenti componenti M5 previsti:

- `SponsorContributionForm`: campo evento opzionale
- `SponsorContributionTable`: eventuale colonna evento, quando utile
- `SponsorContributionCardList`: indicazione evento collegato, quando presente
- `SponsorDetail`: sezione eventi collegati o link al dettaglio eventi

Linee UI:

- desktop: tabelle compatte per eventi, sponsor associati e contributi evento
- mobile: card elenco per eventi e relazioni
- form a singola colonna su mobile
- badge per stato evento
- azioni di archiviazione confermate da dialog
- empty state chiaro per eventi assenti, sponsor assenti e contributi evento assenti

## 12. Service layer previsto

File previsto:

- `src/services/events.service.ts`

Tipi previsti:

- `src/types/event.ts`

Funzioni eventi:

- `getEvents`
- `getEventById`
- `createEvent`
- `updateEvent`
- `archiveEvent`

Funzioni sponsor-evento:

- `getEventSponsors`
- `linkSponsorToEvent`
- `updateEventSponsor`
- `archiveEventSponsor`
- `getSponsorEvents`

Funzioni contributi evento:

- `getEventContributions`
- `getSponsorContributionEvents`
- aggiornamento delle funzioni M5 di creazione/modifica contributo per accettare `eventId` opzionale

Validazioni service layer:

- validare `name`
- validare `status`
- validare `start_datetime`
- validare `end_datetime >= start_datetime` se `end_datetime` e' presente
- validare sponsor non archiviato prima del collegamento
- validare evento non archiviato prima del collegamento
- validare `eventId` opzionale nei contributi
- evitare duplicati operativi in `event_sponsors`

Regole service layer:

- usare Supabase server client secondo i pattern esistenti
- chiamare `requireActiveAdmin()` nelle route/server action prima di ogni fetch o mutazione
- filtrare di default `archived_at is null`
- non introdurre logica contabile
- non introdurre email/report/dashboard avanzata

## 13. RLS previste

RLS da abilitare su:

- `events`
- `event_sponsors`

Policy coerenti con M0-M5:

- `SELECT` consentita agli admin autenticati attivi
- `INSERT` consentita agli admin autenticati attivi
- `UPDATE` consentita agli admin autenticati attivi
- nessuna policy `DELETE`

Controllo admin:

- usare `app_private.is_active_admin()`
- non esporre dati eventi o sponsor a utenti anonimi
- non aprire policy pubbliche

Tabella `sponsor_contributions`:

- le policy M5 gia' consentono `SELECT`, `INSERT` e `UPDATE` agli admin attivi
- l'aggiunta di `event_id` non richiede policy aggiuntive se il perimetro resta admin-only
- eventuali controlli di coerenza evento/sponsor devono essere gestiti da vincoli, trigger o service layer, non da policy pubbliche

## 14. Trigger previsti

Trigger `updated_at` previsti:

- `set_events_updated_at` su `events`
- `set_event_sponsors_updated_at` su `event_sponsors`

Trigger gia' presente da M5:

- `set_sponsor_contributions_updated_at` su `sponsor_contributions`; deve continuare a funzionare quando viene aggiornato `event_id`

Validazione opzionale consigliata:

- una funzione/trigger di validazione su `sponsor_contributions` puo' verificare che, quando `event_id` e' valorizzato, evento e sponsor non siano archiviati e il collegamento `event_sponsors` sia presente e operativo
- se introdotta, la funzione deve seguire l'hardening gia' adottato: `search_path` esplicito e privilegi ridotti

Trigger non previsti:

- trigger contabili
- trigger fiscali
- trigger di fatturazione
- trigger di invio email
- trigger di reportistica
- trigger dashboard

## 15. Test previsti

Verifiche tecniche:

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- validazione Supabase live dopo eventuale applicazione M6
- verifica che siano applicate solo le migration M6 previste
- verifica che non vengano create tabelle email, report, contabili o pagamenti online

Test database:

- `events` presente con colonne, vincoli, indici e RLS
- `event_sponsors` presente con colonne, vincoli, indici e RLS
- `sponsor_contributions.event_id` presente, nullable e indicizzato
- FK `event_id` coerente con `events.id`
- nessuna policy `DELETE` su `events` ed `event_sponsors`
- RLS admin attiva su `events` ed `event_sponsors`

Test funzionali:

- creazione evento senza sponsor
- modifica evento
- archiviazione evento
- blocco evento con `end_datetime` precedente a `start_datetime`
- collegamento sponsor a evento
- blocco duplicato operativo sponsor/evento
- archiviazione collegamento sponsor/evento
- creazione contributo sponsor senza evento
- creazione contributo sponsor con evento
- modifica contributo per aggiungere o rimuovere evento
- verifica che il collegamento sponsor-evento non crei contributi
- verifica che il contributo collegato non crei pagamenti o logica contabile

Test route protette:

- `/events` senza sessione reindirizza a `/login`
- `/events/new` senza sessione reindirizza a `/login`
- `/events/[id]` senza sessione reindirizza a `/login`
- `/events/[id]/edit` senza sessione reindirizza a `/login`
- admin attivo puo' accedere alle route M6

Test UI/responsive:

- elenco eventi desktop
- elenco eventi mobile a card
- dettaglio evento desktop/mobile
- form evento desktop/mobile
- gestione sponsor associati desktop/mobile
- visualizzazione contributi evento desktop/mobile
- empty state per eventi assenti
- empty state per sponsor evento assenti
- empty state per contributi evento assenti

## 16. Acceptance criteria

M6 sara' accettabile se:

- vengono introdotte solo le tabelle `events` ed `event_sponsors`
- `sponsor_contributions` viene estesa solo con `event_id` nullable e relativi vincoli/indici necessari
- `event_id` non diventa obbligatorio
- i contributi senza evento restano validi
- un evento puo' esistere senza sponsor
- uno sponsor puo' essere collegato a piu' eventi
- un evento puo' avere piu' sponsor
- il collegamento sponsor-evento non crea automaticamente contributi
- un contributo collegato a evento resta sempre associato a uno sponsor valido
- `start_datetime` e `end_datetime` sono i campi canonici evento
- le route `/events`, `/events/new`, `/events/[id]` e `/events/[id]/edit` sono presenti e protette
- la UI e' responsive e coerente con le linee guida
- RLS e policy admin-only sono attive
- non esistono policy `DELETE`
- non viene introdotta logica contabile
- non vengono introdotte fatturazione, IVA o prima nota
- non vengono introdotti email, report, dashboard avanzata o pagamenti online
- lint, typecheck e build passano
- la validazione Supabase conferma assenza di tabelle fuori scope

## 17. Rischi

Rischi principali:

- confondere `event_sponsors` con contributi economici
- rendere `event_id` obbligatorio e rompere contributi sponsor generali
- creare duplicati sponsor/evento se il soft delete non e' considerato nell'unicita'
- collegare contributi a eventi senza un legame sponsor-evento esplicito
- introdurre sommatorie o KPI assimilabili a report/dashboard avanzata
- far scivolare i contributi monetari verso logica contabile o fiscale
- introdurre campi di fatturazione, IVA, ricevute o prima nota fuori scope
- usare campi data separati invece di `start_datetime` e `end_datetime`
- aggiornare troppo il modulo sponsor M5, ampliando il perimetro oltre il necessario

Mitigazioni:

- mantenere `event_id` nullable
- usare `event_sponsors` come relazione esplicita e separata dai contributi
- validare sponsor/evento nel service layer prima di collegare contributi
- usare unique parziale per coppie sponsor/evento operative
- mantenere soft delete e nessuna policy `DELETE`
- non introdurre route o componenti report/email/dashboard
- documentare i test manuali M6 in checklist dedicata durante l'implementazione

## 18. Out of scope

Fuori scope M6:

- email
- template email
- campagne email
- promemoria automatici
- report
- dashboard avanzata
- KPI eventi o sponsor in dashboard
- pagamenti online
- contabilita'
- fatturazione
- IVA
- prima nota
- ricevute fiscali
- esportazioni fiscali
- gestione biglietti
- iscrizioni a eventi
- presenze evento
- calendario pubblico
- portale pubblico eventi
- automazioni o cron job

Ogni elemento fuori scope deve essere rimandato a milestone successive e documentato prima di eventuale implementazione.
