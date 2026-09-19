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

M3 produce una dashboard parziale basata solo sui dati disponibili dopo M2.

M4 non invia email. I promemoria scadenze sono rimandati a M7.

## AD-016 - M10 revisionato: visibilita' e portabilita'

Decisione progettuale, non ancora implementata. Riferimento:
[M10_FIELD_VISIBILITY_AND_EXCEL_PLAN.md](M10_FIELD_VISIBILITY_AND_EXCEL_PLAN.md).
La PR #46 chiusa senza merge e la successiva ipotesi di import multi-tabella
sono superate da questo piano.

- M10-A introduce una preferenza UI globale DB-backed visible/hidden per soli
  campi facoltativi. Nessun readonly, permission group, scope multiplo,
  localStorage o permesso per colonna. Il dato nascosto resta disponibile ai
  processi autorizzati e non viene riscritto quando si modifica un altro campo.
- `ui_field_visibility` e' l'unica nuova tabella prevista. Registro tipizzato
  autorevole nel codice; default visible; RLS admin attivi in lettura e soli
  super_admin attivi in scrittura, senza DELETE. `updated_by` riferisce
  `admin_users.id`, risolto tramite auth_user_id, non direttamente auth.uid().
- M10-B esporta il workbook `pontenext-full-export-v1`: 13 tabelle business,
  README e METADATA, senza Auth o segreti. Non e' un backup completo e non e'
  accettato dall'import. L'export M8 filtrato rimane distinto.
- M10-C accetta soltanto `pontenext-new-members-import-v1`, con README e members.
  Solo nuovi soci, solo INSERT in members; UUID generati dal DB e status active
  dal server. Nessuna modifica di soci esistenti o scrittura su altre tabelle.
- Dry-run, ricevuta legata al file, verifica duplicati e conferma super_admin
  sono obbligatori. Un bulk INSERT garantisce tutto-o-niente ma, da solo, non
  rende atomico il controllo duplicati: proposta funzione transazionale
  SECURITY INVOKER con lock breve e nuova verifica, da approvare nella futura C.
- Export completo e import sono server-side con sessione/RLS, non service role.
  Eventuali funzioni additive B/C non alterano le tabelle business e richiedono
  revisione dedicata. Nessuna migration o funzionalita' viene creata dal piano.

Le denominazioni restano M10-A Field Visibility, M10-B Complete Excel Export
e M10-C New Members Excel Import. L'ordine operativo e' **B -> A1 -> A2 -> C**,
con quattro PR separate:

1. **M10-B Complete Excel Export**: read-only, snapshot applicativo disponibile
   prima delle modifiche ai form, senza dipendere da infrastruttura/helper A1.
2. **M10-A1 Field Visibility Foundation**: migration additiva ui_field_visibility,
   RLS, helper super_admin, registro, resolver e pagina Impostazioni; nessuna
   schermata business, mapper o update esistente modificato.
3. **M10-A2 Field Visibility Rollout**: integrazione progressiva delle preferenze,
   patch/mapper che preservano valori nascosti e test di non perdita dati per modulo.
4. **M10-C New Members Excel Import**: ultima fase, unica che inserisce nuove
   anagrafiche business; test separati prima di qualunque import live.

Verifica post-merge prima di passare alla fase successiva. A1 da sola non
rende operativa la visibilita' nei moduli: i relativi controlli nelle
Impostazioni vengono abilitati solo dopo integrazione e test A2.
L'import non e' un restore e non ricrea relazioni, iscrizioni, quote,
pagamenti o utenti Auth; non invia email.
