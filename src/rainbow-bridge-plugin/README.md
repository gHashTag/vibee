# 🌈 Rainbow Bridge Plugin for ElizaOS

**Autonomous End-to-End Testing for Telegram Bots**

Test your bot like a real user would—automatically, continuously, and autonomously.

[![npm version](https://img.shields.io/npm/v/@elizaos/plugin-rainbow-bridge.svg)](https://www.npmjs.com/package/@elizaos/plugin-rainbow-bridge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Why Rainbow Bridge?

Traditional testing approaches fall short for Telegram bots:
- ❌ **Unit tests** can't test real user interactions
- ❌ **Mocked tests** miss integration issues
- ❌ **Manual testing** is slow and error-prone

Rainbow Bridge solves this by:
- ✅ **Testing through real Telegram** - Actual messages, actual bot responses
- ✅ **Fully autonomous** - No human intervention needed
- ✅ **Continuous validation** - Run tests automatically on every deploy
- ✅ **Production-ready** - Find bugs before your users do

---

## Features

- 🤖 **Autonomous Testing** - Bot tests itself through Telegram
- 🔄 **Continuous E2E** - Run tests on every commit/deploy
- 📊 **Comprehensive Reports** - Pass rates, failed tests, detailed logs
- 🌐 **Real Environment** - Tests in actual Telegram, not mocks
- ⚡ **Fast Feedback** - Know immediately if something breaks
- 🔧 **Easy Setup** - One-time auth, then fully automatic

---

## Installation

```bash
npm install @elizaos/plugin-rainbow-bridge
# or
bun add @elizaos/plugin-rainbow-bridge
```

### Python Dependencies

```bash
pip3 install telethon python-dotenv
```

---

## Quick Start

### 1. Get Telegram API Credentials

1. Go to https://my.telegram.org/apps
2. Create new application
3. Save `api_id` and `api_hash`

### 2. Generate Session String (One-Time)

```bash
python3 node_modules/@elizaos/plugin-rainbow-bridge/scripts/autonomous-telegram-auth.py
```

This creates a `TELEGRAM_SESSION_STRING` that allows autonomous access.

### 3. Configure Environment

Add to `.env`:

```bash
TELEGRAM_API_ID=12345678
TELEGRAM_API_HASH=your_api_hash
TELEGRAM_SESSION_STRING=your_generated_session_string
RAINBOW_BRIDGE_BOT_USERNAME=your_bot_username
RAINBOW_BRIDGE_ENABLED=true
RAINBOW_BRIDGE_AUTO_RUN=false  # true to auto-test on startup
```

### 4. Add Plugin to Your Bot

```typescript
import { rainbowBridgePlugin } from '@elizaos/plugin-rainbow-bridge';

export const character: Character = {
  name: "YourBot",
  plugins: [
    rainbowBridgePlugin,
    // ... other plugins
  ],
};
```

### 5. Run Tests

**Via conversation:**
```
User: Run E2E tests
Bot: 🌈 Starting E2E tests...
     📊 Results: 5/5 passed (100%)
```

**Via CLI:**
```bash
npm run test:e2e
```

---

## Usage

### Define Test Scenarios

```typescript
import { TestScenario } from '@elizaos/plugin-rainbow-bridge';

const scenarios: TestScenario[] = [
  {
    id: 'HELP_001',
    description: 'Bot responds to /help',
    priority: 'critical',
    steps: [
      { action: 'send_message', data: '/help' },
    ],
    expected: 'Available commands',
  },
  {
    id: 'TRAIN_001',
    description: 'Training flow works',
    priority: 'high',
    steps: [
      { action: 'send_message', data: '/train start Model trigger' },
    ],
    expected: 'Начинаем обучение',
  },
];
```

### Run Tests Programmatically

```typescript
import { RainbowBridgeService } from '@elizaos/plugin-rainbow-bridge';

// In your bot code
const service = runtime.getService('rainbow-bridge') as RainbowBridgeService;
const report = await service.runTestSuite(scenarios);

console.log(`Pass rate: ${report.passRate}%`);
```

### CI/CD Integration

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: |
          bun install
          pip3 install telethon python-dotenv

      - name: Run E2E tests
        env:
          TELEGRAM_API_ID: ${{ secrets.TELEGRAM_API_ID }}
          TELEGRAM_API_HASH: ${{ secrets.TELEGRAM_API_HASH }}
          TELEGRAM_SESSION_STRING: ${{ secrets.TELEGRAM_SESSION_STRING }}
        run: bun run test:e2e
```

---

## API Reference

### RainbowBridgeService

#### `runTestScenario(scenario: TestScenario): Promise<TestResult>`

Run a single test scenario.

#### `runTestSuite(scenarios: TestScenario[]): Promise<TestReport>`

Run multiple test scenarios and generate a report.

#### `sendMessage(message: string): Promise<{ success: boolean; response: string }>`

Send a message to your bot and get the response.

#### `getStatus(): { enabled: boolean; configured: boolean; botUsername: string }`

Get current service status.

---

## Best Practices

### 1. Test Critical Paths First

```typescript
const criticalTests = scenarios.filter(s => s.priority === 'critical');
```

### 2. Test Like a User

```typescript
// ❌ Bad - Technical test
{ expected: 'PhotoCollectorService initialized' }

// ✅ Good - User-centric test
{ expected: 'Send your photos to start training' }
```

### 3. Isolate Test Data

Use test-specific data that won't affect production:

```typescript
{ action: 'send_message', data: '/train start TestModel test_trigger' }
```

### 4. Run Tests Regularly

- On every commit (CI/CD)
- Before deployments
- On schedule (daily/weekly)
- After configuration changes

---

## Troubleshooting

### Session Invalid

```bash
# Regenerate session
python3 scripts/autonomous-telegram-auth.py
```

### Tests Timing Out

Increase timeout in test scenarios:
```typescript
{
  action: 'send_message',
  data: '/long_operation',
  timeout: 30000, // 30 seconds
}
```

### Bot Not Responding

1. Check bot is running
2. Verify `RAINBOW_BRIDGE_BOT_USERNAME` is correct
3. Check bot logs for errors

---

## Examples

See `/examples` directory for:
- Basic usage
- Custom test scenarios
- CI/CD integration
- Advanced patterns

---

## Architecture

Rainbow Bridge uses **Telegram's MTProto** (user API) to send messages from your account to your bot. This allows truly autonomous testing without manual intervention.

```
Rainbow Bridge Service
  ↓
Python Telethon Script (MTProto)
  ↓
Telegram Servers
  ↓
Your Bot
  ↓
Response Analysis
  ↓
Test Report
```

---

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Submit a pull request

---

## License

MIT License - see [LICENSE](./LICENSE)

---

## Support

- 📖 [Documentation](https://github.com/playra/vibee/tree/main/src/rainbow-bridge-plugin)
- 🐛 [Issues](https://github.com/playra/vibee/issues)
- 💬 [Discussions](https://github.com/playra/vibee/discussions)

---

**Made with ❤️ for the ElizaOS community**

🌈 Building bridges between development and reality, autonomously.
