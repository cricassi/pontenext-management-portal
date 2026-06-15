# Post-Deploy Verification Report

Data verifica: 2026-06-16

## URL Vercel verificato

```text
https://pontenext-management-portal.vercel.app
```

## Esito complessivo

Esito: **approvato con raccomandazioni**.

Il deploy live risponde, la login brandizzata e' accessibile e le route admin verificate senza sessione reindirizzano a `/login`. Non sono state eseguite modifiche a Vercel, Supabase o dati live. Non sono state inviate email reali.

## Configurazione verificata

Verifica statica repository:

- Next.js App Router presente;
- build command locale `npm run build` valido;
- `.env.example` contiene:
  - `NEXT_PUBLIC_SUPABASE_URL=`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=`
  - `SUPABASE_SERVICE_ROLE_KEY=`
  - `RESEND_API_KEY=`
  - `EMAIL_FROM=`
- nessun valore reale di chiavi API individuato nel repository;
- `RESEND_API_KEY` usata solo lato server in `src/services/email-provider.service.ts`;
- nessun uso di service role key in `src`.

Le variabili reali Vercel non sono state lette o stampate.

## Routing online

Verifica HTTP read-only:

| Route | Esito |
| --- | --- |
| `/login` | `200` |
| `/dashboard` | `307` verso `/login?next=%2Fdashboard` |
| `/members` | `307` verso `/login?next=%2Fmembers` |
| `/memberships` | `307` verso `/login?next=%2Fmemberships` |
| `/expirations` | `307` verso `/login?next=%2Fexpirations` |
| `/sponsors` | `307` verso `/login?next=%2Fsponsors` |
| `/events` | `307` verso `/login?next=%2Fevents` |
| `/email` | `307` verso `/login?next=%2Femail` |
| `/reports` | `307` verso `/login?next=%2Freports` |
| `/reports/export` | `307` verso `/login?next=%2Freports%2Fexport` |

## Auth online

Verificato senza scrivere dati:

- login page raggiungibile;
- route admin senza sessione protette;
- middleware reindirizza a `/login`;
- `requireActiveAdmin()` presente nel layout admin e nelle route/action sensibili.

Non sono stati alterati utenti reali per provare stati `inactive` o `archived`.

## Supabase online

Verifica read-only:

- progetto `PonteNext` attivo;
- migration operative live `001`-`010`;
- tabelle applicative M0-M8 presenti;
- RLS attiva sulle tabelle applicative;
- nessuna policy `DELETE`;
- funzioni SQL controllate con `search_path` esplicito.

## Resend

Verifica statica:

- provider Resend usato solo server-side;
- `RESEND_API_KEY` non ha prefisso `NEXT_PUBLIC_`;
- `EMAIL_FROM` configurabile via env;
- nessuna email reale inviata.

## UI/Brand

Browser check read-only:

- `/login` contiene brand Ponte Next;
- asset brand osservati;
- viewport mobile 390px senza overflow orizzontale sulla login;
- redirect mobile `/reports` verso login senza overflow;
- nessun errore console rilevato nel browser smoke test.

## Report/export

Verifica statica:

- `/reports/export` richiede `requireActiveAdmin()` prima di leggere `formData`;
- export CSV/XLSX generati in memoria;
- nessun PDF;
- `Cache-Control: no-store`;
- `X-Content-Type-Options: nosniff`;
- limite export documentato nel codice: `REPORT_ROW_LIMIT = 5_000`.

Non sono stati scaricati dati reali massivi.

## Sicurezza

Esito:

- nessuna chiave sensibile individuata nel repository;
- nessuna service role lato client;
- route admin protette;
- export protetto;
- Resend server-side.

Raccomandazione: abilitare in Supabase Auth la protezione password compromesse, segnalata dal Security Advisor.

## Verifiche tecniche

| Verifica | Esito |
| --- | --- |
| `npm run lint` | OK |
| `npx tsc --noEmit` | OK |
| `npm run build` | OK fuori sandbox; dentro sandbox `spawn EPERM` ambientale |
| Vercel live read-only | OK |
| Browser smoke read-only | OK |

## Problemi bloccanti

Nessuno.

## Problemi non bloccanti

- Supabase Security Advisor segnala `auth_leaked_password_protection` disabilitato.
- Supabase Performance Advisor segnala tre foreign key email senza indice dedicato.
- Molti warning `unused_index` sono informativi su schema giovane e poco popolato.

## Rischi residui

- Redirect URL Supabase Auth da verificare manualmente in dashboard se cambia dominio.
- Export fino a 5.000 righe da rivalutare dopo dati reali.
- Indici email da valutare in una futura migration di hardening performance.

## Raccomandazioni per M9 Hardening

- Abilitare leaked password protection da Supabase Auth.
- Pianificare indici su `email_templates.created_by`, `email_campaigns.created_by`, `email_campaigns.sent_by`.
- Mantenere aggiornata `docs/MIGRATION_AND_BACKUP.md`.

## Decisione finale

Deploy approvato: **si**, con raccomandazioni non bloccanti.
