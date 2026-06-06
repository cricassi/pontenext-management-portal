# Product Requirements Document

## Nome progetto

PonteNext Management Portal

Versione: 1.0

---

# 1. Visione

Realizzare una piattaforma web responsive per la gestione operativa dell'associazione Ponte Next.

La piattaforma deve essere accessibile tramite browser e consentire agli amministratori di gestire:

- soci e iscritti
- quote associative
- rinnovi e scadenze
- sponsor
- eventi
- comunicazioni email

Deve funzionare da desktop, tablet e smartphone senza installazione.

---

# 2. Obiettivi

## Obiettivi principali

- Centralizzare i dati associativi
- Ridurre l'uso di Excel e archivi manuali
- Gestire iscrizioni e rinnovi
- Monitorare scadenze
- Gestire sponsor ed eventi
- Consentire comunicazioni massive

## Obiettivi secondari

- Esportazione CSV/Excel
- Storico delle attività
- Uso comodo da smartphone

---

# 3. Utenti

## Super Admin

Può:

- gestire amministratori
- configurare il sistema
- accedere a tutti i moduli

## Admin

Può:

- gestire soci
- gestire quote
- gestire sponsor
- gestire eventi
- inviare comunicazioni

## Soci

Non hanno accesso al sistema.

---

# 4. Funzionalità

## Dashboard

Nella milestone M3 mostra una dashboard parziale basata sui dati disponibili dopo M2:

- soci anagraficamente attivi
- soci con iscrizione attiva
- soci con iscrizione scaduta
- rinnovi prossimi

Dopo M5 e M6 la dashboard puo' essere estesa con:

- sponsor attivi
- eventi futuri

## Soci

Gestione anagrafica:

- nome
- cognome
- email
- telefono
- indirizzo
- città
- note
- stato anagrafico

Campi opzionali:

- data nascita
- codice fiscale
- professione

## Ruoli

Ruoli configurabili e storicizzabili.

Esempi:

- Presidente
- Vicepresidente
- Segretario
- Tesoriere
- Consigliere
- Socio Ordinario
- Socio Sostenitore

## Iscrizioni

Ogni socio può avere più iscrizioni nel tempo.

Lo stato associativo del socio e' derivato dalle iscrizioni, non dal campo `members.status`.

Ogni iscrizione contiene:

- data inizio
- data fine
- durata
- quota minima
- quota prevista
- importo versato
- stato pagamento
- note

## Quote

Il sistema deve supportare:

- quota minima configurabile
- quota effettiva variabile
- durata variabile
- pagamenti parziali
- quote sostenitore
- quote agevolate

## Pagamenti

Registrazione non contabile di versamenti:

- data
- importo
- metodo
- riferimento
- note

## Scadenze

Viste:

- scadute
- entro 30 giorni
- entro 60 giorni
- entro 90 giorni

## Sponsor

Anagrafica sponsor:

- ragione sociale
- referente
- email
- telefono
- sito web
- note

## Eventi

Gestione eventi:

- nome
- descrizione
- data e orario inizio
- data e orario fine
- luogo
- stato
- note

## Relazione sponsor/eventi

Uno sponsor può sostenere più eventi.

Un evento può avere più sponsor.

## Comunicazioni email

Invio email verso:

- tutti i soci
- soci con iscrizione attiva
- soci con iscrizione scaduta
- sponsor

Con:

- template
- anteprima
- storico invii

## Report

Export:

- soci
- iscrizioni
- quote
- sponsor
- eventi

Formati:

- CSV
- XLSX

---

# 5. Requisiti non funzionali

- Responsive mobile-first
- Accesso solo autenticato
- Nessun dato associativo pubblico
- Soft delete sui dati principali
- Performance adeguata per piccoli/medi volumi associativi

---

# 6. Fuori scope

- contabilità
- fatture
- IVA
- bilanci
- prima nota
- ecommerce
- pagamenti online
- app mobile nativa
- area riservata soci
