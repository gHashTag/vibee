---
# 📝 SPECIFICATION WRITER - Requirements Engineering & Test Scenarios
**"Clear specs = Clear code = Clear tests"**
---

## 🎯 Назначение

**Specification Writer** - это система создания чётких, тестируемых спецификаций:
- 📋 **Requirements** → Чёткие требования к функционалу
- ✅ **Acceptance Criteria** → Критерии приёмки
- 🎯 **Test Scenarios** → Сценарии тестирования
- 📊 **Edge Cases** → Граничные случаи
- 🔄 **Given-When-Then** → BDD-style спецификации

**Философия**: Хорошая спецификация = половина работы сделана.

---

## 📐 Specification Template

### Complete Spec Structure

```markdown
# Feature: [Feature Name]

## 🎯 Overview
Brief description of what this feature does and why it's needed.

## 👥 User Story
As a [user type]
I want to [action]
So that [benefit]

## ✅ Acceptance Criteria
- ✅ Criterion 1: Specific, measurable requirement
- ✅ Criterion 2: Another clear requirement
- ✅ Criterion 3: Edge case handling
- ✅ Criterion 4: Error handling

## 🎬 Test Scenarios

### Scenario 1: Happy Path
**Given** [initial context]
**When** [action occurs]
**Then** [expected outcome]

**Example**:
Given user types "/profile"
When command is processed
Then system shows user profile with stats

### Scenario 2: Edge Case
**Given** [edge case context]
**When** [action occurs]
**Then** [expected handling]

**Example**:
Given new user with no data
When user types "/profile"
Then system shows welcome message and empty stats

### Scenario 3: Error Case
**Given** [error condition]
**When** [action occurs]
**Then** [error handling]

**Example**:
Given database is unavailable
When user types "/profile"
Then system shows friendly error message

## 🎨 UI/UX Requirements
- Visual elements needed
- Interaction patterns
- Button labels
- Error messages

## 🔧 Technical Requirements
- ElizaOS Action structure
- Required services/providers
- Database schema changes
- API integrations

## 📊 Success Metrics
- How to measure success
- Performance requirements
- User satisfaction criteria

## ⚠️ Edge Cases & Assumptions
- List all edge cases
- State assumptions
- Known limitations

## 🔗 Dependencies
- Required plugins
- External services
- Other features

## 📅 Implementation Plan
1. Phase 1: [Basic implementation]
2. Phase 2: [Enhanced features]
3. Phase 3: [Optimization]
```

---

## 🎯 Specification Types

### 1. Feature Specification

```markdown
# Feature: User Analytics Dashboard

## Overview
Provide users with comprehensive analytics about their bot usage,
including messages sent, commands used, and activity patterns.

## User Story
As a Vibee user
I want to see my usage statistics
So that I can track my learning progress and engagement

## Acceptance Criteria
- ✅ Command /analytics triggers the dashboard
- ✅ Shows: total messages, unique commands, active days
- ✅ Displays activity chart (text-based)
- ✅ Provides "Export CSV" button
- ✅ Handles users with no data gracefully
- ✅ Response time < 500ms
- ✅ Works on mobile and desktop Telegram

## Test Scenarios

### Scenario 1: Active User Views Analytics
**Given** user has 50+ messages over 10 days
**When** user types "/analytics"
**Then** system displays:
  - Total messages: 50
  - Unique commands: 8
  - Active days: 10
  - Activity chart
  - Export button

### Scenario 2: New User Views Analytics
**Given** user just joined (0 messages)
**When** user types "/analytics"
**Then** system displays:
  - Welcome message
  - Empty stats (all zeros)
  - Encouragement message
  - No export button

### Scenario 3: Export Analytics
**Given** user has analytics data
**When** user clicks "Export CSV"
**Then** system:
  - Generates CSV file
  - Sends as document
  - Includes all stats
  - Filename: analytics_[date].csv

## UI Requirements
```typescript
// Expected UI structure
{
  text: `📊 Ваша аналитика:
💬 Сообщений: 50
⚡️ Команд: 8
📅 Активных дней: 10

Активность:
▓▓▓▓▓░░░░░ (70%)`,
  uiElements: [
    {
      type: 'inline_callback',
      text: '📥 Export CSV',
      callback_data: 'export_analytics'
    },
    {
      type: 'inline_callback',
      text: '🔄 Refresh',
      callback_data: 'refresh_analytics'
    }
  ]
}
```

## Technical Requirements
- ElizaOS Action: `TELEGRAM_ANALYTICS_COMMAND`
- Service: `AnalyticsService` (new)
- Database queries:
  - `getUserMessageCount(userId)`
  - `getUserCommandCount(userId)`
  - `getUserActiveDays(userId)`
- CSV generation utility
- Telegram file upload capability

## Performance Requirements
- Query time: <200ms
- Response generation: <100ms
- Total response time: <500ms
- CSV generation: <1s for 1000+ records

## Edge Cases
1. User with 0 messages → Show encouraging welcome
2. User with 10,000+ messages → Paginate or summarize
3. Database unavailable → Show cached data or error
4. Export fails → Show retry option
5. Command spammed → Rate limit (1 req/10s)

## Dependencies
- @elizaos/plugin-sql for database
- CSV generation library
- Telegram Bot API for file uploads

## Implementation Phases
1. **Phase 1** (MVP):
   - Basic stats display
   - Simple text output
2. **Phase 2** (Enhanced):
   - Activity chart
   - Export functionality
3. **Phase 3** (Optimized):
   - Caching
   - Performance optimization
```

---

### 2. Bug Fix Specification

```markdown
# Bug Fix: Generative UI Not Working for Long Messages

## Problem Description
When user sends message >500 chars, UI generation fails silently
and no buttons are displayed.

## Current Behavior
**Given** user sends message with 600 characters
**When** system tries to generate UI
**Then** no UI elements are returned (empty array)

## Expected Behavior
**Given** user sends message with 600 characters
**When** system tries to generate UI
**Then** UI elements are generated based on content keywords

## Root Cause Analysis
- TelegramUIGenerator.generateUI() has hardcoded limit of 500 chars
- Long messages are truncated before keyword matching
- Keywords in the truncated part are not detected

## Fix Requirements
- ✅ Remove or increase character limit
- ✅ Process full message for keyword detection
- ✅ Add test for messages >500 chars
- ✅ Add test for messages >1000 chars
- ✅ Handle Telegram's 4096 char limit

## Test Scenarios

### Scenario 1: Long Message with Keywords
**Given** message is 800 characters with "обуч" keyword at position 700
**When** UI generation runs
**Then** learning buttons are displayed

### Scenario 2: Very Long Message
**Given** message is 5000 characters (exceeds Telegram limit)
**When** UI generation runs
**Then** system processes first 4096 chars and generates UI

## Implementation
```typescript
// Before (buggy)
static generateUI(text: string, context: string): UIElement[] {
  const shortText = text.substring(0, 500); // BUG!
  if (shortText.includes('обуч')) { ... }
}

// After (fixed)
static generateUI(text: string, context: string): UIElement[] {
  // Process full text for keyword detection
  const fullText = text.substring(0, 4096); // Telegram limit
  if (fullText.includes('обуч')) { ... }
}
```

## Tests Added
```typescript
test('should generate UI for long message with keywords', () => {
  const longText = 'x'.repeat(700) + ' Хочу обучиться';
  const result = TelegramUIGenerator.generateUI(longText, 'learning');
  expect(result.length).toBeGreaterThan(0);
});

test('should handle Telegram message limit', () => {
  const veryLongText = 'x'.repeat(5000);
  expect(() => TelegramUIGenerator.generateUI(veryLongText, '')).not.toThrow();
});
```

## Success Criteria
- ✅ All existing tests pass
- ✅ New tests for long messages pass
- ✅ UI generation works for messages up to 4096 chars
- ✅ No performance degradation
```

---

### 3. Refactoring Specification

```markdown
# Refactoring: Extract Command Config to Separate File

## Motivation
telegram-commands-plugin.ts has 500+ lines with hardcoded strings,
making it hard to maintain and extend.

## Goals
- ✅ Reduce file size by 40%
- ✅ Separate concerns (logic vs. content)
- ✅ Make content editable without code changes
- ✅ Prepare for i18n (future internationalization)

## Current Structure
```typescript
// All in one file (500 lines)
const startCommandAction: Action = {
  handler: async (runtime, message, state, options, callback) => {
    await callback({
      text: `👋 Привет!
      Я **Vibee** - твой AI-наставник...`, // Hardcoded!
      uiElements: [...] // Hardcoded!
    });
  }
};
```

## Target Structure
```typescript
// telegram-commands-plugin.ts (200 lines)
import { COMMANDS_CONFIG } from './telegram-commands-config';

const startCommandAction: Action = {
  handler: async (runtime, message, state, options, callback) => {
    const config = COMMANDS_CONFIG.start;
    await callback({
      text: config.text,
      uiElements: config.uiElements
    });
  }
};

// telegram-commands-config.ts (300 lines)
export const COMMANDS_CONFIG = {
  start: {
    text: `👋 Привет!
    Я **Vibee** - твой AI-наставник...`,
    uiElements: [...]
  },
  menu: { ... },
  help: { ... }
};
```

## Refactoring Steps
1. Create telegram-commands-config.ts
2. Extract all text content → config
3. Extract all UI elements → config
4. Update commands to use config
5. Add type safety with TypeScript
6. Write tests for config structure

## Tests Required
```typescript
test('config should have all required commands', () => {
  expect(COMMANDS_CONFIG.start).toBeDefined();
  expect(COMMANDS_CONFIG.menu).toBeDefined();
  expect(COMMANDS_CONFIG.help).toBeDefined();
});

test('each config should have text and uiElements', () => {
  for (const [key, config] of Object.entries(COMMANDS_CONFIG)) {
    expect(config.text).toBeDefined();
    expect(config.uiElements).toBeArray();
  }
});

test('commands should work with extracted config', async () => {
  // Test that refactored command still works
  const mockCallback = mock();
  await startCommandAction.handler(runtime, message, {}, {}, mockCallback);
  expect(mockCallback).toHaveBeenCalledWith({
    text: expect.stringContaining('Привет'),
    uiElements: expect.any(Array)
  });
});
```

## Success Criteria
- ✅ File size reduced from 500 to <300 lines
- ✅ All content in separate config file
- ✅ All existing tests pass
- ✅ No behavioral changes
- ✅ TypeScript types for config
- ✅ Easier to modify content
```

---

## 🎯 BDD-Style Specifications

### Given-When-Then Format

```gherkin
Feature: User Profile Command

  Scenario: User views their profile
    Given the user has sent 42 messages
    And the user has been active for 7 days
    When the user types "/profile"
    Then the system displays the user's statistics
    And shows total messages as "42"
    And shows active days as "7"
    And provides an "Edit Profile" button

  Scenario: New user views profile
    Given the user just joined
    And has not sent any messages
    When the user types "/profile"
    Then the system displays a welcome message
    And shows total messages as "0"
    And shows active days as "0"
    And encourages the user to start chatting

  Scenario: User edits profile
    Given the user is viewing their profile
    When the user clicks "Edit Profile"
    Then the system shows profile edit form
    And allows editing name and preferences
    And provides "Save" and "Cancel" buttons
```

---

## 🔍 Specification Quality Checklist

### Good Specification Has:

✅ **Clear**: Unambiguous, easy to understand
✅ **Testable**: Can be verified with tests
✅ **Complete**: Covers all scenarios (happy, edge, error)
✅ **Consistent**: No contradictions
✅ **Feasible**: Technically possible to implement
✅ **Necessary**: Adds real value

### Bad Specification Smells:

❌ **Vague**: "Should work well", "Be user-friendly"
❌ **Untestable**: "Should be fast" (how fast?)
❌ **Incomplete**: Missing edge cases
❌ **Contradictory**: Conflicting requirements
❌ **Over-specified**: Implementation details instead of requirements

---

## 🧪 From Spec to Tests

### Automatic Test Generation

```yaml
Input: Specification document

Process:
  1. Parse acceptance criteria
  2. Extract test scenarios
  3. Convert Given-When-Then to test code
  4. Generate test file structure

Output: Ready-to-run test file
```

### Example Transformation

**Specification**:
```markdown
## Acceptance Criteria
- ✅ Command /help shows available commands
- ✅ Lists at least 5 commands
- ✅ Each command has description

## Scenario: User Requests Help
Given user types "/help"
When command is processed
Then system shows list of commands
And each command has description
```

**Generated Test**:
```typescript
import { describe, test, expect } from 'bun:test';

describe('/help command', () => {
  test('should show available commands', async () => {
    // Given user types "/help"
    const message = { content: { text: '/help' } };
    const mockCallback = mock();

    // When command is processed
    await helpCommandAction.handler(runtime, message, {}, {}, mockCallback);

    // Then system shows list of commands
    expect(mockCallback).toHaveBeenCalled();
    const response = mockCallback.mock.calls[0][0];

    // And lists at least 5 commands
    expect(response.text).toBeDefined();
    const commandCount = (response.text.match(/\//g) || []).length;
    expect(commandCount).toBeGreaterThanOrEqual(5);

    // And each command has description
    expect(response.text).toMatch(/\/\w+\s+-\s+.+/);
  });
});
```

---

## 🎯 Specification Templates

### Template 1: New Feature

```markdown
# Feature: [Name]

## User Story
As a [user]
I want to [action]
So that [benefit]

## Acceptance Criteria
- ✅ [criterion 1]
- ✅ [criterion 2]
- ✅ [criterion 3]

## Scenarios
### Happy Path
Given [context]
When [action]
Then [outcome]

### Edge Case
Given [context]
When [action]
Then [outcome]

## Technical Details
- Action: [name]
- Services: [list]
- Database: [changes]
```

### Template 2: Bug Fix

```markdown
# Bug: [Description]

## Current Behavior
[What happens now]

## Expected Behavior
[What should happen]

## Root Cause
[Why it happens]

## Fix Plan
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Tests
- Test for [scenario 1]
- Test for [scenario 2]
```

### Template 3: Refactoring

```markdown
# Refactoring: [What]

## Motivation
[Why refactor]

## Current State
[How it is now]

## Target State
[How it should be]

## Benefits
- [Benefit 1]
- [Benefit 2]

## Steps
1. [Step 1]
2. [Step 2]

## Safety
- All tests pass
- No behavior changes
```

---

## 🚀 Using Specification Writer

### Quick Commands

```bash
# Generate spec for new feature
Use: specification-writer
Task: "Write spec for /settings command"

# Generate spec from user request
Use: specification-writer
Task: "User wants to export chat history. Write spec."

# Expand existing spec with test scenarios
Use: specification-writer
Task: "Add edge cases to /profile spec"

# Convert spec to tests
Use: specification-writer
Task: "Generate tests from /analytics spec"
```

### Integration with TDD Cycle

```yaml
TDD Workflow:
  1. specification-writer: Create detailed spec
  2. tdd-cycle-engine: Generate RED tests from spec
  3. Developer: Implement GREEN code
  4. tdd-cycle-engine: Suggest REFACTORING
  5. specification-writer: Update spec with learnings
```

---

## 📊 Specification Metrics

### Quality Metrics

```yaml
Completeness:
  - Acceptance criteria: 5-10 per feature
  - Test scenarios: 3-7 per feature
  - Edge cases: 2-5 per feature

Clarity:
  - Unambiguous language
  - Specific examples
  - Measurable criteria

Coverage:
  - Happy path: 100% specified
  - Edge cases: 80%+ specified
  - Error cases: 80%+ specified
```

### Usage Metrics

```yaml
Efficiency:
  - Spec writing time: 15-30 min per feature
  - Spec to test conversion: 5-10 min
  - Spec clarity score: >90%

Value:
  - Reduced ambiguity: 70%+
  - Faster implementation: 30%+
  - Fewer bugs: 50%+
```

---

## 🎓 Best Practices

### 1. Start with User Story

```markdown
✅ GOOD:
As a developer learning vibe-coding
I want to see code examples for each concept
So that I can learn by practicing

❌ BAD:
Add examples feature
```

### 2. Write Measurable Criteria

```markdown
✅ GOOD:
- Response time < 500ms
- At least 5 commands listed
- Error rate < 1%

❌ BAD:
- Fast response
- Many commands
- Few errors
```

### 3. Include Examples

```markdown
✅ GOOD:
Example input: "/profile"
Example output: "👤 Ваш профиль:\n📊 Сообщений: 42"

❌ BAD:
Shows user profile
```

### 4. Cover Edge Cases

```markdown
✅ GOOD:
Scenarios:
- User with data
- User with no data
- User with incomplete data
- System error
- Network timeout

❌ BAD:
User views profile
```

---

## 🔗 Integration

### With TDD Cycle Engine

```yaml
specification-writer → tdd-cycle-engine:
  - Provides clear requirements
  - Generates test scenarios
  - Defines acceptance criteria
  - Enables automatic test generation
```

### With Pattern Learner

```yaml
specification-writer → pattern-learner:
  - Successful specs become spec patterns
  - Reusable spec templates
  - Common scenario patterns
  - Domain-specific vocabularies
```

### With Master Orchestrator

```yaml
master-orchestrator:
  → specification-writer: Create spec
  → tdd-cycle-engine: Generate tests
  → code-self-writer: Implement code
  → specification-writer: Update spec with learnings
```

---

## 🎯 Success Criteria

Specification Writer is successful when:

✅ **Clear Specs**: No ambiguity, easy to understand
✅ **Complete Coverage**: All scenarios documented
✅ **Fast Conversion**: Spec → Tests in <10 min
✅ **Fewer Bugs**: 50%+ reduction due to clear specs
✅ **Developer Joy**: Specs help, not hinder

---

**Created**: 2025-01-12
**Status**: 🟢 Active
**Integration**: TDD Cycle Engine, Master Orchestrator, Pattern Learner

**Clear specs → Clear tests → Clear code. 📝✨**
