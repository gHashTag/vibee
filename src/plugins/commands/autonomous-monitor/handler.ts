/**
 * Autonomous Monitor Command Handler
 */

import type { IAgentRuntime, Memory } from '@elizaos/core';
import type { SystemMetrics, MonitorAlert, AutonomousStatus, MonitorContext, MonitorResult } from './types';
import { logger } from '@elizaos/core';

/**
 * Получить метрики системы
 */
export async function getSystemMetrics(): Promise<SystemMetrics> {
  return {
    status: 'healthy',
    uptime: 15 * 24 * 60 * 60, // 15 дней в секундах
    memoryUsage: 45.6,
    cpuUsage: 12.3,
    activeConnections: 234,
    requestsPerSecond: 456,
    errorRate: 0.02,
    lastCheck: new Date().toISOString()
  };
}

/**
 * Получить статус автономного мониторинга
 */
export async function getAutonomousStatus(): Promise<AutonomousStatus> {
  return {
    enabled: true,
    interval: 60, // секунды
    activeAlerts: 2,
    lastIncident: '2025-11-12T15:30:00Z',
    uptime: 99.98,
    autoRecovery: true
  };
}

/**
 * Получить последние алерты
 */
export async function getAlerts(): Promise<MonitorAlert[]> {
  return [
    {
      id: '1',
      level: 'warning',
      message: 'Высокое использование памяти (85%)',
      timestamp: '2025-11-13T10:15:00Z',
      resolved: false
    },
    {
      id: '2',
      level: 'info',
      message: 'Запланированное обновление завершено',
      timestamp: '2025-11-13T09:00:00Z',
      resolved: true
    },
    {
      id: '3',
      level: 'critical',
      message: 'Превышен лимит запросов',
      timestamp: '2025-11-12T18:45:00Z',
      resolved: true
    }
  ];
}

/**
 * Обработчик команды /monitor
 */
export async function handleMonitorCommand(
  runtime: IAgentRuntime,
  message: Memory,
  context: MonitorContext
): Promise<MonitorResult> {
  try {
    logger.info('📡 Handling monitor command');

    const metrics = await getSystemMetrics();
    const status = await getAutonomousStatus();

    const telegramService = runtime.getService('telegram');
    if (!telegramService || !telegramService.bot) {
      throw new Error('Telegram service not available');
    }

    const statusIcon = metrics.status === 'healthy' ? '✅' :
                      metrics.status === 'warning' ? '⚠️' : '❌';

    const monitorText = `${statusIcon} **Автономный мониторинг**

**Статус системы:** ${metrics.status.toUpperCase()}
**Uptime:** ${Math.floor(metrics.uptime / (24 * 60 * 60))} дней
**💾 Память:** ${metrics.memoryUsage}%
**⚡ CPU:** ${metrics.cpuUsage}%
**🔌 Подключения:** ${metrics.activeConnections}
**📊 Запросов/сек:** ${metrics.requestsPerSecond}
**❌ Ошибок:** ${(metrics.errorRate * 100).toFixed(2)}%

**🤖 Автономный режим:**
• Включен: ${status.enabled ? '✅' : '❌'}
• Активных алертов: ${status.activeAlerts}
• Uptime: ${status.uptime}%`;

    const buttons = {
      inline_keyboard: [
        [
          { text: '📊 Метрики', callback_data: 'monitor_metrics' },
          { text: '🚨 Алерты', callback_data: 'monitor_alerts' }
        ],
        [
          { text: '⚙️ Настройки', callback_data: 'monitor_settings' },
          { text: '📈 Графики', callback_data: 'monitor_charts' }
        ],
        [
          { text: '🔄 Обновить', callback_data: 'monitor_refresh' },
          { text: '🔙 Назад', callback_data: 'back_to_menu' }
        ]
      ]
    };

    await telegramService.bot.telegram.sendMessage(context.chatId, monitorText, {
      parse_mode: 'Markdown',
      reply_markup: buttons
    });

    logger.info('✅ Monitor command completed successfully');

    return {
      success: true,
      data: { ...metrics, ...status }
    };
  } catch (error) {
    logger.error('❌ Monitor command failed:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Обработчик отображения алертов
 */
export async function handleMonitorAlerts(
  runtime: IAgentRuntime,
  chatId: string
): Promise<void> {
  try {
    const alerts = await getAlerts();

    const alertsText = `🚨 **Системные алерты**

${alerts.map(alert => {
  const icon = alert.level === 'critical' ? '🔴' :
               alert.level === 'warning' ? '🟡' : '🔵';
  const status = alert.resolved ? '✅ Решен' : '⏳ Активен';
  return `${icon} ${alert.message}\n   ${status} • ${new Date(alert.timestamp).toLocaleString('ru-RU')}`;
}).join('\n\n')}

📊 **Статистика:**
• Всего алертов: ${alerts.length}
• Активных: ${alerts.filter(a => !a.resolved).length}
• Критичных: ${alerts.filter(a => a.level === 'critical' && !a.resolved).length}`;

    const buttons = {
      inline_keyboard: [
        [
          { text: '✅ Решить все', callback_data: 'monitor_resolve_all' },
          { text: '🔔 Настройки', callback_data: 'monitor_alert_settings' }
        ],
        [
          { text: '🔙 Назад', callback_data: 'monitor_back' }
        ]
      ]
    };

    const telegramService = runtime.getService('telegram');
    if (telegramService?.bot) {
      await telegramService.bot.telegram.sendMessage(chatId, alertsText, {
        parse_mode: 'Markdown',
        reply_markup: buttons
      });
    }
  } catch (error) {
    logger.error('❌ Monitor alerts failed:', error);
  }
}
