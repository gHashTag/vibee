/**
 * Scene плагин - оформление подписки
 * 💫
 */

import { Scenes, Markup } from 'telegraf';
import type { SceneContext } from './types';

export const createSubscriptionScene = (): Scenes.WizardScene<SceneContext> => {
  const scene = new Scenes.WizardScene<SceneContext>(
    'subscriptionScene',

    // Шаг 1: Выбор тарифа
    async (ctx) => {
      await ctx.reply(
        '💫 Выберите тарифный план:\n\n' +
        '🎯 Актуальные предложения:',
        Markup.inlineKeyboard([
          [Markup.button.callback('💎 NEUROTESTER - 299₽/мес', 'neurotester')],
          [Markup.button.callback('🌟 NEUROVIDEO - 499₽/мес', 'neurovideo')],
          [Markup.button.callback('⭐ Stars пакеты (выгода до 20%)', 'stars')],
          [Markup.button.callback('🎁 Пробный период (3 дня)', 'trial')]
        ])
      )
      return ctx.wizard.next()
    },

    // Шаг 2: Детали тарифа
    async (ctx) => {
      const plan = ctx.match?.[1]

      const plans = {
        neurotester: {
          name: 'NEUROTESTER',
          price: 299,
          period: 'месяц',
          features: [
            '✅ ИИ Рилсы (до 10 в месяц)',
            '✅ Морфинг лиц (до 5 в месяц)',
            '✅ Синхронизация губ (до 5 в месяц)',
            '✅ Базовые эффекты и фильтры',
            '✅ Качество HD',
            '✅ Экспорт в соцсети'
          ],
          popular: false
        },
        neurovideo: {
          name: 'NEUROVIDEO',
          price: 499,
          period: 'месяц',
          features: [
            '✅ ВСЁ из NEUROTESTER',
            '✅ ИИ Рилсы (безлимит)',
            '✅ Морфинг лиц (безлимит)',
            '✅ Синхронизация губ (безлимит)',
            '✅ Премиум эффекты',
            '✅ Качество 4K',
            '✅ Приоритетная очередь',
            '✅ Экспорт без водяного знака',
            '✅ API доступ'
          ],
          popular: true
        },
        stars: {
          name: 'Stars пакеты',
          price: 'различная',
          period: '',
          features: [
            '💰 Экономия до 20%',
            '⭐ Telegram Stars как оплата',
            '✅ Гибкие пакеты',
            '✅ Перенос на следующий период'
          ],
          popular: false
        },
        trial: {
          name: 'Пробный период',
          price: 0,
          period: '3 дня',
          features: [
            '✅ ИИ Рилсы (3 в день)',
            '✅ Морфинг лиц (1 в день)',
            '✅ Базовые эффекты',
            '✅ Качество HD',
            '✅ Техподдержка'
          ],
          popular: false
        }
      }

      if (!plans[plan]) {
        return ctx.wizard.back()
      }

      const selected = plans[plan]
      const priceText = selected.price === 0 ? 'Бесплатно' : `${selected.price}₽/${selected.period}`

      await ctx.reply(
        `📋 ${selected.name}\n` +
        `${selected.popular ? '🔥 ХИТ ПРОДАЖ' : ''}\n\n` +
        `💰 ${priceText}\n\n` +
        `Включено:\n${selected.features.join('\n')}\n\n` +
        'Способ оплаты:',
        Markup.inlineKeyboard([
          [Markup.button.callback('💳 Банковская карта', 'card')],
          [Markup.button.callback('⭐ Telegram Stars', 'stars')],
          [Markup.button.callback('🔙 Назад', 'back')]
        ])
      )

      ctx.session.wizardData.plan = plan
      ctx.session.wizardData.price = selected.price
      return ctx.wizard.next()
    },

    // Шаг 3: Способ оплаты
    async (ctx) => {
      const payment = ctx.match?.[1]

      if (payment === 'back') {
        return ctx.wizard.back()
      }

      const plan = ctx.session.wizardData.plan
      const price = ctx.session.wizardData.price

      if (payment === 'card') {
        await ctx.reply(
          '💳 Оплата банковской картой\n\n' +
          `💰 Сумма: ${price}₽\n` +
          '⏳ Перенаправляю на страницу оплаты...\n\n' +
          '⚠️ Платёж обрабатывается через Robokassa\n' +
          '🔒 Данные карты защищены по стандарту PCI DSS',
          Markup.inlineKeyboard([
            [Markup.button.callback('🔐 Перейти к оплате', 'robokassa')],
            [Markup.button.callback('❓ Помощь', 'help')]
          ])
        )
      } else if (payment === 'stars') {
        const starsAmount = plan === 'trial' ? 0 : Math.ceil(price * 2)
        await ctx.reply(
          '⭐ Оплата Telegram Stars\n\n' +
          `💫 Сумма: ${starsAmount} Stars\n` +
          `💰 Эквивалент: ~${price}₽\n\n` +
          '💡 Преимущества оплаты Stars:\n' +
          '• Мгновенное зачисление\n' +
          '• Возврат средств в случае проблем\n' +
          '• Безопасность Telegram',
          Markup.inlineKeyboard([
            [Markup.button.callback(`💫 Оплатить ${starsAmount} Stars`, 'stars_payment')],
            [Markup.button.callback('ℹ️ Как купить Stars', 'how_to_buy_stars')]
          ])
        )
      }

      return ctx.wizard.next()
    },

    // Шаг 4: Финализация подписки
    async (ctx) => {
      const action = ctx.match?.[1]

      if (action === 'help') {
        await ctx.reply(
          '❓ Помощь с оплатой:\n\n' +
          '💳 Банковская карта:\n' +
          '• Visa, MasterCard, МИР\n' +
          '• Деньги списываются мгновенно\n' +
          '• Чек придёт на email\n\n' +
          '⭐ Telegram Stars:\n' +
          '• Внутренняя валюта Telegram\n' +
          '• 1 Star ≈ 0.5₽ (по курсу)\n' +
          '• Купить: Profile → Stars\n\n' +
          '🔒 Безопасность:\n' +
          '• Шифрование SSL\n' +
          '• НЕ храним данные карт\n' +
          '• Возврат в течение 7 дней',
          Markup.inlineKeyboard([
            [Markup.button.callback('✅ Понятно', 'back_payment')]
          ])
        )
        return ctx.wizard.selectStep(2)
      }

      if (action === 'how_to_buy_stars') {
        await ctx.reply(
          '⭐ Как купить Telegram Stars:\n\n' +
          '📱 На телефоне:\n' +
          '1. Откройте свой профиль\n' +
          '2. Нажмите "Stars" в правом верхнем углу\n' +
          '3. Выберите сумму для покупки\n' +
          '4. Подтвердите покупку\n\n' +
          '💻 На компьютере:\n' +
          '1. Settings → Stars\n' +
          '2. Нажмите "Buy Stars"\n' +
          '3. Выберите способ оплаты\n' +
          '4. Подтвердите покупку\n\n' +
          '💡 Стоимость 1 Star: ~0.5₽',
          Markup.inlineKeyboard([
            [Markup.button.callback('✅ Купил, продолжить', 'continue_stars')]
          ])
        )
        return ctx.wizard.selectStep(2)
      }

      // Обработка платежа
      const plan = ctx.session.wizardData.plan
      const price = ctx.session.wizardData.price

      await ctx.reply(
        '🎉 Подписка активирована!\n\n' +
        `📦 План: ${plan}\n` +
        `💎 Статус: Активен\n` +
        `📅 До: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU')}\n\n` +
        '✅ Доступно:\n' +
        '• Полный функционал ИИ\n' +
        '• Техподдержка 24/7\n' +
        '• Обновления включены\n\n' +
        'Управление подпиской:',
        Markup.inlineKeyboard([
          [Markup.button.callback('📊 Статус', 'status')],
          [Markup.button.callback('🔄 Продлить', 'renew')],
          [Markup.button.callback('❌ Отменить', 'cancel')],
          [Markup.button.callback('🏠 В меню', 'menu')]
        ])
      )

      return ctx.scene.leave()
    }
  )

  return scene
}
