/**
 * Types for Expense Analysis Command Plugin
 */

export interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  tags: string[];
}

export interface ExpenseAnalysis {
  totalAmount: number;
  categoryBreakdown: { [category: string]: number };
  monthlyTotal: number;
  topCategories: { category: string; amount: number; percentage: number }[];
  trends: {
    period: string;
    amount: number;
    change: number;
  }[];
  suggestions: string[];
}

export interface ExpenseContext {
  chatId: string;
  userId: string;
  period?: 'week' | 'month' | 'year';
  category?: string;
}

export interface ExpenseResult {
  success: boolean;
  data?: ExpenseAnalysis;
  error?: string;
}
