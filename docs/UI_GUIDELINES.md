# UI_GUIDELINES.md

# PonteNext Management Portal – UI Guidelines

Versione: 1.0  
Obiettivo: interfaccia gestionale chiara, adattiva e veloce da usare

---

# 1. Direzione visiva

L'interfaccia deve essere:

- pulita
- gestionale
- leggibile
- sobria
- moderna
- adatta a desktop e smartphone
- coerente con l'identita' Ponte Next: nero, rosso, bianco

Non deve sembrare un sito vetrina.

Il riferimento visivo resta una dashboard amministrativa simile a:

- Supabase Dashboard
- Linear
- Notion
- Stripe Dashboard

La prima identita' visuale Ponte Next aggiunge:

- sidebar/header scuri;
- contenuto gestionale chiaro;
- rosso come accento operativo;
- logo locale come elemento di brand, senza usare font decorativi nella UI.

---

# 2. Stack UI

Usare:

- Tailwind CSS
- shadcn/ui
- Lucide Icons

Componenti consigliati:

- Button
- Input
- Select
- Dialog
- Sheet
- Table
- Card
- Badge
- Tabs
- Dropdown Menu
- Toast
- Alert

---

# 3. Tema

Tema iniziale:

- light mode
- sfondo chiaro `#F7F7F5`
- card bianche
- bordi leggeri
- testi ad alto contrasto
- nero istituzionale `#0B0B0B` per sidebar/header
- rosso primario `#E12A1C` per CTA, focus e navigazione attiva

Dark mode esclusa dalla prima versione.

---

# 4. Layout desktop

Da 1024px in su:

- sidebar sinistra fissa
- header superiore
- area contenuto centrale
- larghezza massima contenuto quando utile

Esempio:

```text
Sidebar 260px
Header 64px
Content padding 24px
```

---

# 5. Layout mobile

Sotto 768px:

- niente sidebar fissa
- header compatto
- menu hamburger
- contenuto a card
- bottoni a larghezza piena quando opportuno

---

# 6. Navigazione

## Desktop

Sidebar con:

- Dashboard
- Soci
- Iscrizioni
- Scadenze
- Sponsor
- Eventi
- Email
- Report
- Impostazioni

## Mobile

Menu hamburger tramite `Sheet`.

---

# 7. Tabelle

Le tabelle sono il formato principale su desktop.

Regole:

- intestazioni chiare
- righe compatte ma leggibili
- azioni a destra
- badge per stati
- filtri sopra la tabella
- ricerca sempre disponibile

Su mobile le tabelle devono diventare card.

---

# 8. Card mobile

Ogni record su mobile deve essere mostrato come card.

Esempio socio:

```text
Mario Rossi
mario@example.com
Scadenza: 31/12/2026
Stato: Attivo
[Apri] [Rinnova]
```

---

# 9. Form

Regole:

- label sempre visibile
- validazione immediata dove possibile
- messaggi errore sotto il campo
- campi obbligatori marcati chiaramente
- pulsante principale in basso

Su mobile:

- un campo per riga
- input grandi
- evitare form troppo lunghi senza sezioni

---

# 10. Stati

Usare badge per stati.

## Soci

- active
- inactive
- archived

## Iscrizioni

- active
- expired
- cancelled

## Pagamenti

- unpaid
- partial
- paid
- overpaid

## Eventi

- planned
- confirmed
- completed
- cancelled

---

# 11. Azioni principali

Ogni pagina deve avere una primary action chiara.

Esempi:

- Soci: Nuovo socio
- Sponsor: Nuovo sponsor
- Eventi: Nuovo evento
- Scadenze: Esporta / Invia promemoria
- Email: Nuova campagna

---

# 12. Empty state

Ogni elenco deve avere un empty state con:

- titolo
- breve spiegazione
- azione principale

Esempio:

```text
Nessun evento presente.
Crea il primo evento per iniziare a collegare sponsor e contributi.
[Nuovo evento]
```

---

# 13. Feedback utente

Usare toast per:

- salvataggio completato
- errore di salvataggio
- record archiviato
- email inviata

Usare dialog di conferma per:

- archiviazione socio
- archiviazione sponsor
- annullamento iscrizione

---

# 14. Icone

Usare Lucide Icons.

Esempi:

- Users per soci
- Calendar per eventi
- Mail per email
- Handshake per sponsor
- Settings per impostazioni
- BarChart per report

---

# 15. Colori

Non usare troppi colori.

Usare colore primario solo per:

- pulsante principale
- link principali
- stato attivo della navigazione

Gli stati devono essere leggibili anche senza affidarsi solo al colore.

Palette brand Ponte Next:

```text
Nero istituzionale: #0B0B0B
Rosso primario:     #E12A1C
Rosso hover:        #B91F15
Background:         #F7F7F5
Card:               #FFFFFF
Testo principale:   #18181B
Testo secondario:   #71717A
Bordi:              #E4E4E7
```

Non usare il font brush/grunge del logo nei testi gestionali.
Per dettagli completi vedere `docs/BRAND_UI_GUIDELINES.md`.

---

# 16. Accessibilità visiva

- contrasto testo adeguato
- focus visibile
- bottoni cliccabili facilmente
- testo minimo 14px
- su mobile evitare target inferiori a 44px

---

# 17. Regole per Codex

- Generare UI responsive-first.
- Usare componenti shadcn/ui quando disponibili.
- Non creare layout creativi o complessi.
- Preferire semplicità, leggibilità e coerenza.
- Ogni pagina elenco deve avere versione desktop e mobile.
- Ogni form deve avere validazione client-side minima.
