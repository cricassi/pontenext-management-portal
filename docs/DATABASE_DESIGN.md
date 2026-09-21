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
- ui_field_visibility
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

La tabella `memberships` e' storica: ogni rinnovo crea sempre una nuova riga.

Le righe esistenti non devono essere modificate, estese o riutilizzate per rappresentare un rinnovo successivo.

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
- ogni rinnovo crea una nuova riga `memberships`
- non aggiornare `start_date`, `end_date`, durata, quota o stato di una iscrizione esistente per estenderla
- una iscrizione precedente resta storica anche quando il socio rinnova
- lo stato associativo corrente del socio deriva dalla riga `memberships` applicabile alla data di valutazione

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
- start_datetime timestamptz not null
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
- description text null
- notes text null
- created_at timestamptz
- updated_at timestamptz
- archived_at timestamptz

Regole:

- un contributo appartiene sempre a uno sponsor
- uno sponsor puo' esistere senza contributi
- uno sponsor puo' avere zero, uno o piu' contributi
- `event_id` e' nullable e viene introdotto solo da M6
- un contributo senza evento resta valido
- un contributo con `event_id` rappresenta un contributo specifico collegato a un evento
- un contributo collegato a un evento deve appartenere a uno sponsor gia' collegato a quell'evento tramite `event_sponsors`
- i contributi monetari richiedono `amount > 0`
- i contributi non monetari possono avere `amount = 0`
- i contributi non monetari richiedono `description`
- `amount` per contributi non monetari e' solo un eventuale valore gestionale interno
- nessuna logica contabile, fiscale, IVA, fatturazione o prima nota deriva dai contributi sponsor

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
unique(event_id, sponsor_id) where archived_at is null
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
- created_by uuid FK admin_users null
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
- status text not null check in `draft`, `sent`, `failed`
- provider text not null default `resend`
- recipient_snapshot_generated_at timestamptz null
- send_confirmed_at timestamptz null
- sent_at timestamptz null
- failed_at timestamptz null
- error_message text null
- created_by uuid FK admin_users null
- sent_by uuid FK admin_users null
- created_at timestamptz
- updated_at timestamptz
- archived_at timestamptz

Regole:

- `draft`, `sent` e `failed` sono gli stati canonici M7.
- M7 non implementa `scheduled` o invio automatico.
- Creare o modificare una campagna non invia email.
- Generare destinatari non invia email.
- L'invio richiede conferma esplicita admin e avviene solo lato server tramite Resend.

## email_campaign_recipients

Destinatari campagna.

Campi:

- id uuid PK
- campaign_id uuid FK email_campaigns
- recipient_type text not null check in `member`, `sponsor`, `custom`
- member_id uuid FK members null
- sponsor_id uuid FK sponsors null
- email text not null
- recipient_name text null
- status text not null check in `pending`, `sent`, `failed`, `skipped`
- skip_reason text null
- provider_message_id text null
- error_message text null
- sent_at timestamptz null
- opt_out_token_hash text null
- opted_out_at timestamptz null
- consent_basis_snapshot text null
- created_at timestamptz
- updated_at timestamptz

Regole:

- ogni riga salva l'email effettivamente usata nella campagna;
- per `recipient_type = member`, `member_id` e' valorizzato e `sponsor_id` e' nullo;
- per `recipient_type = sponsor`, `sponsor_id` e' valorizzato e `member_id` e' nullo;
- per `recipient_type = custom`, `member_id` e `sponsor_id` sono nulli;
- la stessa email non viene duplicata nella stessa campagna;
- l'eventuale opt-out viene gestito senza esporre dati o token in chiaro.

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
003_harden_admin_functions.sql
004_members_roles.sql
005_membership_plans.sql
006_memberships_payments.sql
007_sponsors.sql
008_events.sql
009_sponsor_contributions.sql
010_email.sql
011_audit_logs.sql
012_views.sql
013_rls_policies.sql
014_seed.sql
015_ui_field_visibility.sql
016_lock_ui_field_visibility_foundation.sql
```

Ordine operativo live al 2026-09-21: 001-010, poi 015 e 016. I file 011-014
sono placeholder da saltare; dettaglio foundation M10-A1 nella sezione 11.
La 016 e' applicata live, versione `20260921205506`, dopo il gate
`MIGRATION 016 LOCK M10-A1 APPROVATA`. Non modifica ne' riapplica la 015.

Nota M5: la migration applicata `007_sponsors.sql` crea sia `sponsors` sia
`sponsor_contributions`, senza `event_id`.

Nota M6: `008_events.sql` crea `events` ed `event_sponsors`; `009_sponsor_contributions.sql`
aggiunge `sponsor_contributions.event_id` nullable per collegare opzionalmente
un contributo sponsor a un evento, senza rendere obbligatorio il collegamento.

Nota M7: `010_email.sql` crea `email_templates`, `email_campaigns` ed
`email_campaign_recipients`; l'invio e' server-side tramite Resend, non
automatico, e richiede conferma amministratore.

---

# 10. Note per Codex

- non creare app mobile
- non creare area soci
- non creare contabilita'
- non usare cancellazioni fisiche
- non salvare quota o scadenza in `members`
- non usare `members.status` per indicare lo stato associativo
- usare `start_datetime` e `end_datetime` come campi canonici evento
- mantenere `sponsor_contributions.event_id` nullable e usarlo solo per il collegamento opzionale M6
- non trattare i contributi sponsor come contabilita', fatturazione, IVA o prima nota
- non usare float per importi
- non usare enum PostgreSQL nella prima versione
- aggiornare questo documento se cambia il modello dati

---

# 11. M10: foundation e portabilita'

Riferimento: [M10_FIELD_VISIBILITY_AND_EXCEL_PLAN.md](M10_FIELD_VISIBILITY_AND_EXCEL_PLAN.md).
Verifica live PonteNext `uhxfpsamenjhyrfgwckw` del 2026-09-21:
migration operative `001`-`010` e `015_ui_field_visibility` (versione
`20260921195425`), poi lock `016_lock_ui_field_visibility_foundation`
(`20260921205506`), entrambi dopo gate espliciti distinti. File `011`-`014`
sopra elencati ancora placeholder: non applicarli o rinumerarli.
Nessuna modifica dei dati business; conteggi pre/post invariati.

## 11.1 ui_field_visibility M10-A1

Unica nuova tabella A1: `public.ui_field_visibility`, vuota dopo l'applicazione.
M10-A Field Visibility e' suddivisa in A1 Field Visibility Foundation e
A2 Field Visibility Rollout; l'ordine operativo completo e' **B -> A1 -> A2 -> C**.
In A1 si predispongono tabella, RLS, helper super_admin, registro, resolver e
pagina Impostazioni senza modificare schermate business. A2 integra i moduli
e adegua mapper/update con test di preservazione, senza ricreare la tabella.

| Campo | Specifica implementata |
| --- | --- |
| id | uuid PK, default generazione UUID |
| screen_key | text NOT NULL, chiave nota |
| field_key | text NOT NULL, coppia configurabile nota |
| is_visible | boolean NOT NULL DEFAULT true |
| updated_by | uuid NOT NULL, FK public.admin_users.id |
| created_at | timestamptz NOT NULL DEFAULT now() |
| updated_at | timestamptz NOT NULL DEFAULT now(), trigger |
| archived_at | timestamptz nullable |

Unicita' parziale `(screen_key, field_key)` con archived_at null. Tabella vuota
all'inizio, default visible da registro codice; salvare stati espliciti true/false,
reset tramite archiviazione del solo override. Coppie configurabili validate
nel registro e tramite CHECK coerente. Nessun permission group/scope/readonly.

Stato storico della sola 015: SELECT per admin attivi, INSERT/UPDATE solo super_admin attivi, autore
verificato, nessuna policy DELETE/anon. updated_by non e' Auth UUID: risolvere
`admin_users.auth_user_id = auth.uid()` e usare `admin_users.id`.
Migration `database/migrations/015_ui_field_visibility.sql` solo additiva:
nessun ALTER/DML delle tabelle business o seed. B non ha introdotto migration,
quindi 015 e' il primo numero libero dopo i placeholder. Helper STABLE SECURITY
DEFINER `app_private.is_super_admin()`, search_path vuoto, EXECUTE solo
authenticated. Grant della nuova tabella limitati a SELECT/INSERT/UPDATE;
nessun DELETE/TRUNCATE. UPDATE USING limita le righe sorgenti a non archiviate,
WITH CHECK permette il reset logico con autore corretto; vietata la riattivazione
del vecchio ID. FK updated_by indicizzata e trigger set_updated_at esistente.
CHECK statico: 116 coppie configurabili, parita' col registro versione 1.

### Lock correttivo 016, applicato e verificato live

`016_lock_ui_field_visibility_foundation.sql` tocca soltanto policy e privilegi
di ui_field_visibility: elimina le policy INSERT/UPDATE, revoca ad authenticated
INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER, mantiene SELECT e revoca tutto
ad anon/PUBLIC. RLS e policy SELECT admin attivi restano inalterate. Nessun
INSERT/UPDATE/DELETE/TRUNCATE di dati, nuova funzione o intervento su altre tabelle.
Stato verificato dopo 016: tutti gli utenti applicativi, anche super_admin, read-only;
nessun override salvabile tramite Data API. Non modifica i privilegi infrastrutturali
del proprietario database; l'app non usa service role per aggirare il blocco.

In A2 non ripristinare grant diretti. Progettare una RPC controllata con allowlist
DB delle sole coppie integrate, super_admin attivo e updated_by risolto dal proprio
auth.uid() tramite admin_users.auth_user_id. Estendere esplicitamente l'allowlist
per ogni rollout. RPC non implementata nella 016; A2 richiede approvazione separata.
Nessuna schermata business applica ancora questi override: e' lavoro A2.

## 11.2 Export e import non modificano il modello business

M10-B: manifest esplicito di 13 tabelle, incluse righe archiviate; esclusi Auth,
admin_users e materiale di sicurezza come opt_out_token_hash. Le FK admin
restano UUID con riferimenti esterni documentati. L'export non e' un dump.

M10-C: solo INSERT nuovi members. Le colonne importabili sono first_name,
last_name, email, phone, address, city, postal_code, province, country,
birth_date, fiscal_code, profession, notes. source_row_reference e' soltanto
metadato del file/report, non una colonna DB. id, status, timestamp e archived_at
non vengono accettati dal file. Nessuna relazione automatica o nuova tabella audit.

Gli indici live members_email_idx e members_fiscal_code_idx non sono UNIQUE.
Il trigger members esistente agisce solo su UPDATE, non crea relazioni su INSERT.
Il piano non aggiunge UNIQUE email/fiscale o bonifiche di dati. Controlli import
prudenziali su duplicati, anche inattivi/archiviati, precedono l'INSERT atomico.

M10-B non introduce funzioni SQL o migration: la richiesta di implementazione
ha escluso l'ipotesi RPC snapshot. Legge con sessione/RLS e guard super_admin,
tramite paginazione e doppia lettura confrontata, non transazionale.
Per il controllo duplicati transazionale C resta proposta una funzione additiva,
SECURITY INVOKER con sessione/RLS e guard super_admin, da approvare e testare
nella futura PR C. Nessuna alterazione di members o altre tabelle business;
policy CRUD manuale members invariata.
