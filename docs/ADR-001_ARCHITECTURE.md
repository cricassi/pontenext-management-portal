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

M3 produce una dashboard parziale basata solo sui dati disponibili dopo M2.

M4 non invia email. I promemoria scadenze sono rimandati a M7.
