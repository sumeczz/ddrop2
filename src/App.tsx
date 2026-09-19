import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { VendorCreate } from './components/VendorCreate';
import { CustomerClaim } from './components/CustomerClaim';
import { CustomerRequestDrop } from './components/CustomerRequestDrop';
import { AdminLogin } from './components/AdminLogin';
import { NotificationBanner } from './components/NotificationBanner';
import { NotificationItem } from './types';
import { playSuccessSound, playAlertSound, playRejectSound } from './utils/soundEffects';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [customerView, setCustomerView] = useState<'CLAIM' | 'REQUEST'>('CLAIM');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [urlPin, setUrlPin] = useState<string>('');

  // Non-popup Notification System
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const addNotification = (
    title: string,
    message: string,
    type: 'success' | 'warning' | 'info' | 'error' = 'info'
  ) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newNotif: NotificationItem = {
      id,
      title,
      message,
      type,
      timestamp: Date.now(),
    };

    setNotifications((prev) => [newNotif, ...prev.slice(0, 2)]);

    // Sound effect
    if (type === 'success') playSuccessSound();
    else if (type === 'warning' || type === 'info') playAlertSound();
    else if (type === 'error') playRejectSound();

    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 6000);
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Determine initial route and auth state
  useEffect(() => {
    const isAuth = sessionStorage.getItem('mdd_admin') === 'true';
    setIsAdminAuthenticated(isAuth);

    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const pinParam = searchParams.get('pin');
    const viewParam = searchParams.get('view');
    const hash = window.location.hash;

    if (pinParam && pinParam.trim().length === 6) {
      setUrlPin(pinParam.trim().toUpperCase());
      setCustomerView('CLAIM');
    } else if (searchParams.get('tab') === 'request') {
      setCustomerView('REQUEST');
    }

    if (path === '/vendor' || viewParam === 'vendor' || hash === '#vendor') {
      setCurrentPath('/vendor');
    } else {
      setCurrentPath('/');
    }

    const handlePopState = () => {
      const p = window.location.pathname;
      const h = window.location.hash;
      const s = new URLSearchParams(window.location.search);
      if (p === '/vendor' || s.get('view') === 'vendor' || h === '#vendor') {
        setCurrentPath('/vendor');
      } else {
        setCurrentPath('/');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    setCurrentPath(path);
    try {
      window.history.pushState({}, '', path);
    } catch (e) {
      // Fallback
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    addNotification('Přihlášeno', 'Vendor administrace byla úspěšně odemčena.', 'success');
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('mdd_admin');
    setIsAdminAuthenticated(false);
    addNotification('Odhlášeno', 'Byli jste bezpečně odhlášeni z administrace.', 'info');
    navigateTo('/');
  };

  const handleGoToCustomerWithPin = (pin?: string) => {
    if (pin) {
      setUrlPin(pin);
    }
    setCustomerView('CLAIM');
    navigateTo('/');
  };

  const isVendorRoute = currentPath === '/vendor';

  // Active view key for smooth AnimatePresence transition
  const activeKey = isVendorRoute
    ? isAdminAuthenticated
      ? 'vendor-admin'
      : 'vendor-login'
    : customerView === 'REQUEST'
    ? 'customer-request'
    : 'customer-claim';

  return (
    <div className="min-h-screen cyber-bg-glow text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300 relative">
      {/* Top Header */}
      <Navbar
        isAdminView={isVendorRoute}
        isAdminAuthenticated={isAdminAuthenticated}
        customerView={customerView}
        onSelectCustomerView={(view) => setCustomerView(view)}
        onGoToCustomer={() => navigateTo('/')}
        onGoToVendor={() => navigateTo('/vendor')}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-xl w-full mx-auto p-3 flex flex-col justify-start relative z-10">
        {/* Clean Notification Banner */}
        <NotificationBanner
          notifications={notifications}
          onDismiss={dismissNotification}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeKey}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="w-full"
          >
            {isVendorRoute ? (
              isAdminAuthenticated ? (
                <VendorCreate
                  onLogoutAdmin={handleAdminLogout}
                  onGoToCustomer={handleGoToCustomerWithPin}
                />
              ) : (
                <AdminLogin
                  onLoginSuccess={handleAdminLoginSuccess}
                  onCancel={() => navigateTo('/')}
                />
              )
            ) : customerView === 'REQUEST' ? (
              <CustomerRequestDrop
                onGoToPin={(pin) => {
                  setUrlPin(pin);
                  setCustomerView('CLAIM');
                }}
                onShowNotification={addNotification}
              />
            ) : (
              <CustomerClaim
                initialPin={urlPin}
                onClearInitialPin={() => setUrlPin('')}
                onShowNotification={addNotification}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Minimal Tactical Footer */}
      <footer className="py-4 px-4 text-center text-zinc-500 text-[11px] font-mono border-t border-zinc-900/80 mt-auto bg-zinc-950/40 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Zero-Knowledge E2E
          </span>
          <span>•</span>
          <span>Žádné ukládání cookies ani IP</span>
        </div>
      </footer>
    </div>
  );
}
