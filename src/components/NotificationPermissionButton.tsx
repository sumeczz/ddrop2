import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bell, BellOff, Check } from 'lucide-react';
import {
  isSystemNotificationSupported,
  getSystemNotificationPermission,
  requestSystemNotificationPermission,
  triggerSystemNotification,
  SystemNotificationPermission,
} from '../services/systemNotifications';
import { playClickSound } from '../utils/soundEffects';

export const NotificationPermissionButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [permission, setPermission] = useState<SystemNotificationPermission>('default');
  const [showTestBadge, setShowTestBadge] = useState(false);

  useEffect(() => {
    setPermission(getSystemNotificationPermission());
  }, []);

  if (!isSystemNotificationSupported()) {
    return null;
  }

  const handleToggleOrRequest = async () => {
    playClickSound();

    if (permission === 'granted') {
      // Test notification to confirm to user that system notifications are working
      const sent = await triggerSystemNotification('Systémová oznámení aktivní 🔔', {
        body: 'Notifikace fungují! Budete upozorněni při schválení platby a změnách zásilek.',
        soundType: 'success',
      });
      if (sent) {
        setShowTestBadge(true);
        setTimeout(() => setShowTestBadge(false), 3000);
      }
      return;
    }

    const newPerm = await requestSystemNotificationPermission();
    setPermission(newPerm);

    if (newPerm === 'granted') {
      await triggerSystemNotification('Systémová oznámení povolena ✅', {
        body: 'MDD vás nyní může informovat i při běhu na pozadí.',
        soundType: 'success',
      });
    }
  };

  const isGranted = permission === 'granted';

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      type="button"
      onClick={handleToggleOrRequest}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition ${
        isGranted
          ? 'bg-zinc-900/80 border-zinc-700/80 text-emerald-400 hover:border-emerald-500/50'
          : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
      } ${className}`}
      title={
        isGranted
          ? 'Systémová oznámení povolena (Klikněte pro testovací notifikaci)'
          : 'Povolit systémová oznámení pro odpočet a schválení'
      }
    >
      {isGranted ? (
        <>
          <Bell className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline text-[11px]">
            {showTestBadge ? 'Otestováno!' : 'Notifikace'}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </>
      ) : (
        <>
          <BellOff className="w-3.5 h-3.5 text-zinc-500" />
          <span className="hidden md:inline text-[11px]">Notifikace</span>
        </>
      )}
    </motion.button>
  );
};
