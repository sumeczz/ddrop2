import React, { useState, useEffect, useRef } from 'react';
import { CreditCard, ShieldCheck, RefreshCw, AlertCircle, Clock, XCircle, CheckCircle, ClipboardPaste, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DeadDrop } from '../types';
import { playSuccessSound, playRejectSound, playClickSound } from '../utils/soundEffects';
import { SystemNotifications } from '../services/systemNotifications';

interface PaymentModuleProps {
  drop: DeadDrop;
  onPaymentSuccess: (updatedDrop: DeadDrop) => void;
  onRefreshDrop?: () => void;
}

export const PaymentModule: React.FC<PaymentModuleProps> = ({
  drop,
  onPaymentSuccess,
  onRefreshDrop,
}) => {
  const [pscCode, setPscCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeftSec, setTimeLeftSec] = useState<number>(0);

  const price = drop.price || 0;
  const currency = drop.currency || 'CZK';
  const paymentStatus = drop.paymentStatus || (drop.isPaid ? 'CONFIRMED' : 'UNPAID');

  // Format PaySafeCard PIN as 0000-0000-0000-0000
  const handlePscChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const parts = raw.match(/.{1,4}/g);
    setPscCode(parts ? parts.join('-') : raw);
  };

  // 1-Click Paste from clipboard
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
      // Fallback
    }
  };

  const warnedRef = useRef(false);

  // 30-min countdown timer effect
  useEffect(() => {
    if (paymentStatus === 'PENDING_CONFIRMATION' && drop.pscExpiresAt) {
      const updateTimer = () => {
        const remaining = Math.max(0, Math.floor((drop.pscExpiresAt! - Date.now()) / 1000));
        setTimeLeftSec(remaining);

        // 5-minute remaining warning system notification
        if (remaining <= 300 && remaining > 290 && !warnedRef.current) {
          warnedRef.current = true;
          SystemNotifications.timerWarning(5);
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [paymentStatus, drop.pscExpiresAt]);

  // Polling to detect vendor confirmation while waiting
  useEffect(() => {
    if (paymentStatus === 'PENDING_CONFIRMATION') {
      const pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`/api/drops/${drop.id}`);
          if (res.ok) {
            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              const data = await res.json();
              if (data.success && data.drop) {
                if (data.drop.isPaid || data.drop.paymentStatus === 'CONFIRMED') {
                  playSuccessSound();
                  SystemNotifications.paymentConfirmed(data.drop.amount);
                  onPaymentSuccess(data.drop);
                  clearInterval(pollInterval);
                } else if (data.drop.paymentStatus === 'REJECTED') {
                  playRejectSound();
                  SystemNotifications.paymentRejected();
                  onPaymentSuccess(data.drop);
                  clearInterval(pollInterval);
                }
              }
            }
          }
        } catch (e) {
          // Silent polling error
        }
      }, 3000);

      return () => clearInterval(pollInterval);
    }
  }, [paymentStatus, drop.id, onPaymentSuccess]);

  if (price <= 0) {
    return null;
  }

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Submit PaySafeCard for vendor verification
  const handleSubmitPsc = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = pscCode.replace(/\D/g, '');
    if (cleanCode.length !== 16) {
      setError('Kód PaySafeCard musí obsahovat přesně 16 číslic.');
      playRejectSound();
      return;
    }

    setIsSubmitting(true);
    playClickSound();

    try {
      const res = await fetch(`/api/drops/${drop.id}/pay-psc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pscCode: cleanCode }),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = null;
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || `Chyba komunikace se serverem (${res.status})`);
      }

      if (!res.ok || !data.success || !data.drop) {
        throw new Error(data?.error || 'Nepodařilo se odeslat PaySafeCard kód.');
      }

      playClickSound();
      onPaymentSuccess(data.drop);
    } catch (err: any) {
      setError(err.message || 'Chyba při odesílání platby.');
      playRejectSound();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel pending order
  const handleCancelOrder = async () => {
    setIsCancelling(true);
    playClickSound();
    try {
      const res = await fetch(`/api/drops/${drop.id}/pay-psc/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const contentType = res.headers.get('content-type') || '';
      let data: any = null;
      if (contentType.includes('application/json')) {
        data = await res.json();
      }
      if (data && data.success && data.drop) {
        onPaymentSuccess(data.drop);
      }
    } catch (e) {
      // Error
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      className="rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-4 font-mono text-xs space-y-3.5 shadow-2xl relative overflow-hidden backdrop-blur-xl"
    >
      {/* Top Header: Price and Amount Tag */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-950/80 border border-blue-500/40 text-blue-400">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <span className="text-zinc-200 font-bold block">Platba za úschovu</span>
            <span className="text-[10px] text-zinc-500">PaySafeCard (16místný kupon)</span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-base font-bold text-emerald-400">
            {price} {currency}
          </div>
          {drop.amount && (
            <div className="text-[10px] text-zinc-400">
              Množství: <strong className="text-zinc-300">{drop.amount}</strong>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* STATE 1: ALREADY CONFIRMED */}
        {paymentStatus === 'CONFIRMED' ? (
          <motion.div
            key="confirmed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 flex items-center justify-between border-glow-emerald"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Platba PaySafeCard byla vendorem potvrzena. Lokace je odemčena.</span>
            </div>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </motion.div>
        ) : paymentStatus === 'PENDING_CONFIRMATION' ? (
          /* STATE 2: PENDING VENDOR CONFIRMATION (30-MIN TIMER RUNNING) */
          <motion.div
            key="pending"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-4 rounded-xl bg-gradient-to-br from-amber-950/70 to-zinc-950 border border-amber-500/60 space-y-3 shadow-xl border-glow-amber"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>Čeká na schválení vendorem</span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-amber-500/40 text-amber-300 font-bold text-sm tracking-wider">
                {formatTimer(timeLeftSec)}
              </div>
            </div>

            {/* Visual timer progress bar */}
            <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-zinc-800">
              <motion.div
                className="bg-amber-400 h-full rounded-full"
                initial={{ width: '100%' }}
                animate={{ width: `${Math.max(0, Math.min(100, (timeLeftSec / 1800) * 100))}%` }}
                transition={{ duration: 1, ease: 'linear' }}
              />
            </div>

            <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
              Kód byl odeslán. Vendor manuálně ověří platnost kuponu na PaySafeCard účtu (časový limit 30 min). 
              Jakmile potvrdí, <strong className="text-amber-200">přesná poloha a fotky se okamžitě samy odemknou</strong>.
            </p>

            <div className="pt-1 flex items-center justify-between">
              <div className="text-[10px] text-zinc-500">
                Předaný kód: <span className="text-zinc-400 font-bold">{drop.pscCode || (drop as any).submittedPscCode || '••••-••••-••••-••••'}</span>
              </div>

              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                type="button"
                disabled={isCancelling}
                onClick={handleCancelOrder}
                className="py-1 px-2.5 rounded-lg bg-zinc-900 hover:bg-rose-950/80 text-zinc-400 hover:text-rose-300 border border-zinc-800 hover:border-rose-700/60 text-[10px] font-bold transition flex items-center gap-1"
              >
                <XCircle className="w-3 h-3" />
                <span>{isCancelling ? 'Ruším...' : 'Zrušit objednávku'}</span>
              </motion.button>
            </div>
          </motion.div>
        ) : (
          /* STATE 3: UNPAID OR REJECTED (INPUT PSC CODE) */
          <motion.div
            key="unpaid"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-3"
          >
            {paymentStatus === 'REJECTED' && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Předchozí kód byl vendorem zamítnut jako neplatný. Zadejte prosím nový kód.</span>
              </div>
            )}

            <form onSubmit={handleSubmitPsc} className="space-y-2.5">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>Zadejte 16místný PaySafeCard kód:</span>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={handlePastePsc}
                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                >
                  <ClipboardPaste className="w-3 h-3" />
                  <span>Vložit (1-klik)</span>
                </motion.button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  maxLength={19}
                  value={pscCode}
                  onChange={handlePscChange}
                  placeholder="0000-0000-0000-0000"
                  className="w-full py-2.5 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-center text-sm font-bold tracking-widest text-emerald-400 focus:outline-none focus:border-emerald-500 transition shadow-inner"
                />
              </div>

              {error && (
                <div className="text-[11px] text-rose-400 font-sans">{error}</div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                type="submit"
                disabled={isSubmitting || pscCode.replace(/\D/g, '').length !== 16}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs transition shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Odesílám kód...</span>
                  </>
                ) : (
                  <>
                    <span>Odeslat PaySafeCard k ověření</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </motion.button>
            </form>

            <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-[10px] text-zinc-400 space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-300 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Bezpečnostní postup:</span>
              </div>
              <p className="font-sans leading-relaxed text-zinc-400">
                Po odeslání kódu začne běžet 30minutový časovač na potvrzení. Přesná poloha a fotky se uvolní okamžitě po schválení vendorem.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
