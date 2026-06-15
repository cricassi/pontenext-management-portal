# M9 Final Hardening Checklist

Data: 2026-06-16

## Scope

- [x] Nessuna nuova funzionalita' introdotta
- [x] Nessuna migration creata
- [x] Nessuna modifica Supabase
- [x] Nessuna modifica Vercel
- [x] Nessun dato live modificato
- [x] Nessuna email reale inviata

## Sicurezza applicativa

- [x] Route admin protette da middleware/layout
- [x] `requireActiveAdmin()` presente prima dei fetch/action sensibili
- [x] Nessuna service role key lato client
- [x] Nessuna API key reale nel repository
- [x] Resend solo server-side
- [x] Export protetti
- [x] Header export `no-store` e `nosniff`
- [x] Nessuna cancellazione fisica applicativa rilevata

## Supabase

- [x] Progetto `PonteNext` verificato in sola lettura
- [x] Migration live `001`-`010` verificate
- [x] Tabelle applicative M0-M8 presenti
- [x] RLS attiva su tutte le tabelle applicative
- [x] Policy solo per admin attivi
- [x] Nessuna policy `DELETE`
- [x] Funzioni SQL con `search_path` esplicito
- [x] Security Advisor eseguito
- [x] Performance Advisor eseguito

## Auth

- [x] Login page live accessibile
- [x] Route admin senza sessione reindirizzano a `/login`
- [x] Guard admin verifica `status = active`
- [x] Guard admin verifica `archived_at is null`
- [x] Bootstrap `super_admin` documentato
- [ ] Auth redirect URLs verificati manualmente in dashboard Supabase
- [ ] Test live admin `inactive`/archiviato eseguito senza alterare dati reali

## Email

- [x] Nessun invio automatico
- [x] Conferma admin richiesta prima dell'invio
- [x] Resend env solo server-side
- [x] Nessuna API key esposta
- [x] Destinatari deduplicati
- [x] Nessuna email reale inviata in M9

## Export

- [x] `/reports` protetta
- [x] `/reports/export` protetta
- [x] CSV supportato
- [x] XLSX supportato
- [x] Nessun PDF
- [x] Nessun file scritto su disco
- [x] Limite export presente: `REPORT_ROW_LIMIT = 5_000`
- [x] Nessun accesso fuori RLS rilevato

## UI/UX

- [x] Login brandizzata live
- [x] Sidebar/header brandizzati presenti
- [x] Browser smoke desktop login senza overflow
- [x] Browser smoke mobile 390px login senza overflow
- [x] Browser smoke mobile redirect route protetta senza overflow
- [x] Nessun errore console rilevato nel browser smoke

## Performance

- [x] Build Next.js completata
- [x] Route dinamiche principali presenti in output build
- [x] Advisor performance letto
- [x] FK email senza indice documentate come raccomandazione
- [x] `unused_index` documentati come informativi

## Backup e migrazione

- [x] `docs/MIGRATION_AND_BACKUP.md` creato
- [x] Ordine migration attuale documentato
- [x] Seed necessari documentati
- [x] Bootstrap primo `super_admin` documentato
- [x] Variabili ambiente documentate
- [x] Backup/restore documentati
- [x] Rotazione chiavi documentata
- [x] Cambio provider email/hosting documentato

## Documentazione operativa

- [x] README aggiornato a M9
- [x] `docs/POST_DEPLOY_VERIFICATION_REPORT.md` creato
- [x] `docs/CODEX_INSTRUCTIONS.md` aggiornato
- [x] `docs/CHANGELOG.md` aggiornato
- [x] `docs/M9_HARDENING_REPORT.md` creato

## Verifiche

- [x] `npm run lint`
- [x] `npx tsc --noEmit`
- [x] `npm run build`
- [x] Supabase Security Advisor
- [x] Supabase Performance Advisor
- [x] Vercel live read-only
- [x] Browser check route principali read-only

## Esito

- [x] Blocker: nessuno
- [x] Important: documentati
- [x] Minor: documentati
- [x] Decisione finale: M9 approvata con raccomandazioni
