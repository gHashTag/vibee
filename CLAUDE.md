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

## Own language first

When this project publishes something about itself, it publishes in **this
project's own language and format** -- not translated into somebody else's.

Owner's rule, 2026-09-20: stop writing in other people's languages, we have our
own.

This bites on any file whose only reason to exist is that an outside tool
expects that shape: `llms.txt`, `agents.json`, `ai.txt`, `.well-known/*.json`,
A2A agent cards, `ai-plugin` manifests, OpenAPI stubs, JSON-LD blocks, a README
that restates a spec. The reflex is to write four of them in four foreign
formats, and the reflex is wrong: a project whose claim is "here is a language
worth writing" and which then describes itself in three of other people's
formats has published three documents that are not true of it.

**The move:** find the address the outside world already fetches, then serve our
own language at it. `/llms.txt` at t27.ai **is** a t27 module -- `llms.txt`
requires nothing but text, and every prose line of a `.t27` file is a `;`
comment, so it stays readable to anything that cannot compile it.

**Three qualifications, so the rule stays honest:**

- A format a resolver genuinely parses -- a sitemap, `package.json`, a lockfile
  -- is machinery, not a description. **Generate** it from our own source; never
  hand-write it into a second home for the truth.
- Code against someone else's API uses their types. Prose for a human who has
  never heard of the project uses that human's language.
- If a format demands a claim we cannot back, **publish nothing**. An A2A card
  with no A2A server behind it is a false claim, and a missing file is more
  honest than a lying one.

The test: *is this file the project speaking about itself?* If yes, it speaks
our language. If it is plumbing, it speaks the plumbing's.

**Worked example, compiler-checked rather than asserted:** in `gHashTag/trinity`,
`apps/website/public/t27/files/specs/catalog/onboarding.t27` generates
`/llms.txt` and `/agents.t27` byte-identically, gated in CI as
`check:onboarding`. The generator evaluates the spec's own `test` blocks --
`typecheck.ok` stays true for `assert 1 > 2`, so a compiler saying "this parses"
is not a compiler saying "this is true" -- and re-compiles the rendered document
before writing it.

**The full rule lives in exactly one place: the `own-language-first` skill**
(`~/.claude/skills/own-language-first/SKILL.md`). It carries the consent gate for
documents addressed to other people's agents, the six negative controls, and the
`;`-alone-on-a-line trap that silently discards a `module` declaration. This
section is a pointer, not a copy -- the recorded defect in this codebase family
is the hand-copied rule that only two of its three homes knew about.
