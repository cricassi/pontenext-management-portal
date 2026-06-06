# PonteNext Management Portal - M2 Checklist

## Scope

M2 implementa iscrizioni storiche, piani iscrizione e pagamenti non contabili.

Project ref Supabase:

```text
uhxfpsamenjhyrfgwckw
```

## Incluso

- [x] Migration `005_membership_plans.sql`
- [x] Migration `006_memberships_payments.sql`
- [x] Tabella `membership_plans`
- [x] Tabella `memberships`
- [x] Tabella `payments`
- [x] Vincoli base su importi, stati, metodi pagamento e range date
- [x] Indici per filtri, join e FK M2
- [x] Trigger `updated_at` sulle tre tabelle M2
- [x] Trigger/funzione per aggiornare `payment_status`
- [x] Trigger/funzione per ricalcolare `paid_amount`
- [x] RLS attiva sulle tre tabelle M2
- [x] Policy SELECT/INSERT/UPDATE per admin attivi
- [x] Nessuna policy DELETE
- [x] Seed piani iscrizione base
- [x] CRUD piani iscrizione
- [x] Creazione iscrizioni
- [x] Rinnovi storici tramite nuova riga `memberships`
- [x] Registrazione pagamenti non contabili
- [x] Archiviazione logica pagamenti
- [x] Annullamento/archiviazione logica iscrizioni
- [x] UI responsive desktop/mobile per iscrizioni
- [x] UI responsive desktop/mobile per pagamenti
- [x] Service layer M2
- [x] Validazioni form M2
- [x] Integrazione storico iscrizioni nella scheda socio

## Escluso

- [x] Nessun modulo sponsor
- [x] Nessun modulo eventi
- [x] Nessun modulo email
- [x] Nessun modulo report
- [x] Nessuna dashboard completa
- [x] Nessuna contabilita'
- [x] Nessun pagamento online
- [x] Nessuna fatturazione
- [x] Nessuna modifica alle membership esistenti per rappresentare rinnovi

## Regole M2

- [x] Ogni rinnovo crea una nuova riga in `memberships`
- [x] `members.status` resta solo stato anagrafico
- [x] Stato associativo e scadenze derivano da `memberships.end_date`
- [x] `paid_amount` deriva dai pagamenti non archiviati
- [x] `payment_status` deriva da `expected_fee` e `paid_amount`
- [x] Quote personalizzate supportate tramite `expected_fee`
- [x] Durate personalizzate supportate tramite `start_date` / `end_date`
- [x] Quota prevista pari a 0 ammessa solo con note nel form applicativo

## Migration live

- [x] Applicata migration `005_membership_plans`
- [x] Applicata migration `006_memberships_payments`
- [x] Applicato solo seed `database/seeds/membership_plans.sql`
- [x] Nessuna migration successiva a M2 applicata
- [x] Tabelle sponsor/eventi/email/report assenti

## Seed piani base

- [x] Ordinaria - 30.00 EUR - 12 mesi
- [x] Agevolata - 15.00 EUR - 6 mesi
- [x] Sostenitore - 30.00 EUR - 12 mesi

## Validazione live Supabase

- [x] Progetto `PonteNext` verificato
- [x] Migration list verificata
- [x] Tabelle M2 verificate
- [x] Colonne M2 verificate
- [x] RLS M2 verificata attiva
- [x] Policy M2 verificate
- [x] Trigger `updated_at` verificati
- [x] Trigger pagamento verificati
- [x] Seed piani verificato
- [x] Test transazionale pagamenti riuscito con rollback
- [x] Verificato che i dati di test non restano persistiti
- [x] Verificata assenza tabelle fuori scope M2

## Advisory Supabase

- [x] Security Advisor rieseguito
- [x] Nessun nuovo warning SQL/RLS M2
- [x] Warning Auth residuo `auth_leaked_password_protection` ancora presente
- [x] Performance Advisor rieseguito
- [x] Advisory `unused_index` documentati come INFO attesi per indici appena creati/non ancora usati

## Route M2

- [x] `/memberships`
- [x] `/memberships/new`
- [x] `/memberships/[id]`
- [x] `/settings/membership-plans`
- [x] `/members/[id]` con storico iscrizioni

## Test manuale route M2

- [x] `/login` verificata via Browser: heading `Accesso amministratori`, input email e password presenti
- [x] `/memberships` verificata senza sessione: redirect a `/login`
- [x] `/memberships/new` verificata senza sessione: redirect a `/login`
- [x] `/memberships/[id]` verificata senza sessione: redirect a `/login`
- [x] `/settings/membership-plans` verificata senza sessione: redirect a `/login`
- [x] Console browser verificata senza errori

Nota: il test route locale e' stato eseguito senza `.env.local` reale; il redirect verso login include `reason=missing_supabase_env`. La validazione live dei dati Supabase e' stata eseguita via MCP sul progetto `PonteNext`.

## Verifiche locali

- [x] `npm run lint`
- [x] `npx tsc --noEmit`
- [x] `npm run build`

Nota: `npm run build` nel sandbox ha completato la compilazione ma si e' fermato su `spawn EPERM`; la build e' stata rieseguita fuori sandbox ed e' terminata con successo.
