import React, { useState, useEffect, useRef } from 'react';
import { Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onCancel: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onCancel }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    usernameInputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (username.trim() === 'admin' && password === 'demo') {
      sessionStorage.setItem('mdd_admin', 'true');
      onLoginSuccess();
    } else {
      setError('Neplatné ID nebo heslo. (demo přístup: admin / demo)');
    }
  };

  return (
    <div className="max-w-sm mx-auto py-12 px-4 animate-in fade-in duration-200">
      <div className="text-center mb-6">
        <div className="w-10 h-10 mx-auto rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 mb-2.5">
          <Lock className="w-5 h-5" />
        </div>
        <h1 className="text-lg font-bold text-zinc-100 font-mono">Vendor Správa</h1>
        <p className="text-xs text-zinc-500">Pouze pro administrátory úschov</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 space-y-4 shadow-xl">
        <div>
          <label className="block text-[11px] font-mono text-zinc-400 mb-1">ID Uživatele</label>
          <input
            ref={usernameInputRef}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
            className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono text-zinc-400 mb-1">Heslo</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="demo"
            className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
          />
        </div>

        {error && (
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-rose-950/70 border border-rose-800/80 text-rose-300 text-[11px] font-mono">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          className="w-full py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs font-mono transition flex items-center justify-center gap-1.5 shadow-md"
        >
          <span>Přihlásit se</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="w-full py-1.5 text-center text-[11px] font-mono text-zinc-500 hover:text-zinc-300 transition"
        >
          Zpět k zadání PIN kódu
        </button>
      </form>
    </div>
  );
};
