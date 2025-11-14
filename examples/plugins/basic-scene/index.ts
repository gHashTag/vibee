/**
 * Basic Scene Example
 *
 * Этот плагин демонстрирует создание многошагового визарда (сцены).
 * Сцена позволяет создать интерактивное взаимодействие с пользователем
 * через последовательность шагов.
 */

import { Plugin, Action, Service, IAgentRuntime, Memory, State } from '@elizaos/core';
import { logger } from '@elizaos/core';

/**
 * Типы для состояния сцены
 */
interface SceneState extends State {
  step?: number;
  data?: Record<string, any>;
  sceneId?: string;
}

/**
 * Сервис для управления сценами
 * Отвечает за состояние активных сцен пользователей
 */
class SceneManagerService extends Service {
  static serviceType = 'scene-manager';
  capabilityDescription = 'Управление интерактивными сценами и визардами';

  private scenes = new Map<string, Map<string, any>>();

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  /**
   * Получить состояние сцены пользователя
   */
  getSceneState(userId: string, sceneId: string): any {
    const userScenes = this.scenes.get(userId);
    if (!userScenes) {
      return null;
    }
    return userScenes.get(sceneId);
  }

  /**
   * Сохранить состояние сцены
   */
  setSceneState(userId: string, sceneId: string, state: any): void {
    if (!this.scenes.has(userId)) {
      this.scenes.set(userId, new Map());
    }
    this.scenes.get(userId)!.set(sceneId, state);
  }

  /**
   * Завершить сцену
   */
  endScene(userId: string, sceneId: string): void {
    const userScenes = this.scenes.get(userId);
    if (userScenes) {
      userScenes.delete(sceneId);
      if (userScenes.size === 0) {
        this.scenes.delete(userId);
      }
    }
  }

  /**
   * Получить все активные сцены пользователя
   */
  getUserScenes(userId: string): string[] {
    const userScenes = this.scenes.get(userId);
    return userScenes ? Array.from(userScenes.keys()) : [];
  }

  static async start(runtime: IAgentRuntime): Promise<SceneManagerService> {
    logger.info('[SceneManagerService] Starting...');
    return new SceneManagerService(runtime);
  }

  async stop(): Promise<void> {
    logger.info('[SceneManagerService] Stopping...');
    this.scenes.clear();
  }
}

/**
 * Действие для запуска сцены
 */
const startSceneAction: Action = {
  name: 'START_SCENE',
  similes: ['START_WIZARD', 'НАЧАТЬ', 'СТАРТ'],
  description: 'Запускает интерактивную сцену с пользователем',

  validate: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<boolean> => {
    const text = message.content.text?.toLowerCase() || '';
    return text.includes('начать сцену') || text.includes('start scene') || text.includes('старт');
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: any,
    responses: Memory[]
  ): Promise<any> => {
    try {
      const userId = message.userId;
      const sceneId = 'basic-wizard';

      // Получаем сервис управления сценами
      const sceneManager = runtime.getService(SceneManagerService.serviceType);

      if (!sceneManager) {
        throw new Error('SceneManagerService не найден');
      }

      // Проверяем, не активна ли уже сцена
      const existingScene = sceneManager.getSceneState(userId, sceneId);

      if (existingScene) {
        await callback({
          text: 'Сцена уже активна. Используйте /stop для завершения или продолжите выполнение текущего шага.'
        });
        return { success: true, text: 'Scene already active' };
      }

      // Запускаем новую сцену
      const initialState = {
        step: 1,
        data: {},
        sceneId,
        startedAt: Date.now()
      };

      sceneManager.setSceneState(userId, sceneId, initialState);

      // Отправляем приветственное сообщение
      await callback({
        text:
          'Добро пожаловать в интерактивную сцену! 🎭\n\n' +
          'Это пример многошагового взаимодействия.\n' +
          'Шаг 1 из 3: Пожалуйста, введите ваше имя'
      });

      logger.info('[START_SCENE] Scene started', { userId, sceneId, step: 1 });

      return {
        success: true,
        text: 'Scene started',
        data: { sceneId, step: 1 }
      };
    } catch (error) {
      logger.error('[START_SCENE] Error:', error);

      await callback({
        text: 'Произошла ошибка при запуске сцены 😞'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },

  examples: [
    [
      {
        user: '{{user1}}',
        content: { text: 'начать сцену' }
      },
      {
        user: '{{agent}}',
        content: {
          text: 'Добро пожаловать в интерактивную сцену! 🎭\n\nШаг 1 из 3: Пожалуйста, введите ваше имя',
          action: 'START_SCENE'
        }
      }
    ]
  ]
};

/**
 * Действие для обработки ввода в сцене
 */
const sceneInputAction: Action = {
  name: 'SCENE_INPUT',
  similes: ['CONTINUE', 'ПРОДОЛЖИТЬ', 'ВВОД'],
  description: 'Обрабатывает ввод пользователя в активной сцене',

  validate: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<boolean> => {
    // Проверяем, что есть активная сцена
    const sceneManager = runtime.getService(SceneManagerService.serviceType);
    if (!sceneManager) return false;

    const userId = message.userId;
    const scenes = sceneManager.getUserScenes(userId);

    return scenes.length > 0;
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: any,
    responses: Memory[]
  ): Promise<any> => {
    try {
      const userId = message.userId;
      const sceneManager = runtime.getService(SceneManagerService.serviceType);

      if (!sceneManager) {
        throw new Error('SceneManagerService не найден');
      }

      // Получаем активную сцену
      const scenes = sceneManager.getUserScenes(userId);
      if (scenes.length === 0) {
        await callback({
          text: 'Нет активных сцен. Используйте /start для начала.'
        });
        return { success: true, text: 'No active scenes' };
      }

      const sceneId = scenes[0]; // Берем первую активную сцену
      let sceneState = sceneManager.getSceneState(userId, sceneId);

      if (!sceneState) {
        await callback({
          text: 'Ошибка состояния сцены. Попробуйте начать заново.'
        });
        return { success: false, text: 'Scene state error' };
      }

      const text = message.content.text || '';
      const step = sceneState.step;
      const data = sceneState.data || {};

      // Обрабатываем ввод в зависимости от шага
      switch (step) {
        case 1:
          // Шаг 1: Имя
          data.name = text;
          sceneState.step = 2;
          sceneState.data = data;

          await callback({
            text:
              `Отлично, ${data.name}! 🎉\n` +
              'Шаг 2 из 3: Какой ваш любимый цвет?'
          });
          break;

        case 2:
          // Шаг 2: Цвет
          data.color = text;
          sceneState.step = 3;
          sceneState.data = data;

          await callback({
            text:
              `Прекрасный выбор, ${data.color}! 🌈\n` +
              'Шаг 3 из 3: Опишите себя одним словом'
          });
          break;

        case 3:
          // Шаг 3: Описание
          data.description = text;
          sceneState.step = 4;
          sceneState.data = data;

          // Сцена завершена
          await callback({
            text:
              `Спасибо за участие! ✨\n\n` +
              `Вот ваши данные:\n` +
              `• Имя: ${data.name}\n` +
              `• Цвет: ${data.color}\n` +
              `• Описание: ${data.description}\n\n` +
              `Сцена завершена! 🎊`
          });

          logger.info('[SCENE_INPUT] Scene completed', {
            userId,
            sceneId,
            data
          });

          // Очищаем состояние сцены
          sceneManager.endScene(userId, sceneId);

          return {
            success: true,
            text: 'Scene completed',
            data: { sceneId, ...data }
          };

        default:
          await callback({
            text: 'Неизвестный шаг сцены. Перезапускаем...'
          });
          sceneManager.endScene(userId, sceneId);
          break;
      }

      // Сохраняем обновленное состояние
      sceneManager.setSceneState(userId, sceneId, sceneState);

      return {
        success: true,
        text: 'Input processed',
        data: { sceneId, step: sceneState.step }
      };
    } catch (error) {
      logger.error('[SCENE_INPUT] Error:', error);

      await callback({
        text: 'Произошла ошибка при обработке ввода 😞'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },

  examples: [
    [
      {
        user: '{{user1}}',
        content: { text: 'Алексей' }
      },
      {
        user: '{{agent}}',
        content: {
          text: 'Отлично, Алексей! 🎉\nШаг 2 из 3: Какой ваш любимый цвет?',
          action: 'SCENE_INPUT'
        }
      }
    ]
  ]
};

/**
 * Действие для остановки сцены
 */
const stopSceneAction: Action = {
  name: 'STOP_SCENE',
  similes: ['END_SCENE', 'ЗАВЕРШИТЬ', 'СТОП'],
  description: 'Останавливает активную сцену',

  validate: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<boolean> => {
    const text = message.content.text?.toLowerCase() || '';
    return text.includes('стоп') || text.includes('stop') || text.includes('завершить');
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: any,
    responses: Memory[]
  ): Promise<any> => {
    try {
      const userId = message.userId;
      const sceneManager = runtime.getService(SceneManagerService.serviceType);

      if (!sceneManager) {
        throw new Error('SceneManagerService не найден');
      }

      const scenes = sceneManager.getUserScenes(userId);

      if (scenes.length === 0) {
        await callback({
          text: 'Нет активных сцен для остановки.'
        });
        return { success: true, text: 'No scenes to stop' };
      }

      // Останавливаем все активные сцены
      scenes.forEach(sceneId => {
        sceneManager.endScene(userId, sceneId);
      });

      await callback({
        text: 'Сцена остановлена. До свидания! 👋'
      });

      logger.info('[STOP_SCENE] Scene stopped', { userId, scenes });

      return {
        success: true,
        text: 'Scenes stopped',
        data: { stoppedScenes: scenes }
      };
    } catch (error) {
      logger.error('[STOP_SCENE] Error:', error);

      await callback({
        text: 'Произошла ошибка при остановке сцены 😞'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },

  examples: [
    [
      {
        user: '{{user1}}',
        content: { text: 'стоп' }
      },
      {
        user: '{{agent}}',
        content: {
          text: 'Сцена остановлена. До свидания! 👋',
          action: 'STOP_SCENE'
        }
      }
    ]
  ]
};

/**
 * Действие для просмотра состояния сцены
 */
const getSceneStatusAction: Action = {
  name: 'GET_SCENE_STATUS',
  similes: ['STATUS', 'СТАТУС'],
  description: 'Показывает статус текущей сцены',

  validate: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<boolean> => {
    const text = message.content.text?.toLowerCase() || '';
    return text.includes('статус') || text.includes('status');
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: any,
    responses: Memory[]
  ): Promise<any> => {
    try {
      const userId = message.userId;
      const sceneManager = runtime.getService(SceneManagerService.serviceType);

      if (!sceneManager) {
        throw new Error('SceneManagerService не найден');
      }

      const scenes = sceneManager.getUserScenes(userId);

      if (scenes.length === 0) {
        await callback({
          text: 'Нет активных сцен.'
        });
        return { success: true, text: 'No active scenes' };
      }

      let statusText = 'Активные сцены:\n\n';
      scenes.forEach(sceneId => {
        const sceneState = sceneManager.getSceneState(userId, sceneId);
        if (sceneState) {
          statusText += `• ${sceneId} (шаг ${sceneState.step})\n`;
        }
      });

      await callback({
        text: statusText
      });

      return {
        success: true,
        text: 'Status retrieved',
        data: { scenes }
      };
    } catch (error) {
      logger.error('[GET_SCENE_STATUS] Error:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
};

/**
 * Основной плагин
 */
export const basicScenePlugin: Plugin = {
  name: 'basic-scene-plugin',
  description: 'Пример плагина сцены для демонстрации интерактивных визардов',

  // Регистрируем сервис
  services: [SceneManagerService],

  // Регистрируем действия
  actions: [startSceneAction, sceneInputAction, stopSceneAction, getSceneStatusAction],

  // Инициализация
  async init(config, runtime) {
    logger.info('[BasicScenePlugin] Инициализация...');
    logger.info('[BasicScenePlugin] Доступные команды:', [
      'начать сцену',
      'ввод на любом шаге',
      'стоп',
      'статус'
    ]);
  }
};

export default basicScenePlugin;

/**
 * ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ:
 *
 * Сцены (Wizard Scenes) позволяют создавать многошаговые взаимодействия.
 *
 * ОСНОВНЫЕ КОМПОНЕНТЫ:
 *
 * 1. SceneManagerService - сервис для управления состоянием сцен
 * 2. Actions - действия для обработки различных этапов сцены
 *
 * ЖИЗНЕННЫЙ ЦИКЛ СЦЕНЫ:
 *
 * 1. START_SCENE - запуск новой сцены
 * 2. SCENE_INPUT - обработка ввода пользователя
 * 3. STOP_SCENE - остановка сцены
 * 4. GET_SCENE_STATUS - просмотр статуса
 *
 * ИСПОЛЬЗОВАНИЕ:
 *
 * 1. В персонаже:
 *    import { basicScenePlugin } from './examples/plugins/basic-scene';
 *
 * 2. Пользователь пишет "начать сцену"
 * 3. Агент запускает визард
 * 4. Пользователь проходит шаги
 * 5. Сцена завершается
 *
 * ЛУЧШИЕ ПРАКТИКИ:
 *
 * 1. Всегда проверяйте состояние сцены перед обработкой
 * 2. Сохраняйте данные на каждом шаге
 * 3. Обрабатывайте ошибки gracefully
 * 4. Очищайте состояние после завершения
 * 5. Логируйте важные события
 * 6. Предоставляйте понятные инструкции
 */
