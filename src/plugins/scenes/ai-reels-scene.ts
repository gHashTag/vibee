/**
 * Scene плагин - ИИ рилсы
 * 🎬
 */

import { Scenes, Markup } from 'telegraf';
import type { SceneContext } from './types';

export const createAiReelsScene = (): Scenes.WizardScene<SceneContext> => {
  const scene = new Scenes.WizardScene<SceneContext>(
    'aiReelsScene',

    // Шаг 1: Выбор типа рилса
    async (ctx) => {
      await ctx.reply(
        '🎬 ИИ Рилсы - Создание вирусного контента\n\n' +
        'Выберите тип контента:',
        Markup.inlineKeyboard([
          [Markup.button.callback('🎭 Морфинг лиц', 'morphing')],
          [Markup.button.callback('✨ Эффекты и фильтры', 'effects')],
          [Markup.button.callback('🌟 Звёздная пыль', 'stardust')],
          [Markup.button.callback('🔥 Трендовые эффекты', 'trending')],
          [Markup.button.callback('🎨 Художественные стили', 'artistic')],
          [Markup.button.callback('📚 Инструкции', 'help')]
        ])
      )
      return ctx.wizard.next()
    },

    // Шаг 2: Детализация выбора
    async (ctx) => {
      const type = ctx.match?.[1]

      const types = {
        morphing: {
          name: 'Морфинг лиц',
          description: 'Плавное превращение одного лица в другое',
          duration: '3-5 сек',
          quality: 'HD',
          cost: 30
        },
        effects: {
          name: 'Эффекты и фильтры',
          description: 'Профессиональные видеоэффекты и фильтры',
          duration: '5-10 сек',
          quality: '4K',
          cost: 50
        },
        stardust: {
          name: 'Звёздная пыль',
          description: 'Магические эффекты со звёздами и искрами',
          duration: '5-8 сек',
          quality: 'HD',
          cost: 40
        },
        trending: {
          name: 'Трендовые эффекты',
          description: 'Самые популярные эффекты социальных сетей',
          duration: '7-10 сек',
          quality: '4K',
          cost: 60
        },
        artistic: {
          name: 'Художественные стили',
          description: 'Стилизация под известные художественные течения',
          duration: '5-10 сек',
          quality: '4K',
          cost: 55
        }
      }

      if (type === 'help') {
        await ctx.reply(
          '📚 Создание ИИ Рилсов:\n\n' +
          '🎯 Что создаём?\n' +
          '• Короткие видео (5-15 сек) с ИИ-эффектами\n' +
          '• Готовые для публикации в соцсетях\n' +
          '• Автоматическое добавление музыки\n\n' +
          '📋 Как создать:\n' +
          '1. Выберите тип эффекта\n' +
          '2. Загрузите фото или видео\n' +
          '3. Настройте параметры\n' +
          '4. Оплатите и получите готовый рилс\n\n' +
          '💡 Лайфхаки:\n' +
          '• Качество исходника = качество результата\n' +
          '• Морфинг работает лучше с близкими лицами\n' +
          '• Эффекты можно комбинировать',
          Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Назад', 'back')]
          ])
        )
        return ctx.wizard.back()
      }

      const selected = types[type]

      if (!selected) {
        return ctx.wizard.back()
      }

      await ctx.reply(
        `🎬 ${selected.name}\n\n` +
        `📝 ${selected.description}\n` +
        `⏱️ Длительность: ${selected.duration}\n` +
        `🎨 Качество: ${selected.quality}\n` +
        `💰 Стоимость: ${selected.cost}₽ (${Math.ceil(selected.cost / 2)} ⭐)\n\n` +
        'Загрузите исходный материал:',
        Markup.inlineKeyboard([
          [Markup.button.callback('📸 Загрузить фото', 'upload_photo')],
          [Markup.button.callback('🎬 Загрузить видео', 'upload_video')],
          [Markup.button.callback('💰 Перейти к оплате', 'pay')],
          [Markup.button.callback('❌ Отмена', 'cancel')]
        ])
      )

      ctx.session.wizardData.type = type
      ctx.session.wizardData.cost = selected.cost
      ctx.session.wizardData.description = selected.description
      return ctx.wizard.next()
    },

    // Шаг 3: Загрузка файлов и настройки
    async (ctx) => {
      const action = ctx.match?.[1]

      if (action === 'cancel') {
        await ctx.reply('❌ Создание рилса отменено')
        return ctx.scene.leave()
      }

      if (action === 'upload_photo' || action === 'upload_video') {
        const fileType = action === 'upload_photo' ? 'фото' : 'видео'
        const limits = action === 'upload_photo' ? 'до 10 МБ' : 'до 100 МБ'

        await ctx.reply(
          `📎 Загружаем ${fileType}!\n\n` +
          `Поддерживаемые форматы:\n` +
          `${action === 'upload_photo' ? '• JPG, PNG, WEBP' : '• MP4, MOV, AVI'}\n` +
          `Ограничения: ${limits}\n\n` +
          `Отправьте ${fileType} в чат`
        )
        return ctx.wizard.selectStep(2) // Остаёмся на этом шаге
      }

      if (action === 'pay') {
        const cost = ctx.session.wizardData.cost
        await ctx.reply(
          `💳 Оплата рилса\n\n` +
          `💰 Сумма: ${cost}₽ или ${Math.ceil(cost / 2)} ⭐\n\n` +
          'Выберите способ оплаты:',
          Markup.inlineKeyboard([
            [Markup.button.callback(`💰 Рубль (${cost}₽)`, 'pay_rub')],
            [Markup.button.callback(`⭐ Telegram Stars (${Math.ceil(cost / 2)})`, 'pay_stars')],
            [Markup.button.callback('🔙 Назад', 'back')]
          ])
        )
        return ctx.wizard.next()
      }

      return ctx.wizard.back()
    },

    // Шаг 4: Финализация и создание
    async (ctx) => {
      const payment = ctx.match?.[1]

      if (payment === 'back') {
        return ctx.wizard.back()
      }

      if (payment === 'pay_rub' || payment === 'pay_stars') {
        const type = ctx.session.wizardData.type
        const description = ctx.session.wizardData.description

        await ctx.reply(
          '✅ Оплата принята!\n\n' +
          `🎬 Создаю рилс: ${description}\n` +
          '⏳ Обработка может занять 2-5 минут\n\n' +
          '📊 Статус обработки:',
          Markup.inlineKeyboard([
            [Markup.button.callback('📈 Прогресс', 'progress')],
            [Markup.button.callback('📥 Результат', 'result')],
            [Markup.button.callback('🏠 В меню', 'menu')]
          ])
        )

        // Здесь можно добавить логику отправки в очередь на обработку
        return ctx.scene.leave()
      }

      await ctx.reply('✅ Файлы загружены!\n⏳ Ожидание оплаты...')
      return ctx.wizard.back()
    }
  )

  return scene
}
