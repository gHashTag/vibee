/**
 * Types for Admin Subscription Command Plugin
 */

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: number; // days
  features: string[];
  active: boolean;
}

export interface UserSubscription {
  userId: string;
  userName: string;
  planId: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
}

export interface SubscriptionStats {
  totalUsers: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  revenue: number;
  plans: { [planId: string]: number };
}

export interface AdminSubContext {
  chatId: string;
  userId: string;
  targetUserId?: string;
  action?: 'create' | 'cancel' | 'renew' | 'list';
}

export interface AdminSubResult {
  success: boolean;
  data?: UserSubscription | SubscriptionStats | UserSubscription[];
  error?: string;
}
