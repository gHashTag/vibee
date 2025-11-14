#!/usr/bin/env python3
"""
🌈 RAINBOW BRIDGE - Automated Test Runner

Читает test scenarios из JSON и запускает их автономно через Telegram.
"""

import os
import sys
import json
import asyncio
import time
from datetime import datetime
from telethon import TelegramClient
from telethon.sessions import StringSession
from dotenv import load_dotenv

# Load .env
load_dotenv()

API_ID = int(os.getenv('TELEGRAM_API_ID', '0'))
API_HASH = os.getenv('TELEGRAM_API_HASH', '')
SESSION_STRING = os.getenv('TELEGRAM_SESSION_STRING', '')


class RainbowBridgeRunner:
    """Automated test runner for Rainbow Bridge E2E tests"""

    def __init__(self, scenarios_file: str):
        self.scenarios_file = scenarios_file
        self.client = None
        self.test_results = []
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0

    async def connect(self):
        """Connect to Telegram"""
        print('🌈 РАДУЖНЫЙ МОСТ - Automated Test Runner')
        print('=' * 70)
        print('🔌 Подключаюсь к Telegram...')

        self.client = TelegramClient(StringSession(SESSION_STRING), API_ID, API_HASH)
        await self.client.connect()

        if not await self.client.is_user_authorized():
            print('❌ Session недействителен!')
            sys.exit(1)

        me = await self.client.get_me()
        print(f'✅ Подключен как: {me.first_name} (@{me.username})')
        print('=' * 70)
        return self

    async def load_scenarios(self):
        """Load test scenarios from JSON file"""
        print(f'\n📋 Загружаю тестовые сценарии из {self.scenarios_file}...')

        with open(self.scenarios_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        self.config = data.get('config', {})
        self.test_suites = data.get('testSuites', [])

        # Count total tests
        for suite in self.test_suites:
            self.total_tests += len(suite.get('scenarios', []))

        print(f'✅ Загружено {len(self.test_suites)} test suites, {self.total_tests} тестов')
        return self

    async def send_message_and_wait(self, username: str, message: str, wait_ms: int = 3000):
        """Send message to bot and wait for response"""
        try:
            bot = await self.client.get_entity(username)
            await self.client.send_message(bot, message)

            # Wait for response
            await asyncio.sleep(wait_ms / 1000)

            # Read last messages
            response_text = ""
            async for msg in self.client.iter_messages(bot, limit=10):
                if not msg.out:  # Only bot's messages
                    if msg.text:  # Skip empty messages
                        response_text = msg.text + "\n" + response_text

            return response_text.strip()

        except Exception as e:
            return f"ERROR: {str(e)}"

    async def click_button_and_wait(self, username: str, button_text: str, wait_ms: int = 3000):
        """Click a button in the last message from bot and wait for response"""
        try:
            bot = await self.client.get_entity(username)

            # Get last message with buttons
            async for msg in self.client.iter_messages(bot, limit=5):
                if not msg.out and msg.reply_markup:  # Bot's message with inline keyboard
                    # Find button by text
                    for row in msg.reply_markup.rows:
                        for button in row.buttons:
                            if button_text.lower() in button.text.lower():
                                print(f'     🖱️ Clicking: {button.text}')
                                await self.client.get_bot_callback_answer(
                                    bot,
                                    msg.id,
                                    data=button.data
                                )
                                break

                    # Wait for response
                    await asyncio.sleep(wait_ms / 1000)

                    # Read last messages
                    response_text = ""
                    async for response_msg in self.client.iter_messages(bot, limit=5):
                        if not response_msg.out and response_msg.id > msg.id:
                            if response_msg.text:
                                response_text = response_msg.text + "\n" + response_text

                    return response_text.strip()

            return "ERROR: No message with buttons found"

        except Exception as e:
            return f"ERROR: {str(e)}"

    def validate_response(self, response: str, expected: dict) -> tuple:
        """Validate bot response against expectations"""
        errors = []

        # Check if response contains expected strings
        for text in expected.get('contains', []):
            if text.lower() not in response.lower():
                errors.append(f"Missing expected text: '{text}'")

        # Check if response does NOT contain forbidden strings
        for text in expected.get('not_contains', []):
            if text.lower() in response.lower():
                errors.append(f"Contains forbidden text: '{text}'")

        # Check minimum length
        min_length = expected.get('min_length', 0)
        if len(response) < min_length:
            errors.append(f"Response too short: {len(response)} < {min_length}")

        passed = len(errors) == 0
        return passed, errors

    async def run_scenario(self, suite_name: str, scenario: dict):
        """Run a single test scenario"""
        test_id = scenario['id']
        description = scenario['description']
        priority = scenario.get('priority', 'medium')
        steps = scenario['steps']
        expected = scenario['expected']

        print(f'\n  🧪 [{test_id}] {description}')
        print(f'     Priority: {priority}')

        start_time = time.time()

        try:
            # Execute steps
            response = ""
            for step in steps:
                action = step['action']
                data = step['data']
                wait_ms = step.get('wait_ms', 3000)

                if action == 'send_message':
                    print(f'     📤 Sending: {data}')
                    response = await self.send_message_and_wait(
                        self.config['bot_username'],
                        data,
                        wait_ms
                    )
                elif action == 'click_button':
                    print(f'     🖱️ Clicking: {data}')
                    response = await self.click_button_and_wait(
                        self.config['bot_username'],
                        data,
                        wait_ms
                    )

            # Validate response
            passed, errors = self.validate_response(response, expected)

            duration_ms = int((time.time() - start_time) * 1000)

            if passed:
                print(f'     ✅ PASSED ({duration_ms}ms)')
                self.passed_tests += 1
                status = 'passed'
            else:
                print(f'     ❌ FAILED ({duration_ms}ms)')
                print(f'     Errors:')
                for error in errors:
                    print(f'       - {error}')
                print(f'     Response preview: {response[:200]}...')
                self.failed_tests += 1
                status = 'failed'

            # Store result
            self.test_results.append({
                'suite': suite_name,
                'id': test_id,
                'description': description,
                'priority': priority,
                'status': status,
                'duration_ms': duration_ms,
                'errors': errors,
                'response_preview': response[:500] if response else ''
            })

        except Exception as e:
            print(f'     💥 EXCEPTION: {str(e)}')
            self.failed_tests += 1
            self.test_results.append({
                'suite': suite_name,
                'id': test_id,
                'description': description,
                'priority': priority,
                'status': 'exception',
                'duration_ms': 0,
                'errors': [str(e)],
                'response_preview': ''
            })

    async def run_suite(self, suite: dict):
        """Run all scenarios in a test suite"""
        suite_name = suite['name']
        description = suite.get('description', '')
        scenarios = suite.get('scenarios', [])

        print(f'\n📦 {suite_name}')
        print(f'   {description}')
        print(f'   Tests: {len(scenarios)}')

        for scenario in scenarios:
            await self.run_scenario(suite_name, scenario)

    async def run_all(self):
        """Run all test suites"""
        print('\n' + '=' * 70)
        print('🚀 НАЧИНАЕМ ТЕСТИРОВАНИЕ')
        print('=' * 70)

        for suite in self.test_suites:
            await self.run_suite(suite)

        await self.print_report()

    async def run_critical_only(self):
        """Run only critical priority tests"""
        print('\n' + '=' * 70)
        print('🔥 ЗАПУСК КРИТИЧНЫХ ТЕСТОВ')
        print('=' * 70)

        for suite in self.test_suites:
            critical_scenarios = [
                s for s in suite.get('scenarios', [])
                if s.get('priority') == 'critical'
            ]

            if critical_scenarios:
                suite_copy = suite.copy()
                suite_copy['scenarios'] = critical_scenarios
                await self.run_suite(suite_copy)

        await self.print_report()

    async def print_report(self):
        """Print final test report"""
        print('\n' + '=' * 70)
        print('📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ')
        print('=' * 70)

        total = self.total_tests if self.total_tests > 0 else (self.passed_tests + self.failed_tests)
        pass_rate = (self.passed_tests / total * 100) if total > 0 else 0

        print(f'\nВсего тестов: {total}')
        print(f'✅ Пройдено: {self.passed_tests}')
        print(f'❌ Провалено: {self.failed_tests}')
        print(f'📈 Pass Rate: {pass_rate:.1f}%')

        # Group by priority
        critical_failed = len([r for r in self.test_results if r['priority'] == 'critical' and r['status'] != 'passed'])
        high_failed = len([r for r in self.test_results if r['priority'] == 'high' and r['status'] != 'passed'])

        if critical_failed > 0:
            print(f'\n🚨 КРИТИЧНО: {critical_failed} критичных тестов провалены!')
        if high_failed > 0:
            print(f'⚠️  ВНИМАНИЕ: {high_failed} важных тестов провалены!')

        # Failed tests details
        if self.failed_tests > 0:
            print('\n❌ ПРОВАЛИВШИЕСЯ ТЕСТЫ:')
            for result in self.test_results:
                if result['status'] != 'passed':
                    print(f"   [{result['id']}] {result['description']}")
                    for error in result['errors']:
                        print(f"      - {error}")

        # Save report to file
        report_file = f"tests/rainbow-bridge-report-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'total': total,
                'passed': self.passed_tests,
                'failed': self.failed_tests,
                'pass_rate': pass_rate,
                'results': self.test_results
            }, f, indent=2, ensure_ascii=False)

        print(f'\n💾 Отчёт сохранён: {report_file}')
        print('=' * 70)

    async def disconnect(self):
        """Disconnect from Telegram"""
        if self.client:
            await self.client.disconnect()
            print('\n✅ Отключен от Telegram')


async def main():
    """Main entry point"""

    if len(sys.argv) < 2:
        print('Usage: python rainbow-bridge-runner.py <scenarios.json> [--critical-only]')
        sys.exit(1)

    scenarios_file = sys.argv[1]
    critical_only = '--critical-only' in sys.argv

    runner = RainbowBridgeRunner(scenarios_file)

    try:
        await runner.connect()
        await runner.load_scenarios()

        if critical_only:
            await runner.run_critical_only()
        else:
            await runner.run_all()

    except KeyboardInterrupt:
        print('\n\n⚠️ Тестирование прервано пользователем')
    except Exception as e:
        print(f'\n\n💥 FATAL ERROR: {e}')
        import traceback
        traceback.print_exc()
    finally:
        await runner.disconnect()

    # Exit with code 1 if any tests failed
    sys.exit(0 if runner.failed_tests == 0 else 1)


if __name__ == '__main__':
    asyncio.run(main())
