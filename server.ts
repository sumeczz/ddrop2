import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

export type DropStatus = 'CREATED' | 'VIEWED' | 'COLLECTED' | 'NOT_FOUND' | 'EXPIRED';
export type PaymentStatus = 'UNPAID' | 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'REJECTED';

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
  paymentMethod?: 'PAYSAFECARD';
  paymentStatus?: PaymentStatus;
  pscCode?: string;
  pscSubmittedAt?: number;
  pscExpiresAt?: number;
  burnerAlert?: string;
  burnerAlertSetAt?: number;
}

export type RequestDropStatus = 'PENDING' | 'ACCEPTED' | 'FULFILLED' | 'REJECTED';

interface StoredCustomerRequest {
  id: string;
  requestCode: string;
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

// Ensure data storage directory
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'drops.json');
const REQUESTS_FILE = path.join(DATA_DIR, 'requests.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load initial drops or empty map
let dropsStore: Map<string, StoredDrop> = new Map();
let requestsStore: Map<string, StoredCustomerRequest> = new Map();

function loadDataFromDisk() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content) as StoredDrop[];
      const now = Date.now();
      parsed.forEach((d) => {
        if (!d.status) d.status = d.claimedAt ? 'VIEWED' : 'CREATED';
        if (!d.history || !Array.isArray(d.history)) {
          d.history = [{ status: 'CREATED', timestamp: d.createdAt, note: 'Úschova vytvořena' }];
          if (d.claimedAt) {
            d.history.push({ status: 'VIEWED', timestamp: d.claimedAt, note: 'Zobrazena PINem' });
          }
        }
        if (d.isPaid === undefined) {
          d.isPaid = !d.price || d.price <= 0;
        }
        if (!d.paymentStatus) {
          d.paymentStatus = d.isPaid ? 'CONFIRMED' : 'UNPAID';
        }

        if (d.expiresAt > now) {
          dropsStore.set(d.id, d);
        } else {
          d.status = 'EXPIRED';
        }
      });
      console.log(`[Storage] Loaded ${dropsStore.size} active dead drops from disk.`);
    }

    if (fs.existsSync(REQUESTS_FILE)) {
      const content = fs.readFileSync(REQUESTS_FILE, 'utf-8');
      const parsed = JSON.parse(content) as StoredCustomerRequest[];
      parsed.forEach((r) => {
        requestsStore.set(r.id, r);
      });
      console.log(`[Storage] Loaded ${requestsStore.size} customer requests from disk.`);
    }
  } catch (err) {
    console.error('[Storage] Error loading data from disk:', err);
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

function saveRequestsToDisk() {
  try {
    const list = Array.from(requestsStore.values());
    fs.writeFileSync(REQUESTS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Storage] Error saving requests to disk:', err);
  }
}

loadDataFromDisk();

// Cleanup expired drops and check 30min PSC timer periodically (every 1 minute)
setInterval(() => {
  const now = Date.now();
  let changed = false;

  for (const [id, drop] of dropsStore.entries()) {
    // 7-day TTL expiration
    if (drop.expiresAt <= now && drop.status !== 'EXPIRED') {
      drop.status = 'EXPIRED';
      drop.history.push({
        status: 'EXPIRED',
        timestamp: now,
        note: 'Úschova vypršela po 7 dnech platnosti.',
      });
      changed = true;
    }

    // 30min PSC verification timer expiration
    if (
      drop.paymentStatus === 'PENDING_CONFIRMATION' &&
      drop.pscExpiresAt &&
      drop.pscExpiresAt <= now
    ) {
      drop.paymentStatus = 'REJECTED';
      drop.history.push({
        status: drop.status,
        timestamp: now,
        note: 'Vypršel 30minutový limit na ověření PaySafeCard kódu vendorem. Objednávka byla zrušena.',
      });
      changed = true;
    }
  }

  if (changed) {
    saveDropsToDisk();
  }
}, 60 * 1000);

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

// Rate Limiter against Brute-force PIN attacks
interface RateLimitEntry {
  attempts: number;
  blockedUntil: number;
}
const rateLimits: Map<string, RateLimitEntry> = new Map();

function isIpBlocked(ip: string): boolean {
  const entry = rateLimits.get(ip);
  if (!entry) return false;
  if (Date.now() < entry.blockedUntil) {
    return true;
  }
  if (Date.now() >= entry.blockedUntil && entry.blockedUntil > 0) {
    rateLimits.delete(ip);
  }
  return false;
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const entry = rateLimits.get(ip) || { attempts: 0, blockedUntil: 0 };
  entry.attempts += 1;
  if (entry.attempts >= 5) {
    entry.blockedUntil = now + 15 * 60 * 1000;
  }
  rateLimits.set(ip, entry);
}

function resetFailedAttempts(ip: string): void {
  rateLimits.delete(ip);
}

// Sanitizes drop object before sending to customer (hides exact coordinates and photos if unpaid)
function sanitizeDropForCustomer(drop: StoredDrop) {
  const needsPayment = (drop.price || 0) > 0 && !drop.isPaid;
  const maskedPsc = drop.pscCode ? `****-****-****-${drop.pscCode.slice(-4)}` : undefined;

  if (needsPayment) {
    return {
      ...drop,
      rawPin: undefined,
      latitude: 0,
      longitude: 0,
      photos: [],
      description: drop.description ? 'Poloha a přesný popis úschovy budou odemčeny po manuálním potvrzení platby PaySafeCard vendorem.' : '',
      exactLocationLocked: true,
      submittedPscCode: maskedPsc,
    };
  }

  return {
    ...drop,
    rawPin: undefined,
    exactLocationLocked: false,
    submittedPscCode: maskedPsc,
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  // GET /api/health
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      activeDrops: dropsStore.size,
      activeRequests: requestsStore.size,
      time: new Date().toISOString(),
    });
  });

  // GET /api/drops - Admin/Vendor list of all drops
  app.get('/api/drops', (req, res) => {
    try {
      const list = Array.from(dropsStore.values()).sort((a, b) => b.createdAt - a.createdAt);
      res.json({
        success: true,
        drops: list,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Chyba při načítání úschov.' });
    }
  });

  // GET /api/drops/:id - Single drop detail (sanitized for customer)
  app.get('/api/drops/:id', (req, res) => {
    try {
      const { id } = req.params;
      const drop = dropsStore.get(id);
      if (!drop) {
        return res.status(404).json({ success: false, error: 'Úschova nenalezena.' });
      }
      res.json({
        success: true,
        drop: sanitizeDropForCustomer(drop),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Chyba při načítání úschovy.' });
    }
  });

  // POST /api/drops - Vendor creates a new drop
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
        currency,
        burnerAlert,
      } = req.body;

      if (!description || typeof description !== 'string' || description.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Popis úschovy je povinný.' });
      }

      if (description.length > 500) {
        return res.status(400).json({ success: false, error: 'Popis nesmí přesáhnout 500 znaků.' });
      }

      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ success: false, error: 'Platné GPS souřadnice jsou povinné.' });
      }

      if (!Array.isArray(photos) || photos.length < 1 || photos.length > 3) {
        return res.status(400).json({ success: false, error: 'Musíte nahrát 1 až 3 fotografie.' });
      }

      const generatedPin = generateRandomPin(6);
      const hashed = hashPin(generatedPin);
      const now = Date.now();
      const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days

      const numericPrice = typeof price === 'number' && price > 0 ? price : 0;
      const isPaidInitial = numericPrice === 0;

      const newDrop: StoredDrop = {
        id: crypto.randomUUID(),
        pinHash: hashed,
        rawPin: generatedPin,
        description: description.trim(),
        latitude,
        longitude,
        photos: photos.map((p, idx) => ({
          id: `photo-${idx}-${Date.now()}`,
          dataUrl: p.dataUrl,
          sizeBytes: p.sizeBytes || p.dataUrl.length,
        })),
        createdAt: now,
        expiresAt,
        burnAfterReading: Boolean(burnAfterReading),
        viewCount: 0,
        claimedAt: null,
        status: 'CREATED',
        history: [
          {
            status: 'CREATED',
            timestamp: now,
            note: 'Úschova byla úspěšně vytvořena vendorem',
          },
        ],
        amount: amount ? String(amount).trim() : undefined,
        price: numericPrice,
        currency: currency || 'CZK',
        isPaid: isPaidInitial,
        paymentStatus: isPaidInitial ? 'CONFIRMED' : 'UNPAID',
        burnerAlert: burnerAlert ? String(burnerAlert).trim() : undefined,
        burnerAlertSetAt: burnerAlert ? now : undefined,
      };

      dropsStore.set(newDrop.id, newDrop);
      saveDropsToDisk();

      res.status(201).json({
        success: true,
        pin: generatedPin,
        expiresAt,
        burnAfterReading: newDrop.burnAfterReading,
        message: 'Úschova byla bezpečně uložena.',
      });
    } catch (err: any) {
      console.error('[API] Error creating drop:', err);
      res.status(500).json({ success: false, error: 'Chyba při vytváření úschovy.' });
    }
  });

  // POST /api/drops/claim - Customer enters PIN
  app.post('/api/drops/claim', (req, res) => {
    try {
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

      if (isIpBlocked(clientIp)) {
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
        drop: sanitizeDropForCustomer(foundDrop),
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

      if (drop.burnAfterReading && status === 'COLLECTED') {
        dropsStore.delete(drop.id);
      }

      saveDropsToDisk();

      res.json({ success: true, drop: sanitizeDropForCustomer(drop) });
    } catch (err: any) {
      console.error('[API] Error updating drop status:', err);
      res.status(500).json({ success: false, error: 'Chyba při změně stavu úschovy.' });
    }
  });

  // POST /api/drops/:id/pay or /pay-psc - Customer submits PaySafeCard PIN (Starts 30min verification timer)
  const handlePscPayment = (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const { pscCode } = req.body;

      const drop = dropsStore.get(id);
      if (!drop) {
        return res.status(404).json({ success: false, error: 'Úschova nenalezena.' });
      }

      if (!pscCode || typeof pscCode !== 'string') {
        return res.status(400).json({ success: false, error: 'Zadejte 16místný PaySafeCard PIN kód.' });
      }

      const cleanedPsc = pscCode.replace(/[\s-]/g, '');
      if (cleanedPsc.length !== 16 || !/^\d{16}$/.test(cleanedPsc)) {
        return res.status(400).json({ success: false, error: 'PaySafeCard PIN musí obsahovat přesně 16 číslic.' });
      }

      const now = Date.now();
      drop.paymentMethod = 'PAYSAFECARD';
      drop.pscCode = cleanedPsc;
      drop.pscSubmittedAt = now;
      drop.pscExpiresAt = now + 30 * 60 * 1000; // 30 minutes verification timer
      drop.paymentStatus = 'PENDING_CONFIRMATION';
      drop.isPaid = false; // Remains unconfirmed until vendor verifies!

      drop.history.push({
        status: drop.status,
        timestamp: now,
        note: `Zákazník odeslal PaySafeCard PIN (****-****-****-${cleanedPsc.slice(-4)}) za ${drop.price} ${drop.currency}. Běží 30minutový časovač na ověření vendorem.`,
      });

      saveDropsToDisk();

      res.json({
        success: true,
        drop: sanitizeDropForCustomer(drop),
        message: 'PaySafeCard kód byl odeslán. Čeká se na manuální ověření vendorem.',
      });
    } catch (err: any) {
      console.error('[API] Error submitting PSC payment:', err);
      res.status(500).json({ success: false, error: 'Chyba při zpracování PaySafeCard.' });
    }
  };

  app.post('/api/drops/:id/pay', handlePscPayment);
  app.post('/api/drops/:id/pay-psc', handlePscPayment);

  // POST /api/drops/:id/cancel-payment or /pay-psc/cancel - Customer cancels pending PSC submission
  const handleCancelPayment = (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const drop = dropsStore.get(id);
      if (!drop) {
        return res.status(404).json({ success: false, error: 'Úschova nenalezena.' });
      }

      if (drop.paymentStatus === 'PENDING_CONFIRMATION') {
        drop.paymentStatus = 'UNPAID';
        drop.pscCode = undefined;
        drop.pscSubmittedAt = undefined;
        drop.pscExpiresAt = undefined;
        drop.history.push({
          status: drop.status,
          timestamp: Date.now(),
          note: 'Zákazník zrušil odeslaný PaySafeCard požadavek.',
        });
        saveDropsToDisk();
      }

      res.json({ success: true, drop: sanitizeDropForCustomer(drop) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Chyba při rušení platby.' });
    }
  };

  app.post('/api/drops/:id/cancel-payment', handleCancelPayment);
  app.post('/api/drops/:id/pay-psc/cancel', handleCancelPayment);

  // POST /api/drops/:id/confirm-payment - Vendor manually confirms or rejects PSC code
  app.post('/api/drops/:id/confirm-payment', (req, res) => {
    try {
      const { id } = req.params;
      const { action, reason } = req.body; // 'CONFIRM' or 'REJECT'

      const drop = dropsStore.get(id);
      if (!drop) {
        return res.status(404).json({ success: false, error: 'Úschova nenalezena.' });
      }

      const now = Date.now();

      if (action === 'CONFIRM') {
        drop.isPaid = true;
        drop.paidAt = now;
        drop.paymentStatus = 'CONFIRMED';
        drop.history.push({
          status: drop.status,
          timestamp: now,
          note: `Vendor ověřil a schválil PaySafeCard kód. Platba za ${drop.price} ${drop.currency} potvrzena. Lokace odemčena zákazníkovi.`,
        });
      } else if (action === 'REJECT') {
        drop.isPaid = false;
        drop.paymentStatus = 'REJECTED';
        drop.history.push({
          status: drop.status,
          timestamp: now,
          note: `Vendor zamítl PaySafeCard kód (${reason || 'kód je neplatný nebo byl již vyčerpán'}).`,
        });
      } else {
        return res.status(400).json({ success: false, error: 'Neplatná akce (pouze CONFIRM nebo REJECT).' });
      }

      saveDropsToDisk();
      res.json({ success: true, drop });
    } catch (err: any) {
      console.error('[API] Error confirming payment by vendor:', err);
      res.status(500).json({ success: false, error: 'Chyba při schvalování platby.' });
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

  // ==========================================
  // CUSTOMER DROP REQUESTS ENDPOINTS
  // ==========================================

  // POST /api/requests - Customer requests a custom drop
  app.post('/api/requests', (req, res) => {
    try {
      const {
        latitude,
        longitude,
        locationDescription,
        amount,
        price,
        currency,
        pscTiming,
        pscCode,
        note,
      } = req.body;

      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ success: false, error: 'Vyberte přibližnou oblast na mapě.' });
      }

      if (!amount || typeof amount !== 'string' || amount.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Zadejte požadované množství.' });
      }

      const numericPrice = typeof price === 'number' ? price : parseFloat(price);
      if (isNaN(numericPrice) || numericPrice <= 0) {
        return res.status(400).json({ success: false, error: 'Zadejte nabízenou cenu.' });
      }

      let cleanedPsc: string | undefined = undefined;
      if (pscTiming === 'NOW') {
        if (!pscCode || typeof pscCode !== 'string') {
          return res.status(400).json({ success: false, error: 'Zadejte PaySafeCard kód nebo zvolte zadání později.' });
        }
        cleanedPsc = pscCode.replace(/[\s-]/g, '');
        if (cleanedPsc.length !== 16 || !/^\d{16}$/.test(cleanedPsc)) {
          return res.status(400).json({ success: false, error: 'PaySafeCard PIN musí mít přesně 16 číslic.' });
        }
      }

      const requestCode = `REQ-${generateRandomPin(6)}`;
      const newRequest: StoredCustomerRequest = {
        id: crypto.randomUUID(),
        requestCode,
        latitude,
        longitude,
        locationDescription: locationDescription ? String(locationDescription).trim() : undefined,
        amount: amount.trim(),
        price: numericPrice,
        currency: currency || 'CZK',
        pscTiming: pscTiming === 'NOW' ? 'NOW' : 'LATER',
        pscCode: cleanedPsc,
        pscConfirmed: false,
        note: note ? String(note).trim() : undefined,
        status: 'PENDING',
        createdAt: Date.now(),
      };

      requestsStore.set(newRequest.id, newRequest);
      saveRequestsToDisk();

      res.status(201).json({
        success: true,
        request: newRequest,
        message: 'Žádost o drop byla úspěšně odeslána vendorovi.',
      });
    } catch (err: any) {
      console.error('[API] Error creating request:', err);
      res.status(500).json({ success: false, error: 'Chyba při vytváření žádosti.' });
    }
  });

  // GET /api/requests - Vendor lists all customer requests
  app.get('/api/requests', (req, res) => {
    try {
      const list = Array.from(requestsStore.values()).sort((a, b) => b.createdAt - a.createdAt);
      res.json({ success: true, requests: list });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Chyba při načítání žádostí.' });
    }
  });

  // GET /api/requests/:code - Customer checks status of their request by requestCode
  app.get('/api/requests/track/:code', (req, res) => {
    try {
      const code = req.params.code.trim().toUpperCase();
      let found: StoredCustomerRequest | null = null;
      for (const r of requestsStore.values()) {
        if (r.requestCode === code) {
          found = r;
          break;
        }
      }
      if (!found) {
        return res.status(404).json({ success: false, error: 'Žádost s tímto kódem nebyla nalezena.' });
      }
      res.json({ success: true, request: found });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Chyba při vyhledávání žádosti.' });
    }
  });

  // POST /api/requests/:id/status - Vendor updates request status
  app.post('/api/requests/:id/status', (req, res) => {
    try {
      const { id } = req.params;
      const { status, fulfilledDropPin } = req.body;

      const request = requestsStore.get(id);
      if (!request) {
        return res.status(404).json({ success: false, error: 'Žádost nenalezena.' });
      }

      if (!['PENDING', 'ACCEPTED', 'FULFILLED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Neplatný stav žádosti.' });
      }

      request.status = status as RequestDropStatus;
      if (fulfilledDropPin) {
        request.fulfilledDropPin = fulfilledDropPin.trim().toUpperCase();
      }

      saveRequestsToDisk();
      res.json({ success: true, request });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Chyba při změně stavu žádosti.' });
    }
  });

  // Fallback for any unknown /api route -> return JSON 404 instead of HTML
  app.all('/api/*', (req, res) => {
    res.status(404).json({ success: false, error: `API endpoint nenalezen: ${req.method} ${req.path}` });
  });

  // Global error handler for API
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Server Error]', err);
    if (res.headersSent) {
      return next(err);
    }
    res.status(500).json({ success: false, error: err?.message || 'Interní chyba serveru.' });
  });

  // Serve public static assets (including manifest.webmanifest, icons, etc.)
  app.use(express.static(path.join(process.cwd(), 'public')));

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
