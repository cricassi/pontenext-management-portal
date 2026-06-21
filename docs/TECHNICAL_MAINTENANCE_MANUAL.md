# Technical Maintenance Manual

Manuale tecnico per manutenzione, modifiche controllate e migrazione di PonteNext Management Portal.

Questo documento integra docs/MIGRATION_AND_BACKUP.md. Quando serve una procedura completa di backup, restore o cambio infrastruttura, usare quel documento come fonte primaria.

## 1. Stack

- Next.js App Router
- TypeScript strict
- Tailwind CSS
- shadcn/ui
- Supabase Auth
- Supabase PostgreSQL
- Supabase RLS
- Resend server-side
- Vercel

## 2. Struttura repository

Struttura principale:

    database/migrations
    database/seeds
    docs
    public/brand
    src/app
    src/components
    src/hooks
    src/lib
    src/services
    src/types
    src/utils

Regole:

- componenti React in PascalCase.tsx;
- route App Router in src/app;
- service layer in src/services;
- tipi condivisi in src/types;
- documentazione di milestone e decisioni in docs.

## 3. Setup locale

Installare dipendenze:

    npm install

Avviare sviluppo:

    npm run dev

Verifiche standard:

    npm run lint
    npx tsc --noEmit
    npm run build

Lint:

- Next.js 16 non usa next lint;
- il progetto usa ESLint CLI con eslint.config.mjs.

## 4. Variabili ambiente

File locale:

    .env.local

Non committare .env.local.

Variabili richieste:

    NEXT_PUBLIC_SUPABASE_URL=
    NEXT_PUBLIC_SUPABASE_ANON_KEY=
    SUPABASE_SERVICE_ROLE_KEY=
    RESEND_API_KEY=
    EMAIL_FROM=

Regole:

- NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY possono andare nel browser;
- SUPABASE_SERVICE_ROLE_KEY mai nel browser;
- RESEND_API_KEY mai nel browser;
- non stampare chiavi nei log;
- non salvare chiavi nel database;
- .env.example deve contenere solo nomi vuoti, non valori reali.

## 5. Supabase live

Progetto operativo:

    PonteNext
    project ref: uhxfpsamenjhyrfgwckw

Prima di ogni verifica o intervento live, controllare di essere su questo progetto.

Regole:

- non modificare Supabase durante verifiche read-only;
- non applicare migration fuori scope;
- non creare tabelle manualmente dalla dashboard;
- non disattivare RLS;
- non creare policy DELETE senza decisione esplicita e documentata.

## 6. Ordine migration

Ordine attuale:

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

M8, Brand Refresh, M9 e fix mobile non introducono migration.

Migration future:

- append-only;
- numerazione progressiva;
- idempotenti dove sensato;
- RLS e policy nella stessa milestone schema;
- docs/MIGRATION_AND_BACKUP.md aggiornato se cambia schema, RLS, Auth, env o deploy.

## 7. Seed

Seed attuali:

    database/seeds/roles.sql
    database/seeds/membership_plans.sql

Uso:

- roles.sql dopo 004_members_roles;
- membership_plans.sql dopo 005_membership_plans.

I seed devono restare idempotenti.

## 8. Bootstrap super_admin

Prima creare utente in Supabase Auth. Poi collegarlo a public.admin_users.

Query base:

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

Eseguire solo da SQL editor Supabase o ambiente controllato con privilegi adeguati.

Verificare:

- login riuscito;
- accesso a /dashboard;
- logout;
- route protette senza sessione riportano a /login;
- utente Auth non presente in admin_users negato.

## 9. Invarianti dati

Soci:

- members.status e' solo stato anagrafico;
- lo stato associativo deriva dalle memberships.

Membership:

- ogni rinnovo crea una nuova riga in memberships;
- non estendere o riutilizzare membership esistenti;
- end_date alimenta scadenze e filtri.

Pagamenti:

- pagamenti non contabili;
- nessuna fattura;
- nessuna IVA;
- nessuna prima nota;
- paid_amount e payment_status sono ricalcolati dai trigger su payments.

Sponsor:

- sponsor valido anche senza contributi;
- contributo sempre collegato a sponsor;
- contributo monetario con amount maggiore di zero;
- contributo non monetario con descrizione obbligatoria.

Eventi:

- campi canonici start_datetime e end_datetime;
- event_sponsors rappresenta legame sponsor-evento;
- sponsor_contributions.event_id e' nullable;
- contributi senza evento restano validi.

Email:

- nessun invio automatico;
- invio solo dopo conferma admin;
- Resend solo server-side;
- ogni destinatario salva l'email usata.

Report:

- CSV e XLSX soltanto;
- nessun PDF;
- nessun file scritto su disco;
- nessun dato fuori RLS.

## 10. RLS e policy

Regola generale:

- RLS attiva su tutte le tabelle applicative;
- policy basate su admin attivi;
- nessuna policy DELETE ordinaria;
- soft delete con archived_at.

Funzioni SQL:

- search_path esplicito;
- privilegi minimi;
- Security Advisor ricontrollato dopo modifiche SQL.

## 11. Route protette

Route admin principali:

- /dashboard
- /members
- /memberships
- /expirations
- /sponsors
- /events
- /email
- /reports
- /settings

Le pagine server-side devono chiamare il guard admin prima dei fetch sensibili.

## 12. Modifiche applicative

Procedura:

1. Leggere documenti impattati in docs.
2. Creare branch codex/<scope>.
3. Modificare solo lo scope richiesto.
4. Aggiornare documentazione e changelog.
5. Eseguire verifiche locali.
6. Aprire PR separata.

Se la modifica impatta schema, RLS, Auth, bootstrap admin, variabili ambiente, provider email, hosting, backup o restore, aggiornare anche docs/MIGRATION_AND_BACKUP.md.

## 13. Migrazione verso nuovo Supabase

Sequenza sintetica:

1. Creare nuovo progetto Supabase.
2. Applicare migration 001-010 in ordine.
3. Applicare seed.
4. Migrare dati public.
5. Migrare o ricreare utenti Supabase Auth con procedura controllata.
6. Bootstrap super_admin.
7. Configurare env su hosting.
8. Verificare login admin reale.
9. Verificare RLS.
10. Verificare route protette, email test ed export limitato.

Attenzione:

- Supabase Auth non e' una semplice tabella public;
- non improvvisare export/import Auth;
- non esporre service role key;
- ogni restore va verificato con login admin reale.

## 14. Deploy

Hosting corrente:

    Vercel

Dominio operativo:

    https://pontenext-management-portal.vercel.app

Controlli:

- framework Next.js;
- build command coerente;
- env production configurate;
- Supabase Auth redirect URLs aggiornate;
- nessuna chiave sensibile nel client bundle.

## 15. Email

Provider:

    Resend

Regole:

- Resend solo lato server;
- EMAIL_FROM deve essere mittente autorizzato;
- non inviare email reali durante review o test tecnici;
- testare prima su indirizzo controllato;
- non usare Gmail personale per invii massivi.

Cambio provider:

1. Documentare decisione.
2. Aggiornare env.
3. Aggiornare service server-side.
4. Aggiornare manuali e checklist.
5. Eseguire test senza invio reale, poi test controllato.

## 16. UI e mobile

Regole:

- contenuto gestionale chiaro;
- sidebar/header scuri;
- rosso Ponte Next come accento;
- nessuna UI tutta scura;
- nessuno scroll orizzontale mobile;
- input mobile con font minimo 16px per evitare auto-zoom iOS;
- elementi compatti su viewport tipo iPhone SE;
- icone leggibili e coerenti.

Verifica mobile minima:

- login;
- dashboard;
- lista soci;
- dettaglio socio;
- report;
- menu mobile;
- logout.

## 17. Backup e restore

Fonte primaria:

    docs/MIGRATION_AND_BACKUP.md

Regole:

- backup prima di migration operative;
- restore provato in ambiente non produttivo;
- RLS verificata dopo restore;
- login admin reale dopo restore;
- export dati personali gestito con attenzione.

## 18. Troubleshooting tecnico

Login negato:

- Auth user esiste;
- email confermata;
- riga admin_users presente;
- status active;
- archived_at vuoto;
- cookie/sessione browser puliti.

Build rotta:

    npm run lint
    npx tsc --noEmit
    npm run build

RLS blocca dati:

- sessione Supabase valida;
- policy tabella;
- helper admin;
- auth.uid() corrisponde ad admin_users.auth_user_id.

Export rotto:

- endpoint protetto;
- sessione admin;
- formato csv o xlsx;
- filtri validi;
- nessun uso service role.

Email rotta:

- env server-side;
- dominio o mittente Resend;
- destinatari validi;
- status destinatari;
- nessuna chiave stampata.

## 19. Checklist tecnica pre-merge

- [ ] Scope rispettato.
- [ ] Nessuna modifica DB se non richiesta.
- [ ] Nessuna migration fuori ordine.
- [ ] RLS preservata.
- [ ] Route protette.
- [ ] Nessuna API key nel repository.
- [ ] .env.example aggiornato se servono nuove env.
- [ ] Documentazione aggiornata.
- [ ] docs/CHANGELOG.md aggiornato.
- [ ] npm run lint passato.
- [ ] npx tsc --noEmit passato.
- [ ] npm run build passato.
- [ ] Browser check desktop/mobile se cambia UI.