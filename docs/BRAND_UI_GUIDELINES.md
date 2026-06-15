# BRAND_UI_GUIDELINES.md

# PonteNext Management Portal - Brand UI Guidelines

Versione: 1.0

Ultimo aggiornamento: 2026-06-13

---

# 1. Identita' visiva Ponte Next

Ponte Next deve apparire come un gestionale amministrativo energico, chiaro e
radicato nel brand dell'associazione.

Direzione:

- nero istituzionale per sidebar, header e superfici brand;
- rosso primario come accento operativo;
- bianco e grigi chiari per leggibilita' e aree dati;
- stile professionale, sobrio e da back office;
- logo come elemento grafico principale, non come font UI.

Reference locali:

- logo: `public/brand/ponte-next-logo.jpg`;
- mockup di riferimento: `docs/assets/brand-ui-reference.png`.

---

# 2. Palette colori

Palette approvata:

| Ruolo | Hex | Uso |
| --- | --- | --- |
| Nero istituzionale | `#0B0B0B` | Sidebar, header, login brand panel |
| Rosso primario | `#E12A1C` | CTA, voce attiva, icone KPI, badge critici |
| Rosso hover | `#B91F15` | Hover bottoni primari e nav attiva |
| Background principale | `#F7F7F5` | Area gestionale e pagine interne |
| Card background | `#FFFFFF` | Card, tabelle, form |
| Testo principale | `#18181B` | Testi e titoli |
| Testo secondario | `#71717A` | Descrizioni e metadati |
| Bordi | `#E4E4E7` | Bordi card, input e tabelle |

Regole:

- usare token semantici Tailwind (`primary`, `background`, `card`, `muted`);
- non introdurre palette alternative per singole pagine;
- mantenere verde per stati positivi e arancio per warning quando necessario;
- usare rosso per azioni primarie e criticita', non per ogni elemento.

---

# 3. Uso del logo

Regole:

- usare asset locali, mai URL remoti;
- usare `public/brand/ponte-next-logo.jpg` come asset runtime;
- non stirare o deformare il logo;
- su superfici scure lasciare il logo su fondo nero;
- su UI compatte usare logo + wordmark testuale leggibile;
- non usare il font brush/grunge del logo per menu, form, tabelle o testi
  lunghi.

Il logo puo' comparire:

- nel pannello sinistro della login page;
- nella sidebar desktop;
- nell'header mobile;
- come icona/fav icon se tecnicamente adatto.

---

# 4. Regole login page

Desktop:

- layout split;
- sinistra: area brand nera con logo Ponte Next;
- destra: form chiaro e leggibile;
- bottone login rosso;
- messaggi errore ad alto contrasto.

Mobile:

- logo sopra il form;
- nessuna sidebar;
- form a larghezza piena;
- touch target comodi.

Da evitare:

- login tutta scura;
- immagini remote;
- testo decorativo che riduce la leggibilita';
- animazioni o effetti da landing page.

---

# 5. Regole sidebar/header

Sidebar desktop:

- fondo nero istituzionale;
- logo Ponte Next in alto;
- voce attiva rossa;
- hover discreto su nero;
- testo bianco o bianco attenuato;
- larghezza stabile.

Header:

- fondo nero;
- su mobile mostra logo compatto e menu;
- su desktop mostra identita' admin e azione logout;
- non sovraccaricare con widget o dati non necessari.

---

# 6. Regole dashboard/card

Dashboard:

- resta operativa, non direzionale;
- usa solo dati disponibili;
- card KPI chiare;
- icone rosse solo come accento;
- widget leggibili con tabelle desktop e card mobile;
- nessuna dashboard avanzata introdotta dal refresh.

Card:

- fondo bianco;
- bordo leggero;
- raggio massimo 8px;
- ombre leggere;
- hover discreto senza layout shift significativo.

---

# 7. Regole bottoni/badge

Bottoni:

- primary rosso;
- hover rosso scuro;
- secondary/outline neutri;
- azioni distruttive o critiche sempre esplicite nel testo;
- su mobile i bottoni principali possono essere full width.

Badge:

- critici: rosso;
- warning: arancio;
- positivi: verde;
- neutri/archiviati: grigio;
- ogni badge deve avere testo leggibile, non solo colore.

---

# 8. Regole mobile

Mobile:

- header nero compatto;
- menu tramite navigazione mobile;
- liste principali a card;
- tabelle solo quando secondarie o esportative;
- pulsanti principali con target comodo;
- nessuna sidebar fissa.

Controllare sempre:

- 360px di larghezza;
- assenza di overflow orizzontale;
- testo non sovrapposto;
- logo non deformato;
- menu e logout accessibili.

---

# 9. Accessibilita' / contrasto

Regole:

- contrasto alto tra testo e sfondo;
- focus visibile con ring rosso;
- informazioni non basate solo sul colore;
- font UI leggibile, preferibilmente Inter/Geist/system;
- testi minimi 14px nelle aree operative;
- target mobile consigliato almeno 44px.

Il nero del brand deve essere usato con testo bianco o bianco attenuato. Il
rosso primario va usato con testo bianco solo quando il contrasto e' adeguato.

---

# 10. Cosa evitare

Evitare:

- interfaccia tutta scura;
- stile poster/evento nelle aree gestionali;
- font brush/grunge nei testi UI;
- gradienti dominanti o decorazioni non funzionali;
- immagini remote per il logo;
- asset pesanti non ottimizzati;
- nuove dipendenze solo per styling;
- modifiche a logica CRUD, database, Supabase, RLS o migration;
- nuove funzionalita' mascherate da refresh grafico.
