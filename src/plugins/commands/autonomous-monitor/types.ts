/**
 * Types for Autonomous Monitor Command Plugin
 */

export interface SystemMetrics {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
  requestsPerSecond: number;
  errorRate: number;
  lastCheck: string;
}

export interface MonitorAlert {
  id: string;
  level: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
}

export interface AutonomousStatus {
  enabled: boolean;
  interval: number;
  activeAlerts: number;
  lastIncident: string;
  uptime: number;
  autoRecovery: boolean;
}

export interface MonitorContext {
  chatId: string;
  userId: string;
  isAdmin: boolean;
}

export interface MonitorResult {
  success: boolean;
  data?: SystemMetrics | AutonomousStatus | MonitorAlert[];
  error?: string;
}
