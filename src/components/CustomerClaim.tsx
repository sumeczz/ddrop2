import React, { useState, useEffect, useRef } from 'react';
import { InteractiveMap } from './InteractiveMap';
import { PhotoLightbox } from './PhotoLightbox';
import { TimelineView } from './TimelineView';
import { PaymentModule } from './PaymentModule';
import { Key, Navigation, ExternalLink, Flame, Copy, Check, Eye, AlertOctagon, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { ClaimDropResponse, DeadDrop, DropStatus } from '../types';

interface CustomerClaimProps {
  initialPin?: string;
  onClearInitialPin?: () => void;
}

export const CustomerClaim: React.FC<CustomerClaimProps> = ({ initialPin = '', onClearInitialPin }) => {
  const [pin, setPin] = useState<string>(initialPin.toUpperCase());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dropData, setDropData] = useState<DeadDrop | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

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
      pinInputRef.current?.focus();
      return;
    }

    setIsLoading(true);

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
    } catch (err: any) {
      setError(err.message || 'Chyba při ověření.');
      setTimeout(() => {
        pinInputRef.current?.focus();
      }, 50);
    } finally {
      setIsLoading(false);
    }
  };

  // Status transition handler (COLLECTED or NOT_FOUND)
  const handleUpdateStatus = async (newStatus: 'COLLECTED' | 'NOT_FOUND') => {
    if (!dropData) return;
    setIsUpdatingStatus(true);
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
    } catch (err: any) {
      alert(err.message || 'Nepodařilo se změnit stav úschovy.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCopyCoords = () => {
    if (!dropData) return;
    const text = `${dropData.latitude.toFixed(6)}, ${dropData.longitude.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const handleOpenGoogleMaps = () => {
    if (!dropData) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${dropData.latitude},${dropData.longitude}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenAppleMaps = () => {
    if (!dropData) return;
    const url = `https://maps.apple.com/?daddr=${dropData.latitude},${dropData.longitude}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleReset = () => {
    setDropData(null);
    setPin('');
    setError(null);
    if (onClearInitialPin) onClearInitialPin();
  };

  // SKELETON LOADER VIEW
  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto py-6 px-4 space-y-4 animate-in fade-in duration-150">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-5 w-32 bg-zinc-800/80 rounded animate-pulse"></div>
            <div className="h-3 w-24 bg-zinc-900 rounded animate-pulse"></div>
          </div>
          <div className="h-7 w-20 bg-zinc-800/60 rounded-lg animate-pulse"></div>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3 space-y-3">
          <div className="h-64 sm:h-72 w-full bg-zinc-950/80 rounded-lg border border-zinc-800/60 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin"></div>
            <span className="text-[11px] font-mono text-zinc-500">Ověřuji PIN, kontroluji platbu a mapu...</span>
          </div>
        </div>
      </div>
    );
  }

  // DROP DETAIL VIEW
  if (dropData) {
    return (
      <div className="max-w-xl mx-auto py-4 px-3 sm:px-4 space-y-4 animate-in fade-in duration-200">
        {/* BURNER ALERT (Nouzová zpráva) */}
        {dropData.burnerAlert && (
          <div className="p-3 rounded-xl bg-amber-950/90 border-2 border-amber-500/80 text-amber-100 text-xs flex items-start gap-2.5 shadow-lg shadow-amber-950/50 animate-pulse">
            <AlertOctagon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300 font-mono uppercase tracking-wider block">
                Nouzová zpráva od Vendora:
              </strong>
              <p className="mt-0.5 text-amber-100 font-medium leading-relaxed">
                {dropData.burnerAlert}
              </p>
            </div>
          </div>
        )}

        {/* Burn after reading notice */}
        {dropData.burnAfterReading && (
          <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-400 shrink-0" />
            <span>Jednorázová úschova — po vyzvednutí bude trvale zničena.</span>
          </div>
        )}

        {/* Top Header Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-emerald-400">PIN: {pin}</span>
            <span className="text-[10px] font-mono text-zinc-500">
              {new Date(dropData.createdAt).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}
            </span>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-mono px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition"
          >
            Zadat jiný PIN
          </button>
        </div>

        {/* PAYMENT MODULE (Price, Amount & Crypto / PaySafeCard) */}
        <PaymentModule
          drop={dropData}
          onPaymentSuccess={(updated) => setDropData(updated)}
        />

        {/* INTERACTION: Mark as Collected / Not Found */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 space-y-2">
          <div className="text-[11px] font-mono uppercase text-zinc-400">Stav úschovy:</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isUpdatingStatus || dropData.status === 'COLLECTED'}
              onClick={() => handleUpdateStatus('COLLECTED')}
              className={`py-2 px-3 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                dropData.status === 'COLLECTED'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-zinc-950 shadow-md'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{dropData.status === 'COLLECTED' ? 'Vyzvednuto ✓' : 'Potvrdit vyzvednutí'}</span>
            </button>

            <button
              type="button"
              disabled={isUpdatingStatus || dropData.status === 'NOT_FOUND'}
              onClick={() => handleUpdateStatus('NOT_FOUND')}
              className={`py-2 px-3 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                dropData.status === 'NOT_FOUND'
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-500/50'
                  : 'bg-zinc-800 hover:bg-rose-900/60 text-zinc-300 border border-zinc-700'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>{dropData.status === 'NOT_FOUND' ? 'Hlášeno: Nenalezeno' : 'Úschova nenalezena'}</span>
            </button>
          </div>
        </div>

        {/* Location Map */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-emerald-400" />
              Lokace
            </span>
            <button
              onClick={handleCopyCoords}
              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800"
            >
              {copiedCoords ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{dropData.latitude.toFixed(5)}, {dropData.longitude.toFixed(5)}</span>
            </button>
          </div>

          <InteractiveMap
            latitude={dropData.latitude}
            longitude={dropData.longitude}
            interactive={false}
            className="h-64 sm:h-72 w-full"
            zoom={17}
          />

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleOpenGoogleMaps}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs font-mono transition"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Google Maps</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAppleMaps}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono border border-zinc-700 transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
              <span>Apple Maps</span>
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 space-y-1">
          <div className="text-[11px] font-mono uppercase text-zinc-500">Popis úkrytu</div>
          <p className="text-xs sm:text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
            {dropData.description}
          </p>
        </div>

        {/* Photos Grid */}
        {dropData.photos && dropData.photos.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-mono text-zinc-500">Fotografie ({dropData.photos.length})</div>
            <div className="grid grid-cols-3 gap-2">
              {dropData.photos.map((photo, index) => (
                <div
                  key={photo.id || index}
                  onClick={() => {
                    setSelectedPhotoIndex(index);
                    setIsLightboxOpen(true);
                  }}
                  className="aspect-square rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 cursor-pointer hover:border-emerald-500/50 transition relative group"
                >
                  <img src={photo.dataUrl} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TIMELINE & LIFECYCLE HISTORY */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
          <TimelineView
            history={dropData.history || []}
            currentStatus={dropData.status || 'VIEWED'}
          />
        </div>

        <PhotoLightbox
          photos={dropData.photos}
          currentIndex={selectedPhotoIndex}
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          onSelectIndex={(idx) => setSelectedPhotoIndex(idx)}
        />
      </div>
    );
  }

  // DEFAULT VIEW: MINIMAL PIN KEYPAD ENTRY
  return (
    <div className="max-w-sm mx-auto py-10 px-4 animate-in fade-in duration-200">
      <div className="text-center mb-5">
        <div className="w-10 h-10 mx-auto rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 mb-2.5">
          <Key className="w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Odemknout úschovu</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Zadejte 6místný kód</p>
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4 shadow-xl">
        <div>
          <input
            ref={pinInputRef}
            id="customer-pin-input"
            type="text"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && pin.trim().length === 6) {
                handleClaim();
              }
            }}
            placeholder="KÓD"
            autoFocus
            className="w-full text-center font-mono text-2xl sm:text-3xl font-bold tracking-[0.25em] py-3 px-3 rounded-lg bg-zinc-950 border border-zinc-800 text-emerald-400 placeholder:text-zinc-800 focus:outline-none focus:border-emerald-500 uppercase transition"
          />
        </div>

        {error && (
          <div className="p-2 rounded-lg bg-rose-950/70 border border-rose-800/80 text-rose-300 text-xs font-mono text-center">
            {error}
          </div>
        )}

        <button
          id="unlock-pin-btn"
          type="button"
          onClick={() => handleClaim()}
          disabled={pin.trim().length !== 6}
          className="w-full py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs font-mono uppercase tracking-wider transition disabled:opacity-40"
        >
          Odemknout
        </button>
      </div>
    </div>
  );
};
