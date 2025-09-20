# Implementacija sigurnog PDF čitača

Ovaj dokument opisuje tehnologije i tok rada implementiran za prvi inkrement sigurnog PDF čitača zasnovanog na planu из `docs/pdf_reader_plan.md`.

## Korišćene tehnologije

- **Backend**
  - Spring Boot 3 (REST kontroleri, sigurnost i CORS)
  - `ResourceRegion` streaming sa HTTP Range podrškom
  - Custom servis `PdfStreamingService` za segmentaciju PDF fajlova
  - Lokalni fajl sistem (`LocalFileStorageService`) kao skladište PDF-ova
  - Spring Security (JWT autentikacija, RBAC)

- **Frontend**
  - Next.js 15 (App router) i React 19
  - `pdfjs-dist` 4.x kao renderer PDF stranica (PDF.js)
  - React Query za upravljanje server-state stanjima
  - Tailwind CSS i postojeća Readify UI biblioteka za stilove
  - Lucide React ikone za navigaciju čitača

- **Analitika i praćenje**
  - Postojeći Spring endpoints `/api/v1/analytics/reading/*`
  - Custom React hook-ovi (`useStartReadingSession`, `useUpdateReadingProgress`, `useEndReadingSession`)

## Visok nivo toka

1. **Dohvatanje metapodataka knjige** – Frontend poziva `GET /api/v1/books/{id}/read` i dobija:
   - DTO knjige
   - `stream` objekat sa: sigurnim URL-om (`/api/v1/files/books/{id}/content`), veličinom fajla i chunk veličinom.
   - `watermark` metapodaci (tekst, potpis) koji će biti prikazani preko stranice.

2. **Pokretanje analitičke sesije** – nakon uspešnog dobijanja prava na čitanje frontend poziva `POST /api/v1/analytics/reading/start`.

3. **Streaming PDF sadržaja** – PDF.js učitava dokument koristeći Range zahteve. Backend kroz `PdfStreamingService` vrati samo traženi segment (`ResourceRegion`) i setuje bezbednosne zaglavlja (`Content-Range`, `Accept-Ranges`, `X-Readify-Watermark`, `Content-Security-Policy`, itd.).

4. **Render stranica** – klijentska komponenta `ReaderView` renderuje stranicu u `<canvas>` element, prikazuje watermark i pruža kontrole (sledeća/prethodna stranica, zoom, fit-width).

5. **Praćenje napretka** – pri promeni strane šalje se debouncovan `PUT /api/v1/analytics/reading/{sessionId}/progress`, a pri zatvaranju komponente `PUT /api/v1/analytics/reading/{sessionId}/end` sa informacijom o poslednjoj pročitanoj strani.

## Bezbednosne mere

- **Range-only streaming** – kontroler odbija neispravne Range zahteve i vraća 206 Partial Content, sprečavajući lako preuzimanje kompletnog PDF-a.
- **No-store i CSP zaglavlja** – onemogućavaju keširanje i embedovanje dokumenta u neautorizovane okvire.
- **Watermark** – dinamički string na nivou korisnik/knjiga/instanca ubacuje se i u response header i u frontend overlay.
- **CORS i exposed headers** – osiguravaju da frontend može da čita `Content-Range` i druge specifične zaglavlja ali samo sa ovlašćenog porekla.
- **Onemogućeno preuzimanje** – PDF.js toolbar nije izložen, nema download dugmeta, a kontekstni meni je blokiran u prikazu.

## Frontend UX

- Dashboard sada prikazuje listu naslova sa direktnim linkom ka bezbednom čitaču.
- Čitač nudi kontrole za navigaciju i zoom, uz prikaz osnovnih informacija o knjizi u header-u.
- `ReaderView` komponenta se brine o inicijalnom skaliranju stranice na širinu viewport-a i adaptira se na resize događaje.
- Tok je prijateljski prema korisniku (jasne kontrole) a pritom minimalno skladišti podatke (nema localStorage keširanja PDF-a).

## Sledeći koraci

- Persistencija watermark tokena na serveru radi dodatne validacije.
- PWA/offline fallback za manje PDF-ove (sa enkripcijom u IndexedDB).
- Napredni UI elementi (bookmark, night mode, search) planirani u narednim sprintovima.
