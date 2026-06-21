# Video Guides

Piano operativo per piccoli video formativi PonteNext.

I video reali vanno registrati solo dopo conferma su dati visibili, formato e destinazione dei file.

## 1. Regole prima di registrare

- Non mostrare .env.local.
- Non mostrare chiavi Supabase, Resend o Vercel.
- Non mostrare dati personali reali senza autorizzazione.
- Preferire dati demo o anonimizzati.
- Non inviare email reali durante una registrazione.
- Non scaricare export massivi con dati reali.
- Spegnere notifiche desktop e browser.
- Verificare zoom browser al 100%.

## 2. Formati consigliati

Formato consigliato:

- MP4 H.264, 1080p, 30 fps.

Alternativa leggera:

- WebM, 1080p, 30 fps.

Durata:

- 2-5 minuti per video;
- un flusso per video;
- evitare video unici troppo lunghi.

## 3. Destinazione file

Se i video sono demo e approvati per commit:

    docs/assets/videos/

Nomi suggeriti:

- 01-login-navigation.mp4
- 02-members-roles.mp4
- 03-memberships-renewals.mp4
- 04-sponsors-events.mp4
- 05-email-campaigns.mp4
- 06-reports-export.mp4

Se i video contengono dati reali, non committarli. Salvarli fuori repository o in spazio controllato.

## 4. Video 01 - Login e navigazione

Durata target: 2 minuti.

Obiettivo:

- mostrare accesso amministratore;
- mostrare menu desktop/mobile;
- mostrare logout.

Percorso:

1. Aprire /login.
2. Login con admin demo.
3. Atterrare su /dashboard.
4. Aprire menu laterale.
5. Passare tra Dashboard, Soci, Scadenze e Report.
6. Su mobile aprire e chiudere menu.
7. Fare logout.

Copione:

    Questo e' l'accesso amministrativo. Le sezioni sono protette: senza sessione valida si torna alla login. Su mobile il menu si apre dal pulsante in alto e si richiude quando scelgo una voce o clicco fuori.

Verifica:

- logout torna a login;
- nessuno scroll orizzontale mobile.

## 5. Video 02 - Soci e ruoli

Durata target: 3 minuti.

Obiettivo:

- mostrare lista soci;
- usare ricerca, filtri e ordinamento;
- aprire dettaglio socio;
- mostrare ruoli.

Percorso:

1. Aprire /members.
2. Usare ricerca/filtro/ordinamento.
3. Aprire dettaglio socio demo.
4. Mostrare anagrafica, iscrizioni, pagamenti e scadenze.
5. Aprire impostazioni ruoli.
6. Mostrare assegnazione ruolo.

Copione:

    La scheda socio contiene dati anagrafici e collegamenti operativi. Lo stato anagrafico del socio non e' lo stato associativo: quello deriva dalle iscrizioni.

Dato demo richiesto:

- almeno un socio non reale;
- almeno un ruolo base.

## 6. Video 03 - Iscrizioni, pagamenti e rinnovo rapido

Durata target: 4 minuti.

Obiettivo:

- mostrare iscrizione;
- mostrare pagamento non contabile;
- mostrare scadenza;
- mostrare rinnovo rapido.

Percorso:

1. Aprire /memberships.
2. Aprire membership demo.
3. Mostrare payment_status.
4. Aprire /expirations.
5. Applicare filtri 30, 60 e 90 giorni.
6. Avviare rinnovo rapido.
7. Mostrare nuova membership creata.

Copione:

    Ogni rinnovo crea una nuova iscrizione. La riga precedente resta storica e non viene estesa. I pagamenti servono solo a tracciare quote operative, non sono contabilita'.

## 7. Video 04 - Sponsor, contributi ed eventi

Durata target: 4 minuti.

Obiettivo:

- mostrare sponsor;
- mostrare contributi monetari e non monetari;
- mostrare evento;
- mostrare collegamento sponsor-evento.

Percorso:

1. Aprire /sponsors.
2. Aprire dettaglio sponsor demo.
3. Mostrare contributi.
4. Aprire /events.
5. Aprire dettaglio evento demo.
6. Mostrare sponsor collegati.
7. Mostrare contributo opzionalmente collegato a evento.

Copione:

    Uno sponsor puo' esistere anche senza contributi. Il collegamento sponsor-evento non implica automaticamente un contributo economico. I contributi restano dati operativi, senza fatture o IVA.

## 8. Video 05 - Email e campagne

Durata target: 3 minuti.

Obiettivo:

- creare o aprire bozza;
- selezionare segmento;
- vedere anteprima;
- spiegare conferma invio.

Percorso:

1. Aprire /email.
2. Aprire template.
3. Aprire campagne.
4. Creare o aprire campagna demo.
5. Selezionare segmento demo.
6. Mostrare anteprima.
7. Fermarsi prima dell'invio reale oppure usare solo indirizzo test autorizzato.

Copione:

    La campagna nasce come bozza. I destinatari vengono salvati con l'email effettivamente usata. L'invio non parte mai da solo: serve conferma amministratore.

Divieto:

- non inviare a segmenti reali durante registrazione.

## 9. Video 06 - Report ed export

Durata target: 2 minuti.

Obiettivo:

- mostrare report;
- applicare filtri;
- esportare CSV/XLSX su dati demo o limitati.

Percorso:

1. Aprire /reports.
2. Scegliere tipo report.
3. Applicare filtri.
4. Mostrare preview.
5. Esportare CSV o XLSX se i dati sono demo.

Copione:

    I report sono export operativi. I formati disponibili sono CSV e XLSX. Non esistono PDF, fatture o prima nota.

## 10. Checklist registrazione

- [ ] Dati demo disponibili.
- [ ] Nessuna chiave API visibile.
- [ ] Nessuna email reale inviata.
- [ ] Nessun export massivo reale.
- [ ] Browser pulito.
- [ ] Zoom browser 100%.
- [ ] Desktop verificato.
- [ ] Mobile verificato se incluso.
- [ ] File nominato secondo convenzione.
- [ ] Video rivisto prima della condivisione.

## 11. Domande da chiudere prima dei video reali

1. Registrare con dati demo o dati reali autorizzati?
2. Salvare i video nel repository o fuori repository?
3. Formato preferito: MP4 o WebM?
4. Serve voce audio o solo video senza audio?
5. Serve versione mobile separata?