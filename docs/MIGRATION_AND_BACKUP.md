# Migration and Backup

Data aggiornamento: 2026-06-16

## 1. Scopo del documento

Questo documento descrive come migrare, ricreare, fare backup e ripristinare PonteNext Management Portal.

La procedura copre repository, database Supabase, Auth, RLS/policy, provider email Resend e hosting Next.js.

Regole dure:

- `.env.local` non deve essere committato.
- Le service role key non devono essere esposte al browser.
- `RESEND_API_KEY` non deve essere committata.
- Gli utenti Supabase Auth non sono semplici righe `public`: vanno migrati e verificati con attenzione.
- RLS deve restare attiva su tutte le tabelle applicative.
- Ogni restore deve essere verificato con login admin reale.

## 2. Componenti migrabili

### Repository GitHub

Migrare:

- codice Next.js;
- documentazione;
- migration SQL;
- seed SQL;
- asset locali in `public/brand`;
- configurazioni non segrete.

Non migrare nel repository:

- `.env.local`;
- chiavi Supabase;
- `RESEND_API_KEY`;
- dump database;
- export contenenti dati personali.

### Supabase database

Migrare:

- schema `public`;
- funzioni SQL;
- trigger;
- indici;
- vincoli;
- dati applicativi;
- migration applicate.

### Supabase Auth

Gli utenti Auth vivono nello schema gestito da Supabase Auth, non nelle sole tabelle `public`.

In una migrazione reale verificare:

- utenti admin necessari;
- email confermate;
- provider attivi;
- redirect URL;
- relazione tra `auth.users.id` e `public.admin_users.auth_user_id`.

### Supabase RLS/policy

RLS e policy devono restare coerenti con la regola admin-only:

- RLS attiva su ogni tabella applicativa;
- policy per ruolo `authenticated`;
- accesso con `app_private.is_active_admin()`;
- nessuna policy `DELETE`, salvo decisione futura documentata.

### Resend

Migrare solo configurazione operativa:

- account/provider;
- dominio verificato;
- mittente `EMAIL_FROM`;
- API key tramite variabile ambiente.

Non salvare chiavi API nel database o nel repository.

### Hosting Vercel o altro hosting Next.js

Migrare:

- project settings;
- build command;
- environment variables;
- dominio;
- redirect e runtime Next.js.

Non esporre variabili server-side al client.

## 3. Ricreazione progetto Supabase da zero

Procedura:

1. Creare nuovo progetto Supabase.
2. Salvare il nuovo project ref.
3. Configurare URL e anon key in `.env.local`.
4. Applicare solo le migration reali, in ordine.
5. Applicare i seed necessari.
6. Creare almeno un utente Supabase Auth.
7. Eseguire bootstrap del primo `super_admin`.
8. Verificare RLS, policy e funzioni SQL.
9. Eseguire login admin reale.
10. Verificare route protette e accesso negato per utenti non admin.

Non applicare placeholder futuri come se fossero migration operative.

## 4. Ordine migration attuale

Migration operative attuali, applicate su Supabase PonteNext:

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

File locali:

```text
database/migrations/001_extensions.sql
database/migrations/002_admin_users.sql
database/migrations/003_harden_admin_functions.sql
database/migrations/004_members_roles.sql
database/migrations/005_membership_plans.sql
database/migrations/006_memberships_payments.sql
database/migrations/007_sponsors.sql
database/migrations/008_events.sql
database/migrations/009_sponsor_contributions.sql
database/migrations/010_email.sql
```

I file `011_audit_logs.sql`, `012_views.sql`, `013_rls_policies.sql` e `014_seed.sql` sono placeholder/futuri nel repository e non risultano applicati al database live.

## 5. Seed necessari

Seed operativi:

```text
database/seeds/roles.sql
database/seeds/membership_plans.sql
```

Dopo restore o nuovo ambiente verificare:

- ruoli associativi base presenti;
- piani iscrizione base presenti;
- eventuali template email coerenti con la configurazione operativa.

## 6. Bootstrap primo super_admin

Prima creare l'utente in Supabase Auth.

Poi inserire o aggiornare la riga applicativa in `public.admin_users`:

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

Controlli dopo bootstrap:

- login con email/password funziona;
- `public.admin_users.status = 'active'`;
- `archived_at is null`;
- utente Auth non presente in `admin_users` viene negato;
- admin `inactive` o archiviato viene negato.

## 7. Variabili ambiente richieste

Esempio `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
EMAIL_FROM=
```

Regole:

- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` possono essere usate dal client e sono protette da RLS.
- `SUPABASE_SERVICE_ROLE_KEY` e' solo server/bootstrap. Mai nel browser.
- `RESEND_API_KEY` e' solo server-side. Mai nel browser, mai nei log, mai nel repository.
- `EMAIL_FROM` deve essere un mittente verificato/autorizzato nel provider email.

## 8. Backup database

Backup minimo:

- dump schema e dati `public`;
- dump dati necessari a ricostruire Auth, oppure procedura controllata di ricreazione utenti Auth;
- copia delle migration applicate;
- copia dei seed;
- export separato e protetto dei dati personali se richiesto.

Backup consigliato:

- usare strumenti Supabase dashboard/CLI o `pg_dump`;
- cifrare il dump;
- salvare fuori dal repository;
- limitare accesso ai soli operatori autorizzati;
- annotare project ref, data, ambiente e commit applicativo.

Non includere dump database in Git.

## 9. Restore database

Procedura:

1. Creare o selezionare ambiente target.
2. Verificare che il target sia quello giusto.
3. Applicare migration operative `001`-`010`.
4. Applicare seed.
5. Ripristinare dati applicativi.
6. Ripristinare o ricreare utenti Supabase Auth.
7. Riallineare `admin_users.auth_user_id` agli utenti Auth target.
8. Verificare RLS attiva.
9. Verificare policy admin-only.
10. Eseguire login admin reale.
11. Eseguire smoke test route protette.

Non considerare il restore valido senza login admin reale riuscito.

## 10. Migrazione dati verso nuovo Supabase

Passi:

1. Congelare modifiche operative durante la finestra di migrazione.
2. Eseguire backup sorgente.
3. Creare progetto target.
4. Applicare migration e seed.
5. Migrare dati applicativi.
6. Migrare o ricreare utenti Auth.
7. Aggiornare `.env.local` e variabili ambiente hosting.
8. Verificare RLS/policy/funzioni.
9. Verificare login e route protette.
10. Eseguire test export/email senza invii reali.
11. Aggiornare DNS/hosting solo dopo verifica.

Attenzione: gli UUID Auth cambiano se gli utenti vengono ricreati. In quel caso `admin_users.auth_user_id` deve essere riallineato.

## 11. Rotazione chiavi

Ruotare:

- Supabase anon key se compromessa;
- Supabase service role key se usata fuori controllo;
- `RESEND_API_KEY` se sospetta o scaduta;
- credenziali Vercel/team se necessario.

Dopo rotazione:

- aggiornare variabili ambiente locali e deploy;
- redeployare;
- verificare login;
- verificare export;
- verificare stato provider email senza inviare campagne reali;
- rimuovere vecchie chiavi.

## 12. Cambio provider email

Cambio provider ammesso solo con decisione documentata.

Da aggiornare:

- service provider email server-side;
- variabili ambiente;
- documentazione;
- eventuali domini/mittenti verificati;
- gestione errori invio;
- report M7/M9 se impattati.

Regole invarianti:

- nessun invio automatico senza conferma admin;
- nessuna API key nel browser;
- nessuna API key nel database;
- nessun valore segreto committato.

## 13. Cambio hosting

Per spostare da Vercel ad altro hosting Next.js:

- verificare supporto Next.js App Router;
- configurare build command `npm run build`;
- configurare runtime Node compatibile;
- impostare variabili ambiente;
- configurare dominio;
- verificare middleware e cookie Supabase SSR;
- verificare route protette.

Il cambio hosting non deve cambiare modello dati o RLS.

## 14. Verifiche post-migrazione

Verifiche obbligatorie:

- `npm run lint`;
- `npx tsc --noEmit`;
- `npm run build`;
- login admin reale;
- logout;
- utente Auth non admin negato;
- admin `inactive` o archiviato negato;
- RLS attiva su tutte le tabelle applicative;
- nessuna policy `DELETE` non prevista;
- route admin senza sessione reindirizzano a `/login`;
- export CSV/XLSX protetti;
- Resend configurato senza invii reali;
- nessuna chiave visibile nel bundle client.

## 15. Rischi

- Perdita relazione tra `auth.users.id` e `admin_users.auth_user_id`.
- Restore parziale con RLS disattivata.
- Dump contenente dati personali salvato in posizione non protetta.
- Service role key esposta al client.
- API key Resend committata per errore.
- Placeholder migration applicati come migration operative.
- Redirect Auth non configurati sul nuovo dominio.
- Invio email reale durante test.

## 16. Checklist operativa

- [ ] Identificato ambiente sorgente.
- [ ] Identificato ambiente target.
- [ ] Backup creato e cifrato.
- [ ] Commit applicativo annotato.
- [ ] Migration `001`-`010` applicate in ordine.
- [ ] Placeholder `011`+ non applicati.
- [ ] Seed ruoli applicato.
- [ ] Seed piani iscrizione applicato.
- [ ] Utenti Supabase Auth verificati.
- [ ] Primo `super_admin` bootstrappato.
- [ ] `.env.local` creato localmente e non committato.
- [ ] Variabili hosting configurate.
- [ ] RLS verificata attiva.
- [ ] Policy admin-only verificate.
- [ ] Login admin reale riuscito.
- [ ] Route protette verificate.
- [ ] Export verificato senza file su disco.
- [ ] Email verificata senza invii reali.
- [ ] Chiavi rotate se necessario.
- [ ] Dump e segreti rimossi da postazioni non autorizzate.
