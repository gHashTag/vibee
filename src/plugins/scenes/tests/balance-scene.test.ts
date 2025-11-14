/**
 * Тесты для Balance Scene
 */

import { Scenes } from 'telegraf';
import { createBalanceScene } from '../balance-scene';
import type { SceneContext } from '../types';

// Мок контекста
function createMockContext(): Partial<SceneContext> {
  return {
    from: { id: '12345', username: 'testuser' },
    reply: jest.fn(),
    wizard: {
      next: jest.fn(),
      back: jest.fn(),
      selectStep: jest.fn(),
    },
    scene: {
      enter: jest.fn(),
      leave: jest.fn(),
      current: { id: 'balanceScene' },
    },
    session: {
      wizardData: {},
    },
  };
}

describe('BalanceScene', () => {
  let scene: Scenes.WizardScene<SceneContext>;

  beforeEach(() => {
    scene = createBalanceScene();
  });

  describe('Шаг 1: Обзор баланса', () => {
    it('должен показать баланс при входе в сцену', async () => {
      const ctx = createMockContext() as SceneContext;

      await scene.stepHandlers[0](ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('💎 Ваш баланс'),
        expect.objectContaining({
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.arrayContaining([
              expect.arrayContaining([
                expect.objectContaining({ text: '💳 Пополнить баланс' }),
              ]),
              expect.arrayContaining([
                expect.objectContaining({ text: '📊 История операций' }),
              ]),
            ]),
          }),
        })
      );
    });

    it('должен показать информацию о подписке если она есть', async () => {
      const ctx = createMockContext() as SceneContext;
      // Мокаем getUserBalance чтобы вернуть подписку
      jest.spyOn(require('../balance-scene'), 'getUserBalance')
        .mockResolvedValue({
          userId: '12345',
          rubles: 500,
          stars: 250,
          subscription: {
            plan: 'NEUROTESTER',
            expiresAt: Date.now() + 15 * 24 * 60 * 60 * 1000,
          },
          history: [],
        });

      await scene.stepHandlers[0](ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('💫 Подписка: NEUROTESTER')
      );
    });
  });

  describe('Шаг 2: Выбор действия', () => {
    it('должен перейти к пополнению баланса', async () => {
      const ctx = createMockContext() as SceneContext;
      ctx.match = ['topup'];

      await scene.stepHandlers[1](ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('💳 Пополнение баланса'),
        expect.objectContaining({
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.arrayContaining([
              expect.arrayContaining([
                expect.objectContaining({ text: '100₽ (50 Stars)' }),
              ]),
            ]),
          }),
        })
      );
    });

    it('должен показать историю операций', async () => {
      const ctx = createMockContext() as SceneContext;
      ctx.match = ['history'];

      await scene.stepHandlers[1](ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('📊 История операций')
      );
    });

    it('должен показать управление подпиской', async () => {
      const ctx = createMockContext() as SceneContext;
      ctx.match = ['subscription'];

      await scene.stepHandlers[1](ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('💫 Управление подпиской')
      );
    });

    it('должен показать бонусы', async () => {
      const ctx = createMockContext() as SceneContext;
      ctx.match = ['bonuses'];

      await scene.stepHandlers[1](ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('🎁 Ваши бонусы')
      );
    });

    it('должен показать вывод средств', async () => {
      const ctx = createMockContext() as SceneContext;
      ctx.match = ['withdraw'];

      await scene.stepHandlers[1](ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('💸 Вывод средств')
      );
    });
  });

  describe('Шаг 3: Выбор суммы пополнения', () => {
    it('должен показать варианты сумм', async () => {
      const ctx = createMockContext() as SceneContext;
      ctx.match = ['topup_299'];

      await scene.stepHandlers[2](ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('299₽'),
        expect.objectContaining({
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.arrayContaining([
              expect.arrayContaining([
                expect.objectContaining({ text: '💳 Банковская карта' }),
                expect.objectContaining({ text: '⭐ Telegram Stars' }),
              ]),
            ]),
          }),
        })
      );
    });

    it('должен запросить ввод произвольной суммы', async () => {
      const ctx = createMockContext() as SceneContext;
      ctx.match = ['topup_custom'];

      await scene.stepHandlers[2](ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('💫 Пополнение на произвольную сумму'),
        expect.any(Object)
      );
    });
  });

  describe('getUserBalance', () => {
    it('должен вернуть корректные данные баланса', async () => {
      const { getUserBalance } = require('../balance-scene');
      const balance = await getUserBalance('12345');

      expect(balance).toHaveProperty('userId', '12345');
      expect(balance).toHaveProperty('rubles');
      expect(balance).toHaveProperty('stars');
      expect(balance).toHaveProperty('history');
    });
  });
});
