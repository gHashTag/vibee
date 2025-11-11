# 🎯 Vibee Skills Registry

> Comprehensive skills and capabilities for Vibee AI agent specialization

## Table of Contents

1. [Core Competencies](#core-competencies)
2. [Technical Skills](#technical-skills)
3. [Problem-Solving Patterns](#problem-solving-patterns)
4. [Tool Mastery](#tool-mastery)
5. [Domain Expertise](#domain-expertise)

---

## Core Competencies

### Level 1: Foundation Skills

#### ElizaOS Framework Mastery
- ✅ **Plugin Development** - Create custom ElizaOS plugins from scratch
- ✅ **Service Architecture** - Design and implement service-based plugins
- ✅ **Event System** - Master event emission and handling patterns
- ✅ **Runtime Integration** - Deep understanding of IAgentRuntime
- ✅ **Memory Management** - Implement persistent memory and context
- ✅ **Character Configuration** - Design agent personalities and behaviors

**Evidence:**
- Created `telegram-service-starter.ts` to solve plugin loading issues
- Implemented event-driven architecture for commands
- Designed multiple plugins working in harmony

#### Telegram Bot Development
- ✅ **Bot API Mastery** - Complete knowledge of Telegram Bot API
- ✅ **Telegraf Framework** - Expert with Telegraf middleware and handlers
- ✅ **Long Polling** - Understanding of `bot.launch()` mechanics
- ✅ **Webhook Alternative** - Knowledge of webhook vs polling tradeoffs
- ✅ **Command Handling** - /start, /menu, /help patterns
- ✅ **Context Management** - Maintaining conversation state

**Evidence:**
- Solved 409 Conflict issues (multiple instance detection)
- Implemented command handlers with event system
- Created automated testing for bot responses

#### Testing & Quality Assurance
- ✅ **Test-Driven Development** - TDD methodology
- ✅ **Integration Testing** - API and component integration tests
- ✅ **E2E Testing** - Full lifecycle testing with bot automation
- ✅ **Mocking Strategies** - Mock runtimes and services
- ✅ **Performance Testing** - Response time and memory leak detection
- ✅ **Automated Testing** - Interactive test runners

**Evidence:**
- Created comprehensive test suite (integration + E2E)
- Built `test-bot-auto.ts` for automated testing
- Implemented test patterns from ElizaOS best practices

### Level 2: Advanced Skills

#### System Architecture
- ✅ **Single-Instance Patterns** - PID-based process management
- ✅ **Graceful Shutdown** - SIGTERM/SIGKILL handling
- ✅ **Health Monitoring** - Log-based health checks
- ✅ **Auto-Recovery** - Process restart on failure
- ✅ **Resource Management** - Memory and CPU optimization

**Evidence:**
- `start-single.sh` - Prevents 409 conflicts
- `stop.sh` - Graceful shutdown implementation
- Health checks in startup scripts

#### Development Experience
- ✅ **Dev Server Design** - Hot-reload and auto-restart
- ✅ **CLI Design** - Beautiful terminal UIs with ANSI
- ✅ **Error Messages** - Clear, actionable error reporting
- ✅ **Logging Strategy** - Structured logging with levels
- ✅ **Debug Workflows** - Systematic debugging approaches

**Evidence:**
- `dev.ts` - Professional dev server with auto-reload
- Beautiful ANSI bee logo and colored output
- Comprehensive logging throughout system

#### Secret Management
- ✅ **Infisical Integration** - Cloud secret loading
- ✅ **Environment Management** - .env.local, .env.test patterns
- ✅ **Credential Security** - Never commit secrets
- ✅ **Multi-Environment** - Dev, test, production configs

**Evidence:**
- Infisical SDK integration in dev.ts
- Proper .gitignore for credentials
- Environment-specific configurations

---

## Technical Skills

### Programming Languages

#### TypeScript (Expert)
```typescript
// Advanced type inference
type ExtractEventData<T> = T extends { data: infer D } ? D : never;

// Conditional types
type ServiceType<T extends Service> = T extends { serviceType: infer S } ? S : never;

// Generics with constraints
async function getService<T extends Service>(
  runtime: IAgentRuntime,
  type: string
): Promise<T | null> {
  return runtime.getService(type) as T | null;
}
```

**Skills:**
- Advanced types (conditional, mapped, template literals)
- Async/await and Promise patterns
- Decorators and metadata
- Module system (ESM/CommonJS)
- Type narrowing and guards

#### Bash Scripting (Advanced)
```bash
#!/bin/bash
# Process management
PID_FILE="/tmp/app.pid"

cleanup() {
  if [ -f "$PID_FILE" ]; then
    kill -TERM $(cat "$PID_FILE") 2>/dev/null
    rm -f "$PID_FILE"
  fi
}

trap cleanup EXIT INT TERM

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}✓${NC} Success"
```

**Skills:**
- Process management (PID files, signals)
- Error handling and traps
- ANSI color codes
- File operations
- Conditional logic

### Frameworks & Libraries

#### Bun (Expert)
- Native test runner
- Fast package installation
- TypeScript execution
- Build tooling
- Hot reload

#### ElizaOS (Expert)
- Plugin architecture
- Service lifecycle
- Event system
- Memory/database
- Character system
- Runtime API

#### Telegraf (Proficient)
- Bot initialization
- Command handlers
- Middleware
- Context management
- Error handling

### Tools & Platforms

#### Testing Tools
- **Bun test** - Native test runner
- **Vitest patterns** - Test organization
- **Mock utilities** - vi.fn(), vi.spyOn()
- **Async testing** - Promise handling
- **Coverage tools** - Coverage reporting

#### Development Tools
- **Git** - Version control
- **Prettier** - Code formatting
- **TypeScript Compiler** - Type checking
- **VS Code** - IDE setup
- **Terminal** - CLI workflows

#### Infrastructure
- **Infisical** - Secret management
- **SQLite** - Local database
- **PostgreSQL** - Production DB (optional)
- **Docker** - Containerization (future)

---

## Problem-Solving Patterns

### Pattern 1: Service Not Starting

**Problem Signature:**
- Plugin exists but service doesn't initialize
- No errors but functionality missing
- ElizaOS loads plugin but doesn't call `.start()`

**Solution Pattern:**
```typescript
// 1. Check if service exists
const existing = runtime.getService('service-name');

// 2. If not, manually import and start
if (!existing) {
  const { ServiceClass } = await import('plugin-package');
  await ServiceClass.start(runtime);
}

// 3. Verify initialization
if (existing && existing.criticalProperty) {
  logger.success('✅ Service initialized');
}
```

**Applied In:**
- `telegram-service-starter.ts` - Forces TelegramService start

### Pattern 2: Multiple Process Conflicts

**Problem Signature:**
- 409 Conflict errors
- "Already running" messages
- Port binding failures
- Resource locks

**Solution Pattern:**
```bash
# 1. Aggressive cleanup
pkill -9 -f "process-pattern"
sleep 2

# 2. Verify killed
RUNNING=$(ps aux | grep "pattern" | grep -v grep | wc -l)
if [ "$RUNNING" != "0" ]; then
  echo "Failed to kill processes"
  exit 1
fi

# 3. Track new process
app start &
echo $! > /tmp/app.pid

# 4. Health check
sleep 5
if ! check_health; then
  echo "Failed to start"
  kill $(cat /tmp/app.pid)
  exit 1
fi
```

**Applied In:**
- `start-single.sh` - Single instance enforcement

### Pattern 3: Event Not Firing

**Problem Signature:**
- Event emitted but handler not called
- Handler registered but no logs
- Timing issues

**Solution Pattern:**
```typescript
// 1. Register handler BEFORE service starts
runtime.on('EVENT_NAME', handler);

// 2. Verify emission
runtime.emitEvent(['EVENT_NAME'], data);
logger.debug('Emitted EVENT_NAME');

// 3. Debug handler
const handler = (data) => {
  logger.debug('Received EVENT_NAME', data);
  // Process event
};

// 4. Check plugin order (handlers before emitters)
plugins: [
  handlerPlugin,  // Registers handler
  emitterPlugin,  // Emits events
]
```

**Applied In:**
- Event system debugging
- Plugin load order optimization

### Pattern 4: Async Race Conditions

**Problem Signature:**
- Intermittent test failures
- "Sometimes works" issues
- Timing-dependent bugs

**Solution Pattern:**
```typescript
// 1. Use proper timeouts
async function waitForCondition(
  condition: () => boolean,
  timeout: number = 10000
): Promise<boolean> {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (condition()) return true;
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return false;
}

// 2. Sequential async operations
await operation1();
await operation2(); // Waits for operation1

// 3. Parallel async operations (when safe)
await Promise.all([
  operation1(),
  operation2(),
  operation3(),
]);

// 4. Handle all settlements
const results = await Promise.allSettled([
  operation1(),
  operation2(),
]);
```

**Applied In:**
- Test suite (waitForResponse method)
- Bot initialization timing

### Pattern 5: Memory Leaks

**Problem Signature:**
- Memory usage grows over time
- Process slows down
- Eventually crashes

**Solution Pattern:**
```typescript
// 1. Cleanup intervals
class Service {
  private intervals: NodeJS.Timeout[] = [];

  startInterval(fn: () => void, ms: number) {
    const interval = setInterval(fn, ms);
    this.intervals.push(interval);
  }

  async cleanup() {
    this.intervals.forEach(clearInterval);
    this.intervals = [];
  }
}

// 2. Limit collection sizes
const cache = new Map();
const MAX_SIZE = 1000;

function addToCache(key, value) {
  if (cache.size >= MAX_SIZE) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, value);
}

// 3. Weak references for large objects
const cache = new WeakMap(); // GC can collect

// 4. Periodic cleanup
setInterval(() => {
  const old = Date.now() - 7 * 24 * 60 * 60 * 1000;
  deleteOlderThan(old);
}, 60 * 60 * 1000);
```

**Applied In:**
- Memory management documentation
- E2E memory leak tests

---

## Tool Mastery

### Git Workflows

#### Feature Development
```bash
# Create feature branch
git checkout -b feature/telegram-commands

# Make changes
git add .
git commit -m "feat(telegram): add /menu command"

# Push and create PR
git push origin feature/telegram-commands
gh pr create --title "Add /menu command" --body "..."
```

#### Hotfix
```bash
# Create hotfix from main
git checkout -b hotfix/409-conflict main

# Fix and commit
git commit -m "fix(telegram): resolve 409 conflict"

# Merge back
git checkout main
git merge hotfix/409-conflict
git push origin main
```

#### Debugging
```bash
# Find when bug introduced
git bisect start
git bisect bad HEAD
git bisect good v1.0.0

# Git will checkout commits to test
# Mark each as good/bad until found
```

### Package Management

#### Bun Commands
```bash
# Install
bun install

# Add dependency
bun add package-name

# Add dev dependency
bun add -D package-name

# Remove dependency
bun remove package-name

# Update all
bun update

# Run script
bun run script-name

# Execute file
bun file.ts
```

#### Dependency Management
```bash
# Check outdated
bun outdated

# Interactive upgrade
bun update --interactive

# Lock file
bun install --frozen-lockfile
```

### Testing Workflows

#### TDD Cycle
```bash
# 1. Write failing test
bun test:watch # Keep running

# 2. Write minimal code to pass
# 3. Refactor
# 4. Repeat
```

#### Test Organization
```bash
# Run specific test
bun test --name "should respond to /start"

# Run test file
bun test tests/telegram.integration.test.ts

# Watch mode
bun test:watch

# Coverage
bun test:coverage
```

#### Debugging Tests
```bash
# Verbose output
LOG_LEVEL=debug bun test

# Single test with console
it.only('test name', async () => {
  console.log('Debug output');
  // ...
});

# Timeout for slow tests
it('slow test', async () => {
  // ...
}, 60000); // 60 seconds
```

---

## Domain Expertise

### ElizaOS Ecosystem

#### Core Concepts
1. **Agents** - AI entities with personality and behavior
2. **Plugins** - Modular functionality extensions
3. **Services** - Long-running background processes
4. **Actions** - Discrete, triggerable behaviors
5. **Memory** - Persistent context and learning
6. **Runtime** - Execution environment for agents

#### Plugin Types
- **Platform Plugins** - Discord, Telegram, Twitter
- **Model Plugins** - OpenAI, Anthropic, Groq
- **Storage Plugins** - SQL, PostgreSQL, Redis
- **Utility Plugins** - Bootstrap, Web, API

#### Character Design
```typescript
{
  name: 'AgentName',
  bio: ['Expert in X', 'Specializes in Y'],
  topics: ['Topic 1', 'Topic 2'],
  style: {
    all: ['Be helpful', 'Use examples'],
    chat: ['Be concise', 'Ask questions'],
  },
  messageExamples: [
    [
      { name: 'user', content: { text: 'Question' } },
      { name: 'AgentName', content: { text: 'Answer' } },
    ],
  ],
}
```

### Telegram Bot Development

#### Bot Capabilities
- **Commands** - /start, /help, custom commands
- **Inline Queries** - @botname search
- **Keyboards** - Reply and inline keyboards
- **Media** - Photos, videos, documents
- **Payments** - In-bot payments
- **Games** - HTML5 games

#### Best Practices
1. **Response Time** - Under 5 seconds ideal
2. **Error Handling** - Always catch and report errors
3. **Rate Limiting** - Respect Telegram limits
4. **User Privacy** - Don't log sensitive data
5. **Graceful Degradation** - Handle API failures

#### Common Patterns
```typescript
// Command handler
bot.command('start', async (ctx) => {
  await ctx.reply('Welcome!');
});

// Middleware
bot.use(async (ctx, next) => {
  console.log('Update:', ctx.update);
  await next();
});

// Error handler
bot.catch((err, ctx) => {
  console.error('Error:', err);
  ctx.reply('Sorry, an error occurred');
});
```

### Testing Methodologies

#### Test Pyramid
```
       /\
      /E2E\        <- Few, slow, expensive
     /------\
    /Integration\ <- Some, medium, valuable
   /------------\
  /     Unit     \ <- Many, fast, cheap
 /----------------\
```

#### Test Coverage Goals
- **Statements:** >80%
- **Branches:** >75%
- **Functions:** >80%
- **Lines:** >80%

#### Critical Paths
Always test:
1. User authentication
2. Data persistence
3. Payment flows
4. Security boundaries
5. Error handling

### Performance Optimization

#### Metrics
- **Response Time** - < 1s for API calls
- **Throughput** - Requests per second
- **Memory** - Heap usage over time
- **CPU** - Processing time
- **Database** - Query performance

#### Optimization Techniques
1. **Caching** - Memoization, Redis
2. **Lazy Loading** - Load on demand
3. **Batch Operations** - Reduce round trips
4. **Connection Pooling** - Reuse connections
5. **Indexing** - Database optimization

---

## Skill Development Path

### Current Mastery Level: Advanced (4/5)

**Strengths:**
- ✅ ElizaOS plugin development
- ✅ Telegram bot integration
- ✅ Testing infrastructure
- ✅ System architecture
- ✅ Problem diagnosis

**Areas for Growth:**
- 🔄 CI/CD automation
- 🔄 Container orchestration
- 🔄 Monitoring & alerting
- 🔄 Load testing
- 🔄 Security hardening

### Next Skills to Acquire

#### 1. GitHub Actions Mastery
```yaml
name: CI/CD
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun test
      - run: bun run build
```

#### 2. Docker Containerization
```dockerfile
FROM oven/bun:1
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build
CMD ["bun", "start"]
```

#### 3. Monitoring Setup
```typescript
import { Prometheus } from 'prom-client';

const responseTime = new Prometheus.Histogram({
  name: 'bot_response_time',
  help: 'Bot response time in seconds',
  buckets: [0.1, 0.5, 1, 2, 5],
});

// Track metrics
const start = Date.now();
await handleCommand();
responseTime.observe((Date.now() - start) / 1000);
```

#### 4. Load Testing
```typescript
import { check } from 'k6';
import http from 'k6/http';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  const res = http.post('https://api.telegram.org/botTOKEN/sendMessage', {
    chat_id: TEST_CHAT_ID,
    text: '/start',
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

---

## Continuous Learning

### Resources
- ElizaOS Discord community
- Telegram Bot API updates
- Bun release notes
- TypeScript handbook
- Testing best practices blog posts

### Learning Methods
1. **Learning by Doing** - Build projects
2. **Code Review** - Review others' code
3. **Documentation** - Write comprehensive docs
4. **Teaching** - Explain to others
5. **Debugging** - Solve complex issues

### Knowledge Sharing
- Document solutions in PROJECT_KNOWLEDGE_BASE.md
- Create examples in tests/
- Write clear commit messages
- Update README.md regularly
- Share insights in team discussions

---

**Last Updated:** 2025-01-12
**Version:** 1.0.0
**Next Review:** 2025-02-12
