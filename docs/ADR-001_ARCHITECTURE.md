# ADR-001 – Architecture Decisions

## Progetto

PonteNext Management Portal

Versione: 1.0

---

# Decisioni vincolanti

## AD-001 – Tipologia prodotto

Piattaforma web responsive accessibile da browser.

Non verranno sviluppate app native iOS o Android.

## AD-002 – Utenti

Solo amministratori autenticati.

I soci non hanno account e non accedono al sistema.

## AD-003 – Architettura

Browser → Next.js → Supabase → PostgreSQL

## AD-004 – Frontend

Next.js + TypeScript.

## AD-005 – UI

Tailwind CSS + shadcn/ui.

## AD-006 – Database

PostgreSQL tramite Supabase.

## AD-007 – Hosting

Frontend su Vercel.

## AD-008 – Autenticazione

Supabase Auth.

Ruoli applicativi:

- super_admin
- admin

## AD-009 – Soft delete

Nessun dato principale viene cancellato fisicamente.

Usare `archived_at`.

## AD-010 – Iscrizioni

Quote, durata e scadenze appartengono alla singola iscrizione, non alla tabella soci.

## AD-011 – Sponsor/Eventi

Relazione molti-a-molti.

## AD-012 – Contabilità

Nessuna gestione contabile, fiscale o IVA.

## AD-013 – Report

CSV e XLSX in prima versione.

PDF esclusi.

## AD-014 – Mobile-first

Schermate utilizzabili da viewport minimo 360px.

## AD-015 – Sviluppo incrementale

Seguire le milestone del Master Development Plan.
