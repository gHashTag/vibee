import { Plugin, Action, Handler } from '@elizaos/core';
import { configManager } from '../core';
import type { ValidationResult } from '../core';

export class ExamplePlugin implements Plugin {
  name = 'example-plugin';
  description = 'Пример плагина, использующего систему конфигурации';
  version = '1.0.0';

  private config: any;
  private enabledPlugins: string[] = [];

  async initialize(): Promise<void> {
    console.log('🔧 Инициализация ExamplePlugin...');

    try {
      // Загружаем конфигурацию плагина
      this.config = await configManager.loadConfig('ai-tutor-service');

      console.log('✅ Конфигурация загружена:', {
        maxTokens: this.config.maxTokens,
        temperature: this.config.temperature
      });

      // Проверяем зависимости
      this.checkDependencies();

      // Подписываемся на изменения конфигурации
      this.subscribeToConfigChanges();

      console.log('✅ ExamplePlugin успешно инициализирован');
    } catch (error) {
      console.error('❌ Ошибка инициализации ExamplePlugin:', error);
      throw error;
    }
  }

  private checkDependencies(): void {
    const deps = configManager.resolveDependencies('ai-tutor-service');

    console.log(`🔗 Проверка зависимостей (${deps.length}):`);

    for (const dep of deps) {
      if (configManager.isPluginEnabled(dep)) {
        this.enabledPlugins.push(dep);
        console.log(`  ✅ ${dep}`);
      } else {
        console.warn(`  ⚠️  ${dep} отключен`);
      }
    }
  }

  private subscribeToConfigChanges(): void {
    // В реальном приложении здесь может быть подписка на события
    console.log('👂 Подписка на изменения конфигурации');
  }

  // Действие для получения ответа от AI
  @Action({ name: 'GET_AI_RESPONSE' })
  async getAIResponse(context: { message: string }): Promise<string> {
    try {
      console.log('🤖 Получение ответа от AI...');

      // Используем конфигурацию для настройки запроса
      const response = await this.queryAI({
        prompt: context.message,
        maxTokens: this.config.maxTokens,
        temperature: this.config.temperature
      });

      return response;
    } catch (error) {
      console.error('❌ Ошибка получения ответа AI:', error);
      return 'Извините, произошла ошибка при обработке запроса.';
    }
  }

  private async queryAI(params: {
    prompt: string;
    maxTokens: number;
    temperature: number;
  }): Promise<string> {
    // Симуляция запроса к AI
    console.log('📤 Запрос к AI:', {
      maxTokens: params.maxTokens,
      temperature: params.temperature
    });

    // В реальном приложении здесь был бы HTTP запрос
    return 'Это тестовый ответ от AI';
  }

  // Действие для валидации конфигурации
  @Action({ name: 'VALIDATE_CONFIG' })
  async validateConfig(): Promise<ValidationResult[]> {
    console.log('🔍 Валидация конфигурации...');

    const results = await configManager.validateAll();

    const valid = results.filter(r => r.valid).length;
    const invalid = results.filter(r => !r.valid).length;

    console.log(`📊 Результаты валидации: ${valid} валидных, ${invalid} с ошибками`);

    return results;
  }

  // Действие для получения статуса плагинов
  @Action({ name: 'GET_PLUGINS_STATUS' })
  async getPluginsStatus(): Promise<any> {
    const allPlugins = configManager.getAllPlugins();
    const enabledPlugins = configManager.getEnabledPlugins();

    return {
      total: allPlugins.length,
      enabled: enabledPlugins.length,
      disabled: allPlugins.length - enabledPlugins.length,
      loadable: configManager.getTopologicalOrder()
    };
  }

  // Действие для обновления конфигурации
  @Action({ name: 'REFRESH_CONFIG' })
  async refreshConfig(): Promise<void> {
    console.log('🔄 Обновление конфигурации...');

    await configManager.refresh();

    // Перезагружаем конфигурацию плагина
    this.config = await configManager.loadConfig('ai-tutor-service');

    console.log('✅ Конфигурация обновлена');
  }

  // Обработчик ошибок валидации
  @Handler({ pattern: 'validate' })
  async handleValidation(runtime: any): Promise<void> {
    const results = await this.validateConfig();

    const report = results.map(result => {
      const status = result.valid ? '✅' : '❌';
      let output = `${status} ${result.pluginName}`;

      if (result.errors && result.errors.length > 0) {
        output += `\n   Ошибки: ${result.errors.join(', ')}`;
      }

      if (result.warnings && result.warnings.length > 0) {
        output += `\n   Предупреждения: ${result.warnings.join(', ')}`;
      }

      return output;
    }).join('\n');

    console.log('\n' + report);
  }

  // Метод для безопасного получения конфигурации
  private async getSafeConfig(pluginName: string): Promise<any> {
    try {
      return await configManager.loadConfig(pluginName);
    } catch (error) {
      console.error(`❌ Не удалось загрузить конфигурацию ${pluginName}:`, error);
      return null;
    }
  }

  // Метод для проверки здоровья системы
  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    const details: any = {
      configLoaded: !!this.config,
      dependencies: this.enabledPlugins.length,
      settings: configManager.getSettings()
    };

    try {
      // Проверяем, что все зависимости загружены
      const validation = await configManager.validateAll();
      const hasErrors = validation.some(r => !r.valid);

      return {
        healthy: !hasErrors,
        details: {
          ...details,
          validationErrors: validation.filter(r => !r.valid).length
        }
      };
    } catch (error) {
      return {
        healthy: false,
        details: {
          ...details,
          error: error instanceof Error ? error.message : 'Неизвестная ошибка'
        }
      };
    }
  }

  async shutdown(): Promise<void> {
    console.log('📴 Выключение ExamplePlugin...');
    console.log('✅ ExamplePlugin выключен');
  }
}

// Экспортируем экземпляр плагина
export const examplePlugin = new ExamplePlugin();
