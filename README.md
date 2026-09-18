# 📦 My Dead Drops (MDD)

**Anonymní, decentralizovaná webová platforma pro bezpečné a diskrétní sdílení fyzických úschov (dead drops) chráněných 6místným PIN kódem.**

Aplikace funguje na principu zero-knowledge anonymity: nevyžaduje registraci zákazníka, neodposlouchává identitu, odstraňuje veškerá metadata (EXIF/GPS) z nahraných fotografií v prohlížeči a poskytuje detailní životní cyklus zásilky s možností platby v kryptoměnách nebo PaySafeCard.

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
| **Zákazník (Veřejnost)** | `/` | Výchozí čistá obrazovka s auto-focusem pro zadání 6místného PIN kódu a dešifrování zásilky. |
| **Vendor (Správce)** | `/vendor` | Zabezpečený administrační panel pro vytváření úschov, správu životního cyklu, sledování plateb a historii. |

> **Výchozí přihlašovací údaje administrátora:**
> - **Identifikátor:** `admin`
> - **Heslo:** `demo`

---

## 🗺️ Klíčové vlastnosti aplikace

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
- ⏱️ **Kompletní životní cyklus zásilky:**
  - `Vytvořena` ➔ `Zobrazena PINem` ➔ `Vyzvednuto` / `Nenalezeno` ➔ `Expirovaná` (TTL 7 dní) / `Skartována` (Burn-on-read).
- 🚨 **Burner Alert (Nouzová zpráva):**
  - Možnost odeslat jednorázové varování k zásilce (např. posun schránky, hlídané okolí).
- 💳 **Platební brána:**
  - Zadání ceny a množství vendorem.
  - Zákazník může provést platbu pomocí **Kryptoměny (BTC, XMR, USDT)** nebo **PaySafeCard** (16místný kupon).

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
- [x] Platební modul pro zákazníka (Kryptoměny BTC/XMR/USDT + PaySafeCard).
- [x] Správcovský Vendor Dashboard se seznamem všech aktivních/historických dropů a možností mazání.

### ⏳ V pořadí (Plánováno k realizaci)
- [ ] **Klient-side šifrování dat (Zero-Knowledge AES-GCM):** Šifrování souřadnic a popisu přímo v prohlížeči PIN kódem před odesláním na server (ani server nezná data bez znalosti PINu).
- [ ] **Generátor a skener QR kódů:** Možnost vygenerovat QR kód s přímým odkazem obsahujícím PIN pro snadné fyzické předání z telefonu na telefon.
- [ ] **Geofencing odemčení (Volitelná pojistka):** Možnost podmínit zobrazení fotografií fyzickou přítomností zákazníka v okruhu např. 100 m od GPS souřadnic.
- [ ] **Offline PWA podpora:** Uložení stažených instrukcí do lokální cache, aby zákazník neztratil mapu a popis ani při ztrátě signálu v podzemí nebo v lese.
- [ ] **Anonymní jednosměrný chat k dropu:** Možnost zákazníka poslat vendorovi anonymní textovou zprávu v případě komplikací.

---

## 🔄 Přehled veškerých změn od prvního prototypu

| Verze / Fáze | Popis změn a vylepšení |
| :--- | :--- |
| **Prototyp v1.0** | • Původní koncept: dvě otevřené záložky v horní navigaci ("Vendor" a "Zákazník").<br>• Zadání lokace, textového popisu (500 znaků) a upload 1–3 fotografií.<br>• Generování náhodného 6místného PINu.<br>• Zákaznické ověření a zobrazení statických souřadnic a fotek. |
| **Vylepšení bezpečnosti a mapy** | • Implementace `imageSanitizer.ts` – kompletní odstranění EXIF/GPS metadat v klientském Canvasu.<br>• Integrace Leaflet mapy s Dark Matter vrstvou.<br>• Backendová perzistence do `data/drops.json`.<br>• Hashování PINů přes SHA-256 na serveru a Rate Limiting (15 minut ban po 5 chybách). |
| **Zabezpečení Vendor přístupu a UX zjednodušení** | • **Skrytí Vendor stránky:** Odstranění záložky pro tvorbu z veřejného rozhraní.<br>• Vytvoření cesty `/vendor` chráněné autentizací (`admin` / `demo`).<br>• Auto-focus na PIN pole při načtení stránky (usnadnění pro mobily).<br>• Doplnění Skeleton Loaderu během ověřování PINu.<br>• Zjednodušení designu a radikální redukce zbytečného textu. |
| **Životní cyklus a historie (Lifecycle & Timeline)** | • Zavedení stavového automatu: `CREATED` ➔ `VIEWED` ➔ `COLLECTED` ➔ `NOT_FOUND` ➔ `EXPIRED`.<br>• Časová osa (TimelineView) zaznamenávající každý krok s přesným časem a poznámkou.<br>• Interaktivní akce pro zákazníka: *Potvrdit vyzvednutí* a *Úschova nenalezena* přímo pod detailem schránky.<br>• Vendor Dashboard v `/vendor` pro přehled všech zásilek a jejich historie. |
| **Monetizace a Nouzové zprávy** | • Přidáno pole pro **Množství** a **Cenu k úhradě** (CZK/EUR).<br>• **Platební modul:** Podpora platby v kryptoměnách (BTC, XMR, USDT) s peněženkovými adresami + podpora 16místných kuponů PaySafeCard.<br>• **Burner Alert:** Funkce jednorázové nouzové zprávy/signálu od vendora, která se zobrazí zákazníkovi jako pulzující výstražný banner. |
| **Odstranění vodoznaků z mapy (Bezplatná OpenStreetMap + Satelit)** | • Nahrazení CartoDB (které začalo vyžadovat placený API klíč s vodoznakem) otevřenými **OpenStreetMap** dlaždicemi s tmavým CSS filtrem.<br>• Přidán přepínač vrstev přímo do mapy: **Tmavá**, **Satelit (Esri)** a **Ulice** — 100% zdarma bez nutnosti API klíče. |

---

## 🛠️ Použité technologie

- **Frontend:** React 19, TypeScript, Tailwind CSS, Leaflet, Lucide React, Motion.
- **Backend:** Node.js, Express, tsx, esbuild, crypto (SHA-256).
- **Mapové podklady:** OpenStreetMap (Free Tiles), Esri World Imagery (High-Res Satellite).
- **Úložiště:** Souborové JSON úložiště s automatickým periodickým čištěním expirovaných položek (TTL 7 dní).
