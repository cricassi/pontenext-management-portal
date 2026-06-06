# PonteNext Management Portal

Portale web gestionale responsive per l'amministrazione dell'associazione Ponte Next.

---

## Obiettivo

Centralizzare la gestione amministrativa dell'associazione attraverso una piattaforma web unica accessibile da browser desktop, tablet e smartphone.

La piattaforma consente la gestione di:

* Soci
* Ruoli associativi
* Iscrizioni e rinnovi
* Quote associative
* Pagamenti non contabili
* Sponsor
* Eventi
* Comunicazioni email
* Reportistica

---

## Stack Tecnologico

### Frontend

* Next.js
* TypeScript
* Tailwind CSS
* shadcn/ui

### Backend

* Supabase

### Database

* PostgreSQL

### Hosting

* Vercel

### Repository

* GitHub

---

## Principi Architetturali

* Responsive First
* Mobile Friendly
* Cloud Native
* Database relazionale PostgreSQL
* Soft Delete sui dati applicativi
* Nessuna cancellazione fisica dei record
* Accesso consentito solo agli amministratori

---

## Ruoli Utente

### Super Admin

Può:

* gestire amministratori
* configurare il sistema
* accedere a tutte le funzionalità

### Admin

Può:

* gestire soci
* gestire iscrizioni
* gestire sponsor
* gestire eventi
* inviare comunicazioni

### Soci

Non hanno accesso alla piattaforma.

---

## Moduli Applicativi

### Dashboard

* KPI principali
* Scadenze imminenti
* Stato associazione

### Soci

* Anagrafica
* Ricerca
* Filtri
* Storico

### Ruoli

* Gestione ruoli associativi
* Storicizzazione ruoli

### Iscrizioni

* Nuove iscrizioni
* Rinnovi
* Storico iscrizioni

### Quote

* Quote minime
* Quote personalizzate
* Pagamenti non contabili

### Sponsor

* Anagrafica sponsor
* Contributi
* Storico collaborazioni

### Eventi

* Eventi associativi
* Collegamento sponsor-eventi

### Comunicazioni

* Template email
* Invio massivo
* Storico campagne

### Report

* Export CSV
* Export Excel

---

## Fuori Scope

Non verranno implementate:

* Contabilità
* Fatturazione
* IVA
* Bilanci
* Prima nota
* Area riservata soci
* App mobile nativa
* Pagamenti online

---

## Struttura Repository

```text
docs/
database/
src/
public/
tests/
scripts/
```

---

## Documentazione

La documentazione progettuale è disponibile nella cartella:

```text
/docs
```

Documenti principali:

```text
PRD.md
MASTER_DEVELOPMENT_PLAN.md
ADR-001_ARCHITECTURE.md
DATABASE_DESIGN.md
SCREEN_FLOW.md
UI_GUIDELINES.md
NAMING_CONVENTIONS.md
CODEX_INSTRUCTIONS.md
```

---

## Database

Le migration PostgreSQL/Supabase si trovano in:

```text
/database/migrations
```

I dati iniziali si trovano in:

```text
/database/seeds
```

---

## Modalità di Sviluppo

Il progetto viene sviluppato per milestone incrementali.

Ogni milestone deve:

1. aggiornare il database
2. aggiornare le migration
3. aggiornare il frontend
4. includere test
5. aggiornare la documentazione

---

## Stato Progetto

Fase corrente:

```text
Analisi e progettazione
```

Milestone corrente:

```text
M0 - Setup Infrastruttura
```

---

## Licenza

Da definire.
