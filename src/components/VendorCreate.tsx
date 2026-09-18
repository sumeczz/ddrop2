import React, { useState } from 'react';
import { InteractiveMap } from './InteractiveMap';
import { VendorDashboard } from './VendorDashboard';
import { sanitizeAndCompressImage } from '../utils/imageSanitizer';
import { Upload, X, CheckCircle2, Copy, Flame, MapPin, Sparkles, LogOut, DollarSign, Package, AlertOctagon, ListFilter, Plus } from 'lucide-react';
import { CreateDropResponse } from '../types';

interface VendorCreateProps {
  onLogoutAdmin?: () => void;
  onGoToCustomer?: (pin?: string) => void;
}

export const VendorCreate: React.FC<VendorCreateProps> = ({ onLogoutAdmin, onGoToCustomer }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');

  // Form states
  const [latitude, setLatitude] = useState<number>(50.087811);
  const [longitude, setLongitude] = useState<number>(14.42046);
  const [description, setDescription] = useState<string>('');
  const [photos, setPhotos] = useState<{ id: string; file: File; dataUrl: string; sizeBytes: number }[]>([]);
  const [burnAfterReading, setBurnAfterReading] = useState<boolean>(false);

  // New features: Amount, Price, Currency, Crypto, Burner Alert
  const [amount, setAmount] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [currency, setCurrency] = useState<'CZK' | 'EUR'>('CZK');
  const [cryptoType, setCryptoType] = useState<'BTC' | 'XMR' | 'USDT'>('BTC');
  const [burnerAlert, setBurnerAlert] = useState<string>('');

  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [createdResult, setCreatedResult] = useState<CreateDropResponse | null>(null);
  const [copiedPin, setCopiedPin] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleLocationChange = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setImageError(null);
    const availableSlots = 3 - photos.length;
    if (availableSlots <= 0) {
      setImageError('Max 3 fotky.');
      return;
    }

    const filesToProcess = Array.from(files).slice(0, availableSlots);
    setIsProcessingImages(true);

    try {
      const sanitizedBatch = await Promise.all(
        filesToProcess.map(async (file) => {
          const sanitized = await sanitizeAndCompressImage(file);
          return {
            id: `p-${Math.random().toString(36).substring(2, 8)}`,
            file,
            dataUrl: sanitized.dataUrl,
            sizeBytes: sanitized.sizeBytes,
          };
        })
      );
      setPhotos((prev) => [...prev, ...sanitizedBatch]);
    } catch (err: any) {
      setImageError(err.message || 'Chyba fotky.');
    } finally {
      setIsProcessingImages(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!description.trim()) {
      setSubmitError('Zadejte popis úschovy.');
      return;
    }

    if (photos.length === 0) {
      setSubmitError('Nahrajte alespoň 1 fotografii (max 3).');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        description: description.trim(),
        latitude,
        longitude,
        photos: photos.map((p) => ({ dataUrl: p.dataUrl, sizeBytes: p.sizeBytes })),
        burnAfterReading,
        amount: amount.trim() || undefined,
        price: price ? Number(price) : undefined,
        currency,
        cryptoType,
        burnerAlert: burnerAlert.trim() || undefined,
      };

      const res = await fetch('/api/drops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as CreateDropResponse;

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Chyba při ukládání.');
      }

      setCreatedResult(data);
    } catch (err: any) {
      setSubmitError(err.message || 'Nepodařilo se vytvořit úschovu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPin = () => {
    if (!createdResult?.pin) return;
    navigator.clipboard.writeText(createdResult.pin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleCopyLink = () => {
    if (!createdResult?.pin) return;
    const url = `${window.location.origin}/?pin=${createdResult.pin}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleResetForm = () => {
    setDescription('');
    setPhotos([]);
    setBurnAfterReading(false);
    setAmount('');
    setPrice('');
    setBurnerAlert('');
    setCreatedResult(null);
    setSubmitError(null);
  };

  // SUCCESS CONFIRMATION VIEW
  if (createdResult && createdResult.pin) {
    return (
      <div className="max-w-md mx-auto py-8 px-4 animate-in fade-in duration-200 text-center">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="w-10 h-10 mx-auto rounded-full bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>

          <div>
            <h2 className="text-base font-bold text-zinc-100">Úschova vytvořena</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Předejte zákazníkovi PIN kód:</p>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
            <div className="font-mono text-3xl font-bold tracking-[0.25em] text-emerald-400 select-all">
              {createdResult.pin}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopyPin}
              className="py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono font-medium transition flex items-center justify-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5 text-zinc-400" />
              <span>{copiedPin ? 'Zkopírováno' : 'Kopírovat PIN'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono font-medium transition flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{copiedLink ? 'Zkopírováno' : 'Kopírovat link'}</span>
            </button>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => onGoToCustomer && onGoToCustomer(createdResult.pin)}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs font-mono transition"
            >
              Vyzkoušet z pohledu zákazníka
            </button>

            <button
              type="button"
              onClick={handleResetForm}
              className="w-full py-1.5 text-xs text-zinc-400 hover:text-zinc-200 font-mono transition"
            >
              + Další úschova
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-3 px-3 sm:px-4 space-y-4">
      {/* Top Header Bar with Logout */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase">Vendor Panel</span>
        </div>

        {onLogoutAdmin && (
          <button
            type="button"
            onClick={onLogoutAdmin}
            className="flex items-center gap-1 text-[11px] font-mono text-zinc-500 hover:text-rose-400 px-2 py-1 rounded hover:bg-zinc-900 transition"
          >
            <LogOut className="w-3 h-3" />
            <span>Odhlásit</span>
          </button>
        )}
      </div>

      {/* Sub-tabs: Create vs List/History */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono">
        <button
          type="button"
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-1.5 px-3 rounded flex items-center justify-center gap-1.5 transition ${
            activeTab === 'create'
              ? 'bg-zinc-800 text-zinc-100 font-bold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Vytvořit úschovu</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('list')}
          className={`flex-1 py-1.5 px-3 rounded flex items-center justify-center gap-1.5 transition ${
            activeTab === 'list'
              ? 'bg-zinc-800 text-zinc-100 font-bold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ListFilter className="w-3.5 h-3.5" />
          <span>Seznam & Historie</span>
        </button>
      </div>

      {/* VIEW: DASHBOARD / HISTORY */}
      {activeTab === 'list' && (
        <VendorDashboard
          onGoToCustomerWithPin={(pin) => onGoToCustomer && onGoToCustomer(pin)}
        />
      )}

      {/* VIEW: CREATE FORM */}
      {activeTab === 'create' && (
        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-150">
          {/* Map */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                1. Vyberte polohu na mapě
              </span>
              <span className="text-zinc-500 text-[11px]">
                {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </span>
            </div>

            <InteractiveMap
              latitude={latitude}
              longitude={longitude}
              onLocationChange={handleLocationChange}
              interactive={true}
              className="h-60 sm:h-64 w-full"
            />
          </div>

          {/* Amount & Price */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 space-y-3">
            <div className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>2. Množství a Cena (volitelné)</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 mb-1">Množství / Obsah</label>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="např. 1 ks, 50g, balení"
                  className="w-full p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-500 mb-1">Cena k úhradě</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0 = zdarma"
                    className="w-full p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                    className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:outline-none"
                  >
                    <option value="CZK">CZK</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
            </div>

            {price && Number(price) > 0 && (
              <div className="pt-1">
                <label className="block text-[10px] font-mono text-zinc-500 mb-1">Preferovaná kryptoměna pro zákazníka</label>
                <div className="flex gap-2">
                  {(['BTC', 'XMR', 'USDT'] as const).map((coin) => (
                    <button
                      key={coin}
                      type="button"
                      onClick={() => setCryptoType(coin)}
                      className={`flex-1 py-1.5 rounded text-xs font-mono border transition ${
                        cryptoType === coin
                          ? 'border-emerald-500/70 bg-emerald-950/40 text-emerald-300 font-bold'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400'
                      }`}
                    >
                      {coin}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>3. Popis úkrytu</span>
              <span className="text-zinc-500 text-[11px]">{description.length}/500</span>
            </div>
            <textarea
              rows={3}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kde přesně se úschova nachází..."
              className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 resize-none transition"
            />
          </div>

          {/* Photos */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>4. Fotografie ({photos.length}/3)</span>
              <span className="text-[10px] text-zinc-500">EXIF se automaticky smaže</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo) => (
                <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950">
                  <img src={photo.dataUrl} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(photo.id)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/70 hover:bg-rose-950 text-zinc-200 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {photos.length < 3 && (
                <label className="aspect-square rounded-lg border border-dashed border-zinc-700 hover:border-emerald-500 flex flex-col items-center justify-center cursor-pointer bg-zinc-950/60 transition">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    disabled={isProcessingImages}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Upload className="w-4 h-4 text-zinc-500 mb-1" />
                  <span className="text-[10px] font-mono text-zinc-500">
                    {isProcessingImages ? 'Čistím...' : '+ Foto'}
                  </span>
                </label>
              )}
            </div>
            {imageError && <p className="text-[11px] text-rose-400 font-mono">{imageError}</p>}
          </div>

          {/* Burner Alert (Nouzová zpráva) */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400">
              <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
              <span>5. Jednorázový signál / Nouzová zpráva (Burner Alert)</span>
            </div>
            <input
              type="text"
              maxLength={150}
              value={burnerAlert}
              onChange={(e) => setBurnerAlert(e.target.value)}
              placeholder="Volitelné varování pro zákazníka (např. Zvýšený pohyb osob v okolí)..."
              className="w-full p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-amber-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Burn after reading */}
          <div className="flex items-center gap-2 px-1">
            <input
              id="vendor-burn-cb"
              type="checkbox"
              checked={burnAfterReading}
              onChange={(e) => setBurnAfterReading(e.target.checked)}
              className="h-3.5 w-3.5 rounded bg-zinc-950 border-zinc-700 text-red-500"
            />
            <label htmlFor="vendor-burn-cb" className="text-xs text-zinc-400 flex items-center gap-1 cursor-pointer">
              <Flame className="w-3 h-3 text-red-500" />
              <span>Smazat po vyzvednutí (Burn on collection)</span>
            </label>
          </div>

          {submitError && (
            <div className="p-2 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-300 text-xs font-mono">
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || isProcessingImages}
            className="w-full py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs font-mono uppercase tracking-wider transition disabled:opacity-40"
          >
            {isSubmitting ? 'Ukládám...' : 'Vytvořit a získat PIN'}
          </button>
        </form>
      )}
    </div>
  );
};
