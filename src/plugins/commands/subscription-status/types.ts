export interface Subscription {
  userId: string;
  planId: string;
  planName: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  remainingDays: number;
  features: string[];
}

export interface SubscriptionContext {
  chatId: string;
  userId: string;
  userName: string;
}

export interface SubscriptionResult {
  success: boolean;
  data?: Subscription | null;
  error?: string;
}
