import React, { useState, useEffect } from 'react';
import { DeadDrop, CustomerDropRequest } from '../types';
import { getStatusBadge, TimelineView } from './TimelineView';
import { motion, AnimatePresence } from 'motion/react';
import {
  RefreshCw,
  Trash2,
  AlertOctagon,
  Key,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Inbox,
  Send,
  MapPin,
  CreditCard,
} from 'lucide-react';
import { playSuccessSound, playRejectSound, playClickSound, playAlertSound } from '../utils/soundEffects';
import { SystemNotifications } from '../services/systemNotifications';

interface VendorDashboardProps {
  onGoToCustomerWithPin: (pin: string) => void;
  onCreateDropForRequest?: (req: CustomerDropRequest) => void;
}

export const VendorDashboard: React.FC<VendorDashboardProps> = ({
  onGoToCustomerWithPin,
  onCreateDropForRequest,
}) => {
  const [activeTab, setActiveTab] = useState<'DROPS' | 'REQUESTS'>('DROPS');

  // Drops state
  const [drops, setDrops] = useState<DeadDrop[]>([]);
  const [isLoadingDrops, setIsLoadingDrops] = useState(true);
  const [expandedDropId, setExpandedDropId] = useState<string | null>(null);

  // Requests state
  const [requests, setRequests] = useState<CustomerDropRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  // Fulfill request dialog / state
  const [fulfillingRequestId, setFulfillingRequestId] = useState<string | null>(null);
  const [fulfillPin, setFulfillPin] = useState<string>('');

  // Quick Burner Alert editing
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const [alertText, setAlertText] = useState('');
  const [isSavingAlert, setIsSavingAlert] = useState(false);

  // Action status feedback
  const [copiedPin, setCopiedPin] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [deletingDropId, setDeletingDropId] = useState<string | null>(null);
  const knownPendingIdsRef = React.useRef<Set<string>>(new Set());

  const fetchDrops = async () => {
    setIsLoadingDrops(true);
    try {
      const res = await fetch('/api/drops');
      const data = await res.json();
      if (res.ok && data.success) {
        const newDrops: DeadDrop[] = data.drops || [];
        // Check for new pending payments to alert vendor
        newDrops.forEach((d) => {
          if (d.paymentStatus === 'PENDING_CONFIRMATION') {
            if (!knownPendingIdsRef.current.has(d.id)) {
              knownPendingIdsRef.current.add(d.id);
              SystemNotifications.vendorNewPayment(d.id);
            }
          }
        });
        setDrops(newDrops);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoadingDrops(false);
    }
  };

  const fetchRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const res = await fetch('/api/requests');
      const data = await res.json();
      if (res.ok && data.success) {
        setRequests(data.requests);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchDrops();
    fetchRequests();

    // Auto-refresh interval (every 10 seconds)
    const interval = setInterval(() => {
      fetchDrops();
      fetchRequests();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Confirm or Reject PaySafeCard payment
  const handleConfirmPsc = async (dropId: string, action: 'CONFIRM' | 'REJECT') => {
    playClickSound();
    try {
      const res = await fetch(`/api/drops/${dropId}/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: action === 'REJECT' ? 'Neplatný kód' : undefined }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (action === 'CONFIRM') {
          playSuccessSound();
          setActionMessage('Platba schválena. Zákazníkovi byla odemčena poloha.');
        } else {
          playRejectSound();
          setActionMessage('Platba zamítnuta.');
        }
        setTimeout(() => setActionMessage(null), 4000);
        fetchDrops();
      }
    } catch (err: any) {
      playRejectSound();
      setActionMessage(err?.message || 'Chyba při zpracování platby.');
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  // Update Customer Request status
  const handleUpdateRequestStatus = async (
    requestId: string,
    status: 'ACCEPTED' | 'FULFILLED' | 'REJECTED',
    dropPin?: string
  ) => {
    playClickSound();
    try {
      const res = await fetch(`/api/requests/${requestId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, fulfilledDropPin: dropPin }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        playSuccessSound();
        setFulfillingRequestId(null);
        setFulfillPin('');
        fetchRequests();
      } else {
        throw new Error(data?.error || 'Chyba při změně stavu žádosti');
      }
    } catch (err: any) {
      playRejectSound();
      setActionMessage(err?.message || 'Chyba při aktualizaci žádosti.');
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleDeleteDrop = async (id: string) => {
    if (deletingDropId !== id) {
      setDeletingDropId(id);
      playAlertSound();
      setTimeout(() => {
        setDeletingDropId((curr) => (curr === id ? null : curr));
      }, 4000);
      return;
    }

    try {
      playClickSound();
      const res = await fetch(`/api/drops/${id}`, { method: 'DELETE' });
      if (res.ok) {
        playSuccessSound();
        setDrops((prev) => prev.filter((d) => d.id !== id));
        setActionMessage('Úschova byla trvale smazána.');
        setTimeout(() => setActionMessage(null), 3000);
      } else {
        throw new Error('Chyba při mazání ze serveru.');
      }
    } catch (err: any) {
      playRejectSound();
      setActionMessage(err?.message || 'Chyba při mazání.');
      setTimeout(() => setActionMessage(null), 4000);
    } finally {
      setDeletingDropId(null);
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
        playSuccessSound();
        setDrops((prev) => prev.map((d) => (d.id === id ? data.drop : d)));
        setEditingAlertId(null);
        setAlertText('');
        setActionMessage('Nouzová zpráva byla aktualizována.');
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (err: any) {
      playRejectSound();
      setActionMessage(err?.message || 'Chyba při ukládání zprávy.');
      setTimeout(() => setActionMessage(null), 4000);
    } finally {
      setIsSavingAlert(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPin(text);
    playClickSound();
    setTimeout(() => setCopiedPin(null), 1500);
  };

  // Pending PSC payments that need vendor confirmation
  const pendingPscDrops = drops.filter((d) => d.paymentStatus === 'PENDING_CONFIRMATION');

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Top Banner Message */}
      {actionMessage && (
        <div className="p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-500 text-emerald-300 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* PENDING PSC CONFIRMATIONS SECTION */}
      {pendingPscDrops.length > 0 && (
        <div className="rounded-xl border-2 border-amber-500/80 bg-amber-950/50 p-4 space-y-3 shadow-xl">
          <div className="flex items-center justify-between text-amber-300 font-bold">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 animate-spin" />
              <span>Platby PaySafeCard k ověření ({pendingPscDrops.length})</span>
            </div>
            <span className="text-[10px] bg-amber-900/60 px-2 py-0.5 rounded text-amber-200 border border-amber-500/40">
              Vyžaduje manuální kontrolu
            </span>
          </div>

          <p className="text-[11px] text-zinc-300">
            Zákazník odeslal kód PaySafeCard. Zkontrolujte jeho zůstatek na oficiálním webu PaySafeCard a potvrďte nebo zamítněte platbu.
          </p>

          <div className="space-y-2">
            {pendingPscDrops.map((d) => {
              const remainingSec = Math.max(0, Math.floor(((d.pscExpiresAt || 0) - Date.now()) / 1000));
              const mins = Math.floor(remainingSec / 60);
              const secs = remainingSec % 60;
              const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

              return (
                <div
                  key={d.id}
                  className="bg-zinc-950 p-3 rounded-lg border border-amber-500/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-100">Úschova PIN: {(d as any).rawPin || '??????'}</span>
                    <span className="text-amber-400 font-bold text-xs">Zbývá: {formattedTime}</span>
                  </div>

                  <div className="flex items-center justify-between bg-zinc-900 px-2.5 py-1.5 rounded border border-zinc-800">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Kód PaySafeCard:</span>
                      <span className="text-sm font-bold text-blue-400 tracking-wider">
                        {d.pscCode?.match(/.{1,4}/g)?.join('-') || d.pscCode || 'NENÍ ZADÁN'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(d.pscCode || '')}
                      className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] flex items-center gap-1"
                    >
                      {copiedPin === d.pscCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Kopírovat</span>
                    </button>
                  </div>

                  <div className="text-[11px] text-zinc-400">
                    Cena k úhradě: <span className="text-emerald-400 font-bold">{d.price} {d.currency}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleConfirmPsc(d.id, 'CONFIRM')}
                      className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold flex items-center justify-center gap-1.5 transition shadow"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Schválit (Platný kód)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleConfirmPsc(d.id, 'REJECT')}
                      className="py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-rose-900/80 text-rose-300 font-bold flex items-center justify-center gap-1.5 transition border border-zinc-700"
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Zamítnout kód</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TABS: DROPS vs CUSTOMER REQUESTS */}
      <div className="relative flex items-center p-1 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-xs shadow-inner">
        <button
          type="button"
          onClick={() => {
            setActiveTab('DROPS');
            playClickSound();
          }}
          className={`relative z-10 flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition font-semibold ${
            activeTab === 'DROPS'
              ? 'text-emerald-300'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {activeTab === 'DROPS' && (
            <motion.div
              layoutId="dashboard-subtab-pill"
              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              className="absolute inset-0 bg-zinc-800 border border-emerald-500/30 rounded-xl shadow-md"
            />
          )}
          <Key className="w-3.5 h-3.5 relative z-10 text-emerald-400" />
          <span className="relative z-10">Aktivní úschovy ({drops.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('REQUESTS');
            playClickSound();
          }}
          className={`relative z-10 flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition font-semibold ${
            activeTab === 'REQUESTS'
              ? 'text-emerald-300'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {activeTab === 'REQUESTS' && (
            <motion.div
              layoutId="dashboard-subtab-pill"
              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              className="absolute inset-0 bg-zinc-800 border border-emerald-500/30 rounded-xl shadow-md"
            />
          )}
          <Inbox className="w-3.5 h-3.5 relative z-10 text-emerald-400" />
          <span className="relative z-10">Žádosti zákazníků ({requests.length})</span>
          {requests.filter((r) => r.status === 'PENDING').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse relative z-10" />
          )}
        </button>
      </div>

      {/* TAB 1: DROPS LIST */}
      {activeTab === 'DROPS' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-zinc-400">
            <span>Seznam existujících úschov</span>
            <button
              type="button"
              onClick={fetchDrops}
              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 bg-zinc-900 px-2 py-1 rounded border border-zinc-800 transition"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingDrops ? 'animate-spin' : ''}`} />
              <span>Obnovit</span>
            </button>
          </div>

          {drops.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900/40 border border-zinc-800 rounded-xl text-zinc-500">
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
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${badge.bg} ${badge.border} ${badge.text}`}
                        >
                          <BadgeIcon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onGoToCustomerWithPin((drop as any).rawPin || '')}
                          className="p-1.5 rounded text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition"
                          title="Zobrazit v zákaznickém rozhraní"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteDrop(drop.id)}
                          className={`px-1.5 py-1 rounded text-xs font-mono transition flex items-center gap-1 ${
                            deletingDropId === drop.id
                              ? 'bg-rose-600 text-white font-bold animate-pulse'
                              : 'text-zinc-500 hover:text-rose-400 hover:bg-zinc-800'
                          }`}
                          title={deletingDropId === drop.id ? 'Klikněte pro trvalé smazání' : 'Smazat ze serveru'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {deletingDropId === drop.id && <span className="text-[10px]">Smazat?</span>}
                        </button>

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
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 border-t border-zinc-800/60 pt-2">
                      <div className="flex items-center gap-2">
                        {drop.price ? (
                          <span className="text-zinc-200 font-semibold flex items-center gap-0.5">
                            <DollarSign className="w-3 h-3 text-emerald-400" />
                            {drop.price} {drop.currency}
                            {drop.isPaid ? (
                              <span className="text-[10px] text-emerald-400 ml-1">✓ Uhrazeno</span>
                            ) : drop.paymentStatus === 'PENDING_CONFIRMATION' ? (
                              <span className="text-[10px] text-amber-400 ml-1">⏳ Čeká na PSC schválení</span>
                            ) : (
                              <span className="text-[10px] text-zinc-400 ml-1">Čeká na platbu</span>
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
                        {new Date(drop.createdAt).toLocaleDateString('cs-CZ', {
                          day: 'numeric',
                          month: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Burner alert snippet if active */}
                    {drop.burnerAlert && (
                      <div className="p-2 rounded bg-amber-950/40 border border-amber-500/40 text-[11px] text-amber-200 flex items-center gap-1.5">
                        <AlertOctagon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">Nouzová zpráva: {drop.burnerAlert}</span>
                      </div>
                    )}

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="pt-2 border-t border-zinc-800 space-y-3 animate-in fade-in duration-150">
                        <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/70 text-xs text-zinc-300">
                          <div className="text-[10px] text-zinc-500 uppercase mb-0.5">Popis úkrytu:</div>
                          {drop.description}
                        </div>

                        {/* PaySafeCard details if present */}
                        {drop.pscCode && (
                          <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/70 text-xs flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-zinc-500 block">Zadaný PaySafeCard PIN:</span>
                              <span className="font-bold text-blue-400 tracking-wider">
                                {drop.pscCode.match(/.{1,4}/g)?.join('-')}
                              </span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              drop.isPaid ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                            }`}>
                              {drop.isPaid ? 'Potvrzeno' : 'Čeká / Neověřeno'}
                            </span>
                          </div>
                        )}

                        {/* Timeline */}
                        <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/70">
                          <TimelineView history={drop.history || []} currentStatus={drop.status} />
                        </div>

                        {/* Burner Alert Edit */}
                        <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-zinc-400">
                            <span className="flex items-center gap-1">
                              <AlertOctagon className="w-3 h-3 text-amber-400" />
                              Nouzová zpráva (Burner Alert)
                            </span>
                          </div>

                          {editingAlertId === drop.id ? (
                            <div className="space-y-1.5">
                              <textarea
                                rows={2}
                                value={alertText}
                                onChange={(e) => setAlertText(e.target.value)}
                                placeholder="Např. Pozor na zvýšenou aktivitu v okolí, vyzvedněte až po setmění."
                                className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  disabled={isSavingAlert}
                                  onClick={() => handleSaveAlert(drop.id)}
                                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold rounded text-[11px]"
                                >
                                  {isSavingAlert ? 'Ukládám...' : 'Uložit zprávu'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingAlertId(null)}
                                  className="px-2 py-1 text-zinc-400 hover:text-zinc-200 text-[11px]"
                                >
                                  Zrušit
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
                              className="text-[11px] text-amber-400 hover:text-amber-300 font-bold"
                            >
                              {drop.burnerAlert ? 'Upravit nouzovou zprávu' : '+ Nastavit nouzovou zprávu'}
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
      )}

      {/* TAB 2: CUSTOMER REQUESTS LIST */}
      {activeTab === 'REQUESTS' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-zinc-400">
            <span>Poptávky zadané zákazníky</span>
            <button
              type="button"
              onClick={fetchRequests}
              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 bg-zinc-900 px-2 py-1 rounded border border-zinc-800 transition"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingRequests ? 'animate-spin' : ''}`} />
              <span>Obnovit</span>
            </button>
          </div>

          {requests.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900/40 border border-zinc-800 rounded-xl text-zinc-500">
              Zatím nebyly zaslány žádné žádosti o drop.
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-3 shadow-lg"
                >
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-400 text-sm">{req.requestCode}</span>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(req.createdAt).toLocaleDateString('cs-CZ', {
                          day: 'numeric',
                          month: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        req.status === 'PENDING'
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          : req.status === 'ACCEPTED'
                          ? 'bg-blue-950 text-blue-300 border border-blue-500/40'
                          : req.status === 'FULFILLED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-950 text-rose-300'
                      }`}
                    >
                      {req.status === 'PENDING'
                        ? 'Čeká na schválení'
                        : req.status === 'ACCEPTED'
                        ? 'Přijato'
                        : req.status === 'FULFILLED'
                        ? 'Vyřízeno (Drop hotov)'
                        : 'Zamítnuto'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-300">
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Požadavek:</span>
                      <span className="font-bold text-zinc-100">{req.amount}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Nabízená cena:</span>
                      <span className="font-bold text-emerald-400">{req.price} {req.currency}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Lokalita GPS:</span>
                      <span>{req.latitude.toFixed(4)}, {req.longitude.toFixed(4)}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Platba:</span>
                      <span>{req.pscTiming === 'NOW' ? 'PaySafeCard přiložen' : 'Při převzetí'}</span>
                    </div>
                  </div>

                  {req.locationDescription && (
                    <div className="text-[11px] text-zinc-400 bg-zinc-950 p-2 rounded border border-zinc-800/80">
                      <span className="text-zinc-500 block text-[10px]">Upřesnění lokality:</span>
                      {req.locationDescription}
                    </div>
                  )}

                  {req.pscCode && (
                    <div className="bg-zinc-950 p-2 rounded border border-blue-500/30 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Kód PaySafeCard:</span>
                        <span className="text-blue-400 font-bold tracking-wider">
                          {req.pscCode.match(/.{1,4}/g)?.join('-')}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(req.pscCode!)}
                        className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[10px] flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Kopírovat</span>
                      </button>
                    </div>
                  )}

                  {req.note && (
                    <div className="text-[11px] text-zinc-400 bg-zinc-950/50 p-2 rounded">
                      <span className="text-zinc-500 block text-[10px]">Poznámka:</span>
                      {req.note}
                    </div>
                  )}

                  {/* Actions for Vendor */}
                  <div className="pt-2 border-t border-zinc-800 flex flex-wrap gap-2">
                    {onCreateDropForRequest && req.status !== 'FULFILLED' && (
                      <button
                        type="button"
                        onClick={() => onCreateDropForRequest(req)}
                        className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold transition flex items-center gap-1.5"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Vytvořit drop pro tuto žádost</span>
                      </button>
                    )}

                    {req.status === 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateRequestStatus(req.id, 'ACCEPTED')}
                        className="py-1.5 px-3 rounded-lg bg-blue-900/60 hover:bg-blue-800/80 text-blue-200 border border-blue-500/40 transition"
                      >
                        Přijmout poptávku
                      </button>
                    )}

                    {req.status !== 'FULFILLED' && (
                      <button
                        type="button"
                        onClick={() => {
                          setFulfillingRequestId(req.id);
                          setFulfillPin('');
                        }}
                        className="py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition flex items-center gap-1"
                      >
                        <Key className="w-3 h-3 text-emerald-400" />
                        <span>Přiřadit PIN hotového dropu</span>
                      </button>
                    )}

                    {req.status !== 'REJECTED' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateRequestStatus(req.id, 'REJECTED')}
                        className="py-1.5 px-2 rounded-lg text-zinc-500 hover:text-rose-400 transition ml-auto"
                      >
                        Zamítnout
                      </button>
                    )}
                  </div>

                  {/* Inline modal to link finished drop PIN */}
                  {fulfillingRequestId === req.id && (
                    <div className="p-3 bg-zinc-950 rounded-lg border border-emerald-500/40 space-y-2 mt-2">
                      <label className="block text-[10px] text-zinc-400">
                        Zadejte 6místný PIN vytvořené úschovy:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={fulfillPin}
                          onChange={(e) => setFulfillPin(e.target.value.toUpperCase())}
                          placeholder="ABC123"
                          className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-emerald-400 font-bold tracking-wider text-center"
                        />
                        <button
                          type="button"
                          disabled={fulfillPin.trim().length !== 6}
                          onClick={() => handleUpdateRequestStatus(req.id, 'FULFILLED', fulfillPin)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold rounded transition disabled:opacity-50"
                        >
                          Dokončit žádost
                        </button>
                        <button
                          type="button"
                          onClick={() => setFulfillingRequestId(null)}
                          className="px-2 py-1.5 text-zinc-400 hover:text-zinc-200"
                        >
                          Zrušit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
