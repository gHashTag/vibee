/**
 * Тесты для Invite Scene
 */

import { Scenes } from 'telegraf';
import { createInviteScene } from '../invite-scene';
import type { SceneContext } from '../types';

function createMockContext(): Partial<SceneContext> {
  return {
    from: { id: '12345', username: 'testuser', first_name: 'Test' },
    reply: jest.fn(),
    wizard: {
      next: jest.fn(),
      back: jest.fn(),
      selectStep: jest.fn(),
    },
    scene: {
      enter: jest.fn(),
      leave: jest.fn(),
      current: { id: 'inviteScene' },
    },
    session: {
      wizardData: {},
    },
  };
}

describe('InviteScene', () => {
  let scene: Scenes.WizardScene<SceneContext>;

  beforeEach(() => {
    scene = createInviteScene();
  });

  describe('Шаг 1: Главное меню', () => {
    it('должен показать меню приглашений', async () => {
      const ctx = createMockContext() as SceneContext;

      await scene.stepHandlers[0](ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('👥 Пригласите друзей и получите бонусы!')
      );
    });

    it('должен показать все опции приглашения', async () => {
      const ctx = createMockContext() as SceneContext;

      await scene.stepHandlers[0](ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.arrayContaining([
              expect.arrayContaining([
                expect.objectContaining({ text: '📤 Создать пригласительную ссылку' }),
              ]),
              expect.arrayContaining([
                expect.objectContaining({ text: '👤 Пригласить по username' }),
              ]),
              expect.arrayContaining([
                expect.objectContaining({ text: '📋 Скопировать реферальный код' }),
              ]),
              expect.arrayContaining([
                expect.objectContaining({ text: '📊 Мои приглашения' }),
              ]),
              expect.arrayContaining([
                expect.objectContaining({ text: '🎁 Бонусы и награды' }),
              ]),
            ]),
          }),
        })
      );
    });
  });

  describe('Шаг 2: Обработка выбора', () => {
    it('должен создать пригласительную ссылку', async () => {
      const ctx = createMockContext() as SceneContext;
      ctx.match = ['create_link'];

      await scene.stepHandlers[1](ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('📤 Ваша пригласительная ссылка')
      );
      expect(ctx.session.wizardData).toHaveProperty('inviteCode');
      expect(ctx.session.wizardData).toHaveProperty('inviteLink');
    });

    it('должен запросить username для приглашения', async () => {
      const ctx = createMockContext() as SceneContext;
      ctx.match = ['invite_username'];

      await scene.stepHandlers[1](ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('👤 Приглашение по username')
      );
    });

    it('должен показать реферальный код', async () => {
      const ctx = createMockContext() as SceneContext;
      ctx.match = ['copy_code'];

      await scene.stepHandlers[1](ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('📋 Ваш реферальный код')
      );
      expect(ctx.session.wizardData).toHaveProperty('inviteCode');
    });

    it('должен показать статистику приглашений', async () => {
      const ctx = createMockContext() as SceneContext;
      ctx.match = ['my_invites'];

      // Мокаем функцию получения статистики
      jest.spyOn(require('../invite-scene'), 'getInviteStats')
        .mockReturnValue({
          totalInvited: 5,
          activeUsers: 3,
          earnedStars: 250,
          totalBonuses: 3,
          recentInvites: [],
        });

      await scene.stepHandlers[1](ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('📊 Статистика приглашений')
      );
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('5'),
        expect.any(Object)
      );
    });

    it('должен показать информацию о бонусах', async () => {
      const ctx = createMockContext() as SceneContext;
      ctx.match = ['rewards'];

      await scene.stepHandlers[1](ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('🎁 Программа лояльности')
      );
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('50 Stars')
      );
    });
  });

  describe('Шаг 3: Ввод username', () => {
    it('должен валидировать корректный username', async () => {
      const ctx = createMockContext() as SceneContext;
      ctx.message = { text: 'username123' } as any;

      await scene.stepHandlers[2](ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('✅ Приглашение отправлено!')
      );
    });

    it('должен отклонить некорректный username', async () => {
      const ctx = createMockContext() as SceneContext;
      ctx.message = { text: 'ab' } as any; // слишком короткий

      await scene.stepHandlers[2](ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('❌ Некорректный username')
      );
    });

    it('должен отклонить username с недопустимыми символами', async () => {
      const ctx = createMockContext() as SceneContext;
      ctx.message = { text: 'user@#$%' } as any;

      await scene.stepHandlers[2](ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('❌ Некорректный username')
      );
    });

    it('должен обработать отмену', async () => {
      const ctx = createMockContext() as SceneContext;
      ctx.match = ['cancel'];

      await scene.stepHandlers[2](ctx);

      expect(ctx.wizard.back).toHaveBeenCalled();
    });
  });

  describe('Вспомогательные функции', () => {
    describe('generateInviteCode', () => {
      it('должен сгенерировать уникальный код', () => {
        const { generateInviteCode } = require('../invite-scene');
        const code1 = generateInviteCode('12345');
        const code2 = generateInviteCode('12345');

        expect(code1).toMatch(/^VB-[A-Z0-9]{6}-[a-z0-9]+$/);
        expect(code1).toBe(code2); // Одинаковые для одинаковых userId
      });

      it('должен генерировать разные коды для разных пользователей', () => {
        const { generateInviteCode } = require('../invite-scene');
        const code1 = generateInviteCode('12345');
        const code2 = generateInviteCode('67890');

        expect(code1).not.toBe(code2);
      });
    });

    describe('getInviteStats', () => {
      it('должен вернуть статистику пользователя', () => {
        const { getInviteStats } = require('../invite-scene');
        const stats = getInviteStats('12345');

        expect(stats).toHaveProperty('totalInvited');
        expect(stats).toHaveProperty('activeUsers');
        expect(stats).toHaveProperty('earnedStars');
        expect(stats).toHaveProperty('recentInvites');
        expect(Array.isArray(stats.recentInvites)).toBe(true);
      });
    });
  });
});
