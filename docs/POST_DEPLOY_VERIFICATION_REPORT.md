# POST_DEPLOY_VERIFICATION_REPORT.md

# PonteNext Management Portal - Post-Deploy Verification

Data verifica: 2026-06-15

Repository: `cricassi/pontenext-management-portal`

Branch locale verificato: `main` aggiornato da `origin/main`, poi branch
documentale `codex/post-deploy-verification`

Commit main verificato: `5680d3c26492815522f97cf78413b947f39011aa`

URL Vercel verificato: `https://management-portal.vercel.app`

Progetto Supabase verificato: `PonteNext`
(`uhxfpsamenjhyrfgwckw`)

Esito complessivo: **non approvato**

Decisione finale: **deploy approvato: no**

---

# 1. Sintesi esecutiva

La verifica post-deploy non puo' essere approvata per due problemi bloccanti:

1. L'URL Vercel live `https://management-portal.vercel.app` restituisce
   `500 Internal Server Error` su `/`, `/login` e sulle route admin protette.
2. La PR Brand Refresh `#36` risulta ancora aperta e non mergiata su `main`;
   quindi il repository `main` verificato non contiene il refresh grafico che il
   contesto considera completato.

Le verifiche locali su repository sono passate (`lint`, `typecheck`, `build`),
e Supabase live risulta attivo e coerente con le migration M0-M8. Tuttavia il
deploy pubblico non e' utilizzabile: login, routing, auth, dashboard, UI brand,
report/export e verifica Resend lato runtime non sono completabili online finche'
il 500 resta presente.

---

# 2. Vincoli rispettati

- Nessuna modifica a codice applicativo.
- Nessuna migration creata.
- Nessuna modifica al database Supabase.
- Nessuna modifica a dati live.
- Nessuna email reale inviata.
- Nessuna API key o secret stampata nel report.
- Query Supabase eseguite solo su metadata/schema o conteggi tecnici.

---

# 3. Configurazione Vercel

## Esito

Parzialmente verificata, con blocco runtime live.

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

## Limite verifica

Il connector Vercel non ha esposto strumenti callable in questa sessione e la
CLI `vercel` non risulta disponibile localmente. Di conseguenza non e' stato
possibile leggere direttamente dal progetto Vercel la lista delle variabili
ambiente configurate in Production.

Il 500 live rende comunque necessario controllare nel dashboard Vercel:

- framework preset Next.js;
- build command `npm run build` o equivalente;
- root directory corretta;
- presenza delle variabili richieste in Production;
- runtime logs del deployment associati agli `x-vercel-id` rilevati.

## Esposizione variabili sensibili nel client

Verifica locale:

- `SUPABASE_SERVICE_ROLE_KEY` non risulta usata in `src`.
- `RESEND_API_KEY` e `EMAIL_FROM` sono lette solo in
  `src/services/email-provider.service.ts`, lato server.
- Il bundle client locale `.next/static` non contiene i nomi:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `RESEND_API_KEY`
  - `EMAIL_FROM`
  - `service_role`

---

# 4. Routing online

## Esito

Fallito.

## Risultati HTTP live

Richieste read-only eseguite su `https://management-portal.vercel.app`.

| Route | Esito atteso senza sessione | Esito rilevato |
| --- | --- | --- |
| `/` | redirect/app shell o login | `500` |
| `/login` | `200` | `500` |
| `/dashboard` | redirect a `/login` | `500` |
| `/members` | redirect a `/login` | `500` |
| `/memberships` | redirect a `/login` | `500` |
| `/expirations` | redirect a `/login` | `500` |
| `/sponsors` | redirect a `/login` | `500` |
| `/events` | redirect a `/login` | `500` |
| `/email` | redirect a `/login` | `500` |
| `/reports` | redirect a `/login` | `500` |
| `/reports/export` | redirect a `/login` o errore autorizzativo controllato | `500` |
| `/favicon.ico` | asset favicon se configurato | `404` |

Header rilevato su `/login`:

- status: `500 Internal Server Error`
- server: `Vercel`
- body: vuoto
- esempio `x-vercel-id`: `fra1::g8wwj-1781560238003-ee83b25b58a7`

Il browser interno ha inoltre bloccato l'apertura della URL con
`net::ERR_BLOCKED_BY_CLIENT`; la verifica HTTP diretta conferma comunque il
problema server-side.

---

# 5. Auth online

## Esito

Non completabile.

## Dettagli

L'utente ha fornito credenziali admin reali per il test, ma non sono state
trasmesse perche' `/login` restituisce `500` prima di mostrare il form.

Verifiche non completabili online:

- login admin reale;
- redirect post-login;
- logout;
- utente non admin negato;
- admin `inactive` o `archived` negato.

Verifica statica locale:

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

Passato per le verifiche read-only eseguibili.

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

Parzialmente verificato.

## Verifica locale

- Provider implementato: Resend.
- `Resend` viene importato in `src/services/email-provider.service.ts`.
- `RESEND_API_KEY` viene letto solo via `process.env.RESEND_API_KEY`.
- `EMAIL_FROM` viene letto solo via `process.env.EMAIL_FROM`.
- Nessuna API key e' stata letta o stampata.
- Nessuna email reale e' stata inviata.

## Limite verifica

Non e' stato possibile verificare dal dashboard Vercel che `RESEND_API_KEY` ed
`EMAIL_FROM` siano presenti in Production per assenza di strumenti Vercel
callable nella sessione. Inoltre il 500 live impedisce di raggiungere la pagina
email o lo stato provider online.

---

# 8. UI / Brand

## Esito

Fallito / non verificabile online.

## Problema bloccante

La PR `#36` `UI Brand Refresh - PonteNext Visual Identity` risulta:

- stato: `open`;
- merged: `false`;
- head: `codex/ui-brand-refresh`;
- ultimo commit head: `42a7f34984d8b8eedb5b3f2fa924c15f64a5e659`;
- base `main`: `5680d3c26492815522f97cf78413b947f39011aa`.

Il `main` locale aggiornato contiene ancora la login pre-refresh e il
`CHANGELOG.md` parte da `1.0.0` M8, senza sezione Brand Refresh.

## Verifiche online non completabili

A causa del 500 su `/login` e sulle route admin non sono verificabili:

- login brandizzato;
- sidebar/header brandizzati;
- dashboard leggibile online;
- responsive mobile base online;
- asset logo/favicon online.

Nota: `favicon.ico` sul dominio live restituisce `404`.

---

# 9. Report / Export

## Esito

Fallito online.

## Dettagli

- `/reports` restituisce `500`.
- `/reports/export` restituisce `500`.
- Non e' stato avviato alcun download.
- Non sono stati scaricati dati reali massivi.

Verifica locale/statica:

- route `/reports` presente nel build Next.js;
- route `/reports/export` presente nel build Next.js;
- export implementato server-side;
- nessun file export viene scritto su disco secondo la review M8 precedente.

---

# 10. Sicurezza

## Esito

Parzialmente passato localmente, fallito online per indisponibilita' runtime.

## Verifiche passate

- Route admin protette staticamente da `requireActiveAdmin()`.
- Nessun uso applicativo locale di `SUPABASE_SERVICE_ROLE_KEY` in `src`.
- Resend lato server.
- Nessun nome di secret sensibile rilevato nel bundle client locale
  `.next/static`.
- Supabase RLS attiva sulle tabelle applicative.
- Nessuna policy `DELETE`.
- Accesso anonimo diretto ai dati negato su `public.members`.

## Verifiche non completabili

- Nessun errore console/network online: non completabile per 500 live e blocco
  browser `ERR_BLOCKED_BY_CLIENT`.
- Nessun errore server esposto all'utente: il body HTTP del 500 e' vuoto, ma
  resta necessario controllare i runtime logs Vercel.
- Nessuna variabile sensibile esposta dal deployment live: non verificabile in
  modo diretto senza accesso a configurazione/log Vercel.

---

# 11. Verifiche tecniche locali

Comandi eseguiti su `main` aggiornato:

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

# 12. Problemi bloccanti

## B1 - Vercel live restituisce 500 su `/login` e route principali

Impatto:

- applicazione non utilizzabile online;
- login admin non eseguibile;
- route protette non verificabili;
- UI/brand non verificabile;
- report/export non verificabile.

Evidenza:

- `https://management-portal.vercel.app/` -> `500`
- `https://management-portal.vercel.app/login` -> `500`
- route admin verificate -> `500`
- body risposta vuoto;
- server header: `Vercel`.

## B2 - Brand Refresh non e' su `main`

Impatto:

- il contesto "Brand Refresh completato" non coincide con lo stato reale di
  `main`;
- il deploy production potrebbe non puntare alla versione attesa;
- il report post-deploy non puo' approvare il brand refresh come pubblicato.

Evidenza:

- PR `#36` risulta aperta e non mergiata;
- `main` locale aggiornato e' fermo al merge PR `#34` M8;
- `docs/CHANGELOG.md` su `main` non contiene la sezione Brand Refresh.

## B3 - Configurazione Vercel/env Production non verificabile dal connector

Impatto:

- non e' possibile confermare direttamente la presenza in Vercel delle env:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `RESEND_API_KEY`
  - `EMAIL_FROM`
- il 500 live richiede verifica manuale o accesso ai runtime logs.

---

# 13. Problemi non bloccanti

- `favicon.ico` restituisce `404`; da sistemare dopo il ripristino runtime.
- Browser plugin interno blocca la URL live con `net::ERR_BLOCKED_BY_CLIENT`;
  la verifica HTTP diretta e' stata usata come fallback.
- Lint locale ha richiesto un secondo tentativo per timeout del primo run, ma e'
  poi passato senza errori.

---

# 14. Rischi residui

- Possibile disallineamento tra dominio production, branch deployato e PR
  Brand Refresh.
- Possibile mancanza o errata configurazione delle env Production in Vercel.
- Possibile errore runtime non visibile dal body HTTP e consultabile solo dai
  logs Vercel.
- Auth admin reale non verificata end-to-end online.
- Resend non verificato online, solo staticamente lato codice.
- Export non verificato online.

---

# 15. Raccomandazioni per M9 Hardening

1. Risolvere immediatamente il 500 Vercel consultando runtime logs del
   deployment production, usando gli `x-vercel-id` rilevati come riferimento.
2. Verificare nel dashboard Vercel le env Production richieste, senza esporre i
   valori:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `EMAIL_FROM`
3. Chiarire se il deploy da approvare e' production `main` o preview della PR
   `#36`.
4. Se Brand Refresh deve essere in production, mergiare PR `#36` e attendere il
   redeploy production prima di ripetere questa verifica.
5. Aggiungere un controllo smoke post-deploy automatico:
   - `/login` deve rispondere `200`;
   - route admin senza sessione devono reindirizzare a `/login`;
   - `/reports/export` senza sessione non deve esportare dati.
6. Aggiungere logging server controllato per errori runtime critici, senza
   stampare segreti.
7. Aggiungere favicon/logo production dopo il ripristino del runtime.
8. Considerare una pagina health server-side non sensibile per distinguere:
   - deploy raggiungibile;
   - env Supabase configurate;
   - provider email configurato;
   - database raggiungibile.

---

# 16. Checklist operativa post-deploy

- [x] Repository `main` aggiornato localmente.
- [x] Stato PR Brand Refresh verificato su GitHub.
- [x] URL Vercel live verificato via HTTP.
- [x] `/login` verificata via HTTP.
- [x] Route admin protette verificate via HTTP.
- [x] Supabase project status verificato.
- [x] Migration Supabase verificate.
- [x] RLS verificata su metadata.
- [x] Policy verificate su metadata.
- [x] Accesso anonimo diretto ai dati testato con query read-only.
- [x] Resend verificato staticamente lato server.
- [x] Bundle client locale controllato per nomi di secret sensibili.
- [x] `npm run lint`.
- [x] `npx tsc --noEmit`.
- [x] `npm run build`.
- [ ] Login admin reale online.
- [ ] Logout online.
- [ ] Dashboard online.
- [ ] UI/Brand online.
- [ ] Export online protetto.
- [ ] Variabili env Vercel Production verificate direttamente da dashboard/API.

