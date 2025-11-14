# Plugin Architecture

> Core plugin system architecture and lifecycle in elizaOS

## Overview

The elizaOS plugin system is a comprehensive extension mechanism that allows developers to add functionality to agents through a well-defined interface. Plugins are modular extensions that enhance AI agents with new capabilities, integrations, and behaviors.

### What Can Plugins Do?

* **Platform Integrations**: Connect to Discord, Telegram, Slack, Twitter, etc.
* **LLM Providers**: Integrate different AI models (OpenAI, Anthropic, Google, etc.)
* **Blockchain/DeFi**: Execute transactions, manage wallets, interact with smart contracts
* **Data Sources**: Connect to databases, APIs, or external services
* **Custom Actions**: Define new agent behaviors and capabilities

## Plugin Interface

Every plugin must implement the core `Plugin` interface:

```typescript
interface Plugin {
  name: string;
  description: string;
  init?: (config: any, runtime: IAgentRuntime) => Promise<void>;
  actions?: Action[];
  evaluators?: Evaluator[];
  providers?: Provider[];
  services?: Service[];
  models?: Record<string, ModelHandler>;
  routes?: Route[];
  events?: Record<string, ((params: any) => Promise<any>)[]>;
  adapter?: IDatabaseAdapter;
  config?: any;
  dependencies?: string[];
  testDependencies?: string[];
  priority?: number;
}
```

## Plugin Initialization Lifecycle

### 1. Plugin Registration
When a plugin is registered with the runtime:
1. Validates plugin has a name
2. Checks for duplicate plugins
3. Adds to active plugins list
4. Calls plugin's `init()` method if present
5. Handles configuration errors gracefully

### 2. Component Registration Order
Components are registered in this specific sequence:
1. Database adapter (if provided)
2. Actions
3. Evaluators
4. Providers
5. Models
6. Routes
7. Events
8. Services (delayed if runtime not initialized)

## Core Plugins

### Bootstrap Plugin
The core message handler and event system for elizaOS agents. Provides essential functionality for message processing, knowledge management, and basic agent operations.

### SQL Plugin
Database integration and management for elizaOS. Features:
* Automatic schema migrations
* Multi-database support (PostgreSQL, PGLite)
* Sophisticated plugin architecture

## Best Practices

1. **Plugin Dependencies**: Use the `dependencies` array to specify required plugins
2. **Conditional Loading**: Check environment variables before loading platform-specific plugins
3. **Service Initialization**: Handle missing API tokens gracefully in service constructors
4. **Event Handlers**: Keep event handlers focused and delegate to specialized functions
5. **Error Handling**: Use try-catch blocks and log errors appropriately
6. **Type Safety**: Use TypeScript types from `@elizaos/core` for all plugin components
7. **Priority Management**: Set appropriate priorities for plugins that need to load early
8. **Configuration**: Use `runtime.getSetting()` for consistent configuration access

## Environment Variables

Key security variables:

**ELIZA_SERVER_AUTH_TOKEN** - API authentication token:
> "External apps must send `X-API-KEY: your-secret-token` header when calling your `/api/*` endpoints"

**Production Security Best Practices**:
1. Always set `ELIZA_SERVER_AUTH_TOKEN` in production
2. Disable UI with `ELIZA_UI_ENABLE=false` unless needed
3. Never commit `.env` file with real values
4. Use HTTPS in production

```typescript
// Conditional plugin loading
const plugins = [
  '@elizaos/plugin-bootstrap',
  ...(process.env.OPENAI_API_KEY ? ['@elizaos/plugin-openai'] : []),
  ...(process.env.TELEGRAM_BOT_TOKEN ? ['@elizaos/plugin-telegram'] : []),
];
```
