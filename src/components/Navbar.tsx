import React, { useState, useEffect } from 'react';
import { Shield, Lock, Volume2, VolumeX, Key, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { isSoundEnabled, setSoundEnabled, playClickSound } from '../utils/soundEffects';
import { NotificationPermissionButton } from './NotificationPermissionButton';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  isAdminView: boolean;
  isAdminAuthenticated: boolean;
  customerView: 'CLAIM' | 'REQUEST';
  onSelectCustomerView: (view: 'CLAIM' | 'REQUEST') => void;
  onGoToCustomer: () => void;
  onGoToVendor: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isAdminView,
  isAdminAuthenticated,
  customerView,
  onSelectCustomerView,
  onGoToCustomer,
  onGoToVendor,
}) => {
  const [soundOn, setSoundOn] = useState<boolean>(true);

  useEffect(() => {
    setSoundOn(isSoundEnabled());
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playClickSound();
  };

  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-40 transition-colors">
      {/* Top subtle emerald light accent line */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent"></div>

      <div className="max-w-xl mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Brand with subtle pulse */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onGoToCustomer}
          className="flex items-center gap-2 cursor-pointer select-none group"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-900/90 to-zinc-900 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/50 group-hover:border-emerald-400/70 transition-colors">
              <Shield className="w-4 h-4" />
            </div>
            {/* Status pulsing dot */}
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="font-mono font-bold text-xs tracking-wider text-zinc-100 flex items-center gap-1.5">
              <span>MY DEAD DROPS</span>
            </div>
            <div className="text-[9px] font-mono text-emerald-500/80 tracking-widest uppercase">
              Zero-Knowledge
            </div>
          </div>
        </motion.div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2 font-mono text-xs">
          {!isAdminView && (
            <div className="relative flex items-center bg-zinc-900/90 border border-zinc-800 rounded-xl p-1 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  onSelectCustomerView('CLAIM');
                  playClickSound();
                }}
                className={`relative z-10 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors text-xs font-semibold ${
                  customerView === 'CLAIM'
                    ? 'text-emerald-300'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {customerView === 'CLAIM' && (
                  <motion.div
                    layoutId="navbar-pill"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    className="absolute inset-0 bg-zinc-800 border border-emerald-500/30 rounded-lg shadow-sm"
                  />
                )}
                <Key className="w-3 h-3 relative z-10" />
                <span className="relative z-10">PIN</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectCustomerView('REQUEST');
                  playClickSound();
                }}
                className={`relative z-10 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors text-xs font-semibold ${
                  customerView === 'REQUEST'
                    ? 'text-emerald-300'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {customerView === 'REQUEST' && (
                  <motion.div
                    layoutId="navbar-pill"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    className="absolute inset-0 bg-zinc-800 border border-emerald-500/30 rounded-lg shadow-sm"
                  />
                )}
                <MapPin className="w-3 h-3 relative z-10" />
                <span className="relative z-10">Požádat</span>
              </button>
            </div>
          )}

          {/* System Notification toggle */}
          <NotificationPermissionButton />

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Sound toggle button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={toggleSound}
            className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition shadow-sm"
            title={soundOn ? 'Zvuky zapnuty' : 'Zvuky vypnuty'}
          >
            {soundOn ? (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
            )}
          </motion.button>

          {/* Vendor route button */}
          {isAdminView ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={onGoToCustomer}
              className="text-xs font-mono text-zinc-300 hover:text-emerald-300 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 transition"
            >
              ← Zpět
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05, opacity: 0.9 }}
              whileTap={{ scale: 0.95 }}
              onClick={onGoToVendor}
              className="text-[11px] font-mono text-zinc-600 hover:text-zinc-300 transition flex items-center gap-1 px-2 py-1.5 rounded-lg border border-transparent hover:border-zinc-800/80"
              title="Vendor přihlášení (/vendor)"
            >
              <Lock className="w-3 h-3 opacity-60" />
              <span className="hidden sm:inline">vendor</span>
            </motion.button>
          )}
        </div>
      </div>
    </header>
  );
};
