import React, { useState } from 'react';
import { InteractiveMap } from './InteractiveMap';
import { VendorDashboard } from './VendorDashboard';
import { sanitizeAndCompressImage } from '../utils/imageSanitizer';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload,
  X,
  CheckCircle2,
  Copy,
  Flame,
  MapPin,
  Sparkles,
  LogOut,
  DollarSign,
  Package,
  AlertOctagon,
  ListFilter,
  Plus,
  Inbox,
  Link2,
  ArrowRight,
} from 'lucide-react';
import { CreateDropResponse, CustomerDropRequest } from '../types';
import { playSuccessSound, playClickSound } from '../utils/soundEffects';

interface VendorCreateProps {
  onLogoutAdmin?: () => void;
  onGoToCustomer?: (pin?: string) => void;
}

export const VendorCreate: React.FC<VendorCreateProps> = ({ onLogoutAdmin, onGoToCustomer }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');

  // Request linking
  const [linkedRequest, setLinkedRequest] = useState<CustomerDropRequest | null>(null);

  // Form states
  const [latitude, setLatitude] = useState<number>(50.087811);
  const [longitude, setLongitude] = useState<number>(14.42046);
  const [description, setDescription] = useState<string>('');
  const [photos, setPhotos] = useState<{ id: string; file: File; dataUrl: string; sizeBytes: number }[]>([]);
  const [burnAfterReading, setBurnAfterReading] = useState<boolean>(false);

  // Amount, Price, Currency, Burner Alert
  const [amount, setAmount] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [currency, setCurrency] = useState<'CZK' | 'EUR'>('CZK');
  const [burnerAlert, setBurnerAlert] = useState<string>('');

  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [createdResult, setCreatedResult] = useState<CreateDropResponse | null>(null);
  const [copiedPin, setCopiedPin] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Quick 1-click presets
  const amountPresets = ['1 ks', '2 ks', '5 ks', '10g', '50g'];
  const pricePresets = ['0', '300', '500', '1000', '2000'];

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
      playClickSound();
    } catch (err: any) {
      setImageError(err.message || 'Chyba fotky.');
    } finally {
      setIsProcessingImages(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    playClickSound();
  };

  // Called from VendorDashboard when user clicks "Vytvořit drop pro tuto žádost"
  const handleCreateForRequest = (req: CustomerDropRequest) => {
    setLinkedRequest(req);
    setLatitude(req.latitude);
    setLongitude(req.longitude);
    setAmount(req.amount);
    setPrice(String(req.price));
    setCurrency((req.currency as 'CZK' | 'EUR') || 'CZK');
    if (req.locationDescription || req.note) {
      setDescription(`Žádost ${req.requestCode}: ${req.locationDescription || ''} ${req.note ? `\nPoznámka: ${req.note}` : ''}`.trim());
    }
    setActiveTab('create');
    playClickSound();
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
    playClickSound();

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

      // If this drop was created for a customer request, mark request as FULFILLED!
      if (linkedRequest && data.pin) {
        try {
          await fetch(`/api/requests/${linkedRequest.id}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'FULFILLED',
              fulfilledDropPin: data.pin,
            }),
          });
        } catch (e) {
          console.error('Failed to link drop to request', e);
        }
      }

      setCreatedResult(data);
      playSuccessSound();
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
    playClickSound();
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleCopyLink = () => {
    if (!createdResult?.pin) return;
    const url = `${window.location.origin}/?pin=${createdResult.pin}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    playClickSound();
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleResetForm = () => {
    setDescription('');
    setPhotos([]);
    setBurnAfterReading(false);
    setAmount('');
    setPrice('');
    setBurnerAlert('');
    setLinkedRequest(null);
    setCreatedResult(null);
    setSubmitError(null);
    playClickSound();
  };

  // SUCCESS CONFIRMATION VIEW
  if (createdResult && createdResult.pin) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="max-w-xl mx-auto py-8 px-4 font-mono"
      >
        <div className="rounded-2xl border border-emerald-500/50 bg-zinc-900/90 p-5 space-y-4 shadow-2xl backdrop-blur-xl border-glow-emerald">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>Úschova byla bezpečně uložena na serveru</span>
          </div>

          {linkedRequest && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <Link2 className="w-4 h-4 text-emerald-400" />
              <span>Žádost {linkedRequest.requestCode} byla automaticky propojena s tímto PINem!</span>
            </div>
          )}

          <p className="text-zinc-400 text-xs leading-relaxed font-sans">
            Předat zákazníkovi 6místný kód. Platnost je 7 dní.
          </p>

          <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between shadow-inner">
            <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Kód zásilky (PIN):</div>
              <div className="text-2xl font-bold text-emerald-400 tracking-widest mt-0.5">
                {createdResult.pin}
              </div>
            </div>

            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={handleCopyPin}
                className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-700/80 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Copy className="w-4 h-4" />
                <span>{copiedPin ? 'Zkopírováno' : 'PIN'}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={handleCopyLink}
                className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>{copiedLink ? 'Zkopírováno' : 'Odkaz'}</span>
              </motion.button>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={handleResetForm}
              className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition"
            >
              + Vytvořit další úschovu
            </motion.button>

            {onGoToCustomer && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={() => onGoToCustomer(createdResult.pin)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <span>Otevřít jako zákazník</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-4 px-3 sm:px-4 space-y-4 font-mono text-xs">
      {/* Top action header: Tabs with motion spring pill and Logout */}
      <div className="flex items-center justify-between">
        <div className="relative flex items-center p-1 bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-inner">
          <button
            type="button"
            onClick={() => {
              setActiveTab('create');
              playClickSound();
            }}
            className={`relative z-10 flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition ${
              activeTab === 'create'
                ? 'text-emerald-300'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {activeTab === 'create' && (
              <motion.div
                layoutId="vendor-tab-pill"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                className="absolute inset-0 bg-zinc-800 border border-emerald-500/30 rounded-xl shadow-md"
              />
            )}
            <Plus className="w-3.5 h-3.5 relative z-10 text-emerald-400" />
            <span className="relative z-10">Nová úschova</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('list');
              playClickSound();
            }}
            className={`relative z-10 flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition ${
              activeTab === 'list'
                ? 'text-emerald-300'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {activeTab === 'list' && (
              <motion.div
                layoutId="vendor-tab-pill"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                className="absolute inset-0 bg-zinc-800 border border-emerald-500/30 rounded-xl shadow-md"
              />
            )}
            <ListFilter className="w-3.5 h-3.5 relative z-10 text-emerald-400" />
            <span className="relative z-10">Správa úschov a žádostí</span>
          </button>
        </div>

        {onLogoutAdmin && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={onLogoutAdmin}
            className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-rose-400 bg-zinc-900/80 px-3 py-2 rounded-xl border border-zinc-800 transition shadow-sm"
            title="Odhlásit z vendor administrace"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Odhlásit</span>
          </motion.button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* VIEW 1: CREATE DROP FORM */}
        {activeTab === 'create' ? (
          <motion.form
            key="vendor-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* Linked request alert */}
            {linkedRequest && (
              <div className="p-3.5 rounded-2xl bg-blue-950/70 border border-blue-500/60 text-blue-200 flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-blue-400" />
                  <span>Vytváříte drop pro žádost: <strong>{linkedRequest.requestCode}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => setLinkedRequest(null)}
                  className="text-[11px] text-zinc-400 hover:text-white"
                >
                  Zrušit vazbu
                </button>
              </div>
            )}

            {/* 1. Map Location */}
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-4 space-y-3 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-zinc-200 font-bold flex items-center gap-1.5 text-xs">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  1. Umístění úschovy na mapě
                </span>
                <span className="text-[11px] text-zinc-500">
                  {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </span>
              </div>

              <div className="rounded-xl overflow-hidden border border-zinc-800 shadow-inner">
                <InteractiveMap
                  latitude={latitude}
                  longitude={longitude}
                  onLocationChange={handleLocationChange}
                  interactive={true}
                  className="h-60 w-full"
                  zoom={16}
                />
              </div>
            </div>

            {/* 2. Amount and Price (PaySafeCard only) with 1-Click Presets */}
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-4 space-y-3 shadow-xl backdrop-blur-xl">
              <div className="text-zinc-200 font-bold text-xs">2. Zpoplatnění (PaySafeCard) & Množství</div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase text-zinc-400">Množství (volitelné)</label>
                  <div className="relative">
                    <Package className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="např. 1 ks, 50g"
                      className="w-full pl-8 pr-2.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-emerald-500 shadow-inner"
                    />
                  </div>
                  {/* Presets */}
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
                  <label className="block text-[10px] uppercase text-zinc-400">Cena (0 = zdarma)</label>
                  <div className="flex gap-1.5">
                    <div className="relative flex-1">
                      <DollarSign className="w-3.5 h-3.5 text-zinc-500 absolute left-2 top-2.5" />
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0"
                        className="w-full pl-7 pr-2 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-emerald-400 font-bold text-xs focus:outline-none focus:border-emerald-500 shadow-inner"
                      />
                    </div>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as 'CZK' | 'EUR')}
                      className="bg-zinc-950 border border-zinc-800 rounded-xl px-2 text-zinc-300 text-xs font-bold"
                    >
                      <option value="CZK">CZK</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                  {/* Presets */}
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
                        {preset === '0' ? 'Zdarma' : `${preset} Kč`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-zinc-500 font-sans">
                💡 Pokud je cena vyšší než 0, zákazník musí zadat kód PaySafeCard. Poloha se mu odemkne až po vašem manuálním potvrzení.
              </div>
            </div>

            {/* 3. Description */}
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-4 space-y-2 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-zinc-200 font-bold text-xs">3. Popis úkrytu</span>
                <span className="text-[10px] text-zinc-500">{description.length}/500</span>
              </div>
              <textarea
                rows={3}
                maxLength={500}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailní instrukce: např. Magnetická krabička zespodu šedé lavičky, cca 15 metrů od dubu."
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-emerald-500 resize-none shadow-inner font-sans"
                required
              />
            </div>

            {/* 4. Photos (EXIF stripped) */}
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-4 space-y-3 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-zinc-200 font-bold text-xs">4. Fotografie úkrytu ({photos.length}/3)</span>
                <span className="text-[10px] text-emerald-400 font-semibold">EXIF metadata se smažou</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {photos.map((photo) => (
                  <div key={photo.id} className="aspect-square rounded-xl overflow-hidden border border-zinc-800 relative group bg-zinc-950 shadow-md">
                    <img src={photo.dataUrl} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.id)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/75 hover:bg-rose-600 text-white transition shadow"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {photos.length < 3 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-zinc-800 hover:border-emerald-500/60 bg-zinc-950 flex flex-col items-center justify-center cursor-pointer transition text-zinc-500 hover:text-zinc-200 shadow-inner">
                    <Upload className="w-5 h-5 mb-1 text-emerald-400/80" />
                    <span className="text-[10px] font-semibold">Přidat foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={isProcessingImages}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {imageError && <div className="text-[11px] text-rose-400">{imageError}</div>}
            </div>

            {/* 5. Burner Alert (Nouzová zpráva) */}
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-4 space-y-2 shadow-xl backdrop-blur-xl">
              <div className="flex items-center gap-1.5 text-zinc-200 font-bold text-xs">
                <AlertOctagon className="w-4 h-4 text-amber-400" />
                <span>5. Nouzová zpráva / Burner Alert (volitelné)</span>
              </div>
              <input
                type="text"
                value={burnerAlert}
                onChange={(e) => setBurnerAlert(e.target.value)}
                placeholder="Např. Pozor na pohyb ostrahy, vyzvednout výhradně po 20:00 hod."
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-amber-500 shadow-inner font-sans"
              />
            </div>

            {/* 6. Burn After Reading */}
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-4 flex items-center justify-between shadow-xl backdrop-blur-xl">
              <div className="space-y-0.5">
                <span className="text-zinc-200 font-bold flex items-center gap-1.5 text-xs">
                  <Flame className="w-4 h-4 text-rose-400" />
                  Zničit po vyzvednutí (Burn After Reading)
                </span>
                <p className="text-[10px] text-zinc-500 font-sans">Úschova se po potvrzení vyzvednutí trvale smaže.</p>
              </div>
              <input
                type="checkbox"
                checked={burnAfterReading}
                onChange={(e) => setBurnAfterReading(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 text-emerald-500 focus:ring-0 bg-zinc-950 cursor-pointer"
              />
            </div>

            {submitError && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs font-mono">
                {submitError}
              </div>
            )}

            {/* Submit button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              type="submit"
              disabled={isSubmitting || isProcessingImages}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-sm transition shadow-xl shadow-emerald-950/40 flex items-center justify-center gap-2 disabled:opacity-50 border-glow-emerald"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Ukládám úschovu...' : 'Vytvořit a vygenerovat PIN'}</span>
            </motion.button>
          </motion.form>
        ) : (
          /* VIEW 2: VENDOR DASHBOARD (LIST OF DROPS & REQUESTS) */
          <motion.div
            key="vendor-list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          >
            <VendorDashboard
              onGoToCustomerWithPin={(pin) => {
                if (onGoToCustomer) onGoToCustomer(pin);
              }}
              onCreateDropForRequest={handleCreateForRequest}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
