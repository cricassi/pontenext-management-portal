# POST_DEPLOY_VERIFICATION_REPORT.md

# PonteNext Management Portal - Post-Deploy Verification

Data verifica: 2026-06-16

Repository: `cricassi/pontenext-management-portal`

Branch report: `codex/post-deploy-verification`

Commit main locale verificato: `5680d3c26492815522f97cf78413b947f39011aa`

URL Vercel verificato: `https://pontenext-management-portal.vercel.app`

Progetto Supabase verificato: `PonteNext`
(`uhxfpsamenjhyrfgwckw`)

Esito complessivo: **approvato con riserva operativa**

Decisione finale: **deploy approvato: si', con raccomandazioni M9**

---

# 1. Sintesi esecutiva

La verifica e' stata rieseguita usando il dominio Vercel corretto:

`https://pontenext-management-portal.vercel.app`

Il deploy online risulta funzionante:

- `/login` e' accessibile;
- le route admin senza sessione reindirizzano a `/login`;
- il login admin reale funziona;
- il redirect post-login porta a `/dashboard`;
- le route principali autenticate caricano senza errori browser;
- logout funzionante;
- dopo logout `/dashboard` torna a `/login?next=%2Fdashboard`;
- Supabase live e' healthy e RLS risulta attiva;
- Resend risulta configurato nella UI Email senza inviare email reali;
- UI Brand Refresh visibile online;
- responsive mobile base verificato su dashboard.

Resta una riserva operativa: GitHub segnala ancora la PR `#36` Brand Refresh
aperta e non mergiata su `main`, mentre il dominio live mostra il refresh
grafico. Questo indica un possibile disallineamento tra branch/release sorgente
e deploy effettivamente pubblicato. Non blocca l'uso del deploy verificato, ma
va risolto prima di proseguire con M9.

---

# 2. Vincoli rispettati

- Nessuna modifica a codice applicativo.
- Nessuna migration creata.
- Nessuna modifica al database Supabase.
- Nessuna modifica a dati live.
- Nessuna email reale inviata.
- Nessuna API key o secret stampata.
- Export non scaricato.
- Query Supabase eseguite solo su metadata/schema o conteggi tecnici.

---

# 3. Configurazione Vercel

## Esito

Parzialmente verificata.

## Evidenze locali

- Framework atteso: Next.js.
- Versione locale: `next` `16.2.7`.
- Build command da `package.json`: `next build`.
- `vercel.json`: non presente, quindi non risultano override locali del build
  command.
- `.vercel/project.json`: non presente nella workspace locale.
- GitHub commit status per `main`:
  - context: `Vercel`
  - state: `success`
  - target: progetto Vercel `pontenext-management-portal`
- GitHub commit status per PR `#36`:
  - context: `Vercel`
  - state: `success`

## Variabili ambiente richieste

`.env.example` contiene i nomi attesi:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `EMAIL_FROM`

## Verifica indiretta runtime

Le env Vercel non sono state lette direttamente, ma il runtime online conferma
in modo indiretto:

- Supabase URL/anon key presenti, perche' login Supabase Auth e lettura
  `admin_users` funzionano online;
- Resend env presenti, perche' la pagina `/email` mostra provider Resend
  configurato;
- route server-side e build Next.js funzionanti sul dominio corretto.

## Limite verifica

Il connector Vercel non ha esposto strumenti callable in questa sessione e la
CLI `vercel` non risulta disponibile localmente. Di conseguenza non e' stato
possibile leggere direttamente dal progetto Vercel la lista delle variabili
ambiente configurate in Production.

## Esposizione variabili sensibili nel client

Verifica locale:

- `SUPABASE_SERVICE_ROLE_KEY` non risulta usata in `src`;
- `RESEND_API_KEY` e `EMAIL_FROM` sono lette solo in
  `src/services/email-provider.service.ts`, lato server;
- il bundle client locale `.next/static` non contiene i nomi:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `RESEND_API_KEY`
  - `EMAIL_FROM`
  - `service_role`

---

# 4. Routing online

## Esito

Passato.

## Risultati HTTP senza sessione

Richieste read-only eseguite su
`https://pontenext-management-portal.vercel.app`.

| Route | Esito atteso senza sessione | Esito rilevato |
| --- | --- | --- |
| `/` | redirect a login | `307` -> `/login?next=%2F` |
| `/login` | `200` | `200` |
| `/dashboard` | redirect a login | `307` -> `/login?next=%2Fdashboard` |
| `/members` | redirect a login | `307` -> `/login?next=%2Fmembers` |
| `/memberships` | redirect a login | `307` -> `/login?next=%2Fmemberships` |
| `/expirations` | redirect a login | `307` -> `/login?next=%2Fexpirations` |
| `/sponsors` | redirect a login | `307` -> `/login?next=%2Fsponsors` |
| `/events` | redirect a login | `307` -> `/login?next=%2Fevents` |
| `/email` | redirect a login | `307` -> `/login?next=%2Femail` |
| `/reports` | redirect a login | `307` -> `/login?next=%2Freports` |
| `/reports/export` | redirect a login | `307` -> `/login?next=%2Freports%2Fexport` |

Nota: `/favicon.ico` restituisce ancora `404`. Non e' bloccante, ma va
corretto in hardening/UI polish.

---

# 5. Auth online

## Esito

Passato per i casi testabili senza modificare dati live.

## Verifiche eseguite

- Login admin reale: passato.
- Redirect post-login: passato, arrivo su `/dashboard`.
- Ruolo visualizzato: `Super Admin`.
- Logout: passato, ritorno a `/login`.
- Protezione post-logout: passato, `/dashboard` reindirizza a
  `/login?next=%2Fdashboard`.

## Verifiche non eseguite

Non sono stati testati:

- utente Auth non admin;
- admin `inactive`;
- admin con `archived_at` valorizzato.

Motivo: non sono disponibili credenziali dedicate e il vincolo della verifica
impone di non modificare dati live.

## Verifica statica locale

- tutte le route admin passano dal layout `src/app/(admin)/layout.tsx`;
- il layout chiama `requireActiveAdmin()`;
- `requireActiveAdmin()` richiede:
  - sessione Supabase Auth valida;
  - record in `public.admin_users`;
  - `status = active`;
  - `archived_at is null`;
- in caso contrario esegue `redirect("/login")`.

---

# 6. Supabase online

## Esito

Passato.

## Progetto

- Nome: `PonteNext`
- Ref: `uhxfpsamenjhyrfgwckw`
- Regione: `eu-central-1`
- Stato: `ACTIVE_HEALTHY`
- Postgres: `17`

## Migration applicate

Risultano applicate:

1. `001_extensions`
2. `002_admin_users`
3. `003_harden_admin_functions`
4. `004_members_roles`
5. `005_membership_plans`
6. `006_memberships_payments`
7. `007_sponsors`
8. `008_events`
9. `009_sponsor_contributions`
10. `010_email`

## Tabelle e RLS

RLS risulta attiva sulle tabelle applicative:

- `admin_users`
- `members`
- `roles`
- `member_roles`
- `membership_plans`
- `memberships`
- `payments`
- `sponsors`
- `sponsor_contributions`
- `events`
- `event_sponsors`
- `email_templates`
- `email_campaigns`
- `email_campaign_recipients`

## Policy

Le policy rilevate sono coerenti con il modello admin attivi:

- policy `SELECT`, `INSERT`, `UPDATE` per le tabelle operative;
- nessuna policy `DELETE` rilevata sulle tabelle applicative verificate.

## Accesso anonimo

Una query read-only con `set local role anon` su `public.members` ha restituito
`permission denied`, confermando che l'accesso anonimo diretto ai dati non e'
concesso tramite Data API per quella tabella.

---

# 7. Resend

## Esito

Passato, senza invio reale.

## Verifica locale

- Provider implementato: Resend.
- `Resend` viene importato in `src/services/email-provider.service.ts`.
- `RESEND_API_KEY` viene letto solo via `process.env.RESEND_API_KEY`.
- `EMAIL_FROM` viene letto solo via `process.env.EMAIL_FROM`.
- Nessuna API key e' stata letta o stampata.

## Verifica online

- Pagina `/email` autenticata raggiunta.
- Provider Resend presente nella UI.
- Stato provider indicato come configurato.
- Nessuna azione di invio avviata.
- Nessuna email reale inviata.

---

# 8. UI / Brand

## Esito

Passato online, con riserva GitHub/main.

## Verifiche desktop

- `/login` accessibile.
- Titolo pagina: `PonteNext Management Portal`.
- Login brandizzato rilevato.
- Asset logo Ponte Next caricati.
- Nessun errore console su login.
- Nessun overflow orizzontale su login.
- Dashboard autenticata leggibile.
- Sidebar/header brandizzati visibili.
- Nessun errore console sulle route verificate.
- Nessuna immagine rotta sulle route verificate.

## Verifiche mobile base

Viewport testato: `390x844`.

- `/dashboard` mobile caricata.
- Menu mobile presente.
- Bottone `Esci` presente.
- Menu mobile apribile.
- Nessun overflow orizzontale prima dell'apertura menu.
- Nessun overflow orizzontale dopo apertura menu.
- Nessun errore console.

## Riserva

GitHub segnala ancora PR `#36` Brand Refresh aperta e non mergiata su `main`,
mentre il dominio live mostra il Brand Refresh. Questo va riallineato per
evitare che il prossimo deploy da `main` sovrascriva o perda il refresh.

---

# 9. Route autenticate verificate

Verifica browser autenticata, senza modificare dati:

| Route | H1 rilevato | Esito |
| --- | --- | --- |
| `/dashboard` | `Dashboard` | passato |
| `/members` | `Soci` | passato |
| `/memberships` | `Iscrizioni` | passato |
| `/expirations` | `Scadenze` | passato |
| `/sponsors` | `Sponsor` | passato |
| `/events` | `Eventi` | passato |
| `/email` | `Email` | passato |
| `/reports` | `Report` | passato |

Per tutte:

- sessione mantenuta;
- nessun testo di errore applicativo;
- nessun overflow orizzontale rilevato;
- nessuna immagine rotta rilevata;
- nessun errore console rilevante.

---

# 10. Report / Export

## Esito

Passato per route e protezione, senza download.

## Dettagli

- `/reports` senza sessione reindirizza a login.
- `/reports` autenticata carica correttamente.
- `/reports/export` senza sessione reindirizza a login.
- Non e' stato avviato alcun download.
- Non sono stati scaricati dati reali massivi.

---

# 11. Sicurezza

## Esito

Passato con riserve operative.

## Verifiche passate

- Route admin protette da redirect senza sessione.
- Login richiede admin attivo in `admin_users`.
- Logout invalida la sessione browser.
- Nessun accesso anonimo diretto a `public.members`.
- RLS attiva sulle tabelle applicative.
- Nessuna policy `DELETE`.
- Nessun uso applicativo locale di `SUPABASE_SERVICE_ROLE_KEY` in `src`.
- Resend lato server.
- Nessun nome di secret sensibile rilevato nel bundle client locale
  `.next/static`.
- Nessun errore console sulle pagine verificate.

## Riserve

- Env Vercel Production non lette direttamente per assenza tool Vercel/CLI.
- Utente non admin e admin inactive/archived non testati per evitare modifiche
  ai dati live.
- PR Brand Refresh non mergiata su `main`.

---

# 12. Verifiche tecniche locali

Comandi eseguiti su `main` aggiornato durante la prima stesura del report:

- `npm run lint`: passato al secondo tentativo. Il primo tentativo e' rimasto
  appeso fino al timeout senza emettere errori.
- `npx tsc --noEmit`: passato.
- `npm run build`: passato fuori sandbox.

Nota build:

- il primo `npm run build` in sandbox e' fallito per `EPERM` sulla cache
  Tailwind/Jiti in `%TEMP%`;
- il comando rilanciato fuori sandbox ha completato correttamente la build;
- le route attese risultano nel riepilogo build, inclusi:
  - `/login`
  - `/dashboard`
  - `/members`
  - `/memberships`
  - `/expirations`
  - `/sponsors`
  - `/events`
  - `/email`
  - `/reports`
  - `/reports/export`

---

# 13. Problemi bloccanti

Nessun problema bloccante rilevato sul dominio corretto.

---

# 14. Problemi non bloccanti

## NB1 - PR Brand Refresh ancora aperta

Impatto:

- il deploy live mostra il Brand Refresh;
- GitHub segnala pero' PR `#36` ancora aperta e non mergiata su `main`;
- il prossimo deploy da `main` potrebbe non corrispondere al live verificato.

Raccomandazione:

- chiarire se il dominio production sta puntando a `main`, a una preview o a un
  alias manuale;
- mergiare PR `#36` oppure riallineare `main` allo stato live prima di M9.

## NB2 - `favicon.ico` assente

`/favicon.ico` restituisce `404`.

Raccomandazione:

- aggiungere favicon coerente con asset Ponte Next.

## NB3 - Env Vercel non lette direttamente

Le env Production non sono state lette direttamente da dashboard/API Vercel.
La verifica runtime e' positiva, ma resta consigliato un check manuale dei nomi
variabile nel dashboard Vercel.

---

# 15. Rischi residui

- Disallineamento tra sorgente GitHub `main`, PR `#36` e deployment live.
- Assenza verifica diretta delle env Vercel Production.
- Casi auth negativi non testati con credenziali dedicate:
  - Auth user non admin;
  - admin inactive;
  - admin archived.
- Export endpoint non testato da autenticato per evitare download di dati reali.

---

# 16. Raccomandazioni per M9 Hardening

1. Riallineare GitHub `main` e deployment live, risolvendo lo stato PR `#36`.
2. Verificare nel dashboard Vercel, senza esporre valori, le env Production:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `EMAIL_FROM`
3. Aggiungere smoke test post-deploy automatici:
   - `/login` deve rispondere `200`;
   - route admin senza sessione devono reindirizzare a `/login`;
   - login admin dedicato di test in ambiente non production o con dati
     controllati;
   - `/reports/export` senza sessione non deve esportare dati.
4. Aggiungere una favicon Ponte Next.
5. Creare credenziali dedicate per test negativi auth senza alterare dati reali.
6. Aggiungere una pagina health server-side non sensibile per verificare:
   - deploy raggiungibile;
   - env Supabase configurate;
   - provider email configurato;
   - database raggiungibile;
   - nessun segreto esposto.

---

# 17. Checklist operativa post-deploy

- [x] Dominio corretto verificato:
  `https://pontenext-management-portal.vercel.app`.
- [x] `/login` accessibile.
- [x] Route admin senza sessione reindirizzano a login.
- [x] Login admin reale.
- [x] Redirect post-login.
- [x] Dashboard autenticata.
- [x] Route principali autenticate.
- [x] Logout.
- [x] Protezione post-logout.
- [x] Supabase project status verificato.
- [x] Migration Supabase verificate.
- [x] RLS verificata su metadata.
- [x] Policy verificate su metadata.
- [x] Accesso anonimo diretto ai dati testato con query read-only.
- [x] Resend verificato staticamente lato server.
- [x] Resend verificato online come configurato, senza invio.
- [x] UI Brand verificata online.
- [x] Responsive mobile base verificato.
- [x] Bundle client locale controllato per nomi di secret sensibili.
- [x] `npm run lint`.
- [x] `npx tsc --noEmit`.
- [x] `npm run build`.
- [ ] Utente Auth non admin negato.
- [ ] Admin inactive negato.
- [ ] Admin archived negato.
- [ ] Env Vercel Production verificate direttamente da dashboard/API.
- [ ] PR Brand Refresh riallineata a `main`.

