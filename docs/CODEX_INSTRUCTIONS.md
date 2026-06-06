# CODEX_INSTRUCTIONS.md

# PonteNext Management Portal – Instructions for Codex

Versione: 1.0

---

# 1. Obiettivo

Questo file contiene le regole operative che Codex deve rispettare durante lo sviluppo.

---

# 2. Documenti da leggere prima di sviluppare

Prima di ogni modifica, leggere:

```text
docs/PRD.md
docs/MASTER_DEVELOPMENT_PLAN.md
docs/ADR-001_ARCHITECTURE.md
docs/DATABASE_DESIGN.md
docs/BUSINESS_RULES.md
docs/SCREEN_FLOW.md
docs/UI_GUIDELINES.md
docs/RESPONSIVE_RULES.md
```

---

# 3. Regole generali

- Procedere una milestone alla volta.
- Non anticipare funzionalità di milestone successive.
- Non introdurre contabilità.
- Non creare area riservata soci.
- Non creare app mobile nativa.
- Non usare cancellazioni fisiche per dati principali.
- Non salvare quote o scadenze nella tabella `members`.
- Non usare `members.status` per indicare lo stato associativo.
- Usare `start_datetime` e `end_datetime` come campi canonici evento.

---

# 4. Stack obbligatorio

Usare:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase
- PostgreSQL
- Vercel

Non sostituire stack senza aggiornare ADR.

---

# 5. Database

- Usare UUID come primary key.
- Usare `numeric(10,2)` per importi.
- Usare `timestamptz` per timestamp.
- Usare `date` per date senza orario.
- Usare soft delete con `archived_at`.
- Abilitare RLS sulle tabelle applicative.
- In M0 predisporre `admin_users` minimo, bootstrap del primo `super_admin`, route protette e RLS iniziale.

---

# 6. UI

- Ogni pagina deve essere responsive.
- Desktop: tabelle e sidebar.
- Mobile: card e menu hamburger.
- Usare shadcn/ui dove possibile.
- Evitare layout complessi.

---

# 7. Qualità codice

- TypeScript strict.
- Componenti riutilizzabili.
- File componenti React in formato `PascalCase.tsx`.
- Nomi chiari.
- Separare logica dati, componenti e utility.
- Non duplicare codice inutilmente.

---

# 8. Processo per ogni milestone

Per ogni milestone:

1. leggere documentazione
2. proporre piano breve
3. modificare solo file necessari
4. generare migration se servono
5. aggiornare documentazione se cambia qualcosa
6. eseguire test/lint quando disponibili
7. riepilogare cosa è stato fatto

---

# 9. Milestone corrente

Codex deve lavorare solo sulla milestone indicata dall'utente.

Se la milestone non è indicata, chiedere quale milestone eseguire.
