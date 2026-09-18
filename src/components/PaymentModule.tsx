import React, { useState } from 'react';
import { CreditCard, Bitcoin, Copy, Check, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { DeadDrop } from '../types';

interface PaymentModuleProps {
  drop: DeadDrop;
  onPaymentSuccess: (updatedDrop: DeadDrop) => void;
}

export const PaymentModule: React.FC<PaymentModuleProps> = ({ drop, onPaymentSuccess }) => {
  const [method, setMethod] = useState<'CRYPTO' | 'PAYSAFECARD'>('CRYPTO');
  const [selectedCrypto, setSelectedCrypto] = useState<'BTC' | 'XMR' | 'USDT'>(drop.cryptoType || 'BTC');
  const [pscCode, setPscCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedAddr, setCopiedAddr] = useState(false);

  const price = drop.price || 0;
  const currency = drop.currency || 'CZK';

  // Format PaySafeCard PIN as 0000-0000-0000-0000
  const handlePscChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const parts = raw.match(/.{1,4}/g);
    setPscCode(parts ? parts.join('-') : raw);
  };

  const handlePayPsc = async () => {
    setError(null);
    const cleaned = pscCode.replace(/-/g, '');
    if (cleaned.length !== 16) {
      setError('Zadejte kompletní 16místný PaySafeCard PIN kód.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/drops/${drop.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'PAYSAFECARD', pscCode: cleaned }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Platba nebyla přijata.');
      }
      onPaymentSuccess(data.drop);
    } catch (err: any) {
      setError(err.message || 'Chyba při zpracování PaySafeCard.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayCrypto = async () => {
    setError(null);
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/drops/${drop.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'CRYPTO', cryptoType: selectedCrypto }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Chyba při ověření platby.');
      }
      onPaymentSuccess(data.drop);
    } catch (err: any) {
      setError(err.message || 'Nepodařilo se ověřit krypto transakci.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyAddress = () => {
    if (!drop.cryptoAddress) return;
    navigator.clipboard.writeText(drop.cryptoAddress);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  // Approximate crypto conversion for preview
  const approxBtc = (price / 2200000).toFixed(6);
  const approxXmr = (price / 3800).toFixed(4);
  const approxUsdt = (price / 24).toFixed(1);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 space-y-3.5">
      {/* Pricing Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
        <div>
          <div className="text-[10px] font-mono uppercase text-zinc-500">Cena za vyzvednutí</div>
          <div className="text-lg font-mono font-bold text-emerald-400">
            {price > 0 ? `${price} ${currency}` : 'Zdarma / Předplaceno'}
          </div>
        </div>

        {drop.amount && (
          <div className="text-right">
            <div className="text-[10px] font-mono uppercase text-zinc-500">Množství</div>
            <div className="text-xs font-mono text-zinc-200 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
              {drop.amount}
            </div>
          </div>
        )}
      </div>

      {/* If already paid */}
      {drop.isPaid ? (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Platba byla úspěšně uhrazena ({drop.paymentMethod || 'Uhrazeno'}). Úschova je uvolněna.</span>
        </div>
      ) : (
        /* If unpaid: payment options */
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono">
            <button
              type="button"
              onClick={() => setMethod('CRYPTO')}
              className={`flex-1 py-1.5 px-3 rounded flex items-center justify-center gap-1.5 transition ${
                method === 'CRYPTO'
                  ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Bitcoin className="w-3.5 h-3.5 text-amber-400" />
              <span>Kryptoměna</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod('PAYSAFECARD')}
              className={`flex-1 py-1.5 px-3 rounded flex items-center justify-center gap-1.5 transition ${
                method === 'PAYSAFECARD'
                  ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 text-blue-400" />
              <span>PaySafeCard</span>
            </button>
          </div>

          {method === 'CRYPTO' && (
            <div className="space-y-2.5 text-xs font-mono animate-in fade-in duration-150">
              {/* Crypto selector */}
              <div className="flex items-center gap-2">
                {(['BTC', 'XMR', 'USDT'] as const).map((coin) => (
                  <button
                    key={coin}
                    type="button"
                    onClick={() => setSelectedCrypto(coin)}
                    className={`px-2.5 py-1 rounded text-xs transition border ${
                      selectedCrypto === coin
                        ? 'border-amber-500/70 bg-amber-950/40 text-amber-300 font-bold'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {coin}
                  </button>
                ))}
              </div>

              {/* Amount preview */}
              <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/80 space-y-1">
                <div className="text-[11px] text-zinc-400 flex justify-between">
                  <span>K úhradě:</span>
                  <span className="text-zinc-100 font-bold">
                    {selectedCrypto === 'BTC' ? `${approxBtc} BTC` : selectedCrypto === 'XMR' ? `${approxXmr} XMR` : `${approxUsdt} USDT`}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-500">
                  Adresa peněženky:
                </div>
                <div className="flex items-center gap-1 bg-zinc-900 px-2 py-1.5 rounded text-[11px] text-zinc-300 overflow-x-auto">
                  <span className="truncate">{drop.cryptoAddress || 'bc1q9v8k7x4z2m3n5p1r0t9w8y7'}</span>
                  <button
                    type="button"
                    onClick={handleCopyAddress}
                    className="p-1 text-zinc-400 hover:text-zinc-100 transition shrink-0"
                    title="Kopírovat adresu"
                  >
                    {copiedAddr ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePayCrypto}
                disabled={isProcessing}
                className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Potvrdit odeslání platby</span>
              </button>
            </div>
          )}

          {method === 'PAYSAFECARD' && (
            <div className="space-y-2.5 text-xs font-mono animate-in fade-in duration-150">
              <div>
                <label className="block text-[10px] text-zinc-400 mb-1">
                  Zadejte 16místný PaySafeCard PIN:
                </label>
                <input
                  type="text"
                  maxLength={19}
                  value={pscCode}
                  onChange={handlePscChange}
                  placeholder="0000-0000-0000-0000"
                  className="w-full px-3 py-2 text-center text-sm font-mono tracking-widest bg-zinc-950 border border-zinc-800 rounded-lg text-blue-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={handlePayPsc}
                disabled={isProcessing || pscCode.replace(/-/g, '').length !== 16}
                className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-zinc-100 font-bold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                <span>Zaplatit přes PaySafeCard</span>
              </button>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-300 text-[11px] font-mono">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
