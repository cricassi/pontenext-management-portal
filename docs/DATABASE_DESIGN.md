# DATABASE_DESIGN.md

# PonteNext Management Portal – Database Design

Versione: 1.0  
Database: PostgreSQL  
Provider: Supabase  
Approccio: relational-first, soft delete, audit-ready

---

# 1. Obiettivo

Definire il modello dati per:

- amministratori
- soci
- ruoli
- iscrizioni
- quote flessibili
- pagamenti non contabili
- sponsor
- contributi sponsor
- eventi
- comunicazioni email
- audit log

Il sistema non gestisce contabilità, fatturazione, IVA, prima nota o bilanci.

---

# 2. Principi generali

## Chiavi primarie

Usare UUID:

```sql
id uuid primary key default gen_random_uuid()
```

## Campi standard

Tabelle principali:

```sql
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
archived_at timestamptz null
```

## Soft delete

Non usare cancellazione fisica sui dati principali.

Record attivo:

```sql
archived_at is null
```

## Importi

Usare:

```sql
numeric(10,2)
```

Mai usare `float`.

## Stati

Usare campi `text` con vincoli `check`, non enum PostgreSQL nella prima versione.

---

# 3. Tabelle previste

- admin_users
- members
- roles
- member_roles
- membership_plans
- memberships
- payments
- sponsors
- events
- sponsor_contributions
- event_sponsors
- email_templates
- email_campaigns
- email_campaign_recipients
- audit_logs

---

# 4. Tabelle principali

## admin_users

Amministratori applicativi collegati a Supabase Auth.

Tabella minima necessaria gia' in M0 per autorizzazione applicativa, bootstrap del primo `super_admin`, route protette e RLS iniziale.

Campi:

- id uuid PK
- auth_user_id uuid unique not null
- full_name text not null
- email text unique not null
- role text not null check in `super_admin`, `admin`
- status text not null check in `active`, `inactive`
- created_at timestamptz
- updated_at timestamptz
- archived_at timestamptz

## members

Anagrafica soci.

Campi:

- id uuid PK
- first_name text not null
- last_name text not null
- email text null
- phone text null
- address text null
- city text null
- postal_code text null
- province text null
- country text default `Italia`
- birth_date date null
- fiscal_code text null
- profession text null
- notes text null
- status text not null check in `active`, `inactive`, `archived`
- created_at timestamptz
- updated_at timestamptz
- archived_at timestamptz

Regola: non salvare quota, durata o scadenza qui.

Regola: `members.status` indica solo lo stato anagrafico del socio (`active`, `inactive`, `archived`). Lo stato associativo, ad esempio socio con iscrizione attiva, scaduta o assente, e' sempre derivato dalle righe in `memberships`.

## roles

Ruoli associativi configurabili.

Campi:

- id uuid PK
- name text unique not null
- description text null
- is_default boolean default false
- sort_order integer default 0
- created_at timestamptz
- updated_at timestamptz
- archived_at timestamptz

## member_roles

Relazione storicizzata soci/ruoli.

Campi:

- id uuid PK
- member_id uuid FK members
- role_id uuid FK roles
- start_date date not null
- end_date date null
- notes text null
- created_at timestamptz
- updated_at timestamptz
- archived_at timestamptz

## membership_plans

Tipologie base di iscrizione.

Campi:

- id uuid PK
- name text unique not null
- description text null
- minimum_fee numeric(10,2) not null check >= 0
- default_duration_months integer not null check > 0
- is_active boolean default true
- sort_order integer default 0
- created_at timestamptz
- updated_at timestamptz
- archived_at timestamptz

## memberships

Singola iscrizione o rinnovo.

Campi:

- id uuid PK
- member_id uuid FK members
- membership_plan_id uuid FK membership_plans null
- start_date date not null
- end_date date not null
- minimum_fee numeric(10,2) not null check >= 0
- expected_fee numeric(10,2) not null check >= 0
- paid_amount numeric(10,2) not null default 0 check >= 0
- payment_status text not null check in `unpaid`, `partial`, `paid`, `overpaid`
- status text not null check in `active`, `expired`, `cancelled`
- notes text null
- created_at timestamptz
- updated_at timestamptz
- archived_at timestamptz

Regole:

- `end_date >= start_date`
- la quota effettiva può differire dalla quota minima
- la durata può essere personalizzata
- lo stato pagamento dipende dai pagamenti collegati

## payments

Versamenti collegati a una iscrizione. Non è contabilità.

Campi:

- id uuid PK
- membership_id uuid FK memberships
- payment_date date not null
- amount numeric(10,2) not null check > 0
- method text not null check in `cash`, `bank_transfer`, `pos`, `other`
- reference text null
- notes text null
- created_by uuid FK admin_users null
- created_at timestamptz
- updated_at timestamptz
- archived_at timestamptz

## sponsors

Anagrafica sponsor.

Campi:

- id uuid PK
- company_name text not null
- contact_name text null
- email text null
- phone text null
- website text null
- address text null
- city text null
- vat_number text null
- fiscal_code text null
- notes text null
- status text not null check in `active`, `inactive`, `archived`
- created_at timestamptz
- updated_at timestamptz
- archived_at timestamptz

## events

Eventi associativi.

Campi:

- id uuid PK
- name text not null
- description text null
- start_datetime timestamptz null
- end_datetime timestamptz null
- location text null
- status text not null check in `planned`, `confirmed`, `completed`, `cancelled`
- notes text null
- created_at timestamptz
- updated_at timestamptz
- archived_at timestamptz

Regole:

- `start_datetime` e `end_datetime` sono i campi canonici per data e orario evento.
- eventuali viste o UI devono derivare la data evento da `start_datetime`.
- se `end_datetime` e' valorizzato, deve essere successivo o uguale a `start_datetime`.

## sponsor_contributions

Contributi sponsor.

Campi:

- id uuid PK
- sponsor_id uuid FK sponsors
- event_id uuid FK events null
- contribution_date date not null
- amount numeric(10,2) not null check >= 0
- contribution_type text not null check in `money`, `goods`, `service`, `other`
- notes text null
- created_at timestamptz
- updated_at timestamptz
- archived_at timestamptz

## event_sponsors

Relazione molti-a-molti sponsor/eventi.

Campi:

- id uuid PK
- event_id uuid FK events
- sponsor_id uuid FK sponsors
- sponsorship_level text null
- notes text null
- created_at timestamptz
- updated_at timestamptz
- archived_at timestamptz

Vincolo:

```sql
unique(event_id, sponsor_id)
```

## email_templates

Template email.

Campi:

- id uuid PK
- name text not null
- subject text not null
- body text not null
- audience text not null check in `members`, `sponsors`, `both`
- is_active boolean default true
- created_at timestamptz
- updated_at timestamptz
- archived_at timestamptz

## email_campaigns

Campagne email.

Campi:

- id uuid PK
- template_id uuid FK email_templates null
- subject text not null
- body text not null
- audience_type text not null check in `all_members`, `active_members`, `expired_members`, `sponsors`, `custom`
- status text not null check in `draft`, `scheduled`, `sent`, `failed`
- scheduled_at timestamptz null
- sent_at timestamptz null
- created_by uuid FK admin_users null
- created_at timestamptz
- updated_at timestamptz
- archived_at timestamptz

## email_campaign_recipients

Destinatari campagna.

Campi:

- id uuid PK
- campaign_id uuid FK email_campaigns
- member_id uuid FK members null
- sponsor_id uuid FK sponsors null
- email text not null
- recipient_name text null
- status text not null check in `pending`, `sent`, `failed`, `skipped`
- error_message text null
- sent_at timestamptz null
- created_at timestamptz

## audit_logs

Registro attività.

Campi:

- id uuid PK
- actor_admin_id uuid FK admin_users null
- action text not null
- entity_type text not null
- entity_id uuid null
- metadata jsonb null
- created_at timestamptz default now()

Regola: non modificare e non cancellare i log.

---

# 5. Viste consigliate

- active_members_view
- expiring_memberships_view
- expired_memberships_view
- dashboard_stats_view

Nota: le viste relative a soci attivi/scaduti devono derivare lo stato associativo da `memberships`, non da `members.status`.

---

# 6. Trigger consigliati

- `set_updated_at()` per aggiornare `updated_at`
- trigger su `payments` per aggiornare `memberships.paid_amount`
- funzione di refresh stato iscrizioni, se necessaria

---

# 7. RLS Supabase

Abilitare RLS su tutte le tabelle applicative.

Regola base:

- lettura solo utenti autenticati
- scrittura solo admin attivi
- nessuna tabella pubblica

La RLS iniziale deve essere parte di M0 insieme alla protezione delle route gestionali. Le policy devono considerare `admin_users.status = 'active'` e il bootstrap del primo `super_admin` deve essere definito prima di rendere operativo l'ambiente.

---

# 8. Seed iniziale

## Ruoli

- Presidente
- Vicepresidente
- Segretario
- Tesoriere
- Consigliere
- Socio Ordinario
- Socio Sostenitore

## Membership Plans

- Ordinaria: 30.00, 12 mesi
- Agevolata: 15.00, 6 mesi
- Sostenitore: 30.00, 12 mesi

---

# 9. Ordine migration

```text
001_extensions.sql
002_admin_users.sql
003_members_roles.sql
004_membership_plans.sql
005_memberships_payments.sql
006_sponsors.sql
007_events.sql
008_sponsor_contributions.sql
009_email.sql
010_audit_logs.sql
011_views.sql
012_rls_policies.sql
013_seed.sql
```

---

# 10. Note per Codex

- non creare app mobile
- non creare area soci
- non creare contabilità
- non usare cancellazioni fisiche
- non salvare quota o scadenza in `members`
- non usare `members.status` per indicare lo stato associativo
- usare `start_datetime` e `end_datetime` come campi canonici evento
- non usare float per importi
- non usare enum PostgreSQL nella prima versione
- aggiornare questo documento se cambia il modello dati
