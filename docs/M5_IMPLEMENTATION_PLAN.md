# M5 - Sponsors Implementation Plan

## Stato di riferimento

Questo piano prepara la milestone M5 senza introdurre codice, migration operative o modifiche al database Supabase.

Validazione Supabase PonteNext eseguita in sola lettura sul progetto `uhxfpsamenjhyrfgwckw`:

- progetto live: `PonteNext`
- stato progetto: `ACTIVE_HEALTHY`
- migration applicate: `001_extensions`, `002_admin_users`, `003_harden_admin_functions`, `004_members_roles`, `005_membership_plans`, `006_memberships_payments`
- tabelle presenti in `public`: `admin_users`, `members`, `roles`, `member_roles`, `membership_plans`, `memberships`, `payments`
- RLS attiva sulle tabelle presenti
- tabelle sponsor/eventi/email/report non presenti

M5 deve quindi aggiungere esclusivamente la progettazione per `sponsors` e `sponsor_contributions`.

## 1. Scope M5

M5 introduce la gestione operativa degli sponsor e dei loro contributi.

In scope:

- anagrafica sponsor
- CRUD sponsor
- archiviazione logica sponsor
- contributi sponsor
- CRUD contributi sponsor
- archiviazione logica contributi
- distinzione tra contributi monetari e non monetari
- viste/UI responsive per elenco, dettaglio e gestione contributi
- service layer dedicato
- RLS coerente con le milestone M0-M4

M5 deve includere esclusivamente:

- `sponsors`
- `sponsor_contributions`

La milestone non introduce logica contabile, fatturazione, IVA, prima nota o collegamenti con eventi.

## 2. Tabelle coinvolte

### sponsors

Tabella anagrafica degli sponsor.

Campi previsti:

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

Stati previsti:

- `active`
- `inactive`
- `archived`

### sponsor_contributions

Tabella dei contributi associati agli sponsor.

Campi previsti:

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

Tipi contributo previsti:

- `money`
- `goods`
- `service`
- `other`

Nota progettuale: `event_id` non deve essere incluso nella migration M5. La documentazione storica cita contributi collegabili a eventi, ma gli eventi sono M6 e il collegamento sponsor/eventi e' esplicitamente fuori scope per M5. Un eventuale collegamento potra' essere introdotto solo con una migration successiva, dopo l'introduzione delle tabelle eventi.

## 3. Relazioni

Relazioni M5:

- uno sponsor puo' esistere senza contributi
- uno sponsor puo' avere zero, uno o piu' contributi
- un contributo appartiene sempre a uno sponsor
- `sponsor_contributions.sponsor_id` deve riferire `sponsors.id`

Cardinalita':

- `sponsors` 1 -> N `sponsor_contributions`

Regole di cancellazione:

- non e' prevista cancellazione fisica da UI
- sponsor e contributi devono essere archiviati tramite `archived_at`
- l'archiviazione di uno sponsor non deve cancellare automaticamente i contributi
- i contributi di sponsor archiviati restano consultabili nel dettaglio storico

## 4. Anagrafica sponsor

L'anagrafica sponsor deve rappresentare soggetti esterni, aziende, enti, professionisti o sostenitori non necessariamente collegati ai soci.

Regole:

- `company_name` obbligatorio
- `status` obbligatorio, default `active`
- `email` opzionale ma validata come email se valorizzata
- `website` opzionale ma validato come URL se valorizzato
- `vat_number` e `fiscal_code` opzionali
- `notes` opzionale
- sponsor archiviati esclusi dagli elenchi operativi di default
- sponsor archiviati consultabili tramite filtro dedicato, se previsto dalla UI

Vincoli consigliati:

- `company_name` non vuoto dopo trim
- `status` limitato ai valori previsti
- nessun vincolo obbligatorio su partita IVA o codice fiscale
- eventuali duplicati su `vat_number` o `fiscal_code` devono essere gestiti con cautela, perche' non tutti gli sponsor potrebbero averli o potrebbero essere soggetti esteri/non profit

## 5. Contributi sponsor

Un contributo rappresenta un supporto ricevuto da uno sponsor.

Regole:

- `sponsor_id` obbligatorio
- `contribution_date` obbligatoria
- `contribution_type` obbligatorio
- `amount` obbligatorio, default `0`, con valore minimo `0`
- `description` consigliata per tutti i contributi
- `description` obbligatoria per contributi non monetari o per contributi con `amount = 0`
- `notes` opzionale
- ogni contributo e' indipendente dagli altri
- un contributo non genera movimenti contabili
- un contributo non genera fatture, ricevute fiscali, IVA o prima nota

I contributi devono essere gestiti nel dettaglio sponsor, evitando una sezione separata eccessiva se non necessaria.

## 6. Regole contributi monetari

Contributi con `contribution_type = money`.

Regole:

- `amount` deve essere maggiore di `0`
- `contribution_date` indica la data operativa di registrazione del contributo
- `description` opzionale ma consigliata
- nessun campo fiscale o contabile deve essere introdotto
- nessuna gestione di metodo pagamento
- nessuna fattura
- nessuna IVA
- nessuna prima nota
- nessuna rendicontazione contabile

Uso previsto:

- tracciare importi sponsorizzati a fini gestionali interni
- permettere consultazione rapida dei contributi ricevuti
- supportare future dashboard o report solo dopo milestone dedicate

## 7. Regole contributi non monetari

Contributi con `contribution_type` pari a:

- `goods`
- `service`
- `other`

Regole:

- `amount` puo' essere `0`
- se valorizzato, `amount` rappresenta solo una stima gestionale interna
- `description` obbligatoria
- `notes` opzionale
- nessuna valorizzazione deve essere interpretata come dato fiscale
- nessuna gestione inventario
- nessuna gestione magazzino
- nessuna contabilizzazione automatica

Esempi:

- fornitura di materiali
- prestazione di servizi
- disponibilita' di spazi
- supporto logistico
- altra forma di sostegno non monetario

## 8. Route previste

Route admin protette previste:

- `/sponsors`
- `/sponsors/new`
- `/sponsors/[id]`
- `/sponsors/[id]/edit`

Gestione contributi:

- creazione contributo dal dettaglio sponsor
- modifica contributo dal dettaglio sponsor
- archiviazione contributo dal dettaglio sponsor

Non sono previste route M5 per:

- eventi sponsor
- collegamenti sponsor/eventi
- email sponsor
- report sponsor
- dashboard sponsor avanzata

## 9. Componenti UI previsti

Componenti React previsti, con convenzione `PascalCase.tsx`:

- `SponsorTable`
- `SponsorCardList`
- `SponsorFilters`
- `SponsorStatusBadge`
- `SponsorForm`
- `SponsorDetail`
- `SponsorSummary`
- `SponsorArchiveDialog`
- `SponsorContributionTable`
- `SponsorContributionCardList`
- `SponsorContributionForm`
- `SponsorContributionTypeBadge`
- `SponsorContributionArchiveDialog`
- `SponsorEmptyState`

Comportamento responsive:

- desktop: tabelle compatte e leggibili
- mobile: card elenco con azioni principali
- form a singola colonna su mobile
- azioni distruttive o di archiviazione confermate da dialog
- empty state chiari per sponsor assenti e contributi assenti

Linee UI:

- interfaccia operativa, non marketing
- badge per stato sponsor e tipo contributo
- dati fiscali opzionali senza enfasi contabile
- contributi monetari/non monetari distinguibili visivamente

## 10. Service layer previsto

File previsto:

- `src/services/sponsors.service.ts`

Tipi previsti:

- `src/types/sponsor.ts`

Funzioni sponsor:

- `getSponsors`
- `getSponsorById`
- `createSponsor`
- `updateSponsor`
- `archiveSponsor`
- `restoreSponsor`, solo se coerente con i pattern gia' presenti

Funzioni contributi:

- `getSponsorContributions`
- `getSponsorContributionById`
- `createSponsorContribution`
- `updateSponsorContribution`
- `archiveSponsorContribution`

Funzioni di supporto:

- `getSponsorContributionSummary`, solo aggregazione gestionale in lettura
- `validateSponsorPayload`
- `validateSponsorContributionPayload`

Regole service layer:

- usare Supabase client/server secondo i pattern esistenti
- non introdurre logica contabile
- non introdurre dipendenze verso eventi
- non introdurre dipendenze verso email/report/dashboard avanzata
- filtrare di default record con `archived_at is null`

## 11. RLS previste

RLS da abilitare su:

- `sponsors`
- `sponsor_contributions`

Policy coerenti con M0-M4:

- `SELECT` consentita agli admin autenticati attivi
- `INSERT` consentita agli admin autenticati attivi
- `UPDATE` consentita agli admin autenticati attivi
- nessuna policy `DELETE` operativa

Controllo admin:

- usare la funzione hardenizzata `app_private.is_active_admin()`
- mantenere separazione tra utenti Auth e utenti admin autorizzati

Note:

- le policy non devono aprire accesso pubblico
- gli sponsor non sono consultabili da utenti anonimi
- i contributi non sono consultabili da utenti anonimi
- l'archiviazione avviene tramite update controllato

## 12. Trigger previsti

Trigger previsti:

- `set_updated_at` su `sponsors`
- `set_updated_at` su `sponsor_contributions`

Trigger non previsti:

- trigger contabili
- trigger fiscali
- trigger di fatturazione
- trigger di collegamento eventi
- trigger di invio email
- trigger di dashboard/report

Eventuali aggregazioni dei contributi devono essere calcolate in query/service layer, non persistite tramite trigger in M5.

## 13. Seed previsti

Seed previsti:

- nessun seed obbligatorio per `sponsors`
- nessun seed obbligatorio per `sponsor_contributions`

Motivazione:

- gli sponsor sono dati reali dell'associazione
- i contributi sono dati reali e non devono essere simulati in produzione
- non servono lookup separati se `contribution_type` e `status` sono gestiti con vincoli enumerati o check constraint

Eventuali dati demo devono restare fuori dalle migration operative di produzione.

## 14. Test previsti

Verifiche tecniche:

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- verifica Supabase live dopo eventuale migration M5
- verifica che vengano create solo `sponsors` e `sponsor_contributions`
- verifica che non vengano create tabelle eventi, email, report o contabili

Test RLS:

- admin attivo puo' leggere sponsor e contributi
- admin attivo puo' creare sponsor
- admin attivo puo' aggiornare sponsor
- admin attivo puo' creare contributi
- admin attivo puo' aggiornare contributi
- utente Auth non presente in `admin_users` non puo' accedere
- admin inattivo o archiviato non puo' accedere
- utenti anonimi non possono accedere

Test funzionali:

- creazione sponsor senza contributi
- dettaglio sponsor con zero contributi
- creazione contributo monetario con importo valido
- blocco contributo monetario con importo `0`
- creazione contributo non monetario con importo `0` e descrizione
- blocco contributo non monetario senza descrizione
- modifica anagrafica sponsor
- archiviazione sponsor
- archiviazione contributo
- sponsor archiviato escluso dagli elenchi operativi

Test UI/responsive:

- elenco sponsor desktop
- elenco sponsor mobile a card
- dettaglio sponsor desktop
- dettaglio sponsor mobile
- form sponsor desktop/mobile
- gestione contributi desktop/mobile
- empty state per sponsor assenti
- empty state per contributi assenti

## 15. Acceptance criteria

M5 sara' accettabile se:

- vengono introdotte solo le tabelle `sponsors` e `sponsor_contributions`
- uno sponsor puo' essere creato senza contributi
- uno sponsor puo' avere zero, uno o piu' contributi
- ogni contributo appartiene sempre a uno sponsor
- contributi monetari e non monetari sono distinguibili
- i contributi monetari richiedono importo maggiore di `0`
- i contributi non monetari possono avere importo `0`
- nessuna logica contabile viene introdotta
- nessuna fattura viene introdotta
- nessuna IVA viene introdotta
- nessuna prima nota viene introdotta
- non viene creato alcun collegamento sponsor/eventi
- non viene introdotta alcuna dashboard avanzata
- route e dati M5 sono protetti da admin guard e RLS
- UI desktop/mobile coerente con le linee guida
- lint, typecheck e build passano
- la validazione Supabase live conferma l'assenza di tabelle fuori scope

## 16. Rischi

Rischi principali:

- introdurre prematuramente `event_id` in `sponsor_contributions`, creando dipendenza da M6
- confondere `amount` dei contributi monetari con dati contabili o fiscali
- interpretare la stima economica dei contributi non monetari come valore fiscale
- introdurre campi di fatturazione, IVA, ricevute o prima nota fuori scope
- aggiungere dashboard/report sponsor prima delle milestone dedicate
- rendere obbligatori dati fiscali che potrebbero non esistere per tutti gli sponsor
- gestire male sponsor archiviati con contributi storici
- applicare uniqueness troppo rigide su dati opzionali come `vat_number` o `fiscal_code`
- esporre dati sponsor con policy RLS troppo permissive

Mitigazioni:

- migration M5 limitata a due sole tabelle
- nessun FK verso `events`
- nessun campo contabile/fiscale oltre ai dati anagrafici opzionali
- RLS basata su `app_private.is_active_admin()`
- soft delete coerente con le milestone precedenti
- checklist M5 dedicata durante implementazione

## 17. Out of scope

Fuori scope M5:

- eventi
- tabella `events`
- collegamento sponsor/eventi
- tabella ponte sponsor/eventi
- route eventi
- email
- template email
- campagne email
- report
- dashboard avanzata
- KPI sponsor in dashboard
- fatturazione
- IVA
- prima nota
- ricevute fiscali
- contabilita'
- pagamenti sponsor
- gestione magazzino
- gestione inventario
- portale pubblico sponsor

Ogni elemento fuori scope deve essere rimandato a milestone successive e documentato prima di eventuale implementazione.
