# Plan za implementaciju bezbednog PDF čitača

## Ciljevi i zahtevi
- Omogućiti intuitivno čitanje PDF knjiga dostupnih na backendu bez potrebe za preuzimanjem datoteka.
- Zaštititi sadržaj knjiga tako da korisnik ne može jednostavno da preuzme ili kopira ceo PDF.
- Minimizirati troškove implementacije i izbegavati plaćene servise kada god je moguće (do 30€ ukupnog troška ako je neophodno).

## Pregled postojećih rešenja
1. **Mozilla PDF.js (open-source)**
   - + Besplatna biblioteka, aktivno održavana, radi u browseru.
   - + Jednostavna integracija sa React/Vue/Next frontendom.
   - − Standardna implementacija omogućava korisniku da sačuva ceo PDF (potrebne dodatne zaštitne mere).

2. **PSPDFKit Web Reader (komercijalno)**
   - + Pruža zaštitu i granularnu kontrolu nad prikazom i dobijanjem sadržaja.
   - − Visoka cena (od ~500€+ godišnje), prevazilazi budžet.

3. **Cloud servisi (npr. Google Drive Viewer, Adobe Document Cloud)**
   - + Jednostavno embedovanje.
   - − Nezadovoljava bezbednosne zahteve; korisnik može da preuzme ili pristupi originalnom fajlu.
   - − Potencijalne pravne i privatnosne prepreke (upload knjiga na eksterni servis).

**Zaključak:** Najbolje je koristiti PDF.js kao render mehanizam, uz sopstveni backend servis za bezbedno strimovanje i kontrolu pristupa.

## Predložena arhitektura
1. **Backend skladište**
   - Čuvanje PDF datoteka u privatnom storage-u (lokalni filesystem, privatni S3 bucket ili baza).
   - Šifrovanje fajlova „at rest“ (AES-256) kako bismo umanjili rizik od curenja podataka.

2. **Servis za strimovanje**
   - Endpoint `/api/books/:id/stream` koji vraća PDF sadržaj segment po segment (Range request ili custom chunk format).
   - Implementirati kontrolu pristupa na nivou korisnika (JWT + RBAC) i ograničiti brzinu/zahteve (rate limiting).
   - Svaki zahtev vraća samo traženi opseg bajtova (HTTP Range) ili renderovani pojedinačni page kao PDF fragment/PNG.

3. **Frontend čitač**
   - React komponenta zasnovana na PDF.js.
   - PDF.js `getDocument` koristiti sa custom `PDFDataRangeTransport` koji prosleđuje Range zahteve backendu.
   - Keširati samo minimalno potrebne stranice u memoriji (ne u LocalStorage).
   - UI elementi: navigacija kroz strane, zoom, toc, night mode; po potrebi i „resume reading“.

4. **Kontrola preuzimanja**
   - Isključiti „download/print“ kontrole iz PDF.js toolbara.
   - Koristiti obfuskaciju i Content Security Policy (blokirati `blob:` download).
   - Razmotriti renderovanje u canvas/sliku (image tiling) umesto kompletnog PDF-a (veća zaštita ali manja interaktivnost, lošija pretraga).
   - Dodati dinamički watermark (korisničko ime, vreme) preko svakog prikaza stranice.

5. **Dodatne bezbednosne mere**
   - Kratkotrajne potpisane URL-ove ili tokeni za svako učitavanje stranice.
   - Evidentiranje pristupa (audit log) i detekcija neobičnih patterna (masovno listanje, pokušaji preuzimanja).
   - Onemogućiti CORS ka trećim domenima.

## Detaljan plan implementacije
1. **Analiza zahteva (1 nedelja)**
   - Potvrditi format knjiga, veličinu, očekivani broj korisnika.
   - Definisati UX zaht. kroz prototip (Figma) – fokus na intuitivnosti.

2. **Backend rad (2–3 nedelje)**
   - [ ] Napraviti servis za sigurno čuvanje PDF-ova (encrypt/decrypt servis).
   - [ ] Implementirati API za dohvat metapodataka knjige (naslov, opis, broj strana).
   - [ ] Implementirati Range streaming endpoint (sa auth + rate limit).
   - [ ] Dodati logiku za generisanje watermarka (npr. PDF stranice renderovane u PNG sa overlay-em ili PDF watermark u letu).

3. **Frontend rad (2 nedelje)**
   - [ ] Integrisati PDF.js (ili `react-pdf`) sa custom loaderom koji koristi Range API.
   - [ ] Dizajnirati UI: sidebar za toc, pretraga, progress bar, night mode.
   - [ ] Implementirati onemogućavanje download/print opcija.
   - [ ] Dodati overlay watermark i zaštitu od copy/paste (onemogućiti tekst selekciju kada je potrebno).

4. **Bezbednosne revizije (1 nedelja)**
   - [ ] Pen-test pristupa PDF endpointu (brute force, direktno preuzimanje).
   - [ ] Validacija da Range API ne vraća ceo fajl u jednom pozivu.
   - [ ] Provera CSP, CORS i rate limit politika.

5. **QA i korisničko testiranje (1 nedelja)**
   - [ ] Testiranje performansi: kako se ponaša za velike PDF-ove (200+ MB).
   - [ ] Testiranje različitih browsera i uređaja.
   - [ ] Prikupljanje feedback-a od pilot korisnika.

6. **Puštanje u produkciju**
   - Automatizovana deploy pipeline (CI/CD).
   - Monitoring (npr. Prometheus + Grafana ili cloud alternativa).

## Procena troškova
- **Software**: PDF.js (0€), dodatne JS biblioteke (0€).
- **Infra**: postojeći hosting. Dodatni troškovi zavise od broja korisnika i storage-a (procena 5–10€ mesečno na DigitalOcean/AWS za bandwidth).
- **Potencijalno plaćene opcije**: usluge za DRM/watermarking (npr. PDFTron WebViewer – 29€/mesec start, ali prelazi budžet; alternativa je self-host rešenje kao `pdfcpu`).
- **Ukupno**: očekivano < 30€ ako se oslonimo na open-source i sopstveni hosting.

## Rizici i mitigacija
- **Korisnik pravi screenshot**: Ne može se sprečiti u potpunosti; mitigacija putem watermarka i pravnih upozorenja.
- **Veliki fajlovi**: potrebna optimizacija (preprocessing u manje chunkove, lazy loading). Razmotriti pripremu `progressive PDF` formata.
- **PDF sa složenim fontovima**: testirati i eventualno embeddovati fontove u canvas render.

## Sledeći koraci
1. Izraditi UX prototip i dobiti odobrenje stakeholdera.
2. Postaviti proof-of-concept Range API + PDF.js integracije.
3. Procena performansi i bezbednosnih rupa, iterativno poboljšanje.
4. Plan rollout-a i komunikacije ka korisnicima.

