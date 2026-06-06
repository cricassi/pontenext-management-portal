# SUPABASE_SETUP.md

# PonteNext Management Portal - Supabase Setup

## Scope M0.5

M0.5 verifica la fondazione Supabase prima di iniziare M1.

Questa milestone riguarda solo:

- configurazione `.env.local`;
- Supabase Auth per amministratori;
- migration M0 `admin_users`;
- RLS iniziale su `admin_users`;
- bootstrap del primo `super_admin`;
- coerenza tra login, middleware e layout admin protetto.

M0.5 non introduce CRUD soci, dashboard completa, sponsor, eventi, email o report.

## Variabili ambiente

Creare `.env.local` partendo da `.env.example` e valorizzare:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

Uso previsto:

- `NEXT_PUBLIC_SUPABASE_URL`: URL del progetto Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: chiave pubblica anon, usata da browser, middleware e server client sotto RLS.
- `SUPABASE_SERVICE_ROLE_KEY`: chiave privilegiata solo server/bootstrap. Non deve mai essere esposta nel browser.

Per M0.5 il runtime applicativo usa URL e anon key. La service role key e' necessaria solo se il bootstrap viene eseguito tramite script server controllato; se si usa Supabase SQL editor, non serve al runtime locale.

## Migration M0 da applicare

Applicare in ordine:

```text
database/migrations/001_extensions.sql
database/migrations/002_admin_users.sql
```

Le migration successive restano fuori da M0.5 e non devono essere applicate per iniziare M1.

## Verifica schema admin_users

La tabella `public.admin_users` deve contenere:

```text
id uuid primary key default gen_random_uuid()
auth_user_id uuid unique not null references auth.users(id) on delete cascade
full_name text not null
email text unique not null
role text not null check in ('super_admin', 'admin')
status text not null default 'active' check in ('active', 'inactive')
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
archived_at timestamptz null
```

La tabella e' coerente con `DATABASE_DESIGN.md` per la versione minima richiesta in M0.

## Verifica RLS

`public.admin_users` deve avere RLS abilitata:

```sql
select
  relname,
  relrowsecurity
from pg_class
where oid = 'public.admin_users'::regclass;
```

Risultato atteso:

```text
relrowsecurity = true
```

Policy attesa:

```sql
select
  policyname,
  cmd,
  roles,
  qual
from pg_policies
where schemaname = 'public'
  and tablename = 'admin_users';
```

Risultato atteso:

- policy `admin_users_select_self_or_active_admin`;
- `cmd = SELECT`;
- ruolo `authenticated`;
- lettura consentita al proprio record oppure a utenti presenti in `admin_users` con `status = 'active'` e `archived_at is null`.

Scritture M0.5:

- nessuna policy di insert;
- nessuna policy di update;
- nessuna policy di delete;
- bootstrap e manutenzione iniziale passano da owner/service role, non dalla UI.

## Bootstrap primo super_admin

1. Creare l'utente in Supabase Auth.
2. Applicare `001_extensions.sql`.
3. Applicare `002_admin_users.sql`.
4. Eseguire il bootstrap con privilegi owner/service role.

Procedura operativa consigliata:

1. Aprire il progetto Supabase `PonteNext`.
2. Andare in `Authentication` -> `Users`.
3. Creare il primo utente amministratore con email reale dell'operatore.
4. Confermare l'email o marcare l'utente come confermato secondo procedura interna.
5. Impostare una password temporanea sicura e farla ruotare al primo accesso operativo.
6. Eseguire la query bootstrap sotto con privilegi owner/service role.
7. Verificare login da `/login`.

SQL bootstrap:

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

Sostituire `admin@example.com` con l'email reale creata in Supabase Auth.

Questa operazione non deve essere esposta in una route pubblica. In M0.5 non esiste UI per creare amministratori.

In M0.9 la validazione live e' stata eseguita con account di test dedicati. Le credenziali di validazione non sono documentate nel repository; per l'uso operativo creare o sostituire il primo `super_admin` con una email reale dell'associazione.

## Verifica login e route protette

Avviare il progetto:

```bash
npm run dev
```

Verifiche manuali:

1. Aprire `/login`.
2. Accedere con un utente Supabase Auth non presente in `admin_users`.
3. Verificare che `/dashboard` non sia accessibile.
4. Accedere con l'utente bootstrap `super_admin` attivo.
5. Verificare che `/dashboard` sia accessibile.
6. Impostare temporaneamente `status = 'inactive'` o `archived_at` valorizzato sul record admin di test.
7. Verificare che l'accesso a `/dashboard` venga negato.

Coerenza codice M0.9:

- `LoginForm` usa `supabase.auth.signInWithPassword`.
- `LoginForm` verifica subito che l'utente autenticato abbia un record `admin_users` con `status = 'active'` e `archived_at is null`.
- Se il record admin attivo manca, `LoginForm` esegue sign out e mostra errore.
- `middleware.ts` protegge le route non pubbliche.
- `updateSession` richiede sessione Supabase Auth e record `admin_users` attivo.
- `requireActiveAdmin` ripete il controllo server-side nel layout admin.
- `/login` resta pubblica.
- `/dashboard` e le route gestionali future passano dal controllo admin attivo.

Esiti live M0.9:

- utente Auth non presente in `admin_users`: autenticazione Auth riuscita, admin guard negato;
- `super_admin` attivo: autenticazione Auth riuscita, admin guard consentito;
- `super_admin` con `status = 'inactive'`: autenticazione Auth riuscita, admin guard negato;
- `super_admin` con `archived_at` valorizzato: autenticazione Auth riuscita, admin guard negato.

## Nota sulla verifica live

La verifica live richiede una `.env.local` reale con credenziali di un progetto Supabase di sviluppo. Se `.env.local` non e' presente, e' possibile verificare solo:

- coerenza statica di migration, RLS e auth flow;
- build Next.js;
- lint;
- comportamento di fallback per ambiente Supabase mancante.

Non committare mai `.env.local`.
