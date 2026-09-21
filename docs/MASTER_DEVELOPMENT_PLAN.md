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

# M3 – Dashboard

## Perimetro

Dashboard parziale basata solo sui dati disponibili dopo M2.

## Widget

- soci anagraficamente attivi
- soci con iscrizione attiva
- soci con iscrizione scaduta
- rinnovi in scadenza

## Deliverable

Home amministrativa iniziale funzionante.

Nota: widget sponsor ed eventi verranno aggiunti solo dopo M5 e M6.

---

# M4 – Scadenze

## Funzioni

- filtro scaduti
- filtro entro 30 giorni
- filtro entro 60 giorni
- filtro entro 90 giorni
- azione rinnovo
- export elenco, se previsto dalla milestone

## Deliverable

Monitoraggio rinnovi.

Nota: M4 non invia email. I promemoria via email restano rimandati a M7.

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

# M10 - Visibilita' globale e portabilita' Excel

Stato al 2026-09-21: B completata e verificata post-merge (PR #48/#49);
A1 implementata su branch separato, migration 015 applicata con gate esplicito;
A2/C non avviate. Vedere [M10_A1_CHECKLIST.md](M10_A1_CHECKLIST.md).
La PR #46 e' annullata;
non recuperare permission group, readonly, scope o configurazioni personali.

Piano vincolante: [M10_FIELD_VISIBILITY_AND_EXCEL_PLAN.md](M10_FIELD_VISIBILITY_AND_EXCEL_PLAN.md).

Denominazioni mantenute: **M10-A Field Visibility**, **M10-B Complete Excel Export**,
**M10-C New Members Excel Import**. Le lettere non indicano l'ordine di sviluppo.
Quattro PR operative distinte, nel seguente ordine vincolante:

1. **M10-B Complete Excel Export**: `/settings/data-import-export`, export
   XLSX completo delle 13 tabelle business previste, solo super_admin. Non e'
   un backup Supabase e non sostituisce gli export filtrati M8. Funziona senza
   tabella, resolver o helper M10-A.
2. **M10-A1 Field Visibility Foundation**: migration additiva
   `ui_field_visibility`, RLS, helper super_admin, registro, resolver e pagina
   `/settings/field-visibility`. Nessuna schermata business modificata e
   nessun intervento sui suoi mapper/update; controlli dei moduli non ancora attivi.
   Lock 016 preparato dopo review B1, in attesa di gate live: SELECT admin,
   nessuna scrittura applicativa anche per super_admin; 015 non riapplicabile.
3. **M10-A2 Field Visibility Rollout**: integrazione progressiva visible/hidden
   tramite futura RPC controllata, allowlist DB delle coppie integrate e autore
   risolto dalla sessione. Non ripristinare grant INSERT/UPDATE diretti. Integrazione
   nelle schermate, adeguamento mapper/update e test di non perdita dati prima
   di attivare ciascun modulo. Admin attivi applicano; solo super_admin configurano.
4. **M10-C New Members Excel Import**: modello dedicato, dry-run e conferma;
   singolo INSERT atomico esclusivamente in `public.members`. Nessun UPDATE,
   UPSERT, DELETE, import multi-tabella, ruolo, iscrizione, pagamento o account
   creato automaticamente.

Motivazione: B e' read-only e permette uno snapshot Excel dei dati applicativi
prima delle modifiche ai form; A viene introdotta progressivamente; C, unica
fase che inserisce nuove anagrafiche business, viene implementata per ultima.

Verifica export/post-merge B prima di A1, verifica foundation/post-merge A1
prima di A2, test di preservazione per modulo e verifica post-merge A2 prima
di C. Test C su ambiente separato prima del live. M10-A e' completa solo dopo
A1 e A2. Non cambiare strutture delle tabelle business.
M10-B implementata senza migration/RPC: doppia lettura REST confrontata, non
snapshot transazionale, da eseguire in finestra senza scritture. Eventuali
funzioni additive per la transazione C richiedono revisione e approvazione nella
relativa PR; non sono implementate in B.

Gate operativi: `MIGRATION M10-A LIVE APPROVATA` ricevuto il 2026-09-21 per la sola 015 A1;
`IMPORT NUOVI SOCI LIVE APPROVATO` per il primo import live sul file/hash
validato. La documentazione non costituisce autorizzazione a eseguirli.

---

# Regole per Codex

Per ogni milestone:

1. leggere PRD, ADR e DATABASE_DESIGN
2. creare o aggiornare migration solo nelle fasi implementative, se necessarie e autorizzate
3. creare API/service layer
4. creare UI
5. creare test
6. aggiornare documentazione

Non introdurre funzionalità fuori milestone.
