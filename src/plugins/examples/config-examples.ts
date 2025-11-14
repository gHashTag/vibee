/**
 * Примеры использования системы конфигурации Vibee
 */

import {
  configManager,
  createConfigManager,
  getSecret,
  validateRequiredSecrets,
  resolveEnvVars,
  maskSecrets
} from '../core';
import { generateConfigReport } from '../core/utils';

// ============================================
// 1. БАЗОВОЕ ИСПОЛЬЗОВАНИЕ
// ============================================

export async function basicUsageExample() {
  console.log('=== БАЗОВОЕ ИСПОЛЬЗОВАНИЕ ===\n');

  // Загружаем конфигурацию плагина
  const neuroPhotoConfig = await configManager.loadConfig('neuro-photo');
  console.log('Конфигурация neuro-photo:', neuroPhotoConfig);

  // Проверяем, включен ли плагин
  if (configManager.isPluginEnabled('neuro-photo')) {
    console.log('Плагин neuro-photo включен ✓');
  }

  // Получаем список всех плагинов
  const allPlugins = configManager.getAllPlugins();
  console.log(`Всего плагинов: ${allPlugins.length}`);
}

// ============================================
// 2. ВАЛИДАЦИЯ И ОБРАБОТКА ОШИБОК
// ============================================

export async function validationExample() {
  console.log('\n=== ВАЛИДАЦИЯ ===\n');

  // Валидируем все плагины
  const results = await configManager.validateAll();

  const validPlugins = results.filter(r => r.valid);
  const invalidPlugins = results.filter(r => !r.valid);

  console.log(`✓ Валидных плагинов: ${validPlugins.length}`);
  console.log(`✗ Плагинов с ошибками: ${invalidPlugins.length}`);

  // Показываем ошибки
  if (invalidPlugins.length > 0) {
    console.log('\nОшибки:');
    invalidPlugins.forEach(plugin => {
      console.log(`  ${plugin.pluginName}:`);
      plugin.errors?.forEach(error => {
        console.log(`    - ${error}`);
      });
    });
  }
}

// ============================================
// 3. РАБОТА С ЗАВИСИМОСТЯМИ
// ============================================

export async function dependenciesExample() {
  console.log('\n=== ЗАВИСИМОСТИ ===\n');

  // Получаем зависимости плагина
  const deps = configManager.resolveDependencies('face-training');
  console.log('Зависимости face-training:', deps);

  // Проверяем каждую зависимость
  for (const dep of deps) {
    const isEnabled = configManager.isPluginEnabled(dep);
    console.log(`  ${isEnabled ? '✓' : '✗'} ${dep}`);
  }

  // Получаем топологический порядок загрузки
  const loadOrder = configManager.getTopologicalOrder();
  console.log('\nПорядок загрузки плагинов:', loadOrder);
}

// ============================================
// 4. РАБОТА С СЕКРЕТАМИ
// ============================================

export async function secretsExample() {
  console.log('\n=== СЕКРЕТЫ ===\n');

  // Проверяем обязательные секреты
  const { valid, missing } = validateRequiredSecrets();

  if (!valid) {
    console.log('Отсутствующие обязательные секреты:', missing);
  } else {
    console.log('Все обязательные секреты установлены ✓');
  }

  // Получаем секрет
  try {
    const botToken = getSecret('TELEGRAM_BOT_TOKEN');
    console.log('Telegram Bot Token:', maskSecrets({ token: botToken }));
  } catch (error) {
    console.error('Ошибка получения секрета:', error);
  }

  // Проверяем все секреты
  console.log('\nВсе секреты:');
  Object.keys(process.env)
    .filter(key => key.includes('TOKEN') || key.includes('KEY'))
    .forEach(key => {
      const value = process.env[key];
      const masked = maskSecrets({ value });
      console.log(`  ${key}: ${masked.value}`);
    });
}

// ============================================
// 5. ПОДСТАНОВКА ПЕРЕМЕННЫХ ОКРУЖЕНИЯ
// ============================================

export async function envSubstitutionExample() {
  console.log('\n=== ПОДСТАНОВКА ПЕРЕМЕННЫХ ===\n');

  const configWithVars = {
    apiKey: '${TELEGRAM_BOT_TOKEN}',
    baseUrl: 'https://api.example.com/${API_VERSION}',
    timeout: 5000,
    nested: {
      token: '${OPENROUTER_API_KEY}',
      options: ['${NODE_ENV}', 'production']
    }
  };

  console.log('До подстановки:', configWithVars);

  const resolved = resolveEnvVars(configWithVars);

  console.log('После подстановки:', resolved);
}

// ============================================
// 6. СОЗДАНИЕ ОТЧЕТА
// ============================================

export async function reportExample() {
  console.log('\n=== ГЕНЕРАЦИЯ ОТЧЕТА ===\n');

  const report = await generateConfigReport(configManager);
  console.log(report);
}

// ============================================
// 7. МАСКИРОВАНИЕ ДАННЫХ
// ============================================

export function maskingExample() {
  console.log('\n=== МАСКИРОВАНИЕ ДАННЫХ ===\n');

  const sensitiveData = {
    telegram: {
      token: '1234567890:abcdefghijklmnopqrstuvwxyz',
      apiId: 12345
    },
    openai: {
      apiKey: 'sk-1234567890abcdef',
      organization: 'org-1234567890'
    },
    user: {
      name: 'John Doe',
      email: 'john@example.com'
    }
  };

  console.log('Исходные данные:', sensitiveData);
  console.log('\nЗамаскированные данные:', maskSecrets(sensitiveData));
}

// ============================================
// 8. ДИНАМИЧЕСКАЯ ЗАГРУЗКА ПЛАГИНОВ
// ============================================

export async function dynamicPluginLoading() {
  console.log('\n=== ДИНАМИЧЕСКАЯ ЗАГРУЗКА ===\n');

  const enabledPlugins = configManager.getEnabledPlugins();
  const loadOrder = configManager.getTopologicalOrder();

  console.log('Загружаем плагины в правильном порядке:');

  for (const pluginName of loadOrder) {
    const plugin = enabledPlugins.find(p => p.name === pluginName);

    if (!plugin) {
      continue;
    }

    try {
      console.log(`\n▶ Загрузка ${pluginName}...`);

      // Загружаем конфигурацию
      const config = await configManager.loadConfig(pluginName);

      // Здесь можно инициализировать плагин
      console.log(`  ✓ Конфигурация загружена`);
      console.log(`  - Путь: ${plugin.path}`);
      console.log(`  - Зависимости: ${plugin.dependencies.join(', ') || 'нет'}`);
    } catch (error) {
      console.error(`  ✗ Ошибка: ${error}`);
    }
  }
}

// ============================================
// 9. СОЗДАНИЕ НОВОГО МЕНЕДЖЕРА
// ============================================

export function newManagerExample() {
  console.log('\n=== НОВЫЙ МЕНЕДЖЕР ===\n');

  // Создаем новый экземпляр менеджера (для тестирования)
  const testManager = createConfigManager();

  console.log('Создан новый менеджер конфигурации');
  console.log('Информация о конфигурации:', testManager.getConfigInfo());

  // Можем работать с ним независимо
  const plugins = testManager.getEnabledPlugins();
  console.log(`Включено плагинов: ${plugins.length}`);
}

// ============================================
// 10. ПРОВЕРКА ЗДОРОВЬЯ СИСТЕМЫ
// ============================================

export async function healthCheckExample() {
  console.log('\n=== ПРОВЕРКА ЗДОРОВЬЯ ===\n');

  // Валидируем все плагины
  const validation = await configManager.validateAll();

  const healthy = validation.every(r => r.valid);
  const stats = {
    total: validation.length,
    valid: validation.filter(r => r.valid).length,
    invalid: validation.filter(r => !r.valid).length
  };

  console.log('Статус системы:', healthy ? '✅ Здорова' : '❌ Есть проблемы');
  console.log('Статистика:', stats);

  if (!healthy) {
    console.log('\nПлагины с ошибками:');
    validation
      .filter(r => !r.valid)
      .forEach(plugin => {
        console.log(`  ${plugin.pluginName}:`);
        plugin.errors?.forEach(error => {
          console.log(`    - ${error}`);
        });
      });
  }

  return { healthy, stats, details: validation };
}

// ============================================
// 11. ЭКСПОРТ И ИМПОРТ КОНФИГУРАЦИИ
// ============================================

export async function exportImportExample() {
  console.log('\n=== ЭКСПОРТ/ИМПОРТ ===\n');

  const { exportConfigToJSON, importConfigFromJSON } = await import('../core/utils');

  // Экспортируем конфигурацию
  const exportedConfig = exportConfigToJSON(configManager);
  console.log('Экспортированная конфигурация:');
  console.log(`  Плагинов: ${exportedConfig.plugins.length}`);
  console.log(`  Включено: ${exportedConfig.statistics.enabled}`);
  console.log(`  Отключено: ${exportedConfig.statistics.disabled}`);

  // Импортируем конфигурацию
  const importResult = importConfigFromJSON(exportedConfig);
  console.log('\nРезультат импорта:');
  console.log(`  Успешно: ${importResult.success}`);
  console.log(`  Импортировано: ${importResult.imported}`);

  if (importResult.errors.length > 0) {
    console.log('Ошибки импорта:', importResult.errors);
  }
}

// ============================================
// ГЛАВНАЯ ФУНКЦИЯ ДЛЯ ДЕМОНСТРАЦИИ
// ============================================

export async function runAllExamples() {
  console.log('╔════════════════════════════════════╗');
  console.log('║   ПРИМЕРЫ СИСТЕМЫ КОНФИГУРАЦИИ     ║');
  console.log('╚════════════════════════════════════╝\n');

  try {
    await basicUsageExample();
    await validationExample();
    await dependenciesExample();
    await secretsExample();
    await envSubstitutionExample();
    await reportExample();
    maskingExample();
    await dynamicPluginLoading();
    newManagerExample();
    await healthCheckExample();
    await exportImportExample();

    console.log('\n✅ Все примеры выполнены успешно!\n');
  } catch (error) {
    console.error('\n❌ Ошибка выполнения примеров:', error);
  }
}

// Если файл запущен напрямую
if (require.main === module) {
  runAllExamples();
}
