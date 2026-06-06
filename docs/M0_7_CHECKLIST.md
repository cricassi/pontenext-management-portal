# M0_7_CHECKLIST.md

# PonteNext Management Portal - M0.7 Checklist

## Scope

M0.7 applica solo le migration M0 al progetto Supabase live `PonteNext`.

Project ref:

```text
uhxfpsamenjhyrfgwckw
```

## Migration applicate

- [x] `database/migrations/001_extensions.sql`
- [x] `database/migrations/002_admin_users.sql`

## Vincoli rispettati

- [x] Nessuna migration successiva applicata
- [x] Nessuna tabella soci creata
- [x] Nessun avvio M1
- [x] Nessun CRUD creato
- [x] Nessuna modifica al modello dati oltre M0

## Validazione live

- [x] Progetto Supabase `PonteNext` verificato
- [x] Project ref `uhxfpsamenjhyrfgwckw` usato
- [x] Migration list verificata dopo apply
- [x] `public.admin_users` esiste
- [x] Colonne `admin_users` verificate
- [x] Vincoli `admin_users` verificati
- [x] Trigger `set_admin_users_updated_at` verificato
- [x] Estensione `pgcrypto` verificata
- [x] Funzioni `set_updated_at` e `is_active_admin` verificate
- [x] RLS attiva su `admin_users`
- [x] Policy SELECT `admin_users_select_self_or_active_admin` presente
- [x] Nessuna policy INSERT/UPDATE/DELETE presente in M0

## Advisory security

- [x] Security advisor Supabase eseguito
- [x] Warning `function_search_path_mutable` documentato
- [x] Warning `anon_security_definer_function_executable` documentato
- [x] Warning `authenticated_security_definer_function_executable` documentato
- [x] Nessuna remediation extra applicata fuori dalle due migration M0 richieste

## Documentazione

- [x] `docs/SUPABASE_VALIDATION_REPORT.md` aggiornato
- [x] `docs/M0_7_CHECKLIST.md` creato
- [x] `docs/CHANGELOG.md` aggiornato

## Non completato in M0.7

- [ ] Bootstrap primo `super_admin`
- [ ] Login reale con utente `super_admin`
- [ ] Migration di hardening per warning security advisor

Questi punti restano successivi perche' M0.7 richiedeva solo applicazione e validazione delle migration M0.
