# Migration and Backup

Data aggiornamento: 2026-09-19

## 1. Scopo del documento

Questo documento descrive come migrare, ricreare, fare backup e ripristinare PonteNext Management Portal.

La procedura copre repository, database Supabase, Auth, RLS/policy, provider email Resend e hosting Next.js.

Questa revisione consolida i dettagli utili della PR #35 nella guida corrente,
senza ripristinare il vecchio branch. Riferimento verificato: `main` al commit
`b6bc68e215743ba55eb82ad03b463879586d68b5`.
La verifica e' documentale, sulle migration e sui seed locali: non certifica
un nuovo backup, un restore eseguito o una nuova ispezione del database live.
Qualunque operazione descritta richiede autorizzazione, ambiente target
identificato e piano di recupero; questo documento non ne autorizza l'esecuzione.

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
- schema privato `app_private`, incluso l'helper RLS;
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

Definire prima del backup se preservare gli utenti Auth con una procedura
Supabase compatibile oppure ricrearli tramite Dashboard/Admin API. Identita',
conferme, hash password e sessioni non sono seed applicativi. Non stamparli e
non inserirli nel repository. Una ricreazione richiede nuove credenziali o un
recupero password controllato; non promette di conservare password e sessioni.

### Supabase RLS/policy

RLS e policy devono restare coerenti con la regola admin-only:

- RLS attiva su ogni tabella applicativa;
- policy per ruolo `authenticated`;
- accesso con `app_private.is_active_admin()`;
- nessuna policy `DELETE`, salvo decisione futura documentata.

Eccezione gia' prevista: la policy SELECT di `admin_users` consente anche la
lettura della propria riga. Non autorizza un admin inattivo/archiviato ad
accedere ai dati gestionali: il guard e le altre policy devono negarlo.

Controllare sia i grant alle tabelle e alle funzioni sia RLS: il permesso di
raggiungere una tabella via Data API non equivale al permesso di leggerne tutte
le righe. Conservare `app_private` fuori dagli schemi esposti, i privilegi
`USAGE`/`EXECUTE` necessari alle policy e il `search_path` sicuro delle funzioni.
Non usare service role per sostituire questi controlli nel runtime.

### Resend

Migrare solo configurazione operativa:

- account/provider;
- dominio verificato;
- record DNS richiesti dal provider e limiti di invio;
- mittente `EMAIL_FROM`;
- API key tramite variabile ambiente.

Non salvare chiavi API nel database o nel repository.

### Hosting Vercel o altro hosting Next.js

Migrare:

- project settings;
- repository collegato, branch di produzione e commit distribuito;
- build command;
- environment variables;
- dominio;
- redirect e runtime Next.js.

Non esporre variabili server-side al client.

## 3. Ricreazione progetto Supabase da zero

Procedura:

1. Creare nuovo progetto Supabase.
2. Salvare il nuovo project ref.
3. Configurare Auth (provider, conferma email, Site URL e redirect URL ammessi) e URL/anon key in `.env.local`.
4. Applicare solo le migration reali, in ordine.
5. Applicare i seed necessari.
6. Creare almeno un utente Supabase Auth.
7. Eseguire bootstrap del primo `super_admin`.
8. Verificare RLS, policy e funzioni SQL.
9. Eseguire login admin reale.
10. Verificare route protette e accesso negato per utenti non admin.

Non applicare placeholder futuri come se fossero migration operative.

Questa procedura inizializza un ambiente senza dati pregressi. Per recuperare
un ambiente popolato seguire le sezioni 8-10: non combinare automaticamente
replay delle migration, seed e import di un dump completo.

Il repository usa `database/migrations`, non `supabase/migrations`. Verificare
directory, ordine e progetto selezionato prima di qualsiasi comando CLI di
applicazione. Non usare `db reset` su un ambiente remoto come passaggio di setup.

## 4. Ordine migration attuale

Migration operative presenti nel repository, documentate come applicate nei
report M0-M9. Prima di intervenire confrontarle con lo storico del progetto
sorgente e del target, senza dedurre lo stato live dalla sola numerazione locale:

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

I file `011_audit_logs.sql`, `012_views.sql`, `013_rls_policies.sql` e `014_seed.sql`
sono placeholder/futuri nel repository verificato; non fanno parte del replay
operativo. Non modificare migration gia' applicate e non falsificare lo storico
per far apparire applicato un file. Confrontare nomi, contenuti e dipendenze,
non solo i timestamp eventualmente assegnati dalla piattaforma.

## 5. Seed necessari

Seed operativi:

```text
database/seeds/roles.sql
database/seeds/membership_plans.sql
```

Su un ambiente nuovo:

- `004_members_roles.sql` inserisce gia' i sette ruoli base: Presidente,
  Vicepresidente, Segretario, Tesoriere, Consigliere, Socio Ordinario,
  Socio Sostenitore;
- `membership_plans.sql` inizializza Ordinaria (30.00, 12 mesi), Agevolata
  (15.00, 6 mesi), Sostenitore (30.00, 12 mesi);
- nessun seed demo, password o utente Auth va caricato in produzione;
- non e' richiesto un seed email: preservare gli eventuali template esistenti.

Su un restore, preservare invece UUID e configurazioni della sorgente.
I seed usano upsert per nome: riapplicarli puo' cambiare quote, durata,
descrizioni e riattivare record archiviati. Non sono operazioni prive di effetti.
Inoltre il seed incluso in `004` genera UUID nuovi: importare successivamente
ruoli della sorgente puo' causare conflitti di nome o FK non valide.
Preferire il percorso schema+dati della sezione 9 per un recupero completo;
se si sceglie il replay, preparare e verificare su ambiente isolato una
riconciliazione esplicita degli UUID prima dell'import, senza riscrivere le
migration storiche o cancellare dati live.

## 6. Bootstrap primo super_admin

Prima creare/confermare l'utente in Supabase Dashboard, Authentication > Users,
oppure tramite Admin API da un ambiente controllato. Non e' prevista
registrazione pubblica o accesso per i soci.

Verificare l'identita' dell'operatore, sostituire nome/email segnaposto e usare
SQL Editor con privilegi owner o un canale amministrativo autorizzato.
L'upsert seguente concede `super_admin`, riattiva l'account e rimuove
l'archiviazione: eseguirlo soltanto per l'operatore approvato, non su tutti gli
admin durante un restore. Non inserire password nel SQL.

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

- una sola riga corrisponde all'utente Auth scelto, con `role = 'super_admin'`;
- login con email/password funziona;
- `public.admin_users.status = 'active'`;
- `archived_at is null`;
- utente Auth non presente in `admin_users` viene negato;
- admin `inactive` o archiviato viene negato.

Se un utente Auth e' stato ricreato con un nuovo UUID ma esiste gia' la sua
riga admin, non rilanciare alla cieca l'upsert: il vincolo univoco su email
puo' bloccarlo. Nel target riconciliare `auth_user_id` mantenendo invariato
`admin_users.id`, referenziato da pagamenti e campagne. Conservare gli stati
degli altri amministratori. Non modificare account reali solo per test negativi:
usare account di prova autorizzati in un ambiente isolato.

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
- Nessun segreto deve avere prefisso `NEXT_PUBLIC_` o essere riportato in log,
  screenshot, ticket e report; `.env.example` deve avere valori vuoti.
- Impostare separatamente Development, Preview e Production. URL e chiave
  pubblica Supabase devono appartenere allo stesso progetto.
- Dopo un cambio env eseguire una nuova build/deploy: le variabili pubbliche
  possono essere incorporate nel bundle durante la build.

## 8. Backup database

Prima scegliere il metodo e verificare copertura e disponibilita' nel piano
Supabase: backup gestito, PITR se abilitato, oppure dump logico. Il restore
gestito puo' richiedere downtime e sovrascrivere dati piu' recenti. I backup
database non includono i file conservati tramite Storage API, solo i relativi
metadati: se Storage viene usato, prevedere una copia separata degli oggetti.
Fonte: [Supabase Database Backups](https://supabase.com/docs/guides/platform/backups).

Contenuto da inventariare:

- schema e dati `public`, incluse righe archiviate e storico destinatari;
- schema `app_private`, funzioni, trigger, indici, vincoli, policy e grant;
- strategia dedicata per utenti Auth e loro identita';
- storico migration, commit, seed di riferimento, versioni Postgres/estensioni;
- configurazioni Auth, hosting e provider esterni, senza segreti nel report.

Il dump standard `supabase db dump` esclude schemi gestiti come `auth` e
`storage`; il dump predefinito non comprende dati o ruoli custom. La CLI
documenta opzioni separate per dati e ruoli. Un dump solo `public` non e' un
backup completo di PonteNext. Verificare copertura dell'artefatto e versione
CLI prima di scegliere i comandi, inclusa l'esportazione di `app_private`.
Fonte: [Supabase CLI db dump](https://supabase.com/docs/reference/cli/supabase-db-dump).

Non riportare connection string/password nella cronologia della shell o nei
log. Usare un canale sicuro per le credenziali e una destinazione assoluta
esterna al checkout, cifrata e accessibile solo agli operatori autorizzati.
Registrare data/ora UTC, sorgente, commit, versione strumenti, checksum,
copertura, retention, responsabile e obiettivi di perdita dati/downtime (RPO/RTO).
Un export CSV/XLSX dell'app non sostituisce un backup.

Fermare le scritture durante il backup finale di migrazione, oppure usare una
strategia di snapshot consistente verificata. Backup Auth e dati applicativi
devono corrispondere allo stesso stato logico. Provare periodicamente il
restore in un ambiente isolato; il solo completamento del dump non dimostra
che il recupero funzioni. Non includere dump o loro contenuti nei commit.

## 9. Restore database

### Scelta del percorso

- **Restore gestito nello stesso progetto:** approvare finestra e punto di
  ripristino, sospendere l'uso operativo, preservare un backup dello stato
  corrente e seguire la procedura Supabase. Non rieseguire poi tutte le
  migration o i seed su uno schema gia' ripristinato.
- **Restore logico schema+dati su nuovo progetto:** preferibile per recuperare
  uno stato popolato preservando UUID e configurazioni. Validare compatibilita'
  di Postgres/estensioni/ruoli; usare un target isolato senza tabelle applicative
  gia' inizializzate. Seguire la procedura ufficiale adatta all'artefatto.
- **Replay migration + import dati:** percorso alternativo, non aggiuntivo al
  dump schema. Richiede la riconciliazione dei seed descritta nella sezione 5
  e un piano specifico per Auth, FK e trigger. Non e' una procedura automatica.

La guida [Supabase Backup and Restore](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
documenta anche il recupero separato dello storico migration e considerazioni
sui trigger. Non copiare un comando di restore senza valutarne gli effetti:
la modalita' `session_replication_role = replica` puo' disattivare controlli
basati su trigger, inclusi quelli di integrita'.

### Controlli durante il recupero

1. Identificare esplicitamente source e target; verificare backup, checksum e
   autorizzazione. Non usare produzione per una prova.
2. Ripristinare lo schema con un solo percorso scelto sopra; verificare anche
   `app_private`, proprietari, privilegi e `search_path`.
3. Ripristinare/ricreare Auth prima dei dati che lo referenziano. Conservare
   gli UUID dove supportato; altrimenti preparare una mappa protetta nel target.
4. Importare `admin_users` prima di pagamenti/template/campagne. Preservare
   il suo `id` applicativo e collegare `auth_user_id` all'utente Auth corretto.
5. Importare gli altri dati rispettando FK, UUID, record archiviati e storico.
   Arrestare l'import al primo errore; non proseguire con un restore parziale.
6. Verificare e riconciliare lo storico migration rispetto allo schema
   effettivamente recuperato, senza applicare placeholder o seed superflui.
7. Controllare trigger, vincoli, conteggi e totali prima di collegare l'app.
8. Verificare grant/Data API, RLS e policy con sessioni non privilegiate.
9. Eseguire login admin reale e smoke test delle route prima della riapertura.

Il piano di import deve considerare gli effetti dei trigger: importare
`payments` puo' ricalcolare `paid_amount`, `payment_status` e `updated_at`;
importare contributi evento storici puo' fallire se lo sponsor, l'evento o il
legame sono ormai archiviati. Conservare questi dati, senza riattivarli per
aggirare i controlli. Provare una procedura di restore approvata che preservi
lo storico; se sospende trigger nella sola sessione di recupero, verificarne
la riattivazione e l'integrita' risultante prima di aprire il target all'app.
Non disabilitare RLS per risolvere errori di accesso.

Non considerare il restore valido senza login admin reale riuscito.

## 10. Migrazione dati verso nuovo Supabase

Passi:

1. Congelare modifiche operative durante la finestra di migrazione.
2. Eseguire backup sorgente.
3. Creare progetto target.
4. Scegliere ed eseguire un solo percorso di restore della sezione 9.
5. Verificare Auth e collegamenti admin, quindi i dati e le dipendenze importate.
6. Confrontare conteggi, UUID, storico rinnovi, stati e totali con il backup sorgente.
7. Aggiornare `.env.local` e variabili ambiente hosting.
8. Verificare RLS/policy/funzioni.
9. Verificare login e route protette.
10. Eseguire test export/email senza invii reali.
11. Aggiornare DNS/hosting solo dopo verifica.

Attenzione: gli UUID Auth cambiano se gli utenti vengono ricreati. In quel caso `admin_users.auth_user_id` deve essere riallineato.

Ordine di dipendenza per un import manuale con vincoli attivi (non sostituisce
la procedura Auth dedicata o la gestione dei trigger della sezione 9):

```text
Auth -> admin_users
roles + members -> member_roles
members + membership_plans -> memberships -> payments
sponsors + events -> event_sponsors -> sponsor_contributions
admin_users -> email_templates -> email_campaigns -> email_campaign_recipients
```

`payments` dipende anche da `admin_users`; i destinatari campagna possono
referenziare `members` o `sponsors`. Preservare le FK nullable e l'intero
storico delle memberships, senza accorpare rinnovi o modificare date/quote.

### Cutover e rollback

Definire responsabile, finestra operativa, criterio di riuscita e termine per
il ritorno alla sorgente. Conservare la sorgente senza nuove scritture e la
configurazione precedente in un archivio sicuro, mai in Git. Spostare traffico
solo dopo i controlli della sezione 14, poi monitorare errori e accessi.

In caso di fallimento prima della riapertura, ripristinare collegamento hosting
e dominio alla sorgente, verificando anche le env incorporate nella build.
Se il target ha gia' ricevuto nuove scritture, fermarle e pianificare una
riconciliazione: un semplice cambio di URL perderebbe i nuovi dati. Non
tenere due ambienti scrivibili contemporaneamente e non eliminare la sorgente
finche' il recupero e la conservazione del backup non sono approvati.

## 11. Rotazione chiavi

Ruotare:

- Supabase anon key se compromessa;
- Supabase service role key se usata fuori controllo;
- `RESEND_API_KEY` se sospetta o scaduta;
- credenziali Vercel/team se necessario;
- password database e token di automazione GitHub/deploy, quando coinvolti.

Dopo rotazione:

- aggiornare variabili ambiente locali e deploy;
- redeployare;
- verificare login;
- verificare export;
- verificare stato provider email senza inviare campagne reali;
- rimuovere vecchie chiavi.

Per una rotazione pianificata, verificare se il tipo di chiave consente
sovrapposizione temporanea e aggiornare tutti i consumatori prima della revoca.
In caso di compromissione privilegiare la revoca tempestiva e accettare, se
necessario, downtime controllato. Valutare l'impatto sulle sessioni Auth.
Non scambiare tipi di chiave senza verificarne compatibilita' con i client.

## 12. Cambio provider email

Cambio provider ammesso solo con decisione documentata.

Da aggiornare:

- service provider email server-side;
- variabili ambiente;
- documentazione;
- eventuali domini/mittenti verificati;
- gestione errori invio;
- report M7/M9 se impattati.

La migration `010_email.sql` impone `email_campaigns.provider = 'resend'`.
Cambiare una env non basta: un cambio provider richiede una decisione separata,
adattamento del service e valutazione del vincolo con una futura migration
approvata. Non riscrivere `010` e non alterare lo storico per attribuire al
nuovo provider invii precedenti. Preservare snapshot destinatari, stati e
identificativi provider; non ritentare automaticamente campagne ripristinate.

Regole invarianti:

- nessun invio automatico senza conferma admin;
- nessuna API key nel browser;
- nessuna API key nel database;
- nessun valore segreto committato.

## 13. Cambio hosting

Per spostare da Vercel ad altro hosting Next.js:

- verificare supporto Next.js App Router;
- verificare supporto server-side, Server Actions ed endpoint export: un
  hosting solo statico non e' sufficiente;
- configurare build command `npm run build`;
- configurare runtime Node compatibile;
- impostare variabili ambiente;
- configurare dominio;
- verificare middleware e cookie Supabase SSR;
- verificare route protette.

Usare versioni e lockfile del repository (`npm ci` prima delle verifiche).
Per un runtime Node tradizionale il comando applicativo e' `npm run start`
dopo la build; su Vercel usare l'integrazione Next.js. Verificare dominio/HTTPS,
Site URL e redirect Auth ammessi, cookie/sessioni e corrispondenza tra commit
atteso e deploy di produzione. I segreti vanno trasferiti attraverso il
provider hosting o il secret manager, non esportati in file versionati.

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

Confrontare inoltre conteggi e UUID per tabella, righe archiviate, periodi
storici delle iscrizioni e FK senza orfani. Verificare che `paid_amount`
corrisponda alla somma dei payments non archiviati e che lo stato pagamento
sia coerente, incluso `paid` con quota prevista e pagato entrambi a zero.
Controllare contributi con/senza evento e snapshot/stati delle campagne.

Verificare con sessioni appropriate, non solo come owner/service role:
nessun dato gestionale anonimo o accessibile a un non admin; rispettare
l'eccezione di lettura della propria riga `admin_users`. Controllare grant e
privilegi predefiniti del target, funzioni SQL con `search_path` sicuro e
Security Advisor. Provare `/dashboard`, `/members`, `/memberships`,
`/expirations`, `/sponsors`, `/events`, `/email`, `/reports` e protezione di
`/reports/export`, senza creare dati o inviare email reali.

Registrare esito, operatore e anomalie senza dati personali. Se un test non e'
stato eseguito indicarlo come non verificato; un login riuscito non dimostra
da solo la completezza dei dati ripristinati.

## 15. Rischi

- Perdita relazione tra `auth.users.id` e `admin_users.auth_user_id`.
- Restore parziale con RLS disattivata.
- Dump contenente dati personali salvato in posizione non protetta.
- Service role key esposta al client.
- API key Resend committata per errore.
- Placeholder migration applicati come migration operative.
- Redirect Auth non configurati sul nuovo dominio.
- Invio email reale durante test.
- Perdita di `app_private`, grant o storico migration in un dump incompleto.
- Sovrascrittura di personalizzazioni e UUID con seed riapplicati.
- Alterazione dello storico per effetto dei trigger durante l'import.
- Perdita di nuove scritture con rollback non riconciliato.

## 16. Checklist operativa

- [ ] Identificato ambiente sorgente.
- [ ] Identificato ambiente target.
- [ ] Responsabile, finestra, RPO/RTO e rollback approvati.
- [ ] Scelto percorso: ambiente vuoto, restore gestito, schema+dati o replay+import.
- [ ] Backup creato e cifrato.
- [ ] Copertura Auth, `public`, `app_private` e configurazioni verificata.
- [ ] Checksum e restore di prova verificati in un ambiente isolato.
- [ ] Commit applicativo annotato.
- [ ] Schema `001`-`010` ricostruito o ripristinato, senza doppia applicazione.
- [ ] Storico migration riconciliato con lo schema effettivo.
- [ ] Placeholder `011`+ non applicati.
- [ ] Seed ruoli/piani applicati solo su ambiente vuoto; UUID/configurazioni sorgente preservati nel restore.
- [ ] Utenti Supabase Auth verificati.
- [ ] Admin collegati ad Auth; bootstrap limitato al primo admin autorizzato se necessario.
- [ ] `admin_users.id`, FK e storico applicativo preservati.
- [ ] Conteggi, totali pagamenti, stati email e trigger verificati.
- [ ] `.env.local` creato localmente e non committato.
- [ ] Variabili hosting configurate.
- [ ] RLS verificata attiva.
- [ ] Policy admin-only verificate.
- [ ] Grant/Data API, eccezione SELECT admin e funzioni hardened verificati.
- [ ] Login admin reale riuscito.
- [ ] Test negativi Auth eseguiti su account autorizzati senza alterare utenti reali.
- [ ] Route protette verificate.
- [ ] Export verificato senza file su disco.
- [ ] Email verificata senza invii reali.
- [ ] Chiavi rotate se necessario.
- [ ] Traffico spostato dopo verifica; nessun doppio ambiente scrivibile.
- [ ] Sorgente mantenuta disponibile per rollback nel periodo approvato.
- [ ] Dump e segreti rimossi da postazioni non autorizzate.
