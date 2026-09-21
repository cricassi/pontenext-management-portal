# CHANGELOG.md

# M10-A2.1 - Field Visibility Members Only (2026-09-21)

- Verifica post-merge A1 positiva; report nella PR #51 mergiato, main `e40f790`.
- Registro versione 2: integrate solo members.list/create/edit/detail. Altri
  moduli ancora non attivi, nessun readonly, gruppo o import Excel.
- Preparata `017_enable_member_field_visibility_rpc.sql`, **non applicata live**:
  RPC pubblica invoker e writer privato controllato, super_admin attivo,
  allowlist membri, autore derivato, CAS degli stati e lock per schermata,
  salvataggio atomico e reset soft. Grant e policy del lock 016 invariati.
- Liste desktop/card mobile, form e dettaglio soci applicano visible/hidden.
  Form client privo dei valori nascosti; submit rilegge la configurazione;
  update minimale presence-aware, protezione da richieste manomesse e controllo
  concorrenza del record. Valori nascosti/assenti e relazioni preservati.
- Test PostgreSQL isolati e browser demo: nessun dato live modificato.
  Export, report, segmentazione email e altri moduli non cambiano.
- Checklist e guide aggiornate. Deploy operativo e verifica RPC live subordinati
  al gate separato `MIGRATION 017 M10-A2.1 MEMBERS APPROVATA`; non rieseguire 015/016.

# M10-A1 - Field Visibility Foundation (2026-09-21)

## Correzione B1 successiva alla review PR #50: lock 016 preparato

### Applicazione approvata e review finale positiva

- Ricevuta conferma `MIGRATION 016 LOCK M10-A1 APPROVATA`; applicata solo
  `016_lock_ui_field_visibility_foundation`, versione live `20260921205506`.
  Nessuna modifica/riesecuzione della 015; nessun dato o tabella business modificati.
- RLS attiva, sola policy SELECT admin attivi, authenticated senza privilegi
  di scrittura. Data API con JWT super_admin: SELECT 200, INSERT e PATCH 403/42501;
  anon 401/42501. Nessuna service role, configurazione vuota e conteggi invariati.
- Rieseguiti lint, typecheck, build, test foundation 13/13, SQL isolato 12/12,
  export M10-B 16/16; browser catalogo/login/controlli disabilitati e responsive base.
- B1 risolto. **Review finale: MERGE SI**. PR #50 aggiornata senza merge automatico;
  A2/C non avviate. Guide allineate allo storico live 001-010, 015, 016.

### Preparazione precedente al gate (storico)

- Preparata `016_lock_ui_field_visibility_foundation.sql`: solo policy/grant
  della configurazione, SELECT admin attivi conservata, scritture authenticated
  negate anche al super_admin. Nessun DML, nuova funzione o modifica business.
- La 015 applicata resta invariata e non viene rieseguita sul live. La 016 e'
  **non applicata live**, in attesa del gate `MIGRATION 016 LOCK M10-A1 APPROVATA`
  dopo presentazione SQL/conteggi. MERGE NO finche' non viene validato il lock live.
- Aggiunti test del contratto SQL e del lock in PostgreSQL isolato: 13/13 test
  foundation e 10 scenari SQL con due wrapper (12/12 runner), inclusa idempotenza.
- Lint/typecheck/build e diff-check passati; 16/16 regressioni export M10-B.
  Baseline live riletta solo in lettura: 14 tabelle preesistenti con conteggi
  invariati, ui_field_visibility vuota e 016 assente dallo storico.
- Aggiornati review, checklist, modello dati, backup/restore e README. Strategia
  A2: RPC controllata e allowlist DB delle coppie integrate, mai grant diretti.
- Nessun codice applicativo, dati live, Auth, env o Vercel modificati; A2/C non
  avviate. Nessun merge automatico.

## Implementazione iniziale, prima della review

- Mergiata PR documentale #49 dopo esito positivo M10-B, commit `63283c9`.
- Creata/applicata la sola migration additiva `015_ui_field_visibility`,
  versione live `20260921195425`, su PonteNext dopo gate utente esplicito.
  Nuova tabella vuota, RLS, helper super_admin sicuro, grant minimi, CHECK
  coppie configurabili, unicita' parziale, FK autore e trigger updated_at.
- Registro tipizzato versione 1: 42 schermate, 116 coppie configurabili;
  resolver in batch con cache request-scoped, fallback esplicito e guard.
- Pagina `/settings/field-visibility` e link in Impostazioni; lettura admin,
  configurazione solo super_admin. Tutte le schermate non integrate: comandi
  disabilitati e richieste server rifiutate prima delle query di configurazione.
- Predisposti bulk upsert atomico della sola configurazione e reset soft;
  test isolati di autorizzazione, autore, vincoli, concorrenza/stale ID.
- Nessun campo business nascosto, nessuna modifica a form/liste/dettagli,
  mapper/update, Auth, env, provider o dati live. Nessun import, gruppo o readonly.
- Aggiornati checklist, guida backup/restore, modello dati e stato del piano.
  Conteggi delle 14 tabelle preesistenti invariati dopo migration.

# M10-B - Complete Excel Export (2026-09-19)

- Ricevuta conferma utente dello smoke test autenticato su Vercel Preview PR #48:
  login super_admin, accesso pagina, download XLSX e apertura Excel desktop riusciti;
  15 fogli, README/METADATA, conteggi e campioni verificati. Nessun foglio Auth/admin_users
  o segreto rilevato, nessuna modifica DB, workbook non condiviso/committato.
  Aggiornate checklist e guida backup solo documentalmente; verifica post-merge ancora da eseguire.
- Implementata `/settings/data-import-export`, con sola informativa/export e
  endpoint POST protetto; accesso esclusivo a super_admin attivi verificato
  server-side prima delle letture, client Supabase di sessione e RLS invariata.
- Workbook in memoria `pontenext-full-export-v1`: README, METADATA e 13 fogli
  business con archiviati, UUID/FK, date ISO, importi numerici e booleani nativi.
- Manifest esplicito, nessun SELECT *, paging e doppia lettura confrontata;
  non snapshot transazionale. Nessuna RPC/migration: superata l'ipotesi iniziale
  del piano, rispettato il vincolo read-only dell'implementazione.
- Limiti fail-closed 10.000 record, 10 MiB dati, 3 MiB XLSX e 25 secondi;
  nessun file parziale, nessuna persistenza su disco/Storage o log dei dati.
- Riutilizzato writer XLSX M8, mantenendo il contratto report esistente;
  formula injection neutralizzata con celle testo e quotePrefix. Nessuna dipendenza.
- Esclusi Auth, admin_users, token/hash opt-out, chiavi e configurazioni segrete.
- Aggiunti test sintetici e checklist M10-B; aggiornati piano, documenti di
  coerenza e Migration and Backup. Excel resta portabilita', non backup completo.
- Lint/typecheck/build superati; schema/RLS Supabase verificati solo in lettura;
  browser redirect anonimo e layout sintetico mobile/desktop verificati.
- Nessuna modifica Supabase/Vercel, dati live o email; A1/A2/C non avviate.

# Pianificato - M10 revisionato (2026-09-19)

- Creato `docs/M10_FIELD_VISIBILITY_AND_EXCEL_PLAN.md`, in sostituzione del piano
  annullato della PR #46: nessun permission group, scope multiplo o readonly.
- Mantenute le denominazioni M10-A Field Visibility, M10-B Complete Excel Export
  e M10-C New Members Excel Import; ordine operativo revisionato in quattro PR:
  B -> A1 Field Visibility Foundation -> A2 Field Visibility Rollout -> C.
- Export read-only per primo, per consentire uno snapshot prima delle modifiche
  ai form; A1 prepara migration additiva/RLS/helper/registro/resolver/Impostazioni
  senza modificare schermate business; A2 integra progressivamente i moduli,
  adegua mapper/update e verifica la conservazione dei dati nascosti.
- Import di nuove anagrafiche per ultimo; allineati gate di fase, dipendenze e
  criteri di accettazione. Nessuna migration prenotata prima di verificare B.
- Annullato l'import multi-tabella: C consente solo INSERT in `public.members`,
  con modello dedicato, dry-run, controllo duplicati, conferma super_admin e
  operazione atomica; nessun UPDATE/UPSERT, relazione o account automatico.
- Documentati schema/RLS live in sola lettura, indici email/fiscale non univoci,
  limiti Vercel, concorrenza, ricevute dry-run e gestione degli esiti ambigui.
- Aggiornati Master Plan, ADR, Business Rules, Database Design, UI Guidelines
  e Migration and Backup; Excel esplicitamente distinto da backup/restore.
- Verifiche della base: lint, typecheck locale e build superati.
- PR esclusivamente documentale: nessun codice, migration, dipendenza, modifica
  Supabase/Vercel, import/export reale o invio email.

# 1.2.4

- Aggiunto spazio di sicurezza inferiore globale allo shell admin mobile per mantenere pulsanti e azioni finali sopra la barra comandi di Safari su iPhone
- Aggiunto `scroll-padding-bottom` al contenitore mobile per rendere raggiungibili anche i controlli portati in vista tramite focus o navigazione
- Nessuna modifica a database, Supabase, migration, service layer o logica applicativa

# 1.2.3

- Corretto menu mobile admin: il dropdown ora usa posizionamento `fixed` e non viene piu' tagliato dall'header con `overflow-hidden`
- Nessuna modifica a database, Supabase, migration, service layer o logica applicativa

# 1.2.2

- Aggiunto `docs/USER_OPERATIONS_MANUAL.docx` con manuale operativo per amministratori
- Aggiunto `docs/TECHNICAL_MAINTENANCE_MANUAL.docx` con manuale tecnico per manutenzione, modifiche e migrazione
- Aggiunto `docs/VIDEO_GUIDES.docx` con piano, copioni e checklist per video MP4 demo fuori repository
- Integrati screenshot operativi embedded nei tre documenti DOCX
- Prodotti video MP4 demo fuori repository in `D:\SviluppoCodex\pontenext-training-videos\mp4`
- Aggiornato `README.md` con i nuovi documenti principali
- Nessuna modifica a codice applicativo, database, Supabase, migration, Vercel o dati live

# 1.2.1

- Migliorato layout mobile per viewport stretti tipo iPhone SE
- Rafforzato il blocco anti-overflow orizzontale su Safari/iPhone con `overflow-x-hidden`, contenitori `max-width`, `100svw`, `touch-action: pan-y pinch-zoom` e header mobile a griglia
- Reso l'header mobile piu' compatto con menu e logout icon-only sotto 391px, senza span `sr-only` che possono aumentare lo `scrollWidth` su Safari
- Ridotto il padding mobile di card, contenuto principale e titoli pagina
- Impostati input, select e textarea mobile a 16px per evitare l'auto-zoom iOS dopo il login
- Limitata esplicitamente la dashboard mobile a `100svw` e bloccati html/body admin su mobile, usando lo shell admin fixed come unico contenitore di scroll verticale per impedire pan orizzontale anche con preview toolbar Vercel
- Esplicitato il viewport `device-width` nel layout Next.js
- Aggiornate le icone di navigazione con simboli piu' descrittivi per dashboard, iscrizioni, scadenze, eventi, email, report e impostazioni
- Nessuna modifica a database, Supabase, migration, service layer o logica applicativa

# 1.2.0

- Avviata milestone M9 - Final Hardening
- Eseguita verifica sicurezza applicativa su route admin, guard server-side,
  service role, API key, Resend ed export
- Eseguita validazione Supabase live in sola lettura su progetto `PonteNext`
- Confermato che le migration live operative sono `001`-`010`
- Confermato RLS attiva sulle tabelle applicative e nessuna policy `DELETE`
- Eseguiti Supabase Security Advisor e Performance Advisor
- Documentato warning non bloccante `auth_leaked_password_protection`
- Documentate raccomandazioni performance su foreign key email senza indice
- Creata guida `docs/MIGRATION_AND_BACKUP.md`
- Creata checklist `docs/M9_CHECKLIST.md`
- Creato report `docs/M9_HARDENING_REPORT.md`
- Creato `docs/POST_DEPLOY_VERIFICATION_REPORT.md`
- Aggiornato `README.md` allo stato M9
- Aggiornato `docs/CODEX_INSTRUCTIONS.md` con regola di manutenzione
  documentazione migration/backup
- Nessuna modifica a codice applicativo, database, migration, Supabase,
  Vercel, provider email o dati live

# 1.1.0

- Avviato UI Brand Refresh - PonteNext Visual Identity
- Aggiunto asset logo Ponte Next locale in `public/brand`
- Aggiunta guida `docs/BRAND_UI_GUIDELINES.md`
- Aggiunta checklist `docs/BRAND_UI_REFRESH_CHECKLIST.md`
- Aggiornati token colore Tailwind su palette nero, rosso, bianco e grigi chiari
- Brandizzata la login page con layout split desktop e logo Ponte Next
- Ottimizzata la login page mobile per stare in una singola visualizzazione
- Aggiornati admin shell, sidebar, header e navigazione attiva in stile Ponte Next
- Migliorata la navigazione mobile: chiusura su voce, click esterno ed `Escape`
- Corretto overflow orizzontale mobile dell'admin header e del contenuto
  gestionale
- Aggiunto ordinamento read-only all'elenco soci per nome, data creazione,
  stato anagrafico e citta'
- Ritoccati dashboard KPI, azioni rapide, widget, bottoni, badge, input, card ed empty state
- Aggiornate `UI_GUIDELINES.md` e `COMPONENTS_GUIDE.md` con regole brand UI
- Nessuna modifica a database, migration, Supabase, RLS, logica CRUD, email o report;
  il service layer soci e' stato toccato solo per ordinamento read-only dell'elenco
  anagrafiche

# 1.0.0

- Avviata milestone M8 - Reports & Export
- Implementata route protetta `/reports`
- Implementata route tecnica protetta `/reports/export`
- Implementato service layer report per soci, iscrizioni, quote/pagamenti non contabili, scadenze, sponsor, contributi sponsor, eventi e campagne email
- Implementato export CSV server-side con intestazioni, escaping e mitigazione formula injection
- Implementato export XLSX server-side in memoria, senza formule e senza persistenza su disco, database o storage
- Implementati filtri report e preview responsive desktop/mobile
- Abilitata la voce navigazione `Report`
- Confermato che M8 non crea nuove tabelle, non crea migration e non modifica Supabase
- Aggiornati checklist M8 e report Supabase
- Nessun PDF, invio automatico email, dashboard avanzata, contabilita', fatturazione, IVA o prima nota introdotti

# 0.9.0

- Avviata milestone M7 - Email & Campaigns
- Applicata al progetto Supabase live `PonteNext` la migration `010_email`
- Create le tabelle `email_templates`, `email_campaigns` ed `email_campaign_recipients`
- Aggiunti vincoli, indici, RLS, policy admin attivi e trigger `updated_at` per le tabelle M7
- Configurato provider Resend esclusivamente lato server tramite `RESEND_API_KEY` ed `EMAIL_FROM`
- Implementate le route definitive `/email`, `/email/templates` e `/email/campaigns`
- Implementati template email, campagne in bozza, snapshot destinatari, anteprima e invio con conferma admin
- Implementati segmenti destinatari: tutti i soci, soci attivi, soci scaduti, sponsor e custom/manuale
- Salvati stato campagna, stato destinatari, email effettivamente utilizzata ed eventuale `provider_message_id`
- Abilitata la voce navigazione `Email`
- Aggiornati README, database design, business rules, screen flow, report Supabase e checklist M7
- Nessuna funzionalita' report, dashboard avanzata, area soci, automazioni schedulate, contabilita', fatturazione, IVA o prima nota introdotta

# 0.8.0

- Avviata milestone M6 - Events
- Applicate al progetto Supabase live `PonteNext` le migration `008_events` e `009_sponsor_contributions`
- Create le tabelle `events` ed `event_sponsors`
- Aggiunta la colonna nullable `sponsor_contributions.event_id`
- Aggiunti vincoli, indici, RLS, policy admin attivi e trigger `updated_at` per le tabelle M6
- Aggiunto trigger di validazione per collegare un contributo evento solo se lo sponsor e' associato all'evento
- Implementati service layer, route e UI responsive per eventi, sponsor evento e contributi evento
- Integrata la scheda sponsor con eventi collegati e collegamento opzionale dei contributi a eventi
- Abilitata la voce navigazione `Eventi`
- Aggiornati database design, business rules, screen flow, report Supabase e checklist M6
- Nessuna funzionalita' email, report, dashboard avanzata, pagamenti online, contabilita', fatturazione, IVA o prima nota introdotta

# 0.7.0

- Avviata milestone M5 - Sponsor
- Applicata al progetto Supabase live `PonteNext` la migration `007_sponsors`
- Create solo le tabelle `sponsors` e `sponsor_contributions`
- Confermato che `sponsor_contributions` non contiene `event_id`
- Aggiunti vincoli per contributi monetari con `amount > 0`
- Aggiunti vincoli per contributi non monetari con `description` obbligatoria e `amount` anche pari a `0`
- Abilitate RLS, policy admin attivi e trigger `updated_at` sulle tabelle M5
- Implementati service layer, route e UI responsive per sponsor e contributi
- Abilitata la voce navigazione `Sponsor`
- Aggiornati report Supabase, README, business rules, database design e checklist M5
- Nessuna funzionalita' eventi, sponsor/eventi, email, report, dashboard avanzata o contabilita' introdotta

# 0.6.0

- Avviata milestone M4 - Dashboard operativa
- Sostituito il placeholder `/dashboard` M0 con dashboard basata sui dati M1-M3
- Aggiunti KPI per soci attivi, scadenze entro 30 giorni, membership scadute, quote non saldate, nuovi soci e rinnovi ultimi 30 giorni
- Aggiunti widget `Da gestire subito`, `Prossime scadenze` e `Ultimi rinnovi`
- Aggiunte azioni rapide per nuovo socio, nuova membership e rinnovo rapido
- Implementato service layer dashboard read-only senza nuove tabelle, migration o viste SQL
- Aggiunti componenti responsive dashboard con tabelle desktop e card mobile
- Validato Supabase live in sola lettura sul progetto `PonteNext`
- Aggiunta checklist `M4_CHECKLIST.md`
- Nessuna funzionalita' sponsor, eventi, email o report introdotta

## 0.5.0

- Avviata milestone M3 - Expirations & Renewals
- Aggiunta route protetta `/expirations` per scadenze scadute o entro 30/60/90 giorni
- Implementate query service-side per ultima membership rinnovabile per socio, senza nuove viste SQL o migration
- Implementato rinnovo rapido precompilato tramite `/memberships/new?memberId=<member_id>&renewFrom=<membership_id>&mode=quick`
- Integrato pannello scadenza nella scheda socio
- Abilitata voce navigazione `Scadenze`
- Confermato che ogni rinnovo crea una nuova riga `memberships` e non modifica la membership precedente
- Reso lo script `npm run lint` esplicito sui sorgenti Next.js per evitare scansioni non necessarie del workspace
- Aggiornati report Supabase e checklist `M3_CHECKLIST.md`
- Nessuna funzionalita' email, sponsor, eventi, report o dashboard completa introdotta

## 0.4.0

- Avviata milestone M2 - Memberships & Payments
- Applicate al progetto Supabase live `PonteNext` le migration `005_membership_plans` e `006_memberships_payments`
- Create tabelle `membership_plans`, `memberships` e `payments` con vincoli, indici, RLS e trigger `updated_at`
- Aggiunti trigger/funzioni per ricalcolo automatico di `paid_amount` e `payment_status`
- Applicato seed piani iscrizione base `Ordinaria`, `Agevolata`, `Sostenitore`
- Implementate route `/memberships`, `/memberships/new`, `/memberships/[id]` e `/settings/membership-plans`
- Integrato lo storico iscrizioni nella scheda socio senza modificare il modello M1 fuori necessita'
- Aggiunti service layer, validazioni form e componenti responsive M2
- Documentata validazione live Supabase M2 e aggiunta checklist `M2_CHECKLIST.md`

## 0.3.1

- Formalizzato il modello storico delle iscrizioni
- Stabilito che ogni rinnovo crea una nuova riga in `memberships`
- Chiarito che le iscrizioni esistenti non devono essere modificate, estese o riutilizzate per rappresentare un rinnovo successivo
- Aggiornati database design, business rules e ADR architetturale

## 0.3.0

- Avviata milestone M1 - Members & Roles
- Applicata migration `004_members_roles` al progetto Supabase live `PonteNext`
- Create tabelle `members`, `roles` e `member_roles` con vincoli, indici, RLS e trigger `updated_at`
- Aggiunto seed ruoli base idempotente
- Implementati CRUD soci, CRUD ruoli e assegnazione ruoli ai soci
- Abilitate route `/members`, `/members/new`, `/members/[id]`, `/members/[id]/edit`, `/settings` e `/settings/roles`
- Aggiunti service layer e validazioni form M1
- Aggiunta checklist `M1_CHECKLIST.md`
- Documentata validazione live Supabase M1

## 0.2.5

- Avviata milestone M0.9 - Bootstrap primo `super_admin` e login reale
- Documentata la procedura operativa di creazione utente Supabase Auth e bootstrap `admin_users`
- Validato login live per Auth-only, `super_admin` attivo, admin inattivo e admin archiviato
- Aggiornato `LoginForm` per bloccare subito utenti Auth non presenti come admin attivi
- Documentato warning Auth residuo `auth_leaked_password_protection`
- Aggiunta checklist `M0_9_CHECKLIST.md`

## 0.2.4

- Avviata milestone M0.8 - Supabase Function Security Hardening
- Aggiunta migration `003_harden_admin_functions.sql`
- Hardened `set_updated_at` e helper admin con `search_path` esplicito e privilegi ridotti
- Spostato helper admin RLS in schema non esposto `app_private`
- Aggiornata la policy SELECT di `admin_users` per usare l'helper hardened
- Validato Security Advisor Supabase senza warning residui
- Riallineata la numerazione dei placeholder migration futuri per inserire `003_harden_admin_functions.sql`

## 0.2.3

- Applicate al progetto Supabase live `PonteNext` le migration M0 `001_extensions` e `002_admin_users`
- Validata la presenza di `public.admin_users`, dei vincoli, del trigger, della RLS e della policy SELECT iniziale
- Aggiornato `SUPABASE_VALIDATION_REPORT.md` con esito M0.7 e warning security advisor
- Aggiunta checklist `M0_7_CHECKLIST.md`

## 0.2.2

- Avviata milestone intermedia M0.5 - Supabase Verification
- Documentata la configurazione reale di `.env.local` per Supabase
- Documentata la procedura di bootstrap del primo `super_admin`
- Aggiunte checklist e guida Supabase per verifica di Auth, route protette e RLS iniziale

## 0.2.1

- Allineata la configurazione lint a Next.js 16 usando ESLint CLI
- Aggiornati README e checklist M0 con la command lint effettiva

## 0.2.0

- Avviata milestone M0 - Setup Infrastruttura
- Aggiunto scaffold Next.js App Router con TypeScript strict
- Configurati Tailwind CSS e shadcn/ui
- Aggiunta configurazione Supabase client/server
- Aggiunta pagina login amministratori e layout admin protetto
- Aggiunto middleware di protezione route amministrative
- Aggiunte migration M0 per estensione tecnica e `admin_users` minimo con RLS iniziale
- Aggiornati `.env.example`, README e checklist M0

## 0.1.1

- Recepita analisi progettuale in `ANALYSIS.md`
- Aggiornato M0 con `admin_users` minimo, bootstrap primo `super_admin`, route protette e RLS iniziale
- Chiarito che M3 Dashboard e' parziale e basata sui dati disponibili dopo M2
- Chiarito che M4 Scadenze non invia email e che i promemoria sono rimandati a M7
- Uniformata la convenzione dei componenti React a `PascalCase.tsx`
- Uniformate le route email definitive a `/email`, `/email/templates`, `/email/campaigns`
- Chiarito che `members.status` indica solo lo stato anagrafico e che lo stato associativo deriva da `memberships`
- Chiarito che `start_datetime` e `end_datetime` sono i campi canonici per gli eventi

## 0.1.0

- Creata struttura iniziale progetto
- Aggiunti documenti PRD, MD, ADR, database design, business rules, screen flow e UI guidelines

