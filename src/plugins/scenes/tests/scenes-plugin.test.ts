/**
 * Тесты для Scenes Plugin
 */

import { ScenesService } from '../scenes-plugin';
import { IAgentRuntime } from '@elizaos/core';

describe('ScenesService', () => {
  let runtime: Partial<IAgentRuntime>;
  let service: ScenesService;

  beforeEach(() => {
    runtime = {
      getService: jest.fn((name: string) => {
        if (name === 'telegram') {
          return {
            bot: {
              use: jest.fn(),
              command: jest.fn(),
              action: jest.fn(),
              on: jest.fn(),
              launch: jest.fn(),
            },
          };
        }
        return null;
      }),
      logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      },
    };

    service = new ScenesService(runtime as IAgentRuntime);
  });

  describe('Инициализация', () => {
    it('должен успешно инициализироваться', async () => {
      await service.initialize(runtime as IAgentRuntime);

      expect(runtime.getService).toHaveBeenCalledWith('telegram');
    });

    it('должен подождать TelegramService если он ещё не готов', async () => {
      runtime.getService = jest.fn()
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(null)
        .mockReturnValue({
          bot: {
            use: jest.fn(),
            command: jest.fn(),
            action: jest.fn(),
          },
        });

      const startTime = Date.now();
      await service.initialize(runtime as IAgentRuntime);
      const elapsed = Date.now() - startTime;

      expect(elapsed).toBeGreaterThanOrEqual(1000); // Ожидание около 1-2 сек
      expect(runtime.getService).toHaveBeenCalledTimes(3);
    });

    it('должен завершить с предупреждением если TelegramService не найден', async () => {
      runtime.getService = jest.fn().mockReturnValue(null);

      await service.initialize(runtime as IAgentRuntime);

      expect(runtime.logger?.warn).toHaveBeenCalledWith(
        expect.stringContaining('TelegramService not found')
      );
    });
  });

  describe('Настройка сцен', () => {
    let mockBot: any;

    beforeEach(() => {
      mockBot = {
        use: jest.fn(),
        command: jest.fn(),
        action: jest.fn(),
      };

      runtime.getService = jest.fn().mockReturnValue({
        bot: mockBot,
      });
    });

    it('должен зарегистрировать все сцены', async () => {
      await service.initialize(runtime as IAgentRuntime);

      // Проверяем, что bot.use был вызван для middleware сцен
      expect(mockBot.use).toHaveBeenCalled();
    });

    it('должен зарегистрировать команды', async () => {
      await service.initialize(runtime as IAgentRuntime);

      expect(mockBot.command).toHaveBeenCalledWith('lipsync', expect.any(Function));
      expect(mockBot.command).toHaveBeenCalledWith('reels', expect.any(Function));
      expect(mockBot.command).toHaveBeenCalledWith('subscribe', expect.any(Function));
      expect(mockBot.command).toHaveBeenCalledWith('pay_stars', expect.any(Function));
      expect(mockBot.command).toHaveBeenCalledWith('pay_rub', expect.any(Function));
      expect(mockBot.command).toHaveBeenCalledWith('invite', expect.any(Function));
      expect(mockBot.command).toHaveBeenCalledWith('help', expect.any(Function));
      expect(mockBot.command).toHaveBeenCalledWith('balance', expect.any(Function));
      expect(mockBot.command).toHaveBeenCalledWith('menu', expect.any(Function));
    });
  });

  describe('Статические методы', () => {
    it('должен создать сервис через статический метод start', async () => {
      const mockRuntime = {
        getService: jest.fn().mockReturnValue({
          bot: {
            use: jest.fn(),
            command: jest.fn(),
          },
        }),
      };

      const service = await ScenesService.start(mockRuntime as IAgentRuntime);

      expect(service).toBeInstanceOf(ScenesService);
    });
  });

  describe('Жизненный цикл', () => {
    it('должен корректно останавливаться', async () => {
      await service.initialize(runtime as IAgentRuntime);
      await service.stop();

      expect(service['stage']).toBeNull();
    });

    it('должен корректно очищаться', async () => {
      await service.initialize(runtime as IAgentRuntime);
      await service.cleanup();

      expect(service['stage']).toBeNull();
    });
  });
});

describe('ScenesPlugin', () => {
  let runtime: Partial<IAgentRuntime>;

  beforeEach(() => {
    runtime = {
      getService: jest.fn(),
      logger: {
        info: jest.fn(),
      },
    };
  });

  it('должен инициализировать ScenesService', async () => {
    const { scenesPlugin } = require('../scenes-plugin');
    runtime.getService = jest.fn().mockReturnValue({
      bot: {
        use: jest.fn(),
        command: jest.fn(),
      },
    });

    await scenesPlugin.initialize(runtime as IAgentRuntime);

    expect(runtime.logger?.info).toHaveBeenCalledWith(
      expect.stringContaining('ScenesPlugin')
    );
  });
});
