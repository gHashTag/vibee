/**
 * Scene плагин - оплата рублями
 * 💰
 */

import { Scenes, Markup } from 'telegraf';
import type { SceneContext } from './types';

export const createRublePaymentScene = (): Scenes.WizardScene<SceneContext> => {
  const scene = new Scenes.WizardScene<SceneContext>(
    'rublePaymentScene',

    // Шаг 1: Выбор услуги
    async (ctx) => {
      await ctx.reply(
        '💰 Оплата банковской картой\n\n' +
        '🔒 Безопасная оплата через Robokassa\n' +
        '💳 Visa, MasterCard, МИР, SBP\n\n' +
        'Выберите услугу:',
        Markup.inlineKeyboard([
          [Markup.button.callback('🎬 ИИ Рилсы - 30₽', 'ai_reels')],
          [Markup.button.callback('🎤 Синхронизация губ - 50₽', 'lip_sync')],
          [Markup.button.callback('💫 Подписка NEUROTESTER - 299₽', 'sub_neurotester')],
          [Markup.button.callback('💫 Подписка NEUROVIDEO - 499₽', 'sub_neurovideo')],
          [Markup.button.callback('🎨 Пакет эффектов - 80₽', 'effects_pack')],
          [Markup.button.callback('💎 Пакет "Всё включено" - 999₽', 'all_inclusive')]
        ])
      )
      return ctx.wizard.next()
    },

    // Шаг 2: Детали платежа
    async (ctx) => {
      const service = ctx.match?.[1]

      const services = {
        ai_reels: {
          name: 'ИИ Рилсы',
          price: 30,
          description: 'Создание рилса с ИИ-эффектами',
          duration: '5-10 сек',
          features: ['HD качество', 'Музыка включена', 'Экспорт в соцсети']
        },
        lip_sync: {
          name: 'Синхронизация губ',
          price: 50,
          description: 'Автосинхрон губ с аудио',
          duration: '10-30 сек',
          features: ['HD/4K качество', 'Автокоррекция', 'Без артефактов']
        },
        sub_neurotester: {
          name: 'Подписка NEUROTESTER',
          price: 299,
          description: 'Доступ к базовым функциям на месяц',
          duration: '30 дней',
          features: ['ИИ Рилсы: 10/мес', 'Морфинг: 5/мес', 'Базовые эффекты']
        },
        sub_neurovideo: {
          name: 'Подписка NEUROVIDEO',
          price: 499,
          description: 'Полный доступ на месяц',
          duration: '30 дней',
          features: ['Безлимит', '4K качество', 'API доступ', 'Приоритетная очередь']
        },
        effects_pack: {
          name: 'Пакет эффектов',
          price: 80,
          description: '10 уникальных премиум эффектов',
          duration: 'перманентно',
          features: ['Эксклюзивные эффекты', 'Обновления', 'Коммерческое использование']
        },
        all_inclusive: {
          name: 'Пакет "Всё включено"',
          price: 999,
          description: 'Все функции + 6 месяцев подписки',
          duration: '6 месяцев',
          features: ['Все эффекты', 'Безлимит', 'Приоритет', 'API', 'Техподдержка']
        }
      }

      const selected = services[service]

      if (!selected) {
        return ctx.wizard.back()
      }

      // Рассчитываем экономию
      const discount = selected.name.includes('Подписка') ? Math.ceil(selected.price * 0.2) : 0
      const finalPrice = selected.price - discount

      await ctx.reply(
        `💰 ${selected.name}\n\n` +
        `📝 ${selected.description}\n` +
        `⏱️ ${selected.duration}\n\n` +
        `💎 Что включено:\n${selected.features.map(f => `• ${f}`).join('\n')}\n\n` +
        `💳 Стоимость:\n` +
        `• Цена: ${selected.price}₽\n` +
        `${discount > 0 ? `• Скидка: -${discount}₽\n• К оплате: ${finalPrice}₽\n\n` : '\n'}` +
        `🔒 Безопасность:\n` +
        `• Шифрование SSL/TLS\n` +
        `• Соответствие PCI DSS\n` +
        `• НЕ храним данные карт\n\n` +
        'Перейти к оплате?',
        Markup.inlineKeyboard([
          [Markup.button.callback(`✅ Оплатить ${finalPrice}₽`, 'proceed_payment')],
          [Markup.button.callback('💫 Оплатить Stars', 'pay_stars')],
          [Markup.button.callback('❌ Отмена', 'cancel')]
        ])
      )

      ctx.session.wizardData.service = service
      ctx.session.wizardData.price = selected.price
      ctx.session.wizardData.finalPrice = finalPrice
      return ctx.wizard.next()
    },

    // Шаг 3: Подтверждение и переход к оплате
    async (ctx) => {
      const action = ctx.match?.[1]

      if (action === 'cancel') {
        await ctx.reply('❌ Оплата отменена')
        return ctx.scene.leave()
      }

      if (action === 'pay_stars') {
        const starsPrice = Math.ceil(ctx.session.wizardData.finalPrice / 0.5)
        await ctx.reply(
          `💫 Переключение на оплату Stars\n\n` +
          `💰 Сумма: ${ctx.session.wizardData.finalPrice}₽\n` +
          `⭐ К списанию: ${starsPrice} Stars\n\n` +
          '⏳ Перенаправляю...',
          Markup.inlineKeyboard([
            [Markup.button.callback(`💫 Оплатить ${starsPrice} Stars`, 'stars_payment')]
          ])
        )
        return ctx.scene.leave()
      }

      if (action === 'proceed_payment') {
        const price = ctx.session.wizardData.finalPrice
        const service = ctx.session.wizardData.service

        await ctx.reply(
          '💳 Перенаправляю на страницу оплаты...\n\n' +
          `💰 Сумма: ${price}₽\n` +
          `📋 Услуга: ${service}\n\n` +
          '⏳ Подготовка платежа...\n' +
          '⚠️ Не закрывайте приложение!',
          Markup.inlineKeyboard([
            [Markup.button.callback('🔐 Перейти к оплате', 'robokassa')],
            [Markup.button.callback('❓ Помощь', 'help')]
          ])
        )

        // Здесь будет интеграция с Robokassa
        // Генерация ссылки на оплату
        return ctx.wizard.next()
      }

      return ctx.wizard.back()
    },

    // Шаг 4: Обработка после оплаты
    async (ctx) => {
      const action = ctx.match?.[1]

      if (action === 'help') {
        await ctx.reply(
          '❓ Помощь с оплатой\n\n' +
          '💳 Способы оплаты:\n' +
          '• Банковские карты (Visa, MasterCard, МИР)\n' +
          '• Система быстрых платежей (СБП)\n' +
          '• Sberbank Online\n' +
          '• QIWI Wallet\n' +
          '• WebMoney\n\n' +
          '🔒 Безопасность:\n' +
          '• Платёжный шлюз Robokassa\n' +
          '• Шифрование SSL/TLS\n' +
          '• Сертификат безопасности PCI DSS\n' +
          '• Мы НЕ имеем доступа к данным вашей карты\n\n' +
          '⏱️ Оплата обрабатывается: 1-3 минуты\n' +
          '📧 Чек придёт на email\n' +
          '🔄 Возврат в течение 7 дней',
          Markup.inlineKeyboard([
            [Markup.button.callback('✅ Понятно', 'back_payment')]
          ])
        )
        return ctx.wizard.selectStep(2)
      }

      if (action === 'robokassa') {
        // Здесь будет логика перехода к Robokassa
        const price = ctx.session.wizardData.finalPrice

        await ctx.reply(
          '✅ Платёжная ссылка сгенерирована!\n\n' +
          `💰 Сумма: ${price}₽\n` +
          `⏳ Действительна: 30 минут\n\n` +
          '📋 Инструкция:\n' +
          '1. Нажмите на ссылку ниже\n' +
          '2. Выберите способ оплаты\n' +
          '3. Введите данные карты\n' +
          '4. Подтвердите оплату кодом из SMS\n' +
          '5. Вы вернётесь в бот автоматически\n\n' +
          '🔗 [Перейти к оплате](https://auth.robokassa.ru/Merchant/Payment.aspx)',
          {
            parse_mode: 'Markdown',
            reply_markup: Markup.inlineKeyboard([
              [Markup.button.callback('✅ Оплатил', 'payment_success')],
              [Markup.button.callback('❌ Ошибка оплаты', 'payment_error')],
              [Markup.button.callback('🔄 Проверить статус', 'check_status')]
            ])
          }
        )

        // Здесь можно добавить webhook для получения статуса оплаты
        return ctx.wizard.next()
      }

      return ctx.wizard.back()
    },

    // Шаг 5: Финальная обработка
    async (ctx) => {
      const status = ctx.match?.[1]

      if (status === 'payment_success') {
        const service = ctx.session.wizardData.service
        const price = ctx.session.wizardData.finalPrice

        await ctx.reply(
          '🎉 Оплата успешно завершена!\n\n' +
          `💳 Сумма: ${price}₽\n` +
          `📋 Услуга: ${service}\n` +
          `📧 Чек отправлен на email\n` +
          `📅 Дата: ${new Date().toLocaleString('ru-RU')}\n\n` +
          `✅ Услуга активирована!\n\n` +
          'Что дальше?',
          Markup.inlineKeyboard([
            [Markup.button.callback('📊 Посмотреть историю', 'history')],
            [Markup.button.callback('💎 Мой баланс', 'balance')],
            [Markup.button.callback('🏠 В меню', 'menu')],
            [Markup.button.callback('💰 Оплатить ещё', 'more_payment')]
          ])
        )

        return ctx.scene.leave()
      }

      if (status === 'payment_error') {
        await ctx.reply(
          '❌ Произошла ошибка при оплате\n\n' +
          '🔄 Возможные причины:\n' +
          '• Недостаточно средств на карте\n' +
          '• Карта заблокирована\n' +
          '• Превышен лимит\n' +
          '• Технические проблемы\n\n' +
          '💡 Что делать:\n' +
          '• Попробуйте другую карту\n' +
          '• Обратитесь в банк\n' +
          '• Выберите Stars как оплату\n\n' +
          'Техподдержка: @vibee_support',
          Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Попробовать снова', 'retry')],
            [Markup.button.callback('💫 Оплатить Stars', 'pay_stars')],
            [Markup.button.callback('🏠 В меню', 'menu')]
          ])
        )

        return ctx.scene.leave()
      }

      if (status === 'check_status') {
        // Здесь проверка статуса платежа через Robokassa API
        await ctx.reply(
          '⏳ Проверяю статус платежа...\n\n' +
          '🔄 Статус: Обрабатывается\n' +
          '⏱️ Подождите 1-2 минуты\n\n' +
          '💡 Если платёж прошёл, но статус не обновился,\n' +
          'нажмите "Обновить статус" через 5 минут',
          Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Обновить статус', 'update_status')],
            [Markup.button.callback('🏠 В меню', 'menu')]
          ])
        )
        return ctx.wizard.selectStep(4)
      }

      if (status === 'retry') {
        return ctx.wizard.selectStep(1)
      }

      await ctx.reply('✅ Спасибо за оплату!')
      return ctx.scene.leave()
    }
  )

  return scene
}
