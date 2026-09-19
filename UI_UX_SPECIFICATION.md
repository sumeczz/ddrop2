# UI/UX SPECIFIKACE A DESIGN SYSTÉM: MY DEAD DROPS (MDD)
**Verze:** 2.4 (Ready for Production / 2026 Standards)  
**Role:** Lead UI/UX Designer & Product Manager  
**Cílová platforma:** Responzivní Webová aplikace (Mobile-first, PWA ready)  
**Architektonický princip:** Zero-Knowledge Privacy, Taktická přehlednost, Žádné rušivé popupy (Zero-popup UX)

---

## ČÁST 1: GLOBÁLNÍ VIZUÁLNÍ STYL & UI DESIGN SYSTÉM

Pro aplikaci typu **My Dead Drops** navrhujeme 3 špičkové grafické směry, které respektují diskrétnost, maximální čitelnost v terénu (i za přímého slunce či v noci) a eliminují generický „AI slop“ (žádné fialovo-modré gradienty, žádné zbytečné blur stíny a nefunkční zaoblení).

---

### SMĚR A: TACTICAL STEALTH (Doporučený primární směr aplikace)
*Vychází z taktických vojenských displejů, avioniky a temného cyber-minimalismu. Prioritou je nulová vizuální únava, okamžitá orientace a stoprocentní funkčnost.*

#### 1. Barevná paleta (HEX kódy)
| Token | HEX kód | Použití | WCAG Kontrast k BG |
| :--- | :--- | :--- | :--- |
| **Background (Canvas)** | `#090A0C` | Hluboká matná černá s 3% chladným modrým nádechem | Základ |
| **Surface Level 1** | `#121418` | Kontejnery karet, panely podkladů | 1.15:1 |
| **Surface Level 2** | `#1A1D24` | Vstupní pole, neaktivní tlačítka, mapové rámy | 1.35:1 |
| **Border / Divider** | `#262B35` | Subtilní strukturální dělicí linie (1px) | 1.8:1 |
| **Primary (Accent)** | `#10B981` | Emerald Neon – potvrzení, aktivní PIN, primární CTA | 11.2:1 (AAA) |
| **Primary Hover** | `#059669` | Ztmavený odstín pro hover stav na desktopu | 9.1:1 (AAA) |
| **Secondary (Info / PSC)**| `#3B82F6` | PaySafeCard rozhraní, linky, neutrální badge | 7.8:1 (AAA) |
| **Success** | `#10B981` | Potvrzená platba, vyzvednutá úschova, úspěch | 11.2:1 (AAA) |
| **Warning / Alert** | `#F59E0B` | Burner alert, 30min časovač, čekání na schválení | 9.8:1 (AAA) |
| **Error / Destruction** | `#EF4444` | Nenalezeno, zamítnutý kód, skartace úschovy | 6.5:1 (AA) |
| **Text Primary** | `#F3F4F6` | Hlavní čísla PINu, nadpisy, zásadní data | 16.8:1 (AAA) |
| **Text Secondary** | `#9CA3AF` | Popisky, navigační instrukce, metadata | 7.2:1 (AAA) |
| **Text Muted** | `#6B7280` | Časové značky, pomocné jednotky, vodítka | 4.6:1 (AA) |

#### 2. Typografie
- **Display & Monospace Font:** `JetBrains Mono` (Google Fonts) – pro veškeré klíčové hodnoty (PIN, GPS souřadnice, PaySafeCard čísla, časovače, stavové badge).
- **Body Font:** `Plus Jakarta Sans` (Google Fonts) – geometrický, vysoce čitelný sans-serif pro delší popisy úkrytu a formulářové instrukce.
- **Typografická hierarchie:**
  - **Hero PIN:** `JetBrains Mono`, 32px / 2rem, Weight: 700 (Bold), Letter-spacing: `0.35em`.
  - **H1 (Sekce):** `Plus Jakarta Sans`, 20px / 1.25rem, Weight: 700 (Bold), Line-height: 1.3.
  - **H2 (Karta):** `Plus Jakarta Sans`, 16px / 1rem, Weight: 600 (SemiBold), Line-height: 1.4.
  - **Body Text:** `Plus Jakarta Sans`, 14px / 0.875rem, Weight: 400 (Regular), Line-height: 1.6, Max-width: `65ch`.
  - **Data & Metadata:** `JetBrains Mono`, 12px / 0.75rem, Weight: 500 (Medium), Uppercase tracking: `0.05em`.
  - **Micro Label:** `JetBrains Mono`, 10px / 0.625rem, Weight: 600 (SemiBold), Uppercase tracking: `0.08em`.

#### 3. Vizuální detaily
- **Border-radius:**
  - Standardní karty a kontejnery: `12px`
  - Vstupní pole a tlačítka: `10px`
  - Malé badge a štítky: `6px`
  - Vnitřní prvky vnořené v kartě s paddingem 16px: `12px - 16px = 6px` (aplikace pravidla `R_inner = R_outer - Padding`).
- **Borders:** Striktní `1px solid #262B35`, při aktivaci `1px solid #10B981`.
- **Stíny (Box-shadow):**
  - Karty: `0 4px 20px -2px rgba(0, 0, 0, 0.75)` (pouze hloubkové stíny, žádné barevné záře).
  - Tlačítka: `0 2px 8px 0 rgba(16, 185, 129, 0.25)` (tlumený dotek akcentu).
- **Styl ikon:** `lucide-react`, lineární styl (outline), `stroke-width: 1.75px`.

---

### SMĚR B: OBSIDIAN NEO-BRUTALISM (High-Contrast Cyber)
*Maximální kontrast a hrubá přesnost pro okamžité použití ve ztížených terénních podmínkách. Nulové rozmazání, ostrá hranice a technické štítkování.*

#### 1. Barevná paleta (HEX kódy)
| Token | HEX kód | Použití |
| :--- | :--- | :--- |
| **Background** | `#000000` | Absolutní černá (True OLED Black) |
| **Surface Level 1** | `#0D0D0D` | Panely karet s 1.5px kontrastním rámem |
| **Surface Level 2** | `#171717` | Vstupy a interaktivní segmenty |
| **Border / Divider** | `#333333` | Ostré ohraničení, 1.5px až 2px solid |
| **Primary (Accent)** | `#00FF66` | Kybernetická signální zelená (Electric Lime) |
| **Secondary** | `#00E5FF` | Cyan pro digitální certifikáty a kódy žádostí |
| **Warning** | `#FFCC00` | Výstražná průmyslová žlutá |
| **Error** | `#FF2A2A` | Čistá signální červená |
| **Text Primary** | `#FFFFFF` | 100% čistá bílá pro maximální odezvu |
| **Text Secondary** | `#A3A3A3` | Technická šedá |

#### 2. Typografie
- **Display & Nadpisy:** `Space Grotesk` (Google Fonts) – technický modernismus.
- **Data & Text:** `Fira Code` (Google Fonts) – programátorská čistota.
- **Hierarchie:**
  - PIN: `Fira Code`, 36px, Weight 700, Letter-spacing `0.4em`.
  - H1: `Space Grotesk`, 22px, Weight 700, Uppercase.
  - Body: `Fira Code`, 13px, Line-height 1.5.

#### 3. Vizuální detaily
- **Border-radius:** `2px` až `4px` (téměř ostré rohy, industriální technika).
- **Borders:** `1.5px solid #333333` (vždy viditelný ohraničený panel).
- **Stíny:** Hard-shadows bez blur efektu: `3px 3px 0px #1A1A1A`.
- **Styl ikon:** `lucide-react`, `stroke-width: 2.0px`.

---

### SMĚR C: URBAN MONOLITH (Industrial Minimalist)
*Čistý průmyslový vzhled kombinující břidlicové odstíny, saténový povrch a tlumené signální kontrolky.*

#### 1. Barevná paleta (HEX kódy)
| Token | HEX kód | Použití |
| :--- | :--- | :--- |
| **Background** | `#111315` | Tmavá grafitová |
| **Surface Level 1** | `#1A1D20` | Břidlicové moduly |
| **Surface Level 2** | `#24282D` | Ovládací lišty a přepínače |
| **Border / Divider** | `#2F353C` | Decentní ohraničení modulů |
| **Primary (Accent)** | `#E2E8F0` | Platinově bílá jako dominantní prvek |
| **Secondary** | `#38BDF8` | Nebeská modř pro komunikační prvky |
| **Warning** | `#FBBF24` | Jantarová výstraha |
| **Error** | `#F87171` | Korálová červená |
| **Text Primary** | `#F8FAFC` | 98% jas |
| **Text Secondary** | `#94A3B8` | Břidlicová šedá |

#### 2. Typografie
- **Display:** `Outfit` (Google Fonts)
- **Body & Data:** `IBM Plex Mono` (Google Fonts)
- **Hierarchie:** Nadpisy `Outfit` 600, veškerá telemetrie a kódy v `IBM Plex Mono`.

---

## ČÁST 2: ANATOMIE ZÁKLADNÍCH UI PRVKŮ (KOMPONENTY)

Každý prvek musí splňovat přístupnost WCAG 2.1 AA s minimálním dotykovým terčem **44 × 44 px** na mobilních zařízeních.

### 1. Tlačítka (Buttons)

```
┌────────────────────────────────────────────────────────┐
│  [ Ikona ]  TEXT POPISKU V JEDNOM ŘÁDKU   [ Akce ]    │
└────────────────────────────────────────────────────────┘
```

#### A. Primární tlačítko (Primary Button)
- **Použití:** Hlavní konverzní akce („Odemknout úschovu“, „Odeslat PaySafeCard k ověření“, „Odeslat žádost o drop“).
- **Vizuál:** Pozadí `#10B981`, Text `#090A0C` (Dark bold pro maximální kontrast), Font `JetBrains Mono` 13px Weight 700. Výška 44px (mobil) / 40px (desktop). Padding `12px 24px`. Zaoblení `10px`.
- **Stavy:**
  - **Default:** Plná barva `#10B981`, bez ohraničení, jemný stín `0 2px 10px rgba(16,185,129,0.2)`.
  - **Hover:** Ztmavení na `#059669`, posun o 1px nahoru, zesílení stínu.
  - **Active:** Mírné stlačení (scale `0.98`), barva `#047857`.
  - **Focus-visible:** Dvouvrstvý obrys: 2px gap `#090A0C` + 2px ring `#10B981`.
  - **Disabled:** Pozadí `#1A1D24`, Text `#4B5563`, kurzor `not-allowed`, opacity `0.6`.

#### B. Sekundární tlačítko (Secondary Button)
- **Použití:** Doplňkové akce („Zadat jiný PIN“, „Google Maps“, „Kopírovat souřadnice“).
- **Vizuál:** Pozadí `#1A1D24`, Text `#E5E7EB`, rámeček `1px solid #262B35`.
- **Stavy:**
  - **Default:** Decentní panel, matný text.
  - **Hover:** Pozadí `#242832`, rámeček zesvětlí na `#374151`, barva textu `#FFFFFF`.
  - **Active:** Pozadí `#121418`, scale `0.98`.
  - **Focus-visible:** 2px ring `#3B82F6`.

#### C. Destruktivní / Nouzové tlačítko (Destructive Button)
- **Použití:** „Úschova nenalezena“, „Zrušit objednávku“, „Smazat zásilku“.
- **Vizuál:** Pozadí `#2A1215`, Text `#FCA5A5`, rámeček `1px solid #7F1D1D`.
- **Hover:** Pozadí `#451A1D`, Text `#FFFFFF`.

---

### 2. Formulářové prvky (Form Controls)

#### A. Hero PIN Input (Klíčový prvek zákaznického rozhraní)
- **Struktura:** Segmentované nebo velkoformátové pole pro 6 alfanumerických znaků.
- **Chování:** 
  - Auto-focus při vstupu na stránku.
  - Automatická konverze na velká písmena (`text-transform: uppercase`).
  - Font: `JetBrains Mono`, 28–32px, Bold, tracking `0.4em`.
  - Výška: 64px, zaoblení `14px`, pozadí `#121418`, border `2px solid #262B35`.
  - Po dosažení 6. znaku automatické spuštění validace bez nutnosti stisknout Enter.
- **Stavy:**
  - **Default:** Tmavý vnitřek, šedý placeholder `XXXXXX` s 30% opacity.
  - **Focus:** Rámeček se rozzáří `#10B981`, jemný ambientní ring `0 0 0 3px rgba(16,185,129,0.15)`.
  - **Error (Chybný PIN / Blokováno):** Rámeček `#EF4444`, jemné zavibrování pole (CSS shake animace 300ms), červený text chyby s počtem zbývajících pokusů.

#### B. PaySafeCard Formatted Input
- **Chování:** Automatické formátování na čtveřice `0000-0000-0000-0000`.
- **Délka:** Přesně 16 číslic (19 znaků včetně pomlček).
- **Zabezpečení:** Možnost přepnutí viditelnosti nebo maskování prvních 12 číslic.

#### C. Textová pole a Textarey (Popis úkrytu, Poznámka)
- **Vizuál:** Pozadí `#0F1115`, Border `1px solid #262B35`, Text `#F3F4F6` 14px.
- **Padding:** 12px vertikálně, 14px horizontálně.
- **Počítadlo znaků:** Integrováno v pravém horním rohu nad polem (např. `142 / 500`).

#### D. Segmentovaný přepínač (Pill Switcher)
- **Použití:** Volba vrstvy mapy (Tmavá / Satelit / Ulice) a volba platby (Zadat ihned / Později).
- **Struktura:** Kontejner `#121418` s paddingem 3px, vnitřní položky s zaoblením `8px`. Aktivní položka má pozadí `#1E232B`, rámeček a kontrastní text.

---

### 3. Karty a Kontejnery (Cards & Containers)

- **Hierarchie ploch:**
  - Zákazník se pohybuje v jediném ústředním kontejneru (`max-w-xl` = 576px), což zabraňuje roztahování prvků na širokých monitorech a zajišťuje komfortní ovládání palcem na mobilu.
  - Vnitřní karty mají padding `16px` (mobil) až `20px` (desktop).
- **Pravidlo zploštělé hloubky (Flat Depth):** Nikdy nevkládat karty do dalších karet se stejným vizuálním stylem. Místo vnořování používat jemné dělicí linky `#262B35` a kontrast pozadí `#0F1115` vs `#161920`.

---

### 4. Systém oznámení (Notification System - Zero Popups)

> **Zásadní architektonické pravidlo:** Žádné `window.alert()`, žádné celoobrazovkové překryvné popupy blokující uživatele.

- **Umístění:** Integrovaný panel notifikací v horní části pracovního toku (pod hlavičkou, nad hlavním obsahem).
- **Anatomie banneru:**
  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │ [IKONA STAVU]  Nadpis zprávy (Bold JetBrains Mono)          [X] │
  │                Detailní vysvětlení situace v jednom/dvou řádcích│
  └─────────────────────────────────────────────────────────────────┘
  ```
- **Stavy banneru:**
  - **Success (Zelený):** `#064E3B` pozadí, `#10B981` border, ikona `CheckCircle2`.
  - **Warning / Timer (Jantarový):** `#451A03` pozadí, `#F59E0B` border, ikona `Clock`.
  - **Error (Červený):** `#450A0A` pozadí, `#EF4444` border, ikona `AlertTriangle`.
  - **Info (Modrý):** `#172554` pozadí, `#3B82F6` border, ikona `Info`.
- **Délka zobrazení:** Automatické odeznění po 6 sekundách nebo ruční zavření křížkem.
- **Zvuková vazba (Web Audio API):**
  - Success: Vzestupná harmonická triáda C5 ➔ E5 ➔ G5 (čistý sinus).
  - Warning / New Item: Pulzní tón A4 ➔ C#5.
  - Error / Reject: Sestupný varovný signál F4 ➔ D4.

---

## ČÁST 3: GLOBÁLNÍ ROZLOŽENÍ (LAYOUT) & NAVIGACE

### 1. Systém mřížky a prostorové mantinely
- **8pt Spatial Grid:** Všechny mezery (gap, margin, padding) jsou násobky 4px nebo 8px: `4px, 8px, 12px, 16px, 24px, 32px, 48px`.
- **Šířkové kontejnery (Layout Shell):**
  - **Zákaznické zobrazení (PIN & Request):** Šířka striktně omezena na `max-w-xl` (576px). Zajišťuje absolutní ergonomii na mobilních zařízeních a zabraňuje očnímu těkání na velkých displejích.
  - **Vendor Administrace (/vendor):** Šířka `max-w-2xl` (672px) pro pohodlnou správu tabulek, fotografií a časové osy.
- **Okraje obrazovky:** Mobil: `px-3` (12px), Tablet/Desktop: `px-4` (16px).

---

### 2. Navigační lišta (Header / Navbar)

- **Pozice:** Fixní nahoře (`sticky top-0 z-40`), výška `56px`.
- **Materiál:** `#090A0C` s 95% neprůhledností a CSS filtrem `backdrop-blur-md`, spodní linka `1px solid #1A1D24`.
- **Prvky zleva doprava:**
  1. **Brand Identifikátor:** Diskrétní ikona štítu v smaragdovém rámečku + text `MY DEAD DROPS` (JetBrains Mono 13px Bold, letter-spacing 1px). Kliknutí vrací na hlavní obrazovku.
  2. **Zákaznický přepínač modulů (uprostřed/vpravo):**
     - Kompaktní přepínač dvou pilulek: `[ 🔑 PIN ]` a `[ 📍 Požádat ]`.
  3. **Zvukový ovladač:** Ikona reproduktoru (`Volume2` / `VolumeX`). Rychlé ztišení/zapnutí zvukové syntézy bez nutnosti vstupu do nastavení.
  4. **Diskrétní Vendor Gate:** Nenápadný odkaz `vendor` (opacity 40%, šedá barva). Na mobilu redukován na drobnou ikonku zámku.

---

### 3. Spodní stavová lišta (Footer)
- **Výška:** 36px, centrovaný text v `JetBrains Mono` 11px barvy `#4B5563`.
- **Text:** *„Anonymní geolokační úschovy • Klientská sanitizace metadat • Žádné protokoly identity“*.

---

### 4. Responzivní chování (Breakpoints)

| Breakpoint | Zařízení | Přizpůsobení layoutu |
| :--- | :--- | :--- |
| **< 640px** (Mobile) | Smartphony na výšku | Jednosloupcový lineární tok. Mapové okno výška 260px. Všechna tlačítka minimálně 44px výška pro palec. |
| **640px – 1024px** (Tablet) | Tablety, skládací telefony | Kontejner vycentrován. Fotografie ve 3 sloupcích. Mapové okno výška 320px. |
| **> 1024px** (Desktop) | PC, laptopy | Stále kompaktní taktický modul (žádné plýtvání prázdným prostorem). Přidány hover stavy a klávesové zkratky (Esc pro zavření lightboxu, Enter pro odeslání). |

---

## ČÁST 4: DETAILNÍ NÁVRH STRÁNEK (WIREFRAME & STRUKTURA)

---

### STRÁNKA 1: ZÁKAZNÍK – VYZVEDNUTÍ PŘES PIN (`/`)

#### Stav A: Prvotní vstupní obrazovka (Entry State)
```
┌────────────────────────────────────────────────────────┐
│ [🛡️ MDD]           [🔑 PIN | 📍 Požádat]  [🔊] [🔒]   │ (Navbar)
├────────────────────────────────────────────────────────┤
│                                                        │
│                    VYZVEDNOUT DEAD DROP                │
│            Zadejte 6místný PIN kód pro zobrazení       │
│                                                        │
│       ┌────────────────────────────────────────┐       │
│       │ [🔑]         A 7 X 9 K 2               │       │ (Hero Input)
│       └────────────────────────────────────────┘       │
│                                                        │
│       ┌────────────────────────────────────────┐       │
│       │           ODEMKNOUT ÚSCHOVU            │       │ (Primary CTA)
│       └────────────────────────────────────────┘       │
│                                                        │
│         🔒 Klientské šifrování • Rate limiting aktivní │
└────────────────────────────────────────────────────────┘
```
1. **Záhlaví:** Krátký nadpis a podnadpis vysvětlující anonymní povahu.
2. **Hero PIN pole:** Výška 64px, okamžitý focus kurzoru, maska na 6 znaků.
3. **Akční tlačítko:** Široké smaragdové tlačítko aktivující se po zadání 6 znaků.
4. **Zabezpečení:** Indikátor zbývajících pokusů (ochrana proti brute-force útoku).

---

#### Stav B: Detail nalezené úschovy – ČEKÁ NA PLATBU PAYSAFECARD (Gated Location)
*Přesná poloha a fotky jsou striktně skryté, dokud vendor neschválí kód.*

```
┌────────────────────────────────────────────────────────┐
│ PIN: A7X9K2 • Vytvořeno 18.9.             [Zadat jiný] │
├────────────────────────────────────────────────────────┤
│ 🚨 NOUZOVÁ ZPRÁVA (pokud je vendorem aktivní):         │
│ "Pozor na zvýšenou aktivitu v okolí, vyzvednout po 20h"│
├────────────────────────────────────────────────────────┤
│ 💳 PLATEBNÍ MODUL PAYSAFECARD                          │
│ Cena úschovy: 500 CZK              Množství: 1 balení │
│ ────────────────────────────────────────────────────── │
│ BĚŽÍ 30MIN ČASOVAČ OVĚŘENÍ:                   [28:45]  │
│ Kód předán vendorovi: ****-****-****-3819              │
│ Poloha se odemkne ihned po manuálním schválení.        │
│ [ Zrušit objednávku / Zadat jiný kód ]                 │
├────────────────────────────────────────────────────────┤
│ 🔒 POLOHA A FOTOGRAFIE JSOU UZAMČENY                   │
│ [ IKONA ZÁMKU ]                                        │
│ Přesné GPS souřadnice, mapa a fotodokumentace          │
│ budou uvolněny po ověření platnosti kuponu vendorem.   │
├────────────────────────────────────────────────────────┤
│ ⏱️ ČASOVÁ OSA ÚSCHOVY (TIMELINE)                       │
│ • 14:02 - Úschova byla vytvořena vendorem              │
│ • 14:15 - Zákazník zobrazil PIN a odeslal PaySafeCard  │
└────────────────────────────────────────────────────────┘
```

---

#### Stav C: Detail nalezené úschovy – ODEMČENO A UHRAZENO
*Vendor platbu schválil nebo byla úschova zdarma.*

```
┌────────────────────────────────────────────────────────┐
│ PIN: A7X9K2 • Platba potvrzena ✓          [Zadat jiný] │
├────────────────────────────────────────────────────────┤
│ ✅ ZÁSILKA JE PŘIPRAVENA K VYZVEDNUTÍ                  │
│ Přesné GPS souřadnice a fotografie byly odemčeny.     │
├────────────────────────────────────────────────────────┤
│ POTVRZENÍ STAVU V TERÉNU:                              │
│ [ ✓ Potvrdit vyzvednutí ]   [ ⚠️ Úschova nenalezena ]   │
├────────────────────────────────────────────────────────┤
│ PŘESNÁ LOKACE ÚSCHOVY                                  │
│ Souřadnice: 50.08781, 14.42046             [Kopírovat] │
│ ┌────────────────────────────────────────────────────┐ │
│ │          INTERAKTIVNÍ MAPA (LEAFLET)               │ │
│ │  [Přepínač: Tmavá | Satelit Esri | Ulice OSM]      │ │
│ │                  🔴 [Bod úschovy]                  │ │
│ └────────────────────────────────────────────────────┘ │
│ [ 🧭 Trasa v Google Maps ]  [ 🍏 Trasa v Apple Maps ]  │
├────────────────────────────────────────────────────────┤
│ POPIS ÚKRYTU                                           │
│ "Magnetická krabička ze spodní strany zelené lavičky, │
│ cca 5 metrů za památným dubem."                        │
├────────────────────────────────────────────────────────┤
│ FOTOGRAFIE ÚKRYTU (3) - EXIF metadata smazána          │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                 │
│ │  [FOTO]  │ │  [FOTO]  │ │  [FOTO]  │ (Klik pro zoom) │
│ └──────────┘ └──────────┘ └──────────┘                 │
├────────────────────────────────────────────────────────┤
│ ⏱️ KOMPLETNÍ HISTORIE ZÁSILKY (LIFECYCLE)              │
│ • 14:20 - Vendor schválil PaySafeCard platbu           │
│ • 14:02 - Zásilka vytvořena                            │
└────────────────────────────────────────────────────────┘
```

---

### STRÁNKA 2: ZÁKAZNÍK – POŽÁDAT O DROP (`/?tab=request`)

Umožňuje zákazníkovi vyslat poptávku po úschově v konkrétní lokalitě s vlastní cenovou nabídkou.

```
┌────────────────────────────────────────────────────────┐
│ [ ✨ Nová žádost o drop ]    [ 🔍 Sledovat stav žádosti]│
├────────────────────────────────────────────────────────┤
│ 1. POŽADOVANÁ LOKALITA NA MAPĚ                         │
│ Kliknutím do mapy zvolte přibližnou oblast:            │
│ ┌────────────────────────────────────────────────────┐ │
│ │      INTERAKTIVNÍ MAPA PRO VÝBĚR POZICE            │ │
│ │               📍 Vybraný bod                       │ │
│ └────────────────────────────────────────────────────┘ │
│ Upřesnění: [ Praha 7, poblíž vstupu do Stromovky     ] │
├────────────────────────────────────────────────────────┤
│ 2. POŽADAVEK A NABÍZENÁ CENA                           │
│ Množství / Položka:      Nabízená cena:                │
│ [ 2 balení          ]    [ 1000       ] [ CZK/EUR v ]  │
│                                                        │
│ Poznámka pro vendora (volitelné):                      │
│ [ Preferuji umístění ve večerních hodinách...        ] │
├────────────────────────────────────────────────────────┤
│ 3. PLATBA PAYSAFECARD                                  │
│ (•) Přidat PIN ihned          ( ) Zaplatit až na místě │
│     (Zrychlí vyřízení dropu)       (Při vyzvednutí)    │
│                                                        │
│ PaySafeCard PIN: [ 0000-0000-0000-0000 ]               │
├────────────────────────────────────────────────────────┤
│ [ 🚀 ODESLAT ŽÁDOST O DEAD DROP ]                      │
└────────────────────────────────────────────────────────┘
```

---

### STRÁNKA 3: ZÁKAZNÍK – SLEDOVÁNÍ STAVU ŽÁDOSTI

Po odeslání zákazník obdrží kód `REQ-XXXXXX`, pod kterým může sledovat realizaci.

```
┌────────────────────────────────────────────────────────┐
│ Zadejte kód vaší žádosti:                              │
│ [ REQ-9M2K81                    ] [ Vyhledat ]         │
├────────────────────────────────────────────────────────┤
│ VÝSLEDEK ŽÁDOSTI: REQ-9M2K81                           │
│ Aktuální stav: [ 🟢 HOTOVO — ÚSCHOVA PŘIPRAVENA ]       │
│                                                        │
│ 🎉 VENDOR UMÍSTIL VAŠI ÚSCHOVU V TERÉNU!               │
│ Váš PIN kód pro odemčení lokace a fotek je:            │
│                 ┌──────────────┐                       │
│                 │   K 8 2 X 1 9│                       │
│                 └──────────────┘                       │
│ [ 🔓 OTEVŘÍT ÚSCHOVU S TÍMTO PINEM → ]                 │
│                                                        │
│ Původní specifikace: 2 balení • 1000 CZK • Stromovka   │
└────────────────────────────────────────────────────────┘
```

---

### STRÁNKA 4: VENDOR – PŘIHLÁŠENÍ (`/vendor`)

- **Vizuál:** Maximálně minimalistická bezpečnostní brána chránící administrační část.
- **Prvky:**
  - Identifikátor administrátora (výchozí: `admin`).
  - Heslo (výchozí: `demo`).
  - Rate limiting (ochrana před prolomením).
  - Tlačítko `[ Přihlásit do administrace ]`.

---

### STRÁNKA 5: VENDOR – DASHBOARD A SCHVALOVÁNÍ PLATEB (`/vendor`)

Administrační centrum s okamžitým přehledem plateb vyžadujících pozornost a zákaznických žádostí.

```
┌────────────────────────────────────────────────────────┐
│ [🛡️ MDD VENDOR]     [+ Nová úschova] [Správa] [Odhlásit]│
├────────────────────────────────────────────────────────┤
│ ⚠️ PLATBY PAYSAFECARD K MANUÁLNÍMU OVĚŘENÍ (1)        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Úschova PIN: B7M2X1              Zbývá: 24:12 min  │ │
│ │ Kód PaySafeCard: 0821-4920-1182-9401   [Kopírovat] │ │
│ │ Požadovaná částka: 500 CZK                         │ │
│ │ [ ✅ Schválit (Kód platný) ]  [ ❌ Zamítnout kód ] │ │
│ └────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────┤
│ PŘEPÍNAČ: [ Aktivní úschovy (8) ]  [ Žádosti klientů (2) ]│
├────────────────────────────────────────────────────────┤
│ SEZNAM ZÁKAZNICKÝCH POPOTÁVEK:                         │
│ • Žádost: REQ-81920X • 1000 CZK • 2 balení             │
│   Lokalita: Stromovka, Praha 7                         │
│   PSC: Přiložen (Platný kód v detailu)                 │
│   [ 📍 Vytvořit drop pro tuto žádost ]  [ Zamítnout ] │
├────────────────────────────────────────────────────────┤
│ SEZNAM VŠECH ÚSCHOV V SYSTÉMU:                         │
│ ┌────────────────────────────────────────────────────┐ │
│ │ PIN: K9X218 • STAV: VYZVEDNUTO ✓       [Otevřít] [🗑️]│ │
│ │ Cena: 500 CZK (Uhrazeno) • Expirace za 5 dní       │ │
│ │ [Rozbalit časovou osu a editaci Burner Alertu v ]  │ │
│ └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

---

### STRÁNKA 6: VENDOR – TVORBA NOVÉHO DROPU

Formulář s automatickou sanitizací fotografií na straně klienta.

1. **Interaktivní mapa:** Kliknutím se umístí špendlík na přesné souřadnice.
2. **Cena & Množství:** Zákazník uvidí cenu; pokud je > 0, poloha je chráněna PaySafeCard branou.
3. **Popis úkrytu:** Detailní textové instrukce pro nalezení schránky.
4. **Nahrání fotografií (1 až 3 snímky):**
   - Automatické odstranění EXIF a GPS v HTML5 Canvasu před odesláním.
   - Náhledy s možností smazání.
5. **Nouzová zpráva (Burner Alert):** Volitelný text výstrahy.
6. **Burn After Reading (Skartace po čtení):** Přepínač, který úschovu smaže ihned po potvrzení vyzvednutí.
7. **Výsledek po vytvoření:**
   - Zobrazení vygenerovaného 6místného PINu s velkým tlačítkem pro zkopírování.
   - Možnost zkopírovat přímý odkaz: `https://.../?pin=XXXXXX`.

---

## SHRNUTÍ IMPLEMENTAČNÍCH PRAVIDEL PRO VÝVOJÁŘE

1. **Žádné popupy:** Všechna potvrzení stavů, chyby a časovače se vykreslují jako integrované panely (NotificationBanner) přímo do těla stránky.
2. **Zvuková přístupnost:** Uživatel může zvuk kdykoli vypnout kliknutím na ikonu reproduktoru v navigační liště.
3. **Bezpečnost souřadnic:** Server v žádném případě neposílá přesné GPS souřadnice ani fotografie v odpovědi `/api/drops/claim`, pokud má úschova nastavenou cenu a platba dosud nebyla vendorem manuálně potvrzena (`isPaid !== true`).
4. **Responzivní kontejner:** Celé rozhraní striktně drží šířku `max-w-xl` (576px) pro dokonalé zobrazení a ovládání jednou rukou v terénu na mobilním telefonu.
