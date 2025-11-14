#!/usr/bin/env python3
"""
🌈 РАДУЖНЫЙ МОСТ - Autonomous Telegram Bot Controller

Полностью автономный контроллер для Telegram бота.
Может отправлять сообщения, тестировать, разрабатывать и фиксить баги.

Usage:
    python scripts/autonomous-telegram-bot.py send-message "@agent_vibecoder_bot" "/selftest"
    python scripts/autonomous-telegram-bot.py test
    python scripts/autonomous-telegram-bot.py develop "Add new feature"
"""

import os
import sys
import asyncio
from telethon import TelegramClient
from telethon.sessions import StringSession
from dotenv import load_dotenv
import subprocess
import time

# Загружаем .env
load_dotenv()

API_ID = int(os.getenv('TELEGRAM_API_ID', '0'))
API_HASH = os.getenv('TELEGRAM_API_HASH', '')
SESSION_STRING = os.getenv('TELEGRAM_SESSION_STRING', '')
BOT_USERNAME = 'agent_vibecoder_bot'

if not API_ID or not API_HASH:
    print('❌ TELEGRAM_API_ID и TELEGRAM_API_HASH обязательны в .env')
    sys.exit(1)

if not SESSION_STRING:
    print('❌ TELEGRAM_SESSION_STRING не найден в .env')
    print('')
    print('Запусти сначала:')
    print('  python scripts/autonomous-telegram-auth.py')
    print('')
    sys.exit(1)

class AutonomousTelegramBot:
    """Полностью автономный контроллер бота"""

    def __init__(self):
        self.client = None

    async def connect(self):
        """Подключиться к Telegram"""
        print('🔌 Подключаюсь к Telegram...')
        self.client = TelegramClient(StringSession(SESSION_STRING), API_ID, API_HASH)
        await self.client.connect()

        if not await self.client.is_user_authorized():
            print('❌ Session недействителен! Запусти autonomous-telegram-auth.py')
            sys.exit(1)

        me = await self.client.get_me()
        print(f'✅ Подключен как: {me.first_name} (@{me.username})')
        return self

    async def send_message(self, username, message):
        """Отправить сообщение боту"""
        print(f'📤 Отправляю сообщение @{username}: {message}')

        try:
            # Получаем entity бота
            bot = await self.client.get_entity(username)
            print(f'✅ Нашёл бота: {bot.first_name}')

            # Отправляем сообщение
            await self.client.send_message(bot, message)
            print(f'✅ Сообщение отправлено!')

            # Ждём ответ
            print('⏳ Жду ответ...')
            await asyncio.sleep(3)

            # Читаем последние сообщения
            messages = []
            async for msg in self.client.iter_messages(bot, limit=5):
                if not msg.out:  # Не наши сообщения
                    messages.append(msg)

            if messages:
                print('')
                print('=' * 60)
                print('📨 ОТВЕТ БОТА:')
                print('=' * 60)
                for msg in reversed(messages):
                    # Показываем текст сообщения
                    if msg.text:
                        print(msg.text)
                    elif msg.message:
                        print(msg.message)

                    # Показываем inline кнопки если есть
                    if hasattr(msg, 'reply_markup') and msg.reply_markup:
                        if hasattr(msg.reply_markup, 'rows'):
                            print('\n🎹 КНОПКИ:')
                            for row in msg.reply_markup.rows:
                                buttons_text = ' | '.join([btn.text for btn in row.buttons])
                                print(f'  [{buttons_text}]')

                    print('')
                print('=' * 60)
            else:
                print('⚠️ Ответ не получен (возможно бот ещё не запущен)')

            return True

        except Exception as e:
            print(f'❌ Ошибка: {e}')
            return False

    async def run_selftest(self):
        """Запустить selftest автономно"""
        print('🌈 РАДУЖНЫЙ МОСТ - Autonomous SelfTest')
        print('=' * 60)
        print('')

        # Отправляем /selftest
        success = await self.send_message(BOT_USERNAME, '/selftest')

        if success:
            print('')
            print('🎉 Selftest запущен автономно!')
            print('🌈 РАДУЖНЫЙ МОСТ работает!')

        return success

    async def develop_and_test(self, feature_description):
        """Разработать фичу и протестировать её"""
        print('🌈 РАДУЖНЫЙ МОСТ - Autonomous Development')
        print('=' * 60)
        print(f'📝 Задача: {feature_description}')
        print('')

        # 1. Разработка (TODO: интеграция с Claude Code)
        print('💻 Фаза РАЗРАБОТКИ...')
        print('   (пока заглушка, будет интеграция с Claude Code)')

        # 2. Тестирование
        print('')
        print('🧪 Фаза ТЕСТИРОВАНИЯ...')
        await self.run_selftest()

        # 3. Фиксация результатов
        print('')
        print('📊 Фаза АНАЛИЗА...')
        print('   (анализ результатов тестов)')

        return True

    async def disconnect(self):
        """Отключиться от Telegram"""
        if self.client:
            await self.client.disconnect()
            print('✅ Отключен от Telegram')


async def main():
    """Главная функция"""
    if len(sys.argv) < 2:
        print('Usage:')
        print('  python scripts/autonomous-telegram-bot.py send-message <username> <message>')
        print('  python scripts/autonomous-telegram-bot.py read-messages <username> [limit]')
        print('  python scripts/autonomous-telegram-bot.py validate-session')
        print('  python scripts/autonomous-telegram-bot.py test')
        print('  python scripts/autonomous-telegram-bot.py develop "<feature>"')
        sys.exit(1)

    command = sys.argv[1]

    # Validate session command (no connection needed)
    if command == 'validate-session':
        try:
            from telethon import TelegramClient
            from telethon.sessions import StringSession
            from dotenv import load_dotenv
            import os

            load_dotenv()
            api_id = int(os.getenv('TELEGRAM_API_ID', '0'))
            api_hash = os.getenv('TELEGRAM_API_HASH', '')
            session_string = os.getenv('TELEGRAM_SESSION_STRING', '')

            if not session_string:
                print('❌ Session string not found')
                sys.exit(1)

            client = TelegramClient(StringSession(session_string), api_id, api_hash)
            await client.connect()

            if await client.is_user_authorized():
                me = await client.get_me()
                print(f'✅ Session validated: {me.first_name} (@{me.username})')
                print('🌈 РАДУЖНЫЙ МОСТ готов к автономной работе!')
                await client.disconnect()
                sys.exit(0)
            else:
                print('❌ Session invalid')
                await client.disconnect()
                sys.exit(1)

        except Exception as e:
            print(f'❌ Validation error: {e}')
            sys.exit(1)

    # All other commands need bot connection
    bot = AutonomousTelegramBot()
    await bot.connect()

    try:
        if command == 'send-message':
            if len(sys.argv) < 4:
                print('Usage: send-message <username> <message>')
                sys.exit(1)

            username = sys.argv[2].lstrip('@')
            message = sys.argv[3]
            await bot.send_message(username, message)

        elif command == 'read-messages':
            if len(sys.argv) < 3:
                print('Usage: read-messages <username> [limit]')
                sys.exit(1)

            username = sys.argv[2].lstrip('@')
            limit = int(sys.argv[3]) if len(sys.argv) > 3 else 10
            await bot.read_messages(username, limit)

        elif command == 'test':
            await bot.run_selftest()

        elif command == 'develop':
            if len(sys.argv) < 3:
                print('Usage: develop "<feature description>"')
                sys.exit(1)

            feature = sys.argv[2]
            await bot.develop_and_test(feature)

        else:
            print(f'❌ Неизвестная команда: {command}')
            sys.exit(1)

    finally:
        await bot.disconnect()


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print('\n❌ Прервано')
        sys.exit(1)
    except Exception as e:
        print(f'\n❌ Ошибка: {e}')
        import traceback
        traceback.print_exc()
        sys.exit(1)
