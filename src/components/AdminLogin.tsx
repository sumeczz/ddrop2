import React, { useState, useEffect, useRef } from 'react';
import { Lock, ArrowRight, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { playSuccessSound, playRejectSound, playClickSound } from '../utils/soundEffects';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onCancel: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onCancel }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const usernameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    usernameInputRef.current?.focus();
  }, []);

  const handleLogin = (userVal: string, passVal: string) => {
    setError(null);
    playClickSound();

    if (userVal.trim() === 'admin' && passVal === 'demo') {
      sessionStorage.setItem('mdd_admin', 'true');
      playSuccessSound();
      onLoginSuccess();
    } else {
      setError('Neplatné ID nebo heslo. (Demo: admin / demo)');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 450);
      playRejectSound();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(username, password);
  };

  // 1-Click Demo Login fill & submit
  const handleQuickDemoLogin = () => {
    setUsername('admin');
    setPassword('demo');
    handleLogin('admin', 'demo');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className="max-w-sm mx-auto py-12 px-4"
    >
      <div className="text-center mb-6">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 flex items-center justify-center text-emerald-400 mb-3 shadow-xl border-glow-emerald">
          <Lock className="w-5 h-5" />
        </div>
        <h1 className="text-lg font-bold text-zinc-100 font-mono tracking-wide">Vendor Administrace</h1>
        <p className="text-xs text-zinc-500 font-sans">Šifrovaný přístup k vytváření a správě zásilek</p>
      </div>

      <motion.form
        animate={isShaking ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
        transition={{ duration: 0.4 }}
        onSubmit={handleSubmit}
        className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-5 space-y-4 shadow-2xl backdrop-blur-xl"
      >
        <div>
          <label className="block text-[11px] font-mono text-zinc-400 mb-1">ID Uživatele</label>
          <input
            ref={usernameInputRef}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500 shadow-inner"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono text-zinc-400 mb-1">Heslo</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="demo"
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500 shadow-inner"
          />
        </div>

        {error && (
          <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-300 text-[11px] font-mono">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* 1-Click Demo Login Button */}
        <div className="pt-1">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={handleQuickDemoLogin}
            className="w-full py-2 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-850 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>1-Klik Demo Přihlášení (admin / demo)</span>
          </motion.button>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          type="submit"
          className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs font-mono transition flex items-center justify-center gap-1.5 shadow-lg border-glow-emerald"
        >
          <span>Přihlásit se</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </motion.button>

        <button
          type="button"
          onClick={onCancel}
          className="w-full py-1.5 text-center text-[11px] font-mono text-zinc-500 hover:text-zinc-300 transition"
        >
          Zpět k zadání PIN kódu
        </button>
      </motion.form>
    </motion.div>
  );
};
