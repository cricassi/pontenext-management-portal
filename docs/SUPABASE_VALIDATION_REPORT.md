# SUPABASE_VALIDATION_REPORT.md

# PonteNext Management Portal - Supabase Validation Report

## Scope

Questo report documenta:

- M0.6 - Supabase Discovery & Live Validation;
- M0.7 - Apply M0 Supabase Migrations;
- M0.8 - Supabase Function Security Hardening.
- M0.9 - Bootstrap primo super_admin e login reale.
- M1 - Members & Roles.
- M2 - Memberships & Payments.

Project ref vincolante:

```text
uhxfpsamenjhyrfgwckw
```

Vincoli rispettati nello storico M0.x:

- nessuna tabella soci creata prima di M1;
- nessun CRUD creato prima di M1;
- nessuna migration successiva applicata prima della milestone esplicita;
- nessuna modifica al modello dati applicativo oltre M0 durante M0.x;
- policy modificate solo per hardening della funzione admin in M0.8;
- modifiche dati limitate a utenti Auth/admin di validazione M0.9.

Vincoli rispettati in M1:

- applicata solo la migration `004_members_roles`;
- create solo `members`, `roles`, `member_roles`;
- applicato solo seed ruoli base;
- nessuna tabella iscrizioni, quote, pagamenti, sponsor, eventi, email o report;
- nessuna migration M2 o successiva applicata.

Vincoli rispettati in M2:

- applicate solo le migration M2 `005_membership_plans` e `006_memberships_payments`;
- create solo `membership_plans`, `memberships`, `payments`;
- applicato solo seed piani iscrizione base;
- nessuna tabella sponsor, eventi, email, report o audit creata;
- nessuna migration successiva a M2 applicata;
- ogni rinnovo resta rappresentato da una nuova riga in `memberships`.

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

## M1 - Migration applicata

E' stata applicata solo la migration M1 richiesta:

```text
database/migrations/004_members_roles.sql
```

Migration registrate dal progetto Supabase dopo M1:

```text
20260606113953  001_extensions
20260606114014  002_admin_users
20260606115133  003_harden_admin_functions
20260606124849  004_members_roles
```

Non risultano applicate migration M2 o successive.

## Tabelle public dopo M1

Lo schema `public` contiene:

```text
public.admin_users
public.member_roles
public.members
public.roles
```

Non risultano create tabelle M2 o successive, ad esempio:

- `membership_plans`;
- `memberships`;
- `payments`;
- `sponsors`;
- `events`;
- `email_templates`;
- `audit_logs`.

Verifica specifica M1:

```text
out_of_scope_table_count: 0
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

## M0.9 - Bootstrap e login reale

M0.9 ha validato end-to-end Supabase Auth + autorizzazione applicativa `admin_users` sul progetto live `PonteNext`.

### Dati di validazione

Sono stati creati account dedicati M0.9 nel perimetro Auth/admin:

```text
validation_auth_users: 2
validation_admin_users: 1
active_validation_super_admin: 1
```

Uso:

- un utente solo Supabase Auth, non presente in `admin_users`;
- un utente Supabase Auth collegato a `public.admin_users` come `super_admin`.

Le credenziali di validazione non sono documentate nel repository. Prima dell'uso operativo, sostituire o ruotare l'utente di validazione con il primo `super_admin` reale dell'associazione.

### Procedura bootstrap documentata

La procedura operativa e la query bootstrap sono documentate in `docs/SUPABASE_SETUP.md`.

In sintesi:

1. creare un utente in Supabase Auth;
2. eseguire insert/upsert su `public.admin_users`;
3. assegnare `role = 'super_admin'`;
4. impostare `status = 'active'`;
5. mantenere `archived_at = null`.

### Validazione login/admin guard

La validazione e' stata eseguita con login password reale su Supabase Auth e query PostgREST equivalente al guard applicativo:

```text
auth_user_id = current auth user
status = active
archived_at is null
```

Esiti:

```text
AUTH_ONLY_SIGNIN=ok
AUTH_ONLY_GUARD_COUNT=0

SUPER_ACTIVE_SIGNIN=ok
SUPER_ACTIVE_GUARD_COUNT=1

SUPER_INACTIVE_SIGNIN=ok
SUPER_INACTIVE_GUARD_COUNT=0

SUPER_ARCHIVED_SIGNIN=ok
SUPER_ARCHIVED_GUARD_COUNT=0

SUPER_RESTORED_ACTIVE_SIGNIN=ok
SUPER_RESTORED_ACTIVE_GUARD_COUNT=1
```

Interpretazione:

- Supabase Auth puo' autenticare utenti validi anche se non autorizzati dal portale;
- il portale consente accesso amministrativo solo con record `admin_users` attivo e non archiviato;
- `status = 'inactive'` blocca il guard amministrativo;
- `archived_at` valorizzato blocca il guard amministrativo;
- lo stato finale del validation `super_admin` e' stato ripristinato ad `active` con `archived_at = null`.

### Correzione minima login

Il form login e' stato aggiornato per verificare subito il record `admin_users` attivo dopo `signInWithPassword`.

Se l'utente Auth non e' amministratore attivo:

- viene eseguito `signOut`;
- viene mostrato errore;
- non viene effettuato redirect verso l'area admin.

Il middleware e il layout admin restano una seconda linea di protezione server-side.

### Advisory security dopo M0.9

Il Security Advisor Supabase non segnala piu' warning sulle funzioni M0.8.

Dopo la creazione degli utenti Auth di validazione risulta un warning di configurazione Auth:

```text
auth_leaked_password_protection
```

Dettaglio:

```text
Leaked Password Protection Disabled
```

Remediation:

[Supabase password security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

Nota:

- il warning riguarda una configurazione Auth del progetto, non una funzione SQL o una policy RLS;
- non e' stata applicata modifica di configurazione Auth in M0.9;
- abilitarla e' consigliato prima dell'uso operativo del portale.

## Passi consigliati dopo M0.9

Prima di iniziare M1:

1. Sostituire o ruotare l'utente `super_admin` di validazione con il primo operatore reale.
2. Verificare login reale da `/login` con l'utente operativo.
3. Rieseguire security advisor e validazione RLS dopo il bootstrap definitivo.
4. Abilitare Leaked Password Protection in Supabase Auth prima dell'uso operativo.

Questa sezione resta come storico operativo M0.9.

## M1 - Members & Roles live validation

M1 ha introdotto solo le tabelle:

```text
members
roles
member_roles
```

### Colonne M1

Le colonne rilevate sono coerenti con `DATABASE_DESIGN.md` e `M1_IMPLEMENTATION_PLAN.md`.

`members` contiene:

```text
id uuid
first_name text
last_name text
email text null
phone text null
address text null
city text null
postal_code text null
province text null
country text default 'Italia'
birth_date date null
fiscal_code text null
profession text null
notes text null
status text default 'active'
created_at timestamptz
updated_at timestamptz
archived_at timestamptz null
```

`roles` contiene:

```text
id uuid
name text unique
description text null
is_default boolean default false
sort_order integer default 0
created_at timestamptz
updated_at timestamptz
archived_at timestamptz null
```

`member_roles` contiene:

```text
id uuid
member_id uuid references members(id)
role_id uuid references roles(id)
start_date date
end_date date null
notes text null
created_at timestamptz
updated_at timestamptz
archived_at timestamptz null
```

### RLS M1

RLS risulta attiva su:

```text
public.members
public.roles
public.member_roles
```

Policy presenti:

- `members_select_active_admin`
- `members_insert_active_admin`
- `members_update_active_admin`
- `roles_select_active_admin`
- `roles_insert_active_admin`
- `roles_update_active_admin`
- `member_roles_select_active_admin`
- `member_roles_insert_active_admin`
- `member_roles_update_active_admin`

Non risultano policy DELETE sulle tabelle M1:

```text
delete_policy_count: 0
```

Le policy usano l'helper hardened:

```text
app_private.is_active_admin()
```

### Trigger M1

Trigger `updated_at` rilevati:

```text
set_members_updated_at
set_roles_updated_at
set_member_roles_updated_at
```

Tutti usano `public.set_updated_at()`, gia' hardened in M0.8.

### Seed ruoli base

Ruoli base presenti e non archiviati:

```text
Presidente
Vicepresidente
Segretario
Tesoriere
Consigliere
Socio Ordinario
Socio Sostenitore
```

### Validazione dati M1

E' stato eseguito un test transazionale con rollback:

```text
inserted_member_count: 1
inserted_assignment_count: 1
rollback eseguito
validation_member_count finale: 0
```

Esito:

- creazione socio valida;
- assegnazione ruolo valida;
- nessun dato socio di test lasciato nel database live.

### Validazione RLS M1

Controlli eseguiti:

```text
anon_blocked
active_admin_can_read_roles
```

Esito:

- ruolo `anon` bloccato sulle tabelle M1;
- ruolo `authenticated` con `auth_user_id` collegato ad admin attivo puo' leggere i ruoli seed.

### Advisory dopo M1

Security Advisor:

```text
auth_leaked_password_protection
```

Il warning e' lo stesso residuo operativo gia' documentato in M0.9 e riguarda la configurazione Auth, non SQL/RLS M1.

Performance Advisor:

```text
unused_index
```

Gli advisory `unused_index` sono INFO attesi su indici appena creati in M1 prima di traffico applicativo reale. Non indicano tabelle fuori scope o RLS mancanti.

## M2 - Memberships & Payments live validation

M2 ha introdotto solo le tabelle:

```text
membership_plans
memberships
payments
```

Project ref validato:

```text
uhxfpsamenjhyrfgwckw
```

### Migration M2 applicate

Sono state applicate solo le migration M2 richieste:

```text
database/migrations/005_membership_plans.sql
database/migrations/006_memberships_payments.sql
```

Migration registrate dal progetto Supabase dopo M2:

```text
20260606113953  001_extensions
20260606114014  002_admin_users
20260606115133  003_harden_admin_functions
20260606124849  004_members_roles
20260606221810  005_membership_plans
20260606221954  006_memberships_payments
```

Non risultano applicate migration successive a M2.

### Tabelle public dopo M2

Lo schema `public` contiene le tabelle M0/M1 e le sole tabelle M2:

```text
public.admin_users
public.members
public.roles
public.member_roles
public.membership_plans
public.memberships
public.payments
```

Non risultano create tabelle fuori scope M2:

```text
sponsors
events
sponsor_contributions
email_templates
email_campaigns
audit_logs
```

### Colonne M2

`membership_plans` contiene:

```text
id uuid
name text unique
description text null
minimum_fee numeric(10,2)
default_duration_months integer
is_active boolean default true
sort_order integer default 0
created_at timestamptz
updated_at timestamptz
archived_at timestamptz null
```

`memberships` contiene:

```text
id uuid
member_id uuid references members(id)
membership_plan_id uuid null references membership_plans(id)
start_date date
end_date date
minimum_fee numeric(10,2)
expected_fee numeric(10,2)
paid_amount numeric(10,2) default 0
payment_status text default 'unpaid'
status text default 'active'
notes text null
created_at timestamptz
updated_at timestamptz
archived_at timestamptz null
```

`payments` contiene:

```text
id uuid
membership_id uuid references memberships(id)
payment_date date
amount numeric(10,2)
method text
reference text null
notes text null
created_by uuid null references admin_users(id)
created_at timestamptz
updated_at timestamptz
archived_at timestamptz null
```

### RLS M2

RLS risulta attiva su:

```text
public.membership_plans
public.memberships
public.payments
```

Policy presenti:

- `membership_plans_select_active_admin`
- `membership_plans_insert_active_admin`
- `membership_plans_update_active_admin`
- `memberships_select_active_admin`
- `memberships_insert_active_admin`
- `memberships_update_active_admin`
- `payments_select_active_admin`
- `payments_insert_active_admin`
- `payments_update_active_admin`

Non sono state create policy DELETE sulle tabelle M2.

Le policy usano l'helper hardened:

```text
app_private.is_active_admin()
```

### Trigger e funzioni M2

Trigger rilevati:

```text
set_membership_plans_updated_at
set_memberships_updated_at
set_payments_updated_at
set_membership_payment_status
refresh_membership_payment_totals
```

Funzioni M2:

```text
public.set_membership_payment_status()
public.refresh_membership_payment_totals()
```

Entrambe sono state create con `search_path` esplicito vuoto e privilegi di esecuzione revocati a `public`, `anon` e `authenticated` per uso solo tramite trigger.

### Seed piani iscrizione base

Seed M2 applicato:

```text
Ordinaria     minimum_fee 30.00  durata 12 mesi
Agevolata     minimum_fee 15.00  durata 6 mesi
Sostenitore   minimum_fee 30.00  durata 12 mesi
```

Conteggi dopo seed e rollback test:

```text
membership_plans: 3
memberships: 0
payments: 0
members: 0
```

### Validazione trigger pagamenti

E' stato eseguito un test transazionale con rollback su dati temporanei:

```text
creazione membership con expected_fee 30.00 -> paid_amount 0.00, payment_status unpaid
pagamento 10.00 -> paid_amount 10.00, payment_status partial
secondo pagamento 20.00 -> paid_amount 30.00, payment_status paid
aggiornamento secondo pagamento a 25.00 -> paid_amount 35.00, payment_status overpaid
archiviazione secondo pagamento -> paid_amount 10.00, payment_status partial
membership con expected_fee 0.00 e paid_amount 0.00 -> payment_status paid
rollback eseguito
```

Esito:

- il ricalcolo di `paid_amount` e `payment_status` funziona su insert/update/archive pagamento;
- nessun dato socio, iscrizione o pagamento di test resta persistito nel database live.

### Regola rinnovi storici

La migration non introduce alcun meccanismo di estensione o riuso di una membership esistente.

Nel service layer applicativo, `renewMembership` delega alla creazione di una nuova riga `memberships`, in coerenza con la decisione approvata:

```text
ogni rinnovo crea una nuova riga in memberships.
```

### Advisory dopo M2

Security Advisor:

```text
auth_leaked_password_protection
```

Il warning e' lo stesso residuo operativo gia' documentato da M0.9 e riguarda la configurazione Auth del progetto, non SQL/RLS M2.

Performance Advisor:

```text
unused_index
```

Gli advisory `unused_index` includono anche gli indici M2 appena creati e non ancora usati da traffico reale. Sono INFO attesi in questa fase e non richiedono modifica del modello dati M2.

## M3 - Expirations & Renewals

Data verifica: 2026-06-07

Progetto verificato:

```text
name: PonteNext
project ref: uhxfpsamenjhyrfgwckw
region: eu-central-1
status: ACTIVE_HEALTHY
postgres: 17
```

### Stato migration M3

M3 non introduce migration operative.

Migration live confermate:

```text
001_extensions
002_admin_users
003_harden_admin_functions
004_members_roles
005_membership_plans
006_memberships_payments
```

Non sono state applicate migration successive a M2.

### Tabelle e viste

Tabelle `public` presenti:

```text
admin_users
member_roles
members
membership_plans
memberships
payments
roles
```

Non risultano create tabelle M3.

Non risultano create viste SQL o materialized view M3. Le viste necessarie alla milestone sono implementate come query server-side in `src/services/expirations.service.ts`, usando:

- `memberships.end_date` come sorgente canonica delle scadenze;
- ultima membership non archiviata e non annullata per socio;
- esclusione dei soci archiviati;
- join con `membership_plans` e `members` solo per dati di visualizzazione.

### RLS e policy

RLS resta attiva sulle tabelle operative M0-M2.

M3 non modifica policy, helper RLS o funzioni database.

Le query M3 usano il Supabase server client e rispettano le policy esistenti basate su:

```text
app_private.is_active_admin()
```

### Validazione funzionale M3

Con il database live attuale:

```text
members: 0
memberships: 0
payments: 0
membership_plans: 3
```

La validazione live conferma che:

- la route M3 non richiede nuove tabelle;
- i filtri scadenza possono essere eseguiti sulle tabelle M2 esistenti;
- il rinnovo rapido usa la membership sorgente solo per precompilare il form;
- il salvataggio rinnovo resta delegato al flusso M2 di creazione nuova riga `memberships`;
- nessuna membership esistente viene modificata per rappresentare un rinnovo.

La validazione con dataset reale pieno resta da ripetere quando saranno presenti soci e membership operative.
