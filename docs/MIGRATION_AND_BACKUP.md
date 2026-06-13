# MIGRATION_AND_BACKUP.md

# PonteNext Management Portal - Migration and Backup

Versione: 1.0

Ultimo aggiornamento: 2026-06-13

---

# 1. Scopo del documento

Questo documento descrive come migrare, ricreare, fare backup e ripristinare il
progetto PonteNext Management Portal.

Obiettivi:

- ricostruire un ambiente Supabase partendo dal repository;
- migrare dati verso un nuovo progetto Supabase;
- distinguere schema, dati applicativi, utenti Auth e segreti;
- proteggere chiavi, backup e dati personali;
- garantire che RLS, route protette e login admin reale restino funzionanti
  dopo ogni restore o migrazione.

Questo documento non autorizza modifiche operative al database. Ogni procedura
di restore o migrazione deve essere pianificata, approvata ed eseguita fuori da
una PR documentale.

---

# 2. Componenti migrabili

## Repository GitHub

Contiene:

- codice Next.js;
- documentazione;
- migration SQL in `database/migrations`;
- seed idempotenti in `database/seeds`;
- configurazione frontend/backend;
- checklist e report di verifica.

Non deve contenere:

- `.env.local`;
- chiavi Supabase;
- `RESEND_API_KEY`;
- password database;
- backup database;
- export dati personali.

## Supabase database

Comprende:

- schema `public`;
- schema privato `app_private`;
- tabelle applicative;
- funzioni e trigger;
- vincoli;
- indici;
- dati applicativi.

Lo schema applicativo attuale e' ricostruibile dalle migration operative da
`001_extensions` a `010_email`.

## Supabase Auth

Supabase Auth non e' una normale tabella applicativa `public`.

Gli utenti Auth vivono in schema gestito da Supabase e includono dati sensibili
come identita', conferme, hash password, provider e sessioni.

Regole:

- non trattare `auth.users` come seed applicativo ordinario;
- non esportare utenti Auth in file committati;
- non stampare password, token o hash;
- quando si migra verso un nuovo Supabase, pianificare esplicitamente come
  ricreare o importare gli utenti Auth;
- `public.admin_users.auth_user_id` deve puntare agli UUID reali di
  `auth.users`.

Se gli UUID Auth cambiano, i record in `public.admin_users` devono essere
riallineati con bootstrap controllato.

## Supabase RLS / policy

RLS e policy sono parte integrante della sicurezza.

Regole:

- RLS deve restare attiva su tutte le tabelle applicative;
- le policy devono restare admin-only secondo il modello corrente;
- non introdurre policy `DELETE` senza decisione esplicita;
- verificare RLS dopo ogni restore, migrazione o replay di migration;
- non usare service role per aggirare RLS nel runtime applicativo;
- su nuovi progetti Supabase verificare anche i grant/Data API: i grant
  decidono se una tabella e' raggiungibile dall'API, mentre RLS decide quali
  righe sono visibili.

## Resend

Resend e' il provider email scelto in M7.

Componenti esterni da migrare o riconfigurare:

- account Resend;
- dominio o mittente verificato;
- DNS richiesti dal provider;
- API key;
- eventuali limiti o policy antispam;
- variabile `EMAIL_FROM`.

Il database contiene campagne, template e destinatari storici, ma non deve
contenere la `RESEND_API_KEY`.

## Hosting Vercel o altro hosting Next.js

Componenti da migrare:

- repository collegato;
- branch di deploy;
- variabili ambiente;
- dominio custom;
- redirect Auth configurati su Supabase;
- runtime Node/Next.js compatibile;
- comandi build/start;
- eventuali log e impostazioni di sicurezza.

Vercel e' lo stack previsto, ma il progetto puo' essere eseguito su altro
hosting Next.js se restano disponibili variabili ambiente, cookie/sessioni e
server runtime compatibili.

---

# 3. Ricreazione progetto Supabase da zero

Procedura di alto livello:

1. Creare un nuovo progetto Supabase.
2. Annotare project ref, regione e URL API.
3. Configurare le impostazioni Auth richieste:
   - email provider;
   - conferma email secondo policy operativa;
   - redirect URL del dominio locale/deploy;
   - eventuali limiti di sicurezza.
4. Applicare solo le migration operative correnti, in ordine da `001` a `010`.
5. Applicare o verificare i seed necessari.
6. Verificare grant/Data API e RLS sulle tabelle applicative.
7. Creare il primo utente Supabase Auth amministratore.
8. Eseguire il bootstrap di `public.admin_users` come `super_admin`.
9. Configurare `.env.local` e variabili ambiente hosting.
10. Verificare RLS, policy e login admin reale.
11. Eseguire smoke test delle route principali.

Nota importante:

- Il repository usa `database/migrations`, non la directory standard
  `supabase/migrations`.
- Non eseguire comandi CLI che applicano migration automaticamente senza aver
  verificato la directory sorgente, l'ordine e l'ambiente target.
- Le migration `011` e successive presenti come placeholder/futuro non fanno
  parte dello schema operativo corrente e non devono essere applicate per
  ricostruire lo stato M8.

---

# 4. Ordine migration attuale

Ordine operativo attuale:

```text
001_extensions
002_admin_users
003_harden_admin_functions
004_members_roles
005_membership_plans
006_memberships_payments
007_sponsors
008_events
009_sponsor_contributions
010_email
```

Dettaglio:

| Ordine | Migration | Scopo |
| --- | --- | --- |
| 001 | `001_extensions` | Estensioni tecniche minime, incluso UUID/random |
| 002 | `002_admin_users` | Tabella admin, RLS iniziale, bootstrap support |
| 003 | `003_harden_admin_functions` | Hardening funzioni admin/RLS |
| 004 | `004_members_roles` | Soci, ruoli, assegnazioni ruolo, seed ruoli |
| 005 | `005_membership_plans` | Piani iscrizione configurabili |
| 006 | `006_memberships_payments` | Iscrizioni, pagamenti, trigger importi/stati |
| 007 | `007_sponsors` | Sponsor e contributi sponsor senza eventi |
| 008 | `008_events` | Eventi e relazione sponsor-eventi |
| 009 | `009_sponsor_contributions` | `event_id` nullable sui contributi sponsor |
| 010 | `010_email` | Template, campagne, destinatari email |

Regole:

- non modificare migration gia' applicate;
- ogni modifica successiva allo schema deve essere una nuova migration;
- aggiornare questo documento quando cambia lo schema operativo;
- verificare lo stato remoto con lista migration prima di ogni restore o
  migrazione.

---

# 5. Seed necessari

Seed applicativi necessari:

- ruoli base M1;
- piani iscrizione base M2.

File presenti:

```text
database/seeds/roles.sql
database/seeds/membership_plans.sql
```

Ruoli base:

- Presidente
- Vicepresidente
- Segretario
- Tesoriere
- Consigliere
- Socio Ordinario
- Socio Sostenitore

Piani iscrizione base:

- Ordinaria: `30.00`, 12 mesi
- Agevolata: `15.00`, 6 mesi
- Sostenitore: `30.00`, 12 mesi

Note operative:

- `004_members_roles` include gia' un seed idempotente dei ruoli base.
- `membership_plans.sql` resta il riferimento seed per i piani base M2.
- Non usare seed demo in produzione.
- Non inserire utenti Auth o password nei seed del repository.

---

# 6. Bootstrap primo super_admin

Il primo `super_admin` richiede due passaggi distinti:

1. creare o confermare un utente in Supabase Auth;
2. collegarlo a `public.admin_users`.

Procedura:

1. Aprire Supabase Dashboard.
2. Andare in `Authentication` -> `Users`.
3. Creare l'utente amministratore con email reale.
4. Confermare l'email o impostare una password iniziale secondo procedura
   interna.
5. Eseguire il bootstrap da SQL Editor o altro canale owner/service role
   controllato.
6. Verificare login reale su `/login`.

SQL bootstrap generico:

```sql
insert into public.admin_users (
  auth_user_id,
  full_name,
  email,
  role,
  status,
  archived_at
)
select
  id,
  coalesce(
    nullif(raw_user_meta_data ->> 'full_name', ''),
    nullif(raw_user_meta_data ->> 'name', ''),
    split_part(email, '@', 1)
  ),
  email,
  'super_admin',
  'active',
  null
from auth.users
where lower(email) = lower('<admin-email>')
on conflict (auth_user_id) do update
set
  full_name = excluded.full_name,
  email = excluded.email,
  role = 'super_admin',
  status = 'active',
  archived_at = null,
  updated_at = now();
```

Sostituire `<admin-email>` con l'email reale dell'operatore.

Controllo:

```sql
select
  email,
  role,
  status,
  archived_at
from public.admin_users
where lower(email) = lower('<admin-email>');
```

Risultato atteso:

```text
role = super_admin
status = active
archived_at = null
```

Ogni restore deve essere verificato con login admin reale, non solo con query
database.

---

# 7. Variabili ambiente richieste

Variabili richieste:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
EMAIL_FROM=
```

Uso:

- `NEXT_PUBLIC_SUPABASE_URL`: URL pubblico del progetto Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: chiave pubblica anon, usata da browser,
  middleware e server client sotto RLS.
- `SUPABASE_SERVICE_ROLE_KEY`: chiave privilegiata solo per operazioni server
  controllate o bootstrap; non deve essere esposta al browser.
- `RESEND_API_KEY`: chiave Resend solo lato server; non deve essere committata.
- `EMAIL_FROM`: mittente verificato/autorizzato nel provider email.

Regole:

- `.env.local` non deve essere committato.
- Le variabili reali vanno configurate localmente o nel provider hosting.
- Nessuna chiave deve essere stampata nei log o nei report.
- Nessuna variabile segreta deve usare prefisso `NEXT_PUBLIC_`.
- Dopo rotazione chiavi, riavviare l'ambiente locale/deploy.

---

# 8. Backup database

Tipologie:

- backup gestiti Supabase Dashboard;
- PITR, se abilitato dal piano;
- dump logico con Supabase CLI o `pg_dump`;
- export dati applicativi mirati.

Regole generali:

- non salvare backup nel repository;
- cifrare i backup fuori dal database;
- limitare accesso ai backup;
- mantenere retention coerente con privacy e normativa applicabile;
- testare periodicamente il restore su ambiente separato;
- annotare project ref, data backup, migration applicate e versione commit.

Backup gestito Supabase:

- usare `Database` -> `Backups` nel Dashboard;
- pianificare downtime se si deve ripristinare;
- considerare PITR se serve granularita' maggiore.

Dump logico tramite CLI:

```bash
supabase link --project-ref <project-ref>
supabase db dump --linked --file backups/<date>_schema.sql
supabase db dump --linked --data-only --file backups/<date>_data.sql
```

Note:

- `supabase db dump` esclude gli schemi Supabase gestiti come `auth` e
  `storage` nel comportamento standard documentato dalla CLI.
- Il dump default non contiene dati o custom roles; usare `--data-only` per i
  dati applicativi.
- Non passare password o connection string direttamente in comandi che possono
  finire nella cronologia shell se non strettamente necessario.
- Preferire variabili ambiente locali o secret manager sicuri.

Backup Auth:

- Auth richiede procedura dedicata;
- non considerare un dump `public` sufficiente a ricreare utenti e login;
- se il piano o gli strumenti Supabase forniscono restore gestito, preferirlo;
- se si migra manualmente, ricreare utenti e riallineare `admin_users`.

---

# 9. Restore database

## Restore nello stesso progetto

Per restore gestito:

1. Sospendere operazioni applicative se necessario.
2. Scegliere backup o punto PITR dal Dashboard.
3. Confermare la finestra di downtime.
4. Attendere completamento restore.
5. Eseguire verifiche post-restore.

Attenzione:

- un restore puo' rendere il progetto temporaneamente non disponibile;
- il ripristino puo' sovrascrivere dati piu' recenti;
- eventuali integrazioni esterne vanno rivalidate.

## Restore verso nuovo progetto

Procedura consigliata:

1. Creare nuovo progetto Supabase.
2. Applicare migration operative `001`-`010`.
3. Applicare seed necessari.
4. Ripristinare dati applicativi.
5. Ricreare o migrare utenti Auth.
6. Bootstrap/realign `admin_users`.
7. Aggiornare variabili ambiente.
8. Verificare RLS, login admin reale e funzionalita' principali.

Esempio generico di restore dati:

```bash
psql "$TARGET_DATABASE_URL" -v ON_ERROR_STOP=1 -f backups/<date>_data.sql
```

`TARGET_DATABASE_URL` e' un segreto operativo e non deve essere stampato o
committato.

---

# 10. Migrazione dati verso nuovo Supabase

Sequenza consigliata:

1. Congelare modifiche applicative o pianificare finestra di cutover.
2. Eseguire backup completo del progetto origine.
3. Creare il progetto Supabase destinazione.
4. Applicare migration operative `001`-`010`.
5. Applicare seed ruoli e piani.
6. Migrare dati `public`.
7. Ricreare o migrare utenti Supabase Auth.
8. Riallineare `public.admin_users` agli UUID Auth della destinazione.
9. Configurare RLS/policy e verificarle.
10. Configurare Resend o provider email.
11. Configurare hosting e variabili ambiente.
12. Eseguire verifiche post-migrazione.
13. Spostare traffico o dominio solo dopo esito positivo.

Ordine logico dati se si importa manualmente:

1. `roles`
2. `membership_plans`
3. `members`
4. `member_roles`
5. `memberships`
6. `payments`
7. `sponsors`
8. `events`
9. `event_sponsors`
10. `sponsor_contributions`
11. `email_templates`
12. `email_campaigns`
13. `email_campaign_recipients`
14. `admin_users`, solo dopo Auth o con riallineamento UUID

Note:

- Se si usa un dump coerente, l'ordine puo' essere gestito dallo strumento di
  restore.
- In caso di import manuale, rispettare FK e vincoli.
- Gli UUID applicativi devono essere preservati se altri dati li referenziano.
- Gli UUID Auth possono cambiare se gli utenti sono ricreati manualmente.

---

# 11. Rotazione chiavi

Chiavi da considerare:

- Supabase anon key;
- Supabase service role key;
- password database;
- `RESEND_API_KEY`;
- credenziali hosting/deploy;
- token GitHub/Vercel eventualmente usati fuori repo.

Regole:

- ruotare una chiave alla volta quando possibile;
- aggiornare prima l'ambiente nuovo/staging;
- aggiornare `.env.local` locale senza committarlo;
- aggiornare variabili ambiente hosting tramite dashboard/secret manager;
- riavviare deployment o dev server;
- verificare login admin e operazioni principali;
- revocare la chiave vecchia solo dopo verifica positiva.

Service role:

- non deve essere esposta al browser;
- non deve essere usata nel client Next.js;
- non deve comparire in bundle, log o report;
- va limitata a bootstrap, manutenzione controllata e script server-side
  approvati.

Resend:

- `RESEND_API_KEY` non deve essere committata;
- dopo rotazione verificare `EMAIL_FROM` e dominio mittente;
- eseguire solo invii controllati e confermati da admin.

---

# 12. Cambio provider email

Provider corrente: Resend.

Se si cambia provider email:

1. Aggiornare ADR/documentazione tecnica.
2. Aggiornare variabili ambiente e `.env.example`.
3. Aggiornare service layer email server-side.
4. Verificare che nessuna API key sia esposta al browser.
5. Gestire storico campagne esistenti con `provider = 'resend'`.
6. Valutare se serva migration per cambiare vincoli/check sul campo
   `email_campaigns.provider`.
7. Aggiornare `DATABASE_DESIGN.md`, `BUSINESS_RULES.md`,
   `MIGRATION_AND_BACKUP.md` e checklist milestone.
8. Verificare invio solo dopo conferma admin.

Non modificare automaticamente lo storico campagne per mascherare il provider
usato al momento dell'invio.

---

# 13. Cambio hosting

Hosting previsto: Vercel o altro hosting compatibile Next.js.

Per migrare hosting:

1. Collegare repository GitHub al nuovo hosting.
2. Configurare branch di deploy.
3. Configurare variabili ambiente senza valori nel repository.
4. Verificare versione Node e supporto Next.js App Router.
5. Eseguire build.
6. Configurare dominio e HTTPS.
7. Aggiornare Supabase Auth redirect URL.
8. Verificare cookie/sessioni login.
9. Verificare route protette.
10. Verificare invio email server-side, se abilitato.

Comandi base:

```bash
npm install
npm run lint
npx tsc --noEmit
npm run build
```

Il comando di avvio dipende dall'hosting scelto. Non cambiare hosting senza
aggiornare le istruzioni di deploy.

---

# 14. Verifiche post-migrazione

Verifiche repository:

- branch corretta;
- commit atteso;
- `git status` pulito;
- nessun `.env.local` tracciato;
- nessun backup nel repository.

Verifiche build:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Verifiche Supabase:

- migration applicate fino a `010_email`;
- nessuna migration inattesa;
- tabelle attese presenti;
- RLS attiva su tutte le tabelle applicative;
- grant/Data API coerenti con l'uso di `supabase-js`;
- nessuna policy `DELETE` non approvata;
- funzioni admin hardened presenti;
- seed ruoli e piani presenti;
- `admin_users` collegato a utenti Auth reali.

Verifiche Auth:

- login con `super_admin` reale;
- accesso `/dashboard`;
- accesso negato a utente Auth non presente in `admin_users`;
- accesso negato ad admin `inactive`;
- accesso negato ad admin con `archived_at` valorizzato.

Verifiche funzionali minime:

- `/members`;
- `/memberships`;
- `/expirations`;
- `/dashboard`;
- `/sponsors`;
- `/events`;
- `/email`;
- `/reports`;
- export CSV/XLSX.

Verifiche email:

- `RESEND_API_KEY` presente solo lato server;
- `EMAIL_FROM` verificato;
- nessun invio automatico;
- invio solo con conferma admin.

---

# 15. Rischi

Rischi principali:

- importare dati senza utenti Auth corrispondenti;
- perdere il collegamento `admin_users.auth_user_id`;
- disabilitare o dimenticare RLS;
- ricreare il progetto senza grant/Data API necessari alle tabelle pubbliche;
- applicare migration fuori ordine;
- applicare placeholder futuri non approvati;
- committare `.env.local` o backup;
- esporre service role key al browser;
- committare `RESEND_API_KEY`;
- ripristinare backup incompleto;
- sovrascrivere dati recenti con restore nello stesso progetto;
- dimenticare redirect URL Auth dopo cambio hosting;
- cambiare provider email senza aggiornare vincoli database;
- non testare login admin reale dopo restore.

Mitigazioni:

- provare restore su staging prima della produzione;
- mantenere checklist firmata dagli operatori;
- usare backup cifrati e accesso limitato;
- verificare RLS con query read-only;
- testare login reale prima del cutover;
- ruotare chiavi dopo incidenti o migrazioni sensibili.

---

# 16. Checklist operativa

## Prima della migrazione

- [ ] Finestra operativa approvata.
- [ ] Branch e commit sorgente annotati.
- [ ] Project ref Supabase origine annotato.
- [ ] Project ref Supabase destinazione annotato.
- [ ] Piano Auth definito.
- [ ] Piano rollback definito.
- [ ] Responsabile operativo identificato.

## Backup

- [ ] Backup Supabase Dashboard/PITR disponibile, se previsto dal piano.
- [ ] Dump schema creato, se richiesto.
- [ ] Dump dati creato, se richiesto.
- [ ] Backup cifrato.
- [ ] Backup conservato fuori dal repository.
- [ ] Restore di prova pianificato o eseguito.

## Ricostruzione schema

- [ ] Applicata `001_extensions`.
- [ ] Applicata `002_admin_users`.
- [ ] Applicata `003_harden_admin_functions`.
- [ ] Applicata `004_members_roles`.
- [ ] Applicata `005_membership_plans`.
- [ ] Applicata `006_memberships_payments`.
- [ ] Applicata `007_sponsors`.
- [ ] Applicata `008_events`.
- [ ] Applicata `009_sponsor_contributions`.
- [ ] Applicata `010_email`.
- [ ] Nessuna migration futura/placeholder applicata.

## Seed

- [ ] Ruoli base presenti.
- [ ] Piani iscrizione base presenti.
- [ ] Nessun dato demo in produzione.

## Auth e admin

- [ ] Primo utente Auth amministratore creato/confermato.
- [ ] `public.admin_users` bootstrap completato.
- [ ] `super_admin` reale attivo.
- [ ] Login admin reale verificato.
- [ ] Auth-only user negato dal guard admin.

## Ambiente

- [ ] `.env.local` non tracciato.
- [ ] Variabili hosting configurate.
- [ ] Service role non esposta al browser.
- [ ] `RESEND_API_KEY` non committata.
- [ ] `EMAIL_FROM` verificato.
- [ ] Redirect URL Auth aggiornati.

## Verifiche tecniche

- [ ] `npm run lint`.
- [ ] `npx tsc --noEmit`.
- [ ] `npm run build`.
- [ ] RLS attiva.
- [ ] Grant/Data API verificati per le tabelle applicative.
- [ ] Nessuna policy `DELETE` inattesa.
- [ ] Route protette verificate.
- [ ] Export CSV/XLSX verificati.

## Cutover

- [ ] Dominio aggiornato.
- [ ] Cache/hosting invalidati se necessario.
- [ ] Monitoraggio login e route principali.
- [ ] Vecchie chiavi revocate dopo verifica.
- [ ] Vecchio ambiente mantenuto in sola lettura finche' serve rollback.

---

# Riferimenti

- Supabase Database Backups:
  https://supabase.com/docs/guides/platform/backups
- Supabase CLI `db dump`:
  https://supabase.com/docs/reference/cli/supabase-db-dump
- Supabase CLI `db push` / migration behavior:
  https://supabase.com/docs/reference/cli/supabase-db-push
- Supabase Changelog - Data API grants:
  https://supabase.com/changelog
