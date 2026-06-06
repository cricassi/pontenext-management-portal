# M1 Implementation Plan - Members & Roles

## Stato del documento

Questo documento prepara la milestone M1 senza avviarla operativamente.

Questa PR e' solo documentale:

- non scrive codice applicativo;
- non crea migration operative;
- non modifica il database;
- non applica nulla al progetto Supabase live.

## Scope preciso M1

M1 implementa solo il dominio anagrafica soci e ruoli associativi.

Incluso:

- tabella `members`;
- tabella `roles`;
- tabella `member_roles`;
- CRUD soci;
- CRUD ruoli;
- assegnazione ruoli ai soci;
- archiviazione tramite soft delete;
- validazioni client/server per i form M1;
- RLS sulle tre tabelle M1;
- UI responsive desktop/mobile per soci, ruoli e assegnazioni.

M1 parte dalla base gia' completata in M0.x:

- Supabase Auth funzionante;
- `admin_users` presente;
- login reale validato;
- route admin protette;
- helper RLS `app_private.is_active_admin()` disponibile;
- `public.set_updated_at()` hardened e disponibile per trigger `updated_at`.

## Out of scope

M1 non deve includere:

- iscrizioni;
- piani iscrizione;
- quote;
- pagamenti;
- scadenze;
- sponsor;
- eventi;
- email;
- report;
- dashboard completa;
- area soci;
- contabilita';
- fatturazione;
- ecommerce;
- pagamenti online.

In particolare:

- non salvare quote, durata, scadenza o stato associativo in `members`;
- non creare `membership_plans`, `memberships` o `payments`;
- non mostrare come dato reale `stato iscrizione`, `ultima scadenza` o rinnovi;
- non introdurre azioni `rinnova`, `registra pagamento` o simili.

## Tabelle coinvolte

### `members`

Anagrafica socio.

Campi previsti da `DATABASE_DESIGN.md`:

- `id uuid primary key default gen_random_uuid()`;
- `first_name text not null`;
- `last_name text not null`;
- `email text null`;
- `phone text null`;
- `address text null`;
- `city text null`;
- `postal_code text null`;
- `province text null`;
- `country text default 'Italia'`;
- `birth_date date null`;
- `fiscal_code text null`;
- `profession text null`;
- `notes text null`;
- `status text not null check in ('active', 'inactive', 'archived')`;
- `created_at timestamptz not null default now()`;
- `updated_at timestamptz not null default now()`;
- `archived_at timestamptz null`.

Regole M1:

- `members.status` indica solo stato anagrafico;
- lo stato associativo resta derivato dalle future `memberships`;
- l'archiviazione usa `archived_at`, non delete fisico;
- quando un socio viene archiviato, il servizio deve sincronizzare anche `status = 'archived'`;
- le query elenco standard devono escludere `archived_at is not null`, salvo viste/filtri archivio espliciti.

### `roles`

Ruoli associativi configurabili.

Campi previsti:

- `id uuid primary key default gen_random_uuid()`;
- `name text unique not null`;
- `description text null`;
- `is_default boolean default false`;
- `sort_order integer default 0`;
- `created_at timestamptz not null default now()`;
- `updated_at timestamptz not null default now()`;
- `archived_at timestamptz null`.

Regole M1:

- i ruoli archiviati non sono assegnabili a nuovi soci;
- i ruoli archiviati possono restare visibili nello storico assegnazioni;
- il nome ruolo deve essere univoco secondo la strategia definita in migration;
- il ruolo principale mostrato in lista soci non e' un campo persistito.

Ruolo principale proposto:

- tra i ruoli attivi del socio, scegliere quello con `sort_order` piu' basso;
- in caso di parita', ordinare per `name`;
- se non esistono ruoli attivi, mostrare uno stato vuoto.

### `member_roles`

Relazione storicizzata tra soci e ruoli.

Campi previsti:

- `id uuid primary key default gen_random_uuid()`;
- `member_id uuid not null references members(id)`;
- `role_id uuid not null references roles(id)`;
- `start_date date not null`;
- `end_date date null`;
- `notes text null`;
- `created_at timestamptz not null default now()`;
- `updated_at timestamptz not null default now()`;
- `archived_at timestamptz null`.

Regole M1:

- un socio puo' avere piu' ruoli contemporaneamente;
- lo stesso ruolo non deve essere assegnato due volte come attivo allo stesso socio;
- `end_date`, se valorizzata, deve essere maggiore o uguale a `start_date`;
- un'assegnazione attiva e' una riga con `archived_at is null`, `start_date <= current_date` e `end_date is null or end_date >= current_date`;
- rimuovere un ruolo da un socio significa chiudere l'intervallo o archiviare la relazione, non cancellarla.

### Tabelle solo referenziate

`admin_users` e' gia' parte di M0 e non e' una tabella di dominio M1.

In M1 viene usata solo indirettamente per:

- autorizzazione applicativa;
- helper RLS `app_private.is_active_admin()`;
- protezione delle route admin.

Non sono previste modifiche a `admin_users` in M1, salvo eventuale decisione esplicita futura sui permessi `super_admin` per la gestione ruoli.

## Migration previste

La migration M1 prevista e':

```text
database/migrations/004_members_roles.sql
```

Il file oggi e' un placeholder e non risulta applicato al progetto Supabase live `PonteNext`. Quando iniziera' l'implementazione M1, potra' essere sostituito con la migration reale se resta non applicato. Se un ambiente avesse gia' applicato il placeholder, non modificarlo: creare una nuova migration successiva.

Contenuto previsto della migration:

- creazione `public.members`;
- creazione `public.roles`;
- creazione `public.member_roles`;
- vincoli `check` sugli stati;
- vincolo `end_date >= start_date` su `member_roles`;
- foreign key `member_roles.member_id -> members.id`;
- foreign key `member_roles.role_id -> roles.id`;
- indici per elenco soci, ricerca, filtri stato e join ruoli;
- trigger `set_updated_at` sulle tre tabelle;
- abilitazione RLS sulle tre tabelle;
- policy RLS M1 per lettura e scrittura da admin attivi;
- nessuna policy DELETE.

Indici minimi consigliati:

- `members(status, archived_at)`;
- `members(last_name, first_name)`;
- `members(email)` dove `email is not null`;
- `roles(name)`;
- `roles(sort_order, name)`;
- `roles(archived_at)`;
- `member_roles(member_id)`;
- `member_roles(role_id)`;
- `member_roles(member_id, role_id)`;
- `member_roles(member_id, archived_at)`;
- indice unico parziale per impedire doppia assegnazione attiva dello stesso ruolo allo stesso socio.

Strategia unicita' da confermare in M1:

- `roles.name` e' documentato come `unique`;
- con soft delete, puo' essere preferibile un indice unico parziale sui ruoli non archiviati;
- `members.email` non e' documentato come univoco, quindi M1 non deve introdurre blocchi rigidi non approvati;
- eventuali duplicati email/codice fiscale possono essere segnalati come warning applicativo, non necessariamente errore bloccante.

Seed ruoli:

- `database/seeds/roles.sql` contiene gia' un placeholder;
- M1 puo' prevedere seed idempotente dei ruoli iniziali documentati;
- il seed resta limitato a `roles` e non crea soci, iscrizioni o pagamenti.

## Route previste

Route soci:

- `/members`: elenco soci, ricerca e filtri M1;
- `/members/new`: creazione socio;
- `/members/[id]`: scheda socio con dati anagrafici e ruoli;
- `/members/[id]/edit`: modifica socio.

Route ruoli:

- `/settings/roles`: gestione ruoli associativi.

Assegnazione ruoli:

- preferibilmente gestita nella scheda `/members/[id]`;
- non serve una route pubblica separata per `member_roles`;
- eventuali dialog/sheet di assegnazione devono restare dentro l'area admin protetta.

Route esplicitamente non previste in M1:

- `/members/[id]/memberships`;
- `/memberships`;
- `/expirations`;
- `/sponsors`;
- `/events`;
- `/email`;
- `/reports`.

Le voci di navigazione future possono restare disabilitate se gia' presenti nel layout M0, ma non devono diventare funzionali in M1.

## Componenti UI previsti

Componenti soci:

- `MemberTable.tsx`;
- `MemberCard.tsx`;
- `MemberForm.tsx`;
- `MemberDetail.tsx`;
- `MemberFilters.tsx`;
- `MemberStatusBadge.tsx`;
- `MemberRolesPanel.tsx`;
- `AssignRoleDialog.tsx`;
- `ArchiveMemberDialog.tsx`.

Componenti ruoli:

- `RoleTable.tsx`;
- `RoleForm.tsx`;
- `RoleBadge.tsx`;
- `ArchiveRoleDialog.tsx`.

Componenti riutilizzabili, se mancanti:

- `DataTable.tsx`;
- `EmptyState.tsx`;
- `LoadingState.tsx`;
- `ErrorState.tsx`;
- `ConfirmArchiveDialog.tsx`;
- `SearchInput.tsx`;
- `FilterBar.tsx`;
- `MobileFiltersSheet.tsx`;
- `StatusBadge.tsx`.

Componenti shadcn/ui presumibilmente necessari:

- `Table`;
- `Badge`;
- `Select`;
- `Textarea`;
- `Dialog`;
- `Sheet`;
- `DropdownMenu`;
- `Toast` o equivalente feedback.

Regole UI:

- file componenti React in `PascalCase.tsx`;
- desktop con tabella e filtri visibili;
- mobile con card e filtri avanzati in sheet;
- form con label sempre visibili;
- azioni distruttive solo come archiviazione con dialog di conferma;
- nessuna landing page o schermata marketing.

## Service layer previsto

Servizi di dominio:

- `src/services/members.service.ts`;
- `src/services/roles.service.ts`;
- `src/services/member-roles.service.ts`.

Tipi:

- `src/types/member.ts`;
- `src/types/role.ts`;
- aggiornamento dei tipi Supabase generati solo se previsto dalla milestone di implementazione.

Funzioni previste per soci:

- `getMembers()`;
- `getMemberById()`;
- `createMember()`;
- `updateMember()`;
- `archiveMember()`;
- `restoreMember()`, solo se viene prevista una vista archivio;
- `getMemberRoles()`.

Funzioni previste per ruoli:

- `getRoles()`;
- `getAssignableRoles()`;
- `getRoleById()`;
- `createRole()`;
- `updateRole()`;
- `archiveRole()`.

Funzioni previste per assegnazioni:

- `assignRoleToMember()`;
- `updateMemberRoleAssignment()`;
- `endMemberRoleAssignment()`;
- `archiveMemberRoleAssignment()`;
- `getActiveRolesForMember()`;
- `getPrimaryRoleForMember()`.

Server actions:

- usare actions route-scoped sotto `src/app/(admin)/members` e `src/app/(admin)/settings/roles`, oppure pattern equivalente coerente con M0;
- ogni action deve rieseguire controllo admin server-side, non fidarsi del client;
- ogni action deve usare service layer, non query Supabase duplicate nei componenti.

Regole service:

- nessun delete fisico;
- tutte le query standard filtrano `archived_at is null`;
- nessuna funzione M1 legge o scrive `memberships`;
- gli errori devono essere messaggi operativi per la UI.

## Validazioni

### Soci

Validazioni obbligatorie:

- `first_name` richiesto, trim, lunghezza ragionevole;
- `last_name` richiesto, trim, lunghezza ragionevole;
- `email` opzionale ma, se presente, formato email valido;
- `phone` opzionale, trim, formato permissivo;
- `postal_code` opzionale, formato compatibile con uso italiano se `country = 'Italia'`;
- `province` opzionale, preferibilmente 2 caratteri per Italia;
- `birth_date` opzionale, non futura;
- `fiscal_code` opzionale, normalizzato uppercase se presente;
- `status` solo `active`, `inactive`, `archived`;
- `country` default `Italia`.

Validazioni di dominio:

- non bloccare soci senza email;
- non usare `members.status` come stato iscrizione;
- non salvare scadenze o quote nella tabella socio;
- archiviazione tramite `archived_at`.

### Ruoli

Validazioni obbligatorie:

- `name` richiesto, trim, non vuoto;
- `name` univoco secondo vincolo migration;
- `description` opzionale;
- `sort_order` intero maggiore o uguale a `0`;
- `is_default` booleano.

Validazioni di dominio:

- non assegnare ruoli archiviati;
- archiviazione ruolo con conferma se esistono assegnazioni attive;
- mantenere storico assegnazioni esistenti.

### Assegnazioni ruolo

Validazioni obbligatorie:

- `member_id` richiesto e riferito a socio non archiviato;
- `role_id` richiesto e riferito a ruolo non archiviato;
- `start_date` richiesta;
- `end_date` opzionale;
- `end_date >= start_date` quando valorizzata;
- nessuna doppia assegnazione attiva dello stesso ruolo allo stesso socio.

Validazioni di dominio:

- piu' ruoli diversi contemporanei sono ammessi;
- chiudere un ruolo usa `end_date` o archiviazione relazione;
- non creare record in tabelle di iscrizione.

## RLS previste

RLS deve essere abilitata su:

- `public.members`;
- `public.roles`;
- `public.member_roles`.

Policy baseline coerente con `DATABASE_DESIGN.md`:

- `SELECT` consentito solo a utenti autenticati che risultano admin attivi;
- `INSERT` consentito solo ad admin attivi;
- `UPDATE` consentito solo ad admin attivi;
- nessuna policy `DELETE`;
- nessun accesso anonimo;
- nessuna tabella pubblica.

Helper previsto:

- usare l'helper esistente `app_private.is_active_admin()`;
- non reintrodurre funzioni security definer nello schema `public`;
- ogni nuova funzione eventuale deve avere `search_path` esplicito e privilegi minimi.

Nota permessi ruoli:

- la documentazione attuale richiede scrittura da admin attivi;
- se si decide che il CRUD ruoli debba essere solo `super_admin`, M1 deve documentare e implementare un helper dedicato, ad esempio `app_private.is_active_super_admin()`;
- questa scelta va confermata prima della migration M1 operativa.

## Test previsti

Verifiche locali:

- `npm run lint`;
- `npm run build`;
- eventuale `npm test` se M1 introduce test runner.

Test unitari previsti:

- validazione form socio;
- validazione form ruolo;
- validazione assegnazione ruolo;
- calcolo ruolo principale;
- normalizzazione campi (`email`, `fiscal_code`, trim nomi).

Test service/integration previsti:

- creazione socio;
- modifica socio;
- archiviazione socio senza delete fisico;
- creazione ruolo;
- modifica ruolo;
- archiviazione ruolo;
- assegnazione ruolo a socio;
- blocco assegnazione duplicata attiva;
- chiusura assegnazione ruolo con `end_date`.

Test RLS previsti:

- anon non legge e non scrive;
- utente Auth non presente in `admin_users` non legge e non scrive;
- admin inattivo non legge e non scrive;
- admin archiviato non legge e non scrive;
- admin attivo legge e scrive secondo policy M1;
- assenza di policy DELETE.

Test UI/manuali previsti:

- `/members` protetta;
- elenco soci desktop;
- elenco soci mobile a card;
- creazione socio;
- modifica socio;
- archiviazione socio;
- `/settings/roles` protetta;
- creazione/modifica/archiviazione ruolo;
- assegnazione ruolo da scheda socio;
- navigazione keyboard base;
- messaggi errore e empty state.

Verifiche Supabase:

- migration list dopo apply M1;
- presenza sole tabelle M0 + M1;
- RLS attiva su tutte le tabelle M1;
- policy attese presenti;
- Security Advisor senza nuovi warning SQL/funzioni.

## Criteri di accettazione

M1 e' accettabile quando:

- il progetto resta avviabile in locale;
- `/members` mostra elenco soci con ricerca e filtri M1;
- e' possibile creare un socio con soli dati anagrafici richiesti;
- e' possibile modificare un socio;
- e' possibile archiviare un socio senza delete fisico;
- `members.status` resta solo anagrafico;
- non esistono campi quota/scadenza/iscrizione in `members`;
- `/members/[id]` mostra anagrafica e ruoli del socio;
- e' possibile assegnare un ruolo a un socio;
- e' possibile chiudere o archiviare una assegnazione ruolo;
- `/settings/roles` permette CRUD ruoli;
- i ruoli archiviati non sono assegnabili;
- RLS blocca anon, Auth-only, admin inattivi e admin archiviati;
- RLS consente accesso ad admin attivi;
- nessuna policy DELETE esiste sulle tabelle M1;
- UI desktop usa tabelle;
- UI mobile usa card e non tabelle ingestibili;
- lint e build passano;
- documentazione e checklist M1 risultano aggiornate nella PR di implementazione.

## Rischi

- Confusione tra `members.status` e stato associativo: M1 deve evitare qualsiasi logica di iscrizione.
- Lo screen flow cita colonne come ultima scadenza e stato iscrizione: in M1 vanno omesse o lasciate come funzionalita' futura non attiva.
- La gestione ruoli potrebbe essere considerata configurazione da `super_admin`: serve conferma prima di codificare permessi piu' restrittivi.
- La strategia di unicita' con soft delete va decisa prima della migration reale, soprattutto per `roles.name`.
- Senza vincoli adeguati, `member_roles` puo' contenere duplicati o intervalli incoerenti.
- Il seed ruoli iniziali puo' creare duplicati se non e' idempotente.
- Se vengono aggiunte nuove funzioni RLS senza hardening, il Security Advisor puo' tornare a segnalare warning.
- L'assenza attuale di test runner puo' allungare M1 se si decide di introdurre test automatizzati completi.
- UI responsive rischia regressioni se si implementa solo la tabella desktop senza card mobile.
- Archiviare ruoli con assegnazioni attive richiede una scelta UX chiara per non perdere storico o creare dati ambigui.

## Definition of Done documentale per avvio M1

Prima di iniziare codice o migration M1:

- rileggere questo documento;
- confermare permessi per CRUD ruoli (`admin` o solo `super_admin`);
- confermare strategia unicita' `roles.name` con soft delete;
- confermare se applicare seed ruoli iniziali in M1;
- preparare una PR M1 operativa separata da questa PR documentale.
