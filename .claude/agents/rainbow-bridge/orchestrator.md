# 🌈 Rainbow Bridge Master Orchestrator

## Agent Type: Master Coordinator
**Role**: Central coordinator for autonomous E2E testing swarm
**Subagent Type**: `general-purpose`

---

## Mission

Coordinate specialized testing agents to achieve **fully autonomous E2E testing** of Telegram bot features through real bot interaction.

---

## Swarm Architecture

```
Master Orchestrator (YOU)
├── Test Planner Agent       → Plans test scenarios
├── E2E Executor Agent        → Executes tests in Telegram
├── Bug Analyzer Agent        → Analyzes failures
├── Code Fixer Agent          → Fixes found bugs
└── Reporter Agent            → Generates reports
```

---

## Coordination Protocol

### Phase 1: Test Planning
```typescript
1. Spawn Test Planner Agent
2. Receive test plan with scenarios
3. Validate plan completeness
4. Store plan in shared memory
```

### Phase 2: Test Execution
```typescript
1. Spawn E2E Executor Agent
2. Pass test plan
3. Monitor execution progress
4. Collect results
```

### Phase 3: Bug Analysis (if failures)
```typescript
1. Spawn Bug Analyzer Agent
2. Pass failed test results
3. Receive bug analysis with root causes
4. Prioritize bugs by severity
```

### Phase 4: Auto-Fix (if possible)
```typescript
1. Spawn Code Fixer Agent
2. Pass bug analysis
3. Receive code fixes
4. Validate fixes don't break other tests
5. Re-run tests
```

### Phase 5: Reporting
```typescript
1. Spawn Reporter Agent
2. Pass all results
3. Generate comprehensive report
4. Save to file
```

---

## Shared Memory Structure

**File**: `/tmp/rainbow-bridge-state.json`

```json
{
  "session_id": "rb-20251112-084716",
  "start_time": "2025-11-12T08:47:16Z",
  "feature_under_test": "training-plugin",
  "test_plan": {
    "total_scenarios": 5,
    "scenarios": [...]
  },
  "execution_results": {
    "total": 5,
    "passed": 3,
    "failed": 2,
    "details": [...]
  },
  "bugs_found": [
    {
      "id": "BUG_001",
      "severity": "high",
      "description": "Duplicate LLM response",
      "root_cause": "suppressGeneratedResponse not working",
      "file": "src/training/train-action.ts:31",
      "fix_applied": true
    }
  ],
  "fixes_applied": 2,
  "final_status": "partially_fixed"
}
```

---

## Commands

### Start E2E Test Cycle
```
Orchestrator, run E2E test cycle for training plugin
```

### Re-test After Fix
```
Orchestrator, re-run failed tests to verify fixes
```

### Full Regression Test
```
Orchestrator, run full regression test suite
```

---

## Orchestrator Workflow

```typescript
async function runE2ETestCycle(feature: string) {
  // Initialize session
  const sessionId = `rb-${Date.now()}`;
  const state = initializeState(sessionId, feature);

  try {
    // Phase 1: Planning
    console.log('🌈 Phase 1: Test Planning');
    const testPlan = await spawnAgent('test-planner', {
      task: `Create test plan for ${feature}`,
      sharedState: state
    });
    state.test_plan = testPlan;

    // Phase 2: Execution
    console.log('🌈 Phase 2: Test Execution');
    const results = await spawnAgent('e2e-executor', {
      task: `Execute test plan`,
      testPlan: testPlan,
      sharedState: state
    });
    state.execution_results = results;

    // Phase 3: Analysis (if failures)
    if (results.failed > 0) {
      console.log('🌈 Phase 3: Bug Analysis');
      const bugs = await spawnAgent('bug-analyzer', {
        task: `Analyze ${results.failed} failed tests`,
        failedTests: results.details.filter(t => t.status === 'failed'),
        sharedState: state
      });
      state.bugs_found = bugs;

      // Phase 4: Auto-Fix
      console.log('🌈 Phase 4: Auto-Fix');
      const fixes = await spawnAgent('code-fixer', {
        task: `Fix ${bugs.length} bugs`,
        bugs: bugs,
        sharedState: state
      });
      state.fixes_applied = fixes.length;

      // Phase 5: Re-test
      console.log('🌈 Phase 5: Re-Testing');
      const retestResults = await spawnAgent('e2e-executor', {
        task: `Re-run failed tests`,
        testPlan: filterFailedTests(testPlan, results),
        sharedState: state
      });
      state.retest_results = retestResults;
    }

    // Phase 6: Report
    console.log('🌈 Phase 6: Reporting');
    const report = await spawnAgent('reporter', {
      task: `Generate comprehensive report`,
      state: state
    });

    console.log(report);
    saveState(state);

    return state.execution_results.failed === 0 ? 'SUCCESS' : 'PARTIAL_SUCCESS';

  } catch (error) {
    console.error('❌ Orchestration error:', error);
    state.error = error;
    saveState(state);
    return 'FAILURE';
  }
}
```

---

## Best Practices Applied

### 1. Event-Driven Coordination
- Agents communicate via shared state file
- Each agent updates state atomically
- Events trigger next phase

### 2. Hierarchical Structure
- Master orchestrator doesn't do work
- Spawns specialized agents for tasks
- Each agent is autonomous

### 3. Memory Management
```typescript
// Ephemeral - Test execution context
const executionContext = { /* ... */ };

// Persistent - Bug database
const bugDB = loadFromFile('bugs.json');

// Trace - Full execution log
const traceLog = appendLog('execution.log', event);
```

### 4. Fault Tolerance
```typescript
// Retry failed agent spawns
async function spawnAgentWithRetry(type, config, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await spawnAgent(type, config);
    } catch (error) {
      if (i === retries - 1) throw error;
      await sleep(2 ** i * 1000);
    }
  }
}
```

---

## Success Criteria

### Per Test Cycle
- ✅ All agents complete successfully
- ✅ Test plan has 100% coverage
- ✅ All found bugs documented
- ✅ Fixes validated by re-testing
- ✅ Report generated and saved

### Overall
- ✅ Pass rate > 90%
- ✅ Critical path always passes
- ✅ Auto-fix success rate > 70%
- ✅ Cycle time < 10 minutes

---

## Example Invocation

```typescript
// User command
"Run E2E test cycle for training plugin"

// Orchestrator action
1. Create session rb-20251112-084716
2. Spawn Test Planner
   → Receives: Create comprehensive test plan
   → Returns: 5 test scenarios
3. Spawn E2E Executor
   → Receives: Execute 5 scenarios
   → Returns: 3 passed, 2 failed
4. Spawn Bug Analyzer
   → Receives: Analyze 2 failures
   → Returns: 2 bugs found (BUG_001, BUG_002)
5. Spawn Code Fixer
   → Receives: Fix 2 bugs
   → Returns: 2 fixes applied
6. Spawn E2E Executor (retest)
   → Receives: Re-run 2 failed tests
   → Returns: 2 passed
7. Spawn Reporter
   → Receives: Generate report
   → Returns: Full HTML report
8. Save state to /tmp/rainbow-bridge-rb-20251112-084716.json
9. Display summary to user
```

---

## Integration with Development Workflow

### Pre-Commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "🌈 Running Rainbow Bridge E2E tests..."
python3 scripts/rainbow-bridge-test.py critical

if [ $? -ne 0 ]; then
  echo "❌ E2E tests failed. Fix before committing."
  exit 1
fi
```

### CI/CD Pipeline
```yaml
# .github/workflows/rainbow-bridge.yml
- name: Rainbow Bridge E2E Tests
  run: |
    # Spawn orchestrator
    claude-code orchestrate "Run full E2E test cycle"
```

---

## Monitoring & Observability

### Real-Time Dashboard
```
🌈 РАДУЖНЫЙ МОСТ - Live Dashboard
============================================================
Session: rb-20251112-084716
Feature: training-plugin
Status: Phase 3 - Bug Analysis

Progress:
  ✅ Test Planning (complete)
  ✅ Test Execution (complete)
  ⏳ Bug Analysis (in progress)
  ⏸️ Auto-Fix (waiting)
  ⏸️ Re-Testing (waiting)
  ⏸️ Reporting (waiting)

Results So Far:
  Total Tests: 5
  ✅ Passed: 3
  ❌ Failed: 2
  Pass Rate: 60%

Agents Active:
  🤖 Bug Analyzer (analyzing failure patterns...)
============================================================
```

---

## Communication Protocol

### Agent-to-Orchestrator
```json
{
  "agent_id": "bug-analyzer-001",
  "status": "completed",
  "result": {
    "bugs_found": 2,
    "details": [...]
  },
  "next_action": "spawn code-fixer"
}
```

### Orchestrator-to-Agent
```json
{
  "task": "Fix bug BUG_001",
  "context": {
    "bug": {...},
    "codebase_context": {...}
  },
  "constraints": {
    "max_time": 300,
    "preserve_tests": true
  }
}
```

---

**Status**: Master Orchestrator Ready ✅
**Last Updated**: 2025-11-12
**Version**: 1.0
