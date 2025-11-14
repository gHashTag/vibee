#!/usr/bin/env python3
"""
Telegram Bot Automated Testing with Telethon
Эмулирует пользователя для тестирования бота
"""

import asyncio
import os
import sys
from pathlib import Path
from telethon import TelegramClient, events
from telethon.tl.types import InputMessagesFilterPhotos
import argparse
import json

# Конфигурация
API_ID = os.getenv('TELEGRAM_API_ID')
API_HASH = os.getenv('TELEGRAM_API_HASH')
PHONE = os.getenv('TELEGRAM_PHONE')
BOT_USERNAME = os.getenv('BOT_USERNAME', '@agent_vibecoder_bot')

# Путь к сессии
SESSION_FILE = Path(__file__).parent / 'user_bot_session'


class TelegramBotTester:
    """Автотестер для Telegram бота"""

    def __init__(self, api_id: str, api_hash: str, phone: str, bot_username: str):
        self.api_id = api_id
        self.api_hash = api_hash
        self.phone = phone
        self.bot_username = bot_username
        self.client = None
        self.bot_entity = None
        self.test_results = []

    async def connect(self):
        """Подключиться к Telegram"""
        print(f"🔌 Connecting to Telegram as {self.phone}...")

        self.client = TelegramClient(str(SESSION_FILE), self.api_id, self.api_hash)
        await self.client.start(phone=self.phone)

        print("✅ Connected successfully")

        # Получаем entity бота
        self.bot_entity = await self.client.get_entity(self.bot_username)
        print(f"🤖 Found bot: {self.bot_entity.first_name} ({self.bot_username})")

    async def send_message(self, text: str, wait_response: bool = True):
        """Отправить сообщение боту"""
        print(f"📤 Sending: {text}")

        await self.client.send_message(self.bot_entity, text)

        if wait_response:
            # Ждём ответ (макс 10 секунд)
            response = await self._wait_for_response(timeout=10)
            return response

        return None

    async def send_photo(self, photo_path: str, caption: str = "", wait_response: bool = True):
        """Отправить фото боту"""
        print(f"📸 Sending photo: {photo_path}")

        await self.client.send_file(self.bot_entity, photo_path, caption=caption)

        if wait_response:
            response = await self._wait_for_response(timeout=10)
            return response

        return None

    async def _wait_for_response(self, timeout: int = 10):
        """Ждать ответ от бота"""
        start_time = asyncio.get_event_loop().time()

        while (asyncio.get_event_loop().time() - start_time) < timeout:
            messages = await self.client.get_messages(self.bot_entity, limit=1)

            if messages and messages[0].out == False:  # Входящее сообщение
                response = messages[0].text
                print(f"📥 Response: {response[:100]}...")
                return response

            await asyncio.sleep(0.5)

        print("⚠️ No response within timeout")
        return None

    async def test_train_start(self):
        """Тест команды /train start"""
        print("\n🧪 TEST: /train start")

        response = await self.send_message("/train start TestModel test_trigger")

        if response and "Отлично! Начинаем обучение" in response:
            print("✅ PASS: /train start works")
            self.test_results.append({"test": "train_start", "status": "PASS"})
            return True
        else:
            print("❌ FAIL: /train start failed")
            self.test_results.append({"test": "train_start", "status": "FAIL", "response": response})
            return False

    async def test_photo_upload(self, photo_path: str):
        """Тест загрузки фото"""
        print(f"\n🧪 TEST: Photo upload ({photo_path})")

        if not Path(photo_path).exists():
            print(f"❌ FAIL: Photo not found: {photo_path}")
            self.test_results.append({"test": "photo_upload", "status": "FAIL", "reason": "file_not_found"})
            return False

        response = await self.send_photo(photo_path)

        if response and ("фото загружено" in response.lower() or "прогресс" in response.lower()):
            print("✅ PASS: Photo uploaded successfully")
            self.test_results.append({"test": "photo_upload", "status": "PASS"})
            return True
        else:
            print("❌ FAIL: Photo upload failed")
            self.test_results.append({"test": "photo_upload", "status": "FAIL", "response": response})
            return False

    async def test_train_cancel(self):
        """Тест команды /train cancel"""
        print("\n🧪 TEST: /train cancel")

        response = await self.send_message("/train cancel")

        if response and ("отменена" in response.lower() or "canceled" in response.lower()):
            print("✅ PASS: /train cancel works")
            self.test_results.append({"test": "train_cancel", "status": "PASS"})
            return True
        else:
            print("❌ FAIL: /train cancel failed")
            self.test_results.append({"test": "train_cancel", "status": "FAIL", "response": response})
            return False

    async def run_full_test_suite(self, test_photo_path: str = None):
        """Запустить полный набор тестов"""
        print("\n" + "="*60)
        print("🚀 Starting Full Test Suite")
        print("="*60)

        # 1. Тест /train start
        await self.test_train_start()
        await asyncio.sleep(2)

        # 2. Тест загрузки фото (если путь указан)
        if test_photo_path:
            await self.test_photo_upload(test_photo_path)
            await asyncio.sleep(2)

        # 3. Тест /train cancel
        await self.test_train_cancel()
        await asyncio.sleep(2)

        # Результаты
        print("\n" + "="*60)
        print("📊 Test Results Summary")
        print("="*60)

        passed = sum(1 for r in self.test_results if r["status"] == "PASS")
        failed = sum(1 for r in self.test_results if r["status"] == "FAIL")

        for result in self.test_results:
            status_emoji = "✅" if result["status"] == "PASS" else "❌"
            print(f"{status_emoji} {result['test']}: {result['status']}")

        print(f"\n📈 Total: {len(self.test_results)} tests")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")

        # Сохраняем результаты
        results_file = Path(__file__).parent / 'test_results.json'
        with open(results_file, 'w') as f:
            json.dump(self.test_results, f, indent=2, ensure_ascii=False)

        print(f"\n💾 Results saved to: {results_file}")

        return failed == 0

    async def disconnect(self):
        """Отключиться от Telegram"""
        if self.client:
            await self.client.disconnect()
            print("\n👋 Disconnected from Telegram")


async def main():
    parser = argparse.ArgumentParser(description='Telegram Bot Automated Testing')
    parser.add_argument('--api-id', help='Telegram API ID', default=API_ID)
    parser.add_argument('--api-hash', help='Telegram API Hash', default=API_HASH)
    parser.add_argument('--phone', help='Phone number', default=PHONE)
    parser.add_argument('--bot', help='Bot username', default=BOT_USERNAME)
    parser.add_argument('--photo', help='Test photo path', default=None)
    parser.add_argument('--test', help='Specific test to run', choices=['train_start', 'photo_upload', 'train_cancel', 'full'])

    args = parser.parse_args()

    # Проверка переменных окружения
    if not args.api_id or not args.api_hash:
        print("❌ Error: TELEGRAM_API_ID and TELEGRAM_API_HASH are required")
        print("Set them as environment variables or use --api-id and --api-hash")
        sys.exit(1)

    if not args.phone:
        print("❌ Error: TELEGRAM_PHONE is required")
        print("Set it as environment variable or use --phone")
        sys.exit(1)

    # Создаём тестер
    tester = TelegramBotTester(args.api_id, args.api_hash, args.phone, args.bot)

    try:
        await tester.connect()

        # Запускаем тесты
        if args.test == 'train_start':
            await tester.test_train_start()
        elif args.test == 'photo_upload':
            if not args.photo:
                print("❌ Error: --photo is required for photo_upload test")
                sys.exit(1)
            await tester.test_photo_upload(args.photo)
        elif args.test == 'train_cancel':
            await tester.test_train_cancel()
        else:  # full suite
            success = await tester.run_full_test_suite(args.photo)
            sys.exit(0 if success else 1)

    finally:
        await tester.disconnect()


if __name__ == '__main__':
    asyncio.run(main())
