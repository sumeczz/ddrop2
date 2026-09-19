import React, { useState, useEffect, useRef } from 'react';
import { InteractiveMap } from './InteractiveMap';
import { PhotoLightbox } from './PhotoLightbox';
import { TimelineView } from './TimelineView';
import { PaymentModule } from './PaymentModule';
import { motion, AnimatePresence } from 'motion/react';
import {
  Key,
  Navigation,
  ExternalLink,
  Flame,
  Copy,
  Check,
  Eye,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Lock,
  ShieldAlert,
  ClipboardPaste,
  ShieldCheck,
} from 'lucide-react';
import { ClaimDropResponse, DeadDrop } from '../types';
import { playSuccessSound, playAlertSound, playRejectSound, playClickSound } from '../utils/soundEffects';
import { SystemNotifications } from '../services/systemNotifications';

interface CustomerClaimProps {
  initialPin?: string;
  onClearInitialPin?: () => void;
  onShowNotification?: (title: string, message: string, type: 'success' | 'warning' | 'info' | 'error') => void;
}

export const CustomerClaim: React.FC<CustomerClaimProps> = ({
  initialPin = '',
  onClearInitialPin,
  onShowNotification,
}) => {
  const [pin, setPin] = useState<string>(initialPin.toUpperCase());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [dropData, setDropData] = useState<DeadDrop | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Auto-focus reference
  const pinInputRef = useRef<HTMLInputElement>(null);

  // Lightbox
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

  // Copy coordinates feedback
  const [copiedCoords, setCopiedCoords] = useState<boolean>(false);

  // Auto-focus on mount and when returning to entry mode
  useEffect(() => {
    if (!dropData) {
      const timer = setTimeout(() => {
        pinInputRef.current?.focus();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [dropData]);

  // Handle URL param ?pin=
  useEffect(() => {
    if (initialPin && initialPin.length === 6) {
      setPin(initialPin.toUpperCase());
      handleClaim(initialPin.toUpperCase());
    }
  }, [initialPin]);

  const handleClaim = async (pinToClaim?: string) => {
    const targetPin = (pinToClaim || pin).trim().toUpperCase();
    setError(null);

    if (!targetPin || targetPin.length !== 6) {
      setError('Zadejte 6místný PIN.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 450);
      pinInputRef.current?.focus();
      playRejectSound();
      return;
    }

    setIsLoading(true);
    playClickSound();

    try {
      const res = await fetch('/api/drops/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: targetPin }),
      });

      const data = (await res.json()) as ClaimDropResponse;

      if (!res.ok || !data.success || !data.drop) {
        throw new Error(data.error || 'Úschova nenalezena.');
      }

      setDropData(data.drop as DeadDrop);
      playSuccessSound();
      localStorage.setItem('mdd_last_pin', targetPin);
      if (data.drop.burnerAlert) {
        SystemNotifications.burnerAlertReceived(data.drop.burnerAlert);
      }
      if (onShowNotification) {
        onShowNotification('Úschova odemčena', 'PIN byl úspěšně dešifrován.', 'success');
      }
    } catch (err: any) {
      setError(err.message || 'Chyba při ověření.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 450);
      playRejectSound();
      setTimeout(() => {
        pinInputRef.current?.focus();
      }, 50);
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Click Paste from Clipboard: Read, parse, and auto-submit
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const cleaned = text.replace(/[^a-zA-Z0-9]/g, '').trim().toUpperCase();
      if (cleaned.length >= 6) {
        const pinCandidate = cleaned.slice(0, 6);
        setPin(pinCandidate);
        playClickSound();
        handleClaim(pinCandidate);
      } else if (cleaned.length > 0) {
        setPin(cleaned);
        pinInputRef.current?.focus();
      }
    } catch (e) {
      pinInputRef.current?.focus();
    }
  };

  // Status transition handler (COLLECTED or NOT_FOUND)
  const handleUpdateStatus = async (newStatus: 'COLLECTED' | 'NOT_FOUND') => {
    if (!dropData) return;
    setIsUpdatingStatus(true);
    playClickSound();

    try {
      const res = await fetch(`/api/drops/${dropData.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Chyba při změně stavu.');
      }
      setDropData(data.drop);
      if (newStatus === 'COLLECTED') {
        playSuccessSound();
        setStatusMessage('Vyzvednutí bylo zaznamenáno. Děkujeme.');
      } else {
        playAlertSound();
        setStatusMessage('Nenalezení bylo zaznamenáno v historii úschovy.');
      }
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Nepodařilo se změnit stav úschovy.');
      playRejectSound();
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCopyCoords = () => {
    if (!dropData) return;
    const text = `${dropData.latitude.toFixed(6)}, ${dropData.longitude.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopiedCoords(true);
    playClickSound();
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const handleReset = () => {
    setDropData(null);
    setPin('');
    setError(null);
    setStatusMessage(null);
    playClickSound();
    if (onClearInitialPin) onClearInitialPin();
  };

  // Check if location is locked (unpaid price)
  const isLocationLocked = Boolean(dropData && (dropData.price || 0) > 0 && !dropData.isPaid);

  // SKELETON LOADER VIEW
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl mx-auto py-8 px-4 space-y-4 font-mono"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-5 w-36 bg-zinc-800/80 rounded animate-pulse"></div>
            <div className="h-3.5 w-24 bg-zinc-800/50 rounded animate-pulse"></div>
          </div>
          <div className="h-7 w-28 bg-zinc-800/60 rounded-lg animate-pulse"></div>
        </div>

        <div className="h-64 bg-zinc-900/80 border border-zinc-800/80 rounded-2xl flex flex-col items-center justify-center p-6 text-zinc-500 gap-3 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/20 via-transparent to-transparent pointer-events-none"></div>
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin flex items-center justify-center"></div>
            <Key className="w-5 h-5 text-emerald-400 absolute inset-0 m-auto" />
          </div>
          <span className="font-mono text-xs text-zinc-300 font-semibold tracking-wider">
            Dešifruji PIN kód zásilky...
          </span>
          <span className="text-[10px] text-zinc-600">Ověření integrity SHA-256</span>
        </div>
      </motion.div>
    );
  }

  // DROP DETAIL VIEW
  if (dropData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="max-w-xl mx-auto py-2 px-1 sm:px-2 space-y-4"
      >
        {/* Status update notification banner */}
        <AnimatePresence>
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs font-mono flex items-center gap-2 border-glow-emerald"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{statusMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* BURNER ALERT (Nouzová zpráva) */}
        {dropData.burnerAlert && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-3.5 rounded-2xl bg-amber-950/90 border border-amber-500/80 text-amber-100 text-xs flex items-start gap-3 shadow-2xl border-glow-amber relative overflow-hidden"
          >
            <AlertOctagon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <strong className="text-amber-300 font-mono text-[11px] uppercase tracking-wider block">
                Nouzová zpráva od Vendora:
              </strong>
              <p className="mt-1 text-amber-100 font-medium leading-relaxed font-sans text-xs">
                {dropData.burnerAlert}
              </p>
            </div>
          </motion.div>
        )}

        {/* Burn after reading notice */}
        {dropData.burnAfterReading && (
          <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-400 shrink-0" />
            <span className="font-mono text-[11px]">Jednorázová úschova — po vyzvednutí bude trvale zničena.</span>
          </div>
        )}

        {/* Top Header Bar */}
        <div className="flex items-center justify-between font-mono p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-xs font-bold text-emerald-400 tracking-wider">
              PIN: {pin}
            </span>
            <span className="text-[10px] text-zinc-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              {new Date(dropData.createdAt).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            type="button"
            onClick={handleReset}
            className="text-xs px-3 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
          >
            Zadat jiný PIN
          </motion.button>
        </div>

        {/* PAYMENT MODULE (Price, Amount & PaySafeCard 30-min countdown) */}
        <PaymentModule
          drop={dropData}
          onPaymentSuccess={(updated) => setDropData(updated)}
        />

        {/* INTERACTION: Mark as Collected / Not Found (Available once paid or if free) */}
        {!isLocationLocked && (
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-3.5 space-y-2.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              Potvrdit stav úschovy v terénu:
            </div>
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                disabled={isUpdatingStatus || dropData.status === 'COLLECTED'}
                onClick={() => handleUpdateStatus('COLLECTED')}
                className={`py-2.5 px-3 rounded-xl font-mono text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md ${
                  dropData.status === 'COLLECTED'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/60'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-zinc-950'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{dropData.status === 'COLLECTED' ? 'Vyzvednuto ✓' : 'Vyzvednuto'}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                disabled={isUpdatingStatus || dropData.status === 'NOT_FOUND'}
                onClick={() => handleUpdateStatus('NOT_FOUND')}
                className={`py-2.5 px-3 rounded-xl font-mono text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  dropData.status === 'NOT_FOUND'
                    ? 'bg-rose-950 text-rose-300 border border-rose-500/60'
                    : 'bg-zinc-800 hover:bg-rose-950/60 text-zinc-300 border border-zinc-700'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>{dropData.status === 'NOT_FOUND' ? 'Nenalezeno' : 'Nenalezeno'}</span>
              </motion.button>
            </div>
          </div>
        )}

        {/* GATED LOCATION: If locked, show security locked box; if unlocked, show full map & photos */}
        {isLocationLocked ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-6 text-center space-y-3 font-mono shadow-2xl relative overflow-hidden"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-950/80 to-zinc-900 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center shadow-lg border-glow-amber">
              <Lock className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <div className="text-sm font-bold text-zinc-100">Přesná poloha a fotografie jsou uzamčeny</div>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed font-sans">
                Přesné GPS souřadnice, interaktivní satelitní mapa a fotografie úkrytu se odemknou okamžitě po manuálním potvrzení PaySafeCard kódu vendorem.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-950 border border-zinc-800 text-[11px] text-amber-400 font-semibold shadow-inner">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Chráněno: lokace se uvolní po schválení</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Location Map */}
            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-3.5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-300 font-bold flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-emerald-400" />
                  Přesná lokace úschovy
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopyCoords}
                  className="flex items-center gap-1.5 text-[11px] text-zinc-300 hover:text-emerald-300 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 transition"
                  title="Kopírovat souřadnice"
                >
                  {copiedCoords ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{dropData.latitude.toFixed(5)}, {dropData.longitude.toFixed(5)}</span>
                </motion.button>
              </div>

              <div className="rounded-xl overflow-hidden border border-zinc-800 shadow-inner">
                <InteractiveMap
                  latitude={dropData.latitude}
                  longitude={dropData.longitude}
                  interactive={false}
                  className="h-64 sm:h-72 w-full"
                  zoom={17}
                />
              </div>

              {/* 1-Click External Navigation links */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${dropData.latitude},${dropData.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs font-mono transition shadow-md shadow-emerald-950/40"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Google Maps</span>
                </a>

                <a
                  href={`https://maps.apple.com/?daddr=${dropData.latitude},${dropData.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono border border-zinc-700 transition"
                >
                  <ExternalLink className="w-4 h-4 text-zinc-400" />
                  <span>Apple Maps</span>
                </a>
              </div>
            </div>

            {/* Description */}
            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-4 space-y-1.5 shadow-xl">
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Popis úkrytu</div>
              <p className="text-xs sm:text-sm text-zinc-100 whitespace-pre-wrap leading-relaxed font-sans">
                {dropData.description}
              </p>
            </div>

            {/* Photos Grid */}
            {dropData.photos && dropData.photos.length > 0 && (
              <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-4 space-y-2.5 shadow-xl">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  Fotodokumentace úkrytu ({dropData.photos.length})
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {dropData.photos.map((photo, index) => (
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      key={photo.id || index}
                      onClick={() => {
                        setSelectedPhotoIndex(index);
                        setIsLightboxOpen(true);
                      }}
                      className="aspect-square rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 cursor-pointer hover:border-emerald-500/50 transition relative group shadow-md"
                    >
                      <img src={photo.dataUrl} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-emerald-400 backdrop-blur-[2px]">
                        <Eye className="w-5 h-5" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* TIMELINE & LIFECYCLE HISTORY */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 shadow-xl">
          <TimelineView
            history={dropData.history || []}
            currentStatus={dropData.status}
          />
        </div>

        {/* Lightbox Modal */}
        {isLightboxOpen && dropData.photos && (
          <PhotoLightbox
            photos={dropData.photos}
            isOpen={isLightboxOpen}
            currentIndex={selectedPhotoIndex}
            onSelectIndex={(idx) => setSelectedPhotoIndex(idx)}
            onClose={() => setIsLightboxOpen(false)}
          />
        )}
      </motion.div>
    );
  }

  // PIN ENTRY FORM
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 350, damping: 26 }}
      className="max-w-md mx-auto py-8 px-4 space-y-6"
    >
      <div className="text-center space-y-1.5">
        <h2 className="text-xl font-bold text-zinc-100 font-mono tracking-tight flex items-center justify-center gap-2">
          <span>Vyzvednout dead drop</span>
        </h2>
        <p className="text-xs text-zinc-400 font-sans">
          Zadejte 6místný PIN kód pro dešifrování fyzické úschovy
        </p>
      </div>

      <motion.form
        animate={isShaking ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
        transition={{ duration: 0.4 }}
        onSubmit={(e) => {
          e.preventDefault();
          handleClaim();
        }}
        className="space-y-4"
      >
        {/* Main PIN Input Container */}
        <div className="relative group">
          <input
            ref={pinInputRef}
            type="text"
            maxLength={6}
            value={pin}
            onChange={(e) => {
              const val = e.target.value.toUpperCase();
              setPin(val);
              if (val.length === 6) {
                handleClaim(val);
              }
            }}
            placeholder="XXXXXX"
            className="w-full py-4 text-center text-3xl sm:text-4xl font-mono font-bold tracking-[0.4em] bg-zinc-900/90 border-2 border-zinc-800 group-hover:border-zinc-700 focus:border-emerald-500 rounded-2xl text-emerald-400 focus:outline-none transition-all uppercase shadow-2xl focus:border-glow-emerald"
          />
          <Key className="w-5 h-5 text-zinc-600 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* 1-Click Paste Shortcut Button */}
        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={handlePasteClipboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-emerald-300 border border-zinc-800 text-[11px] font-mono transition shadow-sm"
          >
            <ClipboardPaste className="w-3.5 h-3.5 text-emerald-400" />
            <span>Vložit kód ze schránky (1-klik)</span>
          </motion.button>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-3 rounded-xl bg-rose-950/90 border border-rose-800/80 text-rose-300 text-xs font-mono text-center shadow-lg"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={isLoading || pin.trim().length !== 6}
          className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-mono font-bold text-sm transition shadow-xl shadow-emerald-950/40 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none border-glow-emerald"
        >
          <span>Odemknout úschovu</span>
        </motion.button>
      </motion.form>

      {/* Trust badges */}
      <div className="pt-2 flex items-center justify-center gap-4 text-[11px] font-mono text-zinc-500">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/70" />
          Klientské šifrování
        </span>
        <span>•</span>
        <span>Rate-limit ochrana</span>
      </div>
    </motion.div>
  );
};
