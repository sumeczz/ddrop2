import React from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NotificationItem } from '../types';

interface NotificationBannerProps {
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  notifications,
  onDismiss,
}) => {
  return (
    <div className="w-full space-y-2 mb-3 z-30 overflow-hidden">
      <AnimatePresence initial={false}>
        {notifications.map((n) => {
          const isSuccess = n.type === 'success';
          const isWarning = n.type === 'warning';
          const isError = n.type === 'error';

          const borderClass = isSuccess
            ? 'border-emerald-500/60 bg-emerald-950/90 text-emerald-200 border-glow-emerald'
            : isWarning
            ? 'border-amber-500/60 bg-amber-950/90 text-amber-200 border-glow-amber'
            : isError
            ? 'border-rose-500/60 bg-rose-950/90 text-rose-200'
            : 'border-blue-500/60 bg-blue-950/90 text-blue-200';

          const icon = isSuccess ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : isWarning ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          ) : isError ? (
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
          );

          return (
            <motion.div
              key={n.id}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className={`flex items-start justify-between gap-2.5 p-3 rounded-xl border backdrop-blur-xl text-xs font-mono shadow-2xl relative overflow-hidden ${borderClass}`}
            >
              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                <div className="mt-0.5">{icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold tracking-wide flex items-center gap-2">
                    <span>{n.title}</span>
                  </div>
                  <div className="text-[11px] opacity-90 mt-0.5 break-words font-sans">{n.message}</div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={() => onDismiss(n.id)}
                className="p-1 rounded-lg bg-black/20 text-zinc-400 hover:text-white transition shrink-0"
                title="Zavřít"
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
