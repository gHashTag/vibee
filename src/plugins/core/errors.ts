/**
 * Error types for plugin system
 */

export class PluginError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'PluginError';
  }
}

export class ValidationError extends PluginError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class ProviderError extends PluginError {
  constructor(message: string, providerName: string, details?: any) {
    super(message, `PROVIDER_ERROR_${providerName.toUpperCase()}`, details);
    this.name = 'ProviderError';
  }
}

export class SceneError extends PluginError {
  constructor(message: string, sceneName: string, details?: any) {
    super(message, `SCENE_ERROR_${sceneName.toUpperCase()}`, details);
    this.name = 'SceneError';
  }
}

export class CommandError extends PluginError {
  constructor(message: string, commandName: string, details?: any) {
    super(message, `COMMAND_ERROR_${commandName.toUpperCase()}`, details);
    this.name = 'CommandError';
  }
}

export class ConfigurationError extends PluginError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIGURATION_ERROR', details);
    this.name = 'ConfigurationError';
  }
}

export class HealthCheckError extends PluginError {
  constructor(message: string, serviceName: string, details?: any) {
    super(message, `HEALTH_CHECK_ERROR_${serviceName.toUpperCase()}`, details);
    this.name = 'HealthCheckError';
  }
}
