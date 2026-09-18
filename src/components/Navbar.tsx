import React from 'react';
import { Shield, Lock, KeyRound } from 'lucide-react';

interface NavbarProps {
  isAdminView: boolean;
  isAdminAuthenticated: boolean;
  onGoToCustomer: () => void;
  onGoToVendor: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isAdminView,
  isAdminAuthenticated,
  onGoToCustomer,
  onGoToVendor,
}) => {
  return (
    <header className="border-b border-zinc-900 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-xl mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={onGoToCustomer}
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <span className="font-mono font-bold text-sm tracking-wider text-zinc-100">
            MY DEAD DROPS
          </span>
        </div>

        {/* Right side status / admin link */}
        <div className="flex items-center gap-2">
          {isAdminView ? (
            <button
              onClick={onGoToCustomer}
              className="text-xs font-mono text-zinc-400 hover:text-zinc-200 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 transition"
            >
              ← Zpět na web
            </button>
          ) : (
            // Discrete subtle link for vendor or privacy note
            <button
              onClick={onGoToVendor}
              className="text-[11px] font-mono text-zinc-600 hover:text-zinc-400 transition flex items-center gap-1"
              title="Vendor přihlášení (/vendor)"
            >
              <Lock className="w-3 h-3 opacity-60" />
              <span>vendor</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
