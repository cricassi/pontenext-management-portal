# M8 - Reports & Export Checklist

Data: 2026-06-09

Branch: `codex/m8-reports-export`

Progetto Supabase: `PonteNext`

Project ref: `uhxfpsamenjhyrfgwckw`

## Scope

- [x] Implementata route UI protetta `/reports`
- [x] Implementata route tecnica protetta `/reports/export`
- [x] Implementato service layer report
- [x] Implementato export CSV server-side
- [x] Implementato export XLSX server-side
- [x] Implementati filtri report
- [x] Implementata UI responsive report
- [x] Abilitata voce navigazione `Report`
- [x] Aggiornato changelog
- [x] Aggiornato report Supabase

## Report Disponibili

- [x] Report soci
- [x] Report iscrizioni
- [x] Report quote/pagamenti non contabili
- [x] Report scadenze
- [x] Report sponsor
- [x] Report contributi sponsor
- [x] Report eventi
- [x] Report campagne email

## Export

- [x] CSV con intestazioni sempre presenti
- [x] CSV UTF-8 con escaping valori
- [x] Mitigazione formula injection CSV
- [x] XLSX generato server-side in memoria
- [x] XLSX senza formule
- [x] Filename descrittivo senza dati personali
- [x] Header `Cache-Control: no-store`
- [x] Nessun PDF introdotto
- [x] Nessun file salvato su disco, database o storage

## Sicurezza

- [x] `/reports` chiama `requireActiveAdmin()` prima della preview
- [x] `/reports/export` chiama `requireActiveAdmin()` prima di leggere il form e generare il file
- [x] Query basate su Supabase server client autenticato
- [x] Nessun uso di service role per i report
- [x] Nessuna route pubblica di download
- [x] Nessuna API key esportata o letta
- [x] Nessun invio email automatico introdotto
- [x] Nessuna dashboard avanzata introdotta
- [x] Nessuna logica di fatturazione, IVA, prima nota o contabilita'

## Database / Supabase

- [x] Validato progetto live `PonteNext` in sola lettura
- [x] Confermate migration live fino a `010_email`
- [x] Confermate tabelle M0-M7 presenti
- [x] Confermata RLS attiva sulle tabelle applicative
- [x] Confermata assenza di policy `DELETE`
- [x] Confermata assenza di tabelle `reports`, `report_definitions`, `audit_logs`
- [x] Nessuna migration M8 creata
- [x] Nessuna migration applicata
- [x] Nessuna modifica Supabase eseguita

## Verifiche Locali

### npm run lint

Esito: OK.

```text
eslint --max-warnings=0 src middleware.ts next.config.mjs tailwind.config.ts postcss.config.js
```

### npx tsc --noEmit

Esito: OK.

### npm run build

Esito: OK fuori sandbox.

Nota:

- nel sandbox la build compila, ma la fase successiva fallisce con `Error: spawn EPERM`;
- rieseguita fuori sandbox, la build e' passata;
- l'output build conferma le route `/reports` e `/reports/export`.

### Dev Server / Browser Check

Esito: parziale positivo.

Comando usato:

```text
npm run dev -- --hostname 127.0.0.1 --port 3021
```

Nel sandbox `next dev` fallisce con:

```text
Error: spawn EPERM
```

Verifica ripetuta fuori sandbox con `Start-Job`, senza usare `Start-Process`.

Risultato:

```text
/reports senza sessione -> 307 /login
```

La route `/reports/export` e' stata verificata tramite analisi statica:

- `POST` chiama `requireActiveAdmin()` prima di `request.formData()`;
- `GET` chiama `requireActiveAdmin()` prima di restituire `405`.

## Out of Scope Verificato

- [x] Nessuna nuova tabella
- [x] Nessuna migration
- [x] Nessuna modifica database
- [x] Nessun report PDF
- [x] Nessuna dashboard avanzata
- [x] Nessun invio automatico email
- [x] Nessuna area soci
- [x] Nessuna fatturazione
- [x] Nessuna IVA
- [x] Nessuna prima nota

## Note Operative

- Gli export vuoti generano file validi con intestazioni.
- I record archiviati sono esclusi di default e includibili solo con filtro esplicito.
- Il report soci deriva lo stato associativo da `memberships`, non da `members.status`.
- Il report scadenze deriva le scadenze da `memberships.end_date`.
- Il report eventi usa `start_datetime` e `end_datetime` come campi canonici.
- Il body delle campagne email e gli errori provider dettagliati non sono inclusi nei report M8.
