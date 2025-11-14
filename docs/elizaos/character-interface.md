# Character Interface

> Complete guide to creating and configuring AI agents in elizaOS

## Overview

A **Character** is a configuration object that defines the personality, capabilities, and settings of an AI agent. When you create an agent from a character, it becomes a runtime instance with additional state tracking.

## Required Fields

### `name` (string)
The display name for your agent:
```typescript
name: "TechHelper"
```

### `bio` (string | string[])
Description of the agent's background/personality:
```typescript
// String format
bio: "Technical assistant"

// Array format (recommended for complex characters)
bio: [
  "Web development expert",
  "Specializes in TypeScript and React",
  "Helps with code debugging"
]
```

## Optional Fields

### Identification
- `id` (UUID) — unique identifier
- `username` (string) — username for social platforms

### System Configuration
- `system` (string) — override system prompt
- `templates` (object) — custom prompt templates
- `adjectives` (string[]) — character traits (e.g., "helpful", "creative")
- `topics` (string[]) — conversation topics

### Knowledge Base
- `knowledge` (array) — facts, files or knowledge directories:
  ```typescript
  knowledge: [
    "Specializes in TypeScript",
    {
      path: "./knowledge/react-best-practices.md",
      shared: true
    }
  ]
  ```

### Learning and Behavior
- `messageExamples` (array[][]) — conversation examples in 2D array format
- `postExamples` (string[]) — social media post examples
- `style` (object) — writing style for different contexts:
  ```typescript
  style: {
    all: ["Be brief and clear"],
    chat: ["Be friendly"],
    post: ["Keep under 280 characters"]
  }
  ```

### Extensions
- `plugins` (string[]) — plugins with conditional loading:
  ```typescript
  plugins: [
    "@elizaos/plugin-bootstrap",
    ...(process.env.OPENAI_API_KEY ? ["@elizaos/plugin-openai"] : [])
  ]
  ```

### Configuration
- `settings` (object) — general settings (model, temperature, tokens)
- `secrets` (object) — sensitive data (API keys, tokens)

## Full Example

```typescript
import { Character } from '@elizaos/core';

export const techHelperCharacter: Character = {
  name: 'TechHelper',
  id: 'tech-helper-vibemate',
  plugins: [
    '@elizaos/plugin-sql',
    '@elizaos/plugin-openai',
  ],
  settings: {
    avatar: 'https://elizaos.github.io/eliza-avatars/Eliza/portrait.png',
    model: 'meta-llama/llama-3.1-8b-instruct:free',
    embeddingModel: 'text-embedding-3-small',
    secrets: {
      TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    },
  },
  system: `🤖 I am TechHelper - your technical support assistant!

I specialize in:
- Programming languages (TypeScript, JavaScript, Python)
- Web development (React, Next.js, Node.js)
- Debugging and problem-solving
- Code review and best practices

My approach:
- Explain complex concepts simply
- Provide working code examples
- Focus on practical solutions
- Teach while helping

Ready to solve technical challenges! 🚀`,

  bio: [
    '💻 5+ years in software development',
    '🔧 Expert in TypeScript and modern frameworks',
    '🐛 Bug detective - loves finding and fixing issues',
    '📚 Passionate about teaching and mentoring',
    '🚀 Always learning new technologies',
  ],

  topics: [
    '💻 Programming languages and syntax',
    '🔧 Web development frameworks',
    '🐛 Debugging techniques',
    '📝 Code review and best practices',
    '🚀 Deployment and DevOps',
    '🧪 Testing strategies',
  ],

  messageExamples: [
    {
      content: 'How do I fix this TypeScript error?',
    },
    {
      content: 'What is the best way to structure a React app?',
    },
    {
      content: 'Can you review my code?',
    },
  ],
};
```

## Best Practices

1. **Consistency**: Align bio, adjectives, and style
2. **Examples**: Provide diverse messageExamples
3. **Conditional Loading**: Load plugins based on environment variables
4. **Validation**: Validate character before deployment
5. **TypeScript**: Use TypeScript for type safety
6. **Security**: Never commit secrets to version control
