# M0_8_CHECKLIST.md

# PonteNext Management Portal - M0.8 Checklist

## Scope

M0.8 corregge i warning Supabase Security Advisor sulle funzioni M0 del progetto `PonteNext`.

Project ref:

```text
uhxfpsamenjhyrfgwckw
```

## Warning analizzati

- [x] `function_search_path_mutable` su `public.set_updated_at`
- [x] `anon_security_definer_function_executable` su `public.is_active_admin()`
- [x] `authenticated_security_definer_function_executable` su `public.is_active_admin()`

## Migration

- [x] Creata `database/migrations/003_harden_admin_functions.sql`
- [x] Applicata migration Supabase `003_harden_admin_functions`
- [x] Non applicate migration M1 o successive
- [x] Placeholder migration M1+ rinumerati localmente senza applicazione al database

## Hardening applicato

- [x] `public.set_updated_at()` aggiornata con `search_path = ''`
- [x] `public.set_updated_at()` usa `pg_catalog.now()`
- [x] Revocati privilegi EXECUTE non necessari su `public.set_updated_at()`
- [x] Creato schema non esposto `app_private`
- [x] Creato helper `app_private.is_active_admin()` con `security definer` e `search_path = ''`
- [x] Revocato EXECUTE ad `anon` su `app_private.is_active_admin()`
- [x] Aggiornata solo la policy SELECT `admin_users_select_self_or_active_admin`
- [x] Rimossa la funzione esposta `public.is_active_admin()`

## Validazione live

- [x] Migration list verificata
- [x] Funzioni verificate da catalogo PostgreSQL
- [x] Privilegi funzioni verificati
- [x] Policy SELECT verificata
- [x] RLS su `admin_users` confermata
- [x] Security Advisor Supabase rieseguito
- [x] Security Advisor Supabase senza warning (`lints: []`)
- [x] Schema `public` contiene solo `admin_users`
- [x] Tabelle M1 non create

## Verifiche locali

- [x] `npm run lint`
- [x] `npm run build`

## Vincoli rispettati

- [x] Nessun avvio M1
- [x] Nessuna tabella soci creata
- [x] Nessun CRUD aggiunto
- [x] Nessuna modifica al modello dati applicativo
- [x] Nessuna policy modificata oltre quanto necessario per hardening
