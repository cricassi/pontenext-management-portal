# M4 Post-Merge Verification Report

Data verifica: 2026-06-07

Repository: `cricassi/pontenext-management-portal`

Branch sorgente verificata: `main`

Commit `main` verificato: `621901b` (`Merge pull request #17`)

Progetto Supabase: `PonteNext`

Project ref: `uhxfpsamenjhyrfgwckw`

## Esito

Esito complessivo: **non superato / bloccato**.

Motivo: la PR M4 `#18` risulta ancora aperta e non mergiata al momento della
verifica.

Dettaglio GitHub rilevato:

```text
PR: #18
title: Avvia M4 Dashboard operativa
state: open
merged: false
base: main
head: codex/m4-dashboard
head_sha: b7dee1f
mergeable: true
```

Di conseguenza `main` contiene ancora la pagina `/dashboard` placeholder della
milestone M0, non la dashboard operativa M4.

## Vincoli rispettati

- Nessun codice applicativo modificato.
- Nessuna migration creata.
- Nessuna migration applicata.
- Nessuna modifica al database Supabase.
- Nessuna attivita' M5 avviata.
- Questo report e' solo documentale.

## Stato repository

### Route `/dashboard`

Esito: **presente**.

File rilevato:

```text
src/app/(admin)/dashboard/page.tsx
```

La build conferma la route dinamica:

```text
Route (app)
dynamic /dashboard
```

### Dashboard operativa M4

Esito: **non presente su `main`**.

Il file `src/app/(admin)/dashboard/page.tsx` contiene ancora contenuti M0:

- titolo pagina `Setup infrastruttura`;
- card `Autenticazione`;
- card `Route protette`;
- card `Schema M0`;
- card `Moduli futuri`;
- nota esplicita: `Questa pagina non include KPI, CRUD o funzioni operative`.

Non risultano presenti su `main`:

```text
src/services/dashboard.service.ts
src/types/dashboard.ts
src/components/dashboard/
```

### KPI M4 previsti

Esito: **non presenti su `main`**.

KPI richiesti non rilevati nella dashboard attuale:

- soci attivi;
- scadenze entro 30 giorni;
- membership scadute;
- quote non completamente pagate;
- nuovi soci ultimi 30 giorni;
- rinnovi ultimi 30 giorni.

### Widget M4 previsti

Esito: **non presenti su `main`**.

Widget richiesti non rilevati nella dashboard attuale:

- `Da gestire subito`;
- `Prossime scadenze`;
- `Ultimi rinnovi`.

### Azioni rapide

Esito: **non presenti nella dashboard su `main`**.

Azioni richieste non rilevate nella dashboard attuale:

- nuovo socio;
- nuova membership;
- rinnovo rapido.

Nota: le route e i flussi M1-M3 esistono nel portale, ma non sono esposti come
azioni rapide della dashboard M4 su `main`.

### Layout responsive

Esito: **non verificabile per M4 su `main`**.

Il layout admin e il placeholder M0 usano classi responsive, ma la UI M4
richiesta non e' presente. Non e' quindi possibile validare card KPI mobile,
tabelle desktop o card elenco mobile per la dashboard M4 sul branch `main`.

### Route protetta

Esito: **presente**.

La route `/dashboard` si trova sotto il gruppo admin:

```text
src/app/(admin)/dashboard/page.tsx
```

Il layout admin richiede un amministratore attivo tramite:

```text
src/app/(admin)/layout.tsx
requireActiveAdmin()
```

Se l'utente non e' configurato, autenticato e presente in `admin_users` come
admin attivo, il guard esegue redirect a `/login`.

## Stato Supabase live

Verifica eseguita in sola lettura sul progetto `PonteNext`.

Dettagli progetto:

```text
name: PonteNext
project_ref: uhxfpsamenjhyrfgwckw
region: eu-central-1
status: ACTIVE_HEALTHY
postgres: 17.6.1.127
```

Migration applicate:

```text
20260606113953  001_extensions
20260606114014  002_admin_users
20260606115133  003_harden_admin_functions
20260606124849  004_members_roles
20260606221810  005_membership_plans
20260606221954  006_memberships_payments
```

Esito:

- nessuna migration M4 applicata;
- nessuna migration successiva a M2 applicata;
- nessuna nuova tabella creata per M4.

Tabelle `public` live:

| Tabella | RLS |
| --- | --- |
| `admin_users` | attiva |
| `member_roles` | attiva |
| `members` | attiva |
| `membership_plans` | attiva |
| `memberships` | attiva |
| `payments` | attiva |
| `roles` | attiva |

Conteggi live:

| Tabella | Righe |
| --- | ---: |
| `admin_users` | 1 |
| `members` | 0 |
| `roles` | 7 |
| `member_roles` | 0 |
| `membership_plans` | 3 |
| `memberships` | 0 |
| `payments` | 0 |

Viste `public`:

```text
nessuna vista o materialized view presente
```

Tabelle fuori scope non presenti nel database live:

- `sponsors`;
- `events`;
- `sponsor_contributions`;
- `event_sponsors`;
- `email_templates`;
- `email_campaigns`;
- `email_campaign_recipients`;
- `reports`;
- `audit_logs`;
- `dashboard_stats`;
- `dashboard_kpis`.

## Sponsor, eventi, email, report

Esito: **nessun modulo attivo rilevato su `main`**.

Non risultano presenti route attive:

```text
src/app/(admin)/sponsors
src/app/(admin)/events
src/app/(admin)/email
src/app/(admin)/reports
src/app/email
```

Le uniche occorrenze sono link di navigazione disabilitati in:

```text
src/components/layout/navigation.ts
```

## Verifiche locali

Comandi eseguiti:

```text
npm run lint
npx tsc --noEmit
npm run build
```

Esiti:

- `npm run lint`: passato;
- `npx tsc --noEmit`: passato;
- `npm run build`: passato fuori sandbox.

Nota ambientale:

nel sandbox la build ha compilato correttamente ma si e' fermata con:

```text
Error: spawn EPERM
```

La build e' stata quindi rieseguita fuori sandbox e completata con successo.

## Matrice di verifica richiesta

| Verifica | Esito | Nota |
| --- | --- | --- |
| route `/dashboard` presente | OK | Route dinamica presente |
| dashboard operativa M4 presente | KO | PR #18 non mergiata; su `main` resta placeholder M0 |
| KPI previsti presenti | KO | KPI M4 assenti su `main` |
| widget M4 presenti | KO | Widget M4 assenti su `main` |
| azioni rapide presenti | KO | Azioni rapide M4 assenti su `main` |
| layout responsive M4 presente | KO | UI M4 assente su `main` |
| nessuna tabella/migration nuova | OK | Live Supabase fermo a migration `001`-`006` |
| nessun sponsor/evento/email/report | OK | Nessuna route attiva, link nav disabilitati |
| lint/build validi | OK | Lint, tsc e build passano |
| route protetta | OK | Layout admin usa `requireActiveAdmin()` |

## Decisione finale

La verifica post-merge M4 non puo' essere approvata finche' la PR #18 non viene
mergiata su `main`.

Prossimo passo consigliato:

1. mergiare PR #18;
2. aggiornare `main`;
3. rieseguire questa verifica sul commit di merge M4;
4. produrre un nuovo report con esito atteso positivo.
