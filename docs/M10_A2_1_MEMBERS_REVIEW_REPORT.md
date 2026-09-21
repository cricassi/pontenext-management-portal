# M10-A2.1 Members Only - Review Tecnica Finale PR #52

Data: 2026-09-22, Europe/Rome. Repository: cricassi/pontenext-management-portal.
Base main: e40f790. Head iniziale revisionato: b6c753e.
Codice finale verificato: **f049b1e**, fix del solo blocker B1 e relativi test.
Supabase: esclusivamente PonteNext, `uhxfpsamenjhyrfgwckw`, **read-only** in questa review.

## Esito Complessivo

**MERGE SI**, dopo correzione B1. Nessun problema bloccante aperto.
Lo smoke autenticato dell'utente e' positivo; le verifiche indipendenti di codice,
database, test isolati e browser demo sono descritte separatamente sotto.
PR mantenuta in bozza durante la review. L'utente ha autorizzato esplicitamente
Ready for review e merge solo in caso di esito positivo. Non riapplicare migration.
Questo e' un report pre-merge: non certifica il successivo deploy Production.

## Problemi Bloccanti

### B1 - Modulo obsoleto poteva sovrascrivere una modifica concorrente: RISOLTO

Prima del fix `updateMember` rileggeva updated_at al submit e usava quella stessa
versione nell'UPDATE. Una seconda modifica gia' salvata dopo l'apertura del form
diventava quindi la nuova baseline, mentre il browser inviava ancora valori vecchi.
Riproduzione isolata: telefono cambiato dall'admin B, form vecchio dell'admin A
con nuovo cognome e vecchio telefono; il telefono di B veniva sovrascritto.

Fix minimo f049b1e:

- src/app/(admin)/members/[id]/edit/page.tsx:44 associa alla server action anche
  member.updatedAt letto all'apertura; nessun campo business hidden nei props.
- src/app/(admin)/members/actions.ts:44 inoltra la versione attesa al service.
- src/services/members.service.ts:388 verifica versione valida e identica al
  record corrente, poi usa la stessa versione nel predicato SQL updated_at.
- Se la versione cambia, errore sanitizzato e richiesta di ricaricare; nessun
  retry o riscrittura automatica. La patch minima e la preservazione hidden restano.
- tests/member-visibility-db.test.ts:178 e :189 coprono form obsoleto e scrittura
  concorrente fra lettura fresca e UPDATE; nessun dato concorrente perso.
- Browser demo a due schede: primo submit riuscito, secondo rifiutato; dopo
  ricaricamento cognome/telefono del primo submit ancora presenti.

Nessun intervento sulle migration applicate o sui dati live.

## Importanti Non Bloccanti

**I1 - Configurazione e modifica anagrafica non sono una transazione unica.**
Il service rilegge le preferenze al submit, ma un cambio configurazione successivo
a quella lettura non e' atomicamente collegato all'UPDATE del socio. Il CAS del
record, ora completo, non e' un CAS delle preferenze. E' un limite gia' documentato,
non un nuovo sistema di permessi per colonna: i campi assenti restano preservati e
le richieste sono filtrate sulla configurazione letta. Prima di introdurre vere
autorizzazioni per campo occorre progettare un confine transazionale dedicato.

## Problemi Minori e Limiti

- Lo stress con due connessioni PostgREST simultanee non e' stato eseguito. Test
  reali PostgreSQL isolati coprono baseline, rollback atomico e CAS; l'advisory lock
  per schermata e' verificato staticamente. Non attribuire alla suite uno stress test.
- Nessun admin ordinario live creato/modificato: i ruoli admin, inattivo, archiviato,
  Auth non admin e anon sono coperti in ambiente SQL isolato e nei test service/UI.
- Preview protetta da login Vercel per il browser Codex. Smoke live registrato
  come dichiarazione dell'utente; nessuna nuova prova HTTP di scrittura sul live.
- Responsive 360/375/390/1280: matrice di 20 combinazioni eseguita durante
  l'implementazione, documentata in checklist. Il fix B1 non cambia CSS/layout;
  rieseguiti test render e browser funzionale. Nessun collaudo Safari fisico.
- `prepareVisibilityUpsert` resta una utility pura inutilizzata dal service:
  possibile futura pulizia, non un percorso di scrittura. L'app usa solo la RPC.
- Security Advisor conserva il warning preesistente
  [Leaked Password Protection Disabled](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
  Nessun nuovo warning delle funzioni 017; nessuna modifica Auth fuori scope.

## Scope e Registro

Solo members.list, members.create, members.edit e members.detail hanno integrated=true.
Le altre 38 schermate restano false, controlli disabilitati e action non ammesse.
Registro versione 2, 33 coppie soci configurabili; nessun readonly, permission
group o import Excel. Nomi/cognomi/paese/stato e controlli tecnici non configurabili.
Allowlist 017 identica ai campi facoltativi approvati; CHECK 015 non modificato.

Il diff di produzione riguarda il modulo soci, il registro e la gestione delle
preferenze. Sponsor/eventi/iscrizioni/pagamenti/ruoli/email/report non integrati.
I pannelli di ruoli/iscrizioni nel dettaglio socio non ricevono policy nuove.

## Migration e RPC

| Migration | Versione live | Occorrenze | SQL locale/live |
| --- | --- | ---: | --- |
| 015_ui_field_visibility | 20260921195425 | 1 | Identico normalizzando whitespace |
| 016_lock_ui_field_visibility_foundation | 20260921205506 | 1 | Identico normalizzando whitespace |
| 017_enable_member_field_visibility_rpc | 20260921221332 | 1 | Identico normalizzando whitespace |

Checksum completi in M10_A2_1_MEMBERS_CHECKLIST.md. Nessuna migration modificata
retroattivamente o rieseguita. Nessun ALTER/DML business nella 017.

- public.set_member_field_visibility e' SECURITY INVOKER.
- Writer app_private omonimo SECURITY DEFINER, owner postgres, search_path vuoto.
- Entrambe EXECUTE authenticated; nessun EXECUTE PUBLIC/anon/service_role.
- Il writer verifica auth.uid(), helper is_super_admin() e riga admin attiva/non
  archiviata; updated_by derivato da admin_users.id via auth_user_id=auth.uid().
- Accetta solo quattro screen soci e oggetti booleani completi dei facoltativi;
  nessun SQL dinamico, chiavi tecniche, autore o timestamp assegnabili dal client.
- Un'unica chiamata/transaction salva l'intera schermata; errore intermedio
  annulla tutto. Lock pg_try_advisory_xact_lock per schermata e confronto CAS
  semantico delle preferenze, con 40001 e nessun retry automatico.
- Reset archivia solo override attivi della schermata; un successivo salvataggio
  crea nuovi ID, non riattiva righe archiviate. Nessuna cancellazione fisica.
- Nessuna nuova policy o grant di tabella. Il client server usa la sessione utente;
  nessuna service role nel percorso applicativo o browser.

## RLS e Data API

RLS attiva su ui_field_visibility. Unica policy: SELECT authenticated con
app_private.is_active_admin(). Privilegi authenticated: solo SELECT; INSERT,
UPDATE, DELETE, TRUNCATE, REFERENCES e TRIGGER assenti. Anon senza privilegi.
Il super_admin non ottiene grant diretti distinti: puo' scrivere solo tramite RPC
approvata. Admin ordinario non supera il controllo super_admin della RPC.

Evidenze distinte:

1. Questa review: SELECT su cataloghi/ACL/policy e funzioni live, nessun tentativo
   POST/PATCH/DELETE, reset o RPC mutante sul progetto.
2. Suite SQL isolata: operazioni dirette negate con 42501 per super_admin/admin;
   RPC negata a admin ordinario, inattivo, archiviato, non admin e anon. SELECT
   ammessa agli admin attivi, nessuna riga agli utenti esclusi dalla RLS.
3. Verifica dopo applicazione 017 gia' documentata: save/reset e rifiuti SQL live
   in transazione annullata, senza righe persistenti o scritture business.
4. Smoke utente: dichiara conferma dei rifiuti Data API. Non inventati nuovi esiti
   HTTP live da parte di Codex durante questa review read-only.

## Form, Liste e Preservazione

Le quattro pagine chiamano requireActiveAdmin prima di configurazione o dati.
Le action e i service create/update riconfermano il guard; errori sanitizzati.

| Schermata | Esito |
| --- | --- |
| members.list | Stessa preferenza per tabella desktop/card mobile; intestazioni, celle e valori nascosti omessi; citta' sotto il nome omessa se hidden |
| members.create | Controlli hidden assenti; server rifiuta hidden inviati manualmente, sconosciuti, file/duplicati; null/default preesistenti per gli assenti |
| members.edit | Proiezione whitelist per client; merge solo per validare, UPDATE solo su campi presenti/visibili/cambiati; CAS versione all'apertura |
| members.detail | Label/valori hidden omessi in server component; identita', stato e paese conservati; nessun record completo passato a componenti client inutilmente |

Nome/cognome/paese/stato sono sempre richiesti e validati. Non sono introdotti
default nuovi. I valori legacy nascosti non vengono normalizzati o cancellati.
Assenza non diventa null, stringa vuota o false; vuoto esplicito azzera solo un
facoltativo visibile. Nel form soci non ci sono checkbox o FK di relazione
modificabili: niente conversioni implicite a false o scollegamenti.

Test con service reale e PostgreSQL isolato: socio con email, telefono, indirizzo
e note; email/note hidden, aggiornamento cognome/telefono. Patch esatta, email/note
identiche, indirizzo omesso preservato, conteggio e relazioni invariati. Dopo reset,
proiezione visibile contiene nuovamente email/note identiche. Create sintetica in
transazione annullata. Nessun record live usato per test di scrittura.

## Impostazioni e Performance

Configurazione globale esplicita, switch soli facoltativi members per super_admin;
conferma save/reset, pending, messaggi sanitizzati e conflitto che richiede reload.
Admin ordinario consulta ma non scrive. Altri moduli ancora bloccati lato UI e server.
Snapshot caricato per set di schermate, cache React per richiesta; submit rilegge
fuori cache. Nessuna query per singolo campo, nessun N+1 introdotto.

## Smoke Utente e Stato Live

Esito dichiarato dall'utente: login super_admin, pagina accessibile, quattro
configurazioni modificabili, salvataggio e visibilita' corretti, reset riuscito,
Data API diretta negata, nessun altro modulo attivo e nessuna alterazione business
involontaria osservata. Registrato senza attribuirlo a esecuzione autonoma Codex.
La dichiarazione precede il fix B1; il suo nuovo percorso di salvataggio e'
verificato separatamente con service/SQL reali isolati e browser demo a due schede.

Rilettura read-only 2026-09-21 22:28 UTC, riconfermata alle 22:39 UTC:

| Schermata | Attivi | Archiviati |
| --- | ---: | ---: |
| members.list | 0 | 0 |
| members.create | 0 | 10 |
| members.edit | 0 | 0 |
| members.detail | 0 | 0 |
| Altri moduli | 0 | 0 |

Le 10 righe archiviate sono coerenti con il reset soft e non sono un problema.
**Nessun override attivo**, nessuna pulizia richiesta o eseguita.
Members resta a 105; admin_users 2, roles 7, member_roles 3, membership_plans 3,
memberships 6, payments 2, sponsors 2, sponsor_contributions 2, events 2,
event_sponsors 0, email_templates 1, email_campaigns 0, email_campaign_recipients 0.
Conteggi invariati rispetto al pre-smoke. I conteggi da soli non provano l'identita'
di ogni valore storico: assenza di modifiche involontarie e' anche attestazione
utente; questa review non ha eseguito alcun DML live o acquisito righe business.

## Verifiche Tecniche e Regressioni

| Verifica | Esito |
| --- | --- |
| npm run lint | PASS dopo fix B1 |
| npx tsc --noEmit | PASS dopo fix B1 |
| npm run build | PASS dopo fix B1, route precedenti conservate |
| Test M10-A1 motore/UI | 13 PASS |
| Test SQL A1/lock 016 isolati | 12 PASS (conteggio runner) |
| Test A2.1 render/guard/payload | 7 PASS |
| Test SQL A2.1, preservazione/CAS | 14 PASS (13 scenari + wrapper) |
| Regressione export M8/M10-B | 16 PASS |
| Totale | 62/62, zero falliti o saltati |
| Browser demo due schede dopo B1 | PASS, primo submit 303, obsoleto rifiutato senza scritture |
| Responsive 360/375/390/1280 | Evidenza implementativa 20 combinazioni senza overflow, CSS invariato |
| Smoke autenticato live | PASS dichiarato dall'utente; accesso Codex alla preview protetto da login Vercel |
| Supabase | Solo SELECT/cataloghi/advisor durante la review |
| git diff --check | PASS |

Esecuzione SQL via PGlite 0.3.14 temporaneo, nessuna dipendenza nuova nel progetto.
Server e fixture browser fermati. Nessun file env/segreto letto o modificato.
Verificato diff nullo su export, report, segmentazione email, ruoli/iscrizioni e
sponsor/eventi; M10-B continua a esportare tutti i campi senza policy visibilita'.

## Decisione Finale

**MERGE SI**. B1 risolto e verificato; nessun blocker aperto. Portare la PR #52
a Ready for review, verificare i check del commit finale e procedere al merge
come autorizzato dall'utente. Nessuna riesecuzione 015/016/017, nessuna nuova fase.
