import React from 'react';
import { StatusHistoryItem, DropStatus } from '../types';
import { CheckCircle2, Eye, PlusCircle, AlertTriangle, Clock, ShieldAlert } from 'lucide-react';

interface TimelineViewProps {
  history: StatusHistoryItem[];
  currentStatus: DropStatus;
}

export const getStatusBadge = (status: DropStatus) => {
  switch (status) {
    case 'CREATED':
      return {
        label: 'Vytvořena',
        bg: 'bg-blue-950/60',
        border: 'border-blue-700/50',
        text: 'text-blue-400',
        icon: PlusCircle,
      };
    case 'VIEWED':
      return {
        label: 'Zobrazena PINem',
        bg: 'bg-amber-950/60',
        border: 'border-amber-700/50',
        text: 'text-amber-400',
        icon: Eye,
      };
    case 'COLLECTED':
      return {
        label: 'Vyzvednuto',
        bg: 'bg-emerald-950/60',
        border: 'border-emerald-700/50',
        text: 'text-emerald-400',
        icon: CheckCircle2,
      };
    case 'NOT_FOUND':
      return {
        label: 'Nenalezeno',
        bg: 'bg-rose-950/60',
        border: 'border-rose-700/50',
        text: 'text-rose-400',
        icon: AlertTriangle,
      };
    case 'EXPIRED':
      return {
        label: 'Expirovaná',
        bg: 'bg-zinc-900',
        border: 'border-zinc-800',
        text: 'text-zinc-500',
        icon: Clock,
      };
    default:
      return {
        label: status,
        bg: 'bg-zinc-900',
        border: 'border-zinc-800',
        text: 'text-zinc-400',
        icon: Clock,
      };
  }
};

export const TimelineView: React.FC<TimelineViewProps> = ({ history, currentStatus }) => {
  if (!history || history.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-zinc-400" />
        <span>Historie a životní cyklus</span>
      </div>

      <div className="relative pl-5 border-l border-zinc-800 space-y-3 pt-1">
        {history.map((item, idx) => {
          const config = getStatusBadge(item.status);
          const Icon = config.icon;
          const isLatest = idx === history.length - 1;

          const timeStr = new Date(item.timestamp).toLocaleDateString('cs-CZ', {
            day: 'numeric',
            month: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div key={idx} className="relative text-xs">
              {/* Dot on line */}
              <div
                className={`absolute -left-[25px] top-0.5 w-4 h-4 rounded-full border flex items-center justify-center ${
                  isLatest ? `${config.bg} ${config.border} ${config.text}` : 'bg-zinc-950 border-zinc-700 text-zinc-500'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${isLatest ? 'bg-current animate-ping' : 'bg-zinc-600'}`} />
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${config.bg} ${config.border} ${config.text}`}>
                  {config.label}
                </span>
                <span className="text-[10px] font-mono text-zinc-500">{timeStr}</span>
              </div>

              {item.note && (
                <p className="text-[11px] text-zinc-400 font-sans mt-0.5">{item.note}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
