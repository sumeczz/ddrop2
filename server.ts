import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

export type DropStatus = 'CREATED' | 'VIEWED' | 'COLLECTED' | 'NOT_FOUND' | 'EXPIRED';

interface StatusHistoryItem {
  status: DropStatus;
  timestamp: number;
  note?: string;
}

interface StoredDrop {
  id: string;
  pinHash: string;
  rawPin: string; // Stored for vendor management dashboard
  description: string;
  latitude: number;
  longitude: number;
  photos: { id: string; dataUrl: string; sizeBytes: number }[];
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

// Ensure data storage directory
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'drops.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load initial drops or empty map
let dropsStore: Map<string, StoredDrop> = new Map();

function loadDropsFromDisk() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content) as StoredDrop[];
      const now = Date.now();
      parsed.forEach((d) => {
        // Upgrade legacy records if missing status or history
        if (!d.status) d.status = d.claimedAt ? 'VIEWED' : 'CREATED';
        if (!d.history || !Array.isArray(d.history)) {
          d.history = [{ status: 'CREATED', timestamp: d.createdAt, note: 'Úschova vytvořena' }];
          if (d.claimedAt) {
            d.history.push({ status: 'VIEWED', timestamp: d.claimedAt, note: 'Zobrazena PINem' });
          }
        }
        if (d.isPaid === undefined) {
          d.isPaid = !d.price;
        }

        if (d.expiresAt > now) {
          dropsStore.set(d.id, d);
        } else {
          d.status = 'EXPIRED';
        }
      });
      console.log(`[Storage] Loaded ${dropsStore.size} active dead drops from disk.`);
    }
  } catch (err) {
    console.error('[Storage] Error loading drops from disk:', err);
  }
}

function saveDropsToDisk() {
  try {
    const list = Array.from(dropsStore.values());
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Storage] Error saving drops to disk:', err);
  }
}

loadDropsFromDisk();

// Cleanup expired drops periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  let changed = false;
  for (const [id, drop] of dropsStore.entries()) {
    if (drop.expiresAt <= now && drop.status !== 'EXPIRED') {
      drop.status = 'EXPIRED';
      drop.history.push({
        status: 'EXPIRED',
        timestamp: now,
        note: 'Úschova vypršela po 7 dnech platnosti.',
      });
      changed = true;
    }
  }
  if (changed) {
    saveDropsToDisk();
  }
}, 5 * 60 * 1000);

// Safe characters for PIN
const PIN_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function generateRandomPin(length = 6): string {
  let pin = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    pin += PIN_ALPHABET[randomBytes[i] % PIN_ALPHABET.length];
  }
  return pin;
}

function hashPin(pin: string): string {
  return crypto.createHash('sha256').update(pin.trim().toUpperCase()).digest('hex');
}

// Generate realistic mock crypto address for customer payment demonstration
function generateDemoCryptoAddress(type: 'BTC' | 'XMR' | 'USDT'): string {
  if (type === 'XMR') {
    return '888tNkZrPN6JsEAnStBaF4ZUnB13EB6CNSmFPXbkHybAbAAGPdjWw3i2b4fG...';
  }
  if (type === 'USDT') {
    return '0x71C...B29F (TRC-20 / ERC-20)';
  }
  return 'bc1q' + crypto.randomBytes(16).toString('hex');
}

// Brute-force rate limiting: track failed attempts per IP
const failedAttemptsMap = new Map<string, { count: number; blockedUntil: number }>();

function isIpRateLimited(ip: string): boolean {
  const record = failedAttemptsMap.get(ip);
  if (!record) return false;
  if (Date.now() > record.blockedUntil) {
    failedAttemptsMap.delete(ip);
    return false;
  }
  return record.count >= 6;
}

function recordFailedAttempt(ip: string) {
  const now = Date.now();
  const record = failedAttemptsMap.get(ip) || { count: 0, blockedUntil: now + 15 * 60 * 1000 };
  record.count += 1;
  record.blockedUntil = now + 15 * 60 * 1000;
  failedAttemptsMap.set(ip, record);
}

function resetFailedAttempts(ip: string) {
  failedAttemptsMap.delete(ip);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      activeDrops: dropsStore.size,
      timestamp: Date.now(),
    });
  });

  // GET /api/drops - List all drops for vendor admin dashboard
  app.get('/api/drops', (req, res) => {
    try {
      const list = Array.from(dropsStore.values()).sort((a, b) => b.createdAt - a.createdAt);
      res.json({ success: true, drops: list });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Chyba při načítání úschov.' });
    }
  });

  // POST /api/drops - Create a new Dead Drop
  app.post('/api/drops', (req, res) => {
    try {
      const {
        description,
        latitude,
        longitude,
        photos,
        burnAfterReading,
        amount,
        price,
        currency = 'CZK',
        burnerAlert,
        cryptoType = 'BTC',
      } = req.body;

      if (!description || typeof description !== 'string') {
        return res.status(400).json({ success: false, error: 'Popis úschovy je povinný.' });
      }

      if (description.length > 500) {
        return res.status(400).json({ success: false, error: 'Popis přesahuje limit 500 znaků.' });
      }

      if (typeof latitude !== 'number' || typeof longitude !== 'number' || isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ success: false, error: 'Neplatné zeměpisné souřadnice.' });
      }

      if (!Array.isArray(photos) || photos.length < 1 || photos.length > 3) {
        return res.status(400).json({ success: false, error: 'Vyžaduje se nahrání 1 až 3 fotografií.' });
      }

      // Generate unique PIN
      let rawPin = '';
      let pinHash = '';
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 20) {
        rawPin = generateRandomPin(6);
        pinHash = hashPin(rawPin);
        isUnique = !Array.from(dropsStore.values()).some((d) => d.pinHash === pinHash && d.expiresAt > Date.now());
        attempts++;
      }

      if (!isUnique) {
        return res.status(500).json({ success: false, error: 'Chyba při generování PIN kódu.' });
      }

      const id = crypto.randomUUID();
      const now = Date.now();
      const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days TTL

      const formattedPhotos = photos.map((p, idx) => ({
        id: `photo-${idx + 1}-${Date.now()}`,
        dataUrl: p.dataUrl,
        sizeBytes: p.sizeBytes || 0,
      }));

      const parsedPrice = price ? Math.max(0, Number(price)) : 0;
      const initialPaid = parsedPrice === 0;

      const history: StatusHistoryItem[] = [
        {
          status: 'CREATED',
          timestamp: now,
          note: parsedPrice > 0 ? `Vytvořeno s cenou ${parsedPrice} ${currency}` : 'Vytvořena úschova (zdarma / předplaceno)',
        },
      ];

      if (burnerAlert && burnerAlert.trim()) {
        history.push({
          status: 'CREATED',
          timestamp: now,
          note: `Nouzová zpráva: ${burnerAlert.trim().slice(0, 80)}`,
        });
      }

      const newDrop: StoredDrop = {
        id,
        pinHash,
        rawPin,
        description: description.trim(),
        latitude,
        longitude,
        photos: formattedPhotos,
        createdAt: now,
        expiresAt,
        burnAfterReading: Boolean(burnAfterReading),
        viewCount: 0,
        claimedAt: null,
        status: 'CREATED',
        history,
        amount: amount ? String(amount).trim() : undefined,
        price: parsedPrice > 0 ? parsedPrice : undefined,
        currency,
        isPaid: initialPaid,
        cryptoType,
        cryptoAddress: parsedPrice > 0 ? generateDemoCryptoAddress(cryptoType) : undefined,
        burnerAlert: burnerAlert?.trim() || undefined,
        burnerAlertSetAt: burnerAlert?.trim() ? now : undefined,
      };

      dropsStore.set(id, newDrop);
      saveDropsToDisk();

      res.status(201).json({
        success: true,
        pin: rawPin,
        expiresAt,
        burnAfterReading: newDrop.burnAfterReading,
        message: 'Dead drop byl úspěšně vytvořen.',
      });
    } catch (err: any) {
      console.error('[API] Error creating drop:', err);
      res.status(500).json({ success: false, error: 'Chyba při ukládání úschovy.' });
    }
  });

  // POST /api/drops/claim - Claim and view drop by PIN
  app.post('/api/drops/claim', (req, res) => {
    try {
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

      if (isIpRateLimited(clientIp)) {
        return res.status(429).json({
          success: false,
          error: 'Příliš mnoho neúspěšných pokusů o zadání PINu. Zkuste to za 15 minut.',
        });
      }

      const { pin } = req.body;
      if (!pin || typeof pin !== 'string' || pin.trim().length !== 6) {
        return res.status(400).json({ success: false, error: 'Zadejte platný 6místný PIN kód.' });
      }

      const sanitizedPin = pin.trim().toUpperCase();
      const searchedHash = hashPin(sanitizedPin);
      const now = Date.now();

      let foundDrop: StoredDrop | null = null;
      for (const drop of dropsStore.values()) {
        if (drop.pinHash === searchedHash) {
          if (drop.expiresAt > now) {
            foundDrop = drop;
          }
          break;
        }
      }

      if (!foundDrop) {
        recordFailedAttempt(clientIp);
        return res.status(404).json({
          success: false,
          error: 'Úschova s tímto PIN kódem nebyla nalezena nebo již expirovala.',
        });
      }

      resetFailedAttempts(clientIp);

      foundDrop.viewCount += 1;
      if (!foundDrop.claimedAt) {
        foundDrop.claimedAt = now;
      }

      // Transition status to VIEWED if still CREATED
      if (foundDrop.status === 'CREATED') {
        foundDrop.status = 'VIEWED';
        foundDrop.history.push({
          status: 'VIEWED',
          timestamp: now,
          note: 'Zákazník poprvé zobrazil detaily přes PIN',
        });
      }

      saveDropsToDisk();

      return res.json({
        success: true,
        drop: foundDrop,
      });
    } catch (err: any) {
      console.error('[API] Error claiming drop:', err);
      res.status(500).json({ success: false, error: 'Chyba při vyhledávání úschovy.' });
    }
  });

  // POST /api/drops/:id/status - Update lifecycle status (COLLECTED or NOT_FOUND)
  app.post('/api/drops/:id/status', (req, res) => {
    try {
      const { id } = req.params;
      const { status, note } = req.body;

      const drop = dropsStore.get(id);
      if (!drop) {
        return res.status(404).json({ success: false, error: 'Úschova nenalezena.' });
      }

      if (!['COLLECTED', 'NOT_FOUND', 'VIEWED'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Neplatný stav zásilky.' });
      }

      const now = Date.now();
      drop.status = status as DropStatus;

      const defaultNote =
        status === 'COLLECTED'
          ? 'Zákazník potvrdil úspěšné vyzvednutí úschovy'
          : status === 'NOT_FOUND'
          ? 'Zákazník nahlásil: úschova nenalezena na místě'
          : 'Aktualizace stavu';

      drop.history.push({
        status: drop.status,
        timestamp: now,
        note: note ? note.trim() : defaultNote,
      });

      // If burn after reading was enabled and collected, remove
      if (drop.burnAfterReading && status === 'COLLECTED') {
        dropsStore.delete(drop.id);
      }

      saveDropsToDisk();

      res.json({ success: true, drop });
    } catch (err: any) {
      console.error('[API] Error updating drop status:', err);
      res.status(500).json({ success: false, error: 'Chyba při změně stavu úschovy.' });
    }
  });

  // POST /api/drops/:id/pay - Process payment (PaySafeCard or Crypto)
  app.post('/api/drops/:id/pay', (req, res) => {
    try {
      const { id } = req.params;
      const { method, pscCode, cryptoTx } = req.body;

      const drop = dropsStore.get(id);
      if (!drop) {
        return res.status(404).json({ success: false, error: 'Úschova nenalezena.' });
      }

      const now = Date.now();

      if (method === 'PAYSAFECARD') {
        if (!pscCode || typeof pscCode !== 'string') {
          return res.status(400).json({ success: false, error: 'Zadejte 16místný PaySafeCard PIN kód.' });
        }
        const cleanedPsc = pscCode.replace(/[\s-]/g, '');
        if (cleanedPsc.length !== 16 || !/^\d{16}$/.test(cleanedPsc)) {
          return res.status(400).json({ success: false, error: 'PaySafeCard PIN musí obsahovat přesně 16 číslic (4x4).' });
        }

        drop.isPaid = true;
        drop.paidAt = now;
        drop.paymentMethod = 'PAYSAFECARD';
        drop.history.push({
          status: drop.status,
          timestamp: now,
          note: `Platba PaySafeCard PIN (****-****-****-${cleanedPsc.slice(-4)}) přijata za ${drop.price} ${drop.currency}`,
        });
      } else if (method === 'CRYPTO') {
        drop.isPaid = true;
        drop.paidAt = now;
        drop.paymentMethod = 'CRYPTO';
        drop.history.push({
          status: drop.status,
          timestamp: now,
          note: `Platba v kryptoměně (${drop.cryptoType || 'BTC'}) ověřena v síti za ${drop.price} ${drop.currency}`,
        });
      } else {
        return res.status(400).json({ success: false, error: 'Neplatná platební metoda.' });
      }

      saveDropsToDisk();
      res.json({ success: true, drop, message: 'Platba byla úspěšně zpracována.' });
    } catch (err: any) {
      console.error('[API] Error processing payment:', err);
      res.status(500).json({ success: false, error: 'Chyba při zpracování platby.' });
    }
  });

  // POST /api/drops/:id/alert - Vendor adds/updates Burner Alert
  app.post('/api/drops/:id/alert', (req, res) => {
    try {
      const { id } = req.params;
      const { burnerAlert } = req.body;

      const drop = dropsStore.get(id);
      if (!drop) {
        return res.status(404).json({ success: false, error: 'Úschova nenalezena.' });
      }

      const now = Date.now();
      drop.burnerAlert = burnerAlert ? burnerAlert.trim() : undefined;
      drop.burnerAlertSetAt = now;

      drop.history.push({
        status: drop.status,
        timestamp: now,
        note: drop.burnerAlert ? `Nouzová zpráva nastavena: "${drop.burnerAlert}"` : 'Nouzová zpráva odstraněna',
      });

      saveDropsToDisk();
      res.json({ success: true, drop });
    } catch (err: any) {
      console.error('[API] Error setting burner alert:', err);
      res.status(500).json({ success: false, error: 'Chyba při ukládání zprávy.' });
    }
  });

  // DELETE /api/drops/:id - Delete drop manually
  app.delete('/api/drops/:id', (req, res) => {
    try {
      const { id } = req.params;
      if (dropsStore.has(id)) {
        dropsStore.delete(id);
        saveDropsToDisk();
      }
      res.json({ success: true, message: 'Úschova byla smazána.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Chyba při mazání.' });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] My Dead Drops listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Failed to start:', err);
  process.exit(1);
});
