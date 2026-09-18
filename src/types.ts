export interface Photo {
  id: string;
  dataUrl: string;
  sizeBytes: number;
}

export type DropStatus = 'CREATED' | 'VIEWED' | 'COLLECTED' | 'NOT_FOUND' | 'EXPIRED';

export interface StatusHistoryItem {
  status: DropStatus;
  timestamp: number;
  note?: string;
}

export interface DeadDrop {
  id: string;
  pinHash: string;
  pinMasked?: string;
  description: string;
  latitude: number;
  longitude: number;
  photos: Photo[];
  createdAt: number;
  expiresAt: number;
  burnAfterReading: boolean;
  viewCount: number;
  claimedAt: number | null;
  status: DropStatus;
  history: StatusHistoryItem[];
  amount?: string;
  price?: number;
  currency?: string;
  isPaid?: boolean;
  paidAt?: number;
  paymentMethod?: 'CRYPTO' | 'PAYSAFECARD';
  cryptoType?: 'BTC' | 'XMR' | 'USDT';
  cryptoAddress?: string;
  burnerAlert?: string;
  burnerAlertSetAt?: number;
}

export interface CreateDropRequest {
  description: string;
  latitude: number;
  longitude: number;
  photos: { dataUrl: string; sizeBytes?: number }[];
  burnAfterReading?: boolean;
  amount?: string;
  price?: number;
  currency?: string;
  burnerAlert?: string;
  cryptoType?: 'BTC' | 'XMR' | 'USDT';
}

export interface CreateDropResponse {
  success: boolean;
  pin?: string;
  expiresAt?: number;
  burnAfterReading?: boolean;
  message?: string;
  error?: string;
}

export interface ClaimDropResponse {
  success: boolean;
  drop?: DeadDrop;
  error?: string;
}
