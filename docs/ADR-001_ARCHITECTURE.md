# ADR-001 - Architecture Decisions

## Progetto

PonteNext Management Portal

Versione: 1.0

---

# Decisioni vincolanti

## AD-001 - Tipologia prodotto

Piattaforma web responsive accessibile da browser.

Non verranno sviluppate app native iOS o Android.

## AD-002 - Utenti

Solo amministratori autenticati.

I soci non hanno account e non accedono al sistema.

## AD-003 - Architettura

Browser -> Next.js -> Supabase -> PostgreSQL

## AD-004 - Frontend

Next.js + TypeScript.

## AD-005 - UI

Tailwind CSS + shadcn/ui.

## AD-006 - Database

PostgreSQL tramite Supabase.

## AD-007 - Hosting

Frontend su Vercel.

## AD-008 - Autenticazione e autorizzazione

Supabase Auth.

Ruoli applicativi:

- super_admin
- admin

M0 deve includere `admin_users` minimo, bootstrap del primo `super_admin`, route gestionali protette e RLS iniziale.

## AD-009 - Soft delete

Nessun dato principale viene cancellato fisicamente.

Usare `archived_at`.

## AD-010 - Iscrizioni

Quote, durata e scadenze appartengono alla singola iscrizione, non alla tabella soci.

`members.status` indica solo lo stato anagrafico. Lo stato associativo del socio e' derivato dalle `memberships`.

Le iscrizioni sono modellate come storico append-only per i rinnovi: ogni rinnovo crea una nuova riga in `memberships`.

Una riga `memberships` esistente non deve essere modificata, estesa o riutilizzata per rappresentare un rinnovo successivo.

Questa scelta preserva la storia dei periodi associativi, delle quote previste e dello stato pagamento di ciascun periodo.

## AD-011 - Sponsor/Eventi

Relazione molti-a-molti.

Per gli eventi, `start_datetime` e `end_datetime` sono i campi canonici.

## AD-012 - Contabilita'

Nessuna gestione contabile, fiscale o IVA.

## AD-013 - Report

CSV e XLSX in prima versione.

PDF esclusi.

## AD-014 - Mobile-first

Schermate utilizzabili da viewport minimo 360px.

## AD-015 - Sviluppo incrementale

Seguire le milestone del Master Development Plan.

M3 gestisce scadenze e rinnovi storici; M4 produce una dashboard operativa sui
dati disponibili da M1-M3, secondo i rispettivi Implementation Plan.

M3 e M4 non inviano email. Il workflow email appartiene a M7 e richiede conferma admin.

## AD-016 - Policy dei campi (proposta M10, non implementata)

Riferimento: [M10_FIELD_VISIBILITY_IMPLEMENTATION_PLAN.md](M10_FIELD_VISIBILITY_IMPLEMENTATION_PLAN.md).

Registro di schermate/campi tipizzato e versionato nel repository come fonte
autorevole. Il database proposto `ui_field_policies` salva solo override validi,
non campi arbitrari. Route definitiva `/settings/field-visibility`.

Inizialmente opera solo lo scope global. Le colonne scope_type/scope_id
predispongono permission_group, ma un vincolo ne impedisce l'uso finche' non
esistono gruppi, assegnazioni e relative autorizzazioni. Precedenza futura:
override dei gruppi, poi global, poi default; tra gruppi prevale lo stato piu'
restrittivo (hidden, readonly, editable).

Modifica configurazione riservata ai super_admin attivi, lettura agli admin
attivi. RLS e privilegi minimi sulla nuova tabella, nessuna policy DELETE.
Resolver server centralizzato e caricamento condiviso per schermata, non per campo.

Readonly e hidden richiedono enforcement nelle action/service e DTO filtrati;
un update conserva i valori non editabili, senza riscriverli nella patch.
Obbligatori mai hidden; readonly in create soltanto con default server certo.

Le policy non costituiscono un sistema completo di autorizzazioni: le RLS
business correnti sono per riga, non impongono da sole restrizioni sulle colonne
via Data API. Il limite e la futura evoluzione sono espliciti nel piano.
Nessuna implementazione, migration o modifica live e' introdotta da questo ADR.
