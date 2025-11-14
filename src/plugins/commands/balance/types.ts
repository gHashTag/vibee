/**
 * Types for Balance Command Plugin
 */

export interface UserBalance {
  userId: string;
  balance: number;
  currency: string;
  lastTransaction: string;
  frozen: boolean;
}

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
  balanceAfter: number;
}

export interface BalanceContext {
  chatId: string;
  userId: string;
  amount?: number;
  description?: string;
  targetUserId?: string;
}

export interface BalanceResult {
  success: boolean;
  data?: UserBalance | Transaction[];
  error?: string;
}
