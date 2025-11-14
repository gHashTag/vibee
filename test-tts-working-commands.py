#!/usr/bin/env python3
"""
Тест TTS плагина с ПРАВИЛЬНЫМИ командами (синонимами из плагина)
"""

import asyncio
from telegram import Bot
from telegram.error import TelegramError

BOT_TOKEN = "8309813696:AAG2QWKlmUSQ3BBDupoEv1RQ0m63KcKS-IQ"
CHAT_ID = "144062800"

async def test_tts_commands():
    bot = Bot(token=BOT_TOKEN)

    print("🎤 ТЕСТ TTS С ПРАВИЛЬНЫМИ КОМАНДАМИ\n")
    print("Синонимы из плагина:")
    print("  - TTS_GENERATION")
    print("  - CREATE_TTS")
    print("  - TEXT2SPEECH")
    print("  - T2S")
    print("  - TEXT_TO_SPEECH")
    print("  - AUDIO_CREATE\n")

    try:
        bot_info = await bot.get_me()
        print(f"✅ Бот: @{bot_info.username}\n")

        # Тест 1: CREATE_TTS
        print("🧪 Тест 1: CREATE_TTS")
        msg1 = await bot.send_message(chat_id=CHAT_ID, text="CREATE_TTS Привет, мир! Как дела?")
        print(f"📤 Отправлено: {msg1.message_id}")
        await asyncio.sleep(15)

        # Тест 2: TEXT_TO_SPEECH
        print("\n🧪 Тест 2: TEXT_TO_SPEECH")
        msg2 = await bot.send_message(chat_id=CHAT_ID, text="TEXT_TO_SPEECH Vibe coding - это круто!")
        print(f"📤 Отправлено: {msg2.message_id}")
        await asyncio.sleep(15)

        # Тест 3: AUDIO_CREATE
        print("\n🧪 Тест 3: AUDIO_CREATE")
        msg3 = await bot.send_message(chat_id=CHAT_ID, text="AUDIO_CREATE Привет от Vibee AI!")
        print(f"📤 Отправлено: {msg3.message_id}")
        await asyncio.sleep(15)

        print("\n✅ Все тесты отправлены!")
        print(f"🔗 Проверьте ответы: https://t.me/{bot_info.username}")

    except TelegramError as e:
        print(f"\n❌ Ошибка: {e}")

if __name__ == "__main__":
    asyncio.run(test_tts_commands())
