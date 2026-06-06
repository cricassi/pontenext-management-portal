# PonteNext Management Portal - M1 Checklist

## Scope

M1 implementa anagrafica soci e ruoli associativi.

Project ref Supabase:

```text
uhxfpsamenjhyrfgwckw
```

## Incluso

- [x] Migration `004_members_roles.sql`
- [x] Tabella `members`
- [x] Tabella `roles`
- [x] Tabella `member_roles`
- [x] Vincoli base su stati, campi obbligatori e range date
- [x] Indici per filtri, join e FK M1
- [x] Trigger `updated_at` sulle tre tabelle M1
- [x] RLS attiva sulle tre tabelle M1
- [x] Policy SELECT/INSERT/UPDATE per admin attivi
- [x] Nessuna policy DELETE
- [x] Seed ruoli base
- [x] CRUD soci
- [x] CRUD ruoli
- [x] Assegnazione ruoli ai soci
- [x] Chiusura/archiviazione assegnazioni ruolo
- [x] UI responsive desktop/mobile per soci
- [x] UI responsive desktop/mobile per ruoli
- [x] Service layer M1
- [x] Validazioni form M1

## Escluso

- [x] Nessuna tabella iscrizioni
- [x] Nessuna tabella quote
- [x] Nessuna tabella pagamenti
- [x] Nessun modulo sponsor
- [x] Nessun modulo eventi
- [x] Nessun modulo email
- [x] Nessun modulo report
- [x] Nessuna dashboard completa
- [x] Nessuna area soci
- [x] Nessuna contabilita'

## Migration live

- [x] Applicata solo migration M1 `004_members_roles`
- [x] Nessuna migration M2 o successiva applicata
- [x] Tabelle `membership_plans`, `memberships`, `payments` assenti
- [x] Tabelle sponsor/eventi/email/report assenti

## Seed ruoli base

- [x] Presidente
- [x] Vicepresidente
- [x] Segretario
- [x] Tesoriere
- [x] Consigliere
- [x] Socio Ordinario
- [x] Socio Sostenitore

## Validazione live Supabase

- [x] Progetto `PonteNext` verificato
- [x] Migration list verificata
- [x] Tabelle public verificate: `admin_users`, `members`, `roles`, `member_roles`
- [x] Colonne M1 verificate
- [x] RLS M1 verificata attiva
- [x] Policy M1 verificate
- [x] Trigger `updated_at` verificati
- [x] Seed ruoli verificato
- [x] Test transazionale insert socio + assegnazione ruolo riuscito con rollback
- [x] Verificato che il socio di validazione rollback non resta persistito
- [x] Verificato blocco accesso `anon` su `members`
- [x] Verificata lettura `roles` da `authenticated` con admin attivo simulato

## Advisory Supabase

- [x] Security Advisor rieseguito
- [x] Nessun nuovo warning SQL/RLS M1
- [x] Warning Auth residuo `auth_leaked_password_protection` ancora presente
- [x] Performance Advisor rieseguito
- [x] Advisory `unused_index` documentati come INFO attesi per indici appena creati

## Route M1

- [x] `/members`
- [x] `/members/new`
- [x] `/members/[id]`
- [x] `/members/[id]/edit`
- [x] `/settings`
- [x] `/settings/roles`

## Test manuale route M1

- [x] `/members` verificata senza sessione: `307` verso `/login`
- [x] `/members/new` verificata senza sessione: `307` verso `/login`
- [x] `/members/[id]` verificata senza sessione: `307` verso `/login`
- [x] `/members/[id]/edit` verificata senza sessione: `307` verso `/login`
- [x] `/settings` verificata senza sessione: `307` verso `/login`
- [x] `/settings/roles` verificata senza sessione: `307` verso `/login`
- [x] `/login` verificata: `200`
- [x] Responsive M1 verificato staticamente: liste soci e ruoli hanno tabella desktop e card mobile

## Verifiche locali

- [x] `npm run lint`
- [x] `npx tsc --noEmit`
- [x] `npm run build`
