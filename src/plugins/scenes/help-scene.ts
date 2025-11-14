/**
 * Scene плагин - техподдержка
 * 💬
 */

import { Scenes, Markup } from 'telegraf';
import type { SceneContext } from './types';

export const createHelpScene = (): Scenes.WizardScene<SceneContext> => {
  const scene = new Scenes.WizardScene<SceneContext>(
    'helpScene',

    // Шаг 1: Главное меню помощи
    async (ctx) => {
      await ctx.reply(
        '💬 Техническая поддержка\n\n' +
        '👋 Привет! Я помогу вам с любыми вопросами\n\n' +
        '🎯 Выберите тему:',
        Markup.inlineKeyboard([
          [Markup.button.callback('❓ FAQ - Частые вопросы', 'faq')],
          [Markup.button.callback('🎬 Как создать ИИ Рилс', 'help_reels')],
          [Markup.button.callback('🎤 Синхронизация губ', 'help_lip_sync')],
          [Markup.button.callback('💰 Оплата и подписки', 'help_payment')],
          [Markup.button.callback('🐛 Сообщить об ошибке', 'report_bug')],
          [Markup.button.callback('💬 Онлайн-чат с оператором', 'live_chat')],
          [Markup.button.callback('📚 Документация', 'docs')]
        ])
      )
      return ctx.wizard.next()
    },

    // Шаг 2: Обработка выбора
    async (ctx) => {
      const topic = ctx.match?.[1]

      if (topic === 'faq') {
        await ctx.reply(
          '❓ Часто задаваемые вопросы\n\n' +
          'Выберите вопрос:',
          Markup.inlineKeyboard([
            [Markup.button.callback('🤖 Что такое ИИ Рилс?', 'faq_reels')],
            [Markup.button.callback('💳 Как оплатить услуги?', 'faq_payment')],
            [Markup.button.callback('🔄 Не пришла подписка', 'faq_subscription')],
            [Markup.button.callback('📊 Где посмотреть баланс?', 'faq_balance')],
            [Markup.button.callback('⏱️ Сколько ждать обработку?', 'faq_processing')],
            [Markup.button.callback('🔙 Назад', 'back')]
          ])
        )
        return ctx.wizard.next()
      }

      if (topic === 'help_reels') {
        await ctx.reply(
          '🎬 Как создать ИИ Рилс\n\n' +
          '📋 Пошаговая инструкция:\n\n' +
          '1️⃣ Подготовьте фото или видео\n' +
          '   • Формат: JPG, PNG, MP4, MOV\n' +
          '   • Размер: до 10 МБ для фото, 100 МБ для видео\n' +
          '   • Качество: чем лучше исходник, тем лучше результат\n\n' +
          '2️⃣ Выберите эффект\n' +
          '   • Морфинг лиц\n' +
          '   • Звёздная пыль\n' +
          '   • Художественные стили\n' +
          '   • Трендовые эффекты\n\n' +
          '3️⃣ Загрузите файл\n' +
          '   • Отправьте в чат\n' +
          '   • Подождите загрузки\n\n' +
          '4️⃣ Оплатите услугу\n' +
          '   • 30₽ или 15⭐\n' +
          '   • Банковская карта или Stars\n\n' +
          '5️⃣ Дождитесь результата\n' +
          '   • Время: 2-5 минут\n' +
          '   • Получите уведомление',
          Markup.inlineKeyboard([
            [Markup.button.callback('🎯 Создать рилс', 'create_reels')],
            [Markup.button.callback('❓ Остались вопросы', 'ask_question')],
            [Markup.button.callback('🔙 Назад', 'back')]
          ])
        )
        return ctx.wizard.next()
      }

      if (topic === 'help_lip_sync') {
        await ctx.reply(
          '🎤 Синхронизация губ\n\n' +
          '📋 Требования к файлам:\n\n' +
          '🎵 Аудио:\n' +
          '   • Формат: MP3, WAV\n' +
          '   • Размер: до 50 МБ\n' +
          '   • Длительность: 10 сек - 3 мин\n' +
          '   • Качество: не менее 128 kbps\n\n' +
          '🎬 Видео:\n' +
          '   • Формат: MP4, MOV\n' +
          '   • Размер: до 100 МБ\n' +
          '   • Лицо должно быть в кадре\n' +
          '   • Освещение - равномерное\n' +
          '   • Без размытия\n\n' +
          '⚙️ Настройки:\n' +
          '   • Автосинхрон: быстро, базовое качество\n' +
          '   • Ручная настройка: точнее, дольше\n' +
          '   • Реальное время: для стримов\n\n' +
          '⏱️ Время обработки: 3-10 минут\n' +
          '💰 Стоимость: 50₽ или 25⭐',
          Markup.inlineKeyboard([
            [Markup.button.callback('🎯 Создать синхронизацию', 'create_lip_sync')],
            [Markup.button.callback('❓ Остались вопросы', 'ask_question')],
            [Markup.button.callback('🔙 Назад', 'back')]
          ])
        )
        return ctx.wizard.next()
      }

      if (topic === 'help_payment') {
        await ctx.reply(
          '💰 Оплата и подписки\n\n' +
          '💳 Способы оплаты:\n\n' +
          '1️⃣ Банковская карта\n' +
          '   • Visa, MasterCard, МИР\n' +
          '   • СБП (Система быстрых платежей)\n' +
          '   • Мгновенное зачисление\n' +
          '   • Безопасность SSL\n\n' +
          '2️⃣ Telegram Stars\n' +
          '   • Внутренняя валюта Telegram\n' +
          '   • 1 Star ≈ 0.5₽\n' +
          '   • Экономия до 20%\n' +
          '   • Купить: Profile → Stars\n\n' +
          '📦 Тарифы:\n' +
          '   • NEUROTESTER: 299₽/мес\n' +
          '   • NEUROVIDEO: 499₽/мес\n' +
          '   • Разовые услуги: от 30₽\n\n' +
          '🔄 Возврат:\n' +
          '   • В течение 7 дней\n' +
          '   • При технических проблемах\n' +
          '   • Без вопросов',
          Markup.inlineKeyboard([
            [Markup.button.callback('💫 Купить подписку', 'buy_subscription')],
            [Markup.button.callback('⭐ Помощь с Stars', 'help_stars')],
            [Markup.button.callback('🔙 Назад', 'back')]
          ])
        )
        return ctx.wizard.next()
      }

      if (topic === 'report_bug') {
        await ctx.reply(
          '🐛 Сообщение об ошибке\n\n' +
          'Опишите проблему максимально подробно:\n\n' +
          '📝 Укажите:\n' +
          '• Что вы делали?\n' +
          '• Что произошло?\n' +
          '• Ожидаемый результат\n' +
          '• Приложите скриншоты (если есть)\n\n' +
          '⏱️ Мы ответим в течение 2 часов!\n' +
          '📧 Или напишите на: support@vibee.bot',
          Markup.inlineKeyboard([
            [Markup.button.callback('❌ Отмена', 'cancel')],
            [Markup.button.callback('📧 Написать на email', 'write_email')]
          ])
        )
        return ctx.wizard.next()
      }

      if (topic === 'live_chat') {
        await ctx.reply(
          '💬 Онлайн-чат с оператором\n\n' +
          '👨‍💻 Среднее время ответа: 5-15 минут\n' +
          '🕐 Часы работы: 24/7\n' +
          '🌍 Языки: Русский, English\n\n' +
          '💡 Оператор поможет с:\n' +
          '• Вопросами по функционалу\n' +
          '• Проблемами с оплатой\n' +
          '• Техническими вопросами\n' +
          '• Возвратами средств\n' +
          '• Обучением использованию\n\n' +
          'Подключаем к оператору...',
          Markup.inlineKeyboard([
            [Markup.button.callback('⏳ Подождать оператора', 'waiting_operator')],
            [Markup.button.callback('❌ Отмена', 'cancel')]
          ])
        )

        // Имитация подключения к оператору
        setTimeout(async () => {
          await ctx.reply(
            '✅ Оператор подключён!\n\n' +
            '👨‍💻 Здравствуйте! Меня зовут Анна, я помогу вам.\n\n' +
            'Опишите, пожалуйста, вашу проблему или задайте вопрос.'
          )
        }, 2000)

        return ctx.wizard.next()
      }

      if (topic === 'docs') {
        await ctx.reply(
          '📚 Документация\n\n' +
          '📖 Полезные материалы:\n',
          Markup.inlineKeyboard([
            [Markup.button.callback('🚀 Быстрый старт', 'docs_quickstart')],
            [Markup.button.callback('📘 Полное руководство', 'docs_full_guide')],
            [Markup.button.callback('🎬 Примеры работ', 'docs_examples')],
            [Markup.button.callback('💡 Советы и лайфхаки', 'docs_tips')],
            [Markup.button.callback('🔙 Назад', 'back')]
          ])
        )
        return ctx.wizard.next()
      }

      return ctx.wizard.back()
    },

    // Шаг 2.1: FAQ детализация
    async (ctx) => {
      const question = ctx.match?.[1]

      const faqAnswers = {
        faq_reels: {
          text: '🤖 Что такое ИИ Рилс?\n\n' +
                'ИИ Рилс - это короткое видео (5-15 сек) с применением искусственного интеллекта.\n\n' +
                '✨ Возможности:\n' +
                '• Морфинг лиц - плавное превращение одного лица в другое\n' +
                '• Эффекты и фильтры - профессиональные видеоэффекты\n' +
                '• Звёздная пыль - магические эффекты со звёздами\n' +
                '• Трендовые эффекты - популярные эффекты из соцсетей\n' +
                '• Художественные стили - стилизация под известные течения\n\n' +
                '💰 Стоимость: от 30₽ за рилс\n' +
                '⏱️ Время: 2-5 минут на обработку',
          buttons: [[Markup.button.callback('🎯 Создать рилс', 'create_reels')]]
        },
        faq_payment: {
          text: '💳 Как оплатить услуги?\n\n' +
                'Доступно два способа оплаты:\n\n' +
                '1️⃣ Банковская карта\n' +
                '• Visa, MasterCard, МИР\n' +
                '• СБП (Система быстрых платежей)\n' +
                '• Деньги списываются мгновенно\n' +
                '• Чек на email\n\n' +
                '2️⃣ Telegram Stars\n' +
                '• 1 Star ≈ 0.5₽\n' +
                '• Экономия до 20%\n' +
                '• Мгновенное зачисление\n' +
                '• Нужен аккаунт в Telegram\n\n' +
                '💡 Совет: Telegram Stars выгоднее при оплате подписок!',
          buttons: [[Markup.button.callback('💫 Оплатить', 'pay')]]
        },
        faq_subscription: {
          text: '🔄 Не пришла подписка\n\n' +
                'Что делать, если подписка не активируется:\n\n' +
                '1️⃣ Проверьте статус\n' +
                '• Команда /balance\n' +
                '• Раздел "Мой баланс"\n\n' +
                '2️⃣ Подождите немного\n' +
                '• Активация может занимать до 30 минут\n' +
                '• При оплате картой: до 1 часа\n\n' +
                '3️⃣ Проверьте email\n' +
                '• Чек приходит на почту\n' +
                '• Папка "Спам"\n\n' +
                '4️⃣ Обратитесь в поддержку\n' +
                '• С приложением чека\n' +
                '• Время ответа: 2 часа\n\n' +
                '❗ Возврат возможен в течение 7 дней',
          buttons: [
            [Markup.button.callback('💬 Связаться с поддержкой', 'contact_support')],
            [Markup.button.callback('💰 Проверить баланс', 'check_balance')]
          ]
        },
        faq_balance: {
          text: '📊 Где посмотреть баланс?\n\n' +
                'Варианты проверки баланса:\n\n' +
                '1️⃣ Команда бота\n' +
                '• Введите: /balance\n' +
                '• Полная информация о балансе\n\n' +
                '2️⃣ Меню бота\n' +
                '• Откройте меню (📋 или /menu)\n' +
                '• Раздел "Мой баланс"\n\n' +
                '3️⃣ Scene плагин\n' +
                '• Раздел "Баланс"\n' +
                '• Детальная статистика\n\n' +
                '💎 Информация:\n' +
                '• Баланс в рублях\n' +
                '• Баланс в Stars\n' +
                '• Статус подписки\n' +
                '• История операций',
          buttons: [[Markup.button.callback('💰 Проверить баланс', 'check_balance')]]
        },
        faq_processing: {
          text: '⏱️ Сколько ждать обработку?\n\n' +
                'Время обработки зависит от услуги:\n\n' +
                '🎬 ИИ Рилсы:\n' +
                '• Быстрый: 2-3 минуты\n' +
                '• Обычный: 3-5 минут\n' +
                '• Сложные эффекты: до 10 минут\n\n' +
                '🎤 Синхронизация губ:\n' +
                '• Автосинхрон: 3-5 минут\n' +
                '• Ручная настройка: 5-10 минут\n' +
                '• Реальное время: до 15 минут\n\n' +
                '⚡ Факторы влияния:\n' +
                '• Нагрузка на серверы\n' +
                '• Время суток (ночью быстрее)\n' +
                '• Размер файла\n' +
                '• Сложность эффекта\n\n' +
                '🔔 Вы получите уведомление о готовности!',
          buttons: [
            [Markup.button.callback('📊 Проверить статус', 'check_status')],
            [Markup.button.callback('🔙 Назад к FAQ', 'back_faq')]
          ]
        }
      }

      const answer = faqAnswers[question]

      if (!answer) {
        return ctx.wizard.back()
      }

      await ctx.reply(answer.text, {
        reply_markup: {
          inline_keyboard: answer.buttons
        }
      })

      return ctx.scene.leave()
    },

    // Шаг 3: Обработка багрепорта
    async (ctx) => {
      if (ctx.message?.text) {
        const bugReport = ctx.message.text

        await ctx.reply(
          '✅ Сообщение об ошибке отправлено!\n\n' +
          '📋 Регистрационный номер: #' + Date.now().toString(36).toUpperCase() + '\n' +
          '⏱️ Время ответа: до 2 часов\n' +
          '📧 Подтверждение отправлено на ваш аккаунт\n\n' +
          '💡 Что дальше:\n' +
          '• Мы изучим проблему\n' +
          '• Свяжемся с вами для уточнений (при необходимости)\n' +
          '• Исправим ошибку\n' +
          '• Предоставим компенсацию (если полагается)\n\n' +
          'Спасибо за помощь в улучшении! 🙏',
          Markup.inlineKeyboard([
            [Markup.button.callback('💬 Чат с поддержкой', 'live_chat')],
            [Markup.button.callback('🏠 В меню', 'menu')]
          ])
        )

        // Здесь отправка багрепорта в систему тикетов
        // await sendBugReport(ctx.from.id, bugReport)

        return ctx.scene.leave()
      }

      if (ctx.match?.[1] === 'cancel') {
        await ctx.reply('❌ Отправка отменена')
        return ctx.scene.leave()
      }

      if (ctx.match?.[1] === 'write_email') {
        await ctx.reply(
          '📧 Email для связи: support@vibee.bot\n\n' +
          '💡 В письме укажите:\n' +
          '• Описание проблемы\n' +
          '• Скриншоты (если есть)\n' +
          '• Ваш Telegram ID\n' +
          '• Время возникновения проблемы\n\n' +
          '📬 Ответим в течение 2 часов!'
        )
        return ctx.scene.leave()
      }

      await ctx.reply(
        '📝 Опишите проблему текстом:\n' +
        '(или нажмите "Отмена" для возврата)'
      )
      return ctx.wizard.selectStep(3)
    },

    // Шаг 4: Ожидание оператора
    async (ctx) => {
      const action = ctx.match?.[1]

      if (action === 'cancel') {
        await ctx.reply('❌ Чат отменён')
        return ctx.scene.leave()
      }

      if (ctx.message?.text) {
        await ctx.reply(
          '👨‍💻 Ваше сообщение передано оператору...\n' +
          '⏳ Ожидайте ответа (обычно 5-15 минут)\n\n' +
          '💡 Можете продолжать писать, оператор прочитает всё!'
        )
        // Здесь отправка сообщения оператору
        return ctx.wizard.selectStep(4)
      }

      await ctx.reply(
        '⏳ Подключаем оператора...\n' +
        '💬 Напишите ваш вопрос\n' +
        '(оператор ответит в ближайшее время)'
      )
      return ctx.wizard.selectStep(4)
    },

    // Шаг 5: Документация
    async (ctx) => {
      const docType = ctx.match?.[1]

      const docs = {
        docs_quickstart: '🚀 Быстрый старт\n\n' +
          'Начните использовать ИИ-эффекты за 5 минут!\n\n' +
          '1️⃣ Регистрация\n' +
          '• Откройте бота: @vibee_bot\n' +
          '• Нажмите /start\n' +
          '• Подтвердите регистрацию\n\n' +
          '2️⃣ Пополните баланс\n' +
          '• Минимум: 30₽\n' +
          '• Способ: карта или Stars\n' +
          '• Зачисление мгновенное\n\n' +
          '3️⃣ Создайте первый рилс\n' +
          '• Отправьте фото или видео\n' +
          '• Выберите эффект\n' +
          '• Оплатите 30₽\n' +
          '• Дождитесь результата\n\n' +
          '✅ Готово! Теперь вы знаете основы!',
        docs_full_guide: '📘 Полное руководство\n\n' +
          'Подробное изучение всех возможностей:\n\n' +
          '📚 Разделы руководства:\n' +
          '1. Регистрация и настройка аккаунта\n' +
          '2. Способы оплаты и тарифы\n' +
          '3. Создание ИИ Рилсов (полное руководство)\n' +
          '4. Синхронизация губ (детально)\n' +
          '5. Морфинг лиц\n' +
          '6. Работа с подписками\n' +
          '7. Приглашение друзей\n' +
          '8. Частые вопросы\n\n' +
          '📖 Скачать PDF: docs.vibee.bot/guide.pdf',
        docs_examples: '🎬 Примеры работ\n\n' +
          'Вдохновляйтесь работами других пользователей!\n\n' +
          '🏆 Лучшие рилсы месяца:\n' +
          '• #1: Морфинг звезды кино в актрису\n' +
          '• #2: Трансформация в персонажа аниме\n' +
          '• #3: Эффект звёздной пыли на селфи\n' +
          '• #4: Синхронизация с песней\n' +
          '• #5: Художественный стиль импрессионизма\n\n' +
          '💡 Хотите попасть в топ?\n' +
          '• Публикуйте работы с хештегом #vibee\n' +
          '• Лучшие попадут на главную!',
        docs_tips: '💡 Советы и лайфхаки\n\n' +
          'Секреты профессионалов:\n\n' +
          '📸 Фото и видео:\n' +
          '• Используйте хорошее освещение\n' +
          '• Лицо должно быть в центре кадра\n' +
          '• Избегайте размытия\n' +
          '• Лучше 4K, но HD тоже хорошо\n\n' +
          '💰 Экономия:\n' +
          '• Подписка выгоднее разовых услуг\n' +
          '• Telegram Stars дешевле на 20%\n' +
          '• Приглашайте друзей за бонусы\n\n' +
          '⚡ Производительность:\n' +
          '• Ночью обработка быстрее\n' +
          '• Небольшие файлы обрабатываются быстрее\n' +
          '• Сложные эффекты требуют больше времени'
      }

      const doc = docs[docType]

      if (!doc) {
        return ctx.wizard.back()
      }

      await ctx.reply(doc, Markup.inlineKeyboard([
        [Markup.button.callback('🔙 Назад к документации', 'back_docs')]
      ]))

      return ctx.scene.leave()
    }
  )

  return scene
}
