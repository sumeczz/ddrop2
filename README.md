# 📦 My Dead Drops (MDD)

**Anonymní, decentralizovaná webová platforma pro bezpečné a diskrétní sdílení fyzických úschov (dead drops) chráněných 6místným PIN kódem.**

Aplikace funguje na principu zero-knowledge anonymity: nevyžaduje registraci zákazníka, neodposlouchává identitu, odstraňuje veškerá metadata (EXIF/GPS) z nahraných fotografií v prohlížeči a poskytuje detailní životní cyklus zásilky s manuálně ověřovanými platbami PaySafeCard, žádostmi o zakázkový drop a zvukovým systémem oznámení bez obtěžujících popup oken.

---

## 🚀 Rychlý start

### Požadavky
- Node.js 18+ (LTS)
- npm / yarn / pnpm

### Instalace a spuštění
```bash
# Instalace závislostí
npm install

# Spuštění vývojového serveru (port 3000)
npm run dev

# Sestavení produkčního balíčku
npm run build

# Spuštění produkčního serveru
npm start
```
Aplikace běží na: `http://localhost:3000`

---

## 🔑 Přístupové role a cesty

| Role | Cesta | Popis |
| :--- | :--- | :--- |
| **Zákazník (Veřejnost - PIN)** | `/` | Výchozí čistá obrazovka s auto-focusem pro zadání 6místného PIN kódu a dešifrování zásilky. |
| **Zákazník (Žádost o drop)** | `/?tab=request` | Nová stránka pro zadání poptávky: výběr lokality na mapě, množství, nabídnutá cena a PaySafeCard. |
| **Vendor (Správce)** | `/vendor` | Zabezpečený administrační panel: tvorba úschov, schvalování plateb PaySafeCard s 30min limitem, správa poptávek od zákazníků a historie. |

> **Výchozí přihlašovací údaje administrátora:**
> - **Identifikátor:** `admin`
> - **Heslo:** `demo`

---

## 🗺️ Klíčové vlastnosti aplikace

- 📱 **Plnohodnotná Progressive Web App (PWA):**
  - Možnost instalace na plochu telefonu (Android, iOS Safari) nebo do počítače (Windows, macOS).
  - Běží v samostatném `standalone` okně bez rušivých prvků prohlížeče.
  - Vlastní taktické tlačítko „Instalovat PWA“ v záhlaví aplikace s průvodcem pro uživatele Apple iOS.
  - Kompletní sada PWA ikon (192px, 512px, maskable bezpečná zóna a Apple Touch Icon).
  - Offline Service Worker s `CacheFirst` strategií pro bleskový start i mapové dlaždice (OpenStreetMap i Esri satelit) pro navigaci v terénu bez signálu.
- 🔔 **Systémová oznámení (Native OS Notifications):**
  - Integrace se systémovým notifikačním centrem operačního systému (mobil i desktop).
  - Tlačítko pro povolení a otestování systémových notifikací jedním kliknutím přímo v liště.
  - Automatické odesílání systémových oznámení:
    - Zákazníkovi při **schválení platby vendorem** (odemčení souřadnic a fotografií).
    - Zákazníkovi při **5 minutách zbývajících do vypršení 30min časovače**.
    - Zákazníkovi při **přijetí nouzového signálu (Burner Alert)**.
    - Vendorovi při **zadání nového PaySafeCard kuponu zákazníkem** k ověření.
    - Zákazníkovi při **vyřízení zakázkové poptávky (`REQ-XXXXXX`)**.
- 🔒 **Absolutní anonymita a ochrana soukromí:**
  - Žádné cookies, sledovací skripty ani registrace zákazníka.
  - Všechny fotografie procházejí klientskou sanitizací přes Canvas API – kompletní vymazání EXIF, GPS souřadnic, modelu telefonu a času pořízení před odesláním na server.
- 🛡️ **Kryptografické zabezpečení PINu:**
  - PIN kódy (6 znaků z alfanumerické sady bez záměnných znaků `O, 0, I, 1, L`) jsou na serveru ukládány výhradně jako **SHA-256 hashe**.
  - Ochrana proti útokům hrubou silou (Rate Limiting: po 5 chybných pokusech zablokování IP adresy na 15 minut).
- 🛰️ **100% Bezplatné mapové podklady (bez nutnosti API klíče):**
  - **Tmavá taktická mapa:** invertovaný OpenStreetMap podklad bez vodoznaků.
  - **Satelitní snímky:** Esri World Imagery ve vysokém rozlišení pro přesné nalezení schránky u terénních prvků (strom, lavička, plot).
  - **Uliční mapa:** klasické OpenStreetMap.
  - Geolokační GPS zaměření jedním kliknutím.
- 💳 **Ověřovaný platební systém PaySafeCard (Gated Location):**
  - Možnost platit anonymními 16místnými kupony PaySafeCard (kryptoměny jsou prozatím skryty dle požadavku).
  - **Přesná poloha a fotografie zůstávají skryty**, dokud vendor/admin kód manuálně nezkontroluje a neschválí.
  - Po odeslání kódu zákazníkem běží **30minutový živý odpočet**. Zákazník může požadavek zrušit nebo vyčkat na schválení.
  - Okamžitý live polling – po schválení vendorem se zákazníkovi automaticky odemkne přesná mapa, souřadnice, fotky i navigace.
- 📍 **Stránka „Požádat o drop“ (Customer Drop Requests):**
  - Zákazník může přímo z webu požádat o umístění nového dropu.
  - Zvolí orientační oblast na interaktivní mapě, požadované množství a nabízenou cenu.
  - Volba zadání PaySafeCard kódu ihned nebo až po realizaci.
  - Přidělení sledovacího kódu (`REQ-XXXXXX`) a možnost sledovat průběh přípravy.
  - Vendor může v administraci jedním kliknutím vytvořit drop předvyplněný podle této žádosti.
- 🔊 **Kompletní systém oznámení se syntetizovanými zvuky (Bez popupů):**
  - Žádná rušivá vyskakovací `window.alert` okna.
  - Integrovaný systém neblokujících notifikačních bannerů v toku aplikace.
  - Zvuková signalizace Web Audio API (úspěch, výstraha, zamítnutí kódu, klik) bez externích závislostí na mp3 souborech.
  - Možnost kdykoli vypnout/zapnout zvuk ikonou reproduktoru v horní liště.
- ⏱️ **Životní cyklus zásilky & Nouzová zpráva (Burner Alert):**
  - `Vytvořena` ➔ `Zobrazena PINem` ➔ `Vyzvednuto` / `Nenalezeno` ➔ `Expirovaná` (TTL 7 dní) / `Skartována` (Burn-on-read).
  - Možnost odeslat jednorázové varování k zásilce (např. posun schránky, hlídané okolí).

---

## 📋 Prozatímní plán vývoje (Roadmap)

### ✅ Hotovo (Implementováno)
- [x] Základní architektura: React 19 + TypeScript + Express + Vite + Tailwind CSS.
- [x] Klientské čištění EXIF metadat z fotografií přes HTML5 Canvas.
- [x] Interaktivní mapa Leaflet s přepínáním podkladů (Tmavá, Satelit, Ulice) bez nutnosti placených API klíčů.
- [x] Bezpečné hashování PINů (SHA-256) a ochrana proti brute-force útokům (Rate Limiting).
- [x] Zjednodušení uživatelského rozhraní (minimalistický taktický design s nízkým textovým šumem).
- [x] Skrytí vytváření zásilek z veřejného webu a zabezpečení vendor panelu pod `/vendor` (login: `admin` / `demo`).
- [x] Auto-focus na PIN pole při načtení a skeleton loadery během ověřování.
- [x] Implementace 5 fází životního cyklu (`CREATED`, `VIEWED`, `COLLECTED`, `NOT_FOUND`, `EXPIRED`).
- [x] Interaktivní časová osa (Timeline) událostí u každé zásilky.
- [x] Tlačítka pro zákazníka: *Potvrdit vyzvednutí* a *Úschova nenalezena*.
- [x] Jednorázový signál / Nouzová zpráva (Burner Alert) pro aktivní dropy.
- [x] Nastavení množství a ceny za úschovu.
- [x] **Úprava platebního systému:** Skrytí krypta, zavedení výhradní PaySafeCard platby s manuálním schvalováním vendorem.
- [x] **Gated Location:** Přesná poloha a fotky skryty do doby, než vendor potvrdí platnost PaySafeCard kódu.
- [x] **30minutový časovač:** Odpočet pro zákazníka na potvrzení či zrušení objednávky s periodickým auto-checkem.
- [x] **Systém oznámení a zvuků (Bez popupů):** Taktický Web Audio syntetizátor pro potvrzení, upozornění a chyby; neblokující notifikační lišta.
- [x] **Stránka „Požádat o drop“:** Formulář pro zákaznickou poptávku se sledovacím kódem a propojením do vendor administrace.
- [x] **Vendor administrace plateb a žádostí:** Samostatná sekce pro schvalování/zamítání PaySafeCard kódů a správu zákaznických žádostí.
- [x] **Offline PWA podpora:** Plnohodnotné PWA s Web App Manifestem, `vite-plugin-pwa`, Service Workerem s cacheováním assetů a mapových dlaždic (OSM & Esri), sadou generovaných PNG ikon a tlačítkem pro instalaci na plochu.
- [x] **Systémová oznámení (Notification API):** Nativní integrace s centrem oznámení OS pro schválení plateb, 5min varování před vypršením, nouzové signály a vendor alerty.

### ⏳ V pořadí (Plánováno k realizaci)
- [ ] **Klient-side šifrování dat (Zero-Knowledge AES-GCM):** Šifrování souřadnic a popisu přímo v prohlížeči PIN kódem před odesláním na server (ani server nezná data bez znalosti PINu).
- [ ] **Generátor a skener QR kódů:** Možnost vygenerovat QR kód s přímým odkazem obsahujícím PIN pro snadné fyzické předání z telefonu na telefon.
- [ ] **Geofencing odemčení (Volitelná pojistka):** Možnost podmínit zobrazení fotografií fyzickou přítomností zákazníka v okruhu např. 100 m od GPS souřadnic.
- [ ] **Automatizované ověřování PaySafeCard API:** Možnost volitelného propojení na oficiální merchant API pro automatické schvalování kódů bez čekání na vendora.

---

## 🔄 Přehled veškerých změn od prvního prototypu

| Verze / Fáze | Popis změn a vylepšení |
| :--- | :--- |
| **Prototyp v1.0** | • Původní koncept: dvě otevřené záložky v horní navigaci ("Vendor" a "Zákazník").<br>• Zadání lokace, textového popisu (500 znaků) a upload 1–3 fotografií.<br>• Generování náhodného 6místného PINu.<br>• Zákaznické ověření a zobrazení statických souřadnic a fotek. |
| **Vylepšení bezpečnosti a mapy** | • Implementace `imageSanitizer.ts` – kompletní odstranění EXIF/GPS metadat v klientském Canvasu.<br>• Integrace Leaflet mapy s Dark Matter vrstvou.<br>• Backendová perzistence do `data/drops.json`.<br>• Hashování PINů přes SHA-256 na serveru a Rate Limiting (15 minut ban po 5 chybách). |
| **Zabezpečení Vendor přístupu a UX zjednodušení** | • **Skrytí Vendor stránky:** Odstranění záložky pro tvorbu z veřejného rozhraní.<br>• Vytvoření cesty `/vendor` chráněné autentizací (`admin` / `demo`).<br>• Auto-focus na PIN pole při načtení stránky (usnadnění pro mobily).<br>• Doplnění Skeleton Loaderu během ověřování PINu.<br>• Zjednodušení designu a radikální redukce zbytečného textu. |
| **Životní cyklus a historie (Lifecycle & Timeline)** | • Zavedení stavového automatu: `CREATED` ➔ `VIEWED` ➔ `COLLECTED` ➔ `NOT_FOUND` ➔ `EXPIRED`.<br>• Časová osa (TimelineView) zaznamenávající každý krok s přesným časem a poznámkou.<br>• Interaktivní akce pro zákazníka: *Potvrdit vyzvednutí* a *Úschova nenalezena* přímo pod detailem schránky.<br>• Vendor Dashboard v `/vendor` pro přehled všech zásilek a jejich historie. |
| **Monetizace a Nouzové zprávy** | • Přidáno pole pro **Množství** a **Cenu k úhradě** (CZK/EUR).<br>• **Burner Alert:** Funkce jednorázové nouzové zprávy/signálu od vendora, která se zobrazí zákazníkovi jako pulzující výstražný banner. |
| **Bezplatné mapy bez vodoznaků** | • Nahrazení CartoDB bezplatnými **OpenStreetMap** s tmavým filtrem.<br>• Přidán přepínač vrstev přímo do mapy: **Tmavá**, **Satelit (Esri)** a **Ulice** — 100% zdarma bez nutnosti API klíče. |
| **Ověřovaný PaySafeCard systém & Žádosti o drop & Zvuky** | • **Skrytí kryptoměn:** Ponechána výhradně PaySafeCard platba.<br>• **Gated Location:** Přesné souřadnice a fotky jsou skryty do doby manuálního schválení kódu vendorem.<br>• **30min časovač:** Živý odpočet pro zákazníka s možností zrušení a live pollingem schválení.<br>• **Vendor schvalovací rozhraní:** Sekce pro kontrolu zadaných PaySafeCard PINů s tlačítky Schválit / Zamítnout.<br>• **Zvukový systém:** Web Audio syntetizátor pro úspěch, výstrahu a zamítnutí; zákazník může zvuk ztišit v liště.<br>• **Žádosti o drop:** Zákazník může poptat úschovu s vyznačením na mapě, množstvím, cenou a sledovacím kódem `REQ-XXXXXX`.<br>• **Zákaz popupů:** Odstranění všech vyskakovacích alertů a zavedení inline banneru. |
| **v2.5: API Hardening, Zero-Popup UX & Code Cleanup** | • **Duální API aliasy:** Sjednocení `/pay` a `/pay-psc` na společný handler; sjednocení stornovacích tras.<br>• **Endpoint `GET /api/drops/:id`:** Bezpečné dotazování jednotlivého dropu v live pollingu platebního stavu.<br>• **Striktní JSON 404/500 Middleware:** Ochrana API tras před pády při parsování odpovědí.<br>• **Dvoustupňové inline mazání:** Nahrazení `window.confirm` interaktivním tlačítkem s animací potvrzení přímo v řádku.<br>• **Bezpečné mapové linky:** Přímé HTML kotvy namísto `window.open` pro 100% kompatibilitu s iFrame pískovištěm. |
| **v3.0: PWA & Systémová oznámení (Aktuální)** | • **PWA Transformace:** `vite-plugin-pwa`, `manifest.webmanifest`, podpora standalone instalace na plochu (Android, iOS Safari, desktop).<br>• **Sada taktických ikon:** 192x192, 512x512, maskable ikona s bezpečnou zónou, apple-touch-icon a vector SVG.<br>• **In-app instalátor:** Komponenta `PWAInstallButton` s detekcí standalone režimu a návodem pro iOS Safari.<br>• **Offline Map Cache:** Service Worker cachuje statické assety i mapové dlaždice (OSM + Esri Satelit) pro spolehlivou orientaci v terénu i bez signálu.<br>• **Nativní systémové notifikace:** Oznámení o schválení/zamítnutí platby, 5min varování před expirací časovače, nouzové signály a upozornění vendora na nový kód.<br>• **Rychlé ovládání v liště:** Tlačítko pro povolení a okamžité otestování systémových oznámení v OS. |

---

## 🛠️ Použité technologie

- **Frontend:** React 19, TypeScript, Vite, `vite-plugin-pwa`, Tailwind CSS, Leaflet, Lucide React, Web Audio API, Notification API.
- **Backend:** Node.js, Express, tsx, esbuild, crypto (SHA-256).
- **Mapové podklady:** OpenStreetMap (Free Tiles), Esri World Imagery (High-Res Satellite) s offline Service Worker cachováním.
- **Úložiště:** Souborové JSON úložiště (`drops.json`, `requests.json`) s automatickým periodickým čištěním (TTL 7 dní a 30min PSC expirace).
