# PonteNext Management Portal

Portale web gestionale responsive per l'amministrazione dell'associazione Ponte Next.

## Obiettivo

Centralizzare la gestione amministrativa dell'associazione attraverso una piattaforma web unica accessibile da browser desktop, tablet e smartphone.

La piattaforma consente progressivamente la gestione di:

- soci e ruoli associativi;
- iscrizioni, rinnovi, quote e pagamenti non contabili;
- sponsor e contributi;
- eventi;
- comunicazioni email;
- reportistica CSV/XLSX.

## Stack

- Next.js App Router
- TypeScript strict
- Tailwind CSS
- shadcn/ui
- Supabase Auth
- Supabase PostgreSQL
- Vercel

## Stato progetto

Fase corrente:

```text
M0 - Setup Infrastruttura
```

M0 include:

- progetto Next.js avviabile;
- login amministratori;
- layout amministrativo protetto;
- configurazione Supabase client/server;
- middleware di protezione route;
- migration minima `admin_users`;
- RLS iniziale per `admin_users`;
- documentazione bootstrap primo `super_admin`.

M0 non include CRUD soci, dashboard completa, sponsor, eventi, email o report.

## Setup locale

### 1. Installazione dipendenze

```bash
npm install
```

### 2. Variabili ambiente

Copiare `.env.example` in `.env.local` e valorizzare:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` non deve essere usata nel browser. Serve solo per script/server operativi futuri.

### 3. Database M0

Applicare le migration M0 su Supabase:

```text
database/migrations/001_extensions.sql
database/migrations/002_admin_users.sql
```

Le altre migration sono ancora placeholder per milestone successive.

### 4. Bootstrap primo super_admin

Creare prima l'utente in Supabase Auth, poi inserire il profilo applicativo con privilegi owner/service role:

```sql
insert into public.admin_users (
  auth_user_id,
  full_name,
  email,
  role,
  status
)
select
  id,
  'Nome Cognome',
  email,
  'super_admin',
  'active'
from auth.users
where email = 'admin@example.com'
on conflict (auth_user_id) do update
set
  full_name = excluded.full_name,
  email = excluded.email,
  role = excluded.role,
  status = excluded.status,
  archived_at = null;
```

Questa operazione non passa dalla UI M0. Va eseguita solo in fase di bootstrap iniziale da Supabase SQL editor, CLI o script controllato con service role.

### 5. Avvio

```bash
npm run dev
```

Aprire:

```text
http://localhost:3000/login
```

## Script

```bash
npm run dev
npm run build
npm run lint
npm run start
```

## Struttura

```text
docs/
database/
  migrations/
  seeds/
src/
  app/
  components/
  hooks/
  lib/
  services/
  types/
  utils/
scripts/
```

## Documentazione

La documentazione progettuale e' in `docs/`.

Documenti principali:

- `docs/PRD.md`
- `docs/MASTER_DEVELOPMENT_PLAN.md`
- `docs/ADR-001_ARCHITECTURE.md`
- `docs/DATABASE_DESIGN.md`
- `docs/SCREEN_FLOW.md`
- `docs/UI_GUIDELINES.md`
- `docs/NAMING_CONVENTIONS.md`
- `docs/CODEX_INSTRUCTIONS.md`
- `docs/M0_CHECKLIST.md`

## Fuori scope

Non implementare:

- contabilita';
- fatturazione;
- IVA;
- bilanci;
- prima nota;
- area riservata soci;
- app mobile nativa;
- pagamenti online.
