/**
 * Types for Stats Command Plugin
 */

export interface BotStats {
  totalUsers: number;
  activeBots: number;
  totalRevenue: number;
  uptime: string;
  todayOperations: number;
  memoryUsage: number;
  cpuUsage: number;
  responseTime: number;
}

export interface StatsCommandContext {
  chatId: string;
  userId: string;
  isAdmin: boolean;
}

export interface StatsCommandResult {
  success: boolean;
  data?: BotStats;
  error?: string;
}
