# M8 - Reports & Export Implementation Plan

## Stato del documento

Questo documento prepara la milestone M8 senza avviarla operativamente.

Questa PR e' solo documentale:

- non scrive codice applicativo;
- non crea migration operative;
- non modifica Supabase;
- non applica nulla al progetto Supabase live;
- non avvia M8 implementativa.

## Stato reale del database verificato

Validazione Supabase PonteNext eseguita in sola lettura sul progetto
`uhxfpsamenjhyrfgwckw`.

Migration applicate:

- `001_extensions`
- `002_admin_users`
- `003_harden_admin_functions`
- `004_members_roles`
- `005_membership_plans`
- `006_memberships_payments`
- `007_sponsors`
- `008_events`
- `009_sponsor_contributions`
- `010_email`

Tabelle `public` presenti:

- `admin_users`
- `members`
- `roles`
- `member_roles`
- `membership_plans`
- `memberships`
- `payments`
- `sponsors`
- `sponsor_contributions`
- `events`
- `event_sponsors`
- `email_templates`
- `email_campaigns`
- `email_campaign_recipients`

Tutte le tabelle applicative presenti hanno RLS attiva.

Non risultano presenti:

- `reports`
- `report_definitions`
- `audit_logs`

Conteggi live rilevanti rilevati durante la preparazione:

| Tabella | Righe |
| --- | ---: |
| `members` | 0 |
| `memberships` | 0 |
| `payments` | 0 |
| `sponsors` | 0 |
| `sponsor_contributions` | 0 |
| `events` | 0 |
| `event_sponsors` | 0 |
| `email_campaigns` | 0 |
| `email_campaign_recipients` | 0 |

Implicazione per M8: la prima implementazione deve gestire correttamente anche
report vuoti, esportando file validi con intestazioni e nessuna riga dati.

## 1. Scope M8

M8 introduce la reportistica esportabile del portale.

In scope:

- route amministrativa `/reports`;
- selezione report;
- filtri per report;
- anteprima sintetica dei risultati;
- export CSV;
- export XLSX;
- generazione export server-side;
- protezione admin su pagina e download;
- uso esclusivo dei dati gia' disponibili M1-M7;
- nessuna nuova tabella, salvo necessita' futura esplicitamente documentata e
  approvata in una PR operativa separata.

M8 deve includere report/export per:

- soci;
- iscrizioni;
- quote/pagamenti non contabili;
- scadenze;
- sponsor;
- contributi sponsor;
- eventi;
- campagne email.

Regole vincolanti:

- export solo per admin autenticati;
- nessun dato fuori RLS;
- nessuna fatturazione;
- nessuna IVA;
- nessuna prima nota;
- nessun PDF in M8;
- CSV e XLSX soltanto;
- nessun invio automatico email;
- nessuna dashboard avanzata.

M8 non deve creare report direzionali avanzati, KPI persistenti, grafici
complessi o automazioni. La milestone e' un modulo operativo di estrazione dati.

## 2. Report previsti

### Report soci

Fonte principale:

- `members`
- `member_roles`
- `roles`
- `memberships`

Obiettivo:

- esportare anagrafica soci e stato associativo derivato.

Campi consigliati:

- `member_id`
- `first_name`
- `last_name`
- `email`
- `phone`
- `city`
- `province`
- `country`
- `birth_date`
- `fiscal_code`
- `profession`
- `member_status`
- `membership_status_derived`
- `latest_membership_start_date`
- `latest_membership_end_date`
- `latest_payment_status`
- `roles`
- `created_at`
- `archived_at`

Regole:

- `members.status` indica solo stato anagrafico;
- lo stato associativo deve essere derivato da `memberships`;
- record archiviati esclusi di default;
- record archiviati includibili solo con filtro esplicito `include_archived`.

### Report iscrizioni

Fonte principale:

- `memberships`
- `membership_plans`
- `members`

Obiettivo:

- esportare storico iscrizioni e rinnovi.

Campi consigliati:

- `membership_id`
- `member_id`
- `member_full_name`
- `member_email`
- `membership_plan_name`
- `start_date`
- `end_date`
- `minimum_fee`
- `expected_fee`
- `paid_amount`
- `payment_status`
- `membership_status`
- `created_at`
- `archived_at`

Regole:

- ogni rinnovo e' una riga distinta;
- non calcolare rinnovi estendendo righe precedenti;
- i report futuri usano lo snapshot economico in `memberships`, non il valore
  corrente del piano.

### Report quote/pagamenti non contabili

Fonte principale:

- `payments`
- `memberships`
- `members`

Obiettivo:

- esportare versamenti associativi a scopo gestionale.

Campi consigliati:

- `payment_id`
- `membership_id`
- `member_id`
- `member_full_name`
- `payment_date`
- `amount`
- `method`
- `reference`
- `membership_start_date`
- `membership_end_date`
- `expected_fee`
- `membership_paid_amount`
- `membership_payment_status`
- `created_at`
- `archived_at`

Regole:

- non usare linguaggio contabile/fiscale;
- non introdurre fatture, IVA, ricevute fiscali o prima nota;
- eventuali somme sono totali gestionali, non contabili.

### Report scadenze

Fonte principale:

- `memberships`
- `members`
- `membership_plans`

Obiettivo:

- esportare soci con iscrizione scaduta o in scadenza.

Varianti/filtri:

- scadute;
- entro 30 giorni;
- entro 60 giorni;
- entro 90 giorni;
- intervallo date personalizzato.

Campi consigliati:

- `member_id`
- `member_full_name`
- `member_email`
- `member_phone`
- `membership_id`
- `membership_plan_name`
- `start_date`
- `end_date`
- `days_to_expiration`
- `payment_status`
- `expected_fee`
- `paid_amount`

Regole:

- la scadenza deriva da `memberships.end_date`;
- non usare campi in `members` per la scadenza;
- valutare la membership piu' recente non archiviata e non annullata per socio;
- nessun promemoria email automatico in M8.

### Report sponsor

Fonte principale:

- `sponsors`
- `sponsor_contributions`

Obiettivo:

- esportare anagrafica sponsor e dati gestionali aggregati minimi sui contributi.

Campi consigliati:

- `sponsor_id`
- `company_name`
- `contact_name`
- `email`
- `phone`
- `website`
- `city`
- `status`
- `contributions_count`
- `money_contributions_total`
- `non_money_contributions_count`
- `created_at`
- `archived_at`

Regole:

- sponsor archiviati esclusi di default;
- contributi monetari sono gestionali e non contabili;
- `vat_number` e `fiscal_code`, se inclusi, sono dati anagrafici opzionali e
  non devono generare logica fiscale.

### Report contributi sponsor

Fonte principale:

- `sponsor_contributions`
- `sponsors`
- `events`

Obiettivo:

- esportare contributi monetari e non monetari degli sponsor.

Campi consigliati:

- `contribution_id`
- `sponsor_id`
- `sponsor_company_name`
- `event_id`
- `event_name`
- `contribution_date`
- `contribution_type`
- `amount`
- `description`
- `notes`
- `created_at`
- `archived_at`

Regole:

- `event_id` e' nullable;
- un contributo senza evento resta valido;
- beni/servizi/altri contributi possono avere `amount = 0`;
- nessuna logica contabile, fiscale, IVA o prima nota.

### Report eventi

Fonte principale:

- `events`
- `event_sponsors`
- `sponsors`
- `sponsor_contributions`

Obiettivo:

- esportare eventi, sponsor collegati e riepilogo contributi collegati.

Campi consigliati:

- `event_id`
- `name`
- `description`
- `start_datetime`
- `end_datetime`
- `location`
- `status`
- `sponsors_count`
- `sponsor_names`
- `linked_contributions_count`
- `money_contributions_total`
- `created_at`
- `archived_at`

Regole:

- `start_datetime` e `end_datetime` sono i campi canonici;
- un evento puo' esistere senza sponsor;
- sponsor collegati e contributi collegati restano concetti distinti.

### Report campagne email

Fonte principale:

- `email_campaigns`
- `email_templates`
- `email_campaign_recipients`

Obiettivo:

- esportare campagne email e storico operativo invii.

Campi consigliati per report campagne:

- `campaign_id`
- `template_name`
- `subject`
- `audience_type`
- `status`
- `provider`
- `recipient_snapshot_generated_at`
- `send_confirmed_at`
- `sent_at`
- `failed_at`
- `recipients_total`
- `recipients_pending`
- `recipients_sent`
- `recipients_failed`
- `recipients_skipped`
- `created_at`
- `archived_at`

Campi consigliati per dettaglio destinatari campagna:

- `campaign_id`
- `campaign_subject`
- `recipient_type`
- `member_id`
- `sponsor_id`
- `email`
- `recipient_name`
- `status`
- `skip_reason`
- `provider_message_id`
- `sent_at`
- `opted_out_at`

Regole:

- M8 esporta lo storico M7, ma non invia email;
- non includere `RESEND_API_KEY` o dati provider sensibili;
- il body completo della campagna e gli errori provider dettagliati sono
  esclusi di default per ridurre il rischio privacy;
- se serve esportare il body, va previsto un filtro esplicito e documentato in
  una PR operativa.

## 3. Export CSV

CSV deve essere generato server-side.

Regole formato:

- intestazioni sempre presenti;
- una riga per record;
- valori separati da virgola o punto e virgola secondo scelta implementativa
  documentata;
- valori testuali quotati e correttamente escaped;
- newline normalizzati;
- date in formato stabile (`YYYY-MM-DD` o ISO datetime);
- importi con punto decimale o formato coerente documentato;
- file UTF-8.

Sicurezza CSV:

- mitigare CSV injection/formula injection;
- i valori che iniziano con `=`, `+`, `-`, `@`, tab o carriage return devono
  essere neutralizzati come testo;
- non includere segreti, token o chiavi API;
- non generare CSV lato client partendo da dati gia' esposti in pagina se il
  report completo potrebbe includere dati non caricati in UI.

Download:

- generazione tramite route handler o server action protetta;
- `Content-Type: text/csv; charset=utf-8`;
- filename descrittivo con tipo report e timestamp;
- `Cache-Control: no-store`.

## 4. Export XLSX

XLSX deve essere generato server-side.

Regole formato:

- una worksheet per export nella prima implementazione;
- intestazioni leggibili;
- larghezze colonne ragionevoli;
- date e importi coerenti;
- nessuna formula generata nei fogli;
- celle testuali per valori potenzialmente pericolosi;
- file generato in memoria e inviato come download, senza persistenza su disco o
  storage.

Download:

- `Content-Type` XLSX corretto;
- filename descrittivo con tipo report e timestamp;
- `Cache-Control: no-store`.

Libreria:

- scegliere in implementazione una libreria Node compatibile con Next.js
  server-side;
- non aggiungere dipendenze in questa PR documentale;
- evitare librerie che richiedono accesso browser o espongono dati lato client.

## 5. Filtri previsti

### Filtri comuni

- tipo report;
- formato export (`csv`, `xlsx`);
- ricerca testuale quando applicabile;
- range date quando applicabile;
- stato operativo quando applicabile;
- `include_archived` disattivo di default;
- limite massimo righe o warning per export voluminosi.

### Soci

- testo libero su nome/email/citta';
- stato anagrafico (`active`, `inactive`, `archived`);
- stato associativo derivato (`active`, `expired`, `without_membership`);
- ruolo;
- scadenza entro intervallo;
- includi archiviati.

### Iscrizioni

- range `start_date`;
- range `end_date`;
- piano iscrizione;
- stato iscrizione;
- stato pagamento;
- socio;
- includi archiviate.

### Quote/pagamenti

- range `payment_date`;
- metodo pagamento;
- stato pagamento membership;
- socio;
- importo minimo/massimo opzionale;
- includi archiviati.

### Scadenze

- scadute;
- entro 30 giorni;
- entro 60 giorni;
- entro 90 giorni;
- intervallo end_date personalizzato;
- stato pagamento;
- includi soci archiviati solo se richiesto esplicitamente.

### Sponsor

- testo libero su ragione sociale/referente/email/citta';
- stato sponsor;
- presenza contributi;
- includi archiviati.

### Contributi sponsor

- sponsor;
- tipo contributo (`money`, `goods`, `service`, `other`);
- range `contribution_date`;
- evento collegato/non collegato;
- importo minimo/massimo opzionale;
- includi archiviati.

### Eventi

- testo libero su nome/luogo;
- stato evento;
- range `start_datetime`;
- sponsor collegato;
- presenza contributi;
- includi archiviati.

### Campagne email

- stato campagna (`draft`, `sent`, `failed`);
- audience type;
- template;
- range `created_at`;
- range `sent_at`;
- presenza destinatari falliti;
- includi archiviate.

## 6. Dati inclusi/esclusi

### Inclusi

M8 puo' includere dati gia' disponibili e protetti da RLS:

- anagrafica soci;
- ruoli soci;
- storico iscrizioni;
- quote previste e importi versati a fini gestionali;
- scadenze derivate;
- anagrafica sponsor;
- contributi sponsor;
- eventi;
- sponsor collegati agli eventi;
- campagne email;
- stati destinatari email.

### Esclusi

M8 non deve includere:

- dati di Supabase Auth;
- `auth_user_id` degli admin;
- chiavi API;
- variabili ambiente;
- `RESEND_API_KEY`;
- token opt-out in chiaro;
- log tecnici non necessari;
- dati fuori RLS;
- dati contabili o fiscali non presenti nel modello;
- fatture;
- IVA;
- prima nota;
- PDF;
- export pubblici o anonimi.

### Record archiviati

Regola proposta:

- esclusi di default da tutti i report;
- includibili solo tramite filtro esplicito `include_archived`;
- quando inclusi, esportare anche `archived_at` per rendere chiaro lo stato del
  record.

### Note e campi sensibili

Le note possono contenere informazioni personali o operative delicate.

Regola proposta:

- includere note solo nei report dove sono indispensabili;
- valutare un filtro esplicito `include_notes`;
- escludere note dai report sintetici;
- documentare chiaramente quando un export contiene note.

## 7. Privacy e sicurezza export

Regole vincolanti:

- tutte le route report devono chiamare `requireActiveAdmin()`;
- ogni export deve essere generato per admin autenticati;
- nessun download anonimo;
- nessun link pubblico permanente;
- nessun file esportato salvato su disco, database o storage;
- nessun dato fuori RLS;
- nessun uso di service role per bypassare RLS, salvo necessita' futura
  approvata e documentata con controlli equivalenti;
- `Cache-Control: no-store` sui download;
- filename senza dati personali;
- non loggare contenuto esportato;
- non loggare filtri con dati sensibili non necessari.

CSV/XLSX security:

- mitigare formula injection;
- trattare celle XLSX come dati, non formule;
- normalizzare newline;
- evitare HTML non sanitizzato;
- limitare o segnalare export molto grandi.

Privacy:

- mostrare un avviso operativo prima dell'export di dati personali;
- ricordare che gli export possono contenere dati personali di soci, sponsor e
  destinatari email;
- raccomandare conservazione esterna sicura dei file scaricati;
- non generare automaticamente export periodici in M8.

## 8. Route previste

Route UI:

- `/reports`

Route tecnica download prevista:

- `/reports/export`

Regole:

- `/reports` mostra selezione report, filtri, anteprima sintetica ed azioni
  `Esporta CSV` / `Esporta XLSX`;
- `/reports/export` genera il file richiesto solo dopo `requireActiveAdmin()`;
- la route export deve validare tipo report, formato e filtri;
- nessuna route pubblica;
- nessuna route PDF;
- nessuna dashboard avanzata;
- abilitare la voce `Report` in navigazione solo nella PR operativa M8.

Opzione implementativa:

- usare `POST` per inviare filtri complessi e ridurre URL con dati sensibili;
- in alternativa usare `GET` solo per filtri semplici e non sensibili.

## 9. Componenti UI previsti

Componenti React con convenzione `PascalCase.tsx`.

Componenti dominio report:

- `ReportsOverview.tsx`
- `ReportTypeSelector.tsx`
- `ReportFilterPanel.tsx`
- `ReportFormatSelector.tsx`
- `ReportPreviewTable.tsx`
- `ReportPreviewCardList.tsx`
- `ReportExportActions.tsx`
- `ReportPrivacyNotice.tsx`
- `ReportEmptyState.tsx`
- `ReportStatusBadge.tsx`

Componenti filtro specifici, se utili:

- `MemberReportFilters.tsx`
- `MembershipReportFilters.tsx`
- `PaymentReportFilters.tsx`
- `ExpirationReportFilters.tsx`
- `SponsorReportFilters.tsx`
- `SponsorContributionReportFilters.tsx`
- `EventReportFilters.tsx`
- `EmailCampaignReportFilters.tsx`

Componenti riutilizzabili esistenti:

- `PageHeader`
- `Button`
- `Card`
- `Badge`
- `Input`
- `Select`
- `EmptyState`
- `FormSubmitButton`

Regole UI:

- interfaccia gestionale, non direzionale;
- filtri visibili su desktop;
- filtri compatti/sheet su mobile;
- anteprima limitata a un numero ridotto di righe;
- su mobile usare card/lista riepilogativa;
- per tabelle report e anteprime complesse e' ammesso `overflow-x-auto`, come da
  `RESPONSIVE_RULES.md`;
- bottoni export chiari e separati per CSV/XLSX;
- nessun pulsante PDF.

## 10. Service layer previsto

Servizi previsti:

- `src/services/reports.service.ts`
- `src/services/report-export.service.ts`
- `src/services/report-filters.service.ts`

Tipi previsti:

- `src/types/report.ts`

Utility previste:

- `src/utils/csv.ts`
- `src/utils/xlsx.ts`
- `src/utils/report-filenames.ts`

Funzioni principali:

- `getReportDefinitions()`
- `validateReportFilters()`
- `getReportPreview()`
- `exportReportToCsv()`
- `exportReportToXlsx()`
- `buildMembersReport()`
- `buildMembershipsReport()`
- `buildPaymentsReport()`
- `buildExpirationsReport()`
- `buildSponsorsReport()`
- `buildSponsorContributionsReport()`
- `buildEventsReport()`
- `buildEmailCampaignsReport()`

Regole service layer:

- ogni funzione chiamata da route o server action protetta;
- nessun export lato client con dati non gia' autorizzati;
- usare il Supabase server client autenticato, non service role;
- query standard filtrano `archived_at is null`;
- `include_archived` applicato solo se esplicitamente richiesto;
- stato associativo derivato da `memberships`;
- scadenze derivate da `memberships.end_date`;
- eventi basati su `start_datetime` e `end_datetime`;
- pagamenti trattati come dati gestionali non contabili;
- campagne email esportate senza invio e senza segreti provider.

Report definitions:

- in M8 iniziale possono essere costanti TypeScript, non tabelle database;
- `reports` e `report_definitions` non devono essere create in M8 salvo nuova
  approvazione esplicita.

## 11. RLS previste

M8 non prevede nuove tabelle e quindi non prevede nuove policy RLS operative.

RLS sorgente gia' attiva su:

- `members`
- `roles`
- `member_roles`
- `membership_plans`
- `memberships`
- `payments`
- `sponsors`
- `sponsor_contributions`
- `events`
- `event_sponsors`
- `email_templates`
- `email_campaigns`
- `email_campaign_recipients`

Regole:

- ogni query report deve rispettare RLS delle tabelle sorgente;
- export disponibili solo ad admin attivi;
- `requireActiveAdmin()` prima di ogni fetch o generazione export;
- nessuna policy pubblica;
- nessuna policy `DELETE`;
- nessun bypass RLS tramite service role per semplificare export;
- se in futuro vengono create tabelle `reports` o `report_definitions`, dovranno
  avere RLS admin-only e migration dedicata.

## 12. Test previsti

Verifiche locali:

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

Test service/unit:

- validazione tipo report;
- validazione formato export;
- validazione filtri;
- CSV escaping;
- mitigazione CSV formula injection;
- XLSX senza formule;
- filename export;
- esclusione archiviati di default;
- inclusione archiviati solo con filtro;
- soci: stato associativo derivato;
- iscrizioni: storico rinnovi append-only;
- pagamenti: importi gestionali;
- scadenze: derivazione da `memberships.end_date`;
- sponsor/contributi: contributi monetari e non monetari;
- eventi: date da `start_datetime`/`end_datetime`;
- email campaigns: conteggi destinatari e stati.

Test route/integrazione:

- `/reports` senza sessione reindirizza a `/login`;
- `/reports/export` senza sessione non scarica file;
- admin attivo puo' aprire `/reports`;
- admin attivo puo' esportare CSV;
- admin attivo puo' esportare XLSX;
- formato non valido viene rifiutato;
- tipo report non valido viene rifiutato;
- filtri non validi vengono rifiutati;
- export vuoto genera file con header;
- nessun PDF generabile.

Test Supabase:

- validazione read-only delle tabelle sorgente;
- conferma RLS attiva sulle tabelle sorgente;
- conferma assenza nuove migration se M8 non modifica schema;
- conferma assenza tabelle report se non approvate.

Test UI/manuali:

- selezione report;
- applicazione filtri;
- anteprima desktop;
- vista mobile a 360px;
- export CSV;
- export XLSX;
- empty state;
- messaggio privacy;
- nessun invio email.

## 13. Acceptance criteria

M8 sara' accettabile quando:

- `/reports` e' presente e protetta;
- la voce `Report` e' abilitata in navigazione;
- admin anonimo/non autorizzato non accede ai report;
- export CSV disponibile per tutti i report previsti;
- export XLSX disponibile per tutti i report previsti;
- nessun PDF disponibile;
- report soci disponibile;
- report iscrizioni disponibile;
- report quote/pagamenti non contabili disponibile;
- report scadenze disponibile;
- report sponsor disponibile;
- report contributi sponsor disponibile;
- report eventi disponibile;
- report campagne email disponibile;
- filtri minimi disponibili per ogni report;
- record archiviati esclusi di default;
- export vuoti generano file validi con header;
- export generati server-side;
- nessun dato fuori RLS esportato;
- nessuna API key o segreto esportato;
- nessun invio automatico email introdotto;
- nessuna dashboard avanzata introdotta;
- nessuna contabilita', fatturazione, IVA o prima nota introdotta;
- lint, typecheck e build passano;
- validazione Supabase read-only documentata;
- checklist M8 aggiornata nella PR operativa.

## 14. Rischi

Rischi principali:

- esportare dati personali oltre il necessario;
- bypassare RLS usando service role per comodita';
- creare export lato client incompleti o non autorizzati;
- non mitigare CSV formula injection;
- includere record archiviati senza evidenziarlo;
- confondere pagamenti gestionali con dati contabili/fiscali;
- includere campi email sensibili come body/errori provider senza filtro;
- generare file troppo grandi in memoria;
- usare filtri incoerenti tra anteprima e download;
- usare `members.status` come stato associativo;
- usare date evento diverse da `start_datetime`/`end_datetime`;
- introdurre PDF o dashboard avanzata per effetto collaterale;
- salvare file esportati in storage senza policy dedicate.

Mitigazioni:

- export server-side protetti;
- `requireActiveAdmin()` obbligatorio;
- uso Supabase server client autenticato;
- filtri validati;
- `Cache-Control: no-store`;
- CSV/XLSX escaping centralizzato;
- record archiviati esclusi di default;
- anteprima e download basati sullo stesso service layer;
- limiti o warning per export voluminosi;
- documentare chiaramente pagamenti e contributi come non contabili.

## 15. Out of scope

M8 non include:

- PDF;
- dashboard avanzata;
- KPI direzionali;
- grafici complessi;
- report schedulati;
- invio automatico email;
- invio report via email;
- area soci;
- app mobile nativa;
- pagamenti online;
- contabilita';
- fatturazione;
- IVA;
- prima nota;
- bilanci;
- audit log operativo M9;
- storage persistente degli export;
- condivisione pubblica degli export;
- tabelle `reports` o `report_definitions` senza nuova approvazione esplicita;
- modifica del modello dati M0-M7.

## Definition of Done documentale per avvio M8

Prima di avviare la PR operativa M8:

- confermare che tutti gli admin attivi possano esportare, salvo diversa
  decisione esplicita sui soli `super_admin`;
- confermare se `include_archived` resta disponibile a tutti gli admin attivi;
- confermare se le note devono essere escluse di default;
- confermare la libreria XLSX server-side;
- confermare se `/reports/export` usera' `POST` o `GET`;
- confermare limite massimo righe per singolo export.
