# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Vibee** is an ElizaOS-based Telegram AI agent focused on teaching vibe-coding and modern development practices. It features custom Generative UI capabilities for interactive Telegram conversations.

| Property | Value |
|----------|-------|
| **Type** | ElizaOS Agent Project |
| **Package Manager** | `bun` (REQUIRED) |
| **Primary Client** | Telegram Bot |
| **Language** | TypeScript |
| **Testing** | Bun test (component) + Cypress (E2E) |
| **Secret Management** | Infisical Cloud SDK |

## Essential Commands

### Development
```bash
# Start with hot-reload (recommended)
bun run dev

# Standard start (requires rebuild after changes)
bun run start

# Build the project
bun run build

# Build with watch mode
bun run build:watch
```

### Testing
```bash
# Run all tests (component + E2E)
bun run test

# Component tests only (Bun test runner)
bun run test:component

# E2E tests only (Cypress)
bun run test:e2e

# Watch mode
bun run test:watch

# Coverage report
bun run test:coverage
```

### Code Quality
```bash
# Format code
bun run format

# Check formatting without changes
bun run format:check

# Type checking
bun run type-check

# Type checking with watch
bun run type-check:watch

# Run all checks (type-check + format:check + test)
bun run check-all
```

### Cypress E2E (Browser Tests)
```bash
# Open Cypress UI
bun run cy:open

# Run component tests
bun run cypress:component

# Run E2E tests
bun run cypress:e2e
```

## Project Architecture

### Core Entry Point Flow

The project uses **Infisical for cloud-based secret management** with a critical initialization pattern:

```
start.mjs (wrapper script)
  ↓ loads Infisical secrets
  ↓ spawns elizaos CLI
src/index.ts
  ↓ calls initializeInfisical() FIRST
  ↓ dynamically imports character.ts AFTER secrets loaded
  ↓ exports projectAgent with plugins
```

**Critical**: `src/index.ts` loads Infisical secrets BEFORE importing character to ensure environment variables are available. This avoids JavaScript hoisting issues.

### Plugin Architecture

The project extends ElizaOS with **three custom plugins**:

1. **`starterPlugin`** (`src/plugin.ts`)
   - Template example plugin with actions, providers, services
   - Includes `HELLO_WORLD` action as reference
   - Demonstrates ElizaOS plugin patterns

2. **`telegramUIPlugin`** (`src/telegram-ui-plugin.ts`)
   - Generative UI system for Telegram
   - Auto-generates interactive elements (buttons, keyboards, menus)
   - Actions: `GENERATE_TELEGRAM_UI`, `HANDLE_TELEGRAM_CALLBACK`
   - See `GENERATIVE_UI.md` for full capabilities

3. **`telegramCommandsPlugin`** (`src/telegram-commands-plugin.ts`)
   - Telegram bot commands (/start, /menu, /help)
   - Action: `HANDLE_TELEGRAM_COMMAND`
   - See `BOT_COMMANDS.md` for command list

### Character Configuration

**Location**: `src/character.ts`

The character (`Vibee`) is a **Russian-speaking** AI mentor specializing in:
- Vibe-coding practices
- Modern web development (TypeScript, React, Bun)
- ElizaOS and AI agents
- Practical code examples

**Key features**:
- Dynamic plugin loading based on environment variables
- Conditional plugin inclusion (only loads if API keys present)
- Uses OpenRouter with `meta-llama/llama-3.1-8b-instruct:free` model
- Embedding model: `text-embedding-3-small`

### Secret Management (Infisical)

**Files**:
- `src/infisical.ts` - SDK integration and secret loading
- `start.mjs` - Wrapper script that preloads secrets before ElizaOS CLI
- `infisical-preload.mjs` - Alternative preload script

**Flow**:
1. Load `.env` file
2. Check for `INFISICAL_CLIENT_ID`, `INFISICAL_CLIENT_SECRET`, `INFISICAL_PROJECT_ID`
3. If present, authenticate with Infisical Cloud
4. Download ALL secrets from environment (dev/staging/prod)
5. Inject into `process.env`
6. Start ElizaOS with enriched environment

**Environment Variables**:
```bash
INFISICAL_CLIENT_ID=your-client-id
INFISICAL_CLIENT_SECRET=your-client-secret
INFISICAL_PROJECT_ID=your-project-id
INFISICAL_ENVIRONMENT=dev  # or staging, prod
```

## File Structure

```
vibee/
├── src/
│   ├── index.ts                    # Main entry (loads Infisical, exports project)
│   ├── character.ts                # Vibee character definition
│   ├── plugin.ts                   # Starter plugin (template)
│   ├── telegram-ui-plugin.ts       # Generative UI for Telegram
│   ├── telegram-commands-plugin.ts # Bot commands (/start, /menu, /help)
│   ├── telegram-ui-extension.ts    # UI helper utilities
│   ├── infisical.ts                # Infisical SDK integration
│   ├── frontend/                   # React components (if any)
│   └── __tests__/                  # All tests
│       ├── *.test.ts               # Component tests (Bun)
│       ├── e2e/*.e2e.ts            # E2E tests (ElizaOS runner)
│       ├── cypress/                # Cypress tests
│       └── utils/                  # Test utilities
├── dist/                           # Build output
├── start.mjs                       # Startup wrapper with Infisical preload
├── build.ts                        # Custom build script
├── .env                            # Local environment (gitignored)
├── .env.example                    # Environment template
├── BOT_COMMANDS.md                 # Telegram bot command documentation
├── GENERATIVE_UI.md                # Generative UI system documentation
└── README.md                       # Project README
```

## Testing Strategy

### Dual Testing Approach

1. **Component Tests** (Bun test runner)
   - Fast, isolated, mocked tests
   - Located: `src/__tests__/*.test.ts`
   - Run: `bun run test:component`

2. **E2E Tests** (ElizaOS + Cypress)
   - Real runtime with actual database (PGLite)
   - Located: `src/__tests__/e2e/*.e2e.ts`, `src/__tests__/cypress/`
   - Run: `bun run test:e2e` or `bun run cypress:component`

### Test Files of Note

- `src/__tests__/integration.test.ts` - Plugin integration tests
- `src/__tests__/character-plugin-ordering.test.ts` - Plugin load order tests
- `src/__tests__/e2e/project-starter.e2e.ts` - Full runtime E2E tests
- `src/__tests__/cypress/e2e/agent-chat.cy.ts` - Telegram UI flow tests

## Test-Driven Development (TDD)

Vibee follows **TDD principles** for all new features and bug fixes. The project has a self-evolving TDD system powered by custom Claude Code skills.

### TDD Philosophy

**Red → Green → Refactor**

```
🔴 RED:    Write failing test first
🟢 GREEN:  Write minimal code to pass
🔵 REFACTOR: Improve code quality while keeping tests green
🔁 REPEAT:  Continue cycle for next feature
```

### Quick Start TDD Workflow

```bash
# 1. Start watch mode (essential for TDD)
bun test --watch

# 2. Write specification (optional but recommended)
# Use specification-writer skill for complex features

# 3. Write failing test (RED phase)
# Add test to appropriate *.test.ts file

# 4. Watch test fail with clear error message

# 5. Implement minimal code (GREEN phase)

# 6. Watch test pass

# 7. Refactor while keeping tests green (REFACTOR phase)

# 8. Commit when all tests green
```

### Bun Test Best Practices

**Test File Naming**:
```
src/telegram-ui-plugin.ts       → src/__tests__/telegram-ui-plugin.test.ts
src/telegram-commands-plugin.ts → src/__tests__/telegram-commands-plugin.test.ts
```

**Test Structure (AAA Pattern)**:
```typescript
import { describe, test, expect, beforeEach, mock } from 'bun:test';

describe('FeatureName', () => {
  beforeEach(() => {
    // Reset state before each test
  });

  test('should handle happy path scenario', () => {
    // ARRANGE - Setup test data
    const input = createTestInput();
    const mockCallback = mock(() => Promise.resolve());

    // ACT - Execute the code under test
    const result = functionUnderTest(input);

    // ASSERT - Verify the outcome
    expect(result).toBeDefined();
    expect(mockCallback).toHaveBeenCalled();
  });

  test('should handle edge case gracefully', () => {
    // Test edge cases
  });

  test('should throw error on invalid input', () => {
    expect(() => functionUnderTest(null)).toThrow();
  });
});
```

**Mocking Patterns**:
```typescript
import { mock, spyOn } from 'bun:test';

// Mock function
const mockCallback = mock(() => Promise.resolve({ success: true }));

// Mock runtime object
const mockRuntime = {
  sendMessage: mock(() => Promise.resolve()),
  getMemories: mock(() => Promise.resolve([])),
  getService: mock((name) => mockServices[name]),
};

// Spy on existing function
const spy = spyOn(object, 'methodName');
object.methodName();
expect(spy).toHaveBeenCalled();
spy.mockRestore();

// Module mocking
mock.module('./infisical', () => ({
  getSecrets: () => ({ API_KEY: 'test-key' }),
}));
```

**Test Commands**:
```bash
# Basic testing
bun test                    # Run all tests
bun test --watch            # Watch mode (TDD essential!)
bun test --coverage         # Generate coverage report
bun test --bail             # Stop on first failure

# Filtering tests
bun test telegram-ui        # Run tests matching pattern
bun test -t "should handle" # Run tests with matching name

# Debugging
LOG_LEVEL=debug bun test    # Verbose output
bun test --timeout 10000    # Custom timeout
```

### TDD Skills & Automation

Vibee includes specialized Claude Code skills for automated TDD:

**1. `tdd-cycle-engine`** (`.claude/skills/tdd-cycle-engine/SKILL.md`)
   - Orchestrates RED-GREEN-REFACTOR cycle
   - Generates tests from specifications
   - Suggests refactoring opportunities
   - Validates test quality

**2. `specification-writer`** (`.claude/skills/specification-writer/SKILL.md`)
   - Creates clear, testable specifications
   - Defines acceptance criteria
   - Generates test scenarios
   - Converts specs to tests

**3. `test-engineer` agent** (`.claude/agents/test-engineer.md`)
   - Senior-level TDD expertise
   - Quality assurance automation
   - Test pattern extraction
   - CI/CD integration

### Using TDD Skills

```bash
# Generate specification for new feature
Use: specification-writer
Task: "Write spec for /profile command"

# Start TDD cycle for feature
Use: tdd-cycle-engine
Task: "Implement /profile command with TDD"

# The system will:
# 1. Create detailed specification
# 2. Generate failing tests (RED)
# 3. Guide implementation (GREEN)
# 4. Suggest improvements (REFACTOR)
# 5. Save patterns for reuse
```

### TDD Quality Gates

**Pre-Commit Checklist**:
- ✅ All tests pass (`bun test`)
- ✅ Coverage > 80% (`bun test --coverage`)
- ✅ No `.only()` or `.skip()` in tests
- ✅ Test names are descriptive
- ✅ No console.log() in production code

**Pre-Push Checklist**:
- ✅ Full test suite passes
- ✅ No flaky tests (run 3 times)
- ✅ All new features have tests
- ✅ All bugs have regression tests

### Test Utilities

**Mock Factories** (`src/__tests__/utils/mocks.ts`):
```typescript
export function createMockRuntime(overrides = {}) {
  return {
    sendMessage: mock(() => Promise.resolve({ success: true })),
    getMemories: mock(() => Promise.resolve([])),
    ...overrides,
  };
}

export function createMockMessage(text: string, userId = 'test-user') {
  return {
    content: { text },
    userId,
    roomId: 'test-room',
    timestamp: Date.now(),
  };
}
```

**Custom Matchers**:
```typescript
expect.extend({
  toBeValidTelegramMarkup(received) {
    const isValid = received && Array.isArray(received.inline_keyboard);
    return {
      pass: isValid,
      message: () => `Expected valid Telegram markup`,
    };
  },
});
```

### TDD Metrics

Track these metrics to ensure TDD effectiveness:

```yaml
Coverage:
  Target: > 80% line coverage
  Critical: > 90% for core features

Speed:
  Full suite: < 30 seconds
  Individual test: < 100ms

Quality:
  Flaky tests: 0 tolerance
  Test failures in CI: < 1%
```

## Self-Evolution System

Vibee features a **self-evolving system** that can analyze, improve, and write its own code. This system is powered by specialized Claude Code skills.

### Core Skills

Located in `.claude/skills/`:

1. **`master-orchestrator`** - Central coordinator for all self-improvement operations
2. **`self-evolution-engine`** - Analyzes code and generates improvements
3. **`pattern-learner`** - Extracts and applies reusable patterns
4. **`tdd-cycle-engine`** - Automates Test-Driven Development
5. **`specification-writer`** - Creates clear, testable specifications

### Self-Evolution Cycle

```
DETECT → ANALYZE → DESIGN → IMPLEMENT → VALIDATE → DEPLOY → LEARN
   ↑                                                              ↓
   └──────────────────────────────────────────────────────────────┘
```

### Using Self-Evolution

```bash
# Analyze and improve code
Use: master-orchestrator
Task: "Улучши telegram-ui-plugin"

# The system will:
# 1. Analyze current code
# 2. Identify improvements (performance, structure, patterns)
# 3. Generate optimized code
# 4. Create tests
# 5. Validate improvements
# 6. Save patterns to knowledge base
```

### Knowledge Base

The system maintains a growing knowledge base in `.claude/memory/`:

```
.claude/memory/
├── patterns/              # Extracted code patterns
├── best-practices/        # Proven solutions
├── lessons-learned/       # What worked/didn't work
└── evolution-history/     # Self-improvement history
```

### Self-Evolution Goals

- 📝 **Write own code**: Generate features from patterns
- 🧠 **Improve memory**: Optimize context retention
- 📚 **Learn continuously**: Extract patterns from success
- ✨ **Autonomous improvement**: Self-optimize without human intervention

For complete documentation, see:
- `.claude/skills/README.md` - Skills ecosystem overview
- `.claude/SELF_EVOLUTION_SETUP.md` - Setup and usage guide

## TypeScript Configuration

**Key settings** in `tsconfig.json`:
- `module: "Preserve"` - Preserves ES modules
- `moduleResolution: "Bundler"` - Bundler-first resolution
- `allowImportingTsExtensions: true` - Allows `.ts` imports
- `noEmit: true` - No emit (build handled by `build.ts`)
- Path aliases for `@elizaos/core` (when developing ElizaOS core)

## Build Process

**Build script**: `build.ts`

Custom build script that:
1. Compiles TypeScript with `tsc`
2. Handles module resolution for ESM
3. Outputs to `dist/`

Run with: `bun run build` or `bun run build:watch`

## Development Workflow

### Starting Development

1. **Install dependencies**: `bun install`
2. **Configure environment**: Copy `.env.example` to `.env` and fill in API keys
3. **Start development**: `bun run dev` (hot-reload enabled)

### Adding Custom Actions

Actions are defined in plugins. Example pattern from `telegram-ui-plugin.ts`:

```typescript
const myAction: Action = {
  name: 'MY_ACTION',
  similes: ['ALIAS_1', 'ALIAS_2'],
  description: 'What this action does',

  validate: async (runtime, message, state) => {
    // Return true if action should run
    return message.content.text.includes('trigger');
  },

  handler: async (runtime, message, state, options, callback) => {
    // Perform action
    await callback({ text: 'Response' });

    return {
      success: true,
      text: 'Action completed',
      values: { result: 'data' },
    };
  },

  examples: [
    [
      { name: 'user', content: { text: 'trigger phrase' } },
      { name: 'agent', content: { text: 'response', actions: ['MY_ACTION'] } },
    ],
  ],
};
```

### Plugin Registration

Plugins are registered in `src/index.ts`:

```typescript
export const projectAgent: ProjectAgent = {
  character,
  plugins: [
    starterPlugin,
    telegramUIPlugin,
    telegramCommandsPlugin,
    // Add your custom plugins here
  ],
};
```

## Telegram Bot Features

### Generative UI System

The Telegram UI system automatically generates interactive elements based on message context:

**Supported UI Elements**:
- Inline callback buttons (with handlers)
- URL buttons (external links)
- Reply keyboards (persistent bottom keyboard)
- Web app buttons (mini-apps)
- Dynamic menus

**Auto-triggers**: The system detects keywords and generates appropriate UI:
- "обуч", "курс", "изуч" → Learning menu
- "пример", "покажи код" → Code examples with buttons
- "инструмент", "фреймворк" → Tool selection keyboard
- "помощь", "ошибка" → Help buttons + docs link

See `GENERATIVE_UI.md` for complete documentation.

### Bot Commands

- `/start` - Welcome message with main menu
- `/menu` - Navigation menu (Learning, Tools, Examples, Help, Progress)
- `/help` - Help and instructions

See `BOT_COMMANDS.md` for details.

## Environment Variables

### Required for Core Functionality

```bash
# At least one LLM provider required
OPENROUTER_API_KEY=your-key
# or OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.

# Telegram bot (if using Telegram)
TELEGRAM_BOT_TOKEN=your-token
```

### Optional Infisical Cloud Secrets

```bash
INFISICAL_CLIENT_ID=your-client-id
INFISICAL_CLIENT_SECRET=your-client-secret
INFISICAL_PROJECT_ID=your-project-id
INFISICAL_ENVIRONMENT=dev  # dev, staging, prod
INFISICAL_SITE_URL=https://app.infisical.com  # optional
```

If Infisical credentials are not provided, the system falls back to `.env` file only.

## Common Patterns

### Accessing Telegram Client in Actions

```typescript
// Get Telegram client from runtime
const telegramClient = runtime.clients.find(
  (client) => client.constructor.name === 'TelegramClientInterface'
);
```

### Sending Messages with UI Elements

```typescript
import { TelegramUIHelper } from './telegram-ui-extension';

await TelegramUIHelper.sendMessageWithUI(
  telegramClient,
  chatId,
  'Your message',
  [
    { type: 'inline_callback', text: 'Button', callback_data: 'action_id' },
    { type: 'inline_url', text: 'Docs', url: 'https://example.com' },
  ]
);
```

### Handling Callbacks

Callbacks are automatically handled by the `HANDLE_TELEGRAM_CALLBACK` action in `telegram-ui-plugin.ts`. Add new callback handlers in the switch statement.

## Troubleshooting

### Secret Management Issues

If secrets aren't loading:
1. Check `.env` file has Infisical credentials
2. Verify Infisical project ID and environment
3. Check logs for "Successfully loaded N secrets from Infisical Cloud"
4. Try running without Infisical (comment out credentials)

### Plugin Loading Issues

If plugins aren't loading:
1. Check `src/index.ts` exports `projectAgent.plugins` array
2. Verify plugin imports use `.ts` extension
3. Check plugin exports default `Plugin` object
4. Look for "Final plugins being loaded" in logs

### Telegram Bot Not Responding

1. Verify `TELEGRAM_BOT_TOKEN` is set
2. Check logs for "Telegram client initialized"
3. Ensure `@elizaos/plugin-telegram` is in character plugins
4. Test with `/start` command first

## Documentation References

- `README.md` - Quick start and feature overview
- `BOT_COMMANDS.md` - Telegram bot commands (Russian)
- `GENERATIVE_UI.md` - Generative UI system (Russian)
- ElizaOS docs: https://docs.elizaos.ai
- Telegram Bot API: https://core.telegram.org/bots/api
- Infisical SDK: https://infisical.com/docs/sdks/overview
