#!/usr/bin/env python3
"""
🌈 РАДУЖНЫЙ МОСТ - Автоматический самотест
Отправляет /selftest боту и читает результат
"""

import asyncio
import os
import sys
from telethon import TelegramClient
from dotenv import load_dotenv

# Загружаем .env
load_dotenv('../.env')

API_ID = int(os.getenv('TELEGRAM_API_ID', '0'))
API_HASH = os.getenv('TELEGRAM_API_HASH', '')
PHONE = os.getenv('TELEGRAM_PHONE', '')
BOT_USERNAME = 'agent_vibecoder_bot'

print('🌈 РАДУЖНЫЙ МОСТ - Автоматический самотест')
print('=' * 60)

async def main():
    # Создаём клиент
    client = TelegramClient('vibee_selftest_session', API_ID, API_HASH)

    await client.connect()

    # Проверяем авторизацию
    if not await client.is_user_authorized():
        print('📱 Требуется авторизация...')
        await client.send_code_request(PHONE)
        code = input('Введи код из Telegram: ')
        await client.sign_in(PHONE, code)

    print(f'✅ Авторизован как: {PHONE}')

    # Получаем сущность бота
    bot = await client.get_entity(BOT_USERNAME)
    print(f'🤖 Нашёл бота: @{BOT_USERNAME}')

    # Отправляем /selftest
    print('📤 Отправляю: /selftest')
    await client.send_message(bot, '/selftest')

    print('⏳ Жду ответ от бота...')

    # Читаем последние сообщения от бота
    messages = []
    async for message in client.iter_messages(bot, limit=10):
        if message.out:  # Пропускаем наши сообщения
            continue
        messages.append(message)
        if len(messages) >= 2:  # Ожидаем 2 сообщения от бота
            break

    print()
    print('=' * 60)
    print('📨 ОТВЕТ БОТА:')
    print('=' * 60)

    for msg in reversed(messages):
        print(msg.text)
        print()

    print('=' * 60)

    # Проверяем результат
    full_response = '\n'.join([msg.text for msg in messages])

    if 'Итого: 1/1 тестов пройдено' in full_response or '✅' in full_response:
        print('🎉 САМОТЕСТ ПРОЙДЕН!')
        print('🌈 РАДУЖНЫЙ МОСТ РАБОТАЕТ!')
        return 0
    else:
        print('⚠️ Самотест не прошёл полностью')
        return 1

    await client.disconnect()

if __name__ == '__main__':
    try:
        result = asyncio.run(main())
        sys.exit(result)
    except Exception as e:
        print(f'❌ Ошибка: {e}')
        sys.exit(1)
