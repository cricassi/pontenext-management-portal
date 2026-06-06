# M1 Post-Merge Verification Report

Data verifica: 2026-06-06 23:23:05 +02:00

Repository: `cricassi/pontenext-management-portal`

Branch verificata: `main`

Commit verificato: `3102075 Merge pull request #9 from cricassi/codex/m1-members-roles`

Progetto Supabase: `PonteNext`

Project ref: `uhxfpsamenjhyrfgwckw`

## Esito sintetico

M1 risulta correttamente mergiata, presente nel repository e applicata al progetto Supabase live `PonteNext`.

La verifica non ha modificato codice applicativo, non ha creato migration, non ha applicato migration e non ha introdotto elementi M2.

## Repository

Il repository locale e' stato verificato su `main` dopo il merge della PR M1.

Stato Git iniziale della verifica:

- branch locale: `main`
- tracking: `origin/main`
- ultimo commit: `3102075`
- working tree pulito prima della creazione del report

La branch documentale creata per questo report e':

- `codex/m1-post-merge-verification`

## Migration M1

Migration M1 locale presente:

- `database/migrations/004_members_roles.sql`

Migration Supabase applicate sul progetto live:

| Versione | Nome |
| --- | --- |
| `20260606113953` | `001_extensions` |
| `20260606114014` | `002_admin_users` |
| `20260606115133` | `003_harden_admin_functions` |
| `20260606124849` | `004_members_roles` |

Esito:

- `004_members_roles` risulta applicata sul database live.
- Non risultano migration M2 applicate sul progetto live.

## Tabelle M1

Tabelle `public` presenti sul database live:

| Tabella | RLS | Righe |
| --- | --- | ---: |
| `public.admin_users` | attiva | 1 |
| `public.members` | attiva | 0 |
| `public.roles` | attiva | 7 |
| `public.member_roles` | attiva | 0 |

Esito M1:

- `public.members` presente.
- `public.roles` presente.
- `public.member_roles` presente.
- Le tre tabelle M1 hanno primary key UUID.
- Le foreign key `member_roles.member_id -> members.id` e `member_roles.role_id -> roles.id` sono presenti.

## RLS e policy

RLS live confermata tramite `pg_class.relrowsecurity`:

| Tabella | RLS |
| --- | --- |
| `member_roles` | attiva |
| `members` | attiva |
| `roles` | attiva |

Policy M1 presenti:

| Tabella | Policy | Comando | Ruolo |
| --- | --- | --- | --- |
| `members` | `members_select_active_admin` | `SELECT` | `authenticated` |
| `members` | `members_insert_active_admin` | `INSERT` | `authenticated` |
| `members` | `members_update_active_admin` | `UPDATE` | `authenticated` |
| `roles` | `roles_select_active_admin` | `SELECT` | `authenticated` |
| `roles` | `roles_insert_active_admin` | `INSERT` | `authenticated` |
| `roles` | `roles_update_active_admin` | `UPDATE` | `authenticated` |
| `member_roles` | `member_roles_select_active_admin` | `SELECT` | `authenticated` |
| `member_roles` | `member_roles_insert_active_admin` | `INSERT` | `authenticated` |
| `member_roles` | `member_roles_update_active_admin` | `UPDATE` | `authenticated` |

Esito:

- RLS iniziale M1 e' attiva.
- Le policy sono limitate agli admin autenticati tramite helper `app_private.is_active_admin()`.
- Non sono state rilevate policy `DELETE` per le tabelle M1.

## Seed ruoli

Seed ruoli base presente nel repository:

- `database/seeds/roles.sql`

Ruoli base confermati sul database live:

| Ruolo | Default | Sort order | Attivo |
| --- | --- | ---: | --- |
| `Presidente` | si | 10 | si |
| `Vicepresidente` | si | 20 | si |
| `Segretario` | si | 30 | si |
| `Tesoriere` | si | 40 | si |
| `Consigliere` | si | 50 | si |
| `Socio Ordinario` | si | 60 | si |
| `Socio Sostenitore` | si | 70 | si |

Esito:

- tutti i 7 ruoli base M1 sono presenti;
- tutti risultano `is_default = true`;
- nessuno dei ruoli base risulta archiviato.

## Tabelle fuori scope M1

Sono state cercate sul database live le tabelle fuori scope M1:

- `membership_plans`
- `memberships`
- `payments`
- `sponsors`
- `events`
- `sponsor_contributions`
- `email_templates`
- `email_campaigns`
- `audit_logs`

Esito:

- nessuna delle tabelle fuori scope M1 e' presente nel database live.
- non risultano tabelle M2 o successive applicate.

## Route members e roles

Route M1 presenti nel repository:

| Route | File |
| --- | --- |
| `/members` | `src/app/(admin)/members/page.tsx` |
| `/members/new` | `src/app/(admin)/members/new/page.tsx` |
| `/members/[id]` | `src/app/(admin)/members/[id]/page.tsx` |
| `/members/[id]/edit` | `src/app/(admin)/members/[id]/edit/page.tsx` |
| `/settings/roles` | `src/app/(admin)/settings/roles/page.tsx` |

Azioni server M1 presenti:

- `src/app/(admin)/members/actions.ts`
- `src/app/(admin)/settings/roles/actions.ts`

Output build Next.js:

- `/members`
- `/members/[id]`
- `/members/[id]/edit`
- `/members/new`
- `/settings`
- `/settings/roles`

Esito:

- le route members e roles sono presenti e incluse nella build.

## Trigger e indici

Trigger `updated_at` confermati:

| Tabella | Trigger |
| --- | --- |
| `members` | `set_members_updated_at` |
| `roles` | `set_roles_updated_at` |
| `member_roles` | `set_member_roles_updated_at` |

Indici M1 confermati:

- `members_pkey`
- `members_status_archived_at_idx`
- `members_name_idx`
- `members_email_idx`
- `members_fiscal_code_idx`
- `roles_pkey`
- `roles_name_key`
- `roles_sort_order_name_idx`
- `roles_archived_at_idx`
- `member_roles_pkey`
- `member_roles_member_id_idx`
- `member_roles_role_id_idx`
- `member_roles_member_role_idx`
- `member_roles_member_archived_at_idx`
- `member_roles_active_open_unique_idx`

## Verifiche locali

Comandi eseguiti:

```bash
npm run lint
npm run build
```

Esito:

- `npm run lint`: passato.
- `npm run build`: passato.

Nota operativa:

- `npm run lint` e `npm run build` sono stati eseguiti fuori sandbox per evitare timeout/`spawn EPERM` ambientali gia' osservati su questa workstation.

## Supabase Advisors

Security Advisor:

- warning residuo: `auth_leaked_password_protection`
- impatto: configurazione Supabase Auth, non collegata alla migration M1
- stato: gia' noto dalle verifiche precedenti

Performance Advisor:

- segnalazioni `unused_index` di livello `INFO` sugli indici M1 appena creati
- impatto: atteso in assenza di traffico reale sulle nuove tabelle
- stato: da rivalutare dopo utilizzo applicativo reale

Non sono emersi nuovi warning SQL/RLS bloccanti relativi a M1.

## Conclusione

M1 Post-Merge Verification superata.

Sono confermati:

- migration M1 applicata;
- tabelle `members`, `roles`, `member_roles` presenti;
- RLS attiva;
- policy M1 presenti;
- seed ruoli base presente;
- nessuna tabella fuori scope M1 presente;
- route members/roles presenti;
- lint e build validi.

Non e' stato iniziato M2.
