# SUPABASE_VALIDATION_REPORT.md

# PonteNext Management Portal - Supabase Validation Report

## Scope

Questo report documenta:

- M0.6 - Supabase Discovery & Live Validation;
- M0.7 - Apply M0 Supabase Migrations;
- M0.8 - Supabase Function Security Hardening.

Project ref vincolante:

```text
uhxfpsamenjhyrfgwckw
```

Vincoli rispettati:

- nessun avvio M1;
- nessuna tabella soci creata;
- nessun CRUD creato;
- nessuna migration successiva applicata;
- nessuna modifica al modello dati applicativo oltre M0;
- policy modificate solo per hardening della funzione admin.

## Progetto Supabase

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

## M0.6 - Stato pre-applicazione

La discovery M0.6 aveva rilevato:

- schema `public` senza tabelle applicative;
- nessuna migration Supabase registrata;
- `public.admin_users` assente;
- nessuna policy RLS nello schema `public`;
- migration locali M0 presenti nel repository ma non applicate al progetto live.

## M0.7 - Migration applicate

Sono state applicate solo le migration M0 richieste:

```text
database/migrations/001_extensions.sql
database/migrations/002_admin_users.sql
```

Migration registrate dal progetto Supabase dopo M0.7:

```text
20260606113953  001_extensions
20260606114014  002_admin_users
```

## M0.8 - Migration di hardening applicata

E' stata applicata la migration dedicata:

```text
database/migrations/003_harden_admin_functions.sql
```

Migration registrate dal progetto Supabase dopo M0.8:

```text
20260606113953  001_extensions
20260606114014  002_admin_users
20260606115133  003_harden_admin_functions
```

Non risultano applicate migration M1 o successive.

## Tabelle public dopo M0.8

Lo schema `public` contiene:

```text
public.admin_users
```

Non risultano create tabelle M1 o successive, ad esempio:

- `members`;
- `roles`;
- `member_roles`;
- `membership_plans`;
- `memberships`;
- `payments`;
- `sponsors`;
- `events`;
- `email_templates`;
- `audit_logs`.

Verifica specifica M1:

```text
m1_table_count: 0
```

## admin_users

Controllo eseguito:

```sql
select to_regclass('public.admin_users') as admin_users_regclass;
```

Risultato:

```text
admin_users_regclass: admin_users
```

Esito:

```text
public.admin_users esiste nel progetto Supabase live PonteNext.
```

## Colonne admin_users

Colonne rilevate:

```text
id            uuid                     not null default gen_random_uuid()
auth_user_id  uuid                     not null
full_name     text                     not null
email         text                     not null
role          text                     not null
status        text                     not null default 'active'
created_at    timestamptz              not null default now()
updated_at    timestamptz              not null default now()
archived_at   timestamptz              null
```

Esito:

```text
le colonne sono coerenti con DATABASE_DESIGN.md per la tabella minima M0.
```

## Vincoli admin_users

Vincoli rilevati:

```text
admin_users_pkey               PRIMARY KEY (id)
admin_users_auth_user_id_key   UNIQUE (auth_user_id)
admin_users_email_key          UNIQUE (email)
admin_users_auth_user_id_fkey  FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE
admin_users_role_check         CHECK role in ('super_admin', 'admin')
admin_users_status_check       CHECK status in ('active', 'inactive')
```

Esito:

```text
vincoli coerenti con il perimetro M0.
```

## Estensione, schema privato e funzioni

Estensione rilevata:

```text
pgcrypto 1.3
```

Schema privato rilevato:

```text
app_private
```

Funzioni rilevate dopo M0.8:

```text
public.set_updated_at()
language: plpgsql
security: invoker
search_path: ''

app_private.is_active_admin()
language: sql
security: definer
search_path: ''
```

La funzione precedente `public.is_active_admin()` e' stata rimossa:

```text
public_is_active_admin_count: 0
```

Trigger rilevato:

```text
set_admin_users_updated_at
BEFORE UPDATE ON public.admin_users
EXECUTE FUNCTION set_updated_at()
```

## Privilegi funzioni dopo hardening

```text
app_private.is_active_admin()
anon: execute = false
authenticated: execute = true
postgres: execute = true
service_role: execute = false

public.set_updated_at()
anon: execute = false
authenticated: execute = false
postgres: execute = true
service_role: execute = true
```

`app_private.is_active_admin()` resta eseguibile da `authenticated` perche' e' usata dalla policy RLS SELECT di `admin_users`, ma non si trova piu' nello schema pubblico esposto.

## RLS admin_users

Controllo RLS:

```text
relrowsecurity: true
relforcerowsecurity: false
```

Esito:

```text
RLS e' attiva su public.admin_users.
```

## Policy admin_users

Policy rilevata dopo M0.8:

```text
policyname: admin_users_select_self_or_active_admin
roles: authenticated
cmd: SELECT
qual: (((select auth.uid()) = auth_user_id) or (select app_private.is_active_admin()))
with_check: null
```

Esito:

- la policy SELECT attesa e' presente;
- la policy e' stata aggiornata solo per chiamare l'helper hardened in `app_private`;
- non risultano policy INSERT;
- non risultano policy UPDATE;
- non risultano policy DELETE;
- bootstrap e manutenzione admin restano da eseguire con owner/service role, non tramite UI M0.

## Advisory security Supabase

### Stato dopo M0.7

Il security advisor Supabase segnalava:

1. `function_search_path_mutable` su `public.set_updated_at`;
2. `anon_security_definer_function_executable` su `public.is_active_admin()`;
3. `authenticated_security_definer_function_executable` su `public.is_active_admin()`.

### Stato dopo M0.8

Il security advisor Supabase non segnala warning:

```text
lints: []
```

Esito:

```text
i warning rilevati dopo M0.7 risultano risolti.
```

## Esito M0.8

Esito complessivo:

```text
M0.8 applicata con successo.
Funzioni amministrative hardened.
Security advisor Supabase pulito.
public.admin_users presente e validata.
RLS attiva.
Policy SELECT attesa presente e aggiornata.
Nessuna migration M1 o successiva applicata.
Nessuna tabella M1 o successiva creata.
```

## Passi successivi consigliati

Prima di iniziare M1:

1. Eseguire bootstrap del primo `super_admin` con owner/service role.
2. Verificare login reale da `/login` usando `.env.local` puntata a `PonteNext`.
3. Rieseguire security advisor e validazione RLS dopo il bootstrap.

Questa PR documenta l'applicazione live M0.8 e non introduce M1.
