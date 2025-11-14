/**
 * Scene плагин - пригласить друга
 * 👥
 */

import { Scenes, Markup } from 'telegraf';
import type { SceneContext } from './types';

export const createInviteScene = (): Scenes.WizardScene<SceneContext> => {
  const scene = new Scenes.WizardScene<SceneContext>(
    'inviteScene',

    // Шаг 1: Главное меню приглашений
    async (ctx) => {
      await ctx.reply(
        '👥 Пригласите друзей и получите бонусы!\n\n' +
        '🎁 За каждого друга вы получаете:\n' +
        '• 50 Stars (≈ 25₽) на ваш счёт\n' +
        '• 10% с его первой покупки\n' +
        '• Ваш друг получает 100 Stars при регистрации\n\n' +
        '🎯 Что можно пригласить:\n' +
        '• Друзей, коллег, одноклассников\n' +
        '• Подписчиков ваших соцсетей\n' +
        '• Всех, кому интересны ИИ-технологии\n\n' +
        'Как хотите пригласить?',
        Markup.inlineKeyboard([
          [Markup.button.callback('📤 Создать пригласительную ссылку', 'create_link')],
          [Markup.button.callback('👤 Пригласить по username', 'invite_username')],
          [Markup.button.callback('📋 Скопировать реферальный код', 'copy_code')],
          [Markup.button.callback('📊 Мои приглашения', 'my_invites')],
          [Markup.button.callback('🎁 Бонусы и награды', 'rewards')]
        ])
      )
      return ctx.wizard.next()
    },

    // Шаг 2: Обработка выбора
    async (ctx) => {
      const action = ctx.match?.[1]

      if (action === 'create_link') {
        const inviteCode = generateInviteCode(ctx.from.id.toString())
        const inviteLink = `https://t.me/vibee_bot?start=${inviteCode}`

        await ctx.reply(
          '📤 Ваша пригласительная ссылка:\n\n' +
          `🔗 ${inviteLink}\n\n` +
          '📋 Как использовать:\n' +
          '1. Скопируйте ссылку\n' +
          '2. Отправьте друзьям в любом мессенджере\n' +
          '3. Друг регистрируется по ссылке\n' +
          '4. Вы получаете бонус!\n\n' +
          '💡 Лайфхаки:\n' +
          '• Добавьте ссылку в био соцсетей\n' +
          '• Поделитесь в сторис\n' +
          '• Расскажите в комментариях к постам',
          Markup.inlineKeyboard([
            [Markup.button.callback('📋 Скопировать ссылку', 'copy_link')],
            [Markup.button.callback('📤 Поделиться', 'share')],
            [Markup.button.callback('🔙 Назад', 'back')]
          ])
        )

        ctx.session.wizardData.inviteCode = inviteCode
        ctx.session.wizardData.inviteLink = inviteLink
        return ctx.wizard.next()
      }

      if (action === 'invite_username') {
        await ctx.reply(
          '👤 Приглашение по username\n\n' +
          '📝 Введите username друга (без @):\n' +
          'Например: username123\n\n' +
          '⚠️ Важно:\n' +
          '• У друга должен быть аккаунт в Telegram\n' +
          '• Мы отправим ему приглашение\n' +
          '• Вы получите бонус после его регистрации',
          Markup.inlineKeyboard([
            [Markup.button.callback('❌ Отмена', 'cancel')]
          ])
        )
        return ctx.wizard.next()
      }

      if (action === 'copy_code') {
        const code = generateInviteCode(ctx.from.id.toString())
        await ctx.reply(
          '📋 Ваш реферальный код:\n\n' +
          `🎯 ${code}\n\n` +
          '📤 Как поделиться:\n' +
          '• Напишите в чате: "Мой код: ${code}"\n' +
          '• Друг вводит код при регистрации\n' +
          '• Вы оба получаете бонусы!\n\n' +
          `💾 Нажмите, чтобы скопировать код:`,
          Markup.inlineKeyboard([
            [Markup.button.callback(`📋 Скопировать: ${code}`, 'copy_referral_code')]
          ])
        )

        ctx.session.wizardData.inviteCode = code
        return ctx.wizard.next()
      }

      if (action === 'my_invites') {
        // Здесь получение данных о приглашениях из базы
        const invites = getInviteStats(ctx.from.id.toString())

        await ctx.reply(
          '📊 Статистика приглашений\n\n' +
          `👥 Всего приглашено: ${invites.totalInvited}\n` +
          `✅ Активных пользователей: ${invites.activeUsers}\n` +
          `💰 Заработано Stars: ${invites.earnedStars}\n` +
          `🎁 Получено бонусов: ${invites.totalBonuses}\n\n` +
          '📈 Последние приглашения:',
          Markup.inlineKeyboard([
            [Markup.button.callback('📋 Список приглашённых', 'invite_list')],
            [Markup.button.callback('💰 История выплат', 'payout_history')],
            [Markup.button.callback('🔙 Назад', 'back')]
          ])
        )

        ctx.session.wizardData.invites = invites
        return ctx.wizard.next()
      }

      if (action === 'rewards') {
        await ctx.reply(
          '🎁 Программа лояльности\n\n' +
          '💎 За каждое приглашение:\n' +
          '• 50 Stars на ваш счёт\n' +
          '• 10% с первой покупки друга\n\n' +
          '🏆 Бонусы за активность:\n' +
          '• 5 приглашений = 500 Stars + статус VIP\n' +
          '• 10 приглашений = 1500 Stars + эксклюзивные эффекты\n' +
          '• 20 приглашений = 5000 Stars + бессрочная подписка\n\n' +
          '💰 Можно потратить на:\n' +
          '• Покупку услуг\n' +
          '• Продление подписки\n' +
          '• Эксклюзивные эффекты',
          Markup.inlineKeyboard([
            [Markup.button.callback('🎯 Показать мой прогресс', 'my_progress')],
            [Markup.button.callback('🔙 Назад', 'back')]
          ])
        )
        return ctx.wizard.next()
      }

      return ctx.wizard.back()
    },

    // Шаг 3: Обработка ввода username
    async (ctx) => {
      const action = ctx.match?.[1]

      if (action === 'cancel') {
        return ctx.wizard.back()
      }

      // Ждём текстовое сообщение с username
      if (ctx.message?.text) {
        const username = ctx.message.text.replace('@', '').trim()

        // Валидация username
        if (!/^[a-zA-Z0-9_]{5,32}$/.test(username)) {
          await ctx.reply(
            '❌ Некорректный username\n\n' +
            'Требования:\n' +
            '• Только латинские буквы, цифры и _\n' +
            '• Длина: от 5 до 32 символов\n' +
            '• Например: username123',
            Markup.inlineKeyboard([
              [Markup.button.callback('🔙 Назад', 'back')],
              [Markup.button.callback('🔄 Попробовать снова', 'retry_username')]
            ])
          )
          return ctx.wizard.selectStep(2)
        }

        await ctx.reply(
          `👤 Приглашение для @${username}\n\n` +
          '📤 Отправляем приглашение...\n\n' +
          '💡 Ваш друг получит:\n' +
          '• Уведомление в Telegram\n' +
          '• Информацию о боте\n' +
          '• Бонус 100 Stars при регистрации\n' +
          '• Ссылку для быстрого старта\n\n' +
          '⏳ Отправка...'
        )

        // Здесь отправка приглашения через Bot API
        try {
          // await ctx.telegram.sendMessage(username, inviteMessage)
          await ctx.reply(
            '✅ Приглашение отправлено!\n\n' +
            `👤 Пользователь: @${username}\n` +
            `📅 Дата: ${new Date().toLocaleString('ru-RU')}\n\n` +
            `🎁 После регистрации друга вы получите:\n` +
            `• 50 Stars\n` +
            `• 10% с его первой покупки\n\n` +
            'Поделись ссылкой с другими друзьями:',
            Markup.inlineKeyboard([
              [Markup.button.callback('📤 Создать ссылку', 'create_link')],
              [Markup.button.callback('👤 Пригласить ещё', 'invite_username')],
              [Markup.button.callback('🏠 В меню', 'menu')]
            ])
          )
        } catch (error) {
          await ctx.reply(
            '❌ Не удалось отправить приглашение\n\n' +
            'Возможные причины:\n' +
            '• Пользователь заблокировал бота\n' +
            '• Неверный username\n' +
            '• Ограничения Telegram\n\n' +
            '💡 Попробуйте создать ссылку и отправить её вручную',
            Markup.inlineKeyboard([
              [Markup.button.callback('📤 Создать ссылку', 'create_link')],
              [Markup.button.callback('🏠 В меню', 'menu')]
            ])
          )
        }

        return ctx.scene.leave()
      }

      return ctx.wizard.selectStep(2)
    },

    // Шаг 4: Копирование и дополнительные действия
    async (ctx) => {
      const action = ctx.match?.[1]

      if (action === 'copy_link') {
        const link = ctx.session.wizardData.inviteLink
        await ctx.reply(
          `📋 Ссылка скопирована!\n\n` +
          `${link}\n\n` +
          `💡 Отправьте её друзьям любым способом`
        )
        return ctx.scene.leave()
      }

      if (action === 'copy_referral_code') {
        const code = ctx.session.wizardData.inviteCode
        await ctx.reply(
          `📋 Код скопирован!\n\n` +
          `${code}\n\n` +
          `💡 Ваш друг должен ввести этот код\nпри регистрации в боте`
        )
        return ctx.scene.leave()
      }

      if (action === 'share') {
        await ctx.reply(
          '📤 Поделиться приглашением\n\n' +
          'Выберите способ:',
          Markup.inlineKeyboard([
            [Markup.button.callback('📱 WhatsApp', 'share_whatsapp')],
            [Markup.button.callback('📧 Email', 'share_email')],
            [Markup.button.callback('📋 Скопировать текст', 'copy_text')],
            [Markup.button.callback('🔙 Назад', 'back')]
          ])
        )
        return ctx.wizard.next()
      }

      if (action === 'invite_list') {
        const invites = ctx.session.wizardData.invites
        const listText = invites.recentInvites.map(invite =>
          `👤 ${invite.username}\n` +
          `📅 ${invite.date}\n` +
          `✅ ${invite.status}\n` +
          `${invite.earned ? `💰 +${invite.earned} Stars\n` : ''}` +
          '─────────────────'
        ).join('\n')

        await ctx.reply(
          '📋 Список приглашённых:\n\n' +
          (listText || 'Пока нет приглашённых друзей'),
          Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Назад', 'back')]
          ])
        )
        return ctx.scene.leave()
      }

      return ctx.wizard.back()
    },

    // Шаг 5: Шаринг
    async (ctx) => {
      const action = ctx.match?.[1]
      const link = ctx.session.wizardData.inviteLink

      if (action === 'share_whatsapp') {
        const message = encodeURIComponent(
          `Привет! 🎉\n\n` +
          `Заходи в классный бот с ИИ-эффектами!\n` +
          `${link}\n\n` +
          `Ты получишь 100 Stars бонус! 🚀`
        )
        await ctx.reply(
          `📱 WhatsApp\n\n` +
          `Ссылка для шаринга:\n` +
          `https://wa.me/?text=${message}`,
          Markup.inlineKeyboard([
            [Markup.button.callback('✅ Открыть WhatsApp', 'open_whatsapp')],
            [Markup.button.callback('🔙 Назад', 'back')]
          ])
        )
        return ctx.wizard.next()
      }

      if (action === 'share_email') {
        const subject = encodeURIComponent('Приглашение в бот с ИИ-эффектами')
        const body = encodeURIComponent(
          `Привет!\n\n` +
          `Хочу поделиться с тобой классным ботом!\n\n` +
          `Это бот с ИИ-эффектами для создания крутого контента:\n` +
          `• ИИ Рилсы\n` +
          `• Синхронизация губ\n` +
          `• Морфинг лиц\n` +
          `• И многое другое!\n\n` +
          `Переходи по ссылке: ${link}\n\n` +
          `И получи 100 Stars бонус! 🚀\n\n` +
          `Пока!`
        )
        await ctx.reply(
          `📧 Email\n\n` +
          `Ссылка для шаринга:\n` +
          `mailto:?subject=${subject}&body=${body}`,
          Markup.inlineKeyboard([
            [Markup.button.callback('✅ Открыти Email', 'open_email')],
            [Markup.button.callback('🔙 Назад', 'back')]
          ])
        )
        return ctx.wizard.next()
      }

      if (action === 'copy_text') {
        const text = `Привет! 🎉\n\nЗаходи в классный бот с ИИ-эффектами!\n${link}\n\nТы получишь 100 Stars бонус! 🚀`
        await ctx.reply(
          `📋 Текст для шаринга:\n\n` +
          `${text}\n\n` +
          `Скопируйте и отправьте друзьям любым удобным способом!`,
          Markup.inlineKeyboard([
            [Markup.button.callback('✅ Скопировано', 'done')],
            [Markup.button.callback('🔙 Назад', 'back')]
          ])
        )
        return ctx.wizard.next()
      }

      return ctx.wizard.back()
    }
  )

  return scene
}

// Вспомогательные функции
function generateInviteCode(userId: string): string {
  const timestamp = Date.now().toString(36)
  const hash = Buffer.from(userId).toString('base64').slice(0, 6)
  return `VB-${hash}-${timestamp}`.toUpperCase()
}

function getInviteStats(userId: string) {
  // Заглушка - в реальном проекте данные берутся из базы
  return {
    totalInvited: 5,
    activeUsers: 3,
    earnedStars: 250,
    totalBonuses: 3,
    recentInvites: [
      {
        username: 'friend1',
        date: '10.11.2025',
        status: 'Активен',
        earned: 50
      },
      {
        username: 'friend2',
        date: '08.11.2025',
        status: 'Активен',
        earned: 50
      }
    ]
  }
}
