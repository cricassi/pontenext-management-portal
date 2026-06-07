# SCREEN_FLOW.md

# PonteNext Management Portal – Screen Flow

Versione: 1.0  
Tipo prodotto: piattaforma web gestionale responsive  
Accesso: solo amministratori autenticati

---

# 1. Obiettivo

Questo documento definisce la struttura delle schermate, la navigazione e i flussi principali della piattaforma.

Codex deve usare questo documento per generare pagine, layout e percorsi coerenti.

---

# 2. Principi di navigazione

La piattaforma deve essere composta da aree gestionali semplici:

- Dashboard
- Soci
- Iscrizioni
- Scadenze
- Sponsor
- Eventi
- Email
- Report
- Impostazioni

Su desktop la navigazione principale avviene tramite sidebar laterale.

Su mobile la navigazione avviene tramite header superiore e menu hamburger.

---

# 3. Layout principale

## 3.1 Desktop

Struttura:

```text
┌──────────────────────────────────────────────┐
│ Sidebar │ Header superiore                   │
│         ├────────────────────────────────────┤
│         │ Contenuto pagina                   │
│         │                                    │
└──────────────────────────────────────────────┘
```

Sidebar sempre visibile da larghezza >= 1024px.

## 3.2 Tablet

- Sidebar collassabile
- Contenuto principale a larghezza piena
- Tabelle con scroll orizzontale se necessario

## 3.3 Mobile

Struttura:

```text
┌────────────────────────────┐
│ Header + menu hamburger    │
├────────────────────────────┤
│ Contenuto a card           │
└────────────────────────────┘
```

Non usare sidebar fissa su mobile.

---

# 4. Percorsi principali

```text
/login
/dashboard
/members
/members/new
/members/[id]
/members/[id]/edit
/members/[id]/memberships
/memberships
/expirations
/sponsors
/sponsors/new
/sponsors/[id]
/events
/events/new
/events/[id]
/email
/email/templates
/email/campaigns
/reports
/settings
/settings/users
/settings/membership-plans
/settings/roles
```

---

# 5. Login

## Route

```text
/login
```

## Elementi

- logo/nome piattaforma
- email
- password
- pulsante login
- messaggio errore

## Regole

- solo utenti presenti in Supabase Auth possono accedere
- nessuna registrazione pubblica
- nessun login soci

---

# 6. Dashboard

## Route

```text
/dashboard
```

## Contenuto

Card KPI M3, basate solo sui dati disponibili dopo M2:

- soci anagraficamente attivi
- soci con iscrizione attiva
- soci con iscrizione scaduta
- rinnovi entro 30 giorni

Sezioni:

- prossime scadenze
- ultimi soci inseriti

## Azioni rapide

- nuovo socio
- registra rinnovo

Nota: widget sponsor, eventi futuri e relative azioni rapide vengono aggiunti solo dopo M5 e M6.

---

# 7. Soci

## Route elenco

```text
/members
```

## Desktop

Tabella con colonne:

- Nome
- Email
- Telefono
- Ruolo principale
- Ultima scadenza
- Stato anagrafico
- Stato iscrizione
- Azioni

## Mobile

Lista card con:

- nome completo
- email
- telefono
- stato anagrafico
- stato iscrizione derivato
- scadenza
- azioni principali

## Filtri

- testo libero
- stato anagrafico socio
- stato iscrizione derivato
- ruolo
- scadenza

## Azioni

- visualizza
- modifica
- rinnova
- archivia

---

# 8. Scheda Socio

## Route

```text
/members/[id]
```

## Sezioni

- dati anagrafici
- ruoli
- iscrizioni
- pagamenti
- note

## Azioni

- modifica socio
- aggiungi ruolo
- nuova iscrizione
- registra pagamento
- archivia socio

---

# 9. Iscrizioni

## Route

```text
/memberships
```

## Contenuto

Elenco iscrizioni con:

- socio
- piano iscrizione
- data inizio
- data fine
- quota prevista
- pagato
- stato pagamento
- stato iscrizione derivato

## Azioni

- rinnova
- registra pagamento
- visualizza socio

---

# 10. Scadenze

## Route

```text
/expirations
```

## Tab disponibili

- scadute
- entro 30 giorni
- entro 60 giorni
- entro 90 giorni

## Azioni

- rinnova iscrizione
- esporta elenco

Nota: M4 non invia email. L'azione di promemoria scadenze e' disponibile solo dopo M7.

---

# 11. Sponsor

## Route elenco

```text
/sponsors
```

## Desktop

Tabella con:

- ragione sociale
- referente
- email
- telefono
- contributi totali
- stato
- azioni

## Mobile

Card sponsor con:

- ragione sociale
- referente
- email
- stato
- azioni

## Scheda Sponsor

Route:

```text
/sponsors/[id]
```

Sezioni:

- anagrafica
- contributi
- note

Nota: eventi collegati e collegamento sponsor/eventi restano fuori da M5 e
vengono introdotti solo con la milestone eventi.

---

# 12. Eventi

## Route elenco

```text
/events
```

## Campi visualizzati

- nome evento
- data e orario derivati da `start_datetime` e `end_datetime`
- luogo
- stato
- sponsor collegati
- azioni

## Scheda Evento

Route:

```text
/events/[id]
```

Sezioni:

- dettagli evento
- sponsor collegati
- contributi collegati
- note

---

# 13. Email

## Route principale

```text
/email
```

Le route email definitive sono:

```text
/email
/email/templates
/email/campaigns
```

## Sottosezioni

```text
/email/templates
/email/campaigns
```

## Funzioni

- creare template
- selezionare destinatari
- generare anteprima
- inviare campagna
- vedere storico invii

## Segmenti iniziali

- tutti i soci
- soci con iscrizione attiva
- soci con iscrizione scaduta
- sponsor
- destinatari custom

---

# 14. Report

## Route

```text
/reports
```

## Report disponibili

- elenco soci
- iscrizioni attive
- iscrizioni scadute
- pagamenti quote
- sponsor
- contributi sponsor
- eventi

## Formati export

- CSV
- XLSX

---

# 15. Impostazioni

## Route

```text
/settings
```

## Sezioni

```text
/settings/users
/settings/membership-plans
/settings/roles
```

## Funzioni

- gestione amministratori
- gestione piani iscrizione
- gestione ruoli associativi

---

# 16. Stati vuoti

Ogni pagina elenco deve avere uno stato vuoto.

Esempio:

```text
Nessun socio presente.
Aggiungi il primo socio per iniziare.
[Nuovo socio]
```

---

# 17. Errori

Gli errori devono essere chiari e operativi.

Esempi:

- impossibile salvare il socio
- email già presente
- dati obbligatori mancanti
- sessione scaduta

---

# 18. Regole per Codex

- Non creare pagine pubbliche non previste.
- Non creare area riservata soci.
- Non introdurre ecommerce o pagamenti online.
- Ogni pagina deve essere responsive.
- Ogni elenco deve funzionare su desktop e mobile.
- Ogni azione distruttiva deve usare archiviazione, non delete fisico.
