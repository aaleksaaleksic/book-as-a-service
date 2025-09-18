# Plan izrade novih admin stranica

Ovaj plan pokriva funkcionalne i vizuelne smernice za razvoj preostalih ekrana Readify Admin Dashboard-a. Fokus je na korišćenju postojećih backend endpoint-a i UI sistema (AdminLayout, kartice, tabele, statistički prikazi) kako bi novi ekrani ostali konzistentni sa postojećim dizajnom.【F:frontend/src/components/admin/AdminLayout.tsx†L31-L135】

## Opšte smernice
- **Vizuelni identitet:** osloniti se na postojeće tipografske tokene (`dt.typography`), gradijente pozadine i kartice sa blagim senkama koji su već implementirani na dashboard početnoj stranici.【F:frontend/src/app/admin/page.tsx†L53-L117】
- **Komponentizacija:** koristiti postojeće UI komponente (`Card`, `Badge`, `Button`, `Table`, `Tabs`, `Skeleton`, `Alert`) kako bi se podržale učitavanje/error stanja i brze interakcije.
- **Podaci i dozvole:** prikazivati samo ono što je backend već obezbedio (npr. `GET /api/v1/users`, `GET /api/v1/admin/analytics/books/stats`, `GET /api/v1/admin/payments/revenue`). Svi admin endpoint-i zahtevaju odgovarajuće `CAN_*` dozvole pa front treba da proveri pristup putem `useAuth().hasPermission` pre učitavanja.【F:frontend/src/components/admin/AdminLayout.tsx†L44-L90】【F:backend/readify/src/main/java/me/remontada/readify/controller/UserController.java†L25-L55】【F:backend/readify/src/main/java/me/remontada/readify/controller/AnalyticsController.java†L256-L347】【F:backend/readify/src/main/java/me/remontada/readify/controller/PaymentController.java†L71-L169】
- **Stanja:** za svaki ekran planirati loading (skeleton), empty state (informativna kartica sa CTA), error state (Alert) i osnovne filtere gde backend podržava.

## 1. Korisnici (`/admin/users`)
### Backend izvori
- `GET /api/v1/users` – lista svih korisnika sa osnovnim metapodacima, subscription statusom i verifikacijama.【F:backend/readify/src/main/java/me/remontada/readify/controller/UserController.java†L25-L45】【F:frontend/src/api/types/auth.types.ts†L29-L53】
- `GET /api/v1/users/{id}` – detalji jednog korisnika za bočne panele/dijaloge.【F:backend/readify/src/main/java/me/remontada/readify/controller/UserController.java†L47-L63】
- `POST /api/v1/subscriptions/{id}/cancel` – ukidanje pretplate ako je admin dobio `CAN_CANCEL_SUBSCRIPTION` dozvolu.【F:backend/readify/src/main/java/me/remontada/readify/controller/SubscriptionController.java†L130-L175】

### Layout i UX
1. **Hero kartica** sa brojem aktivnih pretplata, korisnika u trial-u i novih registracija (računati iz liste korisnika i eventualno `subscriptionStatus`).
2. **Tabela korisnika** (responsive) sa kolonama: ime i prezime (sa inicijal avatarom), email & status (badge `Email verifikovan`), tip pretplate (`subscriptionStatus`, `trialEndsAt`), datum registracije, quick actions.
3. **Bočni panel / Sheet**: klikom na red otvara se detaljan prikaz korisnika (kontakt podaci, istorija pretplata preko `GET /api/v1/subscriptions/history` filtrirano po `userId` ako proširimo hook, trenutni status telefona/email verifikacije).
4. **Akciona traka**: dugmad `Suspenduj nalog` (ako backend podržava u budućnosti – ostaviti disabled placeholder) i `Otkaži pretplatu` (poziva `/subscriptions/{id}/cancel`).
5. **Filter sekcija** iznad tabele: `Status pretplate` (Active/Trial/None), `Verifikacija` (Email/Telefon), search po emailu/ime, sa lokalnim filtriranjem dok ne stigne napredni endpoint.

### Stanja i prazne liste
- Ako nema korisnika: prikazati ilustrativni `Card` sa CTA „Pozovite korisnike da se registruju“.
- Loading: skeleton redovi u tabeli (5 redova) + shimmer kartice.

## 2. Plaćanja (`/admin/payments`)
### Backend izvori
- `GET /api/v1/admin/payments/revenue` – ukupni i mesečni prihod, broj uspešnih plaćanja.【F:backend/readify/src/main/java/me/remontada/readify/controller/PaymentController.java†L71-L118】
- `GET /api/v1/admin/payments/stats` – dodatne metrike (average payment, insights).【F:backend/readify/src/main/java/me/remontada/readify/controller/PaymentController.java†L120-L168】
- `GET /api/v1/admin/subscriptions` – lista aktivnih pretplata za pregled plaćanja po korisniku (indirektno).【F:backend/readify/src/main/java/me/remontada/readify/controller/SubscriptionController.java†L205-L244】
- `GET /api/v1/payments/subscription/{id}` – detalji plaćanja za konkretnu pretplatu (koristiti nakon izbora iz liste).【F:backend/readify/src/main/java/me/remontada/readify/controller/PaymentController.java†L49-L108】

### Layout i UX
1. **Finansijski overview**: četiri kartice u `grid`-u (Total revenue, Mesečni revenue, Prosečno plaćanje, Uspešna plaćanja). Kartice mogu imati gradient background i mini sparkline (koristiti `tailwind` pseudo-elemente ili integrisati jednostavan `canvas`/`svg` chart).
2. **Revenue trend**: sekcija sa `Tabs` (30 dana / 90 dana / 12 meseci). Pošto backend trenutno vraća samo totalne brojke, plan je da prikažemo placeholder chart sa info „Detaljna vremenska serija u razvoju“ i CTA za eksport (disabled). Kasnije se može osloniti na `analyticsService` ako se proširi.
3. **Tabela transakcija**: kombinovati aktivne pretplate (`/admin/subscriptions`) sa dugmetom „Prikaži plaćanja“. Klik otvara modal koji učitava `GET /payments/subscription/{id}` i renderuje listu transakcija sa status badge-ovima (`PENDING`, `COMPLETED`, `FAILED`...).
4. **Akcije**: dugme „Simuliraj uspešno plaćanje“ koje otvara formu (amount input) i gađa `POST /admin/payments/test` sa `type=success` ili `failure` u razvojne svrhe. Rezultat prikazati kao toast + dodatni red u tabeli.
5. **Analitički highlight**: kartica sa `insights.revenueGrowth`, `paymentSuccessRate`, `primaryPaymentMethod` prikazanim kao „signalne lampice“ (badge + mini ikone `TrendingUp`, `Shield` za pouzdanost).

## 3. Analitika (`/admin/analytics`)
### Backend izvori
- `GET /api/v1/admin/analytics/dashboard` – agregatna metrika (čitanja, vreme čitanja, engagement skor...).【F:backend/readify/src/main/java/me/remontada/readify/controller/AnalyticsController.java†L256-L283】
- `GET /api/v1/admin/analytics/books/popular` i `/books/most-read` – rang liste knjiga po klikovima i pročitanim minutima.【F:backend/readify/src/main/java/me/remontada/readify/controller/AnalyticsController.java†L285-L335】
- `GET /api/v1/admin/analytics/readers/top` – top čitaoci.【F:backend/readify/src/main/java/me/remontada/readify/controller/AnalyticsController.java†L347-L371】

### Layout i UX (kreativni koncept)
1. **Hero „Command Center“**: full-width `Card` sa blur-animiranim gradientom i overlay grafikom („galaksija čitanja“). U sredini big number metričke ploče: `Daily Active Readers`, `Ukupno minuta čitanja`, `Prosečna dužina sesije`, `Engagement Score`. Za svaku metriku mini-bar koji se popunjava prema procentu (koristiti `div` sa gradient progress trackom).
2. **Glavna mreža vizualizacija**:
   - **„Flow of Reading“ heatmap**: koristiti CSS grid od 7x4 ćelije (dani x vremenski slotovi) sa nijansama zelene/žute. Vrednosti dolaze iz dashboard analytics (ako se dobija po danu, u suprotnom generisati iz prosek/placeholder sa tooltipom „Detaljni podaci u pripremi“).
   - **Popularni naslovi**: `Carousel` (Embla) kartica sa `GET /books/popular` podatkom (naslov, autor, klikovi, conversion rate). Svaka kartica ima trofej `Badge` i gradient border.
   - **Najčitanije knjige**: vertikalna lista sa `Progress` barovima koji prikazuju odnos čitanih minuta prema maksimumu.
   - **Top čitaoci**: tabela sa avatarima, brojem pročitanih minuta i „Consistency streak“ (računati iz `recentSessions` ako dostupno, ili placeholder 7/14/30 dana).
3. **Interaktivni filter bar** na vrhu stranice: `Select` za vremenski period (7/30/90 dana), `DateRangePicker` (kada se implementira), toggle za metric mode (Čitanja vs. Klikovi). Po promeni se refetch-uje relevantan endpoint.
4. **Storytelling sekcija „Insight cards“**: tri `Card`-a sa generisanim tekstom iz `activitySummary` polja (formatirati kao `blockquote` + ikone `Sparkles`, `Flame`, `Moon` za noćno čitanje). Ovo daje „wow“ efekat.
5. **CTA**: „Preuzmi izveštaj (PDF)“ – disabled dok ne postoji backend generisanje, ali vizuelno pripremljeno.

## 4. Podešavanja (`/admin/settings`)
### Backend izvori
- Za sada nema specifičnih admin endpoints – koristiti dostupne informacije o ceni pretplate i konfiguraciji iz `/api/v1/subscriptions/pricing` i eventualno mehanizme za simulaciju plaćanja.【F:backend/readify/src/main/java/me/remontada/readify/controller/SubscriptionController.java†L177-L204】

### Layout i UX
1. **Sekcija „Organizacioni podaci“**: kartica sa informacijama o planovima (`monthly`, `yearly`, `trial`) i mogućnošću editovanja cene (forma koja za sada prikazuje vrednosti read-only uz badge „Dolazi uskoro“).
2. **Dozvole i uloge**: tabla koja list uloge (Admin, Moderator) i dozvole iz `useAuth().user.permissions`. Omogućiti togglove koji su disabled dok backend ne podrži promenu.
3. **Notifikacije**: panel sa switch-evima (Email digest, Upozorenja o plaćanjima, Održavanje). Switch vrednosti čuvati lokalno (context) i planirati kasniji API.
4. **Integracije**: kartice za „Plaćanja“ (NLB Pay), „Analitika“ (Google Analytics placeholder) sa status badge-ovima (Connected/Offline) i CTA „Podesi“.
5. **Sigurnosna sekcija**: lista poslednjih admin prijava (ako nema API – prikazati placeholder) i dugme „Regeneriši API ključ“ (disabled, tooltip „U pripremi“). Fokus na informativnom UI-u dok ne postoji backend.

## 5. Pregled knjige (`/admin/books/[id]`)
### Backend izvori
- `GET /api/v1/books/{id}` – detalji knjige (već koristi `useBook`).【F:frontend/src/hooks/use-books.ts†L26-L38】
- `GET /api/v1/admin/analytics/books/{bookId}` – specifična analitika knjige (klikovi, minuti čitanja, engagement, activity summary).【F:backend/readify/src/main/java/me/remontada/readify/controller/AnalyticsController.java†L311-L339】

### Layout i UX
1. **Header**: naslov + autor sa `Badge` (Premium/Besplatna), status dostupnosti (`isAvailable`) i kontrole (`Edit`, `Preview` – otvara javni prikaz u novom tabu).
2. **Info grid**: dve kolone; levo osnovni meta podaci (ISBN, kategorija, broj stranica, jezik, godina izdanja), desno preview korice (ako postoji). Koristiti `Card` sa `border-reading-accent`.
3. **Analitički modul**: `Tabs` sa `Overview`, `Čitanost`, `Publika`. `Overview` prikazuje KPI (daily sessions, average session duration, conversion rate). `Čitanost` sadrži mini line chart (možemo koristiti lightweight `svg` path) sa 30-dnevnim podacima ako endpoint vraća seriju; ako ne, prikazati `Skeleton chart` + status poruku.
4. **Activity summary**: formatirati `activitySummary` u „narativnu“ karticu sa ikonama i highlight-om ključnih brojeva (`dailyClicks`, `dailyReadingMinutes`).
5. **Povezane radnje**: kartica sa linkovima „Izmeni knjigu“, „Dodaj promotivnu kampanju“ (disabled) i „Podeli sa korisnicima“ (kopira share link u clipboard).

## 6. Uklanjanje dugmeta „Preuzmi postojeći PDF“
- Na stranici za izmenu knjige uklanja se sekundarno dugme koje vodi na postojeći PDF kako bi se smanjila konfuzija. U `EditBookForm` zadržati mogućnost upload-a novog PDF-a, ali bez linka ka trenutnom fajlu.【F:frontend/src/components/admin/EditBookForm.tsx†L430-L471】
- Validirati da korisnik i dalje može da zameni fajl preko upload input-a i da badge „Novi PDF“ radi. Skeleton i stanja ostaju neizmenjeni.

## Implementacioni koraci
1. **Novi hooks**: kreirati `useUsers`, `usePayments`, `useAnalytics` u `frontend/src/hooks` sa React Query cache ključevima po endpoint-u.
2. **Stranice**: dodati `app/admin/users/page.tsx`, `app/admin/payments/page.tsx`, `app/admin/analytics/page.tsx`, `app/admin/settings/page.tsx`, `app/admin/books/[id]/page.tsx`. Sve stranice koriste `AdminLayout` i strukturirane su u sekcije sa `Card` komponentama.
3. **UI komponente**: izgraditi reusable delove – `StatusBadge`, `MetricCard`, `InsightCard`, `UserDrawer`, `PaymentModal`, `AnalyticsHeatmap`, `TrendChart` (može koristiti `svg` ili eventualno dodati `recharts`).
4. **Testiranje**: osigurati da je svaki hook pokriven mock server testovima (React Testing Library + MSW) i da ESLint prolazi. Za backend integraciju planirati e2e smoke testove kad se API-ji spoje.

Ovaj plan osigurava da novi admin ekrani budu konzistentni, bogati informacijama i spremni za postepeno proširenje čim backend izloži dodatne podatke.
