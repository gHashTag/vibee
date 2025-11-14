#!/usr/bin/env python3
"""
🌈 РАДУЖНЫЙ МОСТ - Autonomous Telegram Authentication

Создает session string ОДИН РАЗ, затем использует его вечно для автономной работы.

Usage:
    python scripts/autonomous-telegram-auth.py
"""

import os
import sys
import asyncio
from telethon import TelegramClient
from telethon.sessions import StringSession
from dotenv import load_dotenv

# Загружаем .env
load_dotenv()

API_ID = int(os.getenv('TELEGRAM_API_ID', '0'))
API_HASH = os.getenv('TELEGRAM_API_HASH', '')
PHONE = os.getenv('TELEGRAM_PHONE', '')
SESSION_STRING = os.getenv('TELEGRAM_SESSION_STRING', '')

if not API_ID or not API_HASH:
    print('❌ TELEGRAM_API_ID и TELEGRAM_API_HASH обязательны в .env')
    sys.exit(1)

print('🌈 РАДУЖНЫЙ МОСТ - Autonomous Telegram Auth')
print('=' * 60)

async def check_existing_session():
    """Проверить существующий session"""
    if not SESSION_STRING:
        return False

    print('✅ Session string найден в .env')
    print('🌈 Проверяю валидность...')

    try:
        client = TelegramClient(StringSession(SESSION_STRING), API_ID, API_HASH)
        await client.connect()

        if not await client.is_user_authorized():
            print('⚠️ Session недействителен')
            await client.disconnect()
            return False

        me = await client.get_me()
        print(f'✅ Авторизован как: {me.first_name} (@{me.username})')
        print(f'📱 Phone: {me.phone}')
        print('')
        print('🌈 РАДУЖНЫЙ МОСТ готов к автономной работе!')

        await client.disconnect()
        return True

    except Exception as e:
        print(f'⚠️ Session string недействителен: {e}')
        return False

async def create_new_session():
    """Создать новый session (интерактивно)"""
    print('')
    print('📝 Создание session string для автономной работы')
    print('=' * 60)
    print('')
    print('⚠️ ВАЖНО: Это нужно сделать ОДИН РАЗ!')
    print('   После этого бот сможет работать ПОЛНОСТЬЮ АВТОНОМНО!')
    print('')

    phone = PHONE
    if not phone:
        phone = input('📱 Введи номер телефона (с кодом страны, например +7...): ')

    print(f'📱 Номер: {phone}')
    print('')
    print('📨 Telegram отправит тебе код подтверждения...')
    print('')

    client = TelegramClient(StringSession(), API_ID, API_HASH)
    await client.connect()

    try:
        # Отправляем запрос кода
        await client.send_code_request(phone)
        print('✅ Код отправлен в Telegram')
        print('')

        # Запрашиваем код у пользователя
        code = input('👤 Введи код из Telegram: ')

        # Авторизуемся
        try:
            await client.sign_in(phone, code)
        except Exception as e:
            # Проверяем, нужен ли пароль 2FA
            if 'password' in str(e).lower() or 'two-steps' in str(e).lower():
                print('')
                print('🔐 Обнаружена двухфакторная аутентификация (2FA)')
                password = input('👤 Введи пароль от Telegram (2FA): ')

                # Авторизуемся с паролем
                await client.sign_in(password=password)
            else:
                raise

        # Получаем информацию о пользователе
        me = await client.get_me()

        # Получаем session string
        session_string = StringSession.save(client.session)

        print('')
        print('=' * 60)
        print('🎉 Авторизация успешна!')
        print('=' * 60)
        print('')
        print(f'✅ Авторизован как: {me.first_name} (@{me.username})')
        print(f'📱 Phone: {me.phone}')
        print('')
        print('🔑 Session String создан!')
        print('')

        # Сохраняем в .env автоматически
        save_session_to_env(session_string)

        await client.disconnect()
        return True

    except Exception as e:
        print(f'\n❌ Ошибка авторизации: {e}')
        await client.disconnect()
        return False

def save_session_to_env(session_string):
    """Сохранить session string в .env"""
    env_path = '.env'
    try:
        # Читаем существующий .env
        with open(env_path, 'r') as f:
            lines = f.readlines()

        # Ищем строку TELEGRAM_SESSION_STRING
        found = False
        for i, line in enumerate(lines):
            if line.startswith('TELEGRAM_SESSION_STRING='):
                lines[i] = f'TELEGRAM_SESSION_STRING={session_string}\n'
                found = True
                break

        # Если не нашли - добавляем в конец
        if not found:
            lines.append(f'\n# 🌈 РАДУЖНЫЙ МОСТ - Autonomous Telegram Session\n')
            lines.append(f'TELEGRAM_SESSION_STRING={session_string}\n')

        # Записываем обратно
        with open(env_path, 'w') as f:
            f.writelines(lines)

        print('✅ Session string автоматически сохранён в .env')
        print('')
        print('=' * 60)
        print('🌈 РАДУЖНЫЙ МОСТ ГОТОВ К АВТОНОМНОЙ РАБОТЕ!')
        print('=' * 60)
        print('')
        print('Теперь бот может:')
        print('  ✅ Отправлять сообщения от твоего имени')
        print('  ✅ Тестировать себя автоматически')
        print('  ✅ Разрабатывать новые фичи')
        print('  ✅ Исправлять баги')
        print('')
        print('БЕЗ ТВОЕГО УЧАСТИЯ! 🚀')
        print('')

    except Exception as e:
        print(f'⚠️ Не удалось автоматически обновить .env: {e}')
        print('')
        print('📋 Добавь эту строку в .env вручную:')
        print(f'TELEGRAM_SESSION_STRING={session_string}')
        print('')

async def main():
    """Главная функция"""
    # Проверяем существующий session
    if await check_existing_session():
        sys.exit(0)

    # Создаём новый session
    success = await create_new_session()
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print('\n❌ Отменено')
        sys.exit(1)
    except Exception as e:
        print(f'\n❌ Ошибка: {e}')
        import traceback
        traceback.print_exc()
        sys.exit(1)
