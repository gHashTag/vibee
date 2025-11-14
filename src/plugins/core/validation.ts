import { z } from 'zod';

// Базовая схема для конфигурации плагина
export const PluginConfigSchema = z.object({
  name: z.string().min(1),
  path: z.string().min(1),
  enabled: z.boolean(),
  config: z.unknown(),
  dependencies: z.array(z.string()).default([])
});

// Схема для общих настроек системы
export const SystemSettingsSchema = z.object({
  enableDevMode: z.boolean(),
  autoReloadPlugins: z.boolean(),
  logLevel: z.enum(['error', 'warn', 'info', 'debug']),
  maxConcurrentPlugins: z.number().int().positive(),
  pluginTimeout: z.number().int().positive(),
  enableMetrics: z.boolean(),
  enableDebugLogs: z.boolean()
});

// Схема для переменных окружения
export const EnvironmentSchema = z.object({
  required: z.array(z.string()),
  optional: z.array(z.string())
});

// Полная схема конфигурации
export const FullConfigSchema = z.object({
  plugins: z.array(PluginConfigSchema),
  settings: SystemSettingsSchema,
  environment: EnvironmentSchema
});

// Схемы для конкретных плагинов

export const NeuroPhotoSchema = z.object({
  defaultModel: z.string().min(1),
  maxImageSize: z.number().int().positive(),
  quality: z.enum(['low', 'medium', 'high'])
});

export const KieAIProviderSchema = z.object({
  apiKey: z.string().min(1),
  baseUrl: z.string().url(),
  timeout: z.number().int().positive()
});

export const FaceTrainingSchema = z.object({
  maxImages: z.number().int().positive().max(50),
  modelPath: z.string().min(1),
  epochs: z.number().int().positive().max(1000),
  batchSize: z.number().int().positive().max(64)
});

export const TelegramKeyboardsSchema = z.object({
  defaultRows: z.number().int().positive().max(10),
  maxRows: z.number().int().positive().max(10),
  persistence: z.boolean()
});

export const StartCommandSchema = z.object({
  welcomeMessage: z.string().min(1),
  showKeyboard: z.boolean()
});

export const TrainingPluginSchema = z.object({
  tempDir: z.string().min(1),
  modelDir: z.string().min(1),
  cleanupAfterTraining: z.boolean()
});

export const AITutorServiceSchema = z.object({
  maxTokens: z.number().int().positive().max(16000),
  temperature: z.number().min(0).max(2),
  systemPromptVersion: z.string().min(1)
});

export const VectorDatabaseSchema = z.object({
  indexName: z.string().min(1),
  dimension: z.number().int().positive(),
  metric: z.enum(['cosine', 'euclidean', 'dotproduct'])
});

export const NewsMonitorSchema = z.object({
  checkInterval: z.number().int().positive(),
  sources: z.array(z.string()),
  keywords: z.array(z.string())
});

export const ConversationLearningSchema = z.object({
  minInteractions: z.number().int().nonnegative(),
  saveInterval: z.number().int().positive(),
  maxHistorySize: z.number().int().positive()
});

export const ContentCreationSchema = z.object({
  autoPublish: z.boolean(),
  maxContentPerDay: z.number().int().nonnegative(),
  templatePath: z.string().min(1)
});

export const AgentAgentBridgeSchema = z.object({
  communicationInterval: z.number().int().positive(),
  maxRetries: z.number().int().nonnegative(),
  timeout: z.number().int().positive()
});

export const RainbowBridgeSchema = z.object({
  testInterval: z.number().int().positive(),
  criticalOnly: z.boolean(),
  reportPath: z.string().min(1)
});

export const AnalyticsServiceSchema = z.object({
  collectMetrics: z.boolean(),
  metricsRetentionDays: z.number().int().positive(),
  exportFormat: z.enum(['json', 'csv', 'xml'])
});

export const SalesDepartmentSchema = z.object({
  autoFollowUp: z.boolean(),
  responseDelay: z.number().int().nonnegative(),
  maxFollowUps: z.number().int().nonnegative().max(10)
});

export const ContentCallbackHandlerSchema = z.object({
  maxQueueSize: z.number().int().positive(),
  processingTimeout: z.number().int().positive()
});

export const TelegramTypingSchema = z.object({
  typingDelay: z.number().int().nonnegative(),
  randomizeDelay: z.boolean()
});

export const TTSPluginSchema = z.object({
  defaultVoice: z.string().min(1),
  speed: z.number().min(0.1).max(3),
  provider: z.string().min(1)
});

export const MCPIntegrationSchema = z.object({
  timeout: z.number().int().positive(),
  maxConnections: z.number().int().positive(),
  fallbackEnabled: z.boolean()
});

export const VibeMatesManagerSchema = z.object({
  autoRouting: z.boolean(),
  interAgentCommunication: z.boolean(),
  communicationInterval: z.number().int().positive()
});

export const TemplateSystemSchema = z.object({
  cacheTemplates: z.boolean(),
  defaultLocale: z.string().min(2),
  templatePath: z.string().min(1)
});

export const ImageProcessorSchema = z.object({
  supportedFormats: z.array(z.string()),
  maxFileSize: z.number().int().positive(),
  processQueue: z.boolean()
});

export const UserPreferencesSchema = z.object({
  defaultLanguage: z.string().min(2),
  defaultTheme: z.enum(['light', 'dark', 'auto']),
  saveUserChoices: z.boolean()
});

export const PerformanceMonitorSchema = z.object({
  logSlowQueries: z.boolean(),
  thresholdMs: z.number().int().positive(),
  alertChannel: z.string().min(1)
});

export const SecurityServiceSchema = z.object({
  rateLimit: z.object({
    windowMs: z.number().int().positive(),
    max: z.number().int().positive()
  }),
  validateInputs: z.boolean(),
  sanitizeOutputs: z.boolean()
});

export const HealthCheckerSchema = z.object({
  checkInterval: z.number().int().positive(),
  services: z.array(z.string()),
  alertOnFailure: z.boolean()
});

// Тип для результатов валидации
export type ValidationResult = {
  pluginName: string;
  valid: boolean;
  errors?: string[];
  warnings?: string[];
};

// Карта схем валидации для плагинов
export const PluginValidationSchemas: Record<string, z.ZodSchema<any>> = {
  'neuro-photo': NeuroPhotoSchema,
  'kie-ai-provider': KieAIProviderSchema,
  'face-training': FaceTrainingSchema,
  'telegram-keyboards': TelegramKeyboardsSchema,
  'start-command': StartCommandSchema,
  'training-plugin': TrainingPluginSchema,
  'ai-tutor-service': AITutorServiceSchema,
  'vector-database': VectorDatabaseSchema,
  'news-monitor': NewsMonitorSchema,
  'conversation-learning': ConversationLearningSchema,
  'content-creation': ContentCreationSchema,
  'agent-agent-bridge': AgentAgentBridgeSchema,
  'rainbow-bridge': RainbowBridgeSchema,
  'analytics-service': AnalyticsServiceSchema,
  'sales-department': SalesDepartmentSchema,
  'content-callback-handler': ContentCallbackHandlerSchema,
  'telegram-typing': TelegramTypingSchema,
  'tts-plugin': TTSPluginSchema,
  'mcp-integration': MCPIntegrationSchema,
  'vibemates-manager': VibeMatesManagerSchema,
  'template-system': TemplateSystemSchema,
  'image-processor': ImageProcessorSchema,
  'user-preferences': UserPreferencesSchema,
  'performance-monitor': PerformanceMonitorSchema,
  'security-service': SecurityServiceSchema,
  'health-checker': HealthCheckerSchema
};
