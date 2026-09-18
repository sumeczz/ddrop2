import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { VendorCreate } from './components/VendorCreate';
import { CustomerClaim } from './components/CustomerClaim';
import { AdminLogin } from './components/AdminLogin';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [urlPin, setUrlPin] = useState<string>('');

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
      // Fallback if pushState is constrained
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('mdd_admin');
    setIsAdminAuthenticated(false);
    navigateTo('/');
  };

  const handleGoToCustomerWithPin = (pin?: string) => {
    if (pin) {
      setUrlPin(pin);
    }
    navigateTo('/');
  };

  const isVendorRoute = currentPath === '/vendor';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Minimal Top Header */}
      <Navbar
        isAdminView={isVendorRoute}
        isAdminAuthenticated={isAdminAuthenticated}
        onGoToCustomer={() => navigateTo('/')}
        onGoToVendor={() => navigateTo('/vendor')}
      />

      {/* Main View */}
      <main className="flex-1 max-w-xl w-full mx-auto p-3 flex flex-col justify-start">
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
        ) : (
          <CustomerClaim
            initialPin={urlPin}
            onClearInitialPin={() => setUrlPin('')}
          />
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="py-3 px-4 text-center text-zinc-600 text-[11px] font-mono">
        <span>Anonymní geolokační úschovy bez ukládání identity</span>
      </footer>
    </div>
  );
}
