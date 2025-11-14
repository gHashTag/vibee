/**
 * Scene плагин - синхронизация губ
 * 🎤
 */

import { Scenes, Markup } from 'telegraf';
import type { SceneContext } from './types';

export const createLipSyncScene = (): Scenes.WizardScene<SceneContext> => {
  const scene = new Scenes.WizardScene<SceneContext>(
    'lipSyncScene',

    // Шаг 1: Выбор режима
    async (ctx) => {
      await ctx.reply(
        '🎤 Синхронизация губ с AI\n\n' +
        'Выберите режим:',
        Markup.inlineKeyboard([
          [Markup.button.callback('🎯 Автосинхрон (базовый)', 'auto')],
          [Markup.button.callback('⚙️ Ручная настройка', 'manual')],
          [Markup.button.callback('📹 Режим реального времени', 'realtime')],
          [Markup.button.callback('📚 Инструкции', 'help')]
        ])
      )
      return ctx.wizard.next()
    },

    // Шаг 2: Обработка выбора
    async (ctx) => {
      const mode = ctx.match?.[1]

      const modes = {
        auto: {
          name: 'Автосинхрон (базовый)',
          description: 'Автоматическая синхронизация губ с аудио',
          duration: '10-30 сек',
          quality: 'HD'
        },
        manual: {
          name: 'Ручная настройка',
          description: 'Точная настройка синхронизации по кадрам',
          duration: '1-3 мин',
          quality: '4K'
        },
        realtime: {
          name: 'Режим реального времени',
          description: 'Живая синхронизация во время записи',
          duration: 'До 5 мин',
          quality: 'HD'
        }
      }

      const selected = modes[mode]

      if (!selected) {
        // Если выбрали помощь
        await ctx.reply(
          '📚 Как использовать синхронизацию губ:\n\n' +
          '1️⃣ Подготовьте аудиофайл (речь)\n' +
          '2️⃣ Подготовьте видео с лицом\n' +
          '3️⃣ Выберите режим и загрузите файлы\n' +
          '4️⃣ Дождитесь обработки\n\n' +
          '⚠️ Поддерживаемые форматы: MP3, WAV для аудио; MP4, MOV для видео\n' +
          '💡 Качество результата зависит от исходных материалов',
          Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Назад', 'back')],
            [Markup.button.callback('✅ Понятно', 'done')]
          ])
        )
        return ctx.wizard.back()
      }

      await ctx.reply(
        `📋 ${selected.name}\n\n` +
        `📝 ${selected.description}\n` +
        `⏱️ Время: ${selected.duration}\n` +
        `🎨 Качество: ${selected.quality}\n\n` +
        'Стоимость: 50₽ или 25 ⭐\n\n' +
        'Загрузите файлы:',
        Markup.inlineKeyboard([
          [Markup.button.callback('🎵 Загрузить аудио', 'upload_audio')],
          [Markup.button.callback('🎬 Загрузить видео', 'upload_video')],
          [Markup.button.callback('💰 Оплатить', 'pay')],
          [Markup.button.callback('❌ Отмена', 'cancel')]
        ])
      )

      ctx.session.wizardData.mode = mode
      ctx.session.wizardData.cost = 50
      return ctx.wizard.next()
    },

    // Шаг 3: Обработка файлов и оплаты
    async (ctx) => {
      const action = ctx.match?.[1]

      if (action === 'cancel') {
        await ctx.reply('❌ Синхронизация отменена')
        return ctx.scene.leave()
      }

      if (action === 'upload_audio' || action === 'upload_video') {
        await ctx.reply(
          action === 'upload_audio'
            ? '🎵 Отправьте аудиофайл (MP3, WAV)\n⚠️ Максимум 50 МБ'
            : '🎬 Отправьте видеофайл (MP4, MOV)\n⚠️ Максимум 100 МБ'
        )
        return ctx.wizard.selectStep(2) // Остаёмся на этом шаге
      }

      if (action === 'pay') {
        await ctx.reply(
          '💳 Выберите способ оплаты:',
          Markup.inlineKeyboard([
            [Markup.button.callback('💰 Рубль (50₽)', 'pay_rub')],
            [Markup.button.callback('⭐ Telegram Stars (25)', 'pay_stars')],
            [Markup.button.callback('🔙 Назад', 'back')]
          ])
        )
        return ctx.wizard.next()
      }

      return ctx.wizard.back()
    },

    // Шаг 4: Финализация
    async (ctx) => {
      const payment = ctx.match?.[1]

      if (payment === 'back') {
        return ctx.wizard.back()
      }

      if (payment === 'pay_rub' || payment === 'pay_stars') {
        await ctx.reply(
          '💳 Инициирую оплату...\n' +
          '⏳ После подтверждения платежа начнется обработка',
          Markup.inlineKeyboard([
            [Markup.button.callback('📊 Статус', 'check_status')],
            [Markup.button.callback('🏠 В меню', 'menu')]
          ])
        )
        return ctx.scene.leave()
      }

      await ctx.reply('✅ Файлы загружены!\n⏳ Ожидание оплаты...')
      return ctx.wizard.back()
    }
  )

  return scene
}
