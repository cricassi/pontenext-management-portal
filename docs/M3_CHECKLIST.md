# PonteNext Management Portal - M3 Checklist

## Scope

M3 implementa gestione scadenze, storico rinnovi operativo e rinnovo rapido basati sulle tabelle M2.

Project ref Supabase:

```text
uhxfpsamenjhyrfgwckw
```

## Incluso

- [x] Route protetta `/expirations`
- [x] Voce navigazione `Scadenze` abilitata
- [x] Filtro scaduti
- [x] Filtro entro 30 giorni
- [x] Filtro entro 60 giorni
- [x] Filtro entro 90 giorni
- [x] Ricerca per socio, email o piano
- [x] Conteggi operativi delle finestre scadenza
- [x] Tabella desktop scadenze
- [x] Card mobile scadenze
- [x] Stato pagamento visibile in lista scadenze
- [x] Rinnovo rapido da lista scadenze
- [x] Rinnovo rapido da scheda socio
- [x] Rinnovo rapido da dettaglio/storico iscrizione
- [x] Integrazione pannello scadenza nella scheda socio
- [x] Service layer `expirations.service.ts`
- [x] Tipi M3 `expiration.ts`
- [x] Helper link rinnovo `membership-links.ts`

## Escluso

- [x] Nessuna email
- [x] Nessun invio promemoria
- [x] Nessuno sponsor
- [x] Nessun evento
- [x] Nessun report
- [x] Nessun export
- [x] Nessuna dashboard completa
- [x] Nessuna tabella fuori scope M3
- [x] Nessuna migration M3 applicata

## Regole M3

- [x] Ogni rinnovo crea una nuova riga in `memberships`
- [x] Nessuna membership precedente viene modificata dal rinnovo rapido
- [x] Le scadenze derivano da `memberships.end_date`
- [x] `members.status` non viene usato come stato associativo
- [x] I filtri usano solo l'ultima membership non archiviata e non annullata per socio
- [x] Membership archiviate escluse dagli elenchi operativi
- [x] Membership annullate escluse dagli elenchi operativi M3
- [x] Soci archiviati esclusi dagli elenchi operativi M3
- [x] Finestra entro 30/60/90 inclusiva e cumulativa
- [x] `start_date` del rinnovo rapido proposto come giorno successivo alla `end_date` precedente
- [x] Piano, durata e quota proposti dal piano attivo
- [x] Admin puo' modificare date e quote prima del salvataggio
- [x] Nessun pagamento creato automaticamente dal rinnovo rapido

## Query e viste

- [x] Query M3 implementate lato service
- [x] Nessuna vista SQL creata per M3
- [x] Nessuna materialized view creata per M3
- [x] Nessuna modifica a RLS/policy live

## Route M3

- [x] `/expirations`
- [x] `/expirations?filter=expired`
- [x] `/expirations?window=30`
- [x] `/expirations?window=60`
- [x] `/expirations?window=90`
- [x] `/memberships/new?memberId=<member_id>&renewFrom=<membership_id>&mode=quick`
- [x] `/members/<member_id>` con pannello scadenza

## Validazione live Supabase

- [x] Progetto `PonteNext` verificato
- [x] Project ref `uhxfpsamenjhyrfgwckw` verificato
- [x] Migration list verificata
- [x] Confermate solo migration fino a M2 (`001`-`006`)
- [x] Tabelle M0-M2 presenti
- [x] Tabelle fuori scope M3 assenti
- [x] RLS attiva sulle tabelle M0-M2
- [x] Policy M2 coerenti con admin attivi
- [x] Nessuna migration M3 applicata

## Test manuale route M3

- [x] `/login` verificata via browser locale
- [x] `/expirations` verificata senza sessione: redirect a `/login`
- [x] `/expirations?filter=expired` verificata senza sessione: redirect a `/login`
- [x] `/expirations?window=30` verificata senza sessione: redirect a `/login`
- [x] `/expirations?window=60` verificata senza sessione: redirect a `/login`
- [x] `/expirations?window=90` verificata senza sessione: redirect a `/login`
- [x] Console browser verificata senza errori

Nota: la validazione funzionale con dati live resta limitata dal database attualmente vuoto per `members`, `memberships` e `payments`.

## Verifiche locali

- [x] `npx tsc --noEmit`
- [x] `npm run lint`
- [x] `npm run build`

Nota: `npm run build` nel sandbox ha completato la compilazione ma si e' fermato su `spawn EPERM`; la build e' stata rieseguita fuori sandbox ed e' terminata con successo.
