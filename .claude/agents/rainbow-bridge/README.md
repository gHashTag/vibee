# 🌈 Rainbow Bridge - Swarm E2E Testing System

## Overview

**Rainbow Bridge** - полностью автономная система E2E тестирования через реальный Telegram бот.

## Swarm Architecture

```
Master Orchestrator
├── Test Planner        → Создаёт план тестов
├── E2E Executor        → Выполняет тесты в Telegram
├── Bug Analyzer        → Анализирует провалы
├── Code Fixer          → Исправляет баги
└── Reporter            → Генерирует отчёты
```

## Quick Start

```bash
# Запуск полного E2E цикла
python3 scripts/rainbow-bridge-test.py critical

# Или через Master Orchestrator (когда будет реализован)
claude-code orchestrate "Run E2E test cycle for training plugin"
```

## Agents

### 1. Master Orchestrator (`orchestrator.md`)
**Role**: Координация всего swarm
**Spawns**: Все остальные агенты
**Responsibility**: Управление lifecycle тестирования

### 2. Test Planner (`test-planner.md`)
**Role**: Планирование тестов
**Input**: Feature name + files to analyze
**Output**: Comprehensive test plan
**Coverage**: Commands, buttons, errors, edge cases

### 3. E2E Executor
**Role**: Выполнение тестов
**Method**: Autonomous-telegram-agent
**Output**: Pass/fail results with details

### 4. Bug Analyzer
**Role**: Анализ провалов
**Input**: Failed test results
**Output**: Root cause analysis + severity

### 5. Code Fixer
**Role**: Автоматическое исправление
**Input**: Bug analysis
**Output**: Code fixes + validation

### 6. Reporter
**Role**: Отчёты
**Input**: All results
**Output**: HTML/JSON/Markdown reports

## Coordination Protocol

### Event-Driven Communication
```json
{
  "event": "test_execution_complete",
  "agent": "e2e-executor",
  "data": {
    "passed": 3,
    "failed": 2
  },
  "next_action": "spawn bug-analyzer"
}
```

### Shared State
**File**: `/tmp/rainbow-bridge-state.json`
- All agents read/write atomically
- Contains full execution context
- Enables recovery from crashes

## Best Practices Applied

- ✅ **Hierarchical Coordination** (Orchestrator → Workers)
- ✅ **Event-Driven** (State changes trigger next phase)
- ✅ **Specialized Agents** (Single responsibility)
- ✅ **Shared Memory** (JSON state file)
- ✅ **Fault Tolerance** (Retry logic)
- ✅ **Parallel Execution** (When possible)

## Example Flow

```
User: "Run E2E tests for training plugin"
  ↓
Orchestrator: Spawn Test Planner
  ↓
Test Planner: Create 8 test scenarios → Save to state
  ↓
Orchestrator: Spawn E2E Executor
  ↓
E2E Executor: Run 8 tests via autonomous-telegram-agent
  ↓ (3 passed, 2 failed)
Orchestrator: Spawn Bug Analyzer
  ↓
Bug Analyzer: Analyze 2 failures → Find root causes
  ↓
Orchestrator: Spawn Code Fixer
  ↓
Code Fixer: Apply 2 fixes → Update code
  ↓
Orchestrator: Spawn E2E Executor (retest)
  ↓
E2E Executor: Re-run 2 failed tests → Both pass
  ↓
Orchestrator: Spawn Reporter
  ↓
Reporter: Generate report → Save to file
  ↓
User: Receives comprehensive report
```

## Success Metrics

- **Pass Rate**: > 90%
- **Auto-Fix Success**: > 70%
- **Cycle Time**: < 10 minutes
- **Coverage**: > 95%

## Integration

### Pre-Commit Hook
```bash
python3 scripts/rainbow-bridge-test.py critical || exit 1
```

### CI/CD
```yaml
- name: E2E Tests
  run: python3 scripts/rainbow-bridge-test.py critical
```

---

**Status**: Foundation Ready ✅
**Next**: Implement full swarm coordination
**Last Updated**: 2025-11-12
