# SUPABASE_VALIDATION_REPORT.md

# PonteNext Management Portal - Supabase Validation Report

## Scope M0.6

Milestone: M0.6 - Supabase Discovery & Live Validation

Obiettivo: verificare in sola lettura lo stato reale del progetto Supabase `PonteNext` collegato tramite MCP prima di iniziare M1.

Vincoli rispettati:

- nessuna migration applicata;
- nessuna tabella creata;
- nessuna modifica al database;
- nessun avvio M1;
- nessun CRUD soci;
- nessuna nuova funzionalita' applicativa.

## Progetto Supabase verificato

Il progetto Supabase `PonteNext` esiste nella organization collegata tramite MCP.

Dettagli rilevati:

```text
name: PonteNext
project_ref: uhxfpsamenjhyrfgwckw
project_id: uhxfpsamenjhyrfgwckw
organization_id: dyzazrfudcgrsjfezeli
organization_slug: dyzazrfudcgrsjfezeli
region: eu-central-1
status: ACTIVE_HEALTHY
database_host: db.uhxfpsamenjhyrfgwckw.supabase.co
postgres_engine: 17
database_version: 17.6.1.127
created_at: 2026-06-06T01:30:38.807485Z
```

## Controlli eseguiti

Sono stati eseguiti solo controlli read-only:

- lista progetti MCP Supabase;
- dettaglio progetto `PonteNext`;
- lista migration Supabase;
- SELECT su `information_schema.tables`;
- SELECT su `pg_class` per RLS;
- SELECT su `pg_policies` per policy;
- controllo `to_regclass('public.admin_users')`;
- SELECT su `supabase_migrations.schema_migrations`.

Non e' stato usato `apply_migration`.

## Tabelle esistenti

### Schema public

Risultato:

```text
nessuna tabella public presente
```

### Schemi gestiti da Supabase

Sono presenti tabelle di servizio negli schemi `auth` e `storage`.

Esempi rilevati in `auth`:

```text
auth.users
auth.sessions
auth.identities
auth.refresh_tokens
auth.schema_migrations
```

Esempi rilevati in `storage`:

```text
storage.buckets
storage.objects
storage.migrations
```

Queste tabelle sono parte dell'infrastruttura Supabase e non costituiscono schema applicativo PonteNext.

## Migration applicate

La lista migration Supabase restituita dal MCP e' vuota:

```text
migrations: []
```

Inoltre la query su:

```sql
select version
from supabase_migrations.schema_migrations
order by version;
```

ha restituito errore per relazione inesistente:

```text
relation "supabase_migrations.schema_migrations" does not exist
```

Interpretazione:

- non risultano migration applicate tramite il sistema migration Supabase;
- lo schema `public` non contiene ancora oggetti applicativi;
- il progetto live non ha ricevuto le migration M0 presenti nel repository.

## Migration locali non applicate

Nel repository sono presenti questi file:

```text
database/migrations/001_extensions.sql
database/migrations/002_admin_users.sql
database/migrations/003_members_roles.sql
database/migrations/004_membership_plans.sql
database/migrations/005_memberships_payments.sql
database/migrations/006_sponsors.sql
database/migrations/007_events.sql
database/migrations/008_sponsor_contributions.sql
database/migrations/009_email.sql
database/migrations/010_audit_logs.sql
database/migrations/011_views.sql
database/migrations/012_rls_policies.sql
database/migrations/013_seed.sql
```

Stato:

- `001_extensions.sql`: migration M0 operativa locale, non applicata al progetto live;
- `002_admin_users.sql`: migration M0 operativa locale, non applicata al progetto live;
- `003_members_roles.sql` - `013_seed.sql`: placeholder locali, non applicati e da non applicare in M0.6.

## admin_users

Controllo eseguito:

```sql
select to_regclass('public.admin_users') as admin_users_regclass;
```

Risultato:

```text
admin_users_regclass: null
```

Esito:

```text
public.admin_users non esiste nel progetto Supabase live PonteNext.
```

## RLS su admin_users

Poiche' `public.admin_users` non esiste, non e' possibile verificare RLS sulla tabella.

Controllo sulle tabelle `public`:

```sql
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity,
  c.relforcerowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
order by c.relname;
```

Risultato:

```text
[]
```

Esito:

```text
nessuna tabella public su cui RLS risulti verificabile.
```

## Policy esistenti

Controllo eseguito:

```sql
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

Risultato:

```text
[]
```

Esito:

```text
nessuna policy RLS presente nello schema public.
```

## Confronto con atteso M0/M0.5

Atteso da documentazione M0/M0.5:

- `001_extensions.sql` applicata;
- `002_admin_users.sql` applicata;
- tabella `public.admin_users` presente;
- RLS abilitata su `public.admin_users`;
- policy SELECT `admin_users_select_self_or_active_admin`;
- nessuna policy insert/update/delete in M0;
- bootstrap primo `super_admin` eseguito con owner/service role.

Stato reale live:

- `001_extensions.sql` non risulta applicata;
- `002_admin_users.sql` non risulta applicata;
- `public.admin_users` assente;
- RLS applicativa non verificabile;
- policy applicative assenti;
- bootstrap `super_admin` non verificabile per assenza della tabella.

## Impatto

Il progetto Next.js e' configurato per usare Supabase, ma il progetto Supabase live `PonteNext` non contiene ancora lo schema applicativo minimo M0.

Con lo stato attuale:

- `/login` puo' usare Supabase Auth se `.env.local` punta al progetto `PonteNext`;
- le route protette non possono autorizzare admin attivi perche' `public.admin_users` non esiste;
- il bootstrap del primo `super_admin` non puo' essere eseguito finche' `002_admin_users.sql` non viene applicata;
- M1 non deve iniziare prima di applicare e verificare M0 sul database live.

## Raccomandazione

Prima di iniziare M1, applicare in modo controllato le migration M0 sul progetto Supabase `PonteNext`:

```text
database/migrations/001_extensions.sql
database/migrations/002_admin_users.sql
```

Dopo l'applicazione, ripetere i controlli M0.6 per confermare:

- presenza di `public.admin_users`;
- RLS abilitata;
- policy SELECT attesa;
- assenza intenzionale di policy insert/update/delete;
- bootstrap del primo `super_admin`.

Questa PR non applica migration e non modifica il database.
