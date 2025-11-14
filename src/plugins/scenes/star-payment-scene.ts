/**
 * Scene плагин - оплата звездами
 * ⭐
 */

import { Scenes, Markup } from 'telegraf';
import type { SceneContext } from './types';

export const createStarPaymentScene = (): Scenes.WizardScene<SceneContext> => {
  const scene = new Scenes.WizardScene<SceneContext>(
    'starPaymentScene',

    // Шаг 1: Выбор услуги
    async (ctx) => {
      await ctx.reply(
        '⭐ Оплата через Telegram Stars\n\n' +
        '💫 Конвертация: 1 Star ≈ 0.5₽ (по курсу Telegram)\n\n' +
        'Выберите услугу для оплаты:',
        Markup.inlineKeyboard([
          [Markup.button.callback('🎬 ИИ Рилсы (25⭐)', 'ai_reels')],
          [Markup.button.callback('🎤 Синхронизация губ (25⭐)', 'lip_sync')],
          [Markup.button.callback('💫 Подписка NEUROTESTER (600⭐)', 'sub_neurotester')],
          [Markup.button.callback('💫 Подписка NEUROVIDEO (1000⭐)', 'sub_neurovideo')],
          [Markup.button.callback('🎨 Пакет эффектов (100⭐)', 'effects_pack')],
          [Markup.button.callback('📊 Посмотреть курс Stars', 'rate_info')]
        ])
      )
      return ctx.wizard.next()
    },

    // Шаг 2: Детали оплаты
    async (ctx) => {
      const service = ctx.match?.[1]

      const services = {
        ai_reels: {
          name: 'ИИ Рилсы',
          stars: 25,
          rubles: 12.5,
          description: 'Создание рилса с ИИ-эффектами',
          duration: '5-10 сек'
        },
        lip_sync: {
          name: 'Синхронизация губ',
          stars: 25,
          rubles: 12.5,
          description: 'Автосинхрон губ с аудио',
          duration: '10-30 сек'
        },
        sub_neurotester: {
          name: 'Подписка NEUROTESTER',
          stars: 600,
          rubles: 299,
          description: 'Доступ к базовым функциям на месяц',
          duration: '30 дней'
        },
        sub_neurovideo: {
          name: 'Подписка NEROVIDEO',
          stars: 1000,
          rubles: 499,
          description: 'Полный доступ на месяц',
          duration: '30 дней'
        },
        effects_pack: {
          name: 'Пакет эффектов',
          stars: 100,
          rubles: 50,
          description: '10 уникальных эффектов',
          duration: 'перманентно'
        }
      }

      if (service === 'rate_info') {
        await ctx.reply(
          '📊 Информация о курсе Stars\n\n' +
          '💫 Telegram Stars - внутренняя валюта Telegram\n\n' +
          '💰 Текущий курс: 1 Star ≈ 0.5₽\n\n' +
          '📈 Важные особенности:\n' +
          '• Курс фиксирован Telegram\n' +
          '• Мгновенное зачисление после оплаты\n' +
          '• Возврат возможен в течение 7 дней\n' +
          '• Комиссия: 0%\n\n' +
          '💡 Преимущества Stars:\n' +
          '✅ Безопасность Telegram\n' +
          '✅ Быстрая оплата\n' +
          '✅ Глобальная доступность\n' +
          '✅ Поддержка в 190+ странах',
          Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Назад', 'back')],
            [Markup.button.callback('💫 Купить Stars', 'buy_stars')],
            [Markup.button.callback('✅ Продолжить оплату', 'continue')]
          ])
        )
        return ctx.wizard.back()
      }

      if (service === 'buy_stars') {
        await ctx.reply(
          '⭐ Как купить Stars:\n\n' +
          '📱 В мобильном приложении:\n' +
          '1. Откройте свой профиль\n' +
          '2. Нажмите "Stars" в правом верхнем углу\n' +
          '3. Выберите количество Stars\n' +
          '4. Добавьте способ оплаты\n' +
          '5. Подтвердите покупку\n\n' +
          '💻 На компьютере:\n' +
          '1. Settings → Stars\n' +
          '2. Нажмите "Buy Stars"\n' +
          '3. Выберите пакет (например, 100 Stars)\n' +
          '4. Оплатите банковской картой или PayPal\n\n' +
          '💡 Стоимость пакетов:\n' +
          '• 100 Stars ≈ 50₽\n' +
          '• 500 Stars ≈ 250₽\n' +
          '• 1000 Stars ≈ 500₽ (выгодно!)',
          Markup.inlineKeyboard([
            [Markup.button.callback('✅ Купил Stars', 'have_stars')],
            [Markup.button.callback('🔙 Назад', 'back')]
          ])
        )
        return ctx.wizard.back()
      }

      const selected = services[service]

      if (!selected) {
        return ctx.wizard.back()
      }

      await ctx.reply(
        `⭐ ${selected.name}\n\n` +
        `📝 ${selected.description}\n` +
        `⏱️ ${selected.duration}\n\n` +
        `💰 К оплате:\n` +
        `• ${selected.stars} Stars\n` +
        `• ≈ ${selected.rubles}₽\n\n` +
        `⚠️ Важно:\n` +
        `• Stars списываются мгновенно\n` +
        `• Возврат в течение 7 дней\n` +
        `• Услуга активируется автоматически\n\n` +
        'Продолжить оплату?',
        Markup.inlineKeyboard([
          [Markup.button.callback('✅ Да, оплатить', 'confirm_payment')],
          [Markup.button.callback('❌ Нет, отмена', 'cancel')],
          [Markup.button.callback('💳 Оплатить картой', 'pay_card')]
        ])
      )

      ctx.session.wizardData.service = service
      ctx.session.wizardData.stars = selected.stars
      ctx.session.wizardData.rubles = selected.rubles
      return ctx.wizard.next()
    },

    // Шаг 3: Подтверждение оплаты
    async (ctx) => {
      const action = ctx.match?.[1]

      if (action === 'cancel') {
        await ctx.reply('❌ Оплата отменена')
        return ctx.scene.leave()
      }

      if (action === 'pay_card') {
        const rubles = ctx.session.wizardData.rubles
        await ctx.reply(
          `💳 Переключение на оплату картой\n\n` +
          `💰 Сумма: ${rubles}₽\n` +
          '⏳ Перенаправляю...',
          Markup.inlineKeyboard([
            [Markup.button.callback('💳 Оплатить картой', 'robokassa')]
          ])
        )
        return ctx.scene.leave()
      }

      if (action === 'confirm_payment') {
        const stars = ctx.session.wizardData.stars
        const service = ctx.session.wizardData.service

        await ctx.reply(
          '⭐ Инициирую оплату через Stars...\n\n' +
          `💫 Списывается: ${stars} Stars\n` +
          `📋 Услуга: ${service}\n\n` +
          '⏳ Ожидание подтверждения...'
        )

        // Здесь будет логика списания Stars через Telegram Bot API
        // Пока имитация успешной оплаты
        setTimeout(async () => {
          await ctx.reply(
            '✅ Оплата Stars прошла успешно!\n\n' +
            `💫 Списано: ${stars} Stars\n` +
            `💰 Экономия: ${(stars * 0.5 - ctx.session.wizardData.rubles).toFixed(2)}₽\n\n` +
            `🎉 Услуга активирована!\n\n` +
            'Что дальше?',
            Markup.inlineKeyboard([
              [Markup.button.callback('📊 Посмотреть баланс', 'balance')],
              [Markup.button.callback('🏠 В меню', 'menu')],
              [Markup.button.callback('💫 Оплатить ещё', 'more_payment')]
            ])
          )
          return ctx.scene.leave()
        }, 2000)

        return ctx.wizard.next()
      }

      return ctx.wizard.back()
    },

    // Шаг 4: Завершение
    async (ctx) => {
      const action = ctx.match?.[1]

      if (action === 'more_payment') {
        return ctx.wizard.selectStep(0)
      }

      if (action === 'balance') {
        const stars = ctx.session.wizardData.stars
        await ctx.reply(
          `💎 Ваш баланс:\n` +
          `⭐ Stars: 1000 (пример, нужно интегрировать с API)\n` +
          `💰 Рубли: 500.00\n\n` +
          `📊 Последняя операция:\n` +
          `• Тип: Оплата услуги\n` +
          `• Сумма: ${stars} Stars\n` +
          `• Дата: ${new Date().toLocaleString('ru-RU')}`
        )
        return ctx.scene.leave()
      }

      await ctx.reply('✅ Спасибо за использование Stars!')
      return ctx.scene.leave()
    }
  )

  return scene
}
