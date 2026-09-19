import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Share2, PlusSquare, X, Smartphone, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { playClickSound } from '../utils/soundEffects';

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, showIOSPrompt, setShowIOSPrompt, installApp } = usePWAInstall();

  if (isInstalled) {
    return (
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/60 border border-emerald-950/60 text-emerald-400 text-xs font-mono ${className}`}>
        <Check className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Nainstalováno (PWA)</span>
      </div>
    );
  }

  if (!isInstallable) {
    return null;
  }

  const handleClick = () => {
    playClickSound();
    installApp();
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        type="button"
        onClick={handleClick}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-700/50 text-emerald-400 hover:text-emerald-300 text-xs font-mono transition shadow-sm ${className}`}
        title="Instalovat aplikaci do zařízení (PWA)"
      >
        <Download className="w-3.5 h-3.5 animate-bounce" />
        <span className="font-semibold">Instalovat PWA</span>
      </motion.button>

      {/* iOS Safari Guided Install Modal */}
      <AnimatePresence>
        {showIOSPrompt && isIOS && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowIOSPrompt(false)}
          >
            <motion.div
              initial={{ y: 50, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 50, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-sm">
                  <Smartphone className="w-4 h-4" />
                  Instalace na Apple iOS (iPhone/iPad)
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSPrompt(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                V prohlížeči Safari můžete přidat aplikaci <strong className="text-emerald-400">My Dead Drops</strong> přímo na domovskou obrazovku:
              </p>

              <div className="space-y-2.5 text-xs text-zinc-300 font-sans">
                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div className="p-1 rounded-lg bg-blue-950/60 text-blue-400">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-zinc-100">1. Krok:</span> Ve spodní liště Safari klepněte na tlačítko <strong>Sdílet</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div className="p-1 rounded-lg bg-emerald-950/60 text-emerald-400">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-zinc-100">2. Krok:</span> V nabídce sjeďte dolů a vyberte možnost <strong>Přidat na plochu</strong>.
                  </div>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => setShowIOSPrompt(false)}
                className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold font-mono text-xs transition"
              >
                Rozumím
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
