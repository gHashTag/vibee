/**
 * Autonomous Monitor Command Factory
 */

import { Plugin, Service } from '@elizaos/core';
import type { IAgentRuntime, Memory } from '@elizaos/core';
import type { MonitorContext } from './types';
import { handleMonitorCommand, handleMonitorAlerts } from './handler';
import { logger } from '@elizaos/core';

/**
 * Autonomous Monitor Service
 */
class AutonomousMonitorService extends Service {
  static serviceType = 'autonomous-monitor-command';

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  static async start(runtime: IAgentRuntime): Promise<AutonomousMonitorService> {
    const service = new AutonomousMonitorService(runtime);
    await service.initialize(runtime);
    return service;
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('📡 AutonomousMonitorService initializing...');

    runtime.on('TELEGRAM_COMMAND_MONITOR', async (data: any) => {
      const message = data.memory || data;
      const chatId = message.content?.channelId || message.content?.chatId;
      const userId = message.content?.userId || 'unknown';

      if (!chatId) return;

      const context: MonitorContext = {
        chatId,
        userId,
        isAdmin: true
      };

      await handleMonitorCommand(runtime, message, context);
    });

    runtime.on('TELEGRAM_CALLBACK_MONITOR', async (data: any) => {
      const message = data.memory || data;
      const callbackData = message.content?.callback_data;
      const chatId = message.content?.channelId || message.content?.chatId;

      if (!chatId) return;

      if (callbackData === 'monitor_alerts') {
        await handleMonitorAlerts(runtime, chatId);
      }
    });

    logger.info('✅ AutonomousMonitorService initialized');
  }
}

/**
 * Создание Autonomous Monitor Command Plugin
 */
export function createAutonomousMonitorCommand(): Plugin {
  return {
    name: 'autonomous-monitor-command',
    description: 'Автономный мониторинг системы и алерты',
    version: '1.0.0',
    services: [AutonomousMonitorService],
    actions: []
  };
}
