import React, { useState, useEffect } from 'react';
import { DeadDrop, DropStatus } from '../types';
import { getStatusBadge, TimelineView } from './TimelineView';
import { RefreshCw, Trash2, AlertOctagon, Key, ExternalLink, ChevronDown, ChevronUp, Copy, Check, DollarSign } from 'lucide-react';

interface VendorDashboardProps {
  onGoToCustomerWithPin: (pin: string) => void;
}

export const VendorDashboard: React.FC<VendorDashboardProps> = ({ onGoToCustomerWithPin }) => {
  const [drops, setDrops] = useState<DeadDrop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDropId, setExpandedDropId] = useState<string | null>(null);

  // Quick Burner Alert editing
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const [alertText, setAlertText] = useState('');
  const [isSavingAlert, setIsSavingAlert] = useState(false);

  // Copied PIN feedback
  const [copiedPin, setCopiedPin] = useState<string | null>(null);

  const fetchDrops = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/drops');
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Nepodařilo se načíst úschovy.');
      }
      setDrops(data.drops);
    } catch (err: any) {
      setError(err.message || 'Chyba při komunikaci se serverem.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrops();
  }, []);

  const handleDeleteDrop = async (id: string) => {
    if (!window.confirm('Opravdu chcete tuto úschovu trvale smazat ze serveru?')) return;
    try {
      const res = await fetch(`/api/drops/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDrops((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (err) {
      alert('Chyba při mazání.');
    }
  };

  const handleSaveAlert = async (id: string) => {
    setIsSavingAlert(true);
    try {
      const res = await fetch(`/api/drops/${id}/alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ burnerAlert: alertText }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDrops((prev) => prev.map((d) => (d.id === id ? data.drop : d)));
        setEditingAlertId(null);
        setAlertText('');
      } else {
        alert(data.error || 'Chyba.');
      }
    } catch (err) {
      alert('Chyba při ukládání zprávy.');
    } finally {
      setIsSavingAlert(false);
    }
  };

  const handleCopy = (pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(pin);
    setTimeout(() => setCopiedPin(null), 1500);
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center text-zinc-500 font-mono text-xs flex flex-col items-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
        <span>Načítám přehled zásilek...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-mono text-zinc-400">
          Celkem úschov: <span className="text-emerald-400 font-bold">{drops.length}</span>
        </div>
        <button
          type="button"
          onClick={fetchDrops}
          className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-zinc-200 bg-zinc-900 px-2 py-1 rounded border border-zinc-800 transition"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Obnovit</span>
        </button>
      </div>

      {error && (
        <div className="p-2.5 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-300 text-xs font-mono">
          {error}
        </div>
      )}

      {drops.length === 0 ? (
        <div className="p-8 text-center bg-zinc-900/40 border border-zinc-800 rounded-xl text-zinc-500 font-mono text-xs">
          Zatím nebyly vytvořeny žádné zásilky.
        </div>
      ) : (
        <div className="space-y-2.5">
          {drops.map((drop) => {
            const badge = getStatusBadge(drop.status || 'CREATED');
            const BadgeIcon = badge.icon;
            const isExpanded = expandedDropId === drop.id;

            return (
              <div
                key={drop.id}
                className="bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700/80 rounded-xl p-3.5 transition space-y-2.5"
              >
                {/* Header row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy((drop as any).rawPin || '??????')}
                      className="flex items-center gap-1 font-mono text-sm font-bold text-emerald-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 hover:border-emerald-500/50 transition"
                      title="Kopírovat PIN"
                    >
                      <Key className="w-3 h-3 text-zinc-500" />
                      <span>{(drop as any).rawPin || '??????'}</span>
                      {copiedPin === (drop as any).rawPin ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-zinc-600" />
                      )}
                    </button>

                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border flex items-center gap-1 ${badge.bg} ${badge.border} ${badge.text}`}
                    >
                      <BadgeIcon className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* View as customer */}
                    <button
                      type="button"
                      onClick={() => onGoToCustomerWithPin((drop as any).rawPin || '')}
                      className="p-1.5 rounded text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition"
                      title="Zobrazit v zákaznickém rozhraní"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDeleteDrop(drop.id)}
                      className="p-1.5 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition"
                      title="Smazat ze serveru"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Toggle expand */}
                    <button
                      type="button"
                      onClick={() => setExpandedDropId(isExpanded ? null : drop.id)}
                      className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Sub row: Amount, price, date */}
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 border-t border-zinc-800/60 pt-2">
                  <div className="flex items-center gap-2">
                    {drop.price ? (
                      <span className="text-zinc-200 font-semibold flex items-center gap-0.5">
                        <DollarSign className="w-3 h-3 text-emerald-400" />
                        {drop.price} {drop.currency}
                        {drop.isPaid ? (
                          <span className="text-[10px] text-emerald-400 ml-1">✓ Uhrazeno</span>
                        ) : (
                          <span className="text-[10px] text-amber-400 ml-1">⏳ Čeká na platbu</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-zinc-500">Bez platby</span>
                    )}

                    {drop.amount && (
                      <span className="bg-zinc-950 px-1.5 py-0.2 rounded border border-zinc-800 text-zinc-300">
                        {drop.amount}
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-zinc-500">
                    Vytvořeno: {new Date(drop.createdAt).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Burner alert snippet if active */}
                {drop.burnerAlert && (
                  <div className="p-2 rounded bg-amber-950/40 border border-amber-500/40 text-[11px] text-amber-200 flex items-center gap-1.5 font-mono">
                    <AlertOctagon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">Nouzová zpráva: {drop.burnerAlert}</span>
                  </div>
                )}

                {/* Expanded Details: Timeline & Edit Alert */}
                {isExpanded && (
                  <div className="pt-2 border-t border-zinc-800 space-y-3 animate-in fade-in duration-150">
                    {/* Description */}
                    <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/70 text-xs text-zinc-300">
                      <div className="text-[10px] font-mono text-zinc-500 uppercase mb-0.5">Popis úkrytu:</div>
                      {drop.description}
                    </div>

                    {/* Timeline History */}
                    <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/70">
                      <TimelineView history={drop.history || []} currentStatus={drop.status} />
                    </div>

                    {/* Burner Alert Action */}
                    <div className="bg-zinc-950/80 p-3 rounded-lg border border-zinc-800/70 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono text-amber-400">
                        <span className="flex items-center gap-1">
                          <AlertOctagon className="w-3.5 h-3.5" />
                          Nouzová zpráva (Burner Alert)
                        </span>
                        {drop.burnerAlert && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAlertId(drop.id);
                              setAlertText('');
                              handleSaveAlert(drop.id);
                            }}
                            className="text-[10px] text-zinc-500 hover:text-rose-400"
                          >
                            Odstranit
                          </button>
                        )}
                      </div>

                      {editingAlertId === drop.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            maxLength={150}
                            value={alertText}
                            onChange={(e) => setAlertText(e.target.value)}
                            placeholder="Např.: Místo je pod dohledem, krabička posunuta 3m za strom..."
                            className="w-full text-xs font-sans px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingAlertId(null)}
                              className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200"
                            >
                              Zrušit
                            </button>
                            <button
                              type="button"
                              disabled={isSavingAlert}
                              onClick={() => handleSaveAlert(drop.id)}
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs rounded font-mono"
                            >
                              Uložit zprávu
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAlertId(drop.id);
                            setAlertText(drop.burnerAlert || '');
                          }}
                          className="text-[11px] font-mono text-zinc-400 hover:text-amber-300 py-1 underline"
                        >
                          {drop.burnerAlert ? 'Změnit nouzovou zprávu' : '+ Přidat nouzovou zprávu k této zásilce'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
