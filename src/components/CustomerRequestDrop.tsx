import React, { useState } from 'react';
import { InteractiveMap } from './InteractiveMap';
import { motion, AnimatePresence } from 'motion/react';
import { Send, MapPin, CreditCard, CheckCircle2, Clock, Search, AlertCircle, RefreshCw, Sparkles, Copy, Check, ClipboardPaste, ArrowRight } from 'lucide-react';
import { CustomerDropRequest } from '../types';
import { playSuccessSound, playAlertSound, playClickSound } from '../utils/soundEffects';

interface CustomerRequestDropProps {
  onGoToPin?: (pin: string) => void;
  onShowNotification: (title: string, message: string, type: 'success' | 'warning' | 'info' | 'error') => void;
}

export const CustomerRequestDrop: React.FC<CustomerRequestDropProps> = ({
  onGoToPin,
  onShowNotification,
}) => {
  const [tab, setTab] = useState<'NEW_REQUEST' | 'TRACK_REQUEST'>('NEW_REQUEST');

  // Form state
  const [latitude, setLatitude] = useState<number>(50.08781);
  const [longitude, setLongitude] = useState<number>(14.42046);
  const [locationDescription, setLocationDescription] = useState<string>('');
  const [amount, setAmount] = useState<string>('1 ks');
  const [price, setPrice] = useState<string>('500');
  const [currency, setCurrency] = useState<string>('CZK');
  const [pscTiming, setPscTiming] = useState<'NOW' | 'LATER'>('NOW');
  const [pscCode, setPscCode] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdRequest, setCreatedRequest] = useState<CustomerDropRequest | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Tracking state
  const [trackCode, setTrackCode] = useState<string>('');
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [trackedRequest, setTrackedRequest] = useState<CustomerDropRequest | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);

  // Quick amount & price presets for 1-click simplicity
  const amountPresets = ['1 ks', '2 ks', '5 ks', '10g', '50g'];
  const pricePresets = ['300', '500', '1000', '2000'];

  // Format PaySafeCard PIN as 0000-0000-0000-0000
  const handlePscChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const parts = raw.match(/.{1,4}/g);
    setPscCode(parts ? parts.join('-') : raw);
  };

  // 1-Click Paste for PSC
  const handlePastePsc = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const raw = text.replace(/\D/g, '').slice(0, 16);
      if (raw.length > 0) {
        const parts = raw.match(/.{1,4}/g);
        setPscCode(parts ? parts.join('-') : raw);
        playClickSound();
      }
    } catch (e) {
      // Ignore
    }
  };

  // 1-Click Paste for Track code
  const handlePasteTrackCode = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const cleaned = text.trim().toUpperCase();
      if (cleaned.length > 0) {
        setTrackCode(cleaned);
        playClickSound();
        handleTrackRequest(cleaned);
      }
    } catch (e) {
      // Ignore
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount.trim()) {
      onShowNotification('Chyba formuláře', 'Vyplňte požadované množství.', 'error');
      return;
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      onShowNotification('Chyba formuláře', 'Zadejte platnou nabízenou cenu.', 'error');
      return;
    }

    if (pscTiming === 'NOW') {
      const cleaned = pscCode.replace(/-/g, '');
      if (cleaned.length !== 16) {
        onShowNotification('Neplatný kód', 'Zadejte kompletní 16místný PaySafeCard PIN nebo zvolte platbu později.', 'error');
        return;
      }
    }

    setIsSubmitting(true);
    playClickSound();

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude,
          longitude,
          locationDescription,
          amount: amount.trim(),
          price: numPrice,
          currency,
          pscTiming,
          pscCode: pscTiming === 'NOW' ? pscCode : undefined,
          note: note.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.request) {
        throw new Error(data.error || 'Nepodařilo se odeslat žádost.');
      }

      setCreatedRequest(data.request);
      playSuccessSound();
      onShowNotification(
        'Žádost odeslána',
        `Vaše žádost byla uložena pod kódem ${data.request.requestCode}. Vendor byl informován.`,
        'success'
      );
    } catch (err: any) {
      onShowNotification('Chyba', err.message || 'Nepodařilo se odeslat žádost.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrackRequest = async (codeToSearch?: string) => {
    const code = (codeToSearch || trackCode).trim().toUpperCase();
    if (!code) return;

    setIsTracking(true);
    setTrackError(null);
    playClickSound();

    try {
      const res = await fetch(`/api/requests/track/${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!res.ok || !data.success || !data.request) {
        throw new Error(data.error || 'Žádost s tímto kódem nebyla nalezena.');
      }
      setTrackedRequest(data.request);
      playAlertSound();
    } catch (err: any) {
      setTrackError(err.message || 'Chyba při vyhledávání žádosti.');
    } finally {
      setIsTracking(false);
    }
  };

  const handleCopyRequestCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    playClickSound();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Sub-nav tabs with motion spring pill */}
      <div className="relative flex items-center p-1 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-xs font-mono shadow-inner">
        <button
          type="button"
          onClick={() => {
            setTab('NEW_REQUEST');
            playClickSound();
          }}
          className={`relative z-10 flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition font-semibold ${
            tab === 'NEW_REQUEST'
              ? 'text-emerald-300'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {tab === 'NEW_REQUEST' && (
            <motion.div
              layoutId="request-tab-pill"
              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              className="absolute inset-0 bg-zinc-800 border border-emerald-500/30 rounded-xl shadow-md"
            />
          )}
          <Sparkles className="w-3.5 h-3.5 relative z-10 text-emerald-400" />
          <span className="relative z-10">Nová žádost o drop</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTab('TRACK_REQUEST');
            playClickSound();
          }}
          className={`relative z-10 flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition font-semibold ${
            tab === 'TRACK_REQUEST'
              ? 'text-emerald-300'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {tab === 'TRACK_REQUEST' && (
            <motion.div
              layoutId="request-tab-pill"
              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              className="absolute inset-0 bg-zinc-800 border border-emerald-500/30 rounded-xl shadow-md"
            />
          )}
          <Search className="w-3.5 h-3.5 relative z-10 text-emerald-400" />
          <span className="relative z-10">Sledovat stav žádosti</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* VIEW 1: NEW REQUEST FORM */}
        {tab === 'NEW_REQUEST' && (
          <motion.div
            key="new-request"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          >
            {createdRequest ? (
              /* Request Confirmation Card */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-emerald-500/50 bg-zinc-900/90 p-5 space-y-4 font-mono text-xs shadow-2xl backdrop-blur-xl border-glow-emerald"
              >
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Žádost byla úspěšně přijata systémem</span>
                </div>

                <p className="text-zinc-300 text-xs leading-relaxed font-sans">
                  Vendor obdržel vaši poptávku. Jakmile připraví fyzickou úschovu na zvoleném místě, 
                  přiřadí k této žádosti 6místný PIN. Uschovejte si svůj kód žádosti:
                </p>

                <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between shadow-inner">
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Kód vaší žádosti:</div>
                    <div className="text-xl font-bold text-emerald-300 tracking-wider">
                      {createdRequest.requestCode}
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => handleCopyRequestCode(createdRequest.requestCode)}
                    className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 transition flex items-center gap-1.5 text-xs font-semibold"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCode ? 'Zkopírováno' : 'Kopírovat'}</span>
                  </motion.button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                  <div>Množství: <span className="text-zinc-200 font-bold">{createdRequest.amount}</span></div>
                  <div>Cena: <span className="text-zinc-200 font-bold">{createdRequest.price} {createdRequest.currency}</span></div>
                  <div>Platba: <span className="text-zinc-200">{createdRequest.pscTiming === 'NOW' ? 'PaySafeCard přiložen' : 'Bude doplaceno'}</span></div>
                  <div>Stav: <span className="text-amber-400 font-bold">Čeká na schválení</span></div>
                </div>

                <div className="pt-2 flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    type="button"
                    onClick={() => {
                      setCreatedRequest(null);
                      setPscCode('');
                      setLocationDescription('');
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold transition"
                  >
                    Vytvořit další žádost
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    type="button"
                    onClick={() => {
                      setTab('TRACK_REQUEST');
                      setTrackCode(createdRequest.requestCode);
                      handleTrackRequest(createdRequest.requestCode);
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <span>Sledovat průběh</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              /* Creation Form */
              <form onSubmit={handleSubmitRequest} className="space-y-4 font-mono text-xs">
                {/* Step 1: Map location */}
                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-4 space-y-3 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-200 font-bold flex items-center gap-1.5 text-xs">
                      <MapPin className="w-4 h-4 text-emerald-400" />
                      1. Vyberte požadovanou lokalitu na mapě
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      {latitude.toFixed(4)}, {longitude.toFixed(4)}
                    </span>
                  </div>

                  <div className="rounded-xl overflow-hidden border border-zinc-800 shadow-inner">
                    <InteractiveMap
                      latitude={latitude}
                      longitude={longitude}
                      onLocationChange={(lat, lng) => {
                        setLatitude(lat);
                        setLongitude(lng);
                      }}
                      interactive={true}
                      className="h-56 w-full"
                      zoom={15}
                    />
                  </div>

                  <input
                    type="text"
                    value={locationDescription}
                    onChange={(e) => setLocationDescription(e.target.value)}
                    placeholder="Upřesnění lokace (např. Praha 7, poblíž vstupu do parku Stromovka)"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 text-xs focus:outline-none focus:border-emerald-500 transition shadow-inner font-sans"
                  />
                </div>

                {/* Step 2: Amount and Price with 1-Click Presets */}
                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-4 space-y-3 shadow-xl backdrop-blur-xl">
                  <div className="text-zinc-200 font-bold text-xs">2. Požadavek a nabízená cena</div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] uppercase text-zinc-400">Množství / Položka</label>
                      <input
                        type="text"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="např. 1 ks, 50g"
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-emerald-500 transition shadow-inner"
                        required
                      />
                      {/* 1-Click presets */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {amountPresets.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => {
                              setAmount(preset);
                              playClickSound();
                            }}
                            className={`px-2 py-0.5 rounded-lg border text-[10px] transition ${
                              amount === preset
                                ? 'bg-emerald-950 border-emerald-500/50 text-emerald-300 font-bold'
                                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] uppercase text-zinc-400">Nabízená cena</label>
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="500"
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-emerald-400 font-bold text-xs focus:outline-none focus:border-emerald-500 transition shadow-inner"
                          required
                        />
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded-xl px-2 text-zinc-300 text-xs font-semibold"
                        >
                          <option value="CZK">CZK</option>
                          <option value="EUR">EUR</option>
                        </select>
                      </div>
                      {/* 1-Click price presets */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {pricePresets.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => {
                              setPrice(preset);
                              playClickSound();
                            }}
                            className={`px-2 py-0.5 rounded-lg border text-[10px] transition ${
                              price === preset
                                ? 'bg-emerald-950 border-emerald-500/50 text-emerald-300 font-bold'
                                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-zinc-400 mb-1">Poznámka pro vendora (volitelné)</label>
                    <textarea
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Např. Preferuji vyzvednutí ve večerních hodinách, ideálně v nenápadném přírodním úkrytu."
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 text-xs focus:outline-none focus:border-emerald-500 resize-none font-sans"
                    />
                  </div>
                </div>

                {/* Step 3: PaySafeCard option */}
                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-4 space-y-3 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-200 font-bold flex items-center gap-1.5 text-xs">
                      <CreditCard className="w-4 h-4 text-blue-400" />
                      3. PaySafeCard platba
                    </span>
                  </div>

                  {/* Timing selector */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPscTiming('NOW')}
                      className={`py-2.5 px-3 rounded-xl border text-left transition ${
                        pscTiming === 'NOW'
                          ? 'border-blue-500/60 bg-blue-950/40 text-blue-200 font-bold shadow-md'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400'
                      }`}
                    >
                      <div className="text-xs">Přidat PIN ihned</div>
                      <div className="text-[10px] opacity-70 font-normal">Zrychlí vyřízení dropu</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPscTiming('LATER')}
                      className={`py-2.5 px-3 rounded-xl border text-left transition ${
                        pscTiming === 'LATER'
                          ? 'border-blue-500/60 bg-blue-950/40 text-blue-200 font-bold shadow-md'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400'
                      }`}
                    >
                      <div className="text-xs">Zaplatit až po vytvoření</div>
                      <div className="text-[10px] opacity-70 font-normal">Kód zadáte při vyzvednutí</div>
                    </button>
                  </div>

                  {pscTiming === 'NOW' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-2 pt-1"
                    >
                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span>16místný PaySafeCard PIN:</span>
                        <button
                          type="button"
                          onClick={handlePastePsc}
                          className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-[10px] font-semibold"
                        >
                          <ClipboardPaste className="w-3 h-3" />
                          <span>Vložit ze schránky</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        maxLength={19}
                        value={pscCode}
                        onChange={handlePscChange}
                        placeholder="0000-0000-0000-0000"
                        className="w-full px-3 py-2.5 text-center font-mono tracking-widest bg-zinc-950 border border-zinc-800 rounded-xl text-blue-400 font-bold text-sm focus:outline-none focus:border-blue-500 shadow-inner"
                      />
                    </motion.div>
                  )}
                </div>

                {/* Submit button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-mono font-bold text-sm transition shadow-xl shadow-emerald-950/40 flex items-center justify-center gap-2 disabled:opacity-50 border-glow-emerald"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Odeslat žádost o dead drop</span>
                </motion.button>
              </form>
            )}
          </motion.div>
        )}

        {/* VIEW 2: TRACK REQUEST */}
        {tab === 'TRACK_REQUEST' && (
          <motion.div
            key="track-request"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="space-y-4 font-mono text-xs"
          >
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-4 space-y-3 shadow-xl backdrop-blur-xl">
              <div className="text-zinc-200 font-bold flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-emerald-400" />
                  Zadejte kód vaší žádosti (REQ-XXXXXX)
                </span>
                <button
                  type="button"
                  onClick={handlePasteTrackCode}
                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[10px]"
                >
                  <ClipboardPaste className="w-3 h-3" />
                  <span>Vložit (1-klik)</span>
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={trackCode}
                  onChange={(e) => setTrackCode(e.target.value.toUpperCase())}
                  placeholder="REQ-ABC123"
                  className="flex-1 px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-emerald-400 font-bold text-center tracking-wider focus:outline-none focus:border-emerald-500 shadow-inner"
                />
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => handleTrackRequest()}
                  disabled={isTracking || !trackCode.trim()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold rounded-xl transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isTracking ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Vyhledat'}
                </motion.button>
              </div>

              {trackError && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{trackError}</span>
                </div>
              )}
            </div>

            {/* Tracked Request Card */}
            {trackedRequest && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-zinc-800/80 bg-zinc-900/90 p-4 space-y-3.5 shadow-2xl backdrop-blur-xl"
              >
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase">Kód žádosti</span>
                    <div className="text-sm font-bold text-zinc-100">{trackedRequest.requestCode}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 uppercase">Aktuální stav</span>
                    <div className="mt-0.5">
                      {trackedRequest.status === 'PENDING' && (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-500/40 text-[11px] font-bold">
                          Čeká na schválení
                        </span>
                      )}
                      {trackedRequest.status === 'ACCEPTED' && (
                        <span className="px-2.5 py-1 rounded-lg bg-blue-950/80 text-blue-300 border border-blue-500/40 text-[11px] font-bold">
                          Přijato — připravuje se
                        </span>
                      )}
                      {trackedRequest.status === 'FULFILLED' && (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold">
                          Hotovo — úschova připravena
                        </span>
                      )}
                      {trackedRequest.status === 'REJECTED' && (
                        <span className="px-2.5 py-1 rounded-lg bg-rose-950/80 text-rose-300 border border-rose-500/40 text-[11px] font-bold">
                          Zamítnuto
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* If fulfilled: show PIN button */}
                {trackedRequest.status === 'FULFILLED' && trackedRequest.fulfilledDropPin && (
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/60 space-y-2.5 border-glow-emerald"
                  >
                    <div className="flex items-center gap-2 text-emerald-300 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Úschova byla úspěšně umístěna!</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 font-sans">
                      Vendor umístil dead drop. Kód pro odemčení je:{' '}
                      <span className="font-bold font-mono text-white bg-zinc-950 px-2.5 py-1 rounded-lg border border-emerald-500/40 ml-1">
                        {trackedRequest.fulfilledDropPin}
                      </span>
                    </p>
                    {onGoToPin && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        onClick={() => onGoToPin(trackedRequest.fulfilledDropPin!)}
                        className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold transition flex items-center justify-center gap-1.5 text-xs shadow-md"
                      >
                        <span>Otevřít úschovu s tímto PINem →</span>
                      </motion.button>
                    )}
                  </motion.div>
                )}

                <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400 bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/80">
                  <div>Množství: <span className="text-zinc-200 font-semibold">{trackedRequest.amount}</span></div>
                  <div>Cena: <span className="text-emerald-400 font-bold">{trackedRequest.price} {trackedRequest.currency}</span></div>
                  <div>Platba: <span className="text-zinc-200">{trackedRequest.pscTiming === 'NOW' ? 'PaySafeCard zadán' : 'Při vyzvednutí'}</span></div>
                  <div>Lokalita: <span className="text-zinc-200">{trackedRequest.latitude.toFixed(3)}, {trackedRequest.longitude.toFixed(3)}</span></div>
                </div>

                {trackedRequest.note && (
                  <div className="text-[11px] text-zinc-400 bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-850">
                    <span className="text-zinc-500 block text-[10px] uppercase">Poznámka:</span>
                    <p className="font-sans text-zinc-300 mt-0.5">{trackedRequest.note}</p>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
