# Master Development Plan

## Obiettivo

Sviluppare PonteNext Management Portal tramite milestone piccole, autonome e testabili.

Ogni milestone deve essere completata prima di passare alla successiva.

---

# M0 – Setup infrastruttura

## Obiettivo

Predisporre l'ambiente tecnico e la base minima di sicurezza applicativa.

## Attività

- inizializzare progetto Next.js
- configurare TypeScript
- configurare Tailwind CSS
- configurare shadcn/ui
- collegare Supabase
- configurare autenticazione amministratori
- predisporre `admin_users` minimo per autorizzazione applicativa
- definire bootstrap del primo `super_admin`
- proteggere le route gestionali
- abilitare RLS iniziale sulle tabelle applicative disponibili
- predisporre deploy Vercel

## Deliverable

Login amministratore funzionante con accesso consentito solo ad admin attivi.

---

# M0.5 - Supabase Verification

## Obiettivo

Verificare e documentare il collegamento reale tra progetto Next.js e Supabase prima di iniziare M1.

## Attivita'

- verificare migration `admin_users`
- verificare RLS iniziale su `admin_users`
- verificare variabili ambiente Supabase
- documentare configurazione `.env.local`
- documentare bootstrap del primo `super_admin`
- verificare coerenza tra Supabase Auth, login e route protette

## Deliverable

Checklist M0.5 e guida Supabase operative, senza introdurre CRUD soci o nuove funzionalita' applicative.

---

# M1 – Anagrafica soci e ruoli

## Tabelle

- members
- roles
- member_roles

## Funzioni

- CRUD soci
- CRUD ruoli
- assegnazione ruoli ai soci

## Deliverable

Gestione anagrafica soci funzionante.

---

# M2 – Iscrizioni e quote

## Tabelle

- membership_plans
- memberships
- payments

## Funzioni

- creazione iscrizione
- rinnovo
- pagamento parziale/totale
- storico iscrizioni

## Deliverable

Gestione iscrizioni completa.

---

# M3 – Scadenze e rinnovi

## Perimetro

Gestione scadenze e rinnovi sulle memberships esistenti dopo M2.

## Funzioni

- filtro scaduti e scadenze entro 30/60/90 giorni
- storico rinnovi
- rinnovo rapido, sempre con una nuova membership

## Deliverable

Monitoraggio e rinnovo delle iscrizioni, senza estendere quelle precedenti.

Nessun invio email automatico. Riferimento: `M3_IMPLEMENTATION_PLAN.md`.

---

# M4 – Dashboard operativa

## Funzioni

- KPI soci attivi, scadenze entro 30 giorni, iscrizioni scadute e quote incomplete
- nuovi soci e rinnovi negli ultimi 30 giorni
- widget da gestire subito, prossime scadenze e ultimi rinnovi
- azioni rapide sui flussi gia' disponibili

## Deliverable

Dashboard operativa sui soli dati M1-M3, non dashboard direzionale.

Nessuna email o report introdotti da M4. Riferimento: `M4_IMPLEMENTATION_PLAN.md`.

---

# M5 – Sponsor

## Tabelle

- sponsors
- sponsor_contributions

## Funzioni

- CRUD sponsor
- registrazione contributi

## Deliverable

Gestione sponsor.

---

# M6 – Eventi

## Tabelle

- events
- event_sponsors

## Funzioni

- CRUD eventi
- collegamento sponsor-evento

## Deliverable

Gestione eventi.

---

# M7 – Comunicazioni email

## Tabelle

- email_templates
- email_campaigns
- email_campaign_recipients

## Funzioni

- template
- selezione destinatari
- invio promemoria scadenze
- storico invii

## Deliverable

Sistema comunicazioni.

---

# M8 – Report

## Funzioni

- export CSV
- export XLSX

## Deliverable

Reportistica esportabile.

---

# M9 – Hardening

## Attività

- verifica permessi
- verifica RLS
- validazioni dati
- ottimizzazione mobile
- backup/recovery

## Deliverable

Release candidate.

---

# M10 - Configurable Field Visibility & Permission-Ready Policies

## Stato

Piano documentale, non implementazione. Riferimento per il futuro sviluppo:
[M10_FIELD_VISIBILITY_IMPLEMENTATION_PLAN.md](M10_FIELD_VISIBILITY_IMPLEMENTATION_PLAN.md).

## Obiettivo

Configurazione globale dei campi delle schermate esistenti con stati
`editable`, `readonly`, `hidden`, senza perdita dati e con enforcement server-side.

## Perimetro proposto

- registro tipizzato e versionato nel codice, override soltanto per chiavi note
- pagina `/settings/field-visibility`, modifica solo per super_admin attivi
- futura tabella `ui_field_policies`, RLS e soft delete degli override
- campi obbligatori mai hidden; readonly create soltanto con default server certo
- resolver condiviso e letture per schermata, senza query per singolo campo
- predisposizione permission_group non operativa: nessun CRUD gruppi o assegnazione
- integrazione progressiva di anagrafiche, relazioni, quote, email e filtri report

## Deliverable e sequenza

Prima approvare il piano, poi PR separate per motore/Impostazioni, anagrafiche,
relazioni/quote e comunicazioni/filtri. La configurazione UI non costituisce da
sola un'autorizzazione DB per colonna. Default, campi condizionali e confine di
sicurezza sono specificati nel piano. Nessuna migration o modifica live nella
PR di pianificazione.

---

# Regole per Codex

Per ogni milestone:

1. leggere PRD, ADR e DATABASE_DESIGN
2. creare o aggiornare migration solo nelle fasi di implementazione che lo richiedono
3. creare API/service layer
4. creare UI
5. creare test
6. aggiornare documentazione

Non introdurre funzionalità fuori milestone.
