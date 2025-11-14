# 🌈 Rainbow Bridge E2E Tester Agent

## Agent Overview

**Name**: Rainbow Bridge E2E Tester
**Type**: Autonomous End-to-End Testing Agent
**Domain**: Real Bot Testing & Quality Assurance
**Level**: Autonomous

**Purpose**: Автономное тестирование функциональности бота через реальный Telegram, используя autonomous-telegram-agent для E2E тестов всех user flows.

---

## Core Philosophy

**РАДУЖНЫЙ МОСТ** = Мост между разработкой и реальностью

```
РАЗРАБОТКА → АВТОНОМНОЕ E2E ТЕСТИРОВАНИЕ → АНАЛИЗ БАГОВ → ИСПРАВЛЕНИЕ → ПОВТОР
     ↑                                                                         ↓
     └─────────────────────────────────────────────────────────────────────────┘
```

### Ключевой принцип:

**НЕ unit тесты. НЕ integration тесты в коде. РЕАЛЬНЫЙ бот. РЕАЛЬНЫЙ Telegram. РЕАЛЬНЫЙ user flow.**

Агент должен:
1. Общаться сам с собой через Telegram
2. Тестировать как реальный пользователь
3. Находить баги, которые не найдут unit тесты
4. Исправлять код
5. Тестировать снова

---

## Testing Methodology

### 1. E2E Test Types

**User Acceptance Testing (UAT)**:
- Полный user journey от начала до конца
- Реальные условия (сеть, таймауты, UI)
- Реальная база данных
- Реальные сервисы (fal.ai, file.io, etc.)

**Integration Testing**:
- Взаимодействие всех компонентов
- Callback кнопки
- Photo handling
- Error recovery flows

**Regression Testing**:
- После каждого изменения
- Проверка что старый функционал не сломался

---

## Agent Workflow

### Phase 1: Test Planning

```typescript
interface TestPlan {
  feature: string;
  testCases: TestCase[];
  expectedBehavior: string;
  criticalPath: boolean;
}

interface TestCase {
  id: string;
  description: string;
  steps: string[];
  expectedResult: string;
  actualResult?: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  screenshot?: string;
  logs?: string[];
}
```

**Example Test Plan**:
```yaml
Feature: Training Plugin - Complete Flow
Critical: true

Test Cases:
  - id: TRAIN_001
    description: "Happy path - start training with 10 photos"
    steps:
      - Send "/train start TestModel test_trigger"
      - Verify bot response with instructions
      - Send 10 photos
      - Verify progress updates after each photo
      - Click "✅ Начать обучение" button
      - Verify ZIP creation message
      - Verify upload message
      - Verify training started message with Job ID
    expectedResult: "Training started successfully with Job ID"

  - id: TRAIN_002
    description: "Error recovery - retry after network failure"
    steps:
      - Start training session
      - Upload 10 photos
      - Simulate network error
      - Verify error message with retry button
      - Click retry button
      - Verify session preserved
      - Verify training continues
    expectedResult: "Training completes after retry"
```

### Phase 2: Test Execution

**Autonomous Testing Flow**:

```python
class RainbowBridgeTester:
    async def run_e2e_test(self, test_plan: TestPlan):
        """Execute E2E test autonomously"""

        results = []

        for test_case in test_plan.test_cases:
            print(f"\n🧪 Running: {test_case.id} - {test_case.description}")

            try:
                # Execute test steps
                for step in test_case.steps:
                    await self.execute_step(step)
                    await asyncio.sleep(2)  # Wait for bot response

                # Verify result
                actual = await self.get_last_bot_response()
                if self.verify_result(actual, test_case.expectedResult):
                    test_case.status = 'passed'
                    print(f"✅ PASSED: {test_case.id}")
                else:
                    test_case.status = 'failed'
                    test_case.actualResult = actual
                    print(f"❌ FAILED: {test_case.id}")
                    print(f"   Expected: {test_case.expectedResult}")
                    print(f"   Actual: {actual}")

            except Exception as error:
                test_case.status = 'failed'
                test_case.actualResult = str(error)
                print(f"❌ ERROR: {test_case.id} - {error}")

            results.append(test_case)

        return results

    async def execute_step(self, step: str):
        """Execute single test step"""

        if step.startswith('Send "'):
            # Extract message
            message = step.split('"')[1]
            await self.send_message(message)

        elif step.startswith('Click '):
            # Extract button text
            button_text = step.split('"')[1]
            await self.click_button(button_text)

        elif step.startswith('Verify '):
            # Verify condition
            condition = step.replace('Verify ', '')
            await self.verify_condition(condition)

        elif step.startswith('Send') and 'photo' in step:
            # Send photos
            count = int(step.split()[1])
            await self.send_test_photos(count)

    async def send_message(self, message: str):
        """Send message via autonomous agent"""
        result = subprocess.run([
            'python3',
            'scripts/autonomous-telegram-bot.py',
            'send-message',
            'agent_vibecoder_bot',
            message
        ], capture_output=True, text=True, timeout=15)

        return result.stdout

    async def send_test_photos(self, count: int):
        """Send test photos for training"""
        # Generate or use existing test photos
        test_photo_dir = 'tests/fixtures/photos'

        for i in range(count):
            photo_path = f"{test_photo_dir}/test_{i+1}.jpg"
            # Send via Telegram API
            await self.send_photo(photo_path)
```

### Phase 3: Result Analysis

```python
def analyze_test_results(results: List[TestCase]):
    """Analyze and report test results"""

    total = len(results)
    passed = len([r for r in results if r.status == 'passed'])
    failed = len([r for r in results if r.status == 'failed'])

    pass_rate = (passed / total) * 100

    report = f"""
🌈 РАДУЖНЫЙ МОСТ - Test Report
{'=' * 50}

Total Tests: {total}
✅ Passed: {passed}
❌ Failed: {failed}
📊 Pass Rate: {pass_rate:.1f}%

{'=' * 50}
"""

    # Detailed failures
    if failed > 0:
        report += "\n❌ FAILED TESTS:\n\n"
        for result in results:
            if result.status == 'failed':
                report += f"• {result.id}: {result.description}\n"
                report += f"  Expected: {result.expectedResult}\n"
                report += f"  Actual: {result.actualResult}\n\n"

    # Critical path check
    critical_failed = [r for r in results if r.status == 'failed' and r.critical]
    if critical_failed:
        report += "⚠️ CRITICAL PATH BROKEN\n"
        report += "Production deployment blocked.\n"

    return report
```

### Phase 4: Auto-Fix (If Possible)

```python
async def auto_fix_common_issues(failed_tests: List[TestCase]):
    """Attempt to fix common issues automatically"""

    for test in failed_tests:
        # Pattern matching for common issues

        if "suppressGeneratedResponse" in test.actualResult:
            print("🔧 Found: Duplicate responses")
            print("   Fixing: Moving action to plugins array...")
            # Apply fix
            await fix_suppress_response_issue()

        elif "callback_query" in test.actualResult:
            print("🔧 Found: Callback not working")
            print("   Fixing: Switching to bot.on() registration...")
            # Apply fix
            await fix_callback_registration()

        elif "timeout" in test.actualResult.lower():
            print("🔧 Found: Timeout issue")
            print("   Fixing: Increasing timeout and adding retry...")
            # Apply fix
            await fix_timeout_issue()
```

---

## Test Scenarios

### Critical Path Tests

**1. Training Flow - Happy Path**
```yaml
Steps:
  1. Send /train help
  2. Verify help message received
  3. Send /train start TestModel test_trigger
  4. Verify session created message
  5. Send 10 photos
  6. Verify progress bars (1/20, 2/20, ... 10/20)
  7. Verify "✅ Начать обучение" button appears
  8. Click button
  9. Verify "Creating ZIP" message
  10. Verify "Uploading" message with loading indicator
  11. Verify "Training started" with Job ID

Expected: All steps pass, training ID returned
```

**2. Error Recovery Flow**
```yaml
Steps:
  1. Start training session
  2. Upload 10 photos
  3. Disconnect network (simulate)
  4. Click "Начать обучение"
  5. Verify error message with hint
  6. Verify "🔄 Попробовать снова" button
  7. Verify session count preserved
  8. Reconnect network
  9. Click retry button
  10. Verify training starts successfully

Expected: No data loss, successful retry
```

**3. Callback Buttons Test**
```yaml
Steps:
  1. Start training with 10 photos
  2. Click "❌ Отменить" button
  3. Verify button responds (no loading spinner stuck)
  4. Verify cancellation message
  5. Verify session cleared
  6. Start new session
  7. Upload 10 photos
  8. Click "✅ Начать обучение"
  9. Verify button responds immediately
  10. Verify training starts

Expected: All buttons respond < 1s, no stuck states
```

### Edge Cases

**4. Insufficient Photos**
```yaml
Steps:
  1. /train start Test test
  2. Send only 5 photos
  3. Click "✅ Начать обучение"
  4. Verify error: "Недостаточно фото (5/10)"
  5. Send 5 more photos
  6. Click "✅ Начать обучение" again
  7. Verify training starts

Expected: Clear error, easy recovery
```

**5. Concurrent Sessions**
```yaml
Steps:
  1. Start session as User A
  2. Upload 5 photos
  3. Start session as User B (different user)
  4. Upload 10 photos as User B
  5. Complete training as User B
  6. Return to User A session
  7. Upload 5 more photos
  8. Complete training as User A

Expected: Sessions isolated, no cross-contamination
```

---

## Implementation

### Test Runner Script

```python
#!/usr/bin/env python3
"""
🌈 Rainbow Bridge E2E Test Runner

Autonomous end-to-end testing for Telegram bot
"""

import asyncio
import json
from pathlib import Path

# Test scenarios
SCENARIOS = {
    'critical': [
        'training_happy_path',
        'error_recovery',
        'callback_buttons',
    ],
    'edge_cases': [
        'insufficient_photos',
        'concurrent_sessions',
        'network_timeout',
    ],
    'regression': [
        'all_commands',
        'all_buttons',
        'all_error_handlers',
    ]
}

async def main():
    print("🌈 РАДУЖНЫЙ МОСТ - E2E Test Suite")
    print("=" * 60)

    # Select test suite
    suite = 'critical'  # or from CLI arg

    tester = RainbowBridgeTester()
    await tester.connect()

    results = []

    for test_name in SCENARIOS[suite]:
        print(f"\n🧪 Running: {test_name}")
        result = await tester.run_test(test_name)
        results.append(result)

    # Generate report
    report = analyze_test_results(results)
    print(report)

    # Save to file
    Path('test-results').mkdir(exist_ok=True)
    with open(f'test-results/rainbow-bridge-{suite}.json', 'w') as f:
        json.dump(results, f, indent=2)

    await tester.disconnect()

    # Exit code based on results
    if any(r.status == 'failed' for r in results):
        exit(1)
    else:
        exit(0)

if __name__ == '__main__':
    asyncio.run(main())
```

### Integration with CI/CD

```yaml
# .github/workflows/e2e-tests.yml
name: Rainbow Bridge E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install telethon python-dotenv

      - name: Setup environment
        env:
          TELEGRAM_API_ID: ${{ secrets.TELEGRAM_API_ID }}
          TELEGRAM_API_HASH: ${{ secrets.TELEGRAM_API_HASH }}
          TELEGRAM_SESSION_STRING: ${{ secrets.TELEGRAM_SESSION_STRING }}
        run: |
          echo "TELEGRAM_API_ID=$TELEGRAM_API_ID" >> .env
          echo "TELEGRAM_API_HASH=$TELEGRAM_API_HASH" >> .env
          echo "TELEGRAM_SESSION_STRING=$TELEGRAM_SESSION_STRING" >> .env

      - name: Start bot
        run: |
          bun run dev &
          sleep 10

      - name: Run E2E tests
        run: |
          python3 scripts/rainbow-bridge-test.py --suite critical

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

---

## Best Practices

### 1. Test Data Management

**Use dedicated test account**:
- Separate from production
- Clean state before each test
- Predictable data

**Test fixtures**:
```
tests/fixtures/
├── photos/
│   ├── test_1.jpg
│   ├── test_2.jpg
│   └── ...
├── sessions/
│   └── test_session.json
└── responses/
    └── expected_responses.json
```

### 2. Flaky Test Handling

```python
async def run_with_retry(test_fn, max_retries=3):
    """Retry flaky tests"""
    for attempt in range(max_retries):
        try:
            result = await test_fn()
            if result.status == 'passed':
                return result
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            await asyncio.sleep(2 ** attempt)
```

### 3. Test Isolation

```python
async def setup_test():
    """Clean state before test"""
    await clear_all_sessions()
    await reset_database()
    await clear_temp_files()

async def teardown_test():
    """Clean up after test"""
    await cancel_all_training_jobs()
    await clear_test_data()
```

### 4. Assertions

```python
def assert_bot_response_contains(actual: str, expected: str):
    """Smart assertion for bot responses"""
    if expected not in actual:
        raise AssertionError(
            f"Expected response to contain: {expected}\n"
            f"Actual response: {actual}"
        )

def assert_button_clicked_successfully(response: str):
    """Verify callback query was answered"""
    # No loading spinner in response
    assert "⏳" not in response
    # Got confirmation
    assert any(word in response for word in ["✅", "Готово", "Успешно"])
```

---

## Metrics & Reporting

### Test Metrics

```python
class TestMetrics:
    total_tests: int
    passed: int
    failed: int
    skipped: int
    duration_seconds: float
    pass_rate: float
    flaky_count: int

    def to_dict(self):
        return {
            'total': self.total_tests,
            'passed': self.passed,
            'failed': self.failed,
            'skipped': self.skipped,
            'duration': self.duration_seconds,
            'pass_rate': f"{self.pass_rate:.1f}%",
            'flaky': self.flaky_count,
        }
```

### Dashboard

```
🌈 РАДУЖНЫЙ МОСТ - E2E Test Dashboard
================================================

Date: 2025-11-12 15:30:00
Suite: Critical Path Tests
Environment: Production Bot

📊 Results:
   Total Tests: 15
   ✅ Passed: 13
   ❌ Failed: 2
   ⏭️ Skipped: 0
   ⏱️ Duration: 3m 45s
   📈 Pass Rate: 86.7%

❌ Failed Tests:
   • TRAIN_001: Duplicate LLM response
     Issue: suppressGeneratedResponse not working
     Fix: Move to plugins array

   • TRAIN_005: Callback button stuck
     Issue: answerCbQuery not called on error
     Fix: Add try-catch wrapper

🔥 Flaky Tests: 1
   • TRAIN_003: Network timeout (passed on retry)

⚠️ Action Required:
   Fix 2 failed tests before deployment

Next Run: Automated (every commit)
```

---

## Conclusion

**РАДУЖНЫЙ МОСТ** = The bridge between development and reality

This agent ensures:
- ✅ Real E2E testing in actual Telegram
- ✅ Autonomous test execution
- ✅ Bug detection before production
- ✅ Continuous quality improvement
- ✅ Self-healing through auto-fix

**Status**: Core methodology for all Vibee development

---

**Last Updated**: 2025-11-12
**Author**: Claude Code (Autonomous Development)
**Version**: 1.0 - Foundation
