#!/usr/bin/env python3
"""
Тест TTS плагина через Telegram (async version)
"""

import asyncio
from telegram import Bot
from telegram.error import TelegramError

# Токен бота
BOT_TOKEN = "8309813696:AAG2QWKlmUSQ3BBDupoEv1RQ0m63KcKS-IQ"
CHAT_ID = "144062800"  # Ваш Telegram ID

async def send_tts_test():
    bot = Bot(token=BOT_TOKEN)

    print("🎤 Отправка тестового сообщения для TTS...")
    print(f"📱 Chat ID: {CHAT_ID}")
    print(f"🤖 Bot: {BOT_TOKEN[:20]}...")

    try:
        # Проверяем бота
        bot_info = await bot.get_me()
        print(f"\n✅ Бот подключен: @{bot_info.username} ({bot_info.first_name})")

        # Отправляем сообщение
        message = """🎤 Тестирую новый TTS плагин!

Напишите одну из команд:
• "Generate TTS of Привет, это тест!"
• "Create TTS saying Hello World"
• "Создай аудио: Добро пожаловать в Vibee!"

Или просто напишите любой текст - я создам для него аудио! 🎵
"""

        sent_message = await bot.send_message(chat_id=CHAT_ID, text=message)
        print(f"\n📤 Сообщение отправлено: {sent_message.message_id}")
        print(f"🔗 Ссылка: https://t.me/{bot_info.username}/{sent_message.message_id}")

        return True

    except TelegramError as e:
        print(f"\n❌ Ошибка Telegram: {e}")
        return False
    except Exception as e:
        print(f"\n❌ Неожиданная ошибка: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(send_tts_test())
    exit(0 if success else 1)
