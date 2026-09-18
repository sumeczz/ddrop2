# 📘 Projektová a technická dokumentace: My Dead Drops (MDD)

Verze: 2.1.0  
Datum aktualizace: 18. září 2026  
Status projektu: Aktivní prototyp v produkční kvalitě (Full-Stack Express + React)

---

## 1. Úvod a vize projektu

Aplikace **My Dead Drops** je bezpečná, diskrétní a minimalistická webová platforma navržená pro anonymní asynchronní předávání fyzických zásilek (tzv. *dead drops* – mrtvých schránek) mezi dvěma stranami:
- **Vendor (Vytvářející):** Umístí fyzickou úschovu, zaznamená její polohu na mapě, připojí fotografie a textový popis, stanoví cenu a případně nouzovou zprávu. Systém mu vygeneruje jedinečný 6místný PIN.
- **Zákazník (Příjemce):** Bez nutnosti registrace či instalace zadá 6místný PIN na úvodní obrazovce, uhradí případnou platbu (Krypto / PaySafeCard), zobrazí satelitní mapu s popisem a po nalezení potvrdí převzetí.

### Klíčové principy:
1. **Zero-Knowledge Privacy:** Žádné ukládání identity zákazníka, žádné cookies, žádné sledovací skripty.
2. **Klientská sanitizace médií:** Metadata z fotografií (EXIF, GPS souřadnice, model fotoaparátu, čas) jsou nevratně odstraněna v prohlížeči před odesláním.
3. **Kryptografické hashování:** Server nezná prostý text PIN kódů zákazníků, ukládá pouze SHA-256 hashe.
4. **100% Bezplatný provoz bez závislostí na placených API klíčích:** Využití otevřených mapových dlaždic OpenStreetMap a satelitních snímků Esri.

---

## 2. Architektura systému

Aplikace je postavena na moderním plnohodnotném full-stackovém stacku:

```
┌─────────────────────────────────────────────────────────────┐
│                    KLIENT (React 19 + Vite)                │
│  - CustomerClaim (Zadání PINu, dešifrování, potvrzení)     │
│  - VendorCreate (Mapový výběr, popis, EXIF čistič)          │
│  - VendorDashboard (Správa zásilek, životní cyklus, alerty) │
│  - PaymentModule (Krypto BTC/XMR/USDT, PaySafeCard)         │
│  - InteractiveMap (Leaflet + OSM + Esri Satelit)            │
│  - imageSanitizer (HTML5 Canvas EXIF stripping)             │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON REST API
┌──────────────────────────────▼──────────────────────────────┐
│                  SERVER (Express + Node.js)                 │
│  - Brute-force Rate Limiting (15 min ban po 5 pokusech)     │
│  - SHA-256 PIN Hasher                                       │
│  - Správce životního cyklu a TTL (7 dní)                    │
│  - JSON File Storage Engine (/data/drops.json)              │
│  - Vite SPA Middleware                                      │
└─────────────────────────────────────────────────────────────┘
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

### 3.4 Skrytí vendor rozhraní
- Veřejná hlavní stránka obsahuje pouze pole pro PIN.
- Administrace vendora je dostupná na neveřejné adrese `/vendor` a chráněna autorizační branou (`admin` / `demo`).

---

## 4. Datové struktury (TypeScript Types)

```typescript
export type DropStatus = 'CREATED' | 'VIEWED' | 'COLLECTED' | 'NOT_FOUND' | 'EXPIRED';

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
  rawPin: string; // Dostupné pouze v autorizovaném přehledu vendora
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
  paymentMethod?: 'CRYPTO' | 'PAYSAFECARD';
  cryptoType?: 'BTC' | 'XMR' | 'USDT';
  cryptoAddress?: string;
  burnerAlert?: string;
  burnerAlertSetAt?: number;
}
```

---

## 5. REST API Specifikace

### 5.1 Veřejné endpointy pro zákazníka

#### `POST /api/drops/claim`
Ověření PIN kódu a načtení úschovy.
- **Request Body:** `{ "pin": "7K9M2X" }`
- **Chování:** Pokud je zásilka ve stavu `CREATED`, automaticky přechází do stavu `VIEWED` a zaznamená se do historie.
- **Response (200):** `{ "success": true, "drop": DeadDrop }`
- **Response (404):** `{ "success": false, "error": "Úschova nebyla nalezena nebo expirovala." }`
- **Response (429):** `{ "success": false, "error": "Příliš mnoho pokusů. Zkuste to za 15 minut." }`

#### `POST /api/drops/:id/status`
Zákaznická aktualizace stavu zásilky.
- **Request Body:** `{ "status": "COLLECTED" | "NOT_FOUND", "note"?: string }`
- **Chování:** Přepne stav zásilky, přidá záznam do časové osy. Pokud byla aktivována volba *Burn on collection*, zásilka je po vyzvednutí nevratně skartována.

#### `POST /api/drops/:id/pay`
Úhrada zásilky zákazníkem.
- **Request Body (PaySafeCard):** `{ "method": "PAYSAFECARD", "pscCode": "1234123412341234" }`
- **Request Body (Krypto):** `{ "method": "CRYPTO", "cryptoType": "BTC" | "XMR" | "USDT" }`
- **Chování:** Nastaví `isPaid = true`, zapíše záznam do časové osy a odemkne plné souřadnice.

---

### 5.2 Administrátorské endpointy pro Vendora

#### `GET /api/drops`
Získání seznamu všech existujících úschov včetně vygenerovaných PIN kódů, stavu úhrady a kompletní historie událostí.

#### `POST /api/drops`
Vytvoření nového dead dropu.
- **Request Body:**
  ```json
  {
    "description": "Schránka pod kořenem dubu...",
    "latitude": 50.08781,
    "longitude": 14.42046,
    "photos": [{ "dataUrl": "data:image/jpeg;base64,..." }],
    "burnAfterReading": false,
    "amount": "1 ks",
    "price": 800,
    "currency": "CZK",
    "cryptoType": "BTC",
    "burnerAlert": "Pozor, v parku sekají trávu."
  }
  ```
- **Response (201):** `{ "success": true, "pin": "7K9M2X", "expiresAt": 179... }`

#### `POST /api/drops/:id/alert`
Přidání, změna nebo smazání nouzové zprávy (Burner Alert) k aktivní zásilce.

#### `DELETE /api/drops/:id`
Okamžitá manuální skartace a smazání úschovy ze serveru.

---

## 6. Stavový diagram a životní cyklus zásilky

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
               │    VIEWED    │◄────────┐
               │  (Zobrazena) │         │ (Možnost opakovaného
               └──────┬───────┘         │  zobrazení v rámci TTL)
                      │                 │
         ┌────────────┴────────────┐    │
         ▼                         ▼    │
  ┌──────────────┐          ┌──────────────┐
  │  COLLECTED   │          │  NOT_FOUND   │
  │ (Vyzvednuto) │          │ (Nenalezeno) │
  └──────┬───────┘          └──────────────┘
         │
         │ (Pokud burnAfterReading = true)
         ▼
  [ Trvalé smazání ze serveru ]

  * Kdykoliv po 7 dnech bez aktivity ➔ [ EXPIRED ]
```

---

## 7. Mapové řešení (Zero-Cost & No-Watermark)

- **Mapový engine:** Leaflet 1.9.4.
- **Vrstvy (přepínatelné jedním kliknutím):**
  1. **Tmavá:** OpenStreetMap dlaždice s inverzním CSS filtrem (`leaflet-dark-tiles`), bez vodoznaků, 100% anonymní.
  2. **Satelit:** Esri World Imagery ve fotografickém rozlišení pro přesnou navigaci v terénu bez nutnosti registrace.
  3. **Ulice:** Standardní zobrazení OpenStreetMap.
- **GPS Lokalizace:** Využívá HTML5 Geolocation API s vysokou přesností (`enableHighAccuracy: true`).

---

## 8. Prozatímní plán vývoje (Hotovo / V pořadí)

### 🟢 HOTOVO (Realizované moduly)
1. **Jádro systému:** SPA s integrovaným Express serverem a automatickým sestavením do CommonJS.
2. **Klientská ochrana soukromí:** Stripování EXIF dat přes HTML5 Canvas před uploadem.
3. **Zabezpečení PIN kódu:** SHA-256 hashe, bezpečný alfanumerický generátor, Rate Limiting.
4. **Zjednodušený UX design:** Minimalistické taktické rozhraní bez vizuálního smetí.
5. **Auto-focus & Skeleton loaders:** Rychlé zadávání PINu na mobilních zařízeních s vizuální odezvou při načítání.
6. **Oddělení rolí:** Skrytá vendor sekce pod URL `/vendor` chráněná heslem (`admin` / `demo`).
7. **Životní cyklus zásilky:** Implementace stavů `CREATED`, `VIEWED`, `COLLECTED`, `NOT_FOUND`, `EXPIRED`.
8. **Časová osa událostí (Timeline):** Záznam každého kroku s časovým razítkem.
9. **Klientské potvrzení vyzvednutí:** Tlačítka pro zákazníka *Vyzvednuto* a *Nenalezeno*.
10. **Jednorázový signál (Burner Alert):** Výstražné zprávy od vendora zobrazované v záhlaví odemčené úschovy.
11. **Nastavení množství a ceny:** Možnost definovat platební požadavky na straně vendora.
12. **Platební modul:** Integrace plateb v kryptoměnách (BTC, XMR, USDT) a PaySafeCard (16místný kupon).
13. **Odstranění vodoznaků z mapy:** Přechod z CartoDB na otevřené OpenStreetMap a satelitní vrstvu Esri s vrstvovým přepínačem.

### 🟡 V POŘADÍ (Backlog dalších vylepšení)
1. **End-to-End šifrování (Zero-Knowledge AES-GCM):**
   - Popis a přesné GPS souřadnice budou před odesláním na server zašifrovány v prohlížeči přímo PIN kódem. Server v databázi uvidí pouze šifrovaný text – ani správce serveru tak nebude schopen zjistit lokaci bez PINu.
2. **QR kód pro fyzické sdílení:**
   - Možnost vygenerovat QR kód s parametrem `/?pin=KOD` pro okamžité naskenování z telefonu na telefon.
3. **Geofencing odemčení (Volitelná pojistka):**
   - Možnost podmínit zobrazení fotografií fyzickým příchodem zákazníka do okruhu např. 50–100 m od GPS souřadnic.
4. **Offline PWA podpora:**
   - Uložení načtených dat úschovy do Service Workeru pro případ ztráty signálu v lese nebo v podzemí.
5. **Jednosměrný anonymní chat k zásilce:**
   - Možnost pro zákazníka zanechat k zásilce textový vzkaz pro vendora (např. v případě poškození schránky).

---

## 9. Podrobný přehled všech změn od prvního prototypu

### 1. Fáze: Prvotní prototyp
- **Stav:** Základní koncept se dvěma veřejnými záložkami v navigační liště.
- **Funkce:** Možnost zadat text, 1–3 fotky a souřadnice. Zákazník mohl zadat PIN a vidět mapu.
- **Nedostatky:** Stránka pro tvorbu byla veřejně viditelná komukoliv, chyběla ochrana proti útokům hrubou silou, fotky obsahovaly citlivá EXIF metadata.

### 2. Fáze: Bezpečnostní audit a klientská sanitizace
- **Změny:**
  - Vytvořen modul `src/utils/imageSanitizer.ts`, který pomocí HTML5 Canvasu před nahráním na server nevratně odstraní EXIF, GPS a časová metadata.
  - Implementováno SHA-256 hashování PINů na serveru.
  - Zaveden in-memory Rate Limiting chránící endpoint `/api/drops/claim` před vyzkoušením všech kombinací.
  - Přidána automatická expirace dropů po 7 dnech (TTL).

### 3. Fáze: Zjednodušení designu a skrytí správy (Vendor Gate)
- **Změny:**
  - Na základě požadavku na minimalistický design odstraněny dlouhé propagační texty a informační balast.
  - Veřejná tvorba zásilek byla kompletně odstraněna z hlavní navigace.
  - Zřízena nová cesta `/vendor` chráněná administrátorským přihlášením (`id: admin`, `pwd: demo`).
  - Do zákaznického rozhraní byl doplněn **Auto-focus** na zadávací pole PIN kódu a **Skeleton loader** zobrazovaný během ověřování požadavku na serveru.

### 4. Fáze: Životní cyklus, historie událostí a časová osa
- **Změny:**
  - Do datového modelu přidán stav `status` (`CREATED`, `VIEWED`, `COLLECTED`, `NOT_FOUND`, `EXPIRED`) a pole `history` obsahující časovou osu událostí.
  - Vytvořena komponenta `TimelineView.tsx` s barevnými odznaky a časovými razítky.
  - Zákazník získal interaktivní tlačítka: **[ Potvrdit vyzvednutí ]** a **[ Úschova nenalezena ]**.
  - Ve vendor panelu vytvořen `VendorDashboard.tsx` s přehledem všech úschov, jejich stavů a možností smazání.

### 5. Fáze: Monetizace, platby a Burner Alert
- **Změny:**
  - Vendor může zadat **Množství** (např. 1 ks, 50g) a **Cenu** s volbou měny (CZK/EUR).
  - Vytvořena komponenta `PaymentModule.tsx` s podporou plateb:
    - **Kryptoměny:** BTC, XMR, USDT s vygenerovanou adresou a přepočtem.
    - **PaySafeCard:** Vstup pro 16místný kuponový PIN.
  - Implementována funkce **Burner Alert (Jednorázový signál)** – nouzová zpráva od vendora, která se zákazníkovi zobrazí ve výrazném výstražném banneru.

### 6. Fáze: Oprava mapových vrstev a odstranění vodoznaků
- **Změny:**
  - Původní externí dlaždice CartoDB začaly vyžadovat placený API klíč a zobrazovaly vodoznak *"API KEY REQUIRED"*.
  - Problém byl vyřešen náhradou za čisté **OpenStreetMap** dlaždice s taktickým nočním CSS filtrem.
  - Do mapy byl přidán přepínač 3 bezplatných vrstev: **Tmavá**, **Satelit (Esri World Imagery)** a **Ulice**.
  - 100% funkčnost bez nutnosti registrovat jakékoliv platební údaje či API klíče.
