# PonteNext Management Portal - Analysis

## Ambito dell'analisi

Questa analisi e' stata redatta leggendo integralmente la documentazione presente in `/docs`:

- `PROJECT_OVERVIEW.md`
- `PRD.md`
- `ADR-001_ARCHITECTURE.md`
- `MASTER_DEVELOPMENT_PLAN.md`
- `DATABASE_DESIGN.md`
- `BUSINESS_RULES.md`
- `SCREEN_FLOW.md`
- `UI_GUIDELINES.md`
- `RESPONSIVE_RULES.md`
- `COMPONENTS_GUIDE.md`
- `NAMING_CONVENTIONS.md`
- `ACCESSIBILITY.md`
- `CODEX_INSTRUCTIONS.md`
- `CHANGELOG.md`

Sono stati inoltre osservati in sola lettura i file di struttura del repository e le migration presenti in `database/migrations`, che risultano al momento placeholder.

## Comprensione del progetto

PonteNext Management Portal e' una piattaforma web gestionale per l'amministrazione interna dell'associazione Ponte Next. Il prodotto e' pensato per centralizzare dati e processi oggi verosimilmente gestiti con Excel, archivi manuali o flussi non integrati.

Gli utenti applicativi previsti sono solo amministratori:

- `super_admin`, con accesso completo e gestione amministratori/configurazione.
- `admin`, con gestione operativa di soci, quote, sponsor, eventi e comunicazioni.

I soci non hanno account, non accedono al sistema e non esiste un'area riservata soci. Questo vincolo e' coerente in PRD, ADR, business rules e screen flow.

Il perimetro funzionale copre:

- anagrafica soci;
- ruoli associativi configurabili e storicizzati;
- iscrizioni, rinnovi, quote flessibili e scadenze;
- pagamenti registrati a solo scopo gestionale, non contabile;
- sponsor e contributi sponsor;
- eventi e collegamento sponsor-eventi;
- template e campagne email;
- dashboard operativa;
- report CSV/XLSX.

Il fuori scope e' molto chiaro:

- contabilita';
- fatturazione;
- IVA;
- bilanci;
- prima nota;
- ecommerce;
- pagamenti online;
- app mobile nativa;
- area riservata soci;
- pagine pubbliche non previste.

Lo stato del repository indica una fase di analisi/progettazione o bootstrap iniziale: la documentazione e' completa come intenzione progettuale, mentre codice applicativo, dipendenze Next.js effettive e migration operative non risultano ancora implementati.

## Architettura proposta

L'architettura documentata e':

```text
Browser -> Next.js -> Supabase -> PostgreSQL
```

La proposta e' coerente con il tipo di prodotto:

- frontend e routing con Next.js App Router;
- TypeScript strict;
- UI con Tailwind CSS, shadcn/ui e Lucide Icons;
- autenticazione con Supabase Auth;
- profilo applicativo degli amministratori in `admin_users`;
- persistenza dati in PostgreSQL gestito da Supabase;
- deploy su Vercel;
- RLS abilitata su tutte le tabelle applicative.

Una struttura applicativa coerente con la documentazione dovrebbe separare:

- `src/app`: route Next.js, layout protetti, pagine e loading/error boundaries;
- `src/components/ui`: componenti generici shadcn/ui;
- `src/components/<domain>`: componenti di dominio per soci, iscrizioni, sponsor, eventi, email e report;
- `src/services`: layer di accesso dati e operazioni applicative per dominio;
- `src/types`: tipi condivisi e tipi generati da Supabase;
- `src/lib`: client Supabase browser/server, configurazioni e helper tecnici;
- `src/utils`: funzioni pure per date, valuta, stati e validazioni.

Per proteggere l'applicazione, l'architettura dovrebbe prevedere da subito:

- middleware o controlli server-side per impedire accesso anonimo alle route gestionali;
- verifica del record `admin_users` dopo l'autenticazione Supabase;
- differenziazione operativa tra `super_admin` e `admin`;
- policy RLS coerenti con `admin_users.status = 'active'`;
- strategia di bootstrap per il primo `super_admin`.

Sul frontend, la direzione e' gestionale e non marketing: sidebar desktop, header mobile, tabelle su desktop, card su mobile, filtri adattivi e form semplici. Le linee guida richiedono un prodotto realmente usabile da 360px in su, non solo tabelle con scroll orizzontale.

## Analisi del database

Il modello dati proposto e' relazionale, audit-ready, con soft delete tramite `archived_at` e UUID come primary key. Gli importi usano `numeric(10,2)`, gli stati sono `text` con vincoli `check`, e nella prima versione vengono evitati enum PostgreSQL.

Le tabelle previste sono:

- `admin_users`;
- `members`;
- `roles`;
- `member_roles`;
- `membership_plans`;
- `memberships`;
- `payments`;
- `sponsors`;
- `events`;
- `sponsor_contributions`;
- `event_sponsors`;
- `email_templates`;
- `email_campaigns`;
- `email_campaign_recipients`;
- `audit_logs`.

Il modello separa correttamente l'anagrafica socio dalle iscrizioni. Quote, durata e scadenza appartengono a `memberships`, non a `members`. Questa scelta e' solida per gestire rinnovi storici, quote agevolate, quote sostenitore e durate personalizzate.

Le relazioni principali sono:

- `members` 1:N `memberships`;
- `membership_plans` 1:N `memberships`;
- `memberships` 1:N `payments`;
- `members` N:M `roles` tramite `member_roles`;
- `sponsors` 1:N `sponsor_contributions`;
- `events` 1:N opzionale `sponsor_contributions`;
- `events` N:M `sponsors` tramite `event_sponsors`;
- `email_campaigns` 1:N `email_campaign_recipients`;
- `email_templates` 1:N opzionale `email_campaigns`.

Le viste consigliate sono utili e coerenti con dashboard e scadenze:

- `active_members_view`;
- `expiring_memberships_view`;
- `expired_memberships_view`;
- `dashboard_stats_view`.

I trigger consigliati sono necessari piu' che opzionali:

- `set_updated_at()` per mantenere `updated_at`;
- trigger su `payments` per aggiornare `memberships.paid_amount`;
- funzione di refresh o calcolo per stato iscrizione e stato pagamento.

Punto importante: nel repository esistono i file migration da `001` a `013`, ma sono placeholder. Il database documentato non e' ancora materializzato nello schema SQL. Questo riduce il rischio di modifiche distruttive ora, ma rende fondamentale validare bene vincoli, indici, RLS e trigger prima della prima migration reale.

### Aspetti da dettagliare prima delle migration operative

- Vincoli di unicita' compatibili con soft delete, ad esempio email o nomi unici che non blocchino record archiviati se il requisito lo consente.
- Regole per evitare ruoli sovrapposti in `member_roles`, se un socio non puo' avere lo stesso ruolo attivo due volte nello stesso periodo.
- Regole per evitare iscrizioni attive sovrapposte dello stesso socio, se non sono ammesse.
- Definizione precisa di `members.status`: stato anagrafico o stato associativo derivato dall'iscrizione?
- Strategia per calcolare `payment_status` e `paid_amount` senza incoerenze con `payments`.
- Semantica di `overpaid`: e' ammesso come stato normale, warning operativo o errore da correggere?
- Coerenza tra `events.event_date`, `events.start_datetime` ed `events.end_datetime`.
- Regole su `email_campaign_recipients`: destinatario socio, sponsor o custom; serve vincolo che impedisca combinazioni ambigue.
- Politiche RLS per bootstrap del primo amministratore.
- Strategia di audit log: trigger automatici, logging applicativo o approccio misto.

## Analisi delle milestone

Il Master Development Plan propone milestone piccole, autonome e testabili. L'idea e' corretta, ma alcune dipendenze funzionali vanno rese piu' esplicite.

### M0 - Setup infrastruttura

Obiettivo: Next.js, TypeScript, Tailwind, shadcn/ui, Supabase, autenticazione amministratori, deploy Vercel.

Deliverable: login amministratore funzionante.

Criticita': il login amministratore richiede gia' una strategia per `admin_users`, ruoli applicativi e bootstrap del primo super admin. Tuttavia `admin_users` e' elencata in M1. Conviene decidere se una versione minima di `admin_users` entra in M0 o se M0 produce solo autenticazione Supabase senza autorizzazione applicativa completa.

### M1 - Anagrafica soci e ruoli

Obiettivo: CRUD soci, CRUD ruoli, assegnazione ruoli.

Dipendenze: richiede tabelle `members`, `roles`, `member_roles` e probabilmente seed ruoli.

Criticita': la storicizzazione dei ruoli richiede regole su intervalli temporali, ruolo principale e sovrapposizioni. La UI lista soci mostra "Ruolo principale", ma il database non definisce esplicitamente come determinarlo.

### M2 - Iscrizioni e quote

Obiettivo: piani iscrizione, iscrizioni, pagamenti, rinnovi e storico.

Questa e' una milestone centrale per il dominio. Abilita scadenze, dashboard soci attivi/scaduti, report quote e logiche di pagamento.

Criticita': `paid_amount` e `payment_status` sono denormalizzati rispetto a `payments`. Serve decidere se aggiornarli con trigger, transazioni applicative o viste calcolate.

### M3 - Dashboard

Obiettivo: widget per soci attivi, soci scaduti, rinnovi, sponsor attivi, eventi futuri.

Criticita': sponsor ed eventi vengono implementati in M5 e M6. Quindi M3, cosi' scritta, dipende da moduli non ancora disponibili. Possibili soluzioni:

- spostare M3 dopo M6;
- rendere M3 una dashboard parziale basata solo su M1/M2;
- creare widget disabilitati/empty state per sponsor ed eventi fino alle milestone successive.

### M4 - Scadenze

Obiettivo: filtri scaduti e in scadenza entro 30/60/90 giorni, azione rinnovo.

Dipende in modo naturale da M2. E' una buona milestone subito dopo iscrizioni e pagamenti.

Criticita': nello screen flow compare anche "invia promemoria", ma il sistema email e' M7. Va chiarito se in M4 l'azione non esiste, e' disabilitata o crea solo una preparazione non inviata.

### M5 - Sponsor

Obiettivo: CRUD sponsor e contributi.

Il modello distingue correttamente sponsor e soci. Va chiarito se i contributi sponsor sono solo monetari o anche valorizzazioni descrittive per beni/servizi, dato che `amount >= 0` esiste anche per `goods` e `service`.

### M6 - Eventi

Obiettivo: CRUD eventi e collegamento sponsor-evento.

Criticita': il modello ha sia `event_sponsors` sia `sponsor_contributions.event_id`. Serve chiarire se:

- `event_sponsors` indica relazione istituzionale sponsor-evento;
- `sponsor_contributions` indica contributi specifici, eventualmente collegati a evento;
- un contributo evento implica automaticamente relazione sponsor-evento o no.

### M7 - Comunicazioni email

Obiettivo: template, destinatari e storico invii.

Dipende da soci, sponsor e stati iscrizione. Prima di implementarla, serve scegliere provider email, gestione errori, retry, opt-out se necessario, e regole di consenso/privacy.

### M8 - Report

Obiettivo: export CSV e XLSX.

Dipende da quasi tutti i moduli. Va definito se gli export sono generati client-side, server-side o tramite route protette, e quali filtri/stati devono rispettare.

### M9 - Hardening

Obiettivo: permessi, RLS, validazioni, mobile, backup/recovery.

Criticita': alcune attivita' non dovrebbero essere rimandate tutte alla fine. RLS, validazioni e responsive base sono requisiti trasversali gia' dalle prime milestone. M9 dovrebbe essere una fase di verifica finale, non il primo momento in cui si affrontano sicurezza e qualita'.

## Eventuali incongruenze

1. `admin_users` e' in M1, ma il deliverable M0 richiede login amministratore funzionante. Serve decidere dove nasce l'autorizzazione applicativa.

2. M3 Dashboard include sponsor attivi ed eventi futuri, ma sponsor ed eventi vengono implementati solo in M5 e M6.

3. M4 Scadenze prevede nello screen flow l'azione "invia promemoria", ma le email arrivano in M7.

4. `NAMING_CONVENTIONS.md` mostra esempi di file componenti React in `PascalCase.tsx`, mentre `COMPONENTS_GUIDE.md` prescrive file componenti in `kebab-case.tsx`. Serve una regola unica.

5. Le route email non sono completamente uniformi: lo screen flow usa `/email`, `/email/templates`, `/email/campaigns`; le naming conventions citano anche `/email-campaigns`.

6. `events` contiene sia `event_date` sia `start_datetime`/`end_datetime`. Senza regole di precedenza possono divergere.

7. `members.status` puo' essere confuso con lo stato iscrizione. La documentazione dice che scadenza e quota non stanno in `members`, ma dashboard e filtri parlano di soci attivi/scaduti.

8. Il database design consiglia trigger su pagamenti e stati, ma non specifica ancora se gli stati sono sorgente dati o campi derivati.

9. I file migration e seed esistenti sono placeholder, mentre la documentazione li presenta come ordine migration previsto. Va mantenuta chiara la differenza tra piano e schema implementato.

10. README indica una struttura con `public/` e `tests/`, ma nel repository osservato queste cartelle non risultano ancora presenti.

## Rischi progettuali

- Rischio di sicurezza se RLS e autorizzazione admin vengono affrontate tardi o solo in hardening.
- Rischio di incoerenza dati tra `payments`, `paid_amount` e `payment_status`.
- Rischio di ambiguita' tra stato anagrafico del socio e stato associativo derivato dalle iscrizioni.
- Rischio di dashboard anticipata rispetto alle dipendenze reali di sponsor ed eventi.
- Rischio di UI mobile incompleta se la conversione tabella-card non viene progettata come componente ricorrente.
- Rischio di duplicazione tra `event_sponsors` e `sponsor_contributions.event_id`.
- Rischio di audit log non affidabile se non si decide presto quali azioni devono essere registrate automaticamente.
- Rischio di blocco operativo nel bootstrap del primo `super_admin`.
- Rischio di naming incoerente se non viene risolta la differenza PascalCase/kebab-case per file componenti.
- Rischio di export non scalabili o non sicuri se i report vengono implementati solo lato client senza considerare RLS e volumi.
- Rischio privacy/email se campagne, destinatari, errori e storico invii non vengono modellati con attenzione.

## Suggerimenti migliorativi

1. Rendere M0 una vera foundation di sicurezza: Next.js, Supabase Auth, `admin_users` minimo, bootstrap super admin, route protette, RLS iniziale e deploy.

2. Spostare la dashboard completa dopo sponsor ed eventi oppure definire M3 come dashboard parziale post-M2.

3. Anticipare M4 subito dopo M2, dato che le scadenze derivano direttamente da `memberships.end_date`.

4. Decidere formalmente se `paid_amount` e `payment_status` sono campi persistiti aggiornati da trigger o valori calcolati da vista/query.

5. Definire una vista canonica per lo stato associativo del socio, evitando di sovraccaricare `members.status`.

6. Introdurre vincoli o indici parziali per soft delete, unicita' e relazioni attive.

7. Risolvere la convenzione sui nomi file React prima di generare codice.

8. Normalizzare le route email scegliendo tra `/email/...` e `/email-campaigns`.

9. Chiarire la relazione tra eventi, sponsor e contributi prima di implementare M5/M6.

10. Trattare accessibilita' e responsive come criteri di accettazione di ogni milestone, non solo come verifica finale.

11. Definire una strategia test minima per ogni milestone: unit test per logiche di stato/importi, integration test per service layer, smoke/e2e per flussi principali.

12. Aggiungere una sezione "Definition of Done" per milestone, includendo documentazione aggiornata, lint/test, RLS e verifica mobile.

13. Definire provider email e strategia di invio prima di M7, inclusi retry, errori, destinatari custom e storico.

14. Pianificare audit log fin dalle prime operazioni CRUD, almeno per archiviazioni, rinnovi, pagamenti, invii email e modifiche admin.

## Domande aperte

1. Come viene creato il primo `super_admin` senza bypassare RLS o lasciare endpoint pubblici temporanei?

2. `members.status = active` indica socio anagraficamente attivo o socio con iscrizione valida?

3. Sono ammesse piu' iscrizioni attive sovrapposte per lo stesso socio?

4. Sono ammessi piu' ruoli attivi contemporanei per lo stesso socio? Come si determina il "ruolo principale" mostrato in lista?

5. `payment_status` deve essere calcolato automaticamente o modificabile manualmente dagli admin?

6. Lo stato `overpaid` e' una condizione accettata o un'anomalia da segnalare?

7. Per beni e servizi degli sponsor, l'importo e' obbligatorio, opzionale o solo valore stimato?

8. Un contributo sponsor collegato a un evento crea implicitamente anche una relazione in `event_sponsors`?

9. Quale campo evento e' canonico tra `event_date`, `start_datetime` ed `end_datetime`?

10. Quale provider email verra' usato per campagne e template?

11. Esistono requisiti di consenso, privacy o opt-out per inviare email massive ai soci e agli sponsor?

12. Gli export CSV/XLSX devono essere disponibili a tutti gli admin o solo ai super admin?

13. I report devono esportare anche record archiviati o solo record attivi?

14. Quali azioni devono essere registrate in `audit_logs` e con quale granularita'?

15. Quale convenzione definitiva va usata per i file componenti React: `PascalCase.tsx` o `kebab-case.tsx`?

16. La dashboard deve essere completa solo dopo M6 o puo' nascere parziale in M3?

17. L'azione "invia promemoria" nelle scadenze deve attendere M7 o comparire prima come funzione disabilitata/non implementata?

18. Backup e recovery sono responsabilita' di Supabase/Vercel o devono essere documentati con procedure operative interne?
