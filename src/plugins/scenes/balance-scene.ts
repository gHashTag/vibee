/**
 * Scene плагин - баланс
 * 💎
 */

import { Scenes, Markup } from 'telegraf';
import type { SceneContext, BalanceData } from './types';

export const createBalanceScene = (): Scenes.WizardScene<SceneContext> => {
  const scene = new Scenes.WizardScene<SceneContext>(
    'balanceScene',

    // Шаг 1: Обзор баланса
    async (ctx) => {
      const userId = ctx.from.id.toString()
      const balance = await getUserBalance(userId)

      let statusText = ''
      if (balance.subscription) {
        const daysLeft = Math.ceil((balance.subscription.expiresAt - Date.now()) / (1000 * 60 * 60 * 24))
        statusText = `💎 Подписка: ${balance.subscription.plan}\n📅 До: ${new Date(balance.subscription.expiresAt).toLocaleDateString('ru-RU')} (${daysLeft} дн.)\n\n`
      }

      await ctx.reply(
        '💎 Ваш баланс\n\n' +
        `💰 Рубли: ${balance.rubles.toFixed(2)}₽\n` +
        `⭐ Stars: ${balance.stars}\n\n` +
        statusText +
        'Выберите действие:',
        Markup.inlineKeyboard([
          [Markup.button.callback('💳 Пополнить баланс', 'topup')],
          [Markup.button.callback('📊 История операций', 'history')],
          [Markup.button.callback('💫 Управление подпиской', 'subscription')],
          [Markup.button.callback('🎁 Мои бонусы', 'bonuses')],
          [Markup.button.callback('💸 Вывести средства', 'withdraw')]
        ])
      )

      ctx.session.wizardData.balance = balance
      return ctx.wizard.next()
    },

    // Шаг 2: Обработка выбора
    async (ctx) => {
      const action = ctx.match?.[1]
      const balance = ctx.session.wizardData.balance

      if (action === 'topup') {
        await ctx.reply(
          '💳 Пополнение баланса\n\n' +
          '💰 Доступные суммы:',
          Markup.inlineKeyboard([
            [Markup.button.callback('100₽ (50 Stars)', 'topup_100')],
            [Markup.button.callback('299₽ (150 Stars)', 'topup_299')],
            [Markup.button.callback('500₽ (250 Stars)', 'topup_500')],
            [Markup.button.callback('1000₽ (500 Stars) + 100 бонус', 'topup_1000')],
            [Markup.button.callback('💫 Сумма по выбору', 'topup_custom')],
            [Markup.button.callback('🔙 Назад', 'back')]
          ])
        )
        return ctx.wizard.next()
      }

      if (action === 'history') {
        const historyText = balance.history.slice(0, 10).map(op => {
          const date = new Date(op.date).toLocaleDateString('ru-RU')
          const amount = op.type === 'spend' ? '-' : '+'
          const currency = op.currency === 'RUB' ? '₽' : '⭐'
          return `${date} • ${op.description}\n${amount}${op.amount} ${currency}`
        }).join('\n\n') || 'История пуста'

        await ctx.reply(
          '📊 История операций\n\n' +
          historyText + '\n\n' +
          'Фильтры:',
          Markup.inlineKeyboard([
            [Markup.button.callback('💰 Только рубли', 'filter_rub')],
            [Markup.button.callback('⭐ Только Stars', 'filter_stars')],
            [Markup.button.callback('📥 Только пополнения', 'filter_income')],
            [Markup.button.callback('📤 Только траты', 'filter_spend')],
            [Markup.button.callback('🔙 Назад', 'back')]
          ])
        )
        return ctx.wizard.next()
      }

      if (action === 'subscription') {
        if (balance.subscription) {
          const sub = balance.subscription
          const daysLeft = Math.ceil((sub.expiresAt - Date.now()) / (1000 * 60 * 60 * 24))
          const isActive = daysLeft > 0

          await ctx.reply(
            '💫 Управление подпиской\n\n' +
            `📦 План: ${sub.plan}\n` +
            `📅 Дата активации: ${new Date(sub.expiresAt - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU')}\n` +
            `⏰ Истекает: ${new Date(sub.expiresAt).toLocaleDateString('ru-RU')}\n` +
            `⏳ Осталось: ${daysLeft} дн.\n` +
            `✅ Статус: ${isActive ? 'Активна' : 'Истекла'}\n\n` +
            (isActive ? 'Действия:' : 'Хотите продлить?'),
            Markup.inlineKeyboard([
              ...(isActive ? [
                [Markup.button.callback('🔄 Продлить подписку', 'renew')],
                [Markup.button.callback('📊 Детали подписки', 'details')],
                [Markup.button.callback('❌ Отменить подписку', 'cancel')],
              ] : [
                [Markup.button.callback('💫 Возобновить подписку', 'reactivate')],
                [Markup.button.callback('📦 Сменить план', 'change_plan')]
              ]),
              [Markup.button.callback('🔙 Назад', 'back')]
            ])
          )
        } else {
          await ctx.reply(
            '💫 У вас нет активной подписки\n\n' +
            '🎁 Хотите подключить?',
            Markup.inlineKeyboard([
              [Markup.button.callback('💎 NEUROTESTER - 299₽/мес', 'buy_neurotester')],
              [Markup.button.callback('💫 NEUROVIDEO - 499₽/мес', 'buy_neurovideo')],
              [Markup.button.callback('🎁 Пробный период - бесплатно', 'buy_trial')],
              [Markup.button.callback('🔙 Назад', 'back')]
            ])
          )
        }
        return ctx.wizard.next()
      }

      if (action === 'bonuses') {
        await ctx.reply(
          '🎁 Ваши бонусы\n\n' +
          '👥 За приглашения друзей:\n' +
          '• Приглашено: 5 человек\n' +
          '• Заработано: 250 Stars\n' +
          '• Доступно: 100 Stars\n\n' +
          '🎯 Достижения:\n' +
          '• ✅ Первый рилс создан\n' +
          '• ✅ Друг приглашён\n' +
          '• 🔄 Создайте 5 рилсов (3/5)\n' +
          '• 🔄 Пригласите 10 друзей (5/10)\n\n' +
          '🏆 Награды:',
          Markup.inlineKeyboard([
            [Markup.button.callback('💰 Получить бонус 100 Stars', 'claim_bonus')],
            [Markup.button.callback('👥 Программа приглашений', 'invite_program')],
            [Markup.button.callback('🏅 Все достижения', 'achievements')],
            [Markup.button.callback('🔙 Назад', 'back')]
          ])
        )
        return ctx.wizard.next()
      }

      if (action === 'withdraw') {
        await ctx.reply(
          '💸 Вывод средств\n\n' +
          '⚠️ Условия вывода:\n' +
          '• Минимум: 500₽ или 1000 Stars\n' +
          '• Комиссия: 5% + 30₽\n' +
          '• Срок: до 3 рабочих дней\n' +
          '• Способ: банковская карта\n\n' +
          '💎 Ваш баланс:\n' +
          `• Рубли: ${balance.rubles.toFixed(2)}₽\n` +
          `• Stars: ${balance.stars}\n\n` +
          'Доступно к выводу:',
          Markup.inlineKeyboard([
            ...(balance.rubles >= 500 ? [[Markup.button.callback(`💰 Вывести ${Math.floor(balance.rubles)}₽`, 'withdraw_rub')]] : []),
            ...(balance.stars >= 1000 ? [[Markup.button.callback(`⭐ Вывести ${balance.stars} Stars`, 'withdraw_stars')]] : []),
            [Markup.button.callback('ℹ️ Подробнее о выводе', 'withdraw_info')],
            [Markup.button.callback('🔙 Назад', 'back')]
          ])
        )
        return ctx.wizard.next()
      }

      return ctx.wizard.back()
    },

    // Шаг 3: Пополнение баланса
    async (ctx) => {
      const action = ctx.match?.[1]
      const balance = ctx.session.wizardData.balance

      if (action === 'back') {
        return ctx.wizard.back()
      }

      const amounts = {
        topup_100: { rubles: 100, stars: 50, bonus: 0 },
        topup_299: { rubles: 299, stars: 150, bonus: 0 },
        topup_500: { rubles: 500, stars: 250, bonus: 0 },
        topup_1000: { rubles: 1000, stars: 500, bonus: 100 }
      }

      const selected = amounts[action]

      if (action === 'topup_custom') {
        await ctx.reply(
          '💫 Пополнение на произвольную сумму\n\n' +
          'Введите сумму в рублях (минимум 50₽):'
        )
        return ctx.wizard.next()
      }

      if (selected) {
        const totalStars = selected.stars + selected.bonus

        await ctx.reply(
          `💳 Пополнение баланса\n\n` +
          `💰 Сумма: ${selected.rubles}₽\n` +
          `⭐ К зачислению: ${selected.stars} Stars\n` +
          `${selected.bonus > 0 ? `🎁 Бонус: +${selected.bonus} Stars\n` : ''}` +
          `💎 Итого: ${totalStars} Stars\n\n` +
          `Способ оплаты:`,
          Markup.inlineKeyboard([
            [Markup.button.callback('💳 Банковская карта', 'pay_card')],
            [Markup.button.callback(`⭐ Telegram Stars (${Math.ceil(selected.rubles / 0.5)})`, 'pay_stars')],
            [Markup.button.callback('🔙 Назад', 'back')]
          ])
        )

        ctx.session.wizardData.topupAmount = selected.rubles
        ctx.session.wizardData.topupStars = totalStars
        return ctx.wizard.next()
      }

      return ctx.wizard.back()
    },

    // Шаг 4: Пользовательский ввод суммы
    async (ctx) => {
      if (ctx.message?.text) {
        const amount = parseFloat(ctx.message.text)

        if (isNaN(amount) || amount < 50) {
          await ctx.reply(
            '❌ Некорректная сумма\n\n' +
            'Минимум: 50₽\n' +
            'Введите сумму ещё раз:'
          )
          return ctx.wizard.selectStep(4)
        }

        const stars = Math.floor(amount / 0.5)

        await ctx.reply(
          `💳 Пополнение на ${amount}₽\n\n` +
          `⭐ К зачислению: ${stars} Stars\n\n` +
          `Способ оплаты:`,
          Markup.inlineKeyboard([
            [Markup.button.callback('💳 Банковская карта', 'pay_card')],
            [Markup.button.callback(`⭐ Telegram Stars (${Math.ceil(amount / 0.5)})`, 'pay_stars')],
            [Markup.button.callback('🔙 Назад', 'back')]
          ])
        )

        ctx.session.wizardData.topupAmount = amount
        ctx.session.wizardData.topupStars = stars
        return ctx.wizard.next()
      }

      return ctx.wizard.selectStep(4)
    },

    // Шаг 5: Подтверждение оплаты
    async (ctx) => {
      const action = ctx.match?.[1]
      const amount = ctx.session.wizardData.topupAmount
      const stars = ctx.session.wizardData.topupStars

      if (action === 'back') {
        return ctx.wizard.selectStep(2)
      }

      if (action === 'pay_card') {
        await ctx.reply(
          '💳 Перенаправляю на оплату...\n\n' +
          `💰 Сумма: ${amount}₽\n` +
          `⭐ Будет зачислено: ${stars} Stars`,
          Markup.inlineKeyboard([
            [Markup.button.callback('🔐 Перейти к оплате', 'robokassa')],
            [Markup.button.callback('🔙 Назад', 'back')]
          ])
        )
        return ctx.wizard.next()
      }

      if (action === 'pay_stars') {
        const requiredStars = Math.ceil(amount / 0.5)
        await ctx.reply(
          `⭐ Оплата через Stars\n\n` +
          `💫 Потребуется: ${requiredStars} Stars\n` +
          `💰 Эквивалент: ${amount}₽\n\n` +
          `⏳ Перенаправляю...`,
          Markup.inlineKeyboard([
            [Markup.button.callback(`💫 Оплатить ${requiredStars} Stars`, 'stars_payment')],
            [Markup.button.callback('🔙 Назад', 'back')]
          ])
        )
        return ctx.wizard.next()
      }

      if (action === 'robokassa') {
        // Здесь интеграция с Robokassa
        await ctx.reply(
          '✅ Платёж инициирован!\n\n' +
          `💰 Сумма: ${amount}₽\n` +
          `📱 Следуйте инструкциям на странице оплаты\n\n` +
          `После успешной оплаты баланс будет пополнен автоматически`
        )
        return ctx.scene.leave()
      }

      if (action === 'stars_payment') {
        const requiredStars = Math.ceil(amount / 0.5)
        await ctx.reply(
          `⭐ Списываю ${requiredStars} Stars...\n\n` +
          `⏳ Ожидание подтверждения...`
        )

        // Имитация успешного пополнения
        setTimeout(async () => {
          await ctx.reply(
            `✅ Баланс пополнен!\n\n` +
            `💰 Сумма: ${amount}₽\n` +
            `⭐ Зачислено: ${stars} Stars\n` +
            `📅 Дата: ${new Date().toLocaleString('ru-RU')}\n\n` +
            `Текущий баланс обновлён!`,
            Markup.inlineKeyboard([
              [Markup.button.callback('💎 Посмотреть баланс', 'check_balance')],
              [Markup.button.callback('🎬 Создать рилс', 'create_reels')],
              [Markup.button.callback('🏠 В меню', 'menu')]
            ])
          )
          return ctx.scene.leave()
        }, 2000)

        return ctx.wizard.next()
      }

      return ctx.wizard.back()
    }
  )

  return scene
}

// Вспомогательная функция для получения баланса пользователя
async function getUserBalance(userId: string): Promise<BalanceData> {
  // Здесь получение данных из базы
  // Пока заглушка
  return {
    userId,
    rubles: 250.50,
    stars: 150,
    subscription: {
      plan: 'NEUROTESTER',
      expiresAt: Date.now() + 15 * 24 * 60 * 60 * 1000
    },
    history: [
      {
        type: 'payment',
        amount: 299,
        currency: 'RUB',
        description: 'Пополнение баланса',
        date: Date.now() - 24 * 60 * 60 * 1000
      },
      {
        type: 'spend',
        amount: 30,
        currency: 'RUB',
        description: 'Создание ИИ Рилса',
        date: Date.now() - 2 * 60 * 60 * 1000
      }
    ]
  }
}
