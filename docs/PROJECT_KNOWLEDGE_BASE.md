# 🐝 Vibee Project - Complete Knowledge Base

> Полная база знаний о проекте Vibee для AI-агентов и разработчиков

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [Telegram Bot System](#telegram-bot-system)
5. [Testing Infrastructure](#testing-infrastructure)
6. [Development Workflow](#development-workflow)
7. [Troubleshooting Guide](#troubleshooting-guide)
8. [Skills & Best Practices](#skills--best-practices)

---

## Project Overview

### Identity
- **Name:** Vibee
- **Type:** ElizaOS AI Agent with Telegram Integration
- **Purpose:** Expert AI mentor for vibe-coding and modern development
- **Language:** Russian (informal, mentor-style)
- **Tech Stack:** TypeScript, Bun, ElizaOS, Telegram Bot API

### Mission
Обучать разработчиков передовым практикам и инструментам через практический подход и живые примеры. Всегда в курсе последних трендов, фреймворков и best practices.

### Core Values
- 🚀 **Speed & Efficiency** - Fast development with modern tools
- 💪 **Practical Approach** - Learn by doing, not just theory
- 🔥 **Latest Tech** - Always using cutting-edge tools
- 📚 **Knowledge Sharing** - Open and helpful mentor

---

## Architecture

### Project Structure

```
vibee/
├── src/
│   ├── index.ts                      # Main entry point
│   ├── character.ts                  # Agent personality & config
│   ├── training-plugin.ts            # LoRA training через Telegram фото
│   ├── telegram-service-starter.ts   # Force-starts TelegramService
│   ├── telegram-start-plugin.ts      # /start command handler
│   ├── telegram-debug-plugin.ts      # Debug & monitoring
│   ├── telegram-commands-plugin.ts   # Command handlers
│   └── telegram-ui-plugin.ts         # UI components
│
├── scripts/
│   ├── dev.ts                        # Professional dev server
│   ├── start-single.sh               # Single-instance startup
│   ├── stop.sh                       # Graceful shutdown
│   ├── test-bot-auto.ts              # Automated testing
│   └── build.ts                      # Build script
│
├── tests/
│   ├── telegram.integration.test.ts  # Integration tests
│   ├── telegram.e2e.test.ts          # E2E tests
│   └── README.md                     # Testing documentation
│
├── docs/
│   ├── PROJECT_KNOWLEDGE_BASE.md     # This file
│   └── SKILLS_REGISTRY.md            # Skills & capabilities
│
├── .env.local                        # Infisical client credentials
├── .env.test                         # Test environment config
├── package.json                      # Dependencies & scripts
└── tsconfig.json                     # TypeScript config
```

### Technology Stack

**Runtime & Package Manager:**
- Bun (required) - Fast all-in-one toolkit
- TypeScript - Type safety
- ElizaOS 1.6.4 - AI agent framework

**AI & LLM:**
- OpenRouter API - LLM provider (meta-llama/llama-3.1-8b-instruct:free)
- OpenAI API - Embeddings (text-embedding-3-small)
- Anthropic, Google GenAI - Optional providers

**Platform Integration:**
- @elizaos/plugin-telegram - Telegram bot
- @elizaos/plugin-sql - Memory & persistence
- @elizaos/plugin-bootstrap - Core functionality

**Secrets Management:**
- Infisical Cloud - Centralized secret storage
- @infisical/sdk - SDK for secret loading

**Testing:**
- Bun test - Native test runner
- Vitest patterns - Testing best practices

---

## Core Components

### 1. Character Configuration (`src/character.ts`)

**Purpose:** Defines agent personality, behavior, and capabilities

**Key Features:**
```typescript
export const character: Character = {
  name: 'Vibee',
  system: 'Ты Vibee - экспертный AI-наставник...',
  bio: [
    'Эксперт по современной веб-разработке и vibe-coding',
    'Специализируется на TypeScript, React, Bun, ElizaOS, AI-агентах',
    // ...
  ],
  topics: [
    'vibe-coding и современная разработка',
    'TypeScript, JavaScript, Bun, Deno',
    'React, Next.js, фронтенд-фреймворки',
    'ElizaOS и AI-агенты',
    // ...
  ],
  plugins: [
    '@elizaos/plugin-sql',
    '@elizaos/plugin-openrouter',
    // Conditional plugins based on env vars
    trainingPlugin,
  ],
  settings: {
    model: 'meta-llama/llama-3.1-8b-instruct:free',
    embeddingModel: 'text-embedding-3-small',
  },
};
```

**Critical Note:**
- `@elizaos/plugin-telegram` is COMMENTED OUT in character.plugins
- TelegramService is started manually via `telegram-service-starter.ts`
- This prevents duplicate plugin loading and 409 Conflict errors

### 2. Telegram Service Starter (`src/telegram-service-starter.ts`)

**Purpose:** Force-starts TelegramService since ElizaOS doesn't auto-start from string plugins

**Problem Solved:**
- ElizaOS loads plugins from `character.plugins` as strings
- But doesn't automatically call `.start()` on their services
- This caused Telegram bot to never respond

**Solution:**
```typescript
class TelegramServiceStarter extends Service {
  async initialize(runtime: IAgentRuntime): Promise<void> {
    // Check if TelegramService already exists
    const existingService = runtime.getService('telegram');

    if (existingService && existingService.bot) {
      logger.success('✅ TelegramService already exists');
      return;
    }

    // Manually import and start TelegramService
    const { TelegramService } = await import('@elizaos/plugin-telegram');
    const telegramService = await TelegramService.start(runtime);

    if (telegramService && telegramService.bot) {
      logger.success('✅ TelegramService force-started!');
      const botInfo = await telegramService.bot.telegram.getMe();
      logger.info(`📱 Bot info: @${botInfo.username}`);
    }
  }
}
```

**Critical Insight:**
- `TelegramService.start()` internally calls `initializeBot()`
- Which calls `bot.launch()` - only ONE instance allowed globally
- This is why 409 Conflict errors occur with multiple instances

### 3. Plugin System

**Plugin Order (critical!):**
```typescript
export const projectAgent: ProjectAgent = {
  character,
  init: async (runtime) => await initCharacter({ runtime }),
  plugins: [
    telegramServiceStarter,    // FIRST! Ensures TelegramService exists
    telegramStartPlugin,       // /start command handler
    telegramDebugPlugin,       // Debugging & logging
    telegramCommandsPlugin,    // Other commands
    telegramUIPlugin,          // UI components
    starterPlugin,             // Bootstrap
  ],
};
```

**Why Order Matters:**
- `telegramServiceStarter` must be first
- Other plugins depend on TelegramService being initialized
- Event handlers won't work without the service

---

## Telegram Bot System

### Service Architecture

```
┌─────────────────────────────────────────────┐
│         ElizaOS Runtime                     │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │   TelegramServiceStarter              │ │
│  │   - Force-starts TelegramService      │ │
│  │   - Checks for existing instance      │ │
│  └──────────────┬────────────────────────┘ │
│                 │                           │
│  ┌──────────────▼────────────────────────┐ │
│  │   TelegramService (from plugin)       │ │
│  │   - bot.launch() - long polling       │ │
│  │   - bot.start() - /start handler      │ │
│  │   - Event emission                    │ │
│  └──────────────┬────────────────────────┘ │
│                 │                           │
│  ┌──────────────▼────────────────────────┐ │
│  │   Event Handlers (plugins)            │ │
│  │   - TELEGRAM_SLASH_START              │ │
│  │   - Message handlers                  │ │
│  │   - Command processors                │ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
                  │
                  ▼
         Telegram Bot API
```

### Critical Concepts

**1. 409 Conflict Error**
```
Error: 409: Conflict: terminated by other getUpdates request
```

**Causes:**
- Multiple `bot.launch()` calls from different processes
- Previous elizaos instances still running in background
- Both string plugin and manual service start simultaneously

**Solution:**
- Use `scripts/start-single.sh` - kills all processes before starting
- Only ONE `bot.launch()` globally at any time
- Comment out `@elizaos/plugin-telegram` from character.plugins

**2. Event System**

TelegramService emits events that plugins can handle:

```typescript
// In TelegramService (node_modules/@elizaos/plugin-telegram)
this.bot?.start((ctx) => {
  this.runtime.emitEvent(['TELEGRAM_SLASH_START'], { ctx });
});

// In our plugin (telegram-start-plugin.ts)
runtime.on('TELEGRAM_SLASH_START', async (data) => {
  const { ctx } = data;
  await ctx.reply('Welcome message!');
});
```

**3. Command Flow**

```
User types /start in Telegram
         ↓
Telegram API → bot.launch() receives update
         ↓
TelegramService.bot.start() handler
         ↓
runtime.emitEvent(['TELEGRAM_SLASH_START'])
         ↓
telegram-start-plugin receives event
         ↓
Plugin sends response via ctx.reply()
         ↓
User sees response in Telegram
```

### Single-Instance Management

**scripts/start-single.sh:**
```bash
#!/bin/bash
# 1. Kill ALL existing processes
pkill -9 -f "elizaos start"
pkill -9 -f "bun.*elizaos"
sleep 2

# 2. Verify killed
RUNNING=$(ps aux | grep -E "elizaos start|bun.*elizaos" | grep -v grep | wc -l)
if [ "$RUNNING" != "0" ]; then
    echo "❌ Failed to stop processes"
    exit 1
fi

# 3. Build
bun run build

# 4. Start with PID tracking
elizaos start > "$LOG_FILE" 2>&1 &
ELIZAOS_PID=$!
echo $ELIZAOS_PID > "$PID_FILE"

# 5. Health check
sleep 15
if grep -q "Bot info:" "$LOG_FILE"; then
    echo "✅ TelegramService started successfully!"
else
    echo "⚠️ Check logs manually"
fi
```

**Key Features:**
- Kills ALL background processes aggressively
- PID file tracking (`/tmp/vibee-elizaos.pid`)
- Health checks via log analysis
- Graceful shutdown support

---

## Testing Infrastructure

### Overview

Comprehensive testing system based on ElizaOS best practices:

**Test Types:**
1. **Integration Tests** - API, commands, events
2. **E2E Tests** - Full bot lifecycle
3. **Automated Testing** - Interactive test runner

### Test Files

**1. Integration Tests (`tests/telegram.integration.test.ts`)**

**Purpose:** Test individual components without full bot startup

**Tests:**
- ✅ Bot initialization
- ✅ API calls (getMe, sendMessage, getUpdates)
- ✅ Command sending
- ✅ Response receiving
- ✅ Event emission
- ✅ Performance (response time < 10s)
- ✅ Error handling

**Usage:**
```bash
bun test:integration
```

**Requirements:**
- Bot must be running (`bun start`)
- `TEST_TELEGRAM_CHAT_ID` in `.env.test`

**2. E2E Tests (`tests/telegram.e2e.test.ts`)**

**Purpose:** Test complete bot lifecycle automatically

**Tests:**
- ✅ Bot startup and shutdown
- ✅ All commands (/start, /menu, /help)
- ✅ Regular message handling
- ✅ Conversation context/memory
- ✅ Multiple commands in sequence
- ✅ Memory leak detection (10+ messages)
- ✅ Error handling (invalid commands, long messages)

**Usage:**
```bash
bun test:e2e
```

**Features:**
- Automatically starts/stops bot
- Isolated test environment
- Production-like conditions

**3. Automated Tester (`scripts/test-bot-auto.ts`)**

**Purpose:** Interactive testing with live monitoring

**Features:**
- 🤖 Auto-sends commands to bot
- 👀 Real-time response monitoring
- 📊 Colored terminal output
- ⏱️ Response time measurement
- 🔄 Full test suite automation

**Usage:**
```bash
bun test:auto
```

**Workflow:**
1. Connects to bot via API
2. Waits for user to send first message (gets chat_id)
3. Automatically tests all commands
4. Shows results in real-time

### Test Helpers

**TelegramClient:**
```typescript
class TelegramClient {
  async sendCommand(chatId: number, command: string): Promise<Message>
  async waitForResponse(botUsername: string, timeout: number): Promise<Message | null>
  async clearUpdates(): Promise<void>
}
```

**BotProcess (E2E):**
```typescript
class BotProcess {
  async start(): Promise<void>  // Starts bot via start-single.sh
  async stop(): Promise<void>   // Graceful shutdown + force kill
}
```

**Mock Runtime (Integration):**
```typescript
function createMockRuntime(): Partial<IAgentRuntime> {
  // Returns mock with:
  // - emitEvent()
  // - on()
  // - getMemories()
  // - addMemory()
  // - getSetting()
}
```

### Test Commands

```bash
# All tests
bun test

# Integration only (fast)
bun test:integration

# E2E only (slow, full lifecycle)
bun test:e2e

# All tests in tests/ directory
bun test:all

# Watch mode (re-run on changes)
bun test:watch

# With coverage report
bun test:coverage

# Interactive automated tester
bun test:auto
```

### Best Practices

**1. Isolation:**
```typescript
// ✅ Good - Isolated with mocks
const runtime = createMockRuntime();
runtime.emitEvent('TELEGRAM_SLASH_START', { text: '/start' });
expect(mockHandler).toHaveBeenCalled();

// ❌ Bad - Depends on external state
const response = await realBot.sendMessage('/start');
```

**2. Async Handling:**
```typescript
// ✅ Good - Proper timeout
it('responds quickly', async () => {
  const response = await client.waitForResponse(botUsername, 10000);
  expect(response).not.toBeNull();
}, 15000); // Timeout > wait time

// ❌ Bad - No await
it('responds', () => {
  client.sendCommand('/start'); // Won't wait!
  expect(response).toBeDefined();
});
```

**3. Cleanup:**
```typescript
// ✅ Good - Proper cleanup
afterAll(async () => {
  await botProcess.stop();
  await client.clearUpdates();
});
```

---

## Development Workflow

### Daily Development

**1. Start Development Server:**
```bash
bun dev
```

**Features:**
- 🐝 Beautiful ANSI bee logo
- 🔄 Auto-reload on file changes
- 📊 Infisical secret loading
- 🤖 Auto-detected bot username
- 📱 Admin panel links
- ⚡ Fast iteration cycle

**2. Make Changes:**
- Edit source files in `src/`
- Dev server auto-rebuilds
- Process restarts automatically

**3. Test Changes:**
```bash
# Quick test
bun test:auto

# Or comprehensive
bun test:all
```

**4. Build for Production:**
```bash
bun run build
```

### Environment Management

**Development (.env.local):**
```bash
# Infisical credentials (loaded automatically)
INFISICAL_CLIENT_ID=xxx
INFISICAL_CLIENT_SECRET=xxx
INFISICAL_PROJECT_ID=xxx
```

**Test (.env.test):**
```bash
NODE_ENV=test
TELEGRAM_DRY_RUN=true
TEST_TELEGRAM_CHAT_ID=123456789
LOG_LEVEL=debug
DATABASE_URL=sqlite://./data/test.db
```

**Production:**
All secrets loaded from Infisical Cloud automatically.

### Scripts Reference

```bash
# Development
bun dev                    # Dev server with auto-reload
bun start                  # Production start (single-instance)
bun stop                   # Graceful shutdown

# Building
bun run build              # Build TypeScript to dist/
bun run build:watch        # Build in watch mode

# Testing
bun test                   # Quick tests
bun test:integration       # Integration tests
bun test:e2e               # E2E tests
bun test:all               # All tests
bun test:auto              # Interactive automated tester
bun test:watch             # Watch mode
bun test:coverage          # With coverage

# Code Quality
bun run lint               # Format with Prettier
bun run format:check       # Check formatting
bun run type-check         # TypeScript check
bun run type-check:watch   # TypeScript watch mode
bun run check-all          # All checks + tests
```

---

## Troubleshooting Guide

### Common Issues

#### 1. 409 Conflict Error

**Symptoms:**
```
Error: 409: Conflict: terminated by other getUpdates request
```

**Diagnosis:**
```bash
# Check running processes
ps aux | grep -E "elizaos|bun.*dev" | grep -v grep

# Should show only 1 process
# If more than 1 → multiple instances running
```

**Solution:**
```bash
# Kill all and restart
bun stop
killall -9 bun elizaos node 2>/dev/null
sleep 3
bun start
```

**Prevention:**
- Always use `bun start` (not direct `elizaos start`)
- Never run multiple terminals with `bun dev`
- Check PID file: `cat /tmp/vibee-elizaos.pid`

#### 2. /start Command Not Working

**Symptoms:**
- Bot doesn't respond to /start
- Regular messages work fine
- No errors in logs

**Diagnosis:**
```bash
# Check if event handler is registered
grep "TELEGRAM_SLASH_START" /tmp/vibee-elizaos.log

# Check bot info logged
grep "Bot info:" /tmp/vibee-elizaos.log
```

**Common Causes:**
1. TelegramService not initialized
2. Event handler not registered
3. Plugin order incorrect

**Solution:**
```bash
# Rebuild and restart
bun stop
bun run build
bun start

# Check logs for "TelegramService successfully force-started"
tail -f /tmp/vibee-elizaos.log
```

#### 3. Build Not Picking Up Changes

**Symptoms:**
- Changed code but behavior unchanged
- Old code still running

**Solution:**
```bash
# Clean rebuild
rm -rf dist/
bun run build
bun start
```

#### 4. Test Failures

**TEST_TELEGRAM_CHAT_ID not set:**
```bash
# Get your chat ID:
# 1. Send message to bot
# 2. Check logs:
grep "chat_id" /tmp/vibee-elizaos.log

# 3. Add to .env.test:
echo "TEST_TELEGRAM_CHAT_ID=123456789" >> .env.test
```

**Timeout exceeded:**
```bash
# Increase timeout in test file:
it('test', async () => {
  // ...
}, 30000); // 30 seconds
```

**Bot not responding in tests:**
```bash
# Ensure bot is running
ps aux | grep elizaos

# Check logs
tail -f /tmp/vibee-elizaos.log
```

#### 5. Infisical Secrets Not Loading

**Symptoms:**
```
Error: TELEGRAM_BOT_TOKEN not found
```

**Diagnosis:**
```bash
# Check .env.local exists
ls -la .env.local

# Check credentials are set
cat .env.local
```

**Solution:**
```bash
# Ensure Infisical credentials in .env.local:
INFISICAL_CLIENT_ID=your-id
INFISICAL_CLIENT_SECRET=your-secret
INFISICAL_PROJECT_ID=your-project-id

# Test loading:
bun scripts/dev.ts
# Should show "Loaded X secrets from Infisical"
```

### Debug Workflow

**1. Enable Debug Logging:**
```bash
LOG_LEVEL=debug bun start
```

**2. Monitor Logs:**
```bash
tail -f /tmp/vibee-elizaos.log
```

**3. Check Specific Issues:**
```bash
# Bot initialization
grep "Bot info:" /tmp/vibee-elizaos.log

# Event emissions
grep "TELEGRAM_SLASH_START" /tmp/vibee-elizaos.log

# Errors
grep -i "error\|failed\|exception" /tmp/vibee-elizaos.log

# 409 conflicts
grep "409\|Conflict" /tmp/vibee-elizaos.log
```

**4. Process Management:**
```bash
# List all elizaos processes
ps aux | grep elizaos | grep -v grep

# Kill specific PID
kill -TERM $(cat /tmp/vibee-elizaos.pid)

# Force kill all
pkill -9 -f "elizaos"
```

---

## Skills & Best Practices

### Core Skills

#### 1. ElizaOS Plugin Development

**Pattern: Service-based Plugin**
```typescript
import { Plugin, Service, type IAgentRuntime } from '@elizaos/core';

class MyService extends Service {
  static serviceType = 'my-service';

  async initialize(runtime: IAgentRuntime): Promise<void> {
    // Setup logic
    logger.info('MyService initialized');
  }

  async myMethod(): Promise<void> {
    // Service logic
  }
}

export const myPlugin: Plugin = {
  name: 'my-plugin',
  description: 'Does something useful',
  services: [MyService],
  actions: [], // Optional actions
};
```

**Pattern: Event-driven Plugin**
```typescript
const eventPlugin: Plugin = {
  name: 'event-handler',
  description: 'Handles runtime events',
  services: [
    class EventService extends Service {
      async initialize(runtime: IAgentRuntime): Promise<void> {
        // Subscribe to events
        runtime.on('TELEGRAM_SLASH_START', async (data) => {
          logger.info('Received /start command');
          // Handle event
        });
      }
    },
  ],
};
```

#### 2. Telegram Bot Integration

**Key Concepts:**
- One bot instance globally (409 Conflict otherwise)
- Event-driven architecture
- Context passing via `ctx` object
- Long polling with `bot.launch()`

**Best Practices:**
```typescript
// ✅ Good - Check existing service
const existing = runtime.getService('telegram');
if (existing && existing.bot) {
  logger.success('Already initialized');
  return;
}

// ✅ Good - Proper error handling
try {
  const service = await TelegramService.start(runtime);
  if (!service || !service.bot) {
    logger.error('Failed to start');
    return;
  }
} catch (error) {
  logger.error('Error:', error);
}

// ❌ Bad - No checks
await TelegramService.start(runtime); // May cause 409!
```

#### 3. Testing ElizaOS Projects

**Pattern: Integration Test**
```typescript
describe('Integration Tests', () => {
  let client: TelegramClient;

  beforeAll(async () => {
    client = new TelegramClient(process.env.TELEGRAM_BOT_TOKEN);
  });

  it('should respond to command', async () => {
    await client.sendCommand(chatId, '/start');
    const response = await client.waitForResponse(botUsername, 15000);

    expect(response).not.toBeNull();
    expect(response?.text).toBeDefined();
  }, 30000);
});
```

**Pattern: E2E Test**
```typescript
describe('E2E Tests', () => {
  let botProcess: BotProcess;

  beforeAll(async () => {
    botProcess = new BotProcess();
    await botProcess.start(); // Starts real bot
  }, 60000);

  afterAll(async () => {
    await botProcess.stop(); // Cleanup
  });

  it('should handle full workflow', async () => {
    // Test with real bot running
  });
});
```

#### 4. Secret Management with Infisical

**Loading Secrets:**
```typescript
import { InfisicalClient } from '@infisical/sdk';

async function loadSecrets() {
  const client = new InfisicalClient({
    clientId: process.env.INFISICAL_CLIENT_ID,
    clientSecret: process.env.INFISICAL_CLIENT_SECRET,
    siteUrl: 'https://eu.infisical.com',
  });

  const secrets = await client.listSecrets({
    environment: 'dev',
    projectId: process.env.INFISICAL_PROJECT_ID,
    path: '/',
  });

  for (const secret of secrets) {
    process.env[secret.secretKey] = secret.secretValue;
  }
}
```

#### 5. Process Management

**Single-Instance Pattern:**
```bash
# PID file approach
PID_FILE="/tmp/app.pid"

# Before starting
if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE")
  kill -TERM $OLD_PID 2>/dev/null
  sleep 2
fi

# Start and track
my_app &
echo $! > "$PID_FILE"
```

**Health Check Pattern:**
```bash
# Log-based health check
sleep 15
if grep -q "Successfully started" "$LOG_FILE"; then
  echo "✅ Healthy"
else
  echo "❌ Unhealthy"
  exit 1
fi
```

### Advanced Patterns

#### 1. Plugin Composition

**Problem:** Need multiple related functionalities

**Solution:** Compose plugins with shared services
```typescript
const sharedService = new SharedService();

const plugin1: Plugin = {
  name: 'plugin-1',
  services: [sharedService],
};

const plugin2: Plugin = {
  name: 'plugin-2',
  // Can access SharedService via runtime.getService()
};
```

#### 2. Event Broadcasting

**Problem:** Multiple plugins need to react to same event

**Solution:** Event bus pattern
```typescript
// Emitter
runtime.emitEvent(['EVENT_NAME'], { data });

// Multiple subscribers
runtime.on('EVENT_NAME', handler1);
runtime.on('EVENT_NAME', handler2);
runtime.on('EVENT_NAME', handler3);
```

#### 3. Graceful Degradation

**Problem:** Service fails but app should continue

**Solution:** Try-catch with fallbacks
```typescript
try {
  const service = runtime.getService('telegram');
  if (service) {
    await service.sendMessage();
  } else {
    logger.warn('Service not available, using fallback');
    await fallbackMethod();
  }
} catch (error) {
  logger.error('Failed:', error);
  // Continue without crashing
}
```

#### 4. Memory Management

**Problem:** Bot memory grows over time

**Solution:** Periodic cleanup
```typescript
class MemoryManager extends Service {
  async initialize(runtime: IAgentRuntime): Promise<void> {
    // Cleanup every hour
    setInterval(async () => {
      const oldMemories = await runtime.getMemories({
        olderThan: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      for (const memory of oldMemories) {
        await runtime.deleteMemory(memory.id);
      }

      logger.info(`Cleaned ${oldMemories.length} old memories`);
    }, 60 * 60 * 1000);
  }
}
```

### Documentation Standards

**Code Comments:**
```typescript
/**
 * Service that handles X functionality
 *
 * Problem: Y issue occurs in ElizaOS
 * Solution: This service works around it by Z
 *
 * @example
 * const service = runtime.getService('x');
 * await service.doSomething();
 */
class MyService extends Service {
  /**
   * Initialize the service
   *
   * Critical: Must be called before using other methods
   * Side effects: Registers event handlers
   */
  async initialize(runtime: IAgentRuntime): Promise<void> {
    // Implementation
  }
}
```

**README Structure:**
1. Overview (what & why)
2. Quick start (minimal steps)
3. Features (what it does)
4. Usage (how to use)
5. Configuration (options)
6. Troubleshooting (common issues)
7. Contributing (how to help)

### Performance Optimization

**1. Lazy Loading:**
```typescript
// ✅ Good - Load only when needed
if (needsTelegram) {
  const { TelegramService } = await import('@elizaos/plugin-telegram');
}

// ❌ Bad - Always loads
import { TelegramService } from '@elizaos/plugin-telegram';
```

**2. Caching:**
```typescript
class CachedService extends Service {
  private cache = new Map<string, any>();

  async getData(key: string): Promise<any> {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const data = await expensiveOperation(key);
    this.cache.set(key, data);
    return data;
  }
}
```

**3. Batch Operations:**
```typescript
// ✅ Good - Batch updates
const updates = await Promise.all([
  client.getUpdates(offset1),
  client.getUpdates(offset2),
  client.getUpdates(offset3),
]);

// ❌ Bad - Sequential
const update1 = await client.getUpdates(offset1);
const update2 = await client.getUpdates(offset2);
const update3 = await client.getUpdates(offset3);
```

---

## Appendix

### Useful Resources

**ElizaOS:**
- [Official Docs](https://docs.elizaos.ai/)
- [Testing Guide](https://docs.elizaos.ai/guides/test-a-project)
- [Plugin Development](https://docs.elizaos.ai/projects/overview)

**Telegram Bot API:**
- [Official API](https://core.telegram.org/bots/api)
- [Telegraf Framework](https://telegraf.js.org/)

**Bun:**
- [Official Docs](https://bun.sh/docs)
- [Test Runner](https://bun.sh/docs/cli/test)

### Environment Variables Reference

```bash
# Required (from Infisical)
TELEGRAM_BOT_TOKEN=bot123:xxxxx
OPENROUTER_API_KEY=sk-or-xxxxx
OPENAI_API_KEY=sk-xxxxx

# Optional
ANTHROPIC_API_KEY=sk-ant-xxxxx
GOOGLE_GENERATIVE_AI_API_KEY=xxxxx
OLLAMA_API_ENDPOINT=http://localhost:11434

# Testing
TEST_TELEGRAM_CHAT_ID=123456789
NODE_ENV=test
LOG_LEVEL=debug

# System
DATABASE_URL=sqlite://./data/db.sqlite
SERVER_PORT=3000
```

### File Size Limits

- Source files: Keep under 500 lines
- Test files: Keep under 300 lines
- Config files: Keep under 100 lines
- Documentation: Break into sections at 1000 lines

### Version Control

**Commit Message Format:**
```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- feat: New feature
- fix: Bug fix
- docs: Documentation
- test: Tests
- refactor: Code restructuring
- chore: Maintenance

**Examples:**
```
feat(telegram): add /menu command handler
fix(tests): resolve 409 conflict in E2E tests
docs(readme): update testing instructions
test(integration): add response time checks
```

---

**Last Updated:** 2025-01-12
**Version:** 1.0.0
**Maintainer:** Vibee Development Team
