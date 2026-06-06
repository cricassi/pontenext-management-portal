# SUPABASE_VALIDATION_REPORT.md

# PonteNext Management Portal - Supabase Validation Report

## Scope

Questo report documenta la discovery live M0.6 e l'applicazione controllata M0.7 sul progetto Supabase `PonteNext`.

Project ref vincolante:

```text
uhxfpsamenjhyrfgwckw
```

Vincoli M0.7 rispettati:

- applicate solo le migration M0 `001_extensions.sql` e `002_admin_users.sql`;
- nessuna migration successiva applicata;
- nessuna tabella soci creata;
- nessun avvio M1;
- nessun CRUD creato;
- nessuna modifica al modello dati oltre M0.

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

Migration registrate dal progetto Supabase:

```text
20260606113953  001_extensions
20260606114014  002_admin_users
```

Non risultano applicate migration successive.

## Tabelle public dopo M0.7

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

## Estensione e funzioni

Estensione rilevata:

```text
pgcrypto 1.3
```

Funzioni rilevate:

```text
public.set_updated_at()    SECURITY INVOKER
public.is_active_admin()   SECURITY DEFINER
```

Trigger rilevato:

```text
set_admin_users_updated_at
BEFORE UPDATE ON public.admin_users
EXECUTE FUNCTION set_updated_at()
```

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

Policy rilevata:

```text
policyname: admin_users_select_self_or_active_admin
roles: authenticated
cmd: SELECT
qual: ((auth.uid() = auth_user_id) OR is_active_admin())
with_check: null
```

Conteggio policy per comando:

```text
SELECT: 1
```

Esito:

- la policy SELECT attesa e' presente;
- non risultano policy INSERT;
- non risultano policy UPDATE;
- non risultano policy DELETE;
- bootstrap e manutenzione admin restano da eseguire con owner/service role, non tramite UI M0.

## Advisory security Supabase

Dopo l'applicazione delle migration M0 e' stato eseguito il security advisor Supabase.

Warning rilevati:

1. `function_search_path_mutable` su `public.set_updated_at`
   - dettaglio: la funzione non imposta `search_path`;
   - remediation: [Supabase database linter 0011](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable).

2. `anon_security_definer_function_executable` su `public.is_active_admin()`
   - dettaglio: la funzione `SECURITY DEFINER` risulta eseguibile dal ruolo `anon`;
   - remediation: [Supabase database linter 0028](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable).

3. `authenticated_security_definer_function_executable` su `public.is_active_admin()`
   - dettaglio: la funzione `SECURITY DEFINER` risulta eseguibile dal ruolo `authenticated`;
   - remediation: [Supabase database linter 0029](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

Privilegi funzione verificati:

```text
public.is_active_admin()
anon: execute = true
authenticated: execute = true
public: execute = false

public.set_updated_at()
PUBLIC: EXECUTE
anon: EXECUTE
authenticated: EXECUTE
postgres: EXECUTE
service_role: EXECUTE
```

Nota M0.7:

- non sono state applicate correzioni aggiuntive perche' il perimetro richiesto era applicare solo `001_extensions.sql` e `002_admin_users.sql`;
- i warning devono essere risolti con una migration di hardening dedicata prima della produzione o prima di ampliare le policy RLS su altre tabelle.

## Esito M0.7

Esito complessivo:

```text
M0 Supabase migrations applicate con successo.
public.admin_users presente e validata.
RLS attiva.
Policy SELECT attesa presente.
Nessuna migration successiva applicata.
Nessuna tabella M1 o successiva creata.
```

## Passi successivi consigliati

Prima di iniziare M1:

1. Eseguire bootstrap del primo `super_admin` con owner/service role.
2. Verificare login reale da `/login` usando `.env.local` puntata a `PonteNext`.
3. Pianificare una migration di hardening per i warning security advisor sulle funzioni.

Questa PR documenta l'applicazione live M0.7 e non introduce M1.
