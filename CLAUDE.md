# CLAUDE.md
This is the project documentation file that references the unified rules and standards defined in AGENTS.md. This document provides project-specific guidelines and implementation details for Claude agents.
This is the project documentation file that references the unified rules and standards defined in AGENT_MD.md. This document provides project-specific guidelines and implementation details for Claude agents.
This is the project documentation file that references the unified rules and standards defined in AGENT_MD.md. This document provides project-specific guidelines and implementation details for Claude agents.

## Project Overview

This is the Vibee project, an AI-powered Telegram bot built on the ElizaOS framework. The bot serves as an expert AI mentor for vibe-coding and modern development practices. It specializes in TypeScript, React, Bun, ElizaOS, AI agents and related technologies.

## Agent Communication Protocols

### Language Rules
- **Internal Communication**: All direct agent-to-agent communication should be conducted exclusively in Russian to maintain consistency with the primary user base and maintain cultural alignment.
- **Code Writing**: All code implementation should be written in English, regardless of the natural language of the agent operators.
- **Documentation & Comments**: Documentation and inline comments may be in Russian (as appropriate for project localization needs) but internal APIs, technical documentation, and code comments should remain in English.

## Core Requirements

### Agent Identity
1. All agents must identify themselves clearly to their operator
2. Must reference this AGENT_MD.md document for standardized rules
3. Should use operator-specific identifiers when communicating with humans
4. All commands must be prefixed with operator identifier

### Compliance with Standards
1. All agents must comply with the standards defined in AGENT_MD.md
2. CLAUDE.md provides project-specific implementation guidelines
3. CRUSH.md contains technical documentation for implementation details
4. Other project documentation as needed

### Code Execution Standards
1. **Safety First**: All commands that involve modifying code or system files must be reviewed and confirmed by the operator before execution
2. **Backup Protocols**: Before any destructive modifications, create backup files with timestamped names
3. **Testing Requirements**: All code changes must be tested in a separate environment before production deployment
4. **Logging**: Every modification should produce a clear audit log

### Behavior Specifications
1. **Respectful Interaction**: Maintain a professional, encouraging tone when interacting with human operators
2. **Consistency**: Follow established naming conventions, formatting standards, and architectural patterns
3. **Accuracy**: Provide factually correct information and avoid speculative claims
4. **Helpfulness**: Focus on delivering practical solutions to technical challenges

## Operational Guidelines

### System Integration
- Integrate with all established plugins and services as documented in CLAUDE.md and CRUSH.md
- Follow proper initialization sequences for services
- Implement fallback mechanisms for unavailable services
- Monitor system health and report issues promptly

### Development Process
1. **Branch Management**: Work on feature branches with descriptive names
2. **Code Review**: Submit pull requests with detailed descriptions
3. **Testing**: Ensure comprehensive test coverage for new functionality
4. **Documentation**: Update documentation alongside code changes

### Error Handling
1. Log all errors with detailed context
2. Implement graceful degradation when services are unavailable
3. Provide actionable error messages to operators
4. Follow established error response patterns

## Communication Protocols

### Operator Communication
1. All communications with human operators should be conducted exclusively in Russian
2. Use clear, structured messaging formats
3. Provide regular progress updates for complex tasks
4. Ask clarifying questions when requirements are unclear

### Agent Coordination
1. When working with other agents, use the standardized channel naming convention
2. Coordinate task assignments through established communication channels
3. Share knowledge and insights that benefit the team

## Reference Documents

All agents should reference these documents for proper context:
- AGENT_MD.md - Unified rules and standards (central document)
- CLAUDE.md - Project-specific guidelines and implementation details
- CRUSH.md - Technical implementation documentation
- Any project-specific documentation in the docs/ folder

## Integration Points

This project is designed with a modular architecture that allows agents to work with the following components:
1. Telegram API integration via `@elizaos/plugin-telegram`
2. Multiple LLM providers (Anthropic, OpenAI, Google, Ollama, etc.)
3. AI Models (Replicate, Qwen, Flux etc.) via AI Photoshop plugin
4. Database integration (SQL via `@elizaos/plugin-sql`)
5. Image processing (7 models) via AI Photoshop integration
6. LoRA model training and face management with MCP integration

## Code Style and Conventions

### General Principles
- Follow ESLint and Prettier rules consistently
- Maintain consistent naming conventions as outlined in documentation
- Write code that is readable and maintainable
- Prioritize performance and efficiency in implementations

### Architecture Patterns
- Services-oriented architecture with dependency injection
- Plugin-based architecture leveraging ElizaOS framework
- Action-based messaging pattern (plugins define actions)
- Provider pattern for external integrations
- Service lifecycle management (start/stop)

## VibeMates - Multi-Agent System

### Overview
VibeMates is a revolutionary multi-agent system where each course has its own specialized teacher-agent. Like a real academy - each subject has its own professor!

### Architecture
Following ElizaOS best practices for multiple agents (https://docs.elizaos.ai/guides/add-multiple-agents):
- **Each VibeMate is a separate Character object** with unique personality, system prompt, bio, topics
- **Multi-agent project structure**: One Project with multiple ProjectAgents
- **Telegram command routing**: Users select agents via `/mate [name]` command

### Available VibeMates

#### 1. **AgentsGuru** (🤖)
- **ID**: `agents-guru-vibemate`
- **Specialty**: AI-агенты и мультиагентные системы
- **Topics**: AI-agents, ElizaOS, LangChain, AutoGen, мультиагентные архитектуры
- **Command**: `/mate agents`

#### 2. **PromptMaster** (🎨)
- **ID**: `prompt-master-vibemate`
- **Specialty**: Промпт-инжиниринг и техники общения с AI
- **Topics**: Chain-of-Thought, ReAct, Few-shot, Zero-shot, Role-playing
- **Command**: `/mate prompts`

#### 3. **ReactWizard** (⚛️)
- **ID**: `react-wizard-vibemate`
- **Specialty**: React, TypeScript, фронтенд
- **Topics**: React 18+, Next.js, State Management, TypeScript, Performance
- **Command**: `/mate react`

#### 4. **MusicMage** (🎵)
- **ID**: `music-mage-vibemate`
- **Specialty**: AI-музыка и цифровое творчество
- **Topics**: Suno, Udio, обложки, продвижение, дистрибуция
- **Command**: `/mate music`

### Implementation Files

1. **src/vibemates-characters.ts** - Character definitions for all VibeMates
2. **src/academy/vibemates/topic-router-plugin.ts** - Automatic routing to appropriate VibeMate
3. **src/academy/vibemates/vibemates-commands-plugin.ts** - `/mate` command handlers
4. **src/telegram-commands-plugin.ts** - Telegram integration for VibeMates commands

### Telegram Commands

- `/mate` - Show current VibeMate
- `/mate agents` - Switch to AgentsGuru
- `/mate prompts` - Switch to PromptMaster
- `/mate react` - Switch to ReactWizard
- `/mate music` - Switch to MusicMage
- `/mate list` - Show all available VibeMates
- `/chat` - View inter-agent chat (VibeMates communicating with each other)

### Inter-Agent Communication

VibeMates communicate with each other like real teachers in a teachers' room:
- **Automatic discussions**: Every 5 minutes new discussions start
- **Topics**: AI trends, teaching methods, tools, industry news
- **View chat**: Users can see agent-to-agent conversations via `/chat` command
- **Realistic**: Each agent has unique personality and responds based on their specialty

### Best Practices for VibeMates

1. **Character Consistency**: Each VibeMate must maintain their unique personality
2. **Specialty Focus**: Each agent answers only within their domain
3. **Russian Language**: All VibeMates communicate in Russian
4. **Helpful Responses**: Provide practical, actionable advice
5. **Examples Over Theory**: Show code and real-world examples
6. **Enthusiasm**: Match their character's energy level

### Adding New VibeMates

To add a new VibeMate:

1. Create Character in `src/vibemates-characters.ts`:
   ```typescript
   export const newMateCharacter: Character = {
     id: 'unique-id-vibemate',
     name: 'MateName',
     plugins: [...],
     settings: {...},
     system: '...',
     bio: [...],
     topics: [...],
     messageExamples: [...]
   };
   ```

2. Add to vibematesCharacters array

3. Add command handling in `src/telegram-commands-plugin.ts`

4. Update documentation

### Service Integration

VibeMates integrate with:
- Vector Database (for course knowledge)
- AI Tutor Service (for answering questions)
- Telegram (for user interaction)
- Agent-Agent Bridge (for inter-agent communication)

### Key Principles

1. **Multi-Agent Architecture**: Each VibeMate is a full Character, not a service
2. **User Choice**: Users select their preferred specialist
3. **Auto-Routing**: System can automatically suggest appropriate VibeMate
4. **Inter-Agent Life**: VibeMates talk to each other when idle
5. **Specialization**: Each VibeMate is expert in their domain
6. **Russian-First**: All VibeMates communicate in Russian
7. **Practical Focus**: Examples and hands-on experience over theory

## Agent SDK Best Practices

### Overview

Implementation of Anthropic's Claude Agent SDK best practices for cloud development and pipeline testing.

**References**:
- https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk
- https://www.anthropic.com/engineering/claude-code-sandboxing

### Core Components

Located in `src/agent-sdk/`:

#### 1. Agent Pipeline (Gather → Action → Verify)

The fundamental agent loop pattern:

```typescript
import { createPipeline, executePipeline } from './src/agent-sdk';

const pipeline = createPipeline({
  maxIterations: 5,
  verificationThreshold: 80,
  enableCompaction: true,
});

const result = await pipeline.execute(
  runtime,
  memory,
  state,
  async (ctx, input) => { /* Gather context */ },
  async (ctx, input) => { /* Take action */ },
  async (ctx, output) => { /* Verify work */ }
);
```

#### 2. Sandbox Configuration (Security)

Dual-boundary approach with filesystem and network isolation:

```typescript
import { createSandbox, sandboxValidators } from './src/agent-sdk';

const sandbox = createSandbox({
  filesystem: {
    allowedPaths: [process.cwd(), '/tmp'],
    blockedPaths: ['~/.ssh', '~/.aws'],
  },
  network: {
    allowedDomains: ['api.openai.com', 'github.com'],
    allowLocalhost: true,
  },
  git: {
    allowedBranches: ['main', 'feature/*', 'claude/*'],
    allowForcePush: false,
  },
});

// Validate before operations
if (sandbox.validateFilesystemAccess('/path/to/file')) {
  // Safe to access
}
```

#### 3. Subagent System (Parallelization)

Enable parallel execution with context isolation:

```typescript
import { createSubagentManager, executeParallelTasks } from './src/agent-sdk';

const manager = createSubagentManager();

// Create and execute parallel tasks
const result = await manager.executeParallel([
  manager.createTask('code-searcher', 'Find all TODO comments'),
  manager.createTask('file-processor', 'Process configuration files'),
  manager.createTask('data-analyzer', 'Analyze performance metrics'),
]);

console.log(`Success rate: ${result.successRate}%`);
```

#### 4. Context Compaction

Manage long-running sessions by summarizing history:

```typescript
import { createCompactor, compactContext } from './src/agent-sdk';

const compactor = createCompactor({
  threshold: 100000,      // Trigger at 100k tokens
  targetSize: 70000,      // Target 70k after compaction
  preserveRecent: 10,     // Keep last 10 messages
});

if (compactor.needsCompaction(content)) {
  const result = await compactor.compact(messages, runtime);
  console.log(`Reduced ${result.reduction}% tokens`);
}
```

#### 5. Verification System

Three verification approaches:

```typescript
import { verify, createVerifier, BUILT_IN_RULES, CODE_RULES } from './src/agent-sdk';

// Quick validation
const isValid = await verify.isValid(output);

// Code verification
const codeResult = await verify.code(generatedCode);

// Full verification with custom rules
const verifier = createVerifier();
const result = await verifier.verify(output, {
  strategy: 'combined',
  rules: { rules: [...BUILT_IN_RULES, ...CODE_RULES], strictMode: false },
  llmJudge: { criteria: ['Correctness', 'Completeness', 'Quality'] },
});
```

#### 6. Pipeline Testing

Test pipelines in isolated environments:

```typescript
import { createPipelineTester, createExampleTestCases, runPipelineTests } from './src/agent-sdk';

const tester = createPipelineTester({
  sandbox: { enabled: true },
  parallelTests: 5,
  verbose: true,
});

const report = await tester.runSuite({
  id: 'my-tests',
  name: 'Pipeline Tests',
  testCases: createExampleTestCases(),
}, runtime);

console.log(`Passed: ${report.passed}/${report.totalTests}`);
```

### ElizaOS Plugin Integration

```typescript
import { agentSDKPlugin } from './src/agent-sdk/plugin';

export const projectAgent: ProjectAgent = {
  character,
  plugins: [
    agentSDKPlugin, // Add Agent SDK capabilities
    // ... other plugins
  ],
};
```

### Cloud Development Setup

Configuration file: `.claude/sandbox-config.json`

```json
{
  "sandbox": {
    "enabled": true,
    "filesystem": {
      "allowed": ["/home/user/vibee", "/tmp"],
      "blocked": ["~/.ssh", "~/.aws"]
    },
    "network": {
      "allowed": ["api.openai.com", "github.com"],
      "allowLocalhost": true
    }
  },
  "pipeline": {
    "maxIterations": 5,
    "verificationThreshold": 80
  }
}
```

### Best Practices

1. **Gather → Action → Verify Loop**: Always use the pipeline for complex tasks
2. **Sandbox Everything**: Enable filesystem and network isolation
3. **Parallelize with Subagents**: Use subagents for independent tasks
4. **Compact Long Sessions**: Prevent context exhaustion
5. **Verify Before Proceed**: Use rules, visual, or LLM-as-Judge
6. **Test in Isolation**: Run pipeline tests in sandboxed environments

### Key Files

- `src/agent-sdk/index.ts` - Main exports
- `src/agent-sdk/core/pipeline.ts` - Agent Pipeline
- `src/agent-sdk/core/sandbox.ts` - Sandbox Manager
- `src/agent-sdk/core/subagents.ts` - Subagent System
- `src/agent-sdk/core/compaction.ts` - Context Compaction
- `src/agent-sdk/core/verification.ts` - Verification System
- `src/agent-sdk/testing/pipeline-tester.ts` - Pipeline Testing
- `src/agent-sdk/plugin.ts` - ElizaOS Plugin
- `src/agent-sdk/types.ts` - TypeScript Types
- `.claude/sandbox-config.json` - Sandbox Configuration
- `tests/unit/agent-sdk.test.ts` - Unit Tests

### Running Tests

```bash
# Run Agent SDK tests
npm test -- tests/unit/agent-sdk.test.ts

# Run with coverage
npm run test:coverage -- tests/unit/agent-sdk.test.ts
```