import { z } from 'zod';
import { PluginConfigSchema } from './validation';

export const PLUGIN_CONFIG = {
  plugins: [
    {
      name: 'neuro-photo',
      path: './plugins/scene-neuro-photo',
      enabled: true,
      config: {
        defaultModel: 'black-forest-labs/flux-dev',
        maxImageSize: 1024,
        quality: 'high'
      }
    },
    {
      name: 'kie-ai-provider',
      path: './plugins/providers/kie-ai',
      enabled: true,
      config: {
        apiKey: '${KIE_AI_API_KEY}',
        baseUrl: 'https://api.kie.ai/v1',
        timeout: 30000
      },
      dependencies: []
    },
    {
      name: 'face-training',
      path: './plugins/scene-face-training',
      enabled: true,
      config: {
        maxImages: 10,
        modelPath: './models/face-lora',
        epochs: 100,
        batchSize: 4
      },
      dependencies: ['neuro-photo']
    },
    {
      name: 'telegram-keyboards',
      path: './plugins/commands/telegram-keyboards',
      enabled: true,
      config: {
        defaultRows: 2,
        maxRows: 8,
        persistence: true
      },
      dependencies: []
    },
    {
      name: 'start-command',
      path: './plugins/commands/start-command',
      enabled: true,
      config: {
        welcomeMessage: 'Добро пожаловать в Vibee!',
        showKeyboard: true
      },
      dependencies: ['telegram-keyboards']
    },
    {
      name: 'training-plugin',
      path: './plugins/commands/training-plugin',
      enabled: true,
      config: {
        tempDir: './temp',
        modelDir: './models',
        cleanupAfterTraining: true
      },
      dependencies: ['face-training']
    },
    {
      name: 'ai-tutor-service',
      path: './plugins/core/ai-tutor-service',
      enabled: true,
      config: {
        maxTokens: 4000,
        temperature: 0.7,
        systemPromptVersion: 'v1'
      },
      dependencies: ['kie-ai-provider']
    },
    {
      name: 'vector-database',
      path: './plugins/core/vector-database',
      enabled: true,
      config: {
        indexName: 'vibee-knowledge',
        dimension: 1536,
        metric: 'cosine'
      },
      dependencies: []
    },
    {
      name: 'news-monitor',
      path: './plugins/scenes/news-monitor',
      enabled: false,
      config: {
        checkInterval: 3600,
        sources: ['github', 'nitter'],
        keywords: ['ai', 'typescript', 'react']
      },
      dependencies: ['kie-ai-provider']
    },
    {
      name: 'conversation-learning',
      path: './plugins/scenes/conversation-learning',
      enabled: true,
      config: {
        minInteractions: 3,
        saveInterval: 100,
        maxHistorySize: 1000
      },
      dependencies: ['vector-database']
    },
    {
      name: 'content-creation',
      path: './plugins/scenes/content-creation',
      enabled: true,
      config: {
        autoPublish: false,
        maxContentPerDay: 10,
        templatePath: './templates'
      },
      dependencies: ['ai-tutor-service']
    },
    {
      name: 'agent-agent-bridge',
      path: './plugins/core/agent-agent-bridge',
      enabled: true,
      config: {
        communicationInterval: 300,
        maxRetries: 3,
        timeout: 10000
      },
      dependencies: ['ai-tutor-service']
    },
    {
      name: 'rainbow-bridge',
      path: './plugins/core/rainbow-bridge',
      enabled: true,
      config: {
        testInterval: 3600,
        criticalOnly: false,
        reportPath: './tests/reports'
      },
      dependencies: []
    },
    {
      name: 'analytics-service',
      path: './plugins/core/analytics-service',
      enabled: true,
      config: {
        collectMetrics: true,
        metricsRetentionDays: 30,
        exportFormat: 'json'
      },
      dependencies: []
    },
    {
      name: 'sales-department',
      path: './plugins/scenes/sales-department',
      enabled: false,
      config: {
        autoFollowUp: false,
        responseDelay: 3600,
        maxFollowUps: 3
      },
      dependencies: ['ai-tutor-service', 'analytics-service']
    },
    {
      name: 'content-callback-handler',
      path: './plugins/commands/content-callback-handler',
      enabled: true,
      config: {
        maxQueueSize: 100,
        processingTimeout: 30000
      },
      dependencies: ['content-creation']
    },
    {
      name: 'telegram-typing',
      path: './plugins/commands/telegram-typing',
      enabled: true,
      config: {
        typingDelay: 500,
        randomizeDelay: true
      },
      dependencies: []
    },
    {
      name: 'tts-plugin',
      path: './plugins/scenes/tts-plugin',
      enabled: true,
      config: {
        defaultVoice: 'ru-RU',
        speed: 1.0,
        provider: 'system'
      },
      dependencies: []
    },
    {
      name: 'mcp-integration',
      path: './plugins/core/mcp-integration',
      enabled: true,
      config: {
        timeout: 10000,
        maxConnections: 5,
        fallbackEnabled: true
      },
      dependencies: []
    },
    {
      name: 'vibemates-manager',
      path: './plugins/academy/vibemates-manager',
      enabled: true,
      config: {
        autoRouting: true,
        interAgentCommunication: true,
        communicationInterval: 300
      },
      dependencies: ['agent-agent-bridge', 'ai-tutor-service']
    },
    {
      name: 'template-system',
      path: './plugins/core/template-system',
      enabled: true,
      config: {
        cacheTemplates: true,
        defaultLocale: 'ru',
        templatePath: './templates'
      },
      dependencies: []
    },
    {
      name: 'image-processor',
      path: './plugins/scenes/image-processor',
      enabled: true,
      config: {
        supportedFormats: ['jpg', 'png', 'webp'],
        maxFileSize: 10485760,
        processQueue: true
      },
      dependencies: ['neuro-photo']
    },
    {
      name: 'user-preferences',
      path: './plugins/core/user-preferences',
      enabled: true,
      config: {
        defaultLanguage: 'ru',
        defaultTheme: 'light',
        saveUserChoices: true
      },
      dependencies: []
    },
    {
      name: 'performance-monitor',
      path: './plugins/core/performance-monitor',
      enabled: true,
      config: {
        logSlowQueries: true,
        thresholdMs: 1000,
        alertChannel: 'system'
      },
      dependencies: ['analytics-service']
    },
    {
      name: 'security-service',
      path: './plugins/core/security-service',
      enabled: true,
      config: {
        rateLimit: {
          windowMs: 60000,
          max: 100
        },
        validateInputs: true,
        sanitizeOutputs: true
      },
      dependencies: []
    },
    {
      name: 'health-checker',
      path: './plugins/core/health-checker',
      enabled: true,
      config: {
        checkInterval: 30,
        services: ['database', 'ai-provider', 'telegram'],
        alertOnFailure: true
      },
      dependencies: ['security-service']
    }
  ],

  settings: {
    enableDevMode: process.env.NODE_ENV === 'development',
    autoReloadPlugins: false,
    logLevel: 'info' as const,
    maxConcurrentPlugins: 10,
    pluginTimeout: 30000,
    enableMetrics: process.env.NODE_ENV === 'production',
    enableDebugLogs: process.env.DEBUG === 'true'
  },

  environment: {
    required: [
      'TELEGRAM_BOT_TOKEN',
      'OPENROUTER_API_KEY'
    ],
    optional: [
      'KIE_AI_API_KEY',
      'FAL_KEY',
      'TELEGRAM_API_ID',
      'TELEGRAM_API_HASH',
      'DATABASE_URL',
      'REDIS_URL'
    ]
  }
} as const;

export type PluginConfigType = typeof PLUGIN_CONFIG;
