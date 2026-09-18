import React from 'react';
import { X, ShieldCheck, EyeOff, Trash2, KeyRound, MapPinOff } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-zinc-100">Bezpečnost a Ochrana Soukromí</h3>
          </div>
          <button
            id="close-privacy-modal-btn"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-zinc-300">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-emerald-400 shrink-0">
              <MapPinOff className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-zinc-100">Odstranění EXIF metadat</h4>
              <p className="text-zinc-400 text-xs mt-0.5">
                Všechny nahrané fotografie jsou v prohlížeči před odesláním překresleny na HTML5 Canvas. GPS souřadnice fotoaparátu, datum pořízení i model telefonu jsou zničeny ještě před odesláním na server.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-amber-400 shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-zinc-100">Kryptografický Hash PINu</h4>
              <p className="text-zinc-400 text-xs mt-0.5">
                Samotný 6místný PIN není na serveru ukládán v čitelné podobě. Ukládá se pouze jeho SHA-256 hash s ochranou proti pokusům o prolomení hrubou silou (Rate Limiting).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-blue-400 shrink-0">
              <EyeOff className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-zinc-100">Žádné Účty ani Sledování</h4>
              <p className="text-zinc-400 text-xs mt-0.5">
                Aplikace nevyžaduje registraci, e-mail ani žádné osobní údaje. Nejsou používány žádné analytické sledovací cookies.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-rose-400 shrink-0">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-zinc-100">Automatická Expirace & Burn on Read</h4>
              <p className="text-zinc-400 text-xs mt-0.5">
                Všechny záznamy mají přísnou časovou platnost (7 dní). Vendor navíc může zvolit okamžité smazání dat po prvním úspěšném zobrazení zákazníkem.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-zinc-800">
          <button
            id="understand-privacy-btn"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono font-bold transition"
          >
            Rozumím a pokračovat
          </button>
        </div>
      </div>
    </div>
  );
};
