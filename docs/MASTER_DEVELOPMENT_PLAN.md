# Master Development Plan

## Obiettivo

Sviluppare PonteNext Management Portal tramite milestone piccole, autonome e testabili.

Ogni milestone deve essere completata prima di passare alla successiva.

---

# M0 – Setup infrastruttura

## Obiettivo

Predisporre l'ambiente tecnico.

## Attività

- inizializzare progetto Next.js
- configurare TypeScript
- configurare Tailwind CSS
- configurare shadcn/ui
- collegare Supabase
- configurare autenticazione amministratori
- predisporre deploy Vercel

## Deliverable

Login amministratore funzionante.

---

# M1 – Anagrafica soci e ruoli

## Tabelle

- admin_users
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

## Widget

- soci attivi
- soci scaduti
- rinnovi in scadenza
- sponsor attivi
- eventi futuri

## Deliverable

Home amministrativa funzionante.

---

# M4 – Scadenze

## Funzioni

- filtro scaduti
- filtro entro 30 giorni
- filtro entro 60 giorni
- filtro entro 90 giorni
- azione rinnovo

## Deliverable

Monitoraggio rinnovi.

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

# Regole per Codex

Per ogni milestone:

1. leggere PRD, ADR e DATABASE_DESIGN
2. creare o aggiornare migration
3. creare API/service layer
4. creare UI
5. creare test
6. aggiornare documentazione

Non introdurre funzionalità fuori milestone.
