import { Plugin } from '@elizaos/core';
import { deployCommand, deployStatus, deployLogs } from './handler';

export const deployCommandsPlugin: Plugin = {
  name: 'deploy-commands',
  description: 'Команды для управления деплоем',

  actions: [
    {
      name: 'deploy_command',
      description: 'Основная команда /deploy',
      handler: deployCommand,
    },
    {
      name: 'deploy_status',
      description: 'Показать статус деплоя',
      handler: deployStatus,
    },
    {
      name: 'deploy_logs',
      description: 'Показать логи сервера',
      handler: deployLogs,
    },
  ],
};

export default deployCommandsPlugin;
