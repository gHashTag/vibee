/**
 * AI Heroes Scene Plugin
 * Создание супергероев с ИИ
 */

import { Scenes, Markup } from 'telegraf';
import { logger } from '@elizaos/core';
import type { MyContext } from '../../telegram-commands-plugin';

interface WizardData {
  heroType?: string;
  heroName?: string;
  powers?: string[];
  style?: string;
  pose?: string;
  background?: string;
  aspect?: string;
}

export const createAiHeroesScene = (): Scenes.WizardScene<MyContext> => {
  const scene = new Scenes.WizardScene<MyContext>(
    'aiHeroesWizard',

    // Шаг 1: Выбор типа героя
    async (ctx) => {
      await ctx.reply(
        '🦸‍♂️ **Генератор ИИ Героев**\n\n' +
        'Создайте своего уникального супергероя с помощью ИИ!\n\n' +
        '🎨 **Выберите тип героя:**',
        Markup.inlineKeyboard([
          [Markup.button.callback('🦸‍♂️ Супергерой', 'type_hero')],
          [Markup.button.callback('🦸‍♀️ Супергероиня', 'type_heroine')],
          [Markup.button.callback('🦹‍♂️ Злодей', 'type_villain')],
          [Markup.button.callback('🦹‍♀️ Злодейка', 'type_villainess')],
          [Markup.button.callback('🧙‍♂️ Маг', 'type_wizard')],
          [Markup.button.callback('🐉 Дракон', 'type_dragon')],
          [Markup.button.callback('🤖 Робот', 'type_robot')],
        ])
      );
      return ctx.wizard.next();
    },

    // Шаг 2: Имя героя и суперсилы
    async (ctx) => {
      const heroType = ctx.match?.[1];
      const wizardData = ctx.wizard.state as WizardData;

      const typeMap: Record<string, string> = {
        type_hero: 'male superhero',
        type_heroine: 'female superhero',
        type_villain: 'male villain',
        type_villainess: 'female villain',
        type_wizard: 'wizard',
        type_dragon: 'dragon',
        type_robot: 'robot',
      };

      wizardData.heroType = typeMap[heroType] || 'superhero';

      await ctx.reply(
        `✅ Тип героя: ${wizardData.heroType}\n\n` +
        '📝 **Введите имя вашего героя:**\n' +
        'Например: "Байт-Шторм", "Фото-Маг", "Люкс"'
      );
      return ctx.wizard.next();
    },

    // Шаг 3: Выбор суперсил
    async (ctx) => {
      if (!ctx.message || !('text' in ctx.message) || !ctx.message.text) {
        await ctx.reply('❌ Пожалуйста, введите имя героя');
        return;
      }

      const wizardData = ctx.wizard.state as WizardData;
      wizardData.heroName = ctx.message.text;

      await ctx.reply(
        '⚡ **Выберите суперсилы (можно несколько):**\n\n' +
        '✨ Полный список появится после выбора',
        Markup.inlineKeyboard([
          [Markup.button.callback('🔥 Огонь', 'power_fire')],
          [Markup.button.callback('❄️ Лед', 'power_ice')],
          [Markup.button.callback('⚡ Молния', 'power_lightning')],
          [Markup.button.callback('🛡️ Щит', 'power_shield')],
          [Markup.button.callback('🦅 Полет', 'power_flight')],
          [Markup.button.callback('💪 Сила', 'power_strength')],
          [Markup.button.callback('🔮 Магия', 'power_magic')],
          [Markup.button.callback('🌟 Свет', 'power_light')],
          [Markup.button.callback('🌑 Тьма', 'power_darkness')],
          [Markup.button.callback('✅ Продолжить', 'power_done')],
        ])
      );

      return ctx.wizard.next();
    },

    // Шаг 4: Выбор стиля и позы
    async (ctx) => {
      const power = ctx.match?.[1];
      const wizardData = ctx.wizard.state as WizardData;

      if (power === 'power_done') {
        await ctx.reply(
          `⚡ **Ваши суперсилы выбраны!**\n\n` +
          '🎨 **Выберите художественный стиль:**',
          Markup.inlineKeyboard([
            [Markup.button.callback('📚 Комикс Marvel/DC', 'style_comics')],
            [Markup.button.callback('🎨 Аниме/Манга', 'style_anime')],
            [Markup.button.callback('🖌️ Реалистичный', 'style_realistic')],
            [Markup.button.callback('🎭 Мультяшный', 'style_cartoon')],
            [Markup.button.callback('✨ Фэнтези', 'style_fantasy')],
            [Markup.button.callback('🌆 Киберпанк', 'style_cyberpunk')],
          ])
        );

        return ctx.wizard.next();
      }

      // Обработка выбора силы
      if (!wizardData.powers) {
        wizardData.powers = [];
      }

      const powerMap: Record<string, string> = {
        power_fire: 'fire',
        power_ice: 'ice',
        power_lightning: 'lightning',
        power_shield: 'shield',
        power_flight: 'flight',
        power_strength: 'super strength',
        power_magic: 'magic',
        power_light: 'light',
        power_darkness: 'darkness',
      };

      if (powerMap[power]) {
        if (!wizardData.powers.includes(powerMap[power])) {
          wizardData.powers.push(powerMap[power]);
          await ctx.reply(`✅ Добавлена сила: ${powerMap[power]}`);
        } else {
          await ctx.reply(`⚠️ Эта сила уже выбрана`);
        }
      }

      return ctx.wizard.back();
    },

    // Шаг 5: Поза
    async (ctx) => {
      const style = ctx.match?.[1];
      const wizardData = ctx.wizard.state as WizardData;

      const styleMap: Record<string, string> = {
        style_comics: 'comic book style, vibrant colors',
        style_anime: 'anime manga style',
        style_realistic: 'photorealistic',
        style_cartoon: 'cartoon illustration',
        style_fantasy: 'fantasy art style',
        style_cyberpunk: 'cyberpunk neon style',
      };

      wizardData.style = styleMap[style] || 'comic book style';

      await ctx.reply(
        '🦸 **Выберите позу героя:**',
        Markup.inlineKeyboard([
          [Markup.button.callback('💪 Динамичная поза', 'pose_dynamic')],
          [Markup.button.callback('🛡️ Боевая стойка', 'pose_battle')],
          [Markup.button.callback('🦅 В полете', 'pose_flying')],
          [Markup.button.callback('🧘 Портрет', 'pose_portrait')],
          [Markup.button.callback('⚔️ С оружием', 'pose_weapon')],
          [Markup.button.callback('🔥 Поза силы', 'pose_power')],
        ])
      );

      return ctx.wizard.next();
    },

    // Шаг 6: Фон
    async (ctx) => {
      const pose = ctx.match?.[1];
      const wizardData = ctx.wizard.state as WizardData;

      const poseMap: Record<string, string> = {
        pose_dynamic: 'dynamic action pose',
        pose_battle: 'battle stance',
        pose_flying: 'flying pose',
        pose_portrait: 'heroic portrait',
        pose_weapon: 'holding weapon',
        pose_power: 'power pose',
      };

      wizardData.pose = poseMap[pose] || 'dynamic pose';

      await ctx.reply(
        '🌆 **Выберите фон:**',
        Markup.inlineKeyboard([
          [Markup.button.callback('🏙️ Городской пейзаж', 'background_city')],
          [Markup.button.callback('🌋 Вулкан', 'background_volcano')],
          [Markup.button.callback('🌌 Космос', 'background_space')],
          [Markup.button.callback('🌲 Лес', 'background_forest')],
          [Markup.button.callback('🏰 Замок', 'background_castle')],
          [Markup.button.callback('🌊 Океан', 'background_ocean')],
          [Markup.button.callback('✨ Магический', 'background_magic')],
          [Markup.button.callback('🎭 Темный фон', 'background_dark')],
        ])
      );

      return ctx.wizard.next();
    },

    // Шаг 7: Формат и подтверждение
    async (ctx) => {
      const background = ctx.match?.[1];
      const wizardData = ctx.wizard.state as WizardData;

      const bgMap: Record<string, string> = {
        background_city: 'city skyline',
        background_volcano: 'volcanic landscape',
        background_space: 'cosmic space',
        background_forest: 'mystical forest',
        background_castle: 'medieval castle',
        background_ocean: 'ocean waves',
        background_magic: 'magical realm',
        background_dark: 'dark dramatic background',
      };

      wizardData.background = bgMap[background] || 'city skyline';

      await ctx.reply(
        '📐 **Выберите формат:**',
        Markup.inlineKeyboard([
          [Markup.button.callback('📱 Портрет (1024x1792)', 'aspect_portrait')],
          [Markup.button.callback('📺 Пейзаж (1792x1024)', 'aspect_landscape')],
          [Markup.button.callback('🖼️ Квадрат (1024x1024)', 'aspect_square')],
          [Markup.button.callback('🎬 Постер (1024x1536)', 'aspect_poster')],
        ])
      );

      return ctx.wizard.next();
    },

    // Шаг 8: Подтверждение
    async (ctx) => {
      const aspect = ctx.match?.[1];
      const wizardData = ctx.wizard.state as WizardData;

      const aspectMap: Record<string, string> = {
        aspect_portrait: '1024x1792',
        aspect_landscape: '1792x1024',
        aspect_square: '1024x1024',
        aspect_poster: '1024x1536',
      };

      wizardData.aspect = aspectMap[aspect] || '1024x1792';

      const cost = 0.10;

      await ctx.reply(
        `📊 **Ваш герой готов к созданию!**\n\n` +
        `🦸 **Герой:** ${wizardData.heroName}\n` +
        `🎭 **Тип:** ${wizardData.heroType}\n\n` +
        `⚡ **Силы:**\n${wizardData.powers?.map(p => `• ${p}`).join('\n') || 'Суперсила'}\n\n` +
        `🎨 **Стиль:** ${wizardData.style}\n` +
        `🦸 **Поза:** ${wizardData.pose}\n` +
        `🌆 **Фон:** ${wizardData.background}\n` +
        `📐 **Формат:** ${wizardData.aspect}\n\n` +
        `💰 **Стоимость:** $${cost}\n\n` +
        `✨ Создаем героя?`,
        Markup.inlineKeyboard([
          [Markup.button.callback('✅ Да, создать героя!', 'confirm')],
          [Markup.button.callback('🔄 Изменить', 'back')],
          [Markup.button.callback('❌ Отменить', 'cancel')],
        ])
      );

      return ctx.wizard.next();
    },

    // Шаг 9: Генерация героя
    async (ctx) => {
      if (ctx.match?.[1] === 'cancel') {
        await ctx.reply('❌ Создание отменено', Markup.removeKeyboard());
        return ctx.scene.leave();
      }

      if (ctx.match?.[1] === 'back') {
        return ctx.wizard.selectStep(6);
      }

      const wizardData = ctx.wizard.state as WizardData;

      await ctx.reply(
        `🦸‍♂️ **Создаю героя ${wizardData.heroName}...**`,
        Markup.removeKeyboard()
      );

      const progressMessage = await ctx.reply('⏳ **Прогресс создания:** 0%');

      const stages = [
        '🎨 Рисую концепт героя...',
        '⚡ Добавляю суперсилы...',
        '🎭 Применяю стиль...',
        '🌆 Создаю фон...',
        '✨ Добавляю детали...',
        '🦸‍♂️ Финализирую героя...'
      ];

      for (let i = 10; i <= 100; i += 10) {
        const stageIndex = Math.floor(i / 16);
        await ctx.telegram.editMessageText(
          ctx.chat?.id,
          progressMessage.message_id,
          undefined,
          `⏳ **Прогресс:** ${i}%\n\n${stages[stageIndex]}\n${'█'.repeat(i / 5)}${'░'.repeat(20 - i / 5)}`
        );
        await new Promise(resolve => setTimeout(resolve, 600));
      }

      try {
        const provider = ctx.bot.context.registry.getProvider('fal');

        if (provider) {
          const prompt = `Create ${wizardData.heroType} named ${wizardData.heroName}, ` +
            `with powers: ${wizardData.powers?.join(', ')}, ` +
            `in ${wizardData.pose}, ` +
            `in ${wizardData.style}, ` +
            `with ${wizardData.background} background, ` +
            `aspect ratio ${wizardData.aspect}, highly detailed`;

          const result = await provider.generate({
            model: 'fal-ai/flux/schnell',
            input: {
              prompt: prompt,
              image_size: wizardData.aspect,
            },
          });

          if (result.success && result.data.url) {
            await ctx.telegram.editMessageText(
              ctx.chat?.id,
              progressMessage.message_id,
              undefined,
              '✅ **Герой создан!** 🦸‍♂️'
            );

            await ctx.replyWithPhoto(result.data.url, {
              caption: `🦸‍♂️ **${wizardData.heroName}**\n\n` +
                `🎭 **Тип:** ${wizardData.heroType}\n` +
                `⚡ **Силы:** ${wizardData.powers?.join(', ') || 'Суперсила'}\n` +
                `🎨 **Стиль:** ${wizardData.style}\n` +
                `💰 **Стоимость:** $${wizardData.aspect === '1024x1792' ? '0.10' : '0.08'}`
            });

            await ctx.reply(
              '🎉 **Поздравляем!** Ваш герой готов к бою! Создать еще?',
              Markup.inlineKeyboard([
                [Markup.button.callback('🦸‍♂️ Создать еще героя', 'create_more')],
                [Markup.button.callback('🦸‍♀️ Создать команду', 'create_team')],
                [Markup.button.callback('🏠 В меню', 'main_menu')],
              ])
            );
          } else {
            throw new Error(result.error || 'Ошибка создания героя');
          }
        } else {
          // Демо режим
          await ctx.telegram.editMessageText(
            ctx.chat?.id,
            progressMessage.message_id,
            undefined,
            '✅ **Герой создан! (Демо)**'
          );

          await ctx.replyWithPhoto(
            'https://picsum.photos/1024/1792',
            {
              caption: `🦸‍♂️ **${wizardData.heroName} (Демо)**\n${wizardData.powers?.join(', ') || 'Суперсила'}`
            }
          );

          await ctx.reply(
            '⚠️ Подключите FAL API для полной генерации героев.',
            Markup.inlineKeyboard([
              [Markup.button.callback('🔧 Настроить API', 'setup_api')],
            ])
          );
        }
      } catch (error) {
        logger.error('AI Hero generation error:', error);
        await ctx.telegram.editMessageText(
          ctx.chat?.id,
          progressMessage.message_id,
          undefined,
          '❌ Ошибка: ' + (error as Error).message
        );
      }

      return ctx.scene.leave();
    }
  );

  return scene;
};

export default createAiHeroesScene;
