# BRAND_UI_REFRESH_CHECKLIST.md

# UI Brand Refresh - PonteNext Visual Identity

Versione: 1.0

Ultimo aggiornamento: 2026-06-13

---

# Scope

- [x] Login page brandizzata.
- [x] Layout admin aggiornato con header/sidebar scuri.
- [x] Logo Ponte Next integrato da asset locale.
- [x] Navigazione con voce attiva rossa.
- [x] Dashboard KPI e widget ritoccati visualmente.
- [x] Bottoni primari allineati al rosso brand.
- [x] Badge/empty state coerenti con la palette.
- [x] Documentazione brand UI aggiunta.
- [x] Ordinamento elenco soci aggiunto come controllo read-only accanto ai
  filtri anagrafici.

# Vincoli rispettati

- [x] Nessuna modifica database.
- [x] Nessuna migration creata.
- [x] Nessuna modifica Supabase.
- [x] Nessuna modifica RLS/policy.
- [x] Nessuna modifica service layer business mutativa; il service layer soci
  gestisce solo ordinamento read-only dell'elenco.
- [x] Nessuna modifica logica CRUD.
- [x] Nessuna modifica logica email.
- [x] Nessuna modifica logica report.
- [x] Nessuna nuova dipendenza.
- [x] Nessun asset remoto per il logo.

# Route/superfici coinvolte

- [x] `/login`.
- [x] Layout admin protetto.
- [x] Sidebar/navigation.
- [x] Header/topbar.
- [x] `/dashboard`.
- [x] Componenti condivisi UI: `Button`, `Card`, `Badge`, `EmptyState`, `Input`.
- [x] Menu mobile chiude su selezione voce, click esterno ed `Escape`.
- [x] `/members`: controllo ordinamento su elenco anagrafiche.

# Verifiche statiche route protette

- [x] `src/app/(admin)/layout.tsx` continua a chiamare `requireActiveAdmin()`.
- [x] Le modifiche al layout non spostano fetch sensibili fuori dal guard.
- [x] Nessuna route funzionale nuova introdotta.

# Verifiche comando

- [x] `npm run lint`.
- [x] `npx tsc --noEmit`.
- [x] `npm run build` passato fuori sandbox dopo primo fallimento ambientale
  `spawn EPERM`.

# Verifiche browser/responsive

- [x] Login desktop.
- [x] Login mobile in singola visualizzazione: `bodyScrollHeight` uguale al
  viewport testato a 390x844.
- [x] Dashboard desktop.
- [x] Dashboard mobile.
- [x] Menu mobile: apertura, chiusura su click esterno, chiusura dopo selezione
  voce.
- [x] Header mobile senza overflow orizzontale: menu, brand e logout restano
  dentro il viewport.
- [x] Contenuto admin protetto da apertura con offset orizzontale/taglio
  laterale.
- [x] Navigazione protetta senza sessione: `/dashboard` reindirizza a `/login`.
- [x] Console browser senza errori rilevanti nelle schermate verificate.

Nota: il browser plugin locale non ha il virtual clipboard installato, quindi la
digitazione automatica delle credenziali non e' stata ripetuta dopo il rebuild.
La route protetta e il rendering sono stati verificati via navigazione browser e
analisi statica del guard `requireActiveAdmin`.

Nota finale: dopo l'aggiunta dell'ordinamento soci, `npm run lint`,
`npx tsc --noEmit` e `npm run build` sono passati. Un ulteriore avvio locale
per browser check e' stato interrotto da una sessione Supabase locale invalida
nel browser (`refresh_token_not_found`), senza modifiche a Supabase.

# Descrizione schermate aggiornate

- Login: layout split con pannello brand nero a sinistra, logo Ponte Next e
  form chiaro a destra; su mobile il logo precede il form.
- Admin: sidebar nera con logo, header nero, contenuto gestionale chiaro.
- Dashboard: card KPI bianche, accenti rossi su icone e azioni, tabelle/widget
  ancora leggibili e operativi.
