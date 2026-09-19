# 📘 Projektová a technická dokumentace: My Dead Drops (MDD)

Verze: 3.0.0 (PWA & Native Notifications Release)  
Datum aktualizace: 18. září 2026  
Status projektu: Aktivní produkční architektura (Full-Stack Express + React 19 + TypeScript + PWA + Workbox)

---

## 1. Úvod a vize projektu

Aplikace **My Dead Drops (MDD)** je bezpečná, diskrétní a minimalistická webová platforma navržená pro anonymní asynchronní předávání fyzických zásilek (tzv. *dead drops* – mrtvých schránek) mezi dvěma stranami:
- **Vendor (Vytvářející):** Umístí fyzickou úschovu, zaznamená její polohu na mapě, připojí fotografie a textový popis, stanoví cenu a případně nouzovou zprávu. Systém mu vygeneruje jedinečný 6místný PIN. Může také přijímat zakázkové žádosti od zákazníků a jedním kliknutím je transformovat na novou úschovu.
- **Zákazník (Příjemce):** Bez nutnosti registrace či instalace zadá 6místný PIN na úvodní obrazovce (případně vloží jedním klikem ze schránky), uhradí případnou platbu PaySafeCard s 30minutovým ověřovacím časovačem, zobrazí taktickou či satelitní mapu s přesným popisem a po nalezení potvrdí převzetí. Zákazník může rovněž vytvořit zakázkovou poptávku po dropu v konkrétní lokalitě se sledovacím kódem `REQ-XXXXXX`.

### Klíčové principy:
1. **Zero-Knowledge Privacy:** Žádné ukládání identity zákazníka, žádné cookies, žádné sledovací skripty.
2. **Klientská sanitizace médií:** Metadata z fotografií (EXIF, GPS souřadnice, model fotoaparátu, čas) jsou nevratně odstraněna v prohlížeči před odesláním na server.
3. **Kryptografické hashování:** Server nezná prostý text PIN kódů zákazníků, ukládá pouze SHA-256 hashe.
4. **100% Bezplatný provoz bez závislostí na placených API klíčích:** Využití otevřených mapových dlaždic OpenStreetMap s tmavým filtrem a satelitních snímků Esri World Imagery.
5. **Zero-Popup UX & Web Audio:** Žádná rušivá `window.alert` či `window.confirm` vyskakovací okna. Veškeré stavy jsou řešeny plynulými in-app notifikacemi, dvoustupňovým inline potvrzením a diskrétní syntetizovanou zvukovou odezvou.
6. **PWA Standalone & Offline Caching:** Podpora instalace na plochu mobilních telefonů i počítačů. Service worker cachuje statické balíčky i mapové dlaždice (OSM i satelit) pro bezproblémovou navigaci v místech bez signálu.
7. **Nativní systémová oznámení:** Integrace s operačním systémem (desktop i mobil) pro okamžité informování o schválení platby, blížícím se vypršení 30min limitu nebo novém kódu k ověření pro vendora.

---

## 2. Architektura systému

Aplikace je postavena na robustním moderním full-stackovém stacku:

```
┌──────────────────────────────────────────────────────────────────────────┐
│              KLIENT (React 19 + Vite + VitePWA + Motion)                │
│  - CustomerClaim (Zadání PINu, 1-click paste, dešifrování, potvrzení)   │
│  - CustomerRequestDrop (Poptávka po dropu, sledování REQ-XXXXXX kódu)    │
│  - VendorCreate (Mapový výběr, popis, EXIF čistič, 1-click import)       │
│  - VendorDashboard (Správa úschov, schvalování PSC, správa žádostí)      │
│  - PaymentModule (30min PSC odpočet, maskování PINu, live polling)       │
│  - InteractiveMap (Leaflet + OpenStreetMap + Esri Satelit)               │
│  - systemNotifications (Nativní OS oznámení: schválení, časovač, alerty)│
│  - usePWAInstall & PWAInstallButton (In-app instalace & iOS průvodce)   │
│  - imageSanitizer (HTML5 Canvas EXIF stripping)                          │
│  - soundEffects (Taktický Web Audio API syntetizátor)                    │
│  - NotificationBanner (In-app neblokující systém oznámení)               │
│  - Service Worker (Workbox: CacheFirst pro assety a OSM/Esri dlaždice)  │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │ HTTP / JSON REST API
┌────────────────────────────────────▼─────────────────────────────────────┐
│                       SERVER (Express + Node.js)                         │
│  - Brute-force Rate Limiting (15 min ban po 5 neúspěšných pokusech)      │
│  - SHA-256 PIN Hasher                                                    │
│  - Správce životního cyklu (TTL 7 dní a 30min PSC timeouty)             │
│  - Duální API aliasy (/pay & /pay-psc, /cancel-payment & /pay-psc/cancel) │
│  - Jednotný fallback pro /api/* vracející striktní JSON 404/500          │
│  - JSON File Storage Engine (/data/drops.json, /data/requests.json)      │
│  - Vite SPA Middleware                                                   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Bezpečnostní mechanismy

### 3.1 Klientské odstranění EXIF a komprese (`src/utils/imageSanitizer.ts`)
- **Riziko:** Mobilní telefony ukládají do fotografií GPS souřadnice domova vendora, IMEI a čas pořízení.
- **Řešení:** Fotografie jsou zpracovány výhradně na klientském zařízení. Skript načte soubor do HTML5 Canvasu, provede překreslení pixelů a exportuje čistý JPEG/WebP. Žádná původní metadata (EXIF/TIFF/XMP) se do datového proudu nedostanou.

### 3.2 Jednosměrné hashování PIN kódů
- PIN kód je vygenerován ze 32 bezpečných znaků (`23456789ABCDEFGHJKLMNPQRSTUVWXYZ`), které vylučují snadno zaměnitelné znaky (`0, O, 1, I, L`).
- Na serveru je PIN okamžitě převeden pomocí `crypto.createHash('sha256')`. Při zadání kódu zákazníkem se porovnávají pouze hashe.

### 3.3 Ochrana proti hrubé síle (Rate Limiting)
- Monitorování neúspěšných pokusů o zadání PINu na úrovni IP adresy.
- Po 5 neúspěšných pokusech je IP adresa zablokována na 15 minut (HTTP 429 Too Many Requests).

### 3.4 Gated Location ochrana souřadnic
- Pokud je úschova zpoplatněna a nebyla dosud potvrzena vendorem, server prostřednictvím funkce `sanitizeDropForCustomer` vynuluje `latitude` i `longitude`, vyprázdní pole fotografií a zamkne přesný popis. Tím je zabráněno neautorizovanému vyzvednutí bez zaplacení.

### 3.5 Skrytí vendor rozhraní
- Veřejná hlavní stránka obsahuje pouze pole pro PIN nebo záložku pro poptávku.
- Administrace vendora je dostupná na neveřejné adrese `/vendor` a chráněna autorizační branou s demo přihlášením na 1 klik (`admin` / `demo`).

---

## 4. Datové struktury (TypeScript Types)

```typescript
export type DropStatus = 'CREATED' | 'VIEWED' | 'COLLECTED' | 'NOT_FOUND' | 'EXPIRED';
export type PaymentStatus = 'UNPAID' | 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'REJECTED';
export type RequestDropStatus = 'PENDING' | 'ACCEPTED' | 'FULFILLED' | 'REJECTED';

export interface StatusHistoryItem {
  status: DropStatus;
  timestamp: number;
  note?: string;
}

export interface Photo {
  id: string;
  dataUrl: string;
  sizeBytes: number;
}

export interface DeadDrop {
  id: string;
  pinHash: string;
  rawPin?: string;
  description: string;
  latitude: number;
  longitude: number;
  photos: Photo[];
  createdAt: number;
  expiresAt: number;
  burnAfterReading: boolean;
  viewCount: number;
  claimedAt: number | null;
  status: DropStatus;
  history: StatusHistoryItem[];
  amount?: string;
  price?: number;
  currency?: string;
  isPaid?: boolean;
  paidAt?: number;
  paymentMethod?: 'PAYSAFECARD';
  paymentStatus?: PaymentStatus;
  pscCode?: string;
  submittedPscCode?: string; // Maskovaný tvar pro zákazníka (****-****-****-1234)
  pscSubmittedAt?: number;
  pscExpiresAt?: number; // 30minutový limit na ověření vendorem
  burnerAlert?: string;
  burnerAlertSetAt?: number;
}

export interface CustomerDropRequest {
  id: string;
  requestCode: string; // Např. REQ-7K9M2X
  latitude: number;
  longitude: number;
  locationDescription?: string;
  amount: string;
  price: number;
  currency: string;
  pscTiming: 'NOW' | 'LATER';
  pscCode?: string;
  pscConfirmed?: boolean;
  note?: string;
  status: RequestDropStatus;
  createdAt: number;
  fulfilledDropPin?: string;
}
```

---

## 5. REST API Specifikace

### 5.1 Zákaznické endpointy

#### `POST /api/drops/claim`
Ověření PIN kódu a načtení úschovy (případně sanitizované, pokud čeká na platbu).
- **Request Body:** `{ "pin": "7K9M2X" }`
- **Response (200):** `{ "success": true, "drop": DeadDrop }`
- **Response (404):** `{ "success": false, "error": "Úschova nebyla nalezena nebo expirovala." }`
- **Response (429):** `{ "success": false, "error": "Příliš mnoho pokusů. Zkuste to za 15 minut." }`

#### `GET /api/drops/:id`
Přímé načtení detailu zásilky pro live polling platebního stavu.
- **Response (200):** `{ "success": true, "drop": DeadDrop }`

#### `POST /api/drops/:id/pay` a `/api/drops/:id/pay-psc` (Aliasy)
Zákaznické odeslání 16místného kuponu PaySafeCard k manuálnímu ověření.
- **Request Body:** `{ "pscCode": "1234-5678-9012-3456" }`
- **Chování:** Nastaví `paymentStatus = 'PENDING_CONFIRMATION'`, spustí 30minutový časovač (`pscExpiresAt = now + 30m`) a zapíše událost do časové osy.

#### `POST /api/drops/:id/cancel-payment` a `/api/drops/:id/pay-psc/cancel` (Aliasy)
Zrušení čekající žádosti o ověření PaySafeCard zákazníkem.
- **Response (200):** `{ "success": true, "drop": DeadDrop }`

#### `POST /api/drops/:id/status`
Zákaznická aktualizace stavu úschovy v terénu.
- **Request Body:** `{ "status": "COLLECTED" | "NOT_FOUND" }`
- **Chování:** Přepne stav zásilky a zaznamená časové razítko. Pokud byla zapnuta volba *Burn after reading*, je zásilka po vyzvednutí zničena.

#### `POST /api/requests`
Vytvoření zákaznické poptávky po novém dropu.
- **Request Body:** `{ latitude, longitude, locationDescription, amount, price, currency, pscTiming, pscCode, note }`
- **Response (201):** `{ "success": true, "request": CustomerDropRequest }`

#### `GET /api/requests/track/:code`
Sledování stavu zákaznické poptávky podle kódu (např. `REQ-8K2N5P`).
- **Response (200):** `{ "success": true, "request": CustomerDropRequest }`

---

### 5.2 Vendor & Administrátorské endpointy

#### `GET /api/drops`
Získání seznamu všech úschov včetně nezahashovaných PINů pro správce.

#### `POST /api/drops`
Vytvoření nového dead dropu s možností importu z existující poptávky.

#### `POST /api/drops/:id/confirm-payment`
Manuální schválení (`CONFIRM`) nebo zamítnutí (`REJECT`) odeslaného PaySafeCard kuponu.
- **Request Body:** `{ "action": "CONFIRM" | "REJECT", "reason"?: string }`
- **Chování:** Při `CONFIRM` se nastaví `isPaid = true`, odemknou se plné GPS souřadnice i fotografie.

#### `POST /api/drops/:id/alert`
Nastavení nebo úprava nouzové zprávy (Burner Alert) pro zákazníka.

#### `DELETE /api/drops/:id`
Okamžité trvalé smazání úschovy ze serveru.

#### `GET /api/requests`
Výpis všech aktivních i vyřízených poptávek zákazníků.

#### `POST /api/requests/:id/status`
Změna stavu poptávky (`ACCEPTED`, `FULFILLED`, `REJECTED`) s volitelným přiřazením PINu vytvořené úschovy.

---

## 6. Stavový diagram a životní cyklus

```
                    [ Vendor vytvoří drop ]
                               │
                               ▼
                        ┌──────────────┐
                        │   CREATED    │
                        │  (Vytvořena) │
                        └──────┬───────┘
                               │ Zákazník zadá platný PIN
                               ▼
                        ┌──────────────┐
           ┌───────────►│    VIEWED    │◄───────────────┐
           │            │  (Zobrazena) │                │
           │            └──────┬───────┘                │
           │                   │                        │
(Opakované zobrazení)          │                        │
           │                   ▼                        │
           │          Je vyžadována platba?             │
           │          ┌────────┴────────┐               │
           │          │ ANO             │ NE            │
           │          ▼                 │               │
           │   ┌───────────────┐        │               │
           │   │ GATED LOCKED  │        │               │
           │   │ (Skrytá GPS)  │        │               │
           │   └──────┬────────┘        │               │
           │          │ Odeslán PSC     │               │
           │          ▼                 │               │
           │   ┌───────────────┐        │               │
           │   │ 30-MIN TIMER  │        │               │
           │   │ (Čekání na PSC)│       │               │
           │   └──────┬────────┘        │               │
           │          │ Vendor potvrdí  │               │
           │          ▼                 │               │
           │   ┌───────────────┐        │               │
           │   │ GPS ODEMČENA  │        │               │
           │   └──────┬────────┘        │               │
           │          │                 │               │
           └──────────┴────────┬────────┴───────────────┘
                               │
                   ┌───────────┴───────────┐
                   ▼                       ▼
            ┌──────────────┐        ┌──────────────┐
            │  COLLECTED   │        │  NOT_FOUND   │
            │ (Vyzvednuto) │        │ (Nenalezeno) │
            └──────┬───────┘        └──────────────┘
                   │
                   │ (Pokud burnAfterReading = true)
                   ▼
            [ Trvale skartováno ]

   * Automatická expirace po 7 dnech nečinnosti ➔ [ EXPIRED ]
```

---

## 7. Přehled implementace a verze

- **v1.0 - v2.1:** Základní architektura, EXIF čistič, Leaflet Dark/Satelit/Ulice, SHA-256, životní cyklus a timeline.
- **v2.2:** PaySafeCard Gated Location systém s 30minutovým odpočtem a live pollingem.
- **v2.3:** Zákaznické žádosti o drop (`CustomerRequestDrop`), sledovací kódy `REQ-XXXXXX`, 1-click import poptávky do formuláře tvorby úschovy.
- **v2.4:** Motion pružinové animace (`motion/react`), 1-click presety, 1-click paste ze schránky a 1-click demo přihlášení.
- **v2.5:**
  - Vyčištění a sjednocení API rout: podpora duálních aliasů (`/pay` & `/pay-psc`, `/cancel-payment` & `/pay-psc/cancel`).
  - Doplnění endpointu `GET /api/drops/:id` pro spolehlivý stavový polling.
  - Striktní JSON 404/500 middleware pro veškeré `/api/*` cesty chránící před syntaktickými chybami při parsování odpovědi.
  - Odstranění všech volání `window.alert` a `window.confirm` a jejich náhrada bezpečným dvoustupňovým inline mazáním a notifikačními lištami.
  - Bezpečné otevírání mapových odkazů přes standardní kotvy bez blokování v iFrame prostředí.
- **v3.0 (Aktuální verze):**
  - **PWA architektura:** Integrace `vite-plugin-pwa` s Web App Manifestem, `theme_color: "#090a0c"` a plnou podporou `standalone` zobrazení na Androidu, iOS i desktopu.
  - **Offline Service Worker & Map Caching:** Pokročilá Workbox konfigurace s `CacheFirst` strategií pro fonty, statické skripty, styly a mapové dlaždice (OpenStreetMap i Esri World Imagery) pro spolehlivé použití v offline terénu.
  - **Kompletní grafická sada ikon:** Vektorový SVG originál (`/public/icon.svg`), maskable varianta s bezpečnou zónou (`/public/icon-maskable.svg`), rasterizované PNG ikony 192x192 a 512x512, Apple Touch Icon 180x180 a Favicon.
  - **In-App Install Prompt UI:** Komponenta `PWAInstallButton` s reaktivním hookem `usePWAInstall`, automatickým potlačením v standalone režimu a interaktivním modálním průvodcem instalací pro Safari na Apple iOS.
  - **Nativní systémová oznámení:** Modul `systemNotifications.ts` obsluhující Notification API i Service Worker notifikace s vibračním profilem pro mobilní zařízení.
  - **Automatické spouštění notifikací v klíčových momentech:** Oznámení schválení/zamítnutí PaySafeCard platby, 5minutové varování před vypršením 30min lhůty, příjem nouzového signálu (Burner Alert) a nová platba k ověření pro vendora.
  - **Ovládací panel v liště:** Rychlé tlačítko `NotificationPermissionButton` s indikátorem stavu a možností otestovat systémová oznámení v reálném čase.
