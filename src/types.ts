export interface Photo {
  id: string;
  dataUrl: string;
  sizeBytes: number;
}

export type DropStatus = 'CREATED' | 'VIEWED' | 'COLLECTED' | 'NOT_FOUND' | 'EXPIRED';

export type PaymentStatus = 'UNPAID' | 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'REJECTED';

export interface StatusHistoryItem {
  status: DropStatus;
  timestamp: number;
  note?: string;
}

export interface DeadDrop {
  id: string;
  pinHash: string;
  rawPin?: string;
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
  paymentMethod?: 'PAYSAFECARD';
  paymentStatus?: PaymentStatus;
  pscCode?: string;
  submittedPscCode?: string;
  pscSubmittedAt?: number;
  pscExpiresAt?: number; // 30 min timer
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

// Request Drop by Customer types
export type RequestDropStatus = 'PENDING' | 'ACCEPTED' | 'FULFILLED' | 'REJECTED';

export interface CustomerDropRequest {
  id: string;
  requestCode: string; // e.g. REQ-7K9M2X
  latitude: number;
  longitude: number;
  locationDescription?: string;
  amount: string;
  price: number;
  currency: string;
  pscTiming: 'NOW' | 'LATER';
  pscCode?: string;
  pscConfirmed?: boolean;
  note?: string;
  status: RequestDropStatus;
  createdAt: number;
  fulfilledDropPin?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  timestamp: number;
}
