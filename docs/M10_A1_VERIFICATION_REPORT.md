# M10-A1 Post-Merge Verification

Data verifica: 2026-09-21. Esito complessivo: **POSITIVO**.
Decisione finale: **M10-A1 completata: SI**. Nessun problema bloccante.

## Repository e Production

- PR #50 merged; main verificato: `70eb9db1bf261ac1aecd903f6c71cc646c1b221a`.
- Implementazione foundation presente, senza differenze applicative rispetto al commit finale della review `2faa4fe`.
- Deployment GitHub/Vercel Production `6578223532`, SHA identico a main; stato `success`, descrizione `Deployment has completed`, completamento `2026-09-21T21:11:31Z`. Questa e' l'evidenza del completamento Ready fornita dall'integrazione, senza modificare Vercel.
- Deployment Vercel: `E3VyebSM8WhiSbj1HiPQit7nkNJG`.
- Dominio verificato: https://pontenext-management-portal.vercel.app.
- `/settings/field-visibility` presente nella build e nel browser Production. Senza sessione reindirizza al login; dopo login super_admin mostra il catalogo.

## Migration e Database

Verifiche Supabase sul solo progetto PonteNext `uhxfpsamenjhyrfgwckw`, in lettura, salvo i tentativi Data API esplicitamente richiesti e negati.

| Migration | Versione registrata | Occorrenze | MD5 SQL normalizzato |
| --- | --- | --- | --- |
| 015_ui_field_visibility | 20260921195425 | 1 | 06744a30b53e6a153f44d58a02fdde1d |
| 016_lock_ui_field_visibility_foundation | 20260921205506 | 1 | 045fd1e5ec19cf7c9120158b53099274 |

SQL locale confrontato con il testo registrato usando terminatori LF e trim: corrispondente. Le migration 015 e 016 non sono state modificate o rieseguite.

- `public.ui_field_visibility` esiste, RLS attiva, zero righe prima e dopo i test.
- Unica policy: `ui_field_visibility_select_active_admin`, SELECT per authenticated con `app_private.is_active_admin()`.
- Authenticated dispone di SELECT, ma non di INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES o TRIGGER.
- Anon non dispone dei privilegi sulla tabella. Nessuna policy DELETE o policy di scrittura.

Conteggi letti alle 21:23:04 e 21:25:25 UTC, identici alla baseline della review:

| Tabella | Prima | Dopo |
| --- | ---: | ---: |
| admin_users | 2 | 2 |
| members | 105 | 105 |
| roles | 7 | 7 |
| member_roles | 3 | 3 |
| membership_plans | 3 | 3 |
| memberships | 6 | 6 |
| payments | 2 | 2 |
| sponsors | 2 | 2 |
| sponsor_contributions | 2 | 2 |
| events | 2 | 2 |
| event_sponsors | 0 | 0 |
| email_templates | 1 | 1 |
| email_campaigns | 0 | 0 |
| email_campaign_recipients | 0 | 0 |
| ui_field_visibility | 0 | 0 |

Nessuna operazione DML sulle tabelle business eseguita. I conteggi sono una verifica di consistenza numerica, non una prova crittografica di uguaglianza di ogni valore.

## Data API e Autorizzazione

Test con sessione utente reale super_admin attivo, client pubblico e senza service role:

| Verifica | Esito |
| --- | --- |
| SELECT super_admin | HTTP 200, zero righe |
| INSERT super_admin | HTTP 403, SQLSTATE 42501 |
| PATCH super_admin | HTTP 403, SQLSTATE 42501 |
| SELECT anonimo | HTTP 401, SQLSTATE 42501 |
| Tabella dopo i tentativi | Zero righe |

La sessione API temporanea e' stata chiusa. Credenziali, token e righe business non sono stati salvati nel report.

Limite esplicito: sul progetto sono presenti due super_admin attivi e nessun admin ordinario. Non e' stato creato un account ne' alterato un ruolo per un test HTTP/browser ordinario. Il rifiuto delle scritture per admin ordinario e' coperto dai test SQL isolati con identita' ordinaria e dai privilegi live revocati al comune ruolo `authenticated`; non viene dichiarato un login ordinario live mai eseguito.

## Applicazione e Regressioni

- Tutte le schermate del registro hanno `integrated = false`.
- In Production il super_admin vede il catalogo, ma switch, Salva e Ripristina sono disabilitati.
- Guard attivo prima delle letture; controllo ruolo server-side prima delle operazioni di configurazione. L'admin attivo puo' leggere il catalogo; non puo' modificarlo.
- Le richieste di salvataggio manomesse/non integrate sono rifiutate dai controlli server testati. Il blocco Data API rimane indipendente dalla UI.
- Nessun consumer del resolver nei moduli business: nessun campo operativo viene nascosto.
- Diff rispetto alla base pre-A1: nessun cambiamento a mapper FormData, update soci o altri moduli business. Members, memberships, payments, sponsors, events, email e reports invariati.
- Export M10-B coperto dalla suite sintetica di regressione; nessun workbook reale acquisito o esportato durante questa verifica.
- Nessun import Excel implementato. Nessuna email inviata.

## Verifiche Tecniche

Eseguite sul main post-merge indicato sopra:

| Comando / controllo | Esito |
| --- | --- |
| `npm run lint` | PASS |
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `node --require ./tests/register-typescript.cjs ./tests/field-visibility.test.ts` | PASS, 13 test |
| `node --require ./tests/register-typescript.cjs ./tests/field-visibility-db.test.ts` | PASS, 12 test runner, incluse 10 verifiche SQL |
| `node --require ./tests/register-typescript.cjs ./tests/data-export.test.ts` | PASS, 16 test sintetici |
| Browser Production: redirect anonimo, login autorizzato, catalogo bloccato | PASS |
| `git diff --check` | PASS prima del commit del report |

Suite SQL eseguita in PGlite isolato tramite `PGLITE_TEST_MODULE`; nessuna fixture o modifica business sul progetto live.

## Problemi Non Bloccanti e Passo Successivo

- Test browser/HTTP con admin ordinario live non eseguito per assenza dell'account; copertura alternativa descritta sopra.
- La verifica browser non sostituisce una prova su hardware Safari/iPhone.
- Restano valide le raccomandazioni gia' accettate per M10-B su timeout sincrono e limite dei dati normalizzati, senza regressioni introdotte dalla foundation.

M10-A1 resta intenzionalmente read-only. M10-A2.1 potra' iniziare soltanto dopo il merge di questa PR documentale, limitatamente ai soci e con RPC controllata. Non riaprire i grant INSERT/UPDATE diretti. Qualsiasi migration 017 live richiede il separato gate esplicito previsto dall'incarico.
