import { playSuccessSound, playAlertSound } from '../utils/soundEffects';

export type SystemNotificationPermission = 'default' | 'granted' | 'denied' | 'unsupported';

export function isSystemNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getSystemNotificationPermission(): SystemNotificationPermission {
  if (!isSystemNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestSystemNotificationPermission(): Promise<SystemNotificationPermission> {
  if (!isSystemNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Notification permission request failed:', err);
    return Notification.permission;
  }
}

export interface SystemNotificationOptions {
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  playSound?: boolean;
  soundType?: 'success' | 'alert';
  data?: any;
}

export async function triggerSystemNotification(
  title: string,
  options: SystemNotificationOptions
): Promise<boolean> {
  // Play accompanying tactical audio if requested
  if (options.playSound !== false) {
    if (options.soundType === 'alert') {
      playAlertSound();
    } else {
      playSuccessSound();
    }
  }

  if (!isSystemNotificationSupported()) {
    return false;
  }

  // If permission not yet granted, attempt to request
  let perm: SystemNotificationPermission = Notification.permission;
  if (perm === 'default') {
    perm = await requestSystemNotificationPermission();
  }

  if (perm !== 'granted') {
    return false;
  }

  const defaultIcon = '/pwa-192x192.png';
  const notificationPayload: any = {
    body: options.body,
    icon: options.icon || defaultIcon,
    badge: options.badge || defaultIcon,
    tag: options.tag || 'mdd-notification',
    data: options.data,
    // Mobile vibration pattern: 200ms pulse, 100ms pause, 200ms pulse
    vibrate: [200, 100, 200],
  };

  // Try service worker notification first (better on mobile Android & standalone PWA)
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && 'showNotification' in registration) {
        await registration.showNotification(title, notificationPayload);
        return true;
      }
    }
  } catch (swErr) {
    // Fall back to standard Notification constructor
  }

  // Standard window Notification
  try {
    const notif = new Notification(title, notificationPayload);
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
    return true;
  } catch (err) {
    console.warn('Standard notification dispatch failed:', err);
    return false;
  }
}

// Preset notifications for key app events
export const SystemNotifications = {
  paymentConfirmed: (amount?: string) =>
    triggerSystemNotification('Platba schválena! 🔓', {
      body: amount
        ? `Úschova (${amount}) byla odemčena. Přesné GPS souřadnice a fotografie jsou k dispozici.`
        : 'Vaše platba byla ověřena. Přesné souřadnice úschovy byly odemčeny.',
      soundType: 'success',
      tag: 'payment-status',
    }),

  paymentRejected: (reason?: string) =>
    triggerSystemNotification('Platba zamítnuta ⚠️', {
      body: reason || 'Zadaný PaySafeCard kupon nebyl uznán. Zkontrolujte PIN nebo kontaktujte správce.',
      soundType: 'alert',
      tag: 'payment-status',
    }),

  timerWarning: (minutesLeft: number) =>
    triggerSystemNotification(`Časovač ověření: zbývá ${minutesLeft} min ⏱️`, {
      body: `Časový limit pro ověření PaySafeCard kódu vendorem brzy vyprší.`,
      soundType: 'alert',
      tag: 'timer-warning',
    }),

  burnerAlertReceived: (message: string) =>
    triggerSystemNotification('Nouzový signál k zásilce! 🚨', {
      body: message,
      soundType: 'alert',
      tag: 'burner-alert',
    }),

  requestFulfilled: (requestCode: string) =>
    triggerSystemNotification(`Poptávka ${requestCode} realizována! 📦`, {
      body: 'Vendor vytvořil úschovu na základě vašeho zadání. Zkontrolujte kód zásilky.',
      soundType: 'success',
      tag: 'request-update',
    }),

  vendorNewPayment: (dropId: string) =>
    triggerSystemNotification('Nový PaySafeCard kód k ověření! 💳', {
      body: `Zákazník odeslal kupon k úschově #${dropId.slice(-4)}. Běží 30minutový limit na kontrolu.`,
      soundType: 'alert',
      tag: 'vendor-psc',
    }),
};
